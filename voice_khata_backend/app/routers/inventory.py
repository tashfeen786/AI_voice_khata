from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from jose import jwt
from ..supabase_client import supabase
from ..config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/app/inventory", tags=["inventory"])

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

@router.get("/products")
async def get_products(request: Request, skipCount: int = 0, maxResultCount: int = 100, filter: Optional[str] = None):
    tenant = get_current_tenant(request)
    query = supabase.table("products").select("*").eq("tenant_id", tenant)
    if filter:
        query = query.ilike("name", f"%{filter}%")
    data = query.range(skipCount, skipCount + maxResultCount - 1).execute()
    total = supabase.table("products").select("id", count="exact").eq("tenant_id", tenant).execute()
    items = []
    for p in data.data:
        stock_status = "InStock"
        if p["stock"] == 0:
            stock_status = "OutOfStock"
        elif p["stock"] <= p.get("low_stock_threshold", 5):
            stock_status = "LowStock"
        items.append({
            "id": p["id"],
            "name": p["name"],
            "urduName": p.get("urdu_name"),
            "sku": p["sku"],
            "price": float(p["price"]),
            "stock": p["stock"],
            "stockStatus": stock_status,
            "categoryId": p.get("category_id"),
            "categoryName": p.get("category_name"),
            "stockValue": float(p["price"]) * p["stock"],
            "isActive": p["is_active"]
        })
    return {"items": items, "totalCount": total.count if total.count else 0}

@router.get("/stats")
async def get_stats(request: Request):
    tenant = get_current_tenant(request)
    products = supabase.table("products").select("*").eq("tenant_id", tenant).execute()
    total_skus = len(products.data)
    stock_value = sum(p["price"] * p["stock"] for p in products.data)
    low_stock_count = sum(1 for p in products.data if 0 < p["stock"] <= p.get("low_stock_threshold", 5))
    out_of_stock_count = sum(1 for p in products.data if p["stock"] == 0)
    categories = supabase.table("products").select("category_name").eq("tenant_id", tenant).execute()
    total_categories = len({c["category_name"] for c in categories.data if c["category_name"]})
    return {
        "totalSkus": total_skus,
        "stockValue": round(stock_value, 2),
        "lowStockCount": low_stock_count,
        "outOfStockCount": out_of_stock_count,
        "totalCategories": total_categories
    }

@router.get("/categories")
async def get_categories(request: Request):
    tenant = get_current_tenant(request)
    res = supabase.table("products") \
        .select("category_id, category_name") \
        .eq("tenant_id", tenant) \
        .not_.is_("category_name", "null") \
        .execute()
    seen = {}
    for r in res.data:
        cat_id = r.get("category_id")
        cat_name = r.get("category_name")
        if cat_name and cat_name not in seen:
            seen[cat_name] = {"id": cat_id or cat_name, "name": cat_name, "urduName": None}
    return list(seen.values())

# You may add create, update, delete endpoints similarly