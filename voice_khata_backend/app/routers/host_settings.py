from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..supabase_client import supabase

router = APIRouter(prefix="/api/host/settings", tags=["host"])

class HostSettingsUpdate(BaseModel):
    defaultCurrency: str
    defaultTimeZone: str
    smtpServer: Optional[str] = None
    smtpPort: Optional[int] = None
    smtpUser: Optional[str] = None
    smtpPassword: Optional[str] = None

@router.get("/")
async def get_host_settings():
    res = supabase.table("host_settings").select("key, value").execute()
    data = {row["key"]: row["value"] for row in res.data}
    return {
        "defaultCurrency": data.get("defaultCurrency", "PKR"),
        "defaultTimeZone": data.get("defaultTimeZone", "Asia/Karachi"),
        "smtpServer": data.get("smtpServer"),
        "smtpPort": int(data["smtpPort"]) if data.get("smtpPort") else None,
        "smtpUser": data.get("smtpUser"),
        "smtpPassword": data.get("smtpPassword"),
    }

@router.put("/")
async def update_host_settings(settings: HostSettingsUpdate):
    updates = settings.dict(exclude_unset=True)
    for key, value in updates.items():
        # Convert camelCase to snake_case for db (or keep as is)
        db_key = key
        supabase.table("host_settings").update({"value": str(value)}).eq("key", db_key).execute()
    return {"status": "ok"}