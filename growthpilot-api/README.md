# GrowthPilot API

[![API CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/api-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/api-ci.yml)

CRM backend — NestJS + Prisma + PostgreSQL.

## Tech stack

- NestJS 10
- Prisma 5
- PostgreSQL
- class-validator / class-transformer
- Jest

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start dev server (watch mode) |
| `npm run build` | Compile NestJS |
| `npm run start:prod` | Start production server |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run dev migrations |
| `npm run prisma:deploy` | Deploy migrations |
| `npm run prisma:seed` | Seed demo data |

## Environment

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://...
CHANNEL_SERVICE_URL=http://localhost:4001
AI_PROVIDER=mock
```

## Modules

- **Customers** — import CSV, manage customers
- **Orders** — import CSV, manage orders
- **Segments** — rule-based and AI-suggested segments
- **Campaigns** — create, approve, send campaigns
- **Communications** — track per-customer campaign state
- **Analytics** — aggregate KPIs, campaign performance
- **AI** — segment suggestions, message drafting, insights
- **Channel Client** — outbound calls to the channel service

See the [root README](../README.md) for full project docs.
