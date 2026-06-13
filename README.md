# XenoCRM — AI-Native Marketing CRM

> **Xeno Engineering Take-Home Assignment** | BT23CSH053 — Inzamamkhan
>
> A production-deployed, full-stack marketing CRM powered by OpenAI GPT-4o function calling.

<div align="center">

🌐 **[Live Demo → crm-marketing-n61t.vercel.app](https://crm-marketing-n61t.vercel.app/dashboard)**

</div>

---

## 🚀 Features

- **Customer Management** — Add, edit, delete customers; bulk import via CSV
- **Smart Segmentation** — Build audience segments with AND/OR rules (spend, inactivity, city, order count)
- **Campaign Engine** — Create campaigns with Email/SMS/WhatsApp/RCS channels, send to segments, delete campaigns
- **Delivery Simulation** — Realistic async delivery lifecycle (DELIVERED → OPENED → CLICKED)
- **Analytics Dashboard** — Live delivery funnel: sent, delivered, opened, clicked, failed with rates
- **AI Marketing Assistant** — Chat with GPT-4o to create segments, generate messages, send campaigns, and view analytics — all via natural language

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite)                       │
│         https://crm-marketing-n61t.vercel.app            │
│   VITE_API_URL → crm-marketing-backend.onrender.com     │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│           CRM Backend (Express + Node.js)                │
│      https://crm-marketing-backend.onrender.com          │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  REST API   │  │  AI Agent    │  │ Local Delivery│  │
│  │  (7 routes) │  │  GPT-4o +    │  │  Simulation   │  │
│  │             │  │  7 Tools     │  │  (async)      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│              PostgreSQL on Supabase                      │
└──────────────────────────┬──────────────────────────────┘
                           │ best-effort dispatch
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Channel Service (Express)                      │
│          https://channel-service.onrender.com            │
│        (secondary simulation path)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```
customers ──< orders
customers ──< communications ──< receipts
campaigns ──< communications
segments  ──< campaigns
```

| Table | Purpose |
|---|---|
| `customers` | Shopper profiles (name, email, phone, city) |
| `orders` | Purchase history (customer_id, amount, date) |
| `segments` | Saved audience filter rules (JSONB) |
| `campaigns` | Marketing campaigns (name, channel, message, status) |
| `communications` | One row per customer per campaign (tracks delivery status) |
| `receipts` | Delivery events — DELIVERED / OPENED / CLICKED / FAILED |

---

## 🤖 AI Agent — OpenAI Function Calling

The AI agent uses **GPT-4o with 7 function-calling tools**. It maintains full conversational memory across turns (segment IDs, campaign IDs, tool results).

| Tool | What It Does |
|---|---|
| `listSegments` | Lists existing segments to avoid duplicates |
| `listCampaigns` | Lists campaigns to find IDs for analytics |
| `createSegment` | Creates or **updates** a segment (UPSERT by name) |
| `generateCampaignMessage` | Generates personalized marketing copy |
| `createCampaign` | Saves a campaign as DRAFT |
| `sendCampaign` | Sends campaign to audience (with confirmation) |
| `getAnalytics` | Fetches delivery funnel metrics |

**Example flow:**
> *"Create a win-back email campaign for customers who spent over ₹1000 but haven't ordered in 10 days"*
>
> The AI will: check existing segments → create/update segment → show audience size → generate email copy → wait for your confirmation → create campaign → send to audience → confirm delivery

---

## 📊 Delivery Simulation

Simulation runs directly in the CRM backend process (no cross-service dependency):

```
Per message:
  80% → DELIVERED  (after 1–3s)
  20% → FAILED     (after 1–3s)

Of DELIVERED:
  60% → OPENED    (after 2–5s)
  Of OPENED:
    20% → CLICKED (after 3–7s)
```

Analytics update live in the database as each event fires.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + React Router + Recharts + TailwindCSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase — Transaction Pooler) |
| AI | OpenAI GPT-4o (Function Calling) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or use the Supabase cloud DB)

### 1. Clone & Install

```bash
git clone https://github.com/Inzamamkhan786/CRM_Marketing.git
cd CRM_Marketing
```

### 2. Database Setup

```bash
# Using local PostgreSQL:
createdb xeno_crm
psql -U postgres -d xeno_crm -f database/schema.sql

# OR set DATABASE_URL to your Supabase connection string
```

### 3. CRM Backend

```bash
cd crm-backend
cp .env.example .env
# Fill in DATABASE_URL and OPENAI_API_KEY
npm install
npm run dev
# → http://localhost:4000
```

### 4. Channel Service

```bash
cd channel-service
npm install
npm run dev
# → http://localhost:5000
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔐 Environment Variables

### `crm-backend/.env`

```env
# Supabase Transaction Pooler (append ?pgbouncer=true for port 6543)
DATABASE_URL=postgresql://postgres.<project>:<password>@<host>:6543/postgres?pgbouncer=true

PORT=4000
OPENAI_API_KEY=sk-...
CHANNEL_SERVICE_URL=http://localhost:5000
CRM_BACKEND_URL=http://localhost:4000
```

### `channel-service/.env`

```env
PORT=5000
CRM_BACKEND_URL=http://localhost:4000
```

---

## 📡 REST API Reference

### Customers
```
GET    /customers              List (supports ?search= ?city=)
GET    /customers/:id          Customer + order history
POST   /customers              Create {name, email, phone?, city?}
PUT    /customers/:id          Update
DELETE /customers/:id          Delete
POST   /customers/import       Bulk CSV import
```

### Segments
```
GET    /segments               List all
POST   /segments               Create {name, rules}
GET    /segments/:id/preview   Show matching customers
POST   /segments/preview       Preview rules without saving
DELETE /segments/:id           Delete
```

### Campaigns
```
GET    /campaigns              List all
GET    /campaigns/:id          Get details
POST   /campaigns              Create {name, segment_id, channel, message}
POST   /campaigns/:id/send     Send to audience
DELETE /campaigns/:id          Delete + all analytics data
```

### Analytics
```
GET    /analytics/summary      Overall dashboard stats
GET    /analytics/:campaignId  Delivery funnel (sent/delivered/opened/clicked/failed)
```

### AI
```
POST   /ai/chat                {messages: [{role, content}]} → {reply, toolsUsed, messages}
```

---

## 🎯 Segmentation Rules Format

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "total_spend",    "op": ">",  "value": 5000     },
    { "field": "days_inactive",  "op": ">",  "value": 30       },
    { "field": "city",           "op": "=",  "value": "Mumbai" },
    { "field": "order_count",    "op": ">=", "value": 2        }
  ]
}
```

**Supported fields:** `total_spend` · `days_inactive` · `order_count` · `city` · `days_since_signup`

**Operators:** `>` · `<` · `>=` · `<=` · `=` · `!=`

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [crm-marketing-n61t.vercel.app](https://crm-marketing-n61t.vercel.app/dashboard) |
| CRM Backend | Render | crm-marketing-backend.onrender.com |
| Channel Service | Render | channel-service.onrender.com |
| Database | Supabase | PostgreSQL (Transaction Pooler) |

---

*Built for Xeno Engineering Take-Home Assignment — BT23CSH053*
