import json
from groq import Groq
from .config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def extract_ledger_info(text: str) -> dict:
    """
    Groq ke Llama model se Roman Urdu text se customer, debit/credit nikalta hai.
    """
    prompt = f"""
    Roman Urdu text: "{text}"
    Extract: customer name (only name), debit amount (if udhaar given), credit amount (if payment received), and item (optional).
    Output JSON: {{"customer": "name", "debit": number, "credit": number, "item": ""}}
    If no debit/credit, set 0. Ensure numbers are integers.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0,
            response_format={"type": "json_object"}
        )
        result = json.loads(chat_completion.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Groq Extraction Error: {e}")
        return {"customer": "", "debit": 0, "credit": 0, "item": ""}