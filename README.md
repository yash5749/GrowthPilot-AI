# GrowthPilot AI

**Autonomous shopper outreach copilot — AI-powered CRM for consumer brands**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

[![API CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/api-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/api-ci.yml)
[![Channel CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/channel-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/channel-ci.yml)
[![Web CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/web-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/web-ci.yml)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Design](#system-design)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Campaign Lifecycle](#campaign-lifecycle)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running All Services](#running-all-services)
- [AI Provider Configuration](#ai-provider-configuration)
- [API Overview](#api-overview)
- [CSV Import](#csv-import)
- [Analytics](#analytics)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

GrowthPilot AI is a focused marketing CRM for consumer brands. It lets businesses import customer and order data, build behavioral segments, generate personalized AI-powered messages, send campaigns through a simulated channel service, track every engagement event in real time, and surface campaign-level analytics.

The system is built as three independent, deployable services communicating over HTTP:

1. **growthpilot-api** — the core CRM backend (NestJS, Prisma, PostgreSQL)
2. **growthpilot-channel** — a separate channel delivery simulator that emits lifecycle callbacks
3. **growthpilot-web** — a dashboard frontend (Next.js, Tailwind CSS, shadcn/ui)

### Why three services?

The channel service is intentionally decoupled from the CRM to reflect how real-world communication infrastructure works. In production, you would replace the simulator with Twilio, SendGrid, or any provider API. The CRM never needs to know which provider is behind the curtain — it just sends payloads and receives callbacks.

---

## Architecture

```mermaid
flowchart TB
    subgraph Browser["Browser / Admin UI"]
        UI["Next.js Frontend<br/>growthpilot-web"]
    end

    subgraph CRM["CRM Backend<br/>growthpilot-api (NestJS)"]
        API["REST API<br/>/api/*"]
        AI["AI Module<br/>Mock | GitHub | Gemini"]
        PRISMA["Prisma ORM"]
        CHANNEL_CLIENT["Channel Client<br/>(HTTP)"]
    end

    subgraph DB["PostgreSQL"]
        PG[("growthpilot<br/>database")]
    end

    subgraph CHANNEL["Channel Service<br/>growthpilot-channel (NestJS)"]
        SIM["Simulator<br/>probabilistic lifecycle"]
        CB["Callback Engine<br/>async HTTP posting"]
    end

    UI -->|"Next.js App Router"| API
    API --> PRISMA
    PRISMA --> PG
    API --> AI
    API --> CHANNEL_CLIENT
    CHANNEL_CLIENT -->|"POST /channel/send"| SIM
    SIM -->|"setTimeout chain"| CB
    CB -->|"POST /api/callbacks/channel-event"| API
```

### Data flow

```mermaid
sequenceDiagram
    participant U as Admin
    participant CRM as growthpilot-api
    participant CS as growthpilot-channel
    participant DB as PostgreSQL

    U->>CRM: Upload customer/order CSV
    CRM->>DB: Store records
    U->>CRM: Create segment (manual or AI-suggested)
    U->>CRM: Create campaign
    U->>CRM: Approve campaign
    U->>CRM: Send campaign
    CRM->>DB: Create communication rows (one per customer)
    CRM->>CS: POST /channel/send (batched)
    CS->>CS: Simulate lifecycle with delays & probabilities
    CS->>CRM: POST /api/callbacks/channel-event (sent)
    CS->>CRM: POST /api/callbacks/channel-event (delivered)
    CS->>CRM: POST /api/callbacks/channel-event (opened)
    CS->>CRM: POST /api/callbacks/channel-event (clicked)
    CS->>CRM: POST /api/callbacks/channel-event (purchased)
    CRM->>DB: Update communication records + event log
    U->>CRM: View analytics dashboard
```

---

## System Design

### Service-oriented architecture

Each service is independently deployable, has its own repository-style directory, and communicates over HTTP. This separation means:

- The **channel service** can be developed, scaled, and deployed independently from the CRM.
- The **CRM** can be updated without touching delivery logic.
- Each service has its own environment variables and TypeScript configuration.

### Channel service decoupling

The channel service is the most architecturally significant decision. It is **not** a background job inside the CRM — it is a standalone NestJS application that:

1. Accepts communication payloads via `POST /channel/send`
2. Runs a probabilistic state machine per communication
3. Emits callbacks back to the CRM at `POST /api/callbacks/channel-event`
4. Retries failed callbacks up to 3 times with exponential backoff

This mirrors how real-world channel providers work. In production, you would swap the simulator for Twilio (WhatsApp), SendGrid (Email), or any provider. The CRM contract stays the same.

### Callback-driven communication tracking

Every event in a communication's lifecycle — sent, delivered, failed, opened, read, clicked, purchased — arrives as an asynchronous HTTP callback. The CRM:

- **Validates** the payload with class-validator DTOs
- **Checks idempotency** to prevent duplicate event processing
- **Updates** the communication's timestamp columns
- **Logs** every event in the `communication_events` table
- **Returns** `HTTP 201` on success, triggering the channel service's next simulation stage

This pattern makes the system resilient to network failures and guarantees at-most-once event processing.

### AI abstraction layer

AI is not allowed to free-run over the system. Every AI feature is:

1. **Bounded** — prompts are narrow and deterministic
2. **Validated** — structured JSON is required; malformed output is caught
3. **Reviewable** — the user always sees AI output before it is used

The AI provider is abstracted behind an interface:

```typescript
interface AiProvider {
  generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion>;
  generateMessage(input: MessagePrompt): Promise<MessageSuggestion>;
  recommendChannel(input: ChannelPrompt): Promise<ChannelRecommendation>;
  generateInsights(input: InsightPrompt): Promise<InsightSummary>;
}
```

Three implementations ship with the project:

| Provider | When to use | Requirements |
|---|---|---|
| `mock` | Local development, demos | None |
| `github` | Production with GitHub Models | `GITHUB_MODELS_API_KEY` |
| `gemini` | Production or fallback | `GEMINI_API_KEY` |

Switch between them by setting `AI_PROVIDER=mock|github|gemini`.

### Database design

Six models, kept intentionally small:

```mermaid
erDiagram
    Customer ||--o{ Order : places
    Customer ||--o{ Communication : receives
    Segment ||--o{ Campaign : targets
    Campaign ||--o{ Communication : generates
    Communication ||--o{ CommunicationEvent : logs

    Customer {
        uuid id PK
        string name
        string email UK
        string phone "nullable"
        string city "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Order {
        uuid id PK
        uuid customerId FK
        float orderTotal
        string currency
        datetime orderedAt
        string channel
        string status
    }

    Segment {
        uuid id PK
        string name
        string description "nullable"
        json ruleJson
        boolean aiGenerated
    }

    Campaign {
        uuid id PK
        string name
        string objective
        uuid segmentId FK
        string messageTemplate
        string channel
        string status "draft | approved | sent"
        datetime sentAt "nullable"
    }

    Communication {
        uuid id PK
        uuid campaignId FK
        uuid customerId FK
        string channel
        string messageRendered
        string status "pending | sent | delivered | failed | opened | read | clicked | purchased"
        datetime sentAt "nullable"
        datetime deliveredAt "nullable"
        datetime openedAt "nullable"
        datetime readAt "nullable"
        datetime clickedAt "nullable"
        datetime purchasedAt "nullable"
        string failureReason "nullable"
    }

    CommunicationEvent {
        uuid id PK
        uuid communicationId FK
        string eventType
        json payloadJson "nullable"
        datetime createdAt
    }
```

---

## Features

### Customer management
- Import customers via CSV upload
- Searchable, paginated customer table
- Per-customer metrics (order count, total spent, average order value)
- Customer detail with linked order history

### Order management
- Import orders via CSV upload (linked to customers by email)
- Paginated order listing
- Channel and status breakdown

### Segment builder
- Create segments with rule-based JSON conditions
- Preview segment audience (count + member list)
- **AI-powered segment suggestion** — describe a business goal and get a segment name, rule, and explanation
- Segments are stored as structured JSON, not raw SQL

### Campaign studio
- Create campaigns tied to a segment
- Pick a channel (WhatsApp, Email, SMS)
- **AI-powered message generation** — draft subject, body, CTA, and placeholders
- **AI-powered channel recommendation** based on audience and objective
- Approve workflow (draft → approved → sent)
- One-click send dispatches to the channel service

### Communications tracking
- Real-time status per recipient (pending → sent → delivered → opened → read → clicked → purchased)
- Full event timeline via communication_events table
- Failure reason capture
- Paginated communication listing by campaign

### Analytics dashboard
- Aggregate KPIs: delivery rate, open rate, read rate, click rate, conversion rate, revenue attributed
- Campaign-level analytics with funnel breakdown
- Audience-level performance metrics
- **AI-powered insights** — summary, key insight, and next-best-action recommendation

### Channel simulation
- Realistic probabilistic lifecycle simulation
- Per-channel probability configuration (WhatsApp, Email, SMS)
- Configurable timing delays between stages
- Automatic callback retry with configurable attempts
- Idempotent event ingestion at the CRM

### CSV import
- Upload CSV files via `POST /customers/import` and `POST /orders/import`
- Detailed import reports: total, inserted, skipped, failed with row-level error messages
- Orders are linked to customers by email match

---

## Tech Stack

### growthpilot-api (CRM Backend)

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Validation | class-validator, class-transformer |
| CSV parsing | csv-parse |
| AI providers | Mock, GitHub Models, Gemini |

### growthpilot-channel (Channel Service)

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Validation | class-validator, class-transformer |
| HTTP client | Native fetch (built-in) |

### growthpilot-web (Frontend)

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Component library | shadcn/ui (base-nova style) |
| Charts | Recharts |
| Icons | Lucide React |
| Font | Geist (system font stack) |

---

## Project Structure

```
growthpilot-ai/
├── growthpilot-api/             # CRM Backend (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.ts              # Demo data seeder
│   │   └── migrations/          # Migration history
│   ├── src/
│   │   ├── main.ts              # App bootstrap (global prefix /api, CORS, ValidationPipe)
│   │   ├── app.module.ts        # Root module
│   │   ├── config/
│   │   │   └── env.validation.ts
│   │   ├── db/
│   │   │   ├── db.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── common/              # Shared DTOs, types, utilities
│   │   └── modules/
│   │       ├── ai/              # AI integration (controller, service, providers)
│   │       ├── analytics/       # Dashboard & campaign analytics
│   │       ├── campaigns/       # Campaign CRUD + approve + send
│   │       ├── channel-client/  # HTTP client for channel service
│   │       ├── communications/  # Communication records + callback ingestion
│   │       ├── customers/       # Customer CRUD + CSV import
│   │       ├── health/          # Health check endpoints
│   │       ├── orders/          # Order CRUD + CSV import
│   │       └── segments/        # Segment CRUD + preview + AI suggest
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── render.yaml
│   └── tsconfig.json
│
├── growthpilot-channel/          # Channel Simulator Service (NestJS)
│   ├── src/
│   │   ├── main.ts               # App bootstrap (global prefix /channel)
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   ├── channel-config.ts  # Probability & delay configuration
│   │   │   └── config.module.ts
│   │   └── channel/
│   │       ├── channel.controller.ts  # POST /send, GET /health
│   │       ├── channel.service.ts     # Orchestrates simulation
│   │       ├── channel.module.ts
│   │       ├── dto/                  # Send & callback DTOs
│   │       └── simulator/
│   │           └── simulator.service.ts  # Probabilistic state machine
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── render.yaml
│   └── tsconfig.json
│
├── growthpilot-web/              # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout (sidebar + theme provider)
│   │   │   ├── page.tsx           # Home
│   │   │   ├── dashboard/         # Analytics dashboard
│   │   │   ├── customers/         # Customer management
│   │   │   ├── campaigns/         # Campaign studio + detail
│   │   │   ├── segments/          # Segment builder
│   │   │   └── analytics/         # Campaign comparison
│   │   ├── components/
│   │   │   ├── campaigns/
│   │   │   ├── customers/
│   │   │   ├── layout/            # Sidebar navigation
│   │   │   ├── providers/         # Theme provider
│   │   │   ├── segments/
│   │   │   ├── shared/            # Reusable components
│   │   │   └── ui/                # shadcn/ui primitives
│   │   ├── lib/
│   │   │   ├── api.ts             # API client (all endpoints)
│   │   │   ├── types.ts           # TypeScript interfaces
│   │   │   └── utils.ts           # cn() utility
│   │   └── globals.css
│   ├── .env.example
│   ├── components.json            # shadcn/ui configuration
│   ├── next.config.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── vercel.json
│   └── tsconfig.json
│
├── AGENTS.md                      # Full product specification
├── DEPLOYMENT_GUIDE.md            # Step-by-step deployment instructions
└── README.md                      # This file
```

---

## Campaign Lifecycle

The campaign lifecycle is the core flow of the product. Here is how it works end to end:

```mermaid
stateDiagram-v2
    [*] --> Draft: Create campaign
    Draft --> Approved: User approves
    Approved --> Sending: User clicks send
    Sending --> Sent: CRM creates comm records\n& sends to channel service
    Sent --> Delivered: Channel delivers
    Sent --> Failed: Delivery fails
    Delivered --> Opened: Recipient opens
    Opened --> Read: Recipient reads
    Read --> Clicked: Recipient clicks CTA
    Clicked --> Purchased: Recipient purchases
    Failed --> [*]
    Purchased --> [*]
```

### Event simulation sequence

When a campaign is sent, each communication goes through the channel service's probabilistic state machine:

```
Sent (100%)
  ↓
Delivered? ──No──→ Failed
  │
 Yes
  ↓
Opened? ──No──→ (stops, no further events)
  │
 Yes
  ↓
Read? ──No──→ (stops)
  │
 Yes
  ↓
Clicked? ──No──→ (stops)
  │
 Yes
  ↓
Purchased? ──No──→ (stops, final event: clicked)
  │
 Yes
  ↓
(complete)
```

Each stage has a configurable probability (per channel) and a configurable delay. For example, WhatsApp might have a 94% delivery rate, 75% open rate, and 10% purchase rate, while Email might have 90% delivery, 48% open, and 3% purchase.

### Callback flow

1. CRM sends `POST /channel/send` with communication payload
2. Channel service responds immediately with `202 Accepted`
3. Channel service runs the simulation in-process using `setTimeout` chains
4. At each stage, the simulator calls `POST /api/callbacks/channel-event` on the CRM
5. CRM validates the callback, checks for duplicate events, updates the communication record, logs the event, and returns `201 Created`
6. If the callback HTTP request fails, the channel service retries up to 3 times

---

## Local Setup

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 14.x (running locally or via Docker)
- **Git**

### Clone the repository

```bash
git clone https://github.com/your-org/growthpilot-ai.git
cd growthpilot-ai
```

---

## Environment Variables

### growthpilot-api `.env`

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/growthpilot?schema=public"

# Channel Service
CHANNEL_SERVICE_URL=http://localhost:4001

# AI Provider
AI_PROVIDER=mock              # mock, github, or gemini

# GitHub Models (when AI_PROVIDER=github)
AI_MODEL=gpt-4o-mini
GITHUB_MODELS_API_KEY=

# Gemini (when AI_PROVIDER=gemini)
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=
```

### growthpilot-channel `.env`

```env
# Server
PORT=4001
NODE_ENV=development

# CRM Callback Endpoint
CRM_CALLBACK_URL=http://localhost:4000/api/callbacks/channel-event

# Timing Controls (milliseconds)
SIM_SENT_DELAY=500
SIM_DELIVERED_DELAY=1000
SIM_FAILED_DELAY=1500
SIM_OPENED_DELAY=1500
SIM_READ_DELAY=500
SIM_CLICKED_DELAY=1000
SIM_PURCHASED_DELAY=1500

# Per-channel probabilities (0.0 to 1.0)
# CHANNEL_SIM_WHATSAPP_DELIVERY=0.94
# CHANNEL_SIM_WHATSAPP_OPEN=0.75
# CHANNEL_SIM_EMAIL_DELIVERY=0.90
# CHANNEL_SIM_EMAIL_OPEN=0.48
# (Full list in .env.example)

# Callback Retry
CALLBACK_RETRY_ATTEMPTS=3
CALLBACK_RETRY_DELAY_MS=1000
```

### growthpilot-web `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Database Setup

### 1. Ensure PostgreSQL is running

```bash
# Check status
pg_isready

# Or start via Homebrew (macOS)
brew services start postgresql@16

# Or via Docker
docker run -d --name growthpilot-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=growthpilot \
  -p 5432:5432 \
  postgres:16
```

### 2. Create the database

```bash
createdb growthpilot
```

### 3. Configure the API

Copy the environment template and update `DATABASE_URL` if needed:

```bash
cp growthpilot-api/.env.example growthpilot-api/.env
```

### 4. Run migrations

```bash
cd growthpilot-api
npm install
npm run prisma:migrate
```

### 5. (Optional) Seed demo data

```bash
npm run prisma:seed
```

This creates sample customers, orders, segments, and a draft campaign.

---

## Running All Services

Run each service in a separate terminal.

### Terminal 1 — CRM Backend

```bash
cd growthpilot-api
npm run start:dev
```

Runs on `http://localhost:4000/api`

### Terminal 2 — Channel Service

```bash
cd growthpilot-channel
npm run start:dev
```

Runs on `http://localhost:4001/channel`

### Terminal 3 — Frontend

```bash
cd growthpilot-web
npm run dev
```

Runs on `http://localhost:3000`

### Verify everything is running

```bash
# API health
curl http://localhost:4000/api/health

# Channel service health
curl http://localhost:4001/channel/health

# Frontend
open http://localhost:3000
```

---

## AI Provider Configuration

### Switching providers

Set the `AI_PROVIDER` environment variable in `.env`:

```env
# Use mock responses (no API key needed, ideal for local dev)
AI_PROVIDER=mock

# Use GitHub Models
AI_PROVIDER=github
AI_MODEL=openai/gpt-4o-mini
GITHUB_MODELS_API_KEY=your_key_here

# Use Gemini
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your_key_here
```

### Provider comparison

| Feature | Mock | GitHub Models | Gemini |
|---|---|---|---|
| Requires API key | No | Yes | Yes |
| Internet required | No | Yes | Yes |
| Real AI responses | No | Yes | Yes |
| Rate limits | None | GitHub account quota | Free tier (60 req/min) |
| Best for | Local dev, demos | Production | Fallback |

### AI output validation

All AI responses are validated against expected JSON schemas before being returned to the user. If a provider returns malformed output, the error is caught and the user sees a descriptive message instead of crashed UI.

---

## API Overview

All API endpoints are prefixed with `/api` on `growthpilot-api`.

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/health/system` | System information |

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers?page=&limit=&search=` | Paginated, searchable customer list |
| GET | `/api/customers/:id` | Customer detail with metrics |
| POST | `/api/customers` | Create a customer |
| POST | `/api/customers/import` | Upload customer CSV |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders?page=&limit=` | Paginated order list |
| POST | `/api/orders` | Create an order |
| POST | `/api/orders/import` | Upload order CSV |

### Segments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/segments?page=&limit=&search=` | Paginated segment list |
| GET | `/api/segments/:id` | Segment detail |
| POST | `/api/segments` | Create a segment |
| POST | `/api/segments/:id/preview` | Preview segment audience |
| POST | `/api/segments/ai-suggest` | AI-powered segment suggestion |

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/campaigns` | Campaign list |
| GET | `/api/campaigns/:id` | Campaign detail |
| POST | `/api/campaigns` | Create a campaign |
| POST | `/api/campaigns/:id/approve` | Approve campaign for sending |
| POST | `/api/campaigns/:id/send` | Send campaign (dispatches to channel service) |

### Communications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/communications?page=&limit=` | All communications (paginated) |
| GET | `/api/campaigns/:id/communications?page=&limit=` | Communications for a campaign |
| POST | `/api/callbacks/channel-event` | Channel service callback ingestion (idempotent) |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Aggregate KPIs for the dashboard |
| GET | `/api/analytics/campaigns/:id` | Per-campaign funnel analytics |

### AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/segment` | Generate segment suggestion from business goal |
| POST | `/api/ai/message` | Generate campaign message copy |
| POST | `/api/ai/recommend-channel` | Recommend a channel for a campaign |
| POST | `/api/ai/insights` | Generate campaign performance insights |

### Channel service

| Method | Endpoint | Description |
|---|---|---|
| GET | `/channel/health` | Channel service health check |
| POST | `/channel/send` | Send communication payload for simulation |

Callback payload:

```json
{
  "communicationId": "uuid",
  "eventType": "delivered",
  "timestamp": "2026-06-13T12:00:00.000Z"
}
```

---

## CSV Import

### Customer CSV format

```csv
name,email,phone,city
Alice Johnson,alice@example.com,+1-555-0101,New York
Bob Smith,bob@example.com,+1-555-0102,Los Angeles
```

Required columns: `name`, `email`
Optional columns: `phone`, `city`

### Order CSV format

```csv
customer_email,order_total,currency,ordered_at,channel,status
alice@example.com,149.99,USD,2026-06-01,website,completed
bob@example.com,249.50,USD,2026-06-02,website,completed
```

Required columns: `customer_email`, `order_total`, `channel`, `status`
Optional columns: `currency` (defaults to USD), `ordered_at` (defaults to now)

Orders are linked to customers by email match. If no matching customer is found, the order is skipped (reported in the import result).

### Import via API

```bash
curl -X POST http://localhost:4000/api/customers/import \
  -F "file=@customers.csv"

curl -X POST http://localhost:4000/api/orders/import \
  -F "file=@orders.csv"
```

### Import response

```json
{
  "total": 50,
  "inserted": 48,
  "skipped": 1,
  "failed": 1,
  "errors": [
    { "row": 23, "message": "Invalid email format" },
    { "row": 45, "message": "Customer not found: unknown@example.com" }
  ]
}
```

### Import via UI

1. Navigate to the Customers or Orders page
2. Click the "Import" button
3. Select a CSV file
4. Review the import report

---

## Analytics

### Dashboard KPIs

The dashboard endpoint (`GET /api/analytics/dashboard`) returns:

| Metric | Description |
|---|---|
| Total Customers | Number of customers in the system |
| Total Orders | Number of orders across all channels |
| Active Segments | Number of segments created |
| Campaigns Sent | Number of campaigns that have been sent |
| Delivery Rate | % of sent communications that were delivered |
| Open Rate | % of delivered communications that were opened |
| Read Rate | % of opened communications that were read |
| Click Rate | % of opened communications that were clicked |
| Conversion Rate | % of sent communications that resulted in a purchase |
| Revenue Attributed | Sum of order values attributed to campaign purchases |

### Campaign funnel

The campaign analytics endpoint (`GET /api/analytics/campaigns/:id`) returns per-campaign funnel data. The funnel is computed from the `status` field of each communication record:

```
sent → delivered → opened → read → clicked → purchased
```

Each subsequent stage is a subset of the previous one, forming a classic engagement funnel.

### Rate calculation

| Rate | Formula |
|---|---|
| Delivery Rate | `deliveredCount / sentCount` |
| Open Rate | `openedCount / deliveredCount` |
| Read Rate | `readCount / openedCount` |
| Click Rate | `clickedCount / openedCount` |
| Conversion Rate | `purchasedCount / sentCount` |

### Revenue attribution

When a communication reaches `purchased` status, the CRM queries orders placed by that customer after the campaign's send time. The sum of those order totals is attributed to the campaign. This is a simple time-window model — a production system would use a more sophisticated attribution model, but this balances accuracy with simplicity for the CRM's scope.

### AI insights

The `POST /api/ai/insights` endpoint enriches raw analytics with natural language:

- **Summary** — a concise overview of campaign performance
- **Insight** — a key observation (e.g., "The open rate is above average but conversion is low")
- **Next best action** — a suggested follow-up (e.g., "Consider an A/B test on the CTA for high-open, low-click segments")

---

## Screenshots

<!--

Screenshots to add:

1. Dashboard — aggregate KPIs with metric cards
2. Customers — searchable table with customer detail sheet
3. Segment Builder — rule editor with AI suggest button
4. Campaign Studio — message editor with AI generation panel
5. Campaign Detail — recipient status table and funnel chart
6. Analytics — campaign comparison and conversion summary

-->

| Dashboard | Customers |
|---|---|
| `[screenshot-placeholder]` | `[screenshot-placeholder]` |

| Segment Builder | Campaign Studio |
|---|---|
| `[screenshot-placeholder]` | `[screenshot-placeholder]` |

| Campaign Detail | Analytics |
|---|---|
| `[screenshot-placeholder]` | `[screenshot-placeholder]` |

---

## Deployment

Each service is independently deployable. The recommended deployment targets are:

| Service | Platform | Notes |
|---|---|---|
| `growthpilot-web` | **Vercel** | Zero-config Next.js deployment |
| `growthpilot-api` | **Render** | Node.js + Postgres |
| `growthpilot-channel` | **Render** | Stateless Node.js |
| PostgreSQL | **Render** | Managed Postgres |

A step-by-step deployment guide is available in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

### Quick deployment checklist

1. Deploy PostgreSQL (Render Postgres)
2. Deploy `growthpilot-api` with DATABASE_URL and AI provider config
3. Deploy `growthpilot-channel` with CRM_CALLBACK_URL pointing to the deployed API
4. Deploy `growthpilot-web` with NEXT_PUBLIC_API_URL pointing to the deployed API
5. Run migrations: `npx prisma migrate deploy`
6. Seed demo data: `npm run prisma:seed` (optional)
7. Verify health endpoints

### Environment variables for production

| Service | Key variable |
|---|---|
| `growthpilot-api` | `DATABASE_URL`, `CHANNEL_SERVICE_URL`, `AI_PROVIDER`, `AI_MODEL`, provider keys |
| `growthpilot-channel` | `CRM_CALLBACK_URL` (must be the deployed API URL + `/api/callbacks/channel-event`) |
| `growthpilot-web` | `NEXT_PUBLIC_API_URL` (must be the deployed API URL + `/api`) |

---

## Future Improvements

### Short term

- **Real provider integration** — replace the channel simulator with actual Twilio (WhatsApp/SMS) and SendGrid (Email) adapters while keeping the same callback contract
- **Advanced segmentation** — add AND/OR/NOT rule nesting, date-range conditions, and multi-condition grouping
- **Campaign scheduling** — allow setting a future send time instead of immediate send
- **Message templates with variables** — use `{{name}}`, `{{city}}` placeholders that render per-recipient

### Medium term

- **A/B testing** — send variant messages to random subsets and compare funnel performance
- **Multivariate campaign optimization** — let the AI suggest which channel + message + audience combination is likely to perform best
- **Webhook integration** — allow external systems to subscribe to communication events
- **Role-based access** — multi-user support with admin and marketer roles
- **Export analytics** — CSV/PDF export for campaign reports

### Long term

- **Real-time dashboard** — WebSocket-based live updates as callbacks arrive
- **Predictive LTV scoring** — use order history to predict lifetime value and optimize audience selection
- **Automated campaign triggers** — "Send a reactivation campaign when a customer hasn't ordered in 90 days"
- **Multi-workspace** — support multiple brands in a single GrowthPilot instance
- **Custom channel service SDK** — let third parties build their own channel adapters

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. **Read the spec** — `AGENTS.md` contains the full product specification and design rationale
2. **Follow the architecture** — keep the three-service boundary intact; the channel service must remain decoupled
3. **Keep services independent** — no shared database, no internal RPC; all inter-service communication is via HTTP
4. **Test the campaign lifecycle** — any change that touches the send → callback → analytics flow must be tested end to end
5. **AI guardrails** — never accept raw AI output; always validate and surface for user review

### Development workflow

```bash
# Install dependencies
cd growthpilot-api && npm install
cd growthpilot-channel && npm install
cd growthpilot-web && npm install

# Run all services in development mode
# (three terminals, see #running-all-services)
```

### Code style

- TypeScript strict mode
- NestJS: controllers are thin, business logic lives in services
- Next.js: App Router, server components by default, client components only when needed
- Database: all schema changes go through Prisma migrations

---

## License

MIT License. See [`LICENSE`](./LICENSE) for details.


