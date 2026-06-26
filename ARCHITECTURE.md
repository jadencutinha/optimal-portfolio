# Architecture (rough sketch)

Quick map of what is built versus what is still planned. Solid green boxes are
done. Dashed grey boxes are future work, tagged with the milestone (M2 to M5)
they belong to. Not exhaustive, just the shape of the system.

## System

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
flowchart TD
    subgraph FE["Frontend (React + TS + Vite)"]
        FE1["OptimizerPage: TickerInput, ObjectiveControls,<br/>StatCards, AllocationChart, WeightsTable"]:::done
        FE2["API client + TanStack Query"]:::done
        FE3["Whitepaper page"]:::done
        FE4["Efficient-frontier chart (M2)"]:::future
        FE5["Backtest charts (M3)"]:::future
        FE6["Risk questionnaire (M2)"]:::future
        FE7["Login / saved portfolios UI (M5)"]:::future
    end

    subgraph API["Core REST API (FastAPI, /api)"]
        API1["GET /health"]:::done
        API2["GET /universe"]:::done
        API3["GET /prices"]:::done
        API4["POST /optimize"]:::done
        API5["GET /optimize/history"]:::done
        API6["GET /optimize/runs/{id}"]:::done
        API7["WS /optimize/jobs, async progress (M4)"]:::future
        API8["POST /backtest (M3)"]:::future
        API9["GET /frontier (M2)"]:::future
        API10["Auth: /login /register + protected routes (M5)"]:::future
    end

    subgraph OPT["Optimizer engine"]
        OPT1["Markowitz solver (cvxpy): min_variance,<br/>max_sharpe, target_return, target_risk"]:::done
        OPT2["Weight bounds, long-only"]:::done
        OPT3["Efficient frontier (M2)"]:::future
        OPT4["Sector / position constraints (M2)"]:::future
        OPT5["Turnover limits (M3)"]:::future
        OPT6["Walk-forward backtest (M3)"]:::future
        OPT7["Robust / CVaR / risk-parity (M4)"]:::future
    end

    subgraph DATA["Data layer"]
        DATA1["DataProvider abstraction"]:::done
        DATA2["FMPProvider, real EOD prices"]:::done
        DATA3["SampleProvider, synthetic fallback"]:::done
        DATA4["CachingProvider"]:::done
        DATA5["Returns / covariance calc"]:::done
        DATA6["Curated universe"]:::done
        DATA7["Shrinkage / EWMA risk models (M2)"]:::future
        DATA8["Index constituents, SPY / 60-40 (M3)"]:::future
    end

    subgraph DB["Persistence (SQLAlchemy)"]
        DB1["Optimization runs, saved"]:::done
        DB2["Price history, stored"]:::done
        DB3["SQLite, local"]:::done
        DB4["Postgres, deploy (M5)"]:::future
        DB5["Users / saved portfolios (M5)"]:::future
    end

    subgraph CACHE["Cache"]
        C1["Redis, prod"]:::done
        C2["In-memory fallback, local"]:::done
    end

    subgraph EXT["Deploy / external"]
        EXT1["Docker / CI to public URL (M5)"]:::future
        EXT2["PDF export / reporting (M5)"]:::future
    end

    FE2 -->|HTTP JSON| API4
    FE5 -.WebSockets M4.-> API7
    API4 --> OPT1
    OPT1 --> DATA1
    DATA1 --> DATA2
    DATA1 --> DATA3
    DATA4 --> C1
    API4 --> DB1
    DB3 --> DB1

    classDef done fill:#e7f6e7,stroke:#2e7d32,color:#10210f;
    classDef future fill:#f7f7f7,stroke:#999,color:#555,stroke-dasharray: 5 5;
```

## Roadmap

```mermaid
---
config:
  look: handDrawn
  theme: neutral
---
timeline
    title Five-week plan
    Week 1 (done) : Walking skeleton, end to end : pick tickers to optimize to weights + metrics on real data
    Week 2 : Efficient frontier : Shrinkage / EWMA risk models : Sector / position constraints : Risk questionnaire
    Week 3 : Walk-forward backtest : Turnover limits : Benchmark vs SPY and 60/40 : Behavioral-bias detection
    Week 4 : Robust / CVaR / risk-parity solvers : Async jobs over WebSockets
    Week 5 : Auth + saved portfolios : PDF export : Postgres : Deploy to public URL
```

## One-liner

Built: the full vertical slice, frontend to REST API to Markowitz solver to real
data to database, for the core max-Sharpe / min-variance flow. Future work mostly
widens that slice (more solvers, risk models, backtesting) plus production concerns
(auth, async, deploy). Every architectural layer already exists; the rest bolts
onto layers that are already standing.
