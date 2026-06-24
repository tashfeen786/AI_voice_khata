import httpx
from .config import WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID

async def download_media(media_id: str) -> str:
    url = f"https://graph.facebook.com/v18.0/{media_id}"
    headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        media_url = data.get("url")
        if not media_url:
            raise Exception("No media URL")
        # Download file
        file_resp = await client.get(media_url, headers=headers)
        file_path = f"/tmp/{media_id}.ogg"  # WhatsApp audio often .ogg
        with open(file_path, "wb") as f:
            f.write(file_resp.content)
    return file_path

async def send_whatsapp_message(to: str, text: str):
    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload, headers=headers)