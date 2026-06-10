# XenoCRM — AI-Native Marketing CRM
> Xeno Engineering Take-Home Assignment | BT23CSH053

## Architecture

```
React Frontend (port 3000)
        │  /api proxy
        ▼
CRM Backend (port 4000)     ← Express + PostgreSQL + OpenAI
        │
        ▼ POST /send
Channel Service (port 5000)  ← Stubbed delivery simulator
        │
        ▼ POST /receipts (callback)
CRM Backend
```

## Quick Start

### 1. Database Setup

```bash
# Create the database in PostgreSQL
createdb xeno_crm

# Or in psql:
# CREATE DATABASE xeno_crm;

# Run the schema + seed data
psql -U postgres -d xeno_crm -f database/schema.sql
```

### 2. CRM Backend

```bash
cd crm-backend
cp .env.example .env
# Edit .env: set DB_PASSWORD and OPENAI_API_KEY
npm run dev
```

Runs on: http://localhost:4000

### 3. Channel Service

```bash
cd channel-service
npm run dev
```

Runs on: http://localhost:5000

### 4. Frontend

```bash
cd frontend
npm run dev
```

Runs on: http://localhost:5173

---

## Environment Variables

### crm-backend/.env
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xeno_crm
DB_USER=postgres
DB_PASSWORD=<your_password>
PORT=4000
OPENAI_API_KEY=<your_openai_key>    # ← add before using AI features
CHANNEL_SERVICE_URL=http://localhost:5000
CRM_BACKEND_URL=http://localhost:4000
```

### channel-service/.env
```
PORT=5000
CRM_BACKEND_URL=http://localhost:4000
```

---

## API Reference

### Customers
```
POST   /customers              Add customer
GET    /customers              List customers (supports ?search=)
GET    /customers/:id          Customer + order history
PUT    /customers/:id          Update customer
DELETE /customers/:id          Delete customer
POST   /customers/import       CSV import (multipart)
```

### Orders
```
POST   /orders                 Add order
GET    /orders                 List orders (supports ?customer_id=)
```

### Segments
```
POST   /segments               Create segment
GET    /segments               List segments
POST   /segments/preview       Preview rules (no save)
GET    /segments/:id/preview   Preview saved segment audience
DELETE /segments/:id           Delete segment
```

### Campaigns
```
POST   /campaigns              Create campaign (DRAFT)
GET    /campaigns              List campaigns
GET    /campaigns/:id          Get campaign details
POST   /campaigns/:id/send     Send campaign to audience
```

### Analytics
```
GET    /analytics/summary      Overall dashboard stats
GET    /analytics/:campaignId  Campaign funnel metrics
```

### AI
```
POST   /ai/chat                Chat with AI agent (OpenAI Function Calling)
```

### Receipts (Channel Service Callbacks)
```
POST   /receipts               Receive delivery event (called by channel service)
```

---

## Segmentation Rules Format

```json
{
  "operator": "AND",
  "conditions": [
    { "field": "total_spend",   "op": ">",  "value": 5000 },
    { "field": "days_inactive", "op": ">",  "value": 30   },
    { "field": "city",          "op": "=",  "value": "Mumbai" },
    { "field": "order_count",   "op": ">=", "value": 2 }
  ]
}
```

**Supported fields:** `total_spend`, `days_inactive`, `order_count`, `city`, `days_since_signup`

---

## AI Tools (OpenAI Function Calling)

| Tool | Purpose |
|------|---------|
| `createSegment` | Build SQL from rules, save segment, return audience size |
| `generateCampaignMessage` | Generate personalized marketing copy |
| `createCampaign` | Store campaign in database |
| `sendCampaign` | Dispatch to channel service |
| `getAnalytics` | Fetch campaign performance |

---

## Channel Service Simulation

```
Per message dispatched:
  80% → DELIVERED  (after 1–3s)
  20% → FAILED     (after 1–3s)

Of DELIVERED:
  60% → OPENED    (after 2–5s)
  Of OPENED:
    20% → CLICKED (after 3–7s)
```

All events callback to `POST /receipts` on the CRM backend.
