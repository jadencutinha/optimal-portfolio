# Going Live

## Tier feature matrix

| Feature | Free | Pro | Course |
|---|---|---|---|
| Optimizer (min-variance, max-Sharpe) | ✅ | ✅ | ✅ |
| Max tickers per portfolio | 8 | 50 | 8 |
| Risk models | Sample only | Sample / Ledoit-Wolf / EWMA / Factor | Sample only |
| Advanced objectives (risk-parity, max-div, CVaR, net-of-cost) | — | ✅ | — |
| Black-Litterman return estimate | — | ✅ | — |
| Efficient frontier + sector/position constraints | — | ✅ | — |
| Backtesting | — | ✅ | — |
| Live strategy comparison (sweep) | — | ✅ | — |
| Daily optimization quota | 10/day | Unlimited | 10/day |
| Saved portfolios | 3 | Unlimited | 3 |
| Course platform + certificates | — | — | ✅ |

Limits are enforced server-side via `app/auth/gating.py` and surfaced in the UI from `GET /api/me` entitlements (`app/auth/plans.py`).

## Removing the demo payment bypass

The Pro upgrade currently uses a **demo checkout** with a "Skip payment (demo)" button that grants Pro instantly. Before launch:

1. **Frontend flag:** set `VITE_DEMO_BYPASS=false` in `frontend/.env`. This hides the "Skip payment (demo)" button (`src/pages/CheckoutPage.tsx`).
2. **Wire real billing:** replace `CheckoutPage`'s `upgrade()` (which calls `PUT /api/me/plan`) with a real payment integration:
   - Add a backend checkout-session endpoint (e.g., Stripe Checkout) and a webhook that, on successful payment, sets the user's plan to `pro` server-side.
   - Stop allowing the client to set `plan=pro` directly via `PUT /api/me/plan` (restrict that route, or gate `pro` behind a verified payment).
3. **Verify entitlements** flow from the webhook → `profiles.plan` → `GET /api/me` → UI unlock.

## Deployment checklist
- Backend: deploy `backend/` (FastAPI) with `DATABASE_URL` (Supabase Postgres), `SUPABASE_URL`, optional `FMP_API_KEY`, `REDIS_URL`.
- Frontend: deploy `frontend/` (static build) with `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_BYPASS=false`.
- Secrets via environment only — never commit `.env`.
- Confirm Supabase Auth redirect URLs include the production domain.
