# GrowthPilot Channel

[![Channel CI](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/channel-ci.yml/badge.svg)](https://github.com/yash5749/GrowthPilot-AI/actions/workflows/channel-ci.yml)

Simulated delivery service — receives campaign sends, simulates lifecycle events, and posts callbacks to the CRM.

## Tech stack

- NestJS 10
- class-validator / class-transformer

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start dev server (watch mode) |
| `npm run build` | Compile NestJS |
| `npm run start:prod` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint source files |

## Environment

Copy `.env.example` to `.env` and configure:

```
PORT=4001
CRM_CALLBACK_URL=http://localhost:4000/api/callbacks/channel-event
```

## Behaviour

Accepts `POST /channel/send`, then asynchronously simulates:

- **Success path**: sent → delivered → opened → clicked → purchased
- **Failure path**: sent → failed

Each event is posted to the CRM callback URL after a simulated delay.

## API

| Endpoint | Description |
|---|---|
| `POST /channel/send` | Accept a communication to simulate |
| `GET /channel/health` | Health check |

See the [root README](../README.md) for full project docs.
