from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from ..supabase_client import supabase

router = APIRouter(prefix="/tenants", tags=["tenants"])

# Map frontend sorting fields (camelCase) to database columns (snake_case)
SORT_MAP = {
    "name": "name",
    "creationTime": "creation_time",
    "editionId": "edition_id",
    "isActive": "is_active",
    "editionName": "edition_name"
}

def get_sort_column(sorting: str) -> str:
    if not sorting:
        return "creation_time"
    field = sorting.split()[0]
    return SORT_MAP.get(field, "creation_time")

def get_sort_direction(sorting: str) -> str:
    if not sorting:
        return "desc"
    parts = sorting.split()
    if len(parts) > 1 and parts[1].lower() == "desc":
        return "desc"
    return "asc"

class TenantCreate(BaseModel):
    name: str
    adminEmailAddress: str
    adminPassword: str
    editionId: Optional[str] = None
    activationState: Optional[int] = 0

class TenantUpdate(BaseModel):
    name: str
    concurrencyStamp: Optional[str] = None

@router.get("/")
async def get_tenants(
    skipCount: int = 0,
    maxResultCount: int = 10,
    sorting: str = "creationTime desc",
    Filter: Optional[str] = None
):
    # Build query
    query = supabase.table("tenants").select("*")
    if Filter:
        query = query.ilike("name", f"%{Filter}%")
    
    # Apply sorting using mapped column
    sort_col = get_sort_column(sorting)
    sort_dir = get_sort_direction(sorting)
    query = query.order(sort_col, desc=(sort_dir == "desc"))
    
    # Apply pagination
    data = query.range(skipCount, skipCount + maxResultCount - 1).execute()
    
    # Get total count
    total_query = supabase.table("tenants").select("id", count="exact")
    if Filter:
        total_query = total_query.ilike("name", f"%{Filter}%")
    total = total_query.execute()
    
    return {"items": data.data, "totalCount": total.count}

@router.get("/{id}")
async def get_tenant(id: str):
    res = supabase.table("tenants").select("*").eq("id", id).execute()
    if not res.data:
        raise HTTPException(404)
    return res.data[0]

@router.post("/")
async def create_tenant(tenant: TenantCreate):
    tenant_id = str(uuid.uuid4())
    new_tenant = {
        "id": tenant_id,
        "name": tenant.name,
        "edition_id": tenant.editionId,
        "is_active": tenant.activationState == 0,
        "concurrency_stamp": str(uuid.uuid4()),
        "creation_time": datetime.utcnow().isoformat()
    }
    supabase.table("tenants").insert(new_tenant).execute()
    return new_tenant

@router.put("/{id}")
async def update_tenant(id: str, tenant: TenantUpdate):
    supabase.table("tenants").update({
        "name": tenant.name,
        "concurrency_stamp": str(uuid.uuid4())
    }).eq("id", id).execute()
    return {"id": id, "name": tenant.name}

@router.delete("/{id}")
async def delete_tenant(id: str):
    supabase.table("tenants").delete().eq("id", id).execute()
    return {"status": "deleted"}