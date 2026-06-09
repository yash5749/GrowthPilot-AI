# Xeno AI-Native Mini CRM

## 1) Product goal

Build a focused marketing CRM for consumer brands that can:

* ingest customers and orders
* segment shoppers by behavior and attributes
* generate and review personalized messages with AI
* send campaigns through a separate stubbed channel service
* collect delivery/open/click/purchase events
* show campaign and audience-level analytics

Do **not** build a sales CRM, pipeline tool, lead tracker, or support desk.

---

## 2) Product position

The best framing is:

**GrowthPilot AI — an autonomous shopper outreach copilot**

Core flow:

1. Brand uploads customer and order data.
2. AI suggests high-value audiences and campaign opportunities.
3. AI drafts message copy and recommends a channel.
4. Human reviews and approves.
5. Campaign is sent through a separate channel simulator.
6. Simulator calls back with lifecycle events.
7. CRM aggregates analytics and generates insights.

---

## 3) Non-negotiable product requirements

These map directly to the assignment brief:

* Ingest customers and orders.
* Segment shoppers manually and with AI.
* Send personalized communications through a stubbed channel service.
* Track sent, delivered, failed, opened, read, clicked, and attributed purchase events.
* Deploy a working hosted product.
* Provide a walkthrough video.

---

## 4) Recommended stack

### Frontend

* Next.js (React)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts or Tremor for charts

Why:

* simplest deployment on Vercel
* good dashboard ergonomics
* avoids unnecessary SPA routing complexity

### Backend

* NestJS
* TypeScript
* Prisma
* PostgreSQL

Why:

* structured backend architecture
* strong module separation
* easy to maintain under agent-driven development
* reliable deployment on Render/Fly.io/Railway

### Channel service

* Separate NestJS or Express service
* lightweight, stateless except for simulation jobs

### AI provider

Use a provider abstraction so you can swap models without rewriting business logic.

* Primary: GitHub Models if available
* Fallback: Gemini or another low-friction API
* Fallback-2: Manual workflow to avoid crashing

### Deployment

* Frontend: Render
* CRM backend: Render / Fly.io / Railway
* Channel service: Render / Fly.io / Railway
* Database: Render

---

## 5) Architecture

```text
Browser / Admin UI
   -> Next.js Frontend
      -> CRM Backend (NestJS)
         -> PostgreSQL
         -> AI Provider
         -> Channel Service API
         -> Callback receiver for lifecycle events

Separate Channel Service
   -> simulates sent / delivered / opened / clicked / failed / purchased
   -> calls CRM callback endpoint asynchronously
```

Critical loop:

* CRM send API creates communication records.
* CRM sends a batch to the channel service.
* Channel service simulates lifecycle events.
* Channel service posts callbacks back to CRM.
* CRM updates communication status and campaign metrics.

This loop should be visible in the demo.

---

## 6) Database design

Keep the model small and clean.

### customers

* id
* name
* email
* phone
* city
* created_at
* updated_at

### orders

* id
* customer_id
* order_total
* currency
* ordered_at
* channel
* status

### customer_metrics

Derived fields to speed segmentation and analytics:

* customer_id
* total_spent
* order_count
* last_order_at
* average_order_value
* lifetime_value_score

### segments

* id
* name
* description
* rule_json
* ai_generated
* created_at

### campaigns

* id
* name
* objective
* segment_id
* message_template
* channel
* status
* created_at
* sent_at

### communications

One row per customer per campaign:

* id
* campaign_id
* customer_id
* channel
* message_rendered
* status
* sent_at
* delivered_at
* opened_at
* clicked_at
* purchased_at
* failure_reason

### communication_events

Event log:

* id
* communication_id
* event_type
* payload_json
* created_at

### campaign_metrics

Optional aggregated table:

* campaign_id
* audience_size
* sent_count
* delivered_count
* failed_count
* opened_count
* clicked_count
* purchased_count
* revenue_attributed

---

## 7) Backend module structure

### Modules

* CustomersModule
* OrdersModule
* SegmentsModule
* CampaignsModule
* CommunicationsModule
* AnalyticsModule
* AiModule
* ChannelClientModule
* HealthModule

### Responsibilities

#### CustomersModule

* import CSV
* list customers
* get customer detail
* maintain customer_metrics

#### OrdersModule

* import CSV
* list orders
* link orders to customers
* update aggregates

#### SegmentsModule

* create manual segments
* preview segment audience
* run AI segment suggestion

#### CampaignsModule

* create campaign
* associate segment
* render message templates
* approve / send campaigns

#### CommunicationsModule

* create communication rows
* track state transitions
* ingest callback events

#### AnalyticsModule

* compute campaign-level KPIs
* audience-level performance
* show conversion and attribution summaries

#### AiModule

* generate segment ideas
* draft campaign copy
* recommend channels
* summarize campaign performance

#### ChannelClientModule

* send payload to channel service
* retry on failure
* log send attempts

---

## 8) API contract

### Customers

* `POST /customers/import`
* `GET /customers`
* `GET /customers/:id`

### Orders

* `POST /orders/import`
* `GET /orders`
* `GET /customers/:id/orders`

### Segments

* `POST /segments`
* `GET /segments`
* `POST /segments/preview`
* `POST /segments/ai-suggest`

### Campaigns

* `POST /campaigns`
* `GET /campaigns`
* `GET /campaigns/:id`
* `POST /campaigns/:id/approve`
* `POST /campaigns/:id/send`

### Communications

* `GET /campaigns/:id/communications`
* `GET /communications`
* `POST /callbacks/channel-event`

### Analytics

* `GET /analytics/dashboard`
* `GET /analytics/campaigns/:id`
* `GET /analytics/segments/:id`

### AI

* `POST /ai/segment`
* `POST /ai/message`
* `POST /ai/recommend-channel`
* `POST /ai/insights`

---

## 9) Channel service contract

This must be a separate service.

### CRM -> Channel service

`POST /channel/send`

Payload example:

```json
{
  "communicationId": "uuid",
  "customer": {
    "id": "uuid",
    "name": "Rahul",
    "phone": "+91..."
  },
  "channel": "whatsapp",
  "message": "Hello Rahul..."
}
```

### Channel service behavior

* accept request immediately
* simulate lifecycle events after delay
* call CRM callback API asynchronously
* randomly emit success or failure paths

### Example callback sequence

* sent
* delivered
* opened
* clicked
* purchased

### Failure sequence

* sent
* failed

Keep the simulation deterministic enough for demos and random enough to feel realistic.

---

## 10) AI design

Do not let AI free-run over your system. Keep AI bounded and reviewable.

### AI use case 1: segment suggestion

Input:

* business goal
* customer aggregates
* order behavior

Output:

* segment name
* explanation
* rule JSON

Example output shape:

```json
{
  "name": "Inactive High Value Customers",
  "rule": {
    "total_spent_gte": 5000,
    "last_order_days_gte": 60
  },
  "reason": "These shoppers are high-value but dormant, so a reactivation campaign is likely to perform well."
}
```

### AI use case 2: message drafting

Input:

* segment
* brand tone
* offer
* channel

Output:

* subject
* body
* CTA
* variable placeholders

### AI use case 3: channel recommendation

Input:

* audience characteristics
* historical channel results
* campaign objective

Output:

* recommended channel
* rationale

### AI use case 4: analytics summary

Input:

* campaign metrics
* audience metrics
* event breakdown

Output:

* summary
* insight
* next best action

### Guardrails

* validate AI output before use
* never accept raw SQL from AI
* never let AI directly mutate production data without user approval
* always show the generated result to the user for review

---

## 11) Frontend pages

Keep the UI minimal and clear.

### Page 1: Dashboard

Cards:

* total customers
* total orders
* active segments
* campaigns sent
* delivery rate
* open rate
* click rate
* conversion rate

### Page 2: Customers

* searchable table
* customer details drawer/page
* metrics summary
* order history

### Page 3: Orders

* import view
* order table
* customer-linked order drilldown

### Page 4: Segment Builder

* rule builder
* preview audience size
* AI suggest button
* audience preview table

### Page 5: Campaign Studio

This is the core screen.

Layout idea:

* left panel: target audience and segment info
* center panel: message editor
* right panel: AI suggestions and expected outcome

Include:

* campaign name
* objective
* channel selector
* generate copy
* edit copy
* approve
* send

### Page 6: Campaign Detail

* communication timeline
* recipient status table
* performance metrics
* attribution summary

### Page 7: Analytics

* campaign comparison
* audience comparison
* event funnel
* conversion summary

---

## 12) Suggested UX flow

1. Upload customer and order CSV.
2. See imported data and aggregates.
3. Ask AI to suggest a segment.
4. Review and edit the segment.
5. Generate campaign copy.
6. Review copy manually.
7. Pick a channel.
8. Approve and send campaign.
9. Watch callbacks arrive in real time.
10. Observe analytics update on the dashboard.

This is the demo narrative.

---

## 13) Project folder structure

### Frontend

```text
apps/web/
  src/
    app/
    components/
    features/
    lib/
    hooks/
    types/
```

### CRM backend

```text
apps/crm-api/
  src/
    modules/
    common/
    db/
    ai/
    integrations/
    jobs/
```

### Channel service

```text
apps/channel-service/
  src/
    simulator/
    callbacks/
    queues/
```

### Shared packages

```text
packages/shared/
  types/
  validators/
  constants/
```

Monorepo is recommended only if you are comfortable with it. Otherwise use two separate repos or two separate folders.

---

## 14) Build order

### Phase 1

* setup repo(s)
* database schema
* import customers/orders
* customer and order views

### Phase 2

* manual segment builder
* segment preview
* derived metrics

### Phase 3

* campaign creation
* message editor
* approve/send flow

### Phase 4

* channel service
* callbacks
* communication event tracking

### Phase 5

* analytics dashboard
* campaign detail page

### Phase 6

* AI segment suggestion
* AI copy generation
* AI insights

### Phase 7

* polish
* empty states
* loading states
* error handling
* demo data seeding

---

## 15) Quality rules

These are strict.

* No giant service files.
* No mixed business logic in controllers.
* No AI code without validation.
* No raw SQL injection risk from AI output.
* No hardcoded production secrets.
* No brittle callback handling.
* No fake screens that do not connect to real backend data.
* No overbuilding unrelated CRM features.

---

## 16) Deployment rules

* Keep each service independently deployable.
* Use environment variables for all endpoints and keys.
* Make the frontend tolerant of backend latency.
* Make the channel service resilient to retries.
* Use seeded demo data so the walkthrough always works.

### Safe deployment stack

* Vercel for frontend
* Render/Fly.io/Railway for backend and channel service
* Supabase/Neon for Postgres

---

## 17) AI provider strategy

Use a provider abstraction.

### Interface

```ts
interface AiProvider {
  generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion>;
  generateMessage(input: MessagePrompt): Promise<MessageSuggestion>;
  generateInsights(input: InsightPrompt): Promise<InsightSummary>;
}
```

### Implementations

* GithubModelsProvider
* GeminiProvider
* MockProvider for local development

### Runtime strategy

* use GitHub Models first if available
* fallback to Gemini
* fallback to mock responses during local demos

This prevents quota failure from breaking your app.

---

## 18) Agent instruction file templates

Use these as the starting point for your agents.

### 18.1 Product/Planning agent

**Role:** product architect

**Instruction:**

* define the minimal product scope only
* keep the product aligned with the assignment brief
* reject sales CRM / support CRM ideas
* prioritize demo reliability over novelty
* write crisp acceptance criteria for each feature
* identify anything that should not be built

**Output format:**

* objective
* scope
* non-goals
* acceptance criteria
* risks
* next tasks

---

### 18.2 Backend agent

**Role:** NestJS backend engineer

**Instruction:**

* build clean module boundaries
* keep controllers thin
* keep business logic in services
* use Prisma for persistence
* implement validated DTOs
* create idempotent callback endpoints
* handle retries safely
* prefer simple, reliable code over abstractions

**Non-negotiables:**

* no raw AI output written to DB without validation
* no complex workflow engine
* no unnecessary background jobs unless needed for the simulation loop

---

### 18.3 Frontend agent

**Role:** React/Next.js UI engineer

**Instruction:**

* build a clean dashboard UI
* prioritize campaign studio and analytics pages
* use reusable components
* show loading/empty/error states
* avoid overdesign
* keep forms short and testable

**Visual style:**

* modern SaaS dashboard
* white background
* restrained accent color
* clear typography
* readable tables and cards

---

### 18.4 AI agent

**Role:** AI integration engineer

**Instruction:**

* never call LLMs inside tight loops
* generate structured JSON outputs only
* validate all AI responses
* keep prompts narrow and deterministic
* use few-shot examples if needed
* add fallback mock responses for local development

**Primary jobs:**

* segment suggestion
* campaign copy generation
* channel recommendation
* insights summary

---

### 18.5 QA / integration agent

**Role:** test and reliability engineer

**Instruction:**

* test the full campaign flow end to end
* verify callback ordering
* verify failure paths
* verify imported sample data
* verify dashboard metrics update correctly
* verify AI fallback works without breaking UI

**Must test:**

* CSV import
* segment preview
* campaign send
* callback ingestion
* analytics refresh
* AI fallback mode

---

## 19) Prompt pack for agents

Use these prompts to delegate work cleanly.

### Product spec prompt

"Define the smallest viable AI-native shopper outreach CRM for the Xeno assignment. Include scope, non-goals, must-have flows, and risks."

### Backend prompt

"Generate NestJS module boundaries, Prisma schema, and REST endpoints for customers, orders, segments, campaigns, communications, analytics, and AI integration. Keep it deployment-safe."

### Frontend prompt

"Generate a Next.js dashboard app plan with pages for dashboard, customers, orders, segment builder, campaign studio, campaign detail, and analytics. Use shadcn/ui and keep the UI minimal."

### AI prompt

"Design a safe AI workflow for segment suggestion, message generation, channel recommendation, and analytics summary. Output structured JSON and include validation rules."

### QA prompt

"Create end-to-end tests for import, segmentation, campaign send, simulated callback events, and analytics updates. Include failure cases and fallback AI mode."

---

## 20) Demo script

Use this exact narrative in the walkthrough video.

1. Explain the product goal in one sentence.
2. Upload customer and order data.
3. Show the AI suggesting a segment.
4. Show manual edits to the segment.
5. Generate a message.
6. Review and approve the campaign.
7. Trigger send.
8. Show the separate channel service simulation.
9. Show callback events arriving.
10. Open analytics and explain performance.
11. Mention deployment and tradeoffs.
12. Explain what was intentionally left out.

---

## 21) Explicit tradeoffs to mention in the submission

These make the project look thoughtful.

* Real channel providers were stubbed intentionally.
* AI is used in bounded high-value steps only.
* Segments are rule-based under the hood for reliability.
* Analytics are campaign-focused instead of warehouse-scale.
* The system is optimized for clarity and demo reliability, not enterprise breadth.

---

## 22) Definition of done

The project is done when:

* customer and order data can be imported
* segments can be created and previewed
* AI can suggest a segment and message
* campaign can be approved and sent
* channel service emits simulated lifecycle events
* callback events update the CRM
* analytics reflect the campaign state
* the product is deployed and demoable

---

## 23) Final implementation rule

Do not let agents wander.
Keep every agent attached to one of these outputs:

* product decisions
* backend code
* frontend code
* AI prompts and validation
* tests and deployment

That is how you move fast without creating a broken codebase.
