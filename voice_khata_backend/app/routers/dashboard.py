from fastapi import APIRouter, Request, HTTPException
from jose import jwt
from datetime import datetime, timedelta
from ..config import SECRET_KEY, ALGORITHM
from ..supabase_client import supabase

router = APIRouter(prefix="/api/app/dashboard", tags=["dashboard"])

def get_current_tenant(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant = payload.get("tenant")
        if not tenant:
            raise HTTPException(403, "Tenant missing in token")
        return tenant
    except:
        raise HTTPException(401, "Invalid token")

# Helper to safely get column or return 0
def safe_sum(data, key):
    try:
        return sum(item.get(key, 0) for item in data) if data else 0
    except:
        return 0

@router.get("/kpis")
async def get_kpis(request: Request):
    try:
        tenant = get_current_tenant(request)
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Today's total debits (credit type = udhaar given)
        today_debits = supabase.table("ledger_entries") \
            .select("amount") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", today_start.isoformat()) \
            .execute()
        today_sales = safe_sum(today_debits.data, "amount")

        today_orders = len(today_debits.data) if today_debits.data else 0

        # Pending udhaar from customers – use outstanding_balance
        customers = supabase.table("customers") \
            .select("outstanding_balance") \
            .eq("tenant_id", tenant) \
            .execute()
        pending_udhaar = safe_sum(customers.data, "outstanding_balance")
        pending_customers = len([c for c in customers.data if c.get("outstanding_balance", 0) > 0]) if customers.data else 0

        # New customers today – try created_at; fallback to creation_time
        try:
            new_customers_today = supabase.table("customers") \
                .select("id", count="exact") \
                .eq("tenant_id", tenant) \
                .gte("creation_time", today_start.isoformat()) \
                .execute()
            new_customers = new_customers_today.count if new_customers_today.count else 0
        except:
            new_customers = 0

        # Yesterday sales for change percentage
        yesterday_start = today_start - timedelta(days=1)
        yesterday_debits = supabase.table("ledger_entries") \
            .select("amount") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", yesterday_start.isoformat()) \
            .lt("created_at", today_start.isoformat()) \
            .execute()
        yesterday_sales = safe_sum(yesterday_debits.data, "amount")
        today_sales_change = ((today_sales - yesterday_sales) / yesterday_sales * 100) if yesterday_sales > 0 else 0

        return {
            "todaySales": round(today_sales, 2),
            "todayProfit": round(today_sales * 0.2, 2),
            "todayOrders": today_orders,
            "pendingUdhaar": round(pending_udhaar, 2),
            "todaySalesChangePct": round(today_sales_change, 1),
            "todayProfitChangePct": round(today_sales_change, 1),
            "newCustomersToday": new_customers,
            "pendingUdhaarCustomerCount": pending_customers
        }
    except Exception as e:
        print("KPIs error:", e)
        # Return zeros so page doesn't break
        return {
            "todaySales": 0,
            "todayProfit": 0,
            "todayOrders": 0,
            "pendingUdhaar": 0,
            "todaySalesChangePct": 0,
            "todayProfitChangePct": 0,
            "newCustomersToday": 0,
            "pendingUdhaarCustomerCount": 0
        }

@router.get("/today-sales-trend")
async def today_sales_trend(request: Request):
    try:
        tenant = get_current_tenant(request)
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        entries = supabase.table("ledger_entries") \
            .select("amount, created_at") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", today_start.isoformat()) \
            .execute()
        hourly = {}
        for e in entries.data:
            hour = e["created_at"][11:13] + "00"
            h = int(hour[:2])
            if h == 0:
                hour_label = "12AM"
            elif h < 12:
                hour_label = f"{h}AM"
            elif h == 12:
                hour_label = "12PM"
            else:
                hour_label = f"{h-12}PM"
            hourly[hour_label] = hourly.get(hour_label, 0) + e["amount"]
        hours = [f"{h}AM" if h<12 else f"{h}PM" for h in range(8, 21)]
        result = [{"hour": h, "value": round(hourly.get(h, 0), 2)} for h in hours]
        return result
    except Exception as e:
        print("Today sales trend error:", e)
        return []

@router.get("/weekly-sales")
async def weekly_sales(request: Request):
    try:
        tenant = get_current_tenant(request)
        now = datetime.utcnow()
        daily_sales = {}
        for i in range(7):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_name = day.strftime("%a")
            entries = supabase.table("ledger_entries") \
                .select("amount") \
                .eq("tenant_id", tenant) \
                .eq("type", "credit") \
                .gte("created_at", day_start.isoformat()) \
                .lt("created_at", day_end.isoformat()) \
                .execute()
            total = safe_sum(entries.data, "amount")
            daily_sales[day_name] = total
        order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        result = [{"day": d, "value": round(daily_sales.get(d, 0), 2)} for d in order]
        return result
    except Exception as e:
        print("Weekly sales error:", e)
        return []

@router.get("/low-stock-alerts")
async def low_stock_alerts(request: Request):
    # Since we don't have low_stock_threshold, return empty list
    return []

@router.get("/top-debtors")
async def top_debtors(request: Request):
    try:
        tenant = get_current_tenant(request)
        # Remove last_payment_date column – use outstanding_balance only
        customers = supabase.table("customers") \
            .select("id, name, phone, outstanding_balance") \
            .eq("tenant_id", tenant) \
            .gt("outstanding_balance", 0) \
            .order("outstanding_balance", desc=True) \
            .limit(5) \
            .execute()
        result = []
        for c in customers.data:
            result.append({
                "id": c["id"],
                "name": c["name"],
                "phone": c.get("phone", ""),
                "due": round(c["outstanding_balance"], 2),
                "lastPaid": None
            })
        return result
    except Exception as e:
        print("Top debtors error:", e)
        return []

@router.get("/recent-sales")
async def recent_sales(request: Request):
    try:
        tenant = get_current_tenant(request)
        # Try sales table first
        sales = supabase.table("sales") \
            .select("*") \
            .eq("tenant_id", tenant) \
            .order("sale_date", desc=True) \
            .limit(5) \
            .execute()
        if sales.data:
            result = []
            for s in sales.data:
                result.append({
                    "id": s["id"],
                    "invoiceNumber": s.get("invoice_number", "N/A"),
                    "customerName": s.get("customer_name") or "Walk-in",
                    "itemCount": 0,
                    "total": round(s.get("total_amount", 0), 2),
                    "paymentType": s.get("payment_type", "cash"),
                    "saleTime": s.get("sale_date", "")
                })
            return result
        else:
            # Fallback: use ledger entries
            entries = supabase.table("ledger_entries") \
                .select("id, customer_id, amount, type, created_at") \
                .eq("tenant_id", tenant) \
                .eq("type", "credit") \
                .order("created_at", desc=True) \
                .limit(5) \
                .execute()
            result = []
            for e in entries.data:
                cust = supabase.table("customers").select("name").eq("id", e["customer_id"]).execute()
                cust_name = cust.data[0]["name"] if cust.data else "Unknown"
                result.append({
                    "id": e["id"],
                    "invoiceNumber": f"LED-{e['id'][:8]}",
                    "customerName": cust_name,
                    "itemCount": 1,
                    "total": round(e["amount"], 2),
                    "paymentType": "udhaar",
                    "saleTime": e["created_at"]
                })
            return result
    except Exception as e:
        print("Recent sales error:", e)
        return []