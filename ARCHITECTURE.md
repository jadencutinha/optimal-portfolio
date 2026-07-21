# Halo System Architecture

Halo is a full stack web app for building mathematically optimal stock portfolios with convex optimization, learning the theory, paper trading, and competing with friends. The diagrams below are written in Mermaid so they render directly on GitHub.

---

## Deployment topology

Three managed platforms host the system. The environment variables that wire the pieces together are labelled on the edges.

```mermaid
flowchart LR
    User(["User in browser"])

    subgraph VERCEL["Vercel"]
        SPA["React SPA<br/>Vite build · CDN · SPA rewrite"]
    end

    subgraph RENDER["Render"]
        direction TB
        API["FastAPI web service<br/>Uvicorn ASGI"]
        REDIS[("Redis cache<br/>optional")]
    end

    subgraph SUPABASE["Supabase"]
        direction TB
        AUTH["Auth service<br/>Google · email"]
        PG[("Postgres")]
    end

    subgraph EXT["External APIs"]
        direction TB
        FMP["Financial Modeling Prep<br/>market data"]
        LLM["Anthropic · OpenAI<br/>AI assistant"]
        STRIPE["Stripe<br/>Pro subscriptions"]
    end

    User -->|"HTTPS"| SPA
    SPA -->|"OAuth · email login"| AUTH
    SPA -->|"REST · VITE_API_URL"| API
    API -.->|"CORS_ORIGINS allowlist"| SPA
    API -->|"REDIS_URL"| REDIS
    API -->|"verify JWT · JWKS"| AUTH
    API -->|"SQL · asyncpg"| PG
    API -->|"EOD prices"| FMP
    API -->|"assistant prompts"| LLM
    API -->|"checkout · webhooks"| STRIPE

    classDef vercel fill:#eaf1ff,stroke:#3f6fd6,color:#12233f
    classDef render fill:#e7f8f1,stroke:#12a37a,color:#0a3a2b
    classDef supa fill:#e9f9ef,stroke:#2bb673,color:#0c3a24
    classDef ext fill:#fff4e6,stroke:#e0912f,color:#5a3410
    classDef store fill:#f1ebff,stroke:#7c5cd6,color:#291a52
    classDef actor fill:#0f2630,stroke:#d4af37,color:#f0d98c

    class SPA vercel
    class API render
    class AUTH,PG supa
    class REDIS store
    class FMP,LLM,STRIPE ext
    class User actor

    style VERCEL fill:#f6f9ff,stroke:#c5d7f7,color:#274a86
    style RENDER fill:#f2fbf8,stroke:#bfe9dc,color:#0a6b50
    style SUPABASE fill:#f3fbf6,stroke:#c4ecd6,color:#118a56
    style EXT fill:#fffaf1,stroke:#f0d9b5,color:#8a5a1f
```

- The frontend builds with Vite and serves as static files behind Vercel's CDN. A rewrite sends only extensionless routes to `index.html`, so real assets are served directly.
- The backend is a single FastAPI service on Render started with Uvicorn. Redis is optional; when `REDIS_URL` is absent the cache falls back to an in memory store.
- Supabase manages Auth and Postgres. The API never holds passwords, it only verifies signed tokens.

---

## System architecture

The internal layers, from the browser down to the data and external services. The frontend renders one of three plan-gated workspaces; the backend is a thin routing layer over domain services and shared infrastructure, wired together by dependency injection.

```mermaid
flowchart TB
    User(["User"])

    subgraph FE["Frontend · React SPA on Vercel"]
        direction TB
        PROV["Providers<br/>React Query · Auth session · Theme · Toast"]
        WS["Workspaces · plan gated<br/>Landing · Free · Course · Pro"]
        FEAT["Feature pages<br/>Analyze · Learn · Invest · AI Assistant"]
        DL["Data layer<br/>Axios + JWT interceptor · React Query · supabase-js"]
    end

    subgraph BE["Backend · FastAPI on Render"]
        direction TB
        MW["Middleware<br/>CORS · logging · errors · rate limit"]
        ROUTES["API routers · /api<br/>Analyze · Learn · Invest · Game · Assistant · Billing · Account"]
        subgraph DOM["Domain services"]
            direction LR
            DAN["Analyze<br/>optimizer · backtest · planner · factors · tracking"]
            DLE["Learn<br/>education · behavioral · certificates"]
            DIV["Invest & Game<br/>paper-trading ledger · order fills · simulation"]
            DX["Assistant · Billing · Reports<br/>LLM client · Stripe · PDF"]
        end
        subgraph INF["Infrastructure"]
            direction LR
            DP["Data provider + cache<br/>returns · sectors · universe"]
            REPO["Repositories<br/>SQLAlchemy async"]
            SYS["Auth verifier · Jobs · Observability<br/>JWKS · async sweeps · Sentry"]
        end
    end

    subgraph SVC["Data & external services"]
        direction LR
        PG[("Supabase Postgres")]
        RD[("Redis cache")]
        SA["Supabase Auth"]
        FMP["Financial Modeling Prep"]
        LLM["Anthropic · OpenAI"]
        ST["Stripe"]
    end

    User --> PROV
    PROV --> WS
    WS --> FEAT
    FEAT --> DL
    DL -->|"REST · Bearer JWT"| MW
    DL -->|"session"| SA
    MW --> ROUTES
    ROUTES --> DOM
    DOM --> INF

    REPO --> PG
    DP --> RD
    DP --> FMP
    SYS --> SA
    DX --> LLM
    DX --> ST

    classDef fe fill:#eaf1ff,stroke:#3f6fd6,color:#12233f
    classDef be fill:#e7f8f1,stroke:#12a37a,color:#0a3a2b
    classDef ext fill:#fff4e6,stroke:#e0912f,color:#5a3410
    classDef store fill:#f1ebff,stroke:#7c5cd6,color:#291a52
    classDef actor fill:#0f2630,stroke:#d4af37,color:#f0d98c

    class PROV,WS,FEAT,DL fe
    class MW,ROUTES,DAN,DLE,DIV,DX,DP,REPO,SYS be
    class FMP,LLM,ST,SA ext
    class PG,RD store
    class User actor

    style FE fill:#f6f9ff,stroke:#c5d7f7,color:#274a86
    style BE fill:#f2fbf8,stroke:#bfe9dc,color:#0a6b50
    style SVC fill:#fffaf1,stroke:#f0d9b5,color:#8a5a1f
    style DOM fill:#eafaf3,stroke:#c9ece0,color:#0a6b50
    style INF fill:#eafaf3,stroke:#c9ece0,color:#0a6b50
```

### Data model

Persistent state lives in Supabase Postgres, defined by the SQLAlchemy models in `app/db/models.py`. The `profiles` table is the hub for everything a signed in user owns; its id equals the Supabase user id. Price bars, optimization runs, and backtest runs are global rather than user scoped.

```mermaid
erDiagram
    PROFILES ||--o{ SAVED_PORTFOLIOS : owns
    PROFILES ||--o{ ENROLLMENTS : has
    PROFILES ||--o{ TOPIC_PROGRESS : tracks
    PROFILES ||--o{ EXAM_RESULTS : records
    PROFILES ||--o{ CERTIFICATES : earns
    PROFILES ||--o| INVEST_ACCOUNTS : holds
    PROFILES ||--o{ INVEST_POSITIONS : holds
    PROFILES ||--o{ INVEST_ORDERS : places
    PROFILES ||--o{ INVEST_EQUITY_POINTS : logs
    PROFILES ||--o| BILLING_CUSTOMERS : billed_as

    PROFILES {
        string id PK
        string email
        string plan
        bool plan_selected
        datetime created_at
    }
    SAVED_PORTFOLIOS {
        int id PK
        string user_id FK
        string name
        string objective
        string risk_model
        json tickers
        json weights
        json metrics
    }
    ENROLLMENTS {
        int id PK
        string user_id FK
        string course_id
    }
    TOPIC_PROGRESS {
        int id PK
        string user_id FK
        string course_id
        string topic_id
    }
    EXAM_RESULTS {
        int id PK
        string user_id FK
        string course_id
        int score
        bool passed
    }
    CERTIFICATES {
        int id PK
        string user_id FK
        string course_id
        string credential_id
        datetime issued_at
    }
    INVEST_ACCOUNTS {
        string user_id PK
        float cash
        float starting_balance
        datetime created_at
    }
    INVEST_POSITIONS {
        int id PK
        string user_id FK
        string symbol
        float qty
        float cost_basis
    }
    INVEST_ORDERS {
        int id PK
        string user_id FK
        string symbol
        string side
        string status
        float notional
        datetime submitted_at
    }
    INVEST_EQUITY_POINTS {
        int id PK
        string user_id FK
        datetime ts
        float equity
    }
    BILLING_CUSTOMERS {
        string user_id PK
        string stripe_customer_id
        string stripe_subscription_id
        string status
    }
    PRICE_BARS {
        int id PK
        string provider
        string ticker
        date bar_date
        float close
    }
    OPTIMIZATION_RUNS {
        int id PK
        string objective
        json request
        json weights
        json metrics
    }
    BACKTEST_RUNS {
        int id PK
        json config
        json result
    }
```

A certificate carries a unique `credential_id` that backs a public verification page, so a completed track can be shared and checked by anyone. The `invest_*` tables are a self contained paper trading ledger, and `billing_customers` links a profile to its Stripe subscription.
