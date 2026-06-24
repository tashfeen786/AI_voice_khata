from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
import hashlib
from ..supabase_client import supabase

router = APIRouter(prefix="/api/identity/users", tags=["identity users"])

class UserCreate(BaseModel):
    userName: str
    email: str
    password: str
    name: Optional[str] = None
    surname: Optional[str] = None
    phoneNumber: Optional[str] = None
    isActive: bool = True
    lockoutEnabled: bool = True
    roleNames: Optional[List[str]] = []

class UserUpdate(BaseModel):
    userName: str
    email: str
    name: Optional[str] = None
    surname: Optional[str] = None
    phoneNumber: Optional[str] = None
    isActive: bool
    lockoutEnabled: bool
    concurrencyStamp: Optional[str] = None
    password: Optional[str] = None
    roleNames: Optional[List[str]] = []

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.get("/")
async def get_users(skipCount: int = 0, maxResultCount: int = 10, sorting: str = "userName asc", filter: Optional[str] = None):
    query = supabase.table("host_users").select("*")
    if filter:
        query = query.or_(f"user_name.ilike.%{filter}%,email.ilike.%{filter}%")
    query = query.order(sorting.split()[0], desc=sorting.endswith("desc"))
    data = query.range(skipCount, skipCount + maxResultCount - 1).execute()
    total = supabase.table("host_users").select("id", count="exact").execute()
    return {"items": data.data, "totalCount": total.count}

@router.get("/{id}")
async def get_user(id: str):
    res = supabase.table("host_users").select("*").eq("id", id).execute()
    if not res.data:
        raise HTTPException(404)
    return res.data[0]

@router.post("/")
async def create_user(user: UserCreate):
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "user_name": user.userName,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "name": user.name,
        "surname": user.surname,
        "phone_number": user.phoneNumber,
        "is_active": user.isActive,
        "lockout_enabled": user.lockoutEnabled,
        "concurrency_stamp": str(uuid.uuid4()),
        "creation_time": datetime.utcnow().isoformat()
    }
    supabase.table("host_users").insert(new_user).execute()
    # Assign roles
    for role_name in user.roleNames:
        role_res = supabase.table("host_roles").select("id").eq("name", role_name).execute()
        if role_res.data:
            supabase.table("host_user_roles").insert({"user_id": user_id, "role_id": role_res.data[0]["id"]}).execute()
    return new_user

@router.put("/{id}")
async def update_user(id: str, user: UserUpdate):
    update_data = {
        "user_name": user.userName,
        "email": user.email,
        "name": user.name,
        "surname": user.surname,
        "phone_number": user.phoneNumber,
        "is_active": user.isActive,
        "lockout_enabled": user.lockoutEnabled,
        "concurrency_stamp": str(uuid.uuid4())
    }
    if user.password:
        update_data["password_hash"] = hash_password(user.password)
    supabase.table("host_users").update(update_data).eq("id", id).execute()
    # Update roles: delete all, then add new
    supabase.table("host_user_roles").delete().eq("user_id", id).execute()
    for role_name in user.roleNames or []:
        role_res = supabase.table("host_roles").select("id").eq("name", role_name).execute()
        if role_res.data:
            supabase.table("host_user_roles").insert({"user_id": id, "role_id": role_res.data[0]["id"]}).execute()
    return {"id": id, **update_data}

@router.delete("/{id}")
async def delete_user(id: str):
    supabase.table("host_user_roles").delete().eq("user_id", id).execute()
    supabase.table("host_users").delete().eq("id", id).execute()
    return {"status": "deleted"}

@router.get("/{id}/roles")
async def get_user_roles(id: str):
    # Return list of role objects
    res = supabase.table("host_user_roles").select("role_id").eq("user_id", id).execute()
    role_ids = [r["role_id"] for r in res.data]
    if not role_ids:
        return {"items": []}
    roles = supabase.table("host_roles").select("*").in_("id", role_ids).execute()
    return {"items": roles.data}