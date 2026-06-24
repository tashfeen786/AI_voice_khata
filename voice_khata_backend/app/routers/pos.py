from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from jose import jwt
from ..supabase_client import supabase
from ..config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/app/p-os", tags=["pos"])

def get_current_tenant(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("tenant")
    except:
        raise HTTPException(401, "Invalid token")

class CartItem(BaseModel):
    productId: str
    quantity: int
    unitPrice: float

class CreateSaleRequest(BaseModel):
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    paymentType: str  # "cash" or "udhaar"
    discountAmount: float = 0
    notes: Optional[str] = None
    items: List[CartItem]

@router.get("/categories")
async def get_categories(request: Request):
    tenant = get_current_tenant(request)
    # Fetch distinct categories from products table
    res = supabase.table("products") \
        .select("category_name") \
        .eq("tenant_id", tenant) \
        .not_.is_("category_name", "null") \
        .execute()
    seen = set()
    categories = []
    for row in res.data:
        name = row["category_name"]
        if name and name not in seen:
            seen.add(name)
            categories.append({"id": name, "name": name, "urduName": None})
    return categories

@router.get("/quick-customers")
async def get_quick_customers(request: Request, count: int = 10):
    tenant = get_current_tenant(request)
    res = supabase.table("customers") \
        .select("id, name, phone, outstanding_balance") \
        .eq("tenant_id", tenant) \
        .order("outstanding_balance", desc=True) \
        .limit(count) \
        .execute()
    return res.data

@router.post("/search-products")
async def search_products(request: Request, body: dict):
    tenant = get_current_tenant(request)
    query = body.get("query", "")
    search = supabase.table("products") \
        .select("*") \
        .eq("tenant_id", tenant) \
        .eq("is_active", True)
    if query:
        search = search.ilike("name", f"%{query}%")
    res = search.execute()
    items = []
    for p in res.data:
        items.append({
            "id": p["id"],
            "name": p["name"],
            "urduName": p.get("urdu_name"),
            "sku": p["sku"],
            "price": float(p["price"]),
            "stock": p["stock"],
            "category": p.get("category_name"),
            "isOutOfStock": p["stock"] == 0,
            "isLowStock": p["stock"] <= p.get("low_stock_threshold", 5)
        })
    return {"items": items, "totalCount": len(items)}

@router.get("/product-by-sku")
async def get_product_by_sku(request: Request, sku: str):
    tenant = get_current_tenant(request)
    res = supabase.table("products") \
        .select("*") \
        .eq("tenant_id", tenant) \
        .eq("sku", sku) \
        .execute()
    if not res.data:
        raise HTTPException(404, "Product not found")
    p = res.data[0]
    return {
        "id": p["id"],
        "name": p["name"],
        "urduName": p.get("urdu_name"),
        "sku": p["sku"],
        "price": float(p["price"]),
        "stock": p["stock"],
        "category": p.get("category_name"),
        "isOutOfStock": p["stock"] == 0,
        "isLowStock": p["stock"] <= p.get("low_stock_threshold", 5)
    }

@router.post("/sale")
async def create_sale(request: Request, sale_req: CreateSaleRequest):
    tenant = get_current_tenant(request)
    # Calculate totals
    sub_total = sum(item.unitPrice * item.quantity for item in sale_req.items)
    total = sub_total - sale_req.discountAmount
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    sale_id = str(uuid.uuid4())
    
    # Insert sale
    sale_data = {
        "id": sale_id,
        "tenant_id": tenant,
        "invoice_number": invoice_number,
        "customer_id": sale_req.customerId,
        "customer_name": sale_req.customerName,
        "payment_type": sale_req.paymentType,
        "sub_total": sub_total,
        "discount_amount": sale_req.discountAmount,
        "total_amount": total,
        "paid_amount": total if sale_req.paymentType == "cash" else 0,
        "balance_amount": 0 if sale_req.paymentType == "cash" else total,
        "status": "Completed",
        "notes": sale_req.notes,
        "sale_date": datetime.utcnow().isoformat()
    }
    supabase.table("sales").insert(sale_data).execute()
    
    # Insert sale items and update stock
    for item in sale_req.items:
        # Get product to get name
        prod_res = supabase.table("products").select("name").eq("id", item.productId).execute()
        product_name = prod_res.data[0]["name"] if prod_res.data else "Unknown"
        supabase.table("sale_items").insert({
            "id": str(uuid.uuid4()),
            "sale_id": sale_id,
            "product_id": item.productId,
            "product_name": product_name,
            "quantity": item.quantity,
            "unit_price": item.unitPrice,
            "total_price": item.unitPrice * item.quantity
        }).execute()
        # Decrease stock
        supabase.table("products") \
            .update({"stock": supabase.raw(f"stock - {item.quantity}")}) \
            .eq("id", item.productId) \
            .execute()
    
    # If udhaar, update customer's outstanding balance
    if sale_req.paymentType == "udhaar" and sale_req.customerId:
        cust = supabase.table("customers").select("outstanding_balance").eq("id", sale_req.customerId).execute()
        if cust.data:
            new_balance = cust.data[0]["outstanding_balance"] + total
            supabase.table("customers").update({"outstanding_balance": new_balance}).eq("id", sale_req.customerId).execute()
    
    # Prepare response
    items_response = []
    for item in sale_req.items:
        # Fetch product name again
        prod = supabase.table("products").select("name").eq("id", item.productId).execute()
        pname = prod.data[0]["name"] if prod.data else "Unknown"
        items_response.append({
            "productName": pname,
            "quantity": item.quantity,
            "unitPrice": item.unitPrice,
            "totalPrice": item.unitPrice * item.quantity
        })
    return {
        "saleId": sale_id,
        "invoiceNumber": invoice_number,
        "subTotal": sub_total,
        "discountAmount": sale_req.discountAmount,
        "totalAmount": total,
        "paymentType": sale_req.paymentType,
        "saleDate": datetime.utcnow().isoformat(),
        "items": items_response
    }

@router.get("/sales")
async def get_sales(request: Request, skipCount: int = 0, maxResultCount: int = 20):
    tenant = get_current_tenant(request)
    res = supabase.table("sales") \
        .select("*") \
        .eq("tenant_id", tenant) \
        .order("sale_date", desc=True) \
        .range(skipCount, skipCount + maxResultCount - 1) \
        .execute()
    total = supabase.table("sales") \
        .select("id", count="exact") \
        .eq("tenant_id", tenant) \
        .execute()
    items = []
    for s in res.data:
        items.append({
            "id": s["id"],
            "invoiceNumber": s["invoice_number"],
            "customerName": s.get("customer_name") or "Walk-in",
            "paymentType": s["payment_type"],
            "paymentTypeDisplay": "Udhaar" if s["payment_type"] == "udhaar" else "Cash",
            "totalAmount": float(s["total_amount"]),
            "status": s["status"],
            "statusDisplay": s["status"],
            "itemCount": 0,  # you could query sale_items
            "saleDate": s["sale_date"],
            "timeDisplay": datetime.fromisoformat(s["sale_date"]).strftime("%H:%M")
        })
    return {"items": items, "totalCount": total.count if total.count else 0}