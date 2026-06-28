PASS_THRESHOLD = 0.9


def p(text: str) -> dict:
    return {"type": "p", "text": text}


def h(text: str) -> dict:
    return {"type": "h", "text": text}


def formula(text: str) -> dict:
    return {"type": "formula", "text": text}


def bullets(items: list[str]) -> dict:
    return {"type": "ul", "items": items}


def _topic(tid: str, title: str, blocks: list[dict], prompt: str, options: list[str], answer: int) -> dict:
    return {"id": tid, "title": title, "body": blocks, "quiz": {"prompt": prompt, "options": options, "answer": answer}}


def _exam(eid: str, prompt: str, options: list[str], answer: int) -> dict:
    return {"id": eid, "prompt": prompt, "options": options, "answer": answer}


COURSES = [
    {
        "id": "investing-foundations",
        "title": "Investing Foundations",
        "summary": "Risk, return, distributions, and the statistical language of portfolios.",
        "topics": [
            _topic(
                "t1", "Return: What We Are Actually Measuring",
                [
                    p("Before we can optimize anything, we need a precise definition of return. The simple (arithmetic) "
                      "return over one period is the percentage change in price, including any income such as dividends."),
                    formula("r_t = (P_t - P_{t-1} + D_t) / P_{t-1}"),
                    p("Simple returns are intuitive but they do not add up across time — chaining them requires "
                      "multiplication, not addition. That is why analysts often work with log (continuously compounded) "
                      "returns, which are additive over time and approximately equal to simple returns when changes are small."),
                    formula("r_t^{log} = ln(P_t / P_{t-1})"),
                    h("Why the distinction matters"),
                    p("A portfolio's return over a year is the product of its daily growth factors, not the sum of its "
                      "daily returns. This compounding is the source of a subtle but important fact: volatility drags on "
                      "compounded returns. Two assets with the same average return but different volatility will not end "
                      "with the same wealth — the more volatile one ends lower, because losses and gains are not symmetric "
                      "in compounding (a 50% loss needs a 100% gain to recover)."),
                    bullets([
                        "Simple returns compound multiplicatively across time.",
                        "Log returns add across time and are convenient for statistics.",
                        "Volatility reduces compounded (geometric) returns relative to the arithmetic mean.",
                    ]),
                ],
                "Log returns are preferred for time-series work because they…",
                ["Are always larger", "Add across time", "Ignore dividends"], 1),
            _topic(
                "t2", "Expected Return and the Mean Vector",
                [
                    p("Expected return is our best estimate of an asset's average future return. In practice we estimate "
                      "it from historical data as the sample mean of past returns, then annualize it."),
                    formula("μ_i = E[r_i] ≈ (1/T) Σ_t r_{i,t},   annualized: μ_i × 252"),
                    p("For a portfolio with weights w (a vector summing to one), the expected return is the weighted "
                      "average of the asset means — a linear function of the weights."),
                    formula("E[r_p] = wᵀμ = Σ_i w_i μ_i"),
                    h("The estimation problem"),
                    p("Here is the uncomfortable truth that shapes everything later: sample means are extremely noisy "
                      "estimates of true expected returns. With only a few years of data, the standard error of the mean "
                      "is large relative to the mean itself. This is why portfolios that maximize estimated return tend "
                      "to concentrate in whatever asset got lucky in-sample, and why robust methods (shrinkage, "
                      "Black-Litterman) exist — they distrust the raw means."),
                ],
                "A portfolio's expected return as a function of its weights is…",
                ["Quadratic", "Linear", "Constant"], 1),
            _topic(
                "t3", "Volatility, Variance, and Why We Square",
                [
                    p("Risk, in the mean-variance framework, is measured by the variance of returns — the average squared "
                      "deviation from the mean — and its square root, the standard deviation or volatility."),
                    formula("σ_i² = E[(r_i - μ_i)²],   σ_i = √σ_i²"),
                    p("We square deviations for two reasons: it makes negative and positive deviations both count as risk, "
                      "and it produces a quantity that behaves cleanly under the algebra of weighted sums. Variance is "
                      "the natural currency of diversification because variances of sums decompose into a tidy formula."),
                    h("A nuance: variance treats upside and downside the same"),
                    p("Squaring is symmetric, so a big gain contributes as much 'risk' as a big loss. Investors usually "
                      "care more about losses, which motivates downside measures like semivariance, Sortino, and CVaR — "
                      "topics in the Risk Management course. Mean-variance optimization is still the workhorse because "
                      "variance is mathematically convenient and, for roughly symmetric return distributions, a good "
                      "proxy for downside risk."),
                ],
                "Variance squares deviations primarily because it…",
                ["Removes the mean", "Makes risk algebraically tractable and sign-blind", "Annualizes returns"], 1),
            _topic(
                "t4", "Covariance and Correlation: The Engine of Diversification",
                [
                    p("Diversification works because assets do not move in lockstep. Covariance measures how two assets "
                      "move together; correlation is covariance normalized to lie between -1 and +1."),
                    formula("σ_{ij} = E[(r_i - μ_i)(r_j - μ_j)],   ρ_{ij} = σ_{ij} / (σ_i σ_j)"),
                    p("Stack all pairwise covariances into the covariance matrix Σ. A portfolio's variance is then a "
                      "quadratic form in the weights — this single equation is the mathematical heart of portfolio theory."),
                    formula("σ_p² = wᵀ Σ w = Σ_i Σ_j w_i w_j σ_{ij}"),
                    h("The free lunch, made precise"),
                    p("Combine two assets with the same volatility σ and correlation ρ in equal weights. The portfolio "
                      "variance is σ²(1+ρ)/2. When ρ < 1, this is strictly less than σ² — risk falls below the average of "
                      "the parts. As ρ → -1, risk can be driven toward zero. Diversification is not magic; it is the "
                      "geometry of the covariance matrix."),
                ],
                "A portfolio's variance equals…",
                ["wᵀμ", "wᵀΣw", "Σσ_i"], 1),
            _topic(
                "t5", "The Risk-Free Rate and Excess Return",
                [
                    p("Every risky investment is judged against a baseline: the risk-free rate, the return you can earn "
                      "with essentially no risk (a short-term government bill). Subtracting it gives the excess return, "
                      "the compensation you actually earn for bearing risk."),
                    formula("excess return = r_i - r_f"),
                    p("The risk-free rate is also the anchor of the Capital Market Line: with a risk-free asset available, "
                      "every investor can lever or de-lever a single risky portfolio, mixing it with cash. This is why the "
                      "maximum-Sharpe (tangency) portfolio is special — it is the one risky portfolio everyone should hold, "
                      "scaled to taste."),
                ],
                "Excess return is an asset's return minus the…",
                ["Market return", "Risk-free rate", "Inflation rate"], 1),
            _topic(
                "t6", "The Sharpe Ratio and Risk-Adjusted Performance",
                [
                    p("The Sharpe ratio collapses reward and risk into a single number: excess return per unit of "
                      "volatility. It answers the question 'how much return am I getting for each unit of risk I take?'"),
                    formula("Sharpe = (E[r_p] - r_f) / σ_p"),
                    p("Two portfolios returning 12%: one with 10% volatility (Sharpe ≈ 0.8 at a 4% risk-free rate) is far "
                      "more efficient than one with 30% volatility (Sharpe ≈ 0.27). The first earns its return more "
                      "reliably. Maximizing the Sharpe ratio is equivalent to finding the portfolio that sits at the point "
                      "where a line from the risk-free rate is tangent to the efficient frontier."),
                    h("Limitations to keep in mind"),
                    bullets([
                        "Sharpe assumes volatility fully captures risk — it penalizes upside swings too.",
                        "It is unstable when estimated from short samples (both μ and σ are noisy).",
                        "Strategies with fat tails or skew can show a flattering Sharpe while hiding crash risk.",
                    ]),
                ],
                "A higher Sharpe ratio indicates…",
                ["More volatility", "Better return per unit of risk", "Higher fees"], 1),
            _topic(
                "t7", "Distributions, Fat Tails, and Model Risk",
                [
                    p("Mean-variance analysis implicitly leans on the normal (Gaussian) distribution, where mean and "
                      "variance describe everything. Real returns are not normal: they have fat tails (extreme moves are "
                      "far more common than a bell curve predicts) and negative skew (crashes are sharper than rallies)."),
                    p("This is the abstract issue underneath every optimizer: the math is exact, but the inputs come from "
                      "a messy, non-stationary world. A covariance estimated in calm markets understates risk in a crisis, "
                      "precisely when correlations spike toward one and diversification evaporates."),
                    bullets([
                        "Fat tails: 5-sigma days happen far more often than 'once per 14,000 years'.",
                        "Skew: downside moves cluster and overshoot.",
                        "Non-stationarity: the distribution itself drifts over time.",
                    ]),
                    p("The practical response is humility: use longer samples, shrink noisy estimates, stress-test with "
                      "drawdown and CVaR, and never confuse a confident-looking optimal weight with certainty."),
                ],
                "Real-world returns differ from a normal distribution mainly by having…",
                ["Thin tails", "Fat tails and skew", "Zero variance"], 1),
            _topic(
                "t8", "Benchmarks and the Index-Fund Hurdle",
                [
                    p("A strategy is only impressive relative to a fair alternative. The default benchmark is a broad, "
                      "cheap index fund — owning the whole market in proportion to size. Beating it on a risk-adjusted "
                      "basis, after costs, is genuinely hard, which is the whole point of disciplined optimization."),
                    p("Benchmark-relative metrics make the comparison rigorous. Beta measures how much of a portfolio's "
                      "movement is explained by the benchmark; alpha is the return left over that beta cannot explain; "
                      "tracking error is the volatility of the difference; and the information ratio is alpha per unit of "
                      "tracking error."),
                    formula("alpha = (r_p - r_f) - β(r_b - r_f)"),
                    p("The thesis of this entire application is that an optimized, constrained portfolio can deliver a "
                      "positive, repeatable information ratio versus a naive index — and that you can verify that claim "
                      "by backtesting it honestly."),
                ],
                "Alpha is the portion of return not explained by…",
                ["Fees", "Beta (the benchmark)", "Volatility"], 1),
        ],
        "final_exam": [
            _exam("e1", "Log returns are favored because they…", ["Are larger", "Add across time", "Ignore risk"], 1),
            _exam("e2", "A portfolio's expected return wᵀμ is … in the weights.", ["Quadratic", "Linear", "Random"], 1),
            _exam("e3", "Portfolio variance is written as…", ["wᵀμ", "wᵀΣw", "Σσ"], 1),
            _exam("e4", "Correlation is covariance divided by…",
                  ["The mean", "The product of the volatilities", "The risk-free rate"], 1),
            _exam("e5", "Combining assets with correlation below 1 makes portfolio risk…",
                  ["Higher", "Lower than the average of parts", "Unchanged"], 1),
            _exam("e6", "Excess return subtracts the…", ["Benchmark", "Risk-free rate", "Mean"], 1),
            _exam("e7", "The Sharpe ratio divides excess return by…", ["Beta", "Volatility", "Alpha"], 1),
            _exam("e8", "Volatility drag means compounded return is … the arithmetic mean.",
                  ["Above", "Below", "Equal to"], 1),
            _exam("e9", "Variance squares deviations, so it treats gains and losses…",
                  ["Asymmetrically", "Symmetrically", "Randomly"], 1),
            _exam("e10", "Real returns typically exhibit…", ["Thin tails", "Fat tails and skew", "No skew"], 1),
            _exam("e11", "In a crisis, correlations tend to…", ["Fall to zero", "Spike toward one", "Stay fixed"], 1),
            _exam("e12", "Sample means of returns are…", ["Very precise", "Very noisy", "Always zero"], 1),
            _exam("e13", "Alpha is return not explained by…", ["Fees", "Beta", "Skew"], 1),
            _exam("e14", "The tangency portfolio maximizes the…", ["Variance", "Sharpe ratio", "Turnover"], 1),
            _exam("e15", "The information ratio is alpha per unit of…", ["Beta", "Tracking error", "Volatility"], 1),
        ],
    },
    {
        "id": "portfolio-optimization",
        "title": "Portfolio Optimization",
        "summary": "Convex optimization, the efficient frontier, duality, and estimation-robust methods.",
        "topics": [
            _topic(
                "t1", "From Stock Picking to Portfolio Construction",
                [
                    p("Markowitz's 1952 insight was to stop evaluating securities in isolation and instead choose the "
                      "entire portfolio at once, trading expected return against variance. The decision variable is the "
                      "weight vector w; the objective and constraints are functions of w."),
                    p("This reframing is profound: an asset that looks unattractive alone can be valuable in a portfolio "
                      "if it diversifies the rest. Optimization captures these interaction effects through the covariance "
                      "matrix, which single-asset analysis ignores entirely."),
                    formula("minimize  wᵀΣw   subject to  wᵀμ ≥ R,  1ᵀw = 1,  bounds"),
                ],
                "Portfolio optimization chooses…",
                ["One asset at a time", "The whole portfolio jointly", "Only the risk-free asset"], 1),
            _topic(
                "t2", "The Covariance Matrix as an Operator",
                [
                    p("The covariance matrix Σ is symmetric and positive semidefinite (PSD): wᵀΣw ≥ 0 for every w, because "
                      "a variance can never be negative. PSD-ness is not a technicality — it is exactly what makes the "
                      "optimization convex and therefore solvable to a global optimum."),
                    p("Eigen-decomposition reveals Σ's structure: its eigenvectors are uncorrelated 'principal portfolios' "
                      "and the eigenvalues are their variances. The largest eigenvalue is usually a market-wide factor; "
                      "the smallest eigenvalues correspond to nearly-hedged combinations that an optimizer will happily "
                      "(and dangerously) load up on if the estimate is noisy."),
                    formula("Σ = V Λ Vᵀ,  Λ = diag(λ_1, …, λ_n), λ_i ≥ 0"),
                    h("Why this causes trouble"),
                    p("Optimizers are most aggressive exactly where Σ is least reliable: the low-variance directions. Tiny "
                      "estimation errors in small eigenvalues translate into huge, unstable weights. This single fact "
                      "motivates shrinkage and factor models — they regularize the small eigenvalues."),
                ],
                "The covariance matrix is positive semidefinite, which guarantees…",
                ["Negative variance", "A convex, globally solvable problem", "Equal weights"], 1),
            _topic(
                "t3", "Minimum-Variance and the Role of Constraints",
                [
                    p("The minimum-variance portfolio ignores expected returns entirely and simply finds the lowest-risk "
                      "fully-invested mix. With no bounds it has a clean closed form using the inverse covariance matrix."),
                    formula("w_mv = Σ⁻¹ 1 / (1ᵀ Σ⁻¹ 1)"),
                    p("In practice we add constraints — long-only (w ≥ 0), per-asset caps, sector limits — which remove "
                      "the closed form but make the portfolio realistic and far more stable. Constraints act as implicit "
                      "regularization: by forbidding extreme weights, they blunt the optimizer's tendency to exploit "
                      "estimation noise. A constrained 'wrong' portfolio often beats an unconstrained 'optimal' one "
                      "out of sample."),
                ],
                "Adding weight constraints to an optimizer tends to…",
                ["Increase instability", "Act as regularization and improve out-of-sample behavior", "Remove all risk"], 1),
            _topic(
                "t4", "Maximum Sharpe via the Charnes–Cooper Transform",
                [
                    p("Maximizing the Sharpe ratio is maximizing a ratio — a fractional, non-convex objective that a "
                      "quadratic solver cannot handle directly. The trick exploits scale-invariance: the Sharpe ratio "
                      "does not change if you scale all weights, so we can normalize the problem."),
                    p("Introduce a scaled variable y = κw with κ > 0, fix the excess return to one, and minimize variance. "
                      "The original weights are recovered by dividing out κ. This converts a hard fractional program into "
                      "a clean convex quadratic program."),
                    formula("minimize yᵀΣy  s.t. (μ - r_f)ᵀy = 1, y = κw, κ > 0  →  w* = y*/κ*"),
                    p("This is a worked example of the course's central lesson: making a problem convex through "
                      "reformulation is often more valuable than any solver."),
                ],
                "The max-Sharpe problem is made convex by exploiting the Sharpe ratio's…",
                ["Linearity", "Scale-invariance", "Symmetry"], 1),
            _topic(
                "t5", "Convexity: Why It Guarantees the Global Optimum",
                [
                    p("A function is convex if the line segment between any two points on its graph lies on or above the "
                      "graph — a bowl shape. Portfolio variance wᵀΣw is convex precisely because Σ is PSD. Minimizing a "
                      "convex function over a convex feasible set (defined by linear constraints) has no false local "
                      "minima: any local optimum is the global optimum."),
                    p("This is why portfolio optimization is practical. Non-convex problems (integer holdings, cardinality "
                      "constraints, certain transaction-cost models) can trap solvers in local optima and require "
                      "specialized methods. Whenever possible we keep the formulation convex."),
                    bullets([
                        "Convex objective + convex constraints ⇒ unique global optimum.",
                        "Solvers (interior-point, conic) find it quickly and reliably.",
                        "Reformulation to preserve convexity is a core modeling skill.",
                    ]),
                ],
                "A convex optimization problem has…",
                ["Many local optima", "One global optimum", "No solution"], 1),
            _topic(
                "t6", "The Efficient Frontier and Duality",
                [
                    p("Sweeping the required return R from the minimum-variance level upward and solving for minimum "
                      "variance at each traces the efficient frontier: the set of portfolios offering the least risk for "
                      "each level of return. In mean–standard-deviation space it is a hyperbola; in mean–variance space "
                      "the relationship is exactly quadratic and therefore convex."),
                    p("Behind the scenes, the return constraint carries a Lagrange multiplier — a shadow price telling you "
                      "how much extra variance one more unit of required return costs. The tangency (max-Sharpe) portfolio "
                      "is where this trade-off, measured from the risk-free rate, is most favorable."),
                    formula("σ²(R) is convex in R ⇒ the frontier is convex and monotone above the min-variance point"),
                ],
                "The efficient frontier gives the minimum risk for each level of…",
                ["Cost", "Return", "Turnover"], 1),
            _topic(
                "t7", "Estimation Error and Shrinkage",
                [
                    p("The dirty secret of mean-variance optimization is that it is an 'error-maximizer': it pours weight "
                      "into assets whose returns were overestimated and whose risks were underestimated. With realistic "
                      "sample sizes, the optimized weights are dominated by noise."),
                    p("Shrinkage fights this by pulling the noisy sample covariance toward a simple, stable target — for "
                      "example a constant-correlation matrix — by a mathematically optimal amount that minimizes expected "
                      "estimation error. The Ledoit–Wolf estimator computes this shrinkage intensity analytically."),
                    formula("Σ̂ = δ F + (1 - δ) S,   δ* chosen to minimize E‖Σ̂ - Σ‖²"),
                    p("The result is deliberately biased but far less variable — the classic bias–variance trade-off — and "
                      "it produces steadier, better-performing portfolios out of sample."),
                ],
                "Shrinkage estimators deliberately accept some bias in order to reduce…",
                ["Return", "Variance (estimation error)", "Diversification"], 1),
            _topic(
                "t8", "Factor Models and Black–Litterman",
                [
                    p("A factor risk model assumes returns are driven by a handful of common factors plus idiosyncratic "
                      "noise, giving a structured, low-rank covariance that is far more stable than the raw sample matrix. "
                      "Statistically, the top principal components are the factors; economically, they might be market, "
                      "size, and value."),
                    formula("Σ ≈ B F Bᵀ + D   (loadings B, factor covariance F, idiosyncratic diagonal D)"),
                    p("On the return side, Black–Litterman starts from the market-implied equilibrium returns (reverse-"
                      "optimized from market weights) as a sensible prior, then blends in an investor's views in a "
                      "Bayesian way. Without views it returns the equilibrium, which already yields far more diversified, "
                      "stable portfolios than raw historical means. Together, factor risk models and Black–Litterman "
                      "address the two halves of the estimation problem: the covariance and the mean."),
                ],
                "A factor model represents Σ as a low-rank part plus a…",
                ["Random matrix", "Idiosyncratic diagonal", "Zero matrix"], 1),
        ],
        "final_exam": [
            _exam("e1", "Markowitz optimization selects…", ["One stock", "The whole portfolio", "Only cash"], 1),
            _exam("e2", "Σ is positive semidefinite, which makes the problem…", ["Non-convex", "Convex", "Linear"], 1),
            _exam("e3", "Eigenvectors of Σ are…", ["Returns", "Uncorrelated principal portfolios", "Constraints"], 1),
            _exam("e4", "Optimizers are most aggressive in Σ's … directions.", ["High-variance", "Low-variance", "Mean"], 1),
            _exam("e5", "The minimum-variance portfolio uses…", ["μ only", "Σ⁻¹ 1 normalized", "Equal weights"], 1),
            _exam("e6", "Constraints act as a form of…", ["Leverage", "Regularization", "Return"], 1),
            _exam("e7", "Max-Sharpe is convexified using the Sharpe ratio's…",
                  ["Symmetry", "Scale-invariance", "Linearity"], 1),
            _exam("e8", "A convex problem has exactly one…", ["Local optimum", "Global optimum", "Constraint"], 1),
            _exam("e9", "Variance is convex in the weights because Σ is…", ["Diagonal", "PSD", "Sparse"], 1),
            _exam("e10", "Sweeping the return constraint traces the…",
                  ["Capital line", "Efficient frontier", "Yield curve"], 1),
            _exam("e11", "The return constraint's Lagrange multiplier is a…",
                  ["Weight", "Shadow price", "Volatility"], 1),
            _exam("e12", "Mean-variance optimization is sometimes called an…",
                  ["Error-maximizer", "Error-canceller", "Index"], 0),
            _exam("e13", "Ledoit–Wolf shrinkage trades bias for lower…", ["Return", "Estimation error", "Liquidity"], 1),
            _exam("e14", "A factor model writes Σ as BFBᵀ plus a…", ["Zero matrix", "Diagonal", "Random matrix"], 1),
            _exam("e15", "Black–Litterman's prior is the … implied returns.",
                  ["Historical", "Market-equilibrium", "Random"], 1),
        ],
    },
    {
        "id": "risk-management",
        "title": "Risk Management & Robust Construction",
        "summary": "Drawdown, downside risk, CVaR, transaction costs, and robust optimization.",
        "topics": [
            _topic(
                "t1", "Drawdown: The Risk Investors Actually Feel",
                [
                    p("Volatility is a statistician's measure of risk; drawdown is an investor's. A drawdown is the decline "
                      "from a historical peak to a subsequent trough, and the maximum drawdown is the worst such decline "
                      "over a period — the deepest hole the strategy ever put you in."),
                    formula("DD_t = (V_t / max_{s ≤ t} V_s) - 1,   MaxDD = min_t DD_t"),
                    p("Drawdown matters because investors abandon strategies at the bottom. Two strategies with identical "
                      "Sharpe ratios can have very different maximum drawdowns depending on the path and the fatness of "
                      "their tails. The Calmar ratio (CAGR divided by max drawdown) explicitly rewards smooth paths."),
                ],
                "Maximum drawdown measures the…",
                ["Average loss", "Worst peak-to-trough decline", "Daily volatility"], 1),
            _topic(
                "t2", "Downside Risk: Semivariance and Sortino",
                [
                    p("Variance penalizes upside and downside equally, but investors are loss-averse. Downside risk "
                      "measures count only the bad half of the distribution. Semivariance averages squared shortfalls "
                      "below a threshold (often zero or the mean)."),
                    formula("semivariance = E[ min(r - τ, 0)² ]"),
                    p("The Sortino ratio replaces volatility in the Sharpe ratio with downside deviation, so it does not "
                      "penalize a strategy for large gains. It is especially informative for asymmetric strategies whose "
                      "return distributions are skewed."),
                ],
                "Downside-risk measures like Sortino ignore…",
                ["Losses", "Upside swings", "The mean"], 1),
            _topic(
                "t3", "Value at Risk and Conditional VaR",
                [
                    p("Value at Risk (VaR) at confidence α is a loss threshold: with probability α, losses will not exceed "
                      "it. VaR is intuitive but flawed — it says nothing about how bad the tail is beyond the threshold, "
                      "and it is not subadditive, so it can penalize diversification."),
                    p("Conditional VaR (CVaR), or expected shortfall, fixes this by averaging the losses in the worst "
                      "(1-α) tail. CVaR is a coherent risk measure and, crucially, can be minimized with a linear program "
                      "via the Rockafellar–Uryasev formulation, making it a practical optimization objective."),
                    formula("CVaR_α = (1/(1-α)) E[ loss · 1{loss ≥ VaR_α} ]"),
                ],
                "Compared to VaR, CVaR additionally captures…",
                ["The mean return", "The severity of losses beyond the threshold", "Turnover"], 1),
            _topic(
                "t4", "Turnover, Transaction Costs, and Net-of-Cost Optimization",
                [
                    p("Every rebalance trades, and every trade costs money — spreads, commissions, and market impact. "
                      "Turnover measures the fraction of the portfolio traded; over many rebalances, small costs compound "
                      "into a serious drag on realized returns."),
                    p("Cost-aware optimization adds a penalty proportional to the one-norm distance from the current "
                      "holdings, so the optimizer only trades when the expected benefit exceeds the cost. The result is a "
                      "no-trade region around the current portfolio — small signals are ignored."),
                    formula("maximize  μᵀw - γ wᵀΣw - c · ‖w - w_prev‖₁"),
                    p("Turnover constraints and no-trade bands are the backtesting analogue, capping how much the "
                      "portfolio churns between rebalances regardless of what the signal suggests."),
                ],
                "Cost-aware optimization penalizes…",
                ["Holding", "Trading (turnover)", "Diversifying"], 1),
            _topic(
                "t5", "Robust Optimization Under Uncertainty",
                [
                    p("Classical optimization treats the estimated μ and Σ as if they were exact. Robust optimization "
                      "instead assumes the true parameters lie somewhere in an uncertainty set and optimizes for the "
                      "worst case within it — trading a little expected performance for far more stability."),
                    formula("maximize_w  min_{μ ∈ U}  (μᵀw - γ wᵀΣw)"),
                    p("With an ellipsoidal uncertainty set, the worst-case mean introduces a penalty proportional to the "
                      "portfolio's exposure, which naturally shrinks aggressive bets. Black–Litterman can be seen as a "
                      "Bayesian cousin of robust optimization: both distrust raw estimates and pull toward a sensible "
                      "anchor."),
                ],
                "Robust optimization optimizes for the … case within an uncertainty set.",
                ["Best", "Worst", "Average"], 1),
            _topic(
                "t6", "Backtesting Without Fooling Yourself",
                [
                    p("A backtest re-runs a strategy through history to estimate how it would have performed. Done "
                      "carelessly it is a machine for self-deception. The cardinal sin is look-ahead bias: using "
                      "information at time t that was not available until later. A correct walk-forward backtest estimates "
                      "parameters on a trailing window and applies them only to the future."),
                    bullets([
                        "No look-ahead: decisions at t use only data up to t.",
                        "Account for transaction costs and realistic rebalancing cadence.",
                        "Beware overfitting: the more parameters you tune on history, the less the result means.",
                        "Compare against honest benchmarks (index, equal-weight, 60/40) under identical costs.",
                    ]),
                    p("The point of a backtest is not to find the best-looking curve but to estimate whether an edge is "
                      "real and repeatable after costs."),
                ],
                "The cardinal sin of backtesting is…",
                ["Using benchmarks", "Look-ahead bias", "Charging costs"], 1),
            _topic(
                "t7", "Benchmark-Relative Performance: Alpha, Beta, IR",
                [
                    p("To know whether a strategy adds value you must measure it against a benchmark. Regressing the "
                      "strategy's excess returns on the benchmark's gives beta (market sensitivity) and alpha (the "
                      "intercept — return unexplained by the market)."),
                    formula("r_p - r_f = α + β(r_b - r_f) + ε"),
                    p("Tracking error is the volatility of the active return (strategy minus benchmark), and the "
                      "information ratio is alpha divided by tracking error — the risk-adjusted measure of skill relative "
                      "to a benchmark. A consistently positive information ratio, net of costs, is the holy grail."),
                ],
                "The information ratio is active return per unit of…",
                ["Total volatility", "Tracking error", "Beta"], 1),
            _topic(
                "t8", "Putting It Together: A Disciplined Process",
                [
                    p("Robust portfolio construction is a pipeline, not a single equation. Estimate returns (shrunk or "
                      "Black–Litterman) and risk (shrinkage or factor model); choose an objective (max-Sharpe, "
                      "min-variance, CVaR, risk-parity) appropriate to your goals; impose realistic constraints; account "
                      "for transaction costs; and validate with an honest walk-forward backtest against fair benchmarks."),
                    p("No single step is sufficient. The covariance can be perfect and noisy means will still wreck the "
                      "portfolio; the optimization can be flawless and look-ahead bias will still flatter the backtest. "
                      "Discipline across the whole pipeline — and humility about the inputs — is what separates a real "
                      "edge from an overfit illusion."),
                ],
                "The biggest lesson of robust construction is that…",
                ["The solver is everything", "Discipline across the whole pipeline matters", "Costs are irrelevant"], 1),
        ],
        "final_exam": [
            _exam("e1", "Maximum drawdown is the…", ["Average loss", "Worst peak-to-trough drop", "Best day"], 1),
            _exam("e2", "The Calmar ratio divides CAGR by…", ["Volatility", "Max drawdown", "Beta"], 1),
            _exam("e3", "Sortino focuses on…", ["Upside", "Downside risk", "Cost"], 1),
            _exam("e4", "Semivariance averages squared … below a threshold.", ["Gains", "Shortfalls", "Means"], 1),
            _exam("e5", "VaR fails to describe…", ["The threshold", "Losses beyond the threshold", "Probability"], 1),
            _exam("e6", "CVaR can be minimized with a … program.", ["Quadratic", "Linear", "Integer"], 1),
            _exam("e7", "Cost-aware optimization creates a … region.", ["Leverage", "No-trade", "Tax"], 1),
            _exam("e8", "Robust optimization optimizes the … case.", ["Best", "Worst", "Median"], 1),
            _exam("e9", "Look-ahead bias means using … information.", ["Past", "Future", "No"], 1),
            _exam("e10", "Beta measures sensitivity to the…", ["Risk-free rate", "Benchmark", "Sector"], 1),
            _exam("e11", "Alpha is the regression…", ["Slope", "Intercept", "Residual"], 1),
            _exam("e12", "Information ratio is alpha divided by…", ["Beta", "Tracking error", "Volatility"], 1),
            _exam("e13", "CVaR is preferred to VaR partly because it is…", ["Incoherent", "Coherent/subadditive", "Linear"], 1),
            _exam("e14", "Turnover constraints limit portfolio…", ["Returns", "Churn", "Beta"], 1),
            _exam("e15", "Overfitting a backtest makes the result…", ["More reliable", "Less meaningful", "Cheaper"], 1),
        ],
    },
]

_BY_ID = {course["id"]: course for course in COURSES}


def get_course(course_id: str) -> dict | None:
    return _BY_ID.get(course_id)
