from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
from ..supabase_client import supabase

router = APIRouter(prefix="/api/identity/roles", tags=["identity roles"])

class RoleCreate(BaseModel):
    name: str
    isDefault: bool = False
    isPublic: bool = True

class RoleUpdate(BaseModel):
    name: str
    isDefault: bool
    isPublic: bool
    concurrencyStamp: Optional[str] = None

@router.get("/")
async def get_roles(skipCount: int = 0, maxResultCount: int = 10, sorting: str = "name asc", filter: Optional[str] = None):
    query = supabase.table("host_roles").select("*")
    if filter:
        query = query.ilike("name", f"%{filter}%")
    query = query.order(sorting.split()[0], desc=sorting.endswith("desc"))
    data = query.range(skipCount, skipCount + maxResultCount - 1).execute()
    total = supabase.table("host_roles").select("id", count="exact").execute()
    return {"items": data.data, "totalCount": total.count}

@router.get("/all")
async def get_all_roles():
    res = supabase.table("host_roles").select("*").execute()
    return {"items": res.data}

@router.get("/{id}")
async def get_role(id: str):
    res = supabase.table("host_roles").select("*").eq("id", id).execute()
    if not res.data:
        raise HTTPException(404)
    return res.data[0]

@router.post("/")
async def create_role(role: RoleCreate):
    role_id = str(uuid.uuid4())
    new_role = {
        "id": role_id,
        "name": role.name,
        "is_default": role.isDefault,
        "is_public": role.isPublic,
        "is_static": False,
        "concurrency_stamp": str(uuid.uuid4())
    }
    supabase.table("host_roles").insert(new_role).execute()
    return new_role

@router.put("/{id}")
async def update_role(id: str, role: RoleUpdate):
    update_data = {
        "name": role.name,
        "is_default": role.isDefault,
        "is_public": role.isPublic,
        "concurrency_stamp": str(uuid.uuid4())
    }
    supabase.table("host_roles").update(update_data).eq("id", id).execute()
    return {"id": id, **update_data}

@router.delete("/{id}")
async def delete_role(id: str):
    supabase.table("host_roles").delete().eq("id", id).execute()
    return {"status": "deleted"}