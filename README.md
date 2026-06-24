# AI Voice Khata

<div align="center">

**Voice-first bookkeeping infrastructure for Pakistan's informal retail economy.**  
Conversational accounting for millions of Kiryana stores — powered by AI, delivered through WhatsApp.

[![TypeScript](https://img.shields.io/badge/TypeScript-83%25-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg)](https://supabase.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business_API-25D366.svg)](https://developers.facebook.com/docs/whatsapp)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🚨 The Problem

Pakistan has **5 million+ Kiryana stores**, yet most still manage credit transactions through handwritten registers.

- ✍️ Typing slows shopkeepers down
- 📱 Existing apps are too complex and require installation
- 📚 Low digital literacy limits adoption
- 📊 Financial records remain invisible — no credit history, no loans

---

## 💡 The Solution

> **The digital ledger that lives inside WhatsApp.**

A shopkeeper sends a **voice note in Roman Urdu** — AI does the rest:

```
Shopkeeper says:
"Bilal ne 1200 ka chawal liya aur 500 jama karwaye."

AI Output:
  Customer : Bilal
  Debit    : Rs. 1,200
  Credit   : Rs. 500
  Balance  : Rs. 700  ✅ Ledger updated instantly
```

**No downloads. No training. No typing. Just conversation.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ **Voice Input** | Send a voice note in Roman Urdu/mixed language via WhatsApp |
| 🧠 **AI Transaction Parsing** | Extracts customer name, item, debit & credit automatically |
| 📒 **Instant Ledger Update** | Real-time bookkeeping — no manual entry |
| 📄 **PDF Invoices** | Auto-generated invoices via ReportLab |
| 💬 **WhatsApp Native** | Zero friction — works where shopkeepers already are |
| 🔐 **Auth & Security** | Secure user authentication and data isolation |
| 📊 **Dashboard** | Web-based ledger view for store owners |

---

## 🏗️ Architecture

```
Shopkeeper (WhatsApp)
        │
        ▼
Meta WhatsApp Business API
        │
        ▼
FastAPI Backend (voice_khata_backend/)
        │
   ┌────┴─────────────┐
   ▼                  ▼
Speech Engine       NLU Brain
OpenAI Whisper      Llama 3 / GPT-4o
(Roman Urdu,        Named Entity
local accents,      Recognition:
noise cancel)       Name, Item,
                    Action, Amount
        │
        ▼
   Supabase (Database + Auth)
        │
        ▼
   React Dashboard (Frontend)
        │
        ▼
   ReportLab → PDF Invoice
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Python, FastAPI, Uvicorn |
| **Speech Recognition** | OpenAI Whisper (fine-tuned for Roman Urdu + local accents) |
| **NLU / AI** | Llama 3 / GPT-4o — Named Entity Recognition |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Messaging** | Meta WhatsApp Business API |
| **PDF Generation** | ReportLab |
| **Deployment** | Cloudflare Workers (frontend), FastAPI backend |
| **Testing** | Playwright, Vitest |

---

## 📁 Project Structure

```
AI_voice_khata/
├── voice_khata_backend/        # Python FastAPI backend
│   ├── main.py                 # API endpoints
│   ├── speech/                 # Whisper speech-to-text pipeline
│   ├── nlu/                    # NER extraction (Name, Item, Amount)
│   ├── whatsapp/               # WhatsApp webhook handler
│   └── pdf/                    # Invoice generation
├── src/                        # React TypeScript frontend
│   ├── components/             # UI components
│   ├── pages/                  # Dashboard pages
│   └── hooks/                  # Custom React hooks
├── supabase/                   # Supabase migrations & config
├── mem/auth/                   # Authentication logic
├── public/                     # Static assets
├── .env                        # Environment variables (gitignored)
├── wrangler.jsonc              # Cloudflare Workers config
└── vite.config.ts              # Vite configuration
```

---

## ⚙️ Setup

### Prerequisites

- Node.js 18+ / Bun
- Python 3.10+
- A [Supabase](https://supabase.com) account (free tier works)
- [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp) access
- OpenAI API key (for Whisper + GPT-4o)

---

### 1. Clone

```bash
git clone https://github.com/tashfeen786/AI_voice_khata.git
cd AI_voice_khata
```

---

### 2. Backend Setup

```bash
cd voice_khata_backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Create `voice_khata_backend/.env`:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

---

### 3. Frontend Setup

```bash
# Using bun (recommended)
bun install
bun run dev

# Or using npm
npm install
npm run dev

# App running at http://localhost:5173
```

Create `.env` in root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

---

### 4. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Run migrations
supabase db push
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhook/whatsapp` | Receive WhatsApp messages |
| `POST` | `/api/transcribe` | Transcribe voice note (Whisper) |
| `POST` | `/api/parse` | Extract transaction from text (NLU) |
| `GET` | `/api/ledger/{customer_id}` | Get customer ledger |
| `POST` | `/api/invoice/{transaction_id}` | Generate PDF invoice |

---

## 🎯 Market Opportunity

| Metric | Value |
|---|---|
| Kiryana stores in Pakistan | 5 million+ |
| WhatsApp users nationwide | 190 million+ |
| Undocumented credit transactions | Billions annually |
| Target: financial infrastructure for the informal economy | 🚀 |

---

## 💼 Business Model

- **Monthly SaaS subscriptions** — per store pricing
- **Enterprise API integrations** — for FMCG distributors
- **Transaction intelligence** — aggregated data insights for suppliers
- **Embedded finance revenue share** — micro-loan underwriting enablement

---

## 🛡️ Technology & Defensibility

- 🎙️ Roman Urdu voice recognition (fine-tuned Whisper)
- 🔀 Mixed-language understanding (Urdu + English code-switching)
- 💰 Financial transaction parsing (specialized NER)
- 📊 Proprietary retail speech dataset
- 🔄 Continuous AI learning loop

---

## 🗺️ Roadmap

- [x] AI parsing pipeline
- [x] WhatsApp workflow design
- [x] React dashboard
- [x] Supabase integration
- [ ] Pilot deployment in urban retail markets
- [ ] FMCG distributor partnerships
- [ ] Multi-language support (Punjabi, Pashto)
- [ ] SME credit scoring engine
- [ ] Embedded finance rollout
- [ ] Expansion: Bangladesh & beyond

---

## 🚀 Deployment

**Backend** — [Railway](https://railway.app) or [Render](https://render.com)
- Set environment variables in dashboard
- WhatsApp webhook must be HTTPS — use the deployed URL

**Frontend** — [Cloudflare Workers](https://workers.cloudflare.com) (configured via `wrangler.jsonc`)
```bash
bun run deploy
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👥 Team

**Founders**
- **Tashfeen Aziz** — [@tashfeen786](https://github.com/tashfeen786)
- **Muhammad Abdullah**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Voice-Khata is not just bookkeeping software.**  
**It is financial infrastructure for the informal economy.**

🎙️ Built with OpenAI Whisper · FastAPI · React · Supabase · WhatsApp Business API

</div>
