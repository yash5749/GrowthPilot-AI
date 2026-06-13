# GrowthPilot Web

Dashboard frontend for GrowthPilot AI — an AI-powered shopper outreach CRM.

Built with **Next.js 16**, **Tailwind CSS v4**, and **shadcn/ui**.

## Development

```bash
npm run dev
```

Opens on `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Pages

- `/dashboard` — aggregate KPIs
- `/customers` — customer table with import
- `/segments` — segment builder with AI suggest
- `/campaigns` — campaign studio
- `/campaigns/[id]` — campaign detail + funnel
- `/analytics` — campaign comparison

See the [root README](../README.md) for full project documentation.
