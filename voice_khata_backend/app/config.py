import os
from dotenv import load_dotenv

load_dotenv()

# Database & Supabase
DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# External APIs
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN")

# Whisper Model
MODEL_PATH = os.getenv("MODEL_PATH", "./models/whisper_finetuned_urdu")

# JWT Authentication (real auth)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# For backward compatibility with existing code that uses SECRET_KEY
SECRET_KEY = JWT_SECRET_KEY