# Optimal Portfolio Construction via Convex Optimization

A full-stack web application that builds optimal stock portfolios using convex
optimization, layers in practical investment constraints, and (in later weeks)
backtests them against a simple index-fund strategy.

- **Backend:** FastAPI + cvxpy + pandas/numpy, async SQLAlchemy, Redis cache
- **Frontend:** React + TypeScript (Vite), TanStack Query, Recharts
- **Data:** Financial Modeling Prep (real EOD prices) with a deterministic
  synthetic provider fallback so the app runs with zero configuration

## Week 1 scope

A complete end-to-end slice: pick tickers → fetch real price history → estimate
returns and covariance → solve a Markowitz mean-variance program → render the
optimal allocation.

Supported objectives: **minimum variance**, **maximum Sharpe**, **target
return**, and **target risk**, all with long-only and per-asset weight bounds.

## Architecture

```
frontend/  React SPA (Vite)  ──HTTP──▶  backend/  FastAPI
                                          ├─ app/data        market-data providers + cache
                                          ├─ app/optimizer    cvxpy Markowitz engine
                                          ├─ app/schemas      pydantic request/response models
                                          ├─ app/db           async SQLAlchemy models/session
                                          └─ app/api          REST routes
```

## Quick start (local, no Docker)

### Backend

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -e ".[dev]"
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (Vite proxies `/api` to the backend on port 8000).

### Using real market data (FMP)

The app runs out of the box with a synthetic data provider. To use real prices,
create `backend/.env` (copy `backend/.env.example`) and set your key:

```
FMP_API_KEY=your_key_here
```

With `DATA_PROVIDER=auto` the backend automatically switches to FMP once a key is
present. Force a provider with `DATA_PROVIDER=fmp` or `DATA_PROVIDER=sample`.

## API

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/health`              | Service status and active data provider      |
| GET    | `/api/universe`            | Curated ticker universe with sectors         |
| GET    | `/api/prices`              | EOD price history for tickers                 |
| POST   | `/api/optimize`            | Solve a portfolio optimization               |
| GET    | `/api/optimize/history`    | Recent optimization runs                     |
| GET    | `/api/optimize/runs/{id}`  | A single optimization run                    |

Example:

```bash
curl -X POST http://localhost:8000/api/optimize \
  -H 'content-type: application/json' \
  -d '{"tickers":["AAPL","MSFT","GOOGL","JPM","JNJ"],"objective":"max_sharpe"}'
```

## Testing & linting

```bash
cd backend
./.venv/bin/pytest -q
./.venv/bin/ruff check .
```

## Docker (optional, for later weeks)

```bash
docker compose up --build
```

Brings up Postgres, Redis, the API, and the built frontend.

## Roadmap

- **Week 1 (this milestone):** end-to-end mean-variance optimizer + web UI
- **Week 2:** efficient frontier, shrinkage/EWMA risk models, sector constraints
- **Week 3:** walk-forward backtesting, turnover constraints, benchmark comparison
- **Week 4:** robust / CVaR / risk-parity optimization, async jobs over WebSockets
- **Week 5:** auth, saved portfolios, reporting, deployment, documentation
