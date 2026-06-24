from fastapi import APIRouter, Request, HTTPException
from jose import jwt
from datetime import datetime, timedelta
from ..config import SECRET_KEY, ALGORITHM
from ..supabase_client import supabase
import random

router = APIRouter(prefix="/api/app/reports", tags=["reports"])

def get_current_tenant(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("tenant")
    except:
        return None

@router.get("/kpis")
async def get_report_kpis(request: Request):
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(401, "Unauthorized")
    
    # Get current month's sales (debits) and collections (credits)
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total debits (udhaar given) in current month
    debit_res = supabase.table("ledger_entries") \
        .select("amount") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", start_of_month.isoformat()) \
        .execute()
    monthly_sales = sum(item["amount"] for item in debit_res.data) if debit_res.data else 0
    
    # Total credits (payments received) in current month
    credit_res = supabase.table("ledger_entries") \
        .select("amount") \
        .eq("tenant_id", tenant) \
        .eq("type", "debit") \
        .gte("created_at", start_of_month.isoformat()) \
        .execute()
    monthly_collections = sum(item["amount"] for item in credit_res.data) if credit_res.data else 0
    
    # Pending payments: sum of outstanding_balance from customers
    customers_res = supabase.table("customers") \
        .select("outstanding_balance") \
        .eq("tenant_id", tenant) \
        .execute()
    pending_payments = sum(c["outstanding_balance"] for c in customers_res.data) if customers_res.data else 0
    pending_customers = len([c for c in customers_res.data if c["outstanding_balance"] > 0]) if customers_res.data else 0
    
    # Average daily sales for last 30 days
    thirty_days_ago = now - timedelta(days=30)
    daily_sales_res = supabase.table("ledger_entries") \
        .select("amount, created_at") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", thirty_days_ago.isoformat()) \
        .execute()
    if daily_sales_res.data:
        # Group by date (simple approach: sum all and divide by 30)
        total_30d = sum(item["amount"] for item in daily_sales_res.data)
        avg_daily_sales = total_30d / 30
    else:
        avg_daily_sales = 0
    
    # Previous month for comparison
    if now.month == 1:
        prev_month_start = now.replace(year=now.year-1, month=12, day=1)
    else:
        prev_month_start = now.replace(month=now.month-1, day=1)
    prev_month_end = start_of_month - timedelta(seconds=1)
    
    prev_debit_res = supabase.table("ledger_entries") \
        .select("amount") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", prev_month_start.isoformat()) \
        .lt("created_at", start_of_month.isoformat()) \
        .execute()
    prev_month_sales = sum(item["amount"] for item in prev_debit_res.data) if prev_debit_res.data else 0
    
    monthly_sales_change = ((monthly_sales - prev_month_sales) / prev_month_sales * 100) if prev_month_sales > 0 else 0
    
    # Profit: approximate using a margin (e.g., 20% of sales) – or if you have cost price, use that
    monthly_profit = monthly_sales * 0.2
    prev_month_profit = prev_month_sales * 0.2
    monthly_profit_change = ((monthly_profit - prev_month_profit) / prev_month_profit * 100) if prev_month_profit > 0 else 0
    
    # Daily sales change (today vs yesterday)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    today_res = supabase.table("ledger_entries") \
        .select("amount") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", today_start.isoformat()) \
        .execute()
    today_sales = sum(item["amount"] for item in today_res.data) if today_res.data else 0
    yesterday_res = supabase.table("ledger_entries") \
        .select("amount") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", yesterday_start.isoformat()) \
        .lt("created_at", today_start.isoformat()) \
        .execute()
    yesterday_sales = sum(item["amount"] for item in yesterday_res.data) if yesterday_res.data else 0
    daily_sales_change = ((today_sales - yesterday_sales) / yesterday_sales * 100) if yesterday_sales > 0 else 0
    
    return {
        "monthlySales": round(monthly_sales, 2),
        "monthlyProfit": round(monthly_profit, 2),
        "pendingPayments": round(pending_payments, 2),
        "pendingCustomers": pending_customers,
        "averageDailySales": round(avg_daily_sales, 2),
        "monthlySalesChange": round(monthly_sales_change, 1),
        "monthlyProfitChange": round(monthly_profit_change, 1),
        "dailySalesChange": round(daily_sales_change, 1)
    }

@router.get("/monthly-sales")
async def monthly_sales(request: Request, months: int = 6):
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(401, "Unauthorized")
    
    data = []
    now = datetime.utcnow()
    for i in range(months):
        # Start of month (months ago)
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        month_name = month_start.strftime("%b")
        
        # Debits (sales) for that month
        debit_res = supabase.table("ledger_entries") \
            .select("amount") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", month_start.isoformat()) \
            .lt("created_at", month_end.isoformat()) \
            .execute()
        sales = sum(item["amount"] for item in debit_res.data) if debit_res.data else 0
        
        # Approximate profit (20% margin)
        profit = sales * 0.2
        
        data.append({"month": month_name, "sales": round(sales, 2), "profit": round(profit, 2)})
    
    return data

@router.get("/category-sales")
async def category_sales(request: Request):
    # For real category sales, you would need a `products` table with category.
    # Without that, we can return static categories or compute from ledger descriptions.
    # This is a placeholder – you can enhance later.
    return [
        {"name": "Beverages", "sales": 0, "percentage": 0, "color": "#6366f1"},
        {"name": "Snacks", "sales": 0, "percentage": 0, "color": "#f59e0b"},
        {"name": "Hygiene", "sales": 0, "percentage": 0, "color": "#10b981"}
    ]

@router.get("/pending-payments")
async def pending_payments(request: Request):
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(401, "Unauthorized")
    
    customers_res = supabase.table("customers") \
        .select("id, name, phone, outstanding_balance, last_payment_date") \
        .eq("tenant_id", tenant) \
        .gt("outstanding_balance", 0) \
        .execute()
    
    customers = customers_res.data if customers_res.data else []
    total_pending = sum(c["outstanding_balance"] for c in customers)
    
    # Format last_paid as string
    for c in customers:
        if c.get("last_payment_date"):
            c["lastPaid"] = c["last_payment_date"][:10]  # YYYY-MM-DD
        else:
            c["lastPaid"] = "-"
    
    return {
        "totalPending": round(total_pending, 2),
        "customerCount": len(customers),
        "customers": customers
    }

@router.get("/daily-sales-report")
async def daily_sales_report(request: Request):
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(401, "Unauthorized")
    
    # Get last 7 days of sales (debits)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_data = []
    for i in range(7):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_name = day_start.strftime("%a")
        
        debit_res = supabase.table("ledger_entries") \
            .select("amount") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", day_start.isoformat()) \
            .lt("created_at", day_end.isoformat()) \
            .execute()
        sales = sum(item["amount"] for item in debit_res.data) if debit_res.data else 0
        daily_data.append({"day": day_name, "sales": round(sales, 2)})
    
    # Reverse to show oldest first
    daily_data.reverse()
    
    # Total bills (number of ledger entries of type credit) for today
    today_debits_res = supabase.table("ledger_entries") \
        .select("id", count="exact") \
        .eq("tenant_id", tenant) \
        .eq("type", "credit") \
        .gte("created_at", today.isoformat()) \
        .execute()
    total_bills = today_debits_res.count if today_debits_res.count else 0
    
    # Average bill (average amount of debits today)
    if total_bills > 0:
        amounts_res = supabase.table("ledger_entries") \
            .select("amount") \
            .eq("tenant_id", tenant) \
            .eq("type", "credit") \
            .gte("created_at", today.isoformat()) \
            .execute()
        total_amount = sum(item["amount"] for item in amounts_res.data)
        avg_bill = total_amount / total_bills
    else:
        avg_bill = 0
    
    # Cash percentage (this requires payment_method field; for now assume all debits are udhaar? better to calculate from sales with payment type)
    # We'll approximate: if you have a `sales` table, you can get cash vs udhaar. Here, we'll return 0.
    cash_percentage = 0
    
    return {
        "totalBills": total_bills,
        "averageBill": round(avg_bill, 2),
        "cashPercentage": cash_percentage,
        "dailyData": daily_data
    }