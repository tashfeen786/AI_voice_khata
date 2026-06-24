import os
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # This is your service_role key

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Check tenants table
print("=== TENANTS ===")
tenants = supabase.table("tenants").select("*").execute()
for t in tenants.data:
    print(f"ID: {t['id']}, Name: {t['name']}, Active: {t['is_active']}")

# 2. Check users table (public.users)
print("\n=== USERS (public) ===")
users = supabase.table("users").select("*").execute()
for u in users.data:
    print(f"ID: {u['id']}, Email: {u['email']}, Full Name: {u['full_name']}, Tenant ID: {u.get('tenant_id')}")

# 3. Check Supabase Auth users (requires admin API)
print("\n=== SUPABASE AUTH USERS ===")
try:
    # Using the admin API to list users
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=headers
    )
    if response.status_code == 200:
        auth_users = response.json()
        for u in auth_users:
            print(f"User ID: {u['id']}, Email: {u['email']}, Confirmed: {u['email_confirmed_at'] is not None}")
    else:
        print(f"Failed to fetch auth users: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 4. Try to sign in with the credentials you used
print("\n=== TEST LOGIN WITH CREDENTIALS ===")
email = "tashfeen247@gmail.com"
password = "Test123456"
try:
    auth_response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    print(f"✅ Login successful! User ID: {auth_response.user.id}")
except Exception as e:
    print(f"❌ Login failed: {e}")
    if hasattr(e, 'message'):
        print(f"Message: {e.message}")