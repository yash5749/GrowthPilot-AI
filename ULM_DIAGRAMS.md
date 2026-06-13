# UML Diagrams — GrowthPilot AI

This document captures the current architecture of the repository as implemented in the codebase.

## 1) System context

```mermaid
flowchart LR
  Brand[Consumer Brand / Marketer]
  Web[GrowthPilot Web App\nNext.js]
  API[GrowthPilot CRM API\nNestJS + Prisma]
  Channel[Stubbed Channel Service\nNestJS Simulator]
  DB[(PostgreSQL)]
  AI[AI Provider\nMock / GitHub Models / Gemini]

  Brand -->|Uses UI| Web
  Web -->|REST /api| API
  API -->|Read/Write| DB
  API -->|AI requests| AI
  API -->|Send communication| Channel
  Channel -->|Callback events| API
```

## 2) High-level component diagram

```mermaid
flowchart TB
  subgraph Web["growthpilot-web"]
    W1[Dashboard]
    W2[Customers]
    W3[Segments]
    W4[Campaigns]
    W5[Analytics]
    W6[Shared UI + API client]
  end

  subgraph API["growthpilot-api"]
    A1[Health Module]
    A2[Customers Module]
    A3[Orders Module]
    A4[Segments Module]
    A5[Campaigns Module]
    A6[Communications Module]
    A7[Analytics Module]
    A8[AI Module]
    A9[Channel Client Module]
    A10[DB Module / Prisma Service]
  end

  subgraph Channel["growthpilot-channel"]
    C1[Channel Controller]
    C2[Channel Service]
    C3[Simulator Service]
    C4[Channel Config]
  end

  subgraph Infra["External / Infra"]
    P[(PostgreSQL)]
    AIProv[AI Provider Endpoint]
  end

  W6 -->|GET/POST /api/*| API
  API --> A10
  A8 --> AIProv
  A5 --> A4
  A5 --> A9
  A6 -->|receives callbacks| C1
  C2 --> C3
  C3 --> C4
  A10 --> P
```

## 3) Backend module dependency diagram

```mermaid
flowchart LR
  App[AppModule]

  App --> Config[ConfigModule]
  App --> Db[DbModule]
  App --> Health[HealthModule]
  App --> Customers[CustomersModule]
  App --> Orders[OrdersModule]
  App --> Segments[SegmentsModule]
  App --> Campaigns[CampaignsModule]
  App --> Communications[CommunicationsModule]
  App --> Analytics[AnalyticsModule]
  App --> AI[AiModule]
  App --> ChannelClient[ChannelClientModule]

  Campaigns --> Segments
  Campaigns --> ChannelClient
  Segments --> AI
  AI --> Db
  Customers --> Db
  Orders --> Db
  Communications --> Db
  Analytics --> Db
  ChannelClient --> Config
```

## 4) Core data model

```mermaid
erDiagram
  CUSTOMER {
    string id PK
    string name
    string email UK
    string phone
    string city
    datetime createdAt
    datetime updatedAt
  }

  ORDER {
    string id PK
    string customerId FK
    float orderTotal
    string currency
    datetime orderedAt
    string channel
    string status
    datetime createdAt
    datetime updatedAt
  }

  SEGMENT {
    string id PK
    string name
    string description
    json ruleJson
    boolean aiGenerated
    datetime createdAt
    datetime updatedAt
  }

  CAMPAIGN {
    string id PK
    string name
    string objective
    string segmentId FK
    string messageTemplate
    string channel
    string status
    datetime createdAt
    datetime sentAt
    datetime updatedAt
  }

  COMMUNICATION {
    string id PK
    string campaignId FK
    string customerId FK
    string channel
    string messageRendered
    string status
    datetime sentAt
    datetime deliveredAt
    datetime openedAt
    datetime readAt
    datetime clickedAt
    datetime purchasedAt
    string failureReason
    datetime createdAt
    datetime updatedAt
  }

  COMMUNICATION_EVENT {
    string id PK
    string communicationId FK
    string eventType
    json payloadJson
    datetime createdAt
  }

  CUSTOMER ||--o{ ORDER : places
  CUSTOMER ||--o{ COMMUNICATION : receives
  SEGMENT ||--o{ CAMPAIGN : targets
  CAMPAIGN ||--o{ COMMUNICATION : creates
  COMMUNICATION ||--o{ COMMUNICATION_EVENT : logs
  CUSTOMER ||--o{ COMMUNICATION : participates_in
```

## 5) Campaign creation and send workflow

```mermaid
sequenceDiagram
  autonumber
  participant U as Marketer
  participant W as Web App
  participant API as CRM API
  participant S as SegmentsService
  participant C as CampaignsService
  participant DB as PostgreSQL
  participant CH as Channel Service

  U->>W: Create campaign
  W->>API: POST /api/campaigns
  API->>S: Validate segmentId exists
  S->>DB: Read segment
  DB-->>S: Segment found
  S-->>API: OK
  API->>DB: Insert campaign (draft)
  DB-->>API: Campaign created
  API-->>W: Campaign response

  U->>W: Approve campaign
  W->>API: POST /api/campaigns/:id/approve
  API->>DB: Update campaign status = approved
  DB-->>API: OK
  API-->>W: approved

  U->>W: Send campaign
  W->>API: POST /api/campaigns/:id/send
  API->>S: Preview target segment
  S->>DB: Load customers + orders
  DB-->>S: Matching customers
  S-->>API: Audience list
  API->>DB: Update campaign status = sent, sentAt = now
  loop For each customer
    API->>DB: Upsert communication (pending)
    API->>CH: POST /channel/send
    CH-->>API: accepted
  end
  API-->>W: audienceSize + campaign details
```

## 6) Channel callback lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant API as CRM API
  participant CH as Channel Service
  participant SIM as Simulator
  participant DB as PostgreSQL

  API->>CH: POST /channel/send
  CH->>SIM: simulate communication lifecycle
  SIM->>API: POST /api/callbacks/channel-event (sent)
  API->>DB: Create event + update communication
  DB-->>API: OK

  opt delivery succeeds
    SIM->>API: POST /api/callbacks/channel-event (delivered)
    API->>DB: Add event + set deliveredAt/status
    DB-->>API: OK

    opt user opens message
      SIM->>API: POST /api/callbacks/channel-event (opened)
      API->>DB: Add event + set openedAt/status
      DB-->>API: OK

      opt user reads message
        SIM->>API: POST /api/callbacks/channel-event (read)
        API->>DB: Add event + set readAt/status
        DB-->>API: OK

        opt user clicks
          SIM->>API: POST /api/callbacks/channel-event (clicked)
          API->>DB: Add event + set clickedAt/status
          DB-->>API: OK

          opt purchase attributed
            SIM->>API: POST /api/callbacks/channel-event (purchased)
            API->>DB: Add event + set purchasedAt/status
            DB-->>API: OK
          end
        end
      end
    end
  end

  alt delivery fails
    SIM->>API: POST /api/callbacks/channel-event (failed)
    API->>DB: Add event + set failureReason/status
    DB-->>API: OK
  end
```

## 7) Segment rule evaluation

```mermaid
flowchart TD
  A[Segment.ruleJson] --> B{Rule type present?}
  B -->|city| C[Compare customer.city]
  B -->|city_in| D[Check city in allowed list]
  B -->|orderCount_gte / lte| E[Count orders]
  B -->|totalSpent_gte / lte| F[Sum orderTotal]
  B -->|lastOrderDays_gte / lte| G[Find latest order date]

  C --> H{All conditions pass?}
  D --> H
  E --> H
  F --> H
  G --> H

  H -->|Yes| I[Customer matches segment]
  H -->|No| J[Customer excluded]
```

## 8) AI workflow

```mermaid
flowchart LR
  Goal[Business goal / marketer prompt] --> AIAPI[AI Controller]
  AIAPI --> AISvc[AiService]
  AISvc --> DB[Prisma / live context]
  AISvc --> Provider[AI Provider interface]

  Provider --> Mock[Mock provider]
  Provider --> GitHub[GitHub Models provider]
  Provider --> Gemini[Gemini provider]

  DB --> AISvc

  AISvc --> Segment[Segment suggestion]
  AISvc --> Message[Message suggestion]
  AISvc --> Channel[Channel recommendation]
  AISvc --> Insights[Campaign insights]
```

## 9) Analytics pipeline

```mermaid
flowchart LR
  DB[(PostgreSQL)] --> A1[AnalyticsService]
  A1 --> C1[Count communications by status]
  A1 --> C2[Compute delivery/open/read/click/conversion rates]
  A1 --> C3[Attribute revenue from completed orders]
  C1 --> UI1[Dashboard analytics]
  C2 --> UI1
  C3 --> UI1
  UI1 --> Web[Analytics page / Dashboard page]
```

## 10) Deployment view

```mermaid
flowchart TB
  subgraph Client
    Browser[Browser]
  end

  subgraph Frontend
    Next[Next.js Web App]
  end

  subgraph Backend
    CRM[NestJS CRM API\nport 4000]
    Channel[NestJS Channel Service\nport 4001]
  end

  subgraph Data
    PG[(PostgreSQL)]
  end

  subgraph External
    AIProv[AI Provider API]
  end

  Browser --> Next
  Next -->|NEXT_PUBLIC_API_URL| CRM
  CRM --> PG
  CRM --> Channel
  CRM --> AIProv
  Channel -->|callback POST| CRM
```

## 11) Request / route map

```mermaid
flowchart LR
  Web[Web UI] --> D[GET /api/analytics/dashboard]
  Web --> C1[GET /api/customers]
  Web --> C2[POST /api/customers]
  Web --> O1[GET /api/orders]
  Web --> O2[POST /api/orders]
  Web --> S1[GET /api/segments]
  Web --> S2[POST /api/segments]
  Web --> S3[POST /api/segments/:id/preview]
  Web --> S4[POST /api/segments/ai-suggest]
  Web --> K1[GET /api/campaigns]
  Web --> K2[POST /api/campaigns]
  Web --> K3[POST /api/campaigns/:id/approve]
  Web --> K4[POST /api/campaigns/:id/send]
  Web --> M1[GET /api/communications]
  Web --> M2[GET /api/campaigns/:id/communications]
  Web --> A1[POST /api/ai/segment]
  Web --> A2[POST /api/ai/message]
  Web --> A3[POST /api/ai/recommend-channel]
  Web --> A4[POST /api/ai/insights]
  CH[Channel Service] --> CB[POST /api/callbacks/channel-event]
```

## 12) Design notes

- `Campaign` is a two-step lifecycle: `draft -> approved -> sent`.
- `Communication` is the atomic unit of delivery and attribution.
- Callback handling is idempotent at the `(communicationId, eventType)` level.
- Status progression is monotonic; later events only overwrite earlier states.
- Segment evaluation is rule-driven through `ruleJson`, not hardcoded per segment.
- AI is pluggable through an interface, so provider choice does not affect business logic.
- The channel service is intentionally stubbed and asynchronous to model real-world delivery systems.

## 13) What this project is solving

This repository implements a shopper outreach CRM, not a sales pipeline CRM. The core flow is:

1. ingest customers and orders,
2. build or generate segments,
3. create campaigns from those segments,
4. send messages through the stubbed channel service,
5. collect delivery/engagement callbacks,
6. surface analytics and attribution.

