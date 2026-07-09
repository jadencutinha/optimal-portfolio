import type { TourStep } from '../components/Tour'

export const PRO_TOUR: TourStep[] = [
  {
    selector: '[data-tour="optimizer"]',
    title: 'Optimizer',
    body: 'Build a mathematically optimal portfolio from your tickers. Choose objectives, risk models, and constraints, then trace the efficient frontier.',
  },
  {
    selector: '[data-tour="assistant"]',
    title: 'AI Assistant',
    body: 'Describe your goal in plain English. The assistant picks the objective and constraints, runs the optimizer, and explains the result.',
  },
  {
    selector: '[data-tour="planner"]',
    title: 'Goal Planner',
    body: 'Run thousands of Monte Carlo simulations to see your odds of reaching a target and the risk of a deep drawdown.',
  },
  {
    selector: '[data-tour="backtest"]',
    title: 'Backtest',
    body: 'Replay your strategy through history with no look-ahead, benchmarked against the index, equal-weight, and 60/40.',
  },
  {
    selector: '[data-tour="stress"]',
    title: 'Stress Test',
    body: 'See how your portfolio would have held up in 2008, the COVID crash, and the 2022 rate shock, including drawdown and recovery time.',
  },
  {
    selector: '[data-tour="factors"]',
    title: 'Factor Exposures',
    body: 'Break your returns into market, momentum, and other style tilts, with alpha and R².',
  },
  {
    selector: '[data-tour="tracker"]',
    title: 'Tracker',
    body: 'Track how a saved portfolio drifts from its target weights and get a rebalance alert when it crosses your band.',
  },
  {
    selector: '[data-tour="saved"]',
    title: 'My Portfolios',
    body: 'Save portfolios, reopen them anytime, and download a detailed PDF report.',
  },
]

export const FREE_TOUR: TourStep[] = [
  {
    selector: '[data-tour="optimizer"]',
    title: 'Optimizer',
    body: 'Build an optimized portfolio from up to 8 tickers with Max-Sharpe or Min-Variance, and see the efficient frontier.',
  },
  {
    selector: '[data-tour="planner"]',
    title: 'Goal Planner',
    body: 'Project your wealth with Monte Carlo simulations and see your odds of hitting a savings goal.',
  },
  {
    selector: '[data-tour="saved"]',
    title: 'My Portfolios',
    body: 'Save up to 3 portfolios, reopen them, and export a PDF report.',
  },
  {
    selector: '[data-tour="upgrade"]',
    title: 'Upgrade to Pro',
    body: 'Unlock the AI assistant, backtesting, stress tests, factor analysis, rebalance tracking, advanced models, and unlimited saves.',
  },
]
