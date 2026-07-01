# Background Research

A short survey of the academic and practitioner literature that PortfoliU is built on.

## 1. Modern Portfolio Theory
- **Markowitz (1952), "Portfolio Selection."** Introduced mean-variance optimization: choose weights to minimize variance `wᵀΣw` for a target return, tracing the **efficient frontier**. Won the 1990 Nobel. This is the core of our optimizer.
- **Tobin (1958) / separation theorem.** With a risk-free asset, every investor holds the same risky **tangency portfolio** scaled to taste — the basis for maximizing the Sharpe ratio.
- **Sharpe (1966, 1994), the Sharpe ratio.** Reward per unit of risk, `(r−r_f)/σ`; our primary risk-adjusted metric.

## 2. The estimation problem
- **Michaud (1989), "The Markowitz optimization enigma."** Mean-variance optimizers are "estimation-error maximizers" — small input errors produce wild, unstable weights.
- **Ledoit & Wolf (2003, 2004), shrinkage covariance.** Shrink the noisy sample covariance toward a structured target (constant-correlation) by an analytically optimal intensity, trading bias for far lower variance. Implemented as our `ledoit_wolf` risk model.
- **Factor models (Fama–French 1992; statistical/PCA).** Represent `Σ = BFBᵀ + D` (loadings, factor covariance, idiosyncratic diagonal) for a stable, low-rank estimate. Implemented as our `factor` risk model.
- **Black & Litterman (1992).** Start from market-implied equilibrium returns (reverse optimization) as a Bayesian prior, then blend investor views. Produces diversified, stable portfolios. Implemented as our `black_litterman` return model.

## 3. Downside risk and robustness
- **Rockafellar & Uryasev (2000), "Optimization of Conditional Value-at-Risk."** CVaR (expected shortfall) is a coherent risk measure minimizable by a **linear program** over scenarios — our `cvar` objective.
- **Risk parity / equal risk contribution (Maillard, Roncalli, Teïletche 2010).** Allocate so each asset contributes equal risk; solvable via a convex log-barrier program — our `risk_parity` objective.
- **Choueifaty & Coignard (2008), maximum diversification.** Maximize the diversification ratio — our `max_diversification` objective.
- **Robust optimization (Goldfarb & Iyengar 2003).** Optimize for the worst case over an uncertainty set in `μ`/`Σ` for stability vs naive MVO.

## 4. Transaction costs & backtesting
- **Almgren & Chriss (2000); turnover-aware optimization.** Trading is costly; penalize turnover `‖w − w_prev‖₁` for net-of-cost performance — our `cost_aware` objective and backtest turnover/no-trade-band constraints.
- **Bailey et al. (2014), "Pseudo-mathematics and financial charlatanism."** Backtest overfitting and look-ahead bias are the main ways backtests deceive — motivating our strict walk-forward engine and honest benchmarking (index, equal-weight, 60/40).

## 5. Behavioral finance
- **Kahneman & Tversky (1979), Prospect Theory.** Losses hurt ~2× as much as equivalent gains (**loss aversion**); decisions anchor on reference points (**anchoring**).
- **Barber & Odean (2000, 2001), "Trading is hazardous to your wealth."** **Overconfidence** drives over-trading and underperformance.
- These motivate our Behavioral Coach, which detects loss aversion / overconfidence / anchoring and quantifies their cost against the math-optimal portfolio.

## Thesis
Disciplined, constraint-aware convex optimization — with shrinkage/factor risk estimates, robust/Bayesian returns, and honest backtesting — can deliver better risk-adjusted performance than a naive index, and removing behavioral bias from the decision is a measurable part of that edge.
