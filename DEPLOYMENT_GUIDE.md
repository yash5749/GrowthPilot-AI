# GrowthPilot AI — Deployment Guide

**Last updated:** June 11, 2026

---

## 1. Deployment Checklist

### Pre-flight Checks

| Item | Status | Notes |
|------|--------|-------|
| All builds pass | ✅ | `npm run build` succeeds on all 3 services |
| Database migrations exist | ✅ | 3 migrations in `growthpilot-api/prisma/migrations/` |
| Prisma `postinstall` hook set | ✅ | Auto-runs `prisma generate` after `npm install` |
| `prisma:deploy` script set | ✅ | Uses `prisma migrate deploy` (safe for production) |
| Frontend env configured | ✅ | `.env.example` documents `NEXT_PUBLIC_API_URL` |
| Health endpoints exist | ✅ | `GET /api/health`, `GET /api/health/system`, `GET /channel/health` |
| CORS enabled | ✅ | Wide open for demo (restrict before production launch) |
| Lockfile conflict resolved | ✅ | Removed root `package.json` and `package-lock.json` |
| Start scripts set | ✅ | `start:prod` on API and channel set `NODE_ENV=production` |
| Channel service build verified | ✅ | Compiled output at `dist/main.js` matches `start:prod` |

### Deployment Order

```
1. Database (Postgres on Railway/Render/Neon)
2. CRM API (growthpilot-api)
3. Channel Service (growthpilot-channel)
4. Frontend (growthpilot-web on Vercel)
```

---

## 2. Production Environment Variables

### growthpilot-api (CRM Backend)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (default: 4000) | `4000` |
| `NODE_ENV` | No | Environment (default: development) | `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host:5432/growthpilot?schema=public` |
| `CHANNEL_SERVICE_URL` | Yes† | URL of deployed channel service | `https://growthpilot-channel.onrender.com` |
| `AI_PROVIDER` | No | AI provider: `mock`, `gemini`, or `github` (default: mock) | `mock` |
| `GEMINI_API_KEY` | If using Gemini | Google Gemini API key | `AIza...` |
| `GITHUB_MODELS_API_KEY` | If using GitHub | GitHub Models token | `ghp_...` |

† Channel service URL is optional; without it, campaign sends skip the channel service.

### growthpilot-channel (Channel Simulator)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `4001` |
| `NODE_ENV` | No | Environment | `development` |
| `CRM_CALLBACK_URL` | **Yes** | CRM callback endpoint | `https://growthpilot-api.onrender.com/api/callbacks/channel-event` |
| `SIM_SENT_DELAY` | No | Delay before sent event (ms) | `500` |
| `SIM_DELIVERED_DELAY` | No | Delay before delivered event (ms) | `1500` |
| `SIM_FAILED_DELAY` | No | Delay before failed event (ms) | `1500` |
| `SIM_OPENED_DELAY` | No | Delay before opened event (ms) | `3000` |
| `SIM_CLICKED_DELAY` | No | Delay before clicked event (ms) | `4500` |
| `SIM_PURCHASED_DELAY` | No | Delay before purchased event (ms) | `6000` |
| `SIM_FAILURE_RATE` | No | Probability of failure (0.0–1.0) | `0.10` |
| `CALLBACK_RETRY_ATTEMPTS` | No | Max callback retries | `3` |
| `CALLBACK_RETRY_DELAY_MS` | No | Delay between retries (ms) | `1000` |

### growthpilot-web (Frontend)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes† | CRM API base URL | `http://localhost:4000/api` |

† Must be set at build time on Vercel (preview/production env).

---

## 3. Railway Deployment Plan

### Architecture on Railway

```
Railway Project: growthpilot
├── PostgreSQL Plugin (database)
├── Service: growthpilot-api
└── Service: growthpilot-channel
```

### Step-by-step

#### Database
1. Create new Railway project "growthpilot"
2. Add a **PostgreSQL** plugin (Railway provisions it automatically)
3. Copy the `DATABASE_URL` from the PostgreSQL plugin's "Connect" tab

#### CRM API (growthpilot-api)
1. Create new service → "Deploy from repo" → select `growthpilot-api`
2. Set **Root Directory**: (leave as `/`)
3. Railway auto-detects Node.js from `package.json`
4. The `railway.json` at the repo root configures build/deploy commands:
   - **Build:** `npm install && npm run prisma:generate && npm run build`
   - **Start:** `npm run prisma:deploy && npm run start:prod`
5. Add environment variables:
   - `DATABASE_URL` → paste from PostgreSQL plugin
   - `CHANNEL_SERVICE_URL` → `https://growthpilot-channel.up.railway.app` (after deploying channel)
   - `AI_PROVIDER` → `mock`
   - `PORT` → (Railway sets this automatically)
6. Deploy

#### Channel Service (growthpilot-channel)
1. Create new service → "Deploy from repo" → select `growthpilot-channel`
2. The `railway.json` at the repo root configures:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start:prod`
3. Add environment variables:
   - `CRM_CALLBACK_URL` → `https://growthpilot-api.up.railway.app/api/callbacks/channel-event`
4. Deploy

#### Frontend (Vercel — see Section 5)
Railway does not host Next.js optimally. Deploy the frontend on Vercel.

### railway.json files

**growthpilot-api/railway.json:**
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npm run prisma:generate && npm run build"
  },
  "deploy": {
    "startCommand": "npm run prisma:deploy && npm run start:prod",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "on_failure"
  }
}
```

**growthpilot-channel/railway.json:**
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/channel/health",
    "restartPolicyType": "on_failure"
  }
}
```

---

## 4. Render Deployment Plan

### Architecture on Render

```
Render Account
├── Blueprint: growthpilot-api (Web Service)
└── Blueprint: growthpilot-channel (Web Service)
└── External: Neon/Supabase (PostgreSQL)
└── External: Vercel (Frontend)
```

### Step-by-step

#### Database (Neon — Recommended with Render)
1. Create free account at https://neon.tech
2. Create a new project "growthpilot"
3. Copy the connection string from "Connection Details" → Prisma

#### CRM API (growthpilot-api)
1. In Render Dashboard → New → Web Service
2. Connect your GitHub repo → select `growthpilot-api`
3. Settings:
   - **Name:** `growthpilot-api`
   - **Region:** Oregon (us-west)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm run prisma:deploy && npm run start:prod`
   - **Health Check Path:** `/api/health`
   - **Plan:** Free
4. Environment Variables — add:
   - `DATABASE_URL` → from Neon
   - `CHANNEL_SERVICE_URL` → `https://growthpilot-channel.onrender.com` (after deploying)
   - `AI_PROVIDER` → `mock`
   - `NODE_ENV` → `production`
5. Deploy

#### Channel Service (growthpilot-channel)
1. In Render Dashboard → New → Web Service
2. Connect repo → select `growthpilot-channel`
3. Settings:
   - **Name:** `growthpilot-channel`
   - **Region:** Oregon
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Health Check Path:** `/channel/health`
   - **Plan:** Free
4. Environment Variables:
   - `CRM_CALLBACK_URL` → `https://growthpilot-api.onrender.com/api/callbacks/channel-event`
   - `NODE_ENV` → `production`
5. Deploy

#### Alternative: Render Blueprint (render.yaml)

Both services include a `render.yaml` for Blueprint-based deployments. To use:
1. In Render Dashboard → New → Blueprint
2. Connect repo
3. Render auto-detects both `render.yaml` files and creates the services
4. You still need to manually add `DATABASE_URL` and `CHANNEL_SERVICE_URL` after creation

**growthpilot-api/render.yaml:**
```yaml
services:
  - type: web
    name: growthpilot-api
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run prisma:generate && npm run build
    startCommand: npm run prisma:deploy && npm run start:prod
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: CHANNEL_SERVICE_URL
        sync: false
      - key: AI_PROVIDER
        value: mock
```

**growthpilot-channel/render.yaml:**
```yaml
services:
  - type: web
    name: growthpilot-channel
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /channel/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: CRM_CALLBACK_URL
        sync: false
```

---

## 5. Vercel Deployment Plan

### Frontend (growthpilot-web)

Vercel is the recommended host for the Next.js frontend.

### Step-by-step

1. Go to https://vercel.com → Add New → Project
2. Import your GitHub repo
3. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `growthpilot-web`
   - **Build Command:** `next build` (auto)
   - **Install Command:** `npm install` (auto)
   - **Output Directory:** `.next` (auto)
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL` → `https://growthpilot-api.onrender.com/api`
5. Deploy
6. Add custom domain if desired (Settings → Domains)

### vercel.json (optional, already committed)

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

This file exists at `growthpilot-web/vercel.json`. Vercel auto-detects Next.js, so this is optional but ensures explicit settings.

### Environment Variable Notes

- `NEXT_PUBLIC_API_URL` must be set in **both** Preview and Production environments
- The variable is **baked in at build time**, so a rebuild is required after changing it
- For local development, create a `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

---

## 6. Final Launch Checklist

### Before Launch

- [ ] **Build all 3 services locally** — `npm run build` passes on all
- [ ] **Database migration tested** — `prisma migrate deploy` runs without error
- [ ] **Frontend API URL configured** — `NEXT_PUBLIC_API_URL` set at build time
- [ ] **Channel callback URL configured** — `CRM_CALLBACK_URL` points to the deployed CRM API
- [ ] **Seed data ready** — `npm run prisma:seed` populates demo data
- [ ] **Health endpoints respond** — `/api/health`, `/api/health/system`, `/channel/health` return 200

### Launch Sequence

```
Step 1: Provision Database (Neon or Railway PostgreSQL)
  → Copy DATABASE_URL
  → Run migrations: prisma migrate deploy

Step 2: Deploy CRM API (Railway or Render)
  → Set DATABASE_URL, CHANNEL_SERVICE_URL
  → Verify /api/health returns 200
  → Run seed: npm run prisma:seed

Step 3: Deploy Channel Service (Railway or Render)
  → Set CRM_CALLBACK_URL → https://crm-api-url/api/callbacks/channel-event
  → Verify /channel/health returns 200

Step 4: Update CRM API's CHANNEL_SERVICE_URL
  → Set to https://channel-service-url
  → Rebuild if needed (Render auto-redeploys on env change)

Step 5: Deploy Frontend (Vercel)
  → Set NEXT_PUBLIC_API_URL → https://crm-api-url/api
  → Verify frontend loads and connects to API

Step 6: Smoke Test
  → Create a customer
  → Create a segment
  → Create and send a campaign
  → Verify callbacks arrive (communications update status)
  → Check analytics dashboard
```

### Post-Launch Verification

```bash
# 1. Health checks
curl https://growthpilot-api.onrender.com/api/health
curl https://growthpilot-api.onrender.com/api/health/system
curl https://growthpilot-channel.onrender.com/channel/health

# 2. API smoke test
curl https://growthpilot-api.onrender.com/api/customers

# 3. Frontend
open https://growthpilot-web.vercel.app/dashboard
```

### Rollback Plan

| Service | Rollback Action |
|---------|----------------|
| CRM API | Render: "Rollback" button in dashboard → previous deploy |
| Channel Service | Render: "Rollback" button → previous deploy |
| Database | `prisma migrate down` (or restore from Neon backup) |
| Frontend | Vercel: "Instant Rollback" in Deployments tab |

### Production Considerations (Future)

- [ ] Restrict CORS to specific frontend origin(s) instead of wildcard
- [ ] Add rate limiting to API endpoints
- [ ] Add authentication/API keys for callback endpoints
- [ ] Increase SIM delays for more realistic demo timing
- [ ] Add monitoring (Sentry, LogRocket, or similar)
- [ ] Set up automated database backups
