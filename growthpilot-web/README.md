# GrowthPilot Web

[![Web CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/web-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/web-ci.yml)

Dashboard frontend — Next.js 16 + Tailwind CSS v4 + shadcn/ui.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Lint source files |

## Environment

Copy `.env.example` to `.env.local` and configure:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Aggregate KPIs and funnel |
| `/customers` | Customer table with CSV import |
| `/segments` | Segment builder with AI suggest |
| `/campaigns` | Campaign studio |
| `/campaigns/[id]` | Campaign detail + communications + analytics |
| `/analytics` | Campaign comparison |

See the [root README](../README.md) for full project docs.
