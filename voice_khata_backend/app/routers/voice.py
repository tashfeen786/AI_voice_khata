import os
import uuid
import shutil
import tempfile
import subprocess
import traceback
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from jose import jwt
from postgrest.exceptions import APIError  # ✅ already imported
from ..config import SECRET_KEY, ALGORITHM
from ..transcription import transcriber
from ..extractor import extract_ledger_info
from ..supabase_client import supabase

router = APIRouter(prefix="/api/voice", tags=["voice"])

FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")


def get_current_tenant(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
        tenant = payload.get("tenant")
        if not tenant:
            raise HTTPException(403, "No tenant in token — host cannot upload voice entries")
        return tenant
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token decode error: {e}")
        raise HTTPException(401, "Invalid token")


def convert_to_wav(input_path: str, wav_path: str) -> bool:
    cmd = [
        FFMPEG_PATH, "-y", "-i", input_path,
        "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        wav_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        return False
    except FileNotFoundError:
        print(f"❌ FFmpeg not found: '{FFMPEG_PATH}'. Set FFMPEG_PATH in .env")
        return False


def adjust_balance(customer_id: str, delta: float) -> None:
    """✅ Atomic balance update – handles 204 (no content) as success."""
    try:
        supabase.rpc("update_customer_balance", {
            "cust_id": customer_id,
            "delta": delta
        }).execute()
    except APIError as e:
        # Supabase RPC returns 204 when the function is void (no data)
        if hasattr(e, 'code') and e.code == 204:
            print(f"✅ Balance updated for {customer_id} by {delta}")
            return
        # Re-raise other API errors
        raise
    except Exception as e:
        print(f"❌ adjust_balance failed: {e}")
        raise


@router.post("/upload")
async def upload_voice(request: Request, file: UploadFile = File(...)):
    print(f"📁 Received file: {file.filename}, content-type: {file.content_type}")

    content = await file.read()
    print(f"📦 File size: {len(content)} bytes")
    if len(content) == 0:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Empty file uploaded"})

    await file.seek(0)
    tenant = get_current_tenant(request)

    suffix = os.path.splitext(file.filename or "audio.mp3")[1].lower() or ".mp3"
    temp_path = None
    wav_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        if suffix != ".wav":
            wav_path = temp_path.replace(suffix, ".wav")
            if not convert_to_wav(temp_path, wav_path):
                raise Exception(f"Audio conversion failed for format: {suffix}")
            os.unlink(temp_path)
            temp_path = wav_path
            wav_path = None
            print(f"🔄 Converted {suffix} → WAV")

        text = transcriber.transcribe(temp_path)
        print(f"📝 Transcription: {text}")
        if not text or not text.strip():
            return JSONResponse(status_code=422, content={"status": "error", "message": "Could not transcribe audio"})

        extracted = extract_ledger_info(text)
        print(f"🔍 Extracted: {extracted}")

        customer_name = (extracted.get("customer") or "Unknown").strip()
        debit = float(extracted.get("debit", 0) or 0)
        credit = float(extracted.get("credit", 0) or 0)
        item = extracted.get("item", "") or ""

        # Find or create customer
        existing = (
            supabase.table("customers")
            .select("id, outstanding_balance")
            .eq("name", customer_name)
            .eq("tenant_id", tenant)
            .execute()
        )
        if existing.data:
            customer_id = existing.data[0]["id"]
            print(f"👤 Found existing customer: {customer_name}")
        else:
            customer_id = str(uuid.uuid4())
            supabase.table("customers").insert({
                "id": customer_id,
                "tenant_id": tenant,
                "name": customer_name,
                "phone": None,
                "outstanding_balance": 0,
                "creation_time": datetime.now(timezone.utc).isoformat(),
            }).execute()
            print(f"➕ Created new customer: {customer_name}")

        now = datetime.now(timezone.utc).isoformat()

        if debit > 0:
            supabase.table("ledger_entries").insert({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant,
                "customer_id": customer_id,
                "amount": debit,
                "type": "credit",
                "description": f"Udhaar: {item}",
                "created_at": now,
            }).execute()
            adjust_balance(customer_id, debit)
            print(f"➕ Udhaar added: Rs {debit}")

        if credit > 0:
            supabase.table("ledger_entries").insert({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant,
                "customer_id": customer_id,
                "amount": credit,
                "type": "debit",
                "description": "Payment received",
                "created_at": now,
            }).execute()
            adjust_balance(customer_id, -credit)
            print(f"➖ Payment added: Rs {credit}")

        final = (
            supabase.table("customers")
            .select("outstanding_balance")
            .eq("id", customer_id)
            .execute()
        )
        balance = final.data[0]["outstanding_balance"] if final.data else 0

        return {
            "status": "success",
            "transcription": text,
            "customer": customer_name,
            "debit": debit,
            "credit": credit,
            "item": item,
            "balance": balance,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

    finally:
        for path in [temp_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except (PermissionError, OSError):
                    pass