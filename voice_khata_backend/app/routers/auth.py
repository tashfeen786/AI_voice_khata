from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import uuid
from datetime import datetime, timedelta
from jose import jwt
from ..supabase_client import supabase
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# ========== Models ==========
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    shop_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    tenant_id: str
    email: str
    name: str

# ========== Helper ==========
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ========== Endpoints ==========
@router.post("/register", response_model=TokenResponse)
async def register_user(user: UserRegister):
    # 1. Check if shop name exists
    existing_tenant = supabase.table("tenants").select("id").eq("name", user.shop_name).execute()
    if existing_tenant.data:
        raise HTTPException(status_code=400, detail="Shop name already taken")
    
    # 2. Create tenant
    tenant_id = str(uuid.uuid4())
    new_tenant = {
        "id": tenant_id,
        "name": user.shop_name,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("tenants").insert(new_tenant).execute()
    
    # 3. Create user using Admin API (bypass rate limits & email confirmation)
    try:
        # The supabase client must be initialized with the service_role key.
        # Your existing supabase_client already uses SUPABASE_KEY which is the service_role key.
        auth_response = supabase.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "email_confirm": True,   # auto-confirm, no email needed
            "user_metadata": {
                "full_name": user.full_name,
                "phone": user.phone,
                "tenant_id": tenant_id,
                "role": "shopkeeper"
            }
        })
        user_id = auth_response.user.id
    except Exception as e:
        # Rollback tenant
        supabase.table("tenants").delete().eq("id", tenant_id).execute()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")
    
    # 4. Insert into public.users table
    new_user = {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "tenant_id": tenant_id,
        "role": "shopkeeper",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("users").insert(new_user).execute()
    
    # 5. Create JWT token
    access_token = create_access_token(data={
        "sub": user_id,
        "tenant": tenant_id,
        "role": "shopkeeper"
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": user.email,
        "name": user.full_name
    }

@router.post("/login", response_model=TokenResponse)
async def login_user(request: Request):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = auth_response.user.id
    user_res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=401, detail="User not found")
    user = user_res.data[0]
    
    access_token = create_access_token(data={
        "sub": user_id,
        "tenant": user.get("tenant_id"),
        "role": user.get("role", "shopkeeper")
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "tenant_id": user.get("tenant_id"),
        "email": user["email"],
        "name": user["full_name"]
    }

@router.get("/me")
async def get_me(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_res.data:
            raise HTTPException(status_code=401, detail="User not found")
        user = user_res.data[0]
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user.get("phone"),
            "tenant_id": user.get("tenant_id"),
            "role": user.get("role")
        }
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")