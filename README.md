# PortfoliU — Optimal Portfolio Construction via Convex Optimization

A full-stack web application that builds mathematically optimal stock portfolios
with convex optimization, backtests them against simple index strategies, and
teaches the theory behind them — wrapped in a three-tier product (Free / Pro /
Course).

- **Backend:** FastAPI + cvxpy + pandas/numpy, async SQLAlchemy (Supabase Postgres), Redis/in-memory cache
- **Frontend:** React + TypeScript (Vite), TanStack Query, Recharts
- **Auth:** Supabase (email/password + Google), JWT verified server-side via JWKS
- **Data:** Financial Modeling Prep (real EOD prices) with a deterministic synthetic fallback

## Features

- **Optimizer** — minimum variance, maximum Sharpe, target return/risk, **risk parity**, **maximum diversification**, **CVaR** (downside risk), and **net-of-cost** objectives; sample / Ledoit-Wolf shrinkage / EWMA / **PCA factor** risk models; **Black-Litterman** return estimates; sector & per-asset constraints; the **efficient frontier**.
- **Backtesting** — walk-forward, no look-ahead, configurable cadence, transaction costs, turnover constraints & no-trade bands; vs **index / equal-weight / 60-40** benchmarks; equity / drawdown / rolling-Sharpe charts and full metrics (CAGR, Sortino, Calmar, alpha/beta/IR).
- **Compare** — async parameter sweeps streamed over **WebSocket** as a live Sharpe heatmap.
- **Tiers** — Free (limited), Pro (everything + demo checkout), Course (a Coursera-style LMS with topics, quizzes, a 90%-to-pass final exam, and a **verifiable certificate**). Limits enforced server-side; see `docs/GOING_LIVE.md`.
- **Saved portfolios**, CSV export, and a public credential verification page.

## The math (formulations & assumptions)

Estimate the mean vector `μ` and covariance `Σ` from historical returns, then solve a convex program over weights `w`:

- **Min variance:** `min wᵀΣw  s.t. 1ᵀw = 1, bounds`
- **Target return:** add `μᵀw ≥ R`
- **Max Sharpe:** maximize `(μ−r_f)ᵀw / √(wᵀΣw)` — non-convex, made convex via the Charnes–Cooper transform (scale-invariance ⇒ fix excess return = 1, minimize variance).
- **Risk parity:** convex log-barrier `min ½wᵀΣw − Σ ln(w_i)`, then normalize.
- **Max diversification:** maximize `(wᵀσ)/√(wᵀΣw)` via the same scaling trick.
- **CVaR:** Rockafellar–Uryasev linear program over historical scenarios.
- **Net-of-cost:** `max μᵀw − γ·wᵀΣw − c·‖w − w_prev‖₁`.

**Assumptions:** returns are roughly stationary over the lookback; `Σ` is PSD (guaranteeing convexity); sample means are noisy (mitigated by shrinkage / factor models / Black-Litterman); variance is a proxy for risk (complemented by CVaR/drawdown). See the **Course** for the full treatment.

## Results

On a 5-year walk-forward backtest, the optimized portfolio beats every benchmark on risk-adjusted return — e.g. **Sharpe ≈ 0.48 vs ~0.20** for SPY / equal-weight / 60-40, with positive alpha and lower drawdown than the index. (Absolute figures use synthetic data unless an FMP key is set; the *relationships* hold.)

## Architecture

See `ARCHITECTURE.md` for diagrams. In brief:

```
frontend/  React SPA (Vite)  ──HTTP/WS──▶  backend/  FastAPI
                                            ├─ app/data        market data + cache + sectors
                                            ├─ app/optimizer    cvxpy engine, risk models, BL
                                            ├─ app/backtest     walk-forward engine + analytics
                                            ├─ app/jobs         async sweep runner + WebSocket
                                            ├─ app/auth         Supabase JWT, plans, gating
                                            ├─ app/education    course content + quizzes + certs
                                            ├─ app/portfolios   saved portfolios
                                            └─ app/api          REST routes
```

## Quick start (local, no Docker)

```bash
# backend
cd backend && python3 -m venv .venv && ./.venv/bin/pip install -e ".[dev]"
cp .env.example .env   # fill SUPABASE_URL, DATABASE_URL (Supabase Postgres), optional FMP_API_KEY
./.venv/bin/uvicorn app.main:app --reload --port 8000

# frontend
cd frontend && npm install && cp .env.example .env   # fill VITE_SUPABASE_* and VITE_SUPABASE_ANON_KEY
npm run dev   # http://localhost:5173  (proxies /api → :8000)
```

API docs: http://localhost:8000/docs. With `DATA_PROVIDER=auto` the backend uses FMP when a key is present, else the synthetic provider.

## Testing & linting

```bash
cd backend && ./.venv/bin/pytest --cov=app --cov-fail-under=80 && ./.venv/bin/ruff check .
cd frontend && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs both, with an 80% backend coverage gate.

## Deployment

- **Backend + Redis:** `render.yaml` (Render). Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `FMP_API_KEY` as env secrets.
- **Frontend:** `frontend/vercel.json` (Vercel). Set `VITE_*` env vars and `VITE_DEMO_BYPASS=false`.
- Before launch, follow `docs/GOING_LIVE.md` (tier matrix + removing the demo payment bypass).

## Status

Weeks 1–5 complete: optimizer, frontier/risk-models/constraints, backtesting & benchmarks, advanced & robust optimization + async jobs, and persistence/auth/tiers/course/deployment-config.
