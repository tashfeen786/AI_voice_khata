from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from ..supabase_client import supabase

router = APIRouter(prefix="/api/app/edition", tags=["editions"])

class EditionCreate(BaseModel):
    name: str
    displayName: str
    monthlyPrice: Optional[float] = 0
    annualPrice: Optional[float] = 0
    description: Optional[str] = None
    isActive: Optional[bool] = True
    displayOrder: Optional[int] = 0

class EditionUpdate(BaseModel):
    displayName: str
    monthlyPrice: float
    annualPrice: float
    description: Optional[str] = None
    isActive: bool
    displayOrder: int
    concurrencyStamp: Optional[str] = None

@router.get("/list")
async def list_editions():
    res = supabase.table("editions").select("*").order("display_order").execute()
    return res.data

@router.get("/active-list")
async def active_editions():
    res = supabase.table("editions").select("*").eq("is_active", True).order("display_order").execute()
    return res.data

@router.get("/{id}")
async def get_edition(id: str):
    res = supabase.table("editions").select("*").eq("id", id).execute()
    if not res.data:
        raise HTTPException(404)
    return res.data[0]

@router.post("/")
async def create_edition(edition: EditionCreate):
    edition_id = str(uuid.uuid4())
    data = {
        "id": edition_id,
        "name": edition.name,
        "display_name": edition.displayName,
        "monthly_price": edition.monthlyPrice,
        "annual_price": edition.annualPrice,
        "description": edition.description,
        "is_active": edition.isActive,
        "display_order": edition.displayOrder,
        "concurrency_stamp": str(uuid.uuid4()),
        "creation_time": datetime.utcnow().isoformat()
    }
    supabase.table("editions").insert(data).execute()
    return data

@router.put("/{id}")
async def update_edition(id: str, edition: EditionUpdate):
    update_data = {
        "display_name": edition.displayName,
        "monthly_price": edition.monthlyPrice,
        "annual_price": edition.annualPrice,
        "description": edition.description,
        "is_active": edition.isActive,
        "display_order": edition.displayOrder,
        "concurrency_stamp": str(uuid.uuid4())
    }
    supabase.table("editions").update(update_data).eq("id", id).execute()
    return {"id": id, **update_data}

@router.delete("/{id}")
async def delete_edition(id: str):
    supabase.table("editions").delete().eq("id", id).execute()
    return {"status": "deleted"}