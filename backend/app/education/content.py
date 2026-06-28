PASS_THRESHOLD = 0.9


def _topic(tid: str, title: str, body: str, prompt: str, options: list[str], answer: int) -> dict:
    return {"id": tid, "title": title, "body": body, "quiz": {"prompt": prompt, "options": options, "answer": answer}}


def _exam(eid: str, prompt: str, options: list[str], answer: int) -> dict:
    return {"id": eid, "prompt": prompt, "options": options, "answer": answer}


COURSES = [
    {
        "id": "investing-foundations",
        "title": "Investing Foundations",
        "summary": "Risk, return, diversification, and the building blocks of portfolios.",
        "topics": [
            _topic(
                "t1", "What Is Investing", "Investing means putting capital to work to grow it over time, accepting "
                "some risk in exchange for expected return.", "Investing trades risk for…",
                ["Guaranteed profit", "Expected return", "Zero volatility"], 1),
            _topic(
                "t2", "Expected Return", "Expected return is your best estimate of an investment's average gain. "
                "For a portfolio it's the weighted average of each holding's expected return.",
                "A portfolio's expected return is the … of its holdings.",
                ["Maximum", "Weighted average", "Minimum"], 1),
            _topic(
                "t3", "Volatility", "Volatility (standard deviation of returns) measures how much value swings. "
                "Lower volatility means a smoother, more predictable ride.", "Volatility measures…",
                ["Average return", "How much returns swing", "Fees"], 1),
            _topic(
                "t4", "Diversification", "Combining assets that don't move together lowers total risk below the "
                "average of the parts — the closest thing to a free lunch in finance.",
                "Diversification works best with assets that are…",
                ["Perfectly correlated", "Uncorrelated", "Identical"], 1),
            _topic(
                "t5", "The Risk-Free Rate", "The risk-free rate is what you earn with virtually no risk, like a "
                "Treasury bill. It's the baseline every risky investment is compared against.",
                "The risk-free rate is the return with…", ["High risk", "Almost no risk", "No return"], 1),
            _topic(
                "t6", "The Sharpe Ratio", "Sharpe ratio = (return − risk-free rate) / volatility. It measures "
                "reward per unit of risk; higher is better.", "A higher Sharpe ratio means…",
                ["Worse risk-adjusted return", "Better risk-adjusted return", "More fees"], 1),
            _topic(
                "t7", "Asset Classes", "Stocks, bonds, and cash behave differently. Mixing them shapes a "
                "portfolio's overall risk and return.", "Bonds are generally … than stocks.",
                ["Riskier", "Less volatile", "Identical"], 1),
            _topic(
                "t8", "Index Funds", "An index fund holds a whole market cheaply. It's the simple benchmark "
                "active strategies aim to beat on a risk-adjusted basis.",
                "An index fund aims to…", ["Beat the market", "Track the market", "Avoid stocks"], 1),
        ],
        "final_exam": [
            _exam("e1", "Expected return of a portfolio is the weighted average of…",
                  ["Volatilities", "Holdings' returns", "Sharpe ratios"], 1),
            _exam("e2", "Volatility is a measure of…", ["Return", "Risk", "Cost"], 1),
            _exam("e3", "Diversification reduces risk most when assets are…",
                  ["Correlated", "Uncorrelated", "Identical"], 1),
            _exam("e4", "The Sharpe ratio divides excess return by…", ["Return", "Volatility", "Beta"], 1),
            _exam("e5", "The risk-free rate represents return with…", ["High risk", "Almost no risk", "Leverage"], 1),
            _exam("e6", "Higher expected return usually requires…", ["Lower risk", "Higher risk", "No risk"], 1),
            _exam("e7", "Compared to stocks, bonds are usually…", ["More volatile", "Less volatile", "The same"], 1),
            _exam("e8", "An index fund tries to…", ["Beat the market", "Track the market", "Time the market"], 1),
            _exam("e9", "A smoother return stream has … volatility.", ["Higher", "Lower", "Negative"], 1),
            _exam("e10", "Reward per unit of risk is captured by the…", ["Beta", "Sharpe ratio", "P/E ratio"], 1),
            _exam("e11", "Two portfolios with equal return — prefer the one with…",
                  ["Higher volatility", "Lower volatility", "More holdings"], 1),
            _exam("e12", "Diversification is sometimes called the only free … in finance.",
                  ["Lunch", "Loan", "Trade"], 0),
            _exam("e13", "The baseline every risky asset is compared to is the…",
                  ["Market return", "Risk-free rate", "Inflation rate"], 1),
            _exam("e14", "Putting capital to work for growth, accepting risk, is…",
                  ["Saving", "Investing", "Hedging"], 1),
            _exam("e15", "A portfolio's risk can be below the average of its parts due to…",
                  ["Leverage", "Diversification", "Fees"], 1),
        ],
    },
    {
        "id": "portfolio-optimization",
        "title": "Portfolio Optimization",
        "summary": "The Markowitz model, the efficient frontier, and convex optimization.",
        "topics": [
            _topic("t1", "The Optimization Idea", "Instead of picking stocks one at a time, optimization chooses the "
                   "whole portfolio together to balance risk and return.", "Optimization chooses…",
                   ["One stock", "The whole portfolio together", "Only bonds"], 1),
            _topic("t2", "The Covariance Matrix", "The covariance matrix captures how assets move together. It's the "
                   "engine of diversification inside the optimizer.", "Covariance captures how assets…",
                   ["Are priced", "Move together", "Are taxed"], 1),
            _topic("t3", "Minimum Variance", "The minimum-variance portfolio is the lowest-risk fully-invested mix. "
                   "It ignores return and focuses purely on risk.", "Minimum variance minimizes…",
                   ["Return", "Risk", "Turnover"], 1),
            _topic("t4", "Maximum Sharpe", "The max-Sharpe (tangency) portfolio gives the best reward per unit of "
                   "risk. It's the most efficient single portfolio.", "Max-Sharpe maximizes…",
                   ["Return", "Reward per unit of risk", "Number of holdings"], 1),
            _topic("t5", "Why Convex", "Portfolio variance is convex — bowl-shaped — so the solver always finds the "
                   "single global best answer, reliably.", "A convex problem has…",
                   ["Many local optima", "One global optimum", "No solution"], 1),
            _topic("t6", "The Efficient Frontier", "Solving for every target return traces the efficient frontier: "
                   "the most return for each level of risk.", "The efficient frontier shows the most return per…",
                   ["Dollar", "Level of risk", "Trade"], 1),
            _topic("t7", "Constraints", "Real portfolios add limits: long-only, max weight per asset, sector caps. "
                   "These are linear constraints the solver handles directly.", "A max-weight rule is a…",
                   ["Objective", "Constraint", "Benchmark"], 1),
            _topic("t8", "Estimation Risk", "Optimizers are sensitive to noisy inputs. Shrinkage and factor risk "
                   "models stabilize the estimates for better out-of-sample results.",
                   "Shrinkage estimators aim to…", ["Add noise", "Stabilize estimates", "Raise turnover"], 1),
        ],
        "final_exam": [
            _exam("e1", "Markowitz optimization selects…", ["One stock", "The whole portfolio", "Only ETFs"], 1),
            _exam("e2", "The covariance matrix captures how assets…", ["Are taxed", "Move together", "Are priced"], 1),
            _exam("e3", "The minimum-variance portfolio minimizes…", ["Return", "Risk", "Cost"], 1),
            _exam("e4", "The max-Sharpe portfolio maximizes…", ["Return", "Reward per risk", "Holdings"], 1),
            _exam("e5", "Portfolio variance is … which guarantees a global optimum.",
                  ["Concave", "Convex", "Linear"], 1),
            _exam("e6", "The efficient frontier plots return against…", ["Cost", "Risk", "Time"], 1),
            _exam("e7", "A sector cap is a type of…", ["Objective", "Constraint", "Return"], 1),
            _exam("e8", "Shrinkage estimators help with…", ["Estimation noise", "Taxes", "Liquidity"], 0),
            _exam("e9", "The tangency portfolio is also called…", ["Min variance", "Max Sharpe", "Equal weight"], 1),
            _exam("e10", "A convex objective has exactly one…", ["Local optimum", "Global optimum", "Constraint"], 1),
            _exam("e11", "Optimizing the whole portfolio together exploits…",
                  ["Momentum", "Diversification", "Leverage"], 1),
            _exam("e12", "Long-only means weights are…", ["Negative", "Non-negative", "Unbounded"], 1),
            _exam("e13", "Tracing all target returns produces the…",
                  ["Capital line", "Efficient frontier", "Yield curve"], 1),
            _exam("e14", "A factor risk model reduces…", ["Returns", "Dimensionality/noise", "Liquidity"], 1),
            _exam("e15", "Minimum variance ignores…", ["Risk", "Expected return", "Weights"], 1),
        ],
    },
    {
        "id": "risk-management",
        "title": "Risk Management",
        "summary": "Drawdowns, downside risk, turnover, and robust techniques.",
        "topics": [
            _topic("t1", "Drawdown", "A drawdown is the drop from a peak to a trough. Maximum drawdown is a "
                   "visceral measure of worst-case pain.", "Max drawdown measures the…",
                   ["Average loss", "Peak-to-trough drop", "Daily return"], 1),
            _topic("t2", "Downside Risk", "Investors care more about losses than symmetric swings. Sortino and CVaR "
                   "focus on the downside specifically.", "Sortino focuses on…",
                   ["Upside", "Downside risk", "Turnover"], 1),
            _topic("t3", "Value at Risk", "VaR estimates a loss threshold at a confidence level. CVaR (expected "
                   "shortfall) averages the losses beyond it.", "CVaR averages losses…",
                   ["Below average", "Beyond the VaR threshold", "On good days"], 1),
            _topic("t4", "Turnover", "Turnover is how much a portfolio trades when rebalancing. High turnover means "
                   "high transaction costs.", "High turnover raises…", ["Returns", "Transaction costs", "Sharpe"], 1),
            _topic("t5", "Transaction Costs", "Costs eat returns. Cost-aware optimization adds a penalty for trading "
                   "to keep net-of-cost performance high.", "Cost-aware optimization penalizes…",
                   ["Holding", "Trading", "Diversifying"], 1),
            _topic("t6", "Benchmarks", "Comparing a strategy to a benchmark (like an index or 60/40) shows whether "
                   "it truly adds value.", "A benchmark is used to…",
                   ["Hide risk", "Compare performance", "Raise turnover"], 1),
            _topic("t7", "Beta and Alpha", "Beta measures sensitivity to the market; alpha is return beyond what "
                   "beta explains.", "Alpha is return…",
                   ["From the market", "Beyond beta", "From fees"], 1),
            _topic("t8", "Robust Methods", "Robust and Bayesian methods (like Black-Litterman) reduce the impact of "
                   "noisy estimates for steadier portfolios.", "Robust methods aim to reduce the impact of…",
                   ["Returns", "Estimation noise", "Diversification"], 1),
        ],
        "final_exam": [
            _exam("e1", "Maximum drawdown is the…", ["Average loss", "Peak-to-trough drop", "Best day"], 1),
            _exam("e2", "Sortino ratio focuses on…", ["Upside", "Downside risk", "Cost"], 1),
            _exam("e3", "CVaR averages losses…", ["On good days", "Beyond VaR", "At the mean"], 1),
            _exam("e4", "Turnover measures how much a portfolio…", ["Returns", "Trades", "Holds"], 1),
            _exam("e5", "Transaction costs … returns.", ["Boost", "Eat into", "Ignore"], 1),
            _exam("e6", "A benchmark helps you…", ["Hide losses", "Compare performance", "Trade more"], 1),
            _exam("e7", "Beta measures sensitivity to the…", ["Risk-free rate", "Market", "Sector"], 1),
            _exam("e8", "Alpha is return beyond what … explains.", ["Alpha", "Beta", "Volatility"], 1),
            _exam("e9", "Cost-aware optimization penalizes…", ["Holding", "Trading", "Returns"], 1),
            _exam("e10", "Black-Litterman is an example of a … method.", ["Momentum", "Robust", "Leverage"], 1),
            _exam("e11", "Downside-only risk measures ignore…", ["Losses", "Upside swings", "Drawdowns"], 1),
            _exam("e12", "Expected shortfall is another name for…", ["VaR", "CVaR", "Beta"], 1),
            _exam("e13", "A 60/40 portfolio is a common…", ["Objective", "Benchmark", "Constraint"], 1),
            _exam("e14", "Reducing trading frequency lowers…", ["Returns", "Turnover", "Beta"], 1),
            _exam("e15", "Information ratio measures active return per unit of…",
                  ["Total risk", "Tracking error", "Beta"], 1),
        ],
    },
]

_BY_ID = {course["id"]: course for course in COURSES}


def get_course(course_id: str) -> dict | None:
    return _BY_ID.get(course_id)
