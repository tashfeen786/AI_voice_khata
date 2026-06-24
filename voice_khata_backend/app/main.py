from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from datetime import datetime, timedelta, timezone
import uuid
import os
from .config import VERIFY_TOKEN, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from .whatsapp_utils import download_media, send_whatsapp_message
from .transcription import transcriber
from .extractor import extract_ledger_info
from .supabase_client import supabase

app = FastAPI(title="Voice Khata Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==================== AUTHENTICATION ====================

@app.post("/connect/token")
async def token_endpoint(request: Request):
    body = await request.form()
    grant_type = body.get("grant_type")
    username   = body.get("username")
    password   = body.get("password")
    tenant_header = request.headers.get("__tenant", "").strip() or None
    print(f"🔐 Login: user={username}, tenant_header={tenant_header}")

    if grant_type != "password":
        raise HTTPException(400, "Unsupported grant type")

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": username,
            "password": password
        })
    except Exception as e:
        print(f"❌ Supabase auth error: {e}")
        raise HTTPException(400, detail={"error": "invalid_grant", "error_description": "Invalid username or password"})

    user_id = auth_response.user.id
    user_res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_res.data:
        print(f"❌ User not found in public.users: {user_id}")
        raise HTTPException(400, detail={"error": "invalid_grant", "error_description": "User not found in system"})

    user = user_res.data[0]
    role = user.get("role", "shopkeeper")
    user_tenant_id = user.get("tenant_id")
    is_host = role == "host" or user_tenant_id is None

    # Tenant validation
    if not is_host:
        if not tenant_header:
            raise HTTPException(400, detail={"error": "invalid_grant", "error_description": "Tenant name required"})
    else:
        if tenant_header:
            raise HTTPException(400, detail={"error": "invalid_grant", "error_description": "Host users must not select a tenant"})

    expire_seconds = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        data={
            "sub": user_id,
            "tenant": user_tenant_id,
            "role": role,
            "is_host": is_host,      # ✅ fixed: was missing before
        },
        expires_delta=timedelta(seconds=expire_seconds)
    )
    refresh_token = create_access_token(
        data={
            "sub": user_id,
            "tenant": user_tenant_id,
            "role": role,
            "is_host": is_host,
            "token_type": "refresh",
        },
        expires_delta=timedelta(days=30)
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expire_seconds,
        "token_type": "bearer",
    }


@app.get("/connect/userinfo")
async def userinfo_endpoint(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_res.data:
            raise HTTPException(401, "User not found")
        user = user_res.data[0]
        full_name = user.get("full_name") or ""
        parts = full_name.split(" ", 1)
        return {
            "sub": user["id"],
            "name": parts[0],
            "family_name": parts[1] if len(parts) > 1 else "",
            "preferred_username": user["email"],
            "email": user["email"],
            "phone_number": user.get("phone"),
            "tenantid": user.get("tenant_id"),
            "role": [user.get("role", "shopkeeper")],
        }
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")


@app.post("/connect/logout")
async def logout():
    return {"status": "ok"}


# ==================== SESSION ====================

@app.get("/api/app/session")
async def get_session(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_res.data:
            raise HTTPException(401, "User not found")
        user = user_res.data[0]
        tenant_id = user.get("tenant_id")
        full_name = user.get("full_name") or ""
        parts = full_name.split(" ", 1)

        if tenant_id is None:
            permissions = [
                "AbpIdentity.Users",
                "AbpTenantManagement.Tenants", "AbpTenantManagement.Tenants.View",
                "FeatureManagement.ManageHostFeatures",
                "Host.Tenants.Create", "Host.Tenants.View", "Host.Tenants.Edit", "Host.Tenants.Delete",
                "Host.Editions.View", "Host.Editions.Create", "Host.Editions.Edit", "Host.Editions.Delete",
                "Host.Users.View", "Host.Users.Create", "Host.Users.Edit", "Host.Users.Delete",
                "Host.Roles.View", "Host.Roles.Create", "Host.Roles.Edit", "Host.Roles.Delete",
                "Host.Dashboard", "Host.Settings.View", "Host.Settings.Edit",
                "Dashboard.View", "App.Settings.Edit",
            ]
        else:
            permissions = [
                "Dashboard.View", "App.Sales.Create",
                "App.Customers", "App.Customers.Create", "App.Customers.ManagePayments",
                "App.Reports", "App.Reports.Export",
                "App.Settings", "App.MultiUser",
                "App.Products", "App.Products.Create", "App.Products.Edit",
                "App.Products.Delete", "App.Products.ManageStock",
                "Inventory.Manage", "POS.Create", "Reports.View",
            ]

        return {
            "id": user["id"],
            "userName": user["email"],
            "email": user["email"],
            "name": parts[0],
            "surname": parts[1] if len(parts) > 1 else "",
            "phoneNumber": user.get("phone"),
            "tenantId": tenant_id,
            "isHost": tenant_id is None,
            "enabledFeatures": [],
            "permissions": permissions,
        }
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")


# ==================== WEBHOOK & HEALTH ====================

@app.get("/health")
def health():
    return {"status": "alive"}


@app.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    if params.get("hub.verify_token") == VERIFY_TOKEN:
        return int(params.get("hub.challenge", 0))
    raise HTTPException(403)


@app.post("/webhook")
async def webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    try:
        value = body["entry"][0]["changes"][0]["value"]
        if "messages" in value:
            for msg in value["messages"]:
                if msg["type"] == "audio":
                    background_tasks.add_task(
                        process_whatsapp_voice,
                        msg["audio"]["id"],
                        msg["from"]
                    )
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}


async def process_whatsapp_voice(media_id: str, from_number: str):
    """WhatsApp voice note → Supabase ledger entry (no SQLAlchemy)."""
    audio_path = None
    try:
        audio_path = await download_media(media_id)
        text = transcriber.transcribe(audio_path)
        extracted = extract_ledger_info(text)

        customer_name = (extracted.get("customer") or "Unknown").strip()
        debit  = float(extracted.get("debit",  0) or 0)
        credit = float(extracted.get("credit", 0) or 0)
        item   = extracted.get("item", "") or ""

        # WhatsApp messages have no tenant — use phone as tenant scope
        tenant_id = from_number

        # Find or create customer
        existing = (
            supabase.table("customers")
            .select("id, outstanding_balance")
            .eq("name", customer_name)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        if existing.data:
            customer_id = existing.data[0]["id"]
        else:
            customer_id = str(uuid.uuid4())
            supabase.table("customers").insert({
                "id": customer_id,
                "tenant_id": tenant_id,
                "name": customer_name,
                "phone": from_number,
                "outstanding_balance": 0,
                "creation_time": datetime.now(timezone.utc).isoformat(),
            }).execute()

        now = datetime.now(timezone.utc).isoformat()

        if debit > 0:
            supabase.table("ledger_entries").insert({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "customer_id": customer_id,
                "amount": debit,
                "type": "credit",
                "description": f"Udhaar: {item}",
                "created_at": now,
            }).execute()
            supabase.rpc("adjust_customer_balance", {
                "p_customer_id": customer_id, "p_delta": debit
            }).execute()

        if credit > 0:
            supabase.table("ledger_entries").insert({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "customer_id": customer_id,
                "amount": credit,
                "type": "debit",
                "description": "Payment received",
                "created_at": now,
            }).execute()
            supabase.rpc("adjust_customer_balance", {
                "p_customer_id": customer_id, "p_delta": -credit
            }).execute()

        final = (
            supabase.table("customers")
            .select("outstanding_balance")
            .eq("id", customer_id)
            .execute()
        )
        balance = final.data[0]["outstanding_balance"] if final.data else 0

        reply = (
            f"✓ Recorded\n"
            f"Customer: {customer_name}\n"
            f"Debit: Rs {debit}\n"
            f"Credit: Rs {credit}\n"
            f"Balance: Rs {balance}\n"
            f"Thank you!"
        )
        await send_whatsapp_message(from_number, reply)

    except Exception as e:
        print(f"❌ WhatsApp voice processing error: {e}")
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except OSError:
                pass


# ==================== ROUTERS ====================
from .routers import (
    tenants, editions, identity_users, identity_roles,
    dashboard, customers, host_settings, pos, reports,
    voice, inventory, auth
)

app.include_router(tenants.router,        prefix="/api/multi-tenancy")
app.include_router(tenants.router,        prefix="/api/abp/multi-tenancy")
app.include_router(host_settings.router)
app.include_router(editions.router)
app.include_router(identity_users.router)
app.include_router(identity_roles.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(pos.router)
app.include_router(reports.router)
app.include_router(voice.router)
app.include_router(inventory.router)
app.include_router(auth.router)