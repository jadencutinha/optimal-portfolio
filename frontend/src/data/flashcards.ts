export interface Flashcard {
  term: string
  definition: string
  category: string
}

// A hand-picked set of the most important terms from across the whole
// course, one deck shared by every track rather than split per module.
export const FLASHCARDS: Flashcard[] = [
  // Money Fundamentals
  {
    term: 'Saving',
    definition: 'Putting money somewhere safe and easy to access, for short-term goals like an emergency fund.',
    category: 'Money Fundamentals',
  },
  {
    term: 'Investing',
    definition: 'Putting money into assets that can grow over time, in exchange for taking on some risk.',
    category: 'Money Fundamentals',
  },
  {
    term: 'Compound Interest',
    definition: 'Interest that earns interest on itself, so a balance grows faster the longer it stays invested.',
    category: 'Money Fundamentals',
  },
  {
    term: 'Risk',
    definition: "The chance that an investment loses value, usually measured by how much its price swings (volatility).",
    category: 'Money Fundamentals',
  },
  {
    term: 'Diversification',
    definition: "Spreading money across different investments so a loss in one doesn't sink the whole portfolio.",
    category: 'Money Fundamentals',
  },
  {
    term: 'Sharpe Ratio',
    definition: 'A measure of return earned per unit of risk taken. Higher means a better risk-adjusted payoff.',
    category: 'Money Fundamentals',
  },
  // Behavioral Finance
  {
    term: 'Loss Aversion',
    definition: 'Feeling the pain of a loss roughly twice as strongly as the pleasure of an equal-sized gain.',
    category: 'Behavioral Finance',
  },
  {
    term: 'Disposition Effect',
    definition: 'The tendency to sell winning investments too early and hold on to losing ones too long.',
    category: 'Behavioral Finance',
  },
  {
    term: 'Overconfidence',
    definition: 'Overestimating your own investing skill or control over outcomes that are mostly driven by chance.',
    category: 'Behavioral Finance',
  },
  {
    term: 'Home Bias',
    definition: "Overweighting familiar investments, like your own country's stocks or your employer's stock, at the cost of diversification.",
    category: 'Behavioral Finance',
  },
  {
    term: 'Herding',
    definition: "Following the crowd into or out of an investment just because everyone else seems to be doing it.",
    category: 'Behavioral Finance',
  },
  {
    term: 'Anchoring',
    definition: "Fixating on a reference point, like your purchase price, even after it's no longer relevant to what the asset is worth.",
    category: 'Behavioral Finance',
  },
  // Portfolio Optimization
  {
    term: 'Correlation',
    definition: 'A measure of how much two investments move together, ranging from -1 (opposite) to +1 (lockstep).',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Efficient Frontier',
    definition: 'The set of portfolios that offer the highest possible return for each level of risk.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Tangency Portfolio',
    definition: 'The single portfolio on the efficient frontier with the highest Sharpe ratio.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Covariance Matrix',
    definition: 'A table showing how every asset in a portfolio moves relative to every other asset.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Black-Litterman Model',
    definition: "A method that blends market-implied returns with an investor's own views into more stable expected returns.",
    category: 'Portfolio Optimization',
  },
  {
    term: 'CVaR',
    definition: "Short for Conditional Value at Risk: the average loss you'd expect in the worst-case scenarios, not just everyday swings.",
    category: 'Portfolio Optimization',
  },
  {
    term: 'Risk Parity',
    definition: 'An allocation approach that gives each asset an equal contribution to overall portfolio risk, rather than an equal dollar weight.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Max Diversification',
    definition: "An optimization goal that maximizes the ratio between individual holdings' average volatility and the portfolio's overall volatility.",
    category: 'Portfolio Optimization',
  },
  {
    term: 'Minimum CVaR',
    definition: 'An optimization approach that minimizes expected loss in worst-case scenarios, rather than minimizing everyday volatility.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Hierarchical Risk Parity (HRP)',
    definition: 'A portfolio construction method that clusters similar assets together before allocating risk, avoiding the need to invert a covariance matrix.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Target Return',
    definition: 'An optimization goal that finds the lowest-risk portfolio that still hits a specified return target.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Target Risk',
    definition: 'An optimization goal that finds the highest-return portfolio that still stays within a specified risk limit.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Ledoit-Wolf Shrinkage',
    definition: 'A technique that pulls a noisy covariance matrix estimate toward a more stable target, improving reliability when data is limited.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'EWMA',
    definition: 'Short for Exponentially Weighted Moving Average: a way of estimating volatility and covariance that weights recent data more heavily than older data.',
    category: 'Portfolio Optimization',
  },
  {
    term: 'Factor Model (PCA)',
    definition: "A way of estimating risk by summarizing many assets' movements with a handful of underlying statistical factors, found using principal component analysis.",
    category: 'Portfolio Optimization',
  },
  {
    term: 'Resampled Frontier (Michaud)',
    definition: 'An efficient frontier built by averaging many frontiers from randomly resampled data, producing allocations less sensitive to estimation error.',
    category: 'Portfolio Optimization',
  },
  // Portfolio Analysis
  {
    term: 'Beta',
    definition: 'A measure of how much a portfolio tends to move relative to the overall market.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Max Drawdown',
    definition: 'The largest peak-to-trough decline a portfolio has actually experienced.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Sortino Ratio',
    definition: 'Like the Sharpe ratio, but it only penalizes downside risk instead of all volatility.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Information Ratio',
    definition: 'How consistently a portfolio beats its benchmark, not just by how much on average.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Concentration (HHI)',
    definition: 'A score measuring how much of a portfolio is piled into just a few holdings. Lower is more spread out.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Effective Holdings',
    definition: 'An estimate of how many truly independent positions a portfolio actually holds, once overlap is accounted for.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'CAGR',
    definition: 'Short for Compound Annual Growth Rate: the smoothed yearly growth rate that would take an investment from its starting value to its ending value.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Calmar Ratio',
    definition: "A measure of return relative to a strategy's worst drawdown, rewarding steady growth over deep declines.",
    category: 'Portfolio Analysis',
  },
  {
    term: 'Alpha',
    definition: "The extra return a portfolio generates beyond what would be expected given its exposure to the market, or beta.",
    category: 'Portfolio Analysis',
  },
  {
    term: 'Rolling Sharpe',
    definition: "A Sharpe ratio recalculated over a moving window of time, showing how a strategy's risk-adjusted performance has changed rather than a single average.",
    category: 'Portfolio Analysis',
  },
  {
    term: 'Stress Test',
    definition: 'Checking how a portfolio would have performed during a specific historical crisis, like 2008 or the COVID crash, to reveal hidden vulnerabilities.',
    category: 'Portfolio Analysis',
  },
  {
    term: 'Benchmark',
    definition: "A reference portfolio or index, like the S&P 500 or a 60/40 mix, used as a baseline to judge whether a strategy is actually adding value.",
    category: 'Portfolio Analysis',
  },
  // Institutional Investing
  {
    term: 'Long/Short Equity',
    definition: 'A strategy that buys undervalued stocks and short-sells overvalued ones to reduce overall market exposure.',
    category: 'Institutional Investing',
  },
  {
    term: 'Global Macro',
    definition: 'A strategy that bets on interest rates, currencies, and broad economic trends rather than individual companies.',
    category: 'Institutional Investing',
  },
  {
    term: 'Event-Driven Investing',
    definition: 'A strategy that profits from a specific corporate event resolving, like a merger, spin-off, or bankruptcy.',
    category: 'Institutional Investing',
  },
  {
    term: 'Position Limit',
    definition: 'A cap on how much of a portfolio any single holding is allowed to represent.',
    category: 'Institutional Investing',
  },
  {
    term: 'Liquidity',
    definition: 'How easily a position can be bought or sold without moving its price against you.',
    category: 'Institutional Investing',
  },
  // Quantitative Investing
  {
    term: 'Momentum',
    definition: 'The tendency for stocks that have risen recently to keep rising in the near term.',
    category: 'Quantitative Investing',
  },
  {
    term: 'Value (Factor)',
    definition: 'The tendency for stocks that are cheap relative to their fundamentals to outperform over time.',
    category: 'Quantitative Investing',
  },
  {
    term: 'Quality (Factor)',
    definition: 'The tendency for profitable, low-debt, stable-earnings companies to outperform on a risk-adjusted basis.',
    category: 'Quantitative Investing',
  },
  {
    term: 'Survivorship Bias',
    definition: "Testing a strategy only on companies that still exist today, which flatters the results by hiding the failures.",
    category: 'Quantitative Investing',
  },
  {
    term: 'Look-Ahead Bias',
    definition: "Accidentally using information in a backtest that wouldn't actually have been known at the time.",
    category: 'Quantitative Investing',
  },
  {
    term: 'Backtesting',
    definition: 'Testing an investing strategy against historical data to see how it would have performed.',
    category: 'Quantitative Investing',
  },
  {
    term: 'Walk-Forward Testing',
    definition: 'A backtesting method that repeatedly re-optimizes a strategy on past data and tests it on the period right after, mimicking how it would really be used.',
    category: 'Quantitative Investing',
  },
  {
    term: 'Monte Carlo Simulation',
    definition: 'Running a strategy or plan through thousands of randomly generated future scenarios to see a range of possible outcomes, not just one guess.',
    category: 'Quantitative Investing',
  },
  // Capital Allocation
  {
    term: 'Rebalancing',
    definition: "Adjusting a portfolio back to its target weights after the market moves it out of line.",
    category: 'Capital Allocation',
  },
  {
    term: 'Threshold Rebalancing',
    definition: 'Only rebalancing when a holding drifts beyond a set tolerance band, instead of on a fixed schedule.',
    category: 'Capital Allocation',
  },
  {
    term: 'Capacity',
    definition: "How much money a strategy can absorb before its own trades start moving prices against it.",
    category: 'Capital Allocation',
  },
  {
    term: 'Sector Cap',
    definition: 'A limit on how much of a portfolio can be concentrated in a single industry.',
    category: 'Capital Allocation',
  },
  {
    term: 'Liquidity Constraint',
    definition: "Sizing a position small enough relative to its trading volume that it can actually be exited without moving the price.",
    category: 'Capital Allocation',
  },
  {
    term: 'Turnover',
    definition: "How much of a portfolio's holdings are bought and sold over a period, relative to its size. Higher turnover usually means higher trading costs.",
    category: 'Capital Allocation',
  },
  {
    term: 'No-Trade Band',
    definition: "A buffer around target weights within which small drifts are ignored, so the portfolio isn't rebalanced over insignificant moves.",
    category: 'Capital Allocation',
  },
  {
    term: 'Transaction Cost',
    definition: 'The cost, usually measured in basis points, of actually buying or selling an asset, including fees and the price impact of the trade.',
    category: 'Capital Allocation',
  },
]
