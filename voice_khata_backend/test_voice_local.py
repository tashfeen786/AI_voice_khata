import asyncio
import sys
import uuid
from datetime import datetime
from app.transcription import transcriber
from app.extractor import extract_ledger_info
from app.supabase_client import supabase

async def test_voice_pipeline(audio_path: str, phone_number: str = "923001234567"):
    print(f"🎤 Processing audio: {audio_path}")
    
    # 1. Transcribe
    text = transcriber.transcribe(audio_path)
    print(f"📝 Transcription: {text}")
    
    # 2. Extract (mock for now)
    extracted = extract_ledger_info(text)
    print(f"🔍 Extracted: {extracted}")
    
    customer_name = extracted.get("customer", "Test Customer")
    
    # 3. Supabase: find or create customer
    existing = supabase.table("customers").select("*").eq("phone", phone_number).execute()
    if existing.data:
        customer = existing.data[0]
        print(f"👤 Existing customer: {customer['name']}")
    else:
        # Use correct column names: creation_time (not created_at)
        new_cust = {
            "id": str(uuid.uuid4()),
            "tenant_id": "default",
            "name": customer_name,
            "phone": phone_number,
            "outstanding_balance": 0,
            "creation_time": datetime.utcnow().isoformat()
        }
        supabase.table("customers").insert(new_cust).execute()
        customer = new_cust
        print(f"➕ Created new customer: {customer_name}")
    
    # 4. Add ledger entry if amount > 0
    if extracted.get("debit", 0) > 0:
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": "default",
            "customer_id": customer["id"],
            "amount": extracted["debit"],
            "type": "credit",
            "description": f"Udhaar: {extracted.get('item', '')}",
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("ledger_entries").insert(ledger_entry).execute()
        # Update customer balance
        new_balance = customer["outstanding_balance"] + extracted["debit"]
        supabase.table("customers").update({"outstanding_balance": new_balance}).eq("id", customer["id"]).execute()
        print(f"➕ Added udhaar: Rs {extracted['debit']}")
    
    if extracted.get("credit", 0) > 0:
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": "default",
            "customer_id": customer["id"],
            "amount": extracted["credit"],
            "type": "debit",
            "description": "Payment received",
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("ledger_entries").insert(ledger_entry).execute()
        new_balance = customer["outstanding_balance"] - extracted["credit"]
        supabase.table("customers").update({"outstanding_balance": new_balance}).eq("id", customer["id"]).execute()
        print(f"➖ Added payment: Rs {extracted['credit']}")
    
    # Get final balance
    final = supabase.table("customers").select("outstanding_balance").eq("id", customer["id"]).execute()
    balance = final.data[0]["outstanding_balance"] if final.data else 0
    print(f"💰 New balance for {customer_name}: Rs {balance}")
    print("✅ Voice pipeline completed.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_voice_local.py <audio_file_path>")
        sys.exit(1)
    audio_file = sys.argv[1]
    asyncio.run(test_voice_pipeline(audio_file))