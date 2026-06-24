from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from jose import jwt
from ..supabase_client import supabase
from ..config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/app/customer", tags=["customers"])

def to_camel_case(data: dict) -> dict:
    """Convert snake_case keys to camelCase."""
    camel = {}
    for k, v in data.items():
        parts = k.split('_')
        new_key = parts[0] + ''.join(p.capitalize() for p in parts[1:])
        camel[new_key] = v
    return camel

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

class CustomerCreate(BaseModel):
    name: str
    urduName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    isActive: Optional[bool] = True

class CustomerUpdate(BaseModel):
    name: str
    urduName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    isActive: bool

class PaymentCreate(BaseModel):
    customerId: str
    amount: float
    description: Optional[str] = None

@router.get("/")
async def get_customers(request: Request, filter: Optional[str] = None, skipCount: int = 0, maxResultCount: int = 100):
    tenant = get_current_tenant(request)
    query = supabase.table("customers").select("*").eq("tenant_id", tenant)
    if filter:
        query = query.ilike("name", f"%{filter}%")
    data = query.range(skipCount, skipCount + maxResultCount - 1).execute()
    total = supabase.table("customers").select("id", count="exact").eq("tenant_id", tenant).execute()
    items = [to_camel_case(row) for row in data.data]
    return {"items": items, "totalCount": total.count}

@router.get("/stats")
async def get_stats(request: Request):
    tenant = get_current_tenant(request)
    customers = supabase.table("customers").select("outstanding_balance").eq("tenant_id", tenant).execute()
    total_outstanding = sum(c["outstanding_balance"] for c in customers.data) if customers.data else 0
    customers_with_due = len([c for c in customers.data if c["outstanding_balance"] > 0])
    avg = total_outstanding / len(customers.data) if customers.data else 0
    # also need paidToday – we'll calculate from ledger_entries (optional)
    return {
        "totalCustomers": len(customers.data),
        "totalOutstanding": total_outstanding,
        "customersWithDue": customers_with_due,
        "paidToday": 0,
        "averageOutstanding": avg
    }

@router.get("/{customer_id}")
async def get_customer(customer_id: str, request: Request):
    tenant = get_current_tenant(request)
    res = supabase.table("customers").select("*").eq("id", customer_id).eq("tenant_id", tenant).execute()
    if not res.data:
        raise HTTPException(404)
    return to_camel_case(res.data[0])

@router.post("/")
async def create_customer(customer: CustomerCreate, request: Request):
    tenant = get_current_tenant(request)
    cust_id = str(uuid.uuid4())
    new_cust = {
        "id": cust_id,
        "tenant_id": tenant,
        "name": customer.name,
        "urdu_name": customer.urduName,
        "phone": customer.phone,
        "address": customer.address,
        "notes": customer.notes,
        "is_active": customer.isActive,
        "outstanding_balance": 0,
        "lifetime_value": 0,
        "creation_time": datetime.utcnow().isoformat()
    }
    supabase.table("customers").insert(new_cust).execute()
    return to_camel_case(new_cust)

@router.put("/{customer_id}")
async def update_customer(customer_id: str, customer: CustomerUpdate, request: Request):
    tenant = get_current_tenant(request)
    update_data = {
        "name": customer.name,
        "urdu_name": customer.urduName,
        "phone": customer.phone,
        "address": customer.address,
        "notes": customer.notes,
        "is_active": customer.isActive
    }
    supabase.table("customers").update(update_data).eq("id", customer_id).eq("tenant_id", tenant).execute()
    return {"id": customer_id, **customer.dict()}

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, request: Request):
    tenant = get_current_tenant(request)
    supabase.table("customers").delete().eq("id", customer_id).eq("tenant_id", tenant).execute()
    return {"status": "deleted"}

@router.post("/add-payment")
async def add_payment(payment: PaymentCreate, request: Request):
    tenant = get_current_tenant(request)
    entry_id = str(uuid.uuid4())
    supabase.table("ledger_entries").insert({
        "id": entry_id,
        "tenant_id": tenant,
        "customer_id": payment.customerId,
        "amount": payment.amount,
        "type": "debit",
        "description": payment.description,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    # Update customer balance (decrease)
    supabase.rpc("update_customer_balance", {"cust_id": payment.customerId, "delta": -payment.amount}).execute()
    return {"status": "ok"}

@router.get("/customer-ledger/{customer_id}")
async def get_ledger(customer_id: str, request: Request, maxCount: int = 50):
    tenant = get_current_tenant(request)
    res = supabase.table("ledger_entries").select("*").eq("customer_id", customer_id).eq("tenant_id", tenant).order("created_at", desc=True).limit(maxCount).execute()
    return [to_camel_case(row) for row in res.data]