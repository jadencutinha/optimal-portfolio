export interface TermDefinition {
  title: string;
  definition: string;
}

export const FINANCIAL_TERMS: Record<string, TermDefinition> = {
  // Changed keys to match your exact UI label strings
  "Sharpe Ratio": {
    title: "Sharpe Ratio",
    definition: "Sharpe Ratio compares your investment returns to the amount of risk you are taking. A higher value means better returns for the level of risk."
  },
  "Volatility": {
    title: "Volatility",
    definition: "Volatility measures how much the value of your portfolio may go up and down over time. A higher number means higher risk."
  },
  "Efficient Frontier": {
    title: "Efficient Frontier",
    definition: "A curve on a graph that shows the best possible returns you can achieve for different levels of risk. Portfolios below the curve are inefficient."
  },
  "Concentration (HHI)": {
    title: "Concentration (HHI)",
    definition: "A score from 0 to 1 that checks if you’ve put all your eggs in one basket. A score close to 0 means your money is safely spread out and a score of 1 means your money is dangerously trapped in just one or two companies."
  },
  "Effective Holdings": {
    title: "Effective Holdings",
    definition: "A score that reveals how many of your investments actually matter. It shows how balanced your portfolio is by ignoring investments that are too small affect your profits."
  },
  "Covariance": {
    title: "Covariance",
    definition: "A measure of how two investments move in relation to one another. If they move in the same direction they have high covariance, while moving in opposite directions means low or negative covariance."
  },
  "Diversification": {
    title: "Diversification",
    definition: "The practice of spreading your money across different investments that don't move together. This acts like a safety net to protect you from taking a massive hit if a single company or industry crashes."
  },
  "Minimum Variance": {
    title: "Minimum Variance",
    definition: "An investment mix focused entirely on safety. It combines your choices in a way that minimizes overall price fluctuations, ignoring how high your potential profits could be."
  },
  "Maximum Sharpe": {
    title: "Maximum Sharpe",
    definition: "The ideal investment mix that perfectly balances risk and reward. It aims to give you the biggest possible profit for every single drop of price fluctuation you take on."
  },
  "Lookback Window": {
    title: "Lookback Window",
    definition: "The specific period of past history used to gather market data. The app looks back across this timeframe to analyze how your chosen investments behave and calculate their risk patterns."
  }
};