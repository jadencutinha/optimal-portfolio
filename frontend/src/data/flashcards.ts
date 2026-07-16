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
]
