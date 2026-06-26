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
    FE["Frontend<br/>React + TS"]:::done
    API["Core REST API<br/>FastAPI"]:::done
    OPT["Optimizer<br/>Markowitz, cvxpy"]:::done
    DATA["Market data<br/>FMP + cache"]:::done
    DB["Database<br/>SQLAlchemy"]:::done
    FUTURE["Planned: efficient frontier, backtesting,<br/>more solvers, async jobs, auth, deploy"]:::future

    FE -->|requests| API
    API --> OPT
    API --> DATA
    API --> DB
    API -.-> FUTURE

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
