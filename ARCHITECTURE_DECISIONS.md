  # Architecture Decisions

This document records the main technical choices behind GrowthPilot AI, along with the tradeoffs that were consciously accepted during implementation.

## 1) Service separation

### Decision
The system is split into three deployable services:

- `growthpilot-api` — CRM backend
- `growthpilot-channel` — simulated channel delivery service
- `growthpilot-web` — frontend dashboard

### Why
The assignment explicitly asked for a separate channel service with asynchronous callbacks. Keeping the channel logic outside the CRM makes the system closer to a real-world messaging architecture.

### Tradeoff
This adds deployment and configuration complexity, but it makes the design more realistic and easier to explain.

---

## 2) Callback-driven communication lifecycle

### Decision
Campaign delivery is modeled as an asynchronous lifecycle:

`sent → delivered → opened → read → clicked → purchased`

The channel service emits callbacks to the CRM, and the CRM updates the communication state and analytics.

### Why
This mirrors how real messaging providers behave. It also demonstrates ordering, retries, failure handling, and idempotency.

### Tradeoff
The simulation is still simplified compared to a real provider, but it is sufficient to demonstrate the required system design.

---

## 3) Probabilistic channel simulation

### Decision
The channel service uses per-stage probability gates instead of making every message succeed end-to-end.

### Why
A realistic funnel should show drop-off between stages. If every communication gets delivered, opened, clicked, and purchased, the analytics look artificial.

### Tradeoff
The simulator is not a statistical model of real customer behavior. It is intentionally lightweight and deterministic enough for a take-home project.

---

## 4) AI provider abstraction

### Decision
AI functionality is hidden behind a provider interface, with support for:

- `mock`
- `github`
- `gemini`

### Why
This makes the AI layer configurable and prevents vendor lock-in. It also lets the project run locally without external API dependencies.

### Tradeoff
The abstraction adds a little code, but it makes the system much cleaner and easier to test.

---

## 5) Structured AI outputs

### Decision
AI providers return structured JSON instead of raw free-form text.

### Why
The app needs AI suggestions that can be rendered directly in the UI and applied to campaigns or segments safely.

### Tradeoff
This is more restrictive than a chat-only interface, but it produces better product behavior and fewer parsing issues.

---

## 6) CSV import as the ingestion path

### Decision
Customers and orders are ingested through CSV import endpoints.

### Why
This keeps the product aligned with the assignment and gives a realistic data onboarding flow.

### Tradeoff
A UI wizard or column-mapping engine was intentionally not added, because it would add complexity without improving the take-home outcome materially.

---

## 7) Pagination across list views

### Decision
Major list endpoints use page-based pagination.

### Why
This prevents the UI from loading everything at once and keeps the project usable once the dataset grows.

### Tradeoff
Pagination adds a little frontend state management, but it is the right tradeoff for scale and usability.

---

## 8) Prisma as the ORM

### Decision
The backend uses Prisma for database access.

### Why
Prisma gives a clean schema-first workflow, type safety, and straightforward migrations.

### Tradeoff
Some highly optimized SQL use cases are harder than with raw queries, but Prisma is more than enough for the project scope.

---

## 9) PostgreSQL as the database

### Decision
The project uses PostgreSQL for all persistent data.

### Why
Postgres is a strong default for relational CRM data and works well with Prisma.

### Tradeoff
None that matter for this scope. It is the right choice for this kind of application.

---

## 10) Frontend architecture

### Decision
The frontend is built with Next.js, Tailwind CSS, and shadcn/ui.

### Why
This stack is fast to build with, easy to deploy, and good for a polished dashboard-style product.

### Tradeoff
The UI is intentionally opinionated and component-driven rather than highly custom from scratch.

---

## 11) Testing strategy

### Decision
The repo includes unit and e2e tests for the most important business flows.

### Why
The project needs confidence around imports, campaign actions, callbacks, analytics, and AI fallback behavior.

### Tradeoff
The test suite does not chase perfect coverage. It focuses on the most valuable workflows instead.

---

## 12) CI validation

### Decision
GitHub Actions workflows validate builds and tests for the backend, channel service, and frontend.

### Why
CI helps ensure the project stays working after changes and makes the repository look production-oriented.

### Tradeoff
This adds maintenance for workflow files, but the payoff is worth it.

---

## 13) What was intentionally not added

The following were consciously excluded from the current scope:

- Redis caching
- BullMQ / background queues
- Kafka
- Kubernetes
- Multi-tenant auth
- Role-based permissions
- Complex CSV mapping UI
- Real messaging provider integration

### Why
These would add a lot of engineering overhead without improving the assignment outcome proportionally. The current project already demonstrates the most important product and system design decisions clearly.

---

## 14) Future direction

If this project were extended beyond the take-home scope, the next improvements would likely be:

- queue-based campaign dispatch
- background CSV import processing
- stronger attribution models
- rate limiting for AI usage
- role-based access control
- structured observability and tracing
- real channel provider adapters

These are valid production enhancements, but they were intentionally left out so the core architecture stayed focused and understandable.