export interface ContentBlock {
  type: 'paragraph' | 'subheading' | 'list' | 'callout'
  text?: string
  items?: string[]
}

export interface QuizOption {
  text: string
  correct: boolean
}

export interface QuizQuestion {
  question: string
  options: QuizOption[]
}

export interface Module {
  id: number
  title: string
  content: ContentBlock[]
  quiz: QuizQuestion[]
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Track {
  id: number
  title: string
  description: string
  estimatedTime: string
  difficulty: Difficulty
  modules: Module[]
}

const track1: Track = {
  id: 1,
  title: 'Money Fundamentals',
  description: 'Learn the basics! Saving, investing, risk, and how to read your portfolio',
  estimatedTime: '25 min',
  difficulty: 'Beginner',
  modules: [
    {
      id: 1,
      title: 'Saving vs Investing: What\'s the Difference and Why It Matters',
      content: [
        {
          type: 'paragraph',
          text: 'Most people use **saving** and **investing** interchangeably, but they\'re actually very different things, and understanding the difference is the foundation of everything else.',
        },
        {
          type: 'paragraph',
          text: '**Saving** means putting money somewhere safe and accessible: a checking account, savings account, or under your mattress. The money doesn\'t grow much but it\'s always there when you need it. You save for short-term goals: an emergency fund, a vacation, a new laptop.',
        },
        {
          type: 'paragraph',
          text: '**Investing** means putting money to work so it can grow over time. You buy assets, stocks, bonds, real estate, that increase in value or pay you income. The tradeoff is that investing involves **risk**. Your money can go up, but it can also go down. You invest for long-term goals: retirement, building wealth, financial independence.',
        },
        {
          type: 'subheading',
          text: 'The rule of thumb',
        },
        {
          type: 'list',
          items: [
            'Keep 3–6 months of living expenses in savings as an emergency fund',
            'Invest everything beyond that for the long term',
          ],
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: 'PortfoliU is an investing tool, not a savings tool. It assumes you already have an emergency fund and are ready to put money to work for the long term. If you\'re still building your emergency fund, do that first.',
        },
      ],
      quiz: [
        {
          question: 'You need money for a vacation in 3 months. Should you save or invest it?',
          options: [
            { text: 'Save it', correct: true },
            { text: 'Invest it', correct: false },
          ],
        },
        {
          question: 'You have $10,000 you won\'t need for 10 years. Should you save or invest it?',
          options: [
            { text: 'Save it', correct: false },
            { text: 'Invest it', correct: true },
          ],
        },
        {
          question: 'What is the recommended emergency fund size?',
          options: [
            { text: '1 month of expenses', correct: false },
            { text: '3–6 months of expenses', correct: true },
            { text: '12 months of expenses', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'How Compound Interest Actually Works',
      content: [
        {
          type: 'paragraph',
          text: '**Compound interest** is the most powerful concept in personal finance. Einstein allegedly called it the eighth wonder of the world, and he wasn\'t wrong.',
        },
        {
          type: 'paragraph',
          text: '**Simple interest** means you earn interest only on your original amount. If you invest $1,000 at 10% per year, you earn $100 every year. After 10 years you have $2,000.',
        },
        {
          type: 'paragraph',
          text: '**Compound interest** means you earn interest on your interest too. The same $1,000 at 10% compounded grows like this:',
        },
        {
          type: 'list',
          items: [
            'Year 1: $1,100',
            'Year 2: $1,210',
            'Year 5: $1,611',
            'Year 10: $2,594',
            'Year 30: $17,449',
          ],
        },
        {
          type: 'callout',
          text: 'The same $1,000 turned into $17,449, not $4,000. That\'s the power of compounding.',
        },
        {
          type: 'subheading',
          text: 'The two ingredients',
        },
        {
          type: 'list',
          items: [
            '**Time**: longer you stay invested, the more dramatic the compounding effect',
            '**Rate of return**: even small differences in return rate have huge long-term effects',
          ],
        },
        {
          type: 'subheading',
          text: 'Why starting early matters so much',
        },
        {
          type: 'paragraph',
          text: 'Someone who invests $5,000 per year from age 22 to 32 (10 years, then stops) ends up with more money at retirement than someone who invests $5,000 per year from age 32 to 62 (30 years). **Time in the market beats time spent waiting.**',
        },
      ],
      quiz: [
        {
          question: 'You invest $1,000 at 10% simple interest for 10 years. How much do you have?',
          options: [
            { text: '$1,500', correct: false },
            { text: '$2,000', correct: true },
            { text: '$2,594', correct: false },
          ],
        },
        {
          question: 'What makes compound interest more powerful than simple interest?',
          options: [
            { text: 'You earn interest on your original amount only', correct: false },
            { text: 'You earn interest on your interest too', correct: true },
            { text: 'The interest rate is always higher', correct: false },
          ],
        },
        {
          question: 'Which matters more for compounding?',
          options: [
            { text: 'Starting early', correct: true },
            { text: 'Starting with a large amount', correct: false },
            { text: 'Both matter equally', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Risk vs Return: Why Higher Return Always Means Higher Risk',
      content: [
        {
          type: 'callout',
          text: 'There is no free lunch in investing. Higher potential return always comes with higher risk. You cannot have one without the other. If someone promises you high returns with no risk, they are lying to you.',
        },
        {
          type: 'subheading',
          text: 'What is risk in investing?',
        },
        {
          type: 'paragraph',
          text: '**Risk** is the possibility that your investment loses value. It\'s measured by **volatility**, how much the price moves up and down over time.',
        },
        {
          type: 'subheading',
          text: 'The risk-return spectrum',
        },
        {
          type: 'list',
          items: [
            'Cash / savings account: very low risk, very low return (~2%)',
            'Government bonds: low risk, low return (~3–4%)',
            'Corporate bonds: medium risk, medium return (~5–6%)',
            'Large-cap stocks: higher risk, higher return (~8–10% historically)',
            'Small-cap stocks: even higher risk, even higher return potential',
            'Crypto: very high risk, unpredictable return',
          ],
        },
        {
          type: 'subheading',
          text: 'Key insight',
        },
        {
          type: 'paragraph',
          text: 'The stock market returns about **10% per year on average**. But in any given year it might be +30% or −40%. The average only works if you stay invested long enough to ride out the bad years. This is why **time horizon** matters so much.',
        },
        {
          type: 'subheading',
          text: 'For PortfoliU',
        },
        {
          type: 'paragraph',
          text: 'When you set your **risk tolerance** in PortfoliU, you\'re deciding where on this spectrum you want to sit. Higher risk tolerance → optimizer targets higher return portfolios. Lower risk tolerance → optimizer targets more stable portfolios.',
        },
      ],
      quiz: [
        {
          question: 'An investment promises 20% returns with zero risk. What should you think?',
          options: [
            { text: "It's a great opportunity", correct: false },
            { text: "It's probably a scam", correct: true },
            { text: 'It depends on the company', correct: false },
          ],
        },
        {
          question: 'Which asset class historically has the highest long-term return?',
          options: [
            { text: 'Government bonds', correct: false },
            { text: 'Large-cap stocks', correct: true },
            { text: 'Savings accounts', correct: false },
          ],
        },
        {
          question: "Why does the stock market's 10% average return require patience?",
          options: [
            { text: 'Because returns are guaranteed', correct: false },
            { text: 'Because individual years can be very positive or very negative', correct: true },
            { text: 'Because you need to pick the right stocks', correct: false },
          ],
        },
      ],
    },
    {
      id: 4,
      title: "Diversification: Don't Put All Your Eggs in One Basket",
      content: [
        {
          type: 'callout',
          text: 'Diversification is the only free lunch in investing. It\'s the one strategy that reduces your risk without reducing your expected return.',
        },
        {
          type: 'subheading',
          text: 'What is diversification?',
        },
        {
          type: 'paragraph',
          text: 'Spreading your money across multiple investments so that if one goes down, the others aren\'t affected the same way.',
        },
        {
          type: 'subheading',
          text: 'Why it works',
        },
        {
          type: 'paragraph',
          text: 'Different assets don\'t always move together. When tech stocks fall, healthcare stocks might rise. When US stocks fall, international stocks might hold steady. When stocks fall overall, bonds often go up. By holding all of these, you smooth out the ride.',
        },
        {
          type: 'subheading',
          text: 'Correlation',
        },
        {
          type: 'paragraph',
          text: 'The key concept behind diversification is **correlation**: how much two assets move together.',
        },
        {
          type: 'list',
          items: [
            '**Correlation of 1.0**: they always move exactly together (no diversification benefit)',
            '**Correlation of 0**: they move completely independently (good diversification)',
            '**Correlation of −1.0**: they always move in opposite directions (perfect hedge)',
          ],
        },
        {
          type: 'subheading',
          text: 'How PortfoliU uses this',
        },
        {
          type: 'paragraph',
          text: 'The optimizer doesn\'t just look at each stock individually. It looks at the **covariance matrix**: how every stock in your portfolio moves relative to every other stock. It then finds the combination of weights that gives you the most return for the least risk, taking all those relationships into account.',
        },
      ],
      quiz: [
        {
          question: 'You own stock in 5 different tech companies. Are you diversified?',
          options: [
            { text: 'Yes, 5 stocks is diversified', correct: false },
            { text: "No, they're all in the same sector", correct: true },
            { text: 'It depends on the companies', correct: false },
          ],
        },
        {
          question: 'What does a correlation of −1.0 between two assets mean?',
          options: [
            { text: 'They always move together', correct: false },
            { text: 'They move independently', correct: false },
            { text: 'They always move in opposite directions', correct: true },
          ],
        },
        {
          question: 'What is the "free lunch" of investing?',
          options: [
            { text: 'Compound interest', correct: false },
            { text: 'Diversification', correct: true },
            { text: 'Index funds', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'How to Read Your Portfolio: What the Numbers Mean',
      content: [
        {
          type: 'paragraph',
          text: 'Once PortfoliU optimizes your portfolio, you\'ll see a bunch of numbers. Here\'s what they all mean in plain English.',
        },
        {
          type: 'subheading',
          text: 'Expected Return',
        },
        {
          type: 'paragraph',
          text: 'The average annual return you\'d expect based on historical data. If your portfolio shows **8.99% expected return**, that means historically a similar portfolio returned about 8.99% per year on average. This is not a guarantee. It\'s a historical estimate.',
        },
        {
          type: 'subheading',
          text: 'Volatility',
        },
        {
          type: 'paragraph',
          text: 'How much your portfolio value bounces around. A **volatility of 19.73%** means in any given year your portfolio might be up or down about 20% from where it started. Higher volatility = bumpier ride but potentially higher return.',
        },
        {
          type: 'subheading',
          text: 'Sharpe Ratio',
        },
        {
          type: 'paragraph',
          text: 'The most important metric. It measures **return per unit of risk**. A Sharpe ratio of 0.35 means you\'re getting 0.35% of return for every 1% of risk you take. Higher is better. The optimizer can maximize this, finding the portfolio that gives you the best return for the risk you\'re taking.',
        },
        {
          type: 'subheading',
          text: 'Concentration (HHI)',
        },
        {
          type: 'paragraph',
          text: '**Herfindahl-Hirschman Index**: measures how concentrated your portfolio is. A score close to 1 means very concentrated (most of your money in one or two stocks). A score close to 0 means very spread out. Lower is generally better for a diversified portfolio.',
        },
        {
          type: 'subheading',
          text: 'Effective Holdings',
        },
        {
          type: 'paragraph',
          text: 'An estimate of how many truly independent positions you hold. Even if you own 8 stocks, if they all move together, your effective holdings might be 3. Higher is better.',
        },
        {
          type: 'subheading',
          text: 'Sectors',
        },
        {
          type: 'paragraph',
          text: 'How many different industries your portfolio spans. More sectors = more diversified.',
        },
      ],
      quiz: [
        {
          question: "Your portfolio has a Sharpe ratio of 0.5. Your friend's has 0.8. Whose is better?",
          options: [
            { text: 'Yours', correct: false },
            { text: "Your friend's", correct: true },
            { text: "They're the same", correct: false },
          ],
        },
        {
          question: 'What does a high HHI concentration score mean?',
          options: [
            { text: 'Your portfolio is well diversified', correct: false },
            { text: 'Most of your money is in a few stocks', correct: true },
            { text: 'Your returns will be higher', correct: false },
          ],
        },
        {
          question: 'Expected return is:',
          options: [
            { text: 'A guaranteed annual return', correct: false },
            { text: 'A historical estimate of average annual return', correct: true },
            { text: "The minimum you'll earn", correct: false },
          ],
        },
      ],
    },
  ],
}

const track2: Track = {
  id: 2,
  title: 'Behavioral Finance',
  description: 'Understand how your psychology affects your returns and how to fix it',
  estimatedTime: '25 min',
  difficulty: 'Intermediate',
  modules: [],
}

const track3: Track = {
  id: 3,
  title: 'Portfolio Optimization',
  description: 'Learn the math behind PortfoliU: the same methods hedge funds use',
  estimatedTime: '45 min',
  difficulty: 'Advanced',
  modules: [
    {
      id: 1,
      title: "Mean-Variance Basics: Why 1 + 1 Doesn't Equal 2",
      content: [
        {
          type: 'paragraph',
          text: "Combining two investments isn't just averaging them. In 1952, Harry Markowitz showed that the **right** combination of assets can give you a better risk/return trade-off than any single asset alone, an insight that eventually won him a Nobel Prize. This track builds up the entire mathematical engine behind PortfoliU's optimizer, one concept at a time, using one running example throughout.",
        },
        {
          type: 'subheading',
          text: 'Meet the running example',
        },
        {
          type: 'paragraph',
          text: "We'll use two assets for the first few modules: **Stock A**, a growth stock with expected return **12%** and volatility (standard deviation) **25%**, and **Stock B**, a bond fund with expected return **6%** and volatility **10%**. Their returns are moderately correlated: **correlation (ρ) = 0.3**.",
        },
        {
          type: 'subheading',
          text: 'Portfolio return is easy: a weighted average',
        },
        {
          type: 'paragraph',
          text: 'Put 50% into A and 50% into B, and your expected portfolio return is simply the weighted average: 0.5 × 12% + 0.5 × 6% = **9%**. Nothing tricky yet.',
        },
        {
          type: 'subheading',
          text: 'Portfolio risk is NOT a weighted average',
        },
        {
          type: 'paragraph',
          text: "A naive guess would be 0.5 × 25% + 0.5 × 10% = 17.5% volatility. That guess is wrong, and the reason why is the entire point of this course: because A and B don't move in perfect lockstep, they partly cushion each other. When you work through the actual portfolio-variance formula (which accounts for how much the two assets move together), the real 50/50 portfolio volatility comes out to about **14.8%**, not 17.5%.",
        },
        {
          type: 'list',
          items: [
            '**Correlation (ρ)** measures how much two assets move together, from -1 (perfect opposites) to +1 (perfect lockstep)',
            'The lower the correlation, the more the assets cushion each other, and the bigger the gap between the naive weighted-average risk and the real portfolio risk',
          ],
        },
        {
          type: 'callout',
          text: 'Combining imperfectly-correlated assets lowers portfolio risk below the weighted average of their individual risks, without giving up any expected return. This is "don\'t put all your eggs in one basket," quantified.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: "PortfoliU's optimizer solves for exactly this: the mix of weights that gives you the best return-for-risk trade-off, using this same return/variance math scaled up to however many assets you hold. The next module covers how it decides which mix is actually \"best.\"",
        },
      ],
      quiz: [
        {
          question: "You blend a 12%-return stock with a 6%-return bond 50/50. What's the portfolio's expected return?",
          options: [
            { text: '6%', correct: false },
            { text: '9%', correct: true },
            { text: '12%', correct: false },
          ],
        },
        {
          question: "What's the missing ingredient that makes portfolio risk different from a simple weighted average of individual risks?",
          options: [
            { text: 'The risk-free rate', correct: false },
            { text: 'How much the assets move together (correlation)', correct: true },
            { text: 'The number of assets alone', correct: false },
          ],
        },
        {
          question: 'If two assets had a correlation of exactly 1 (moved in perfect lockstep), what would portfolio volatility equal?',
          options: [
            { text: 'Less than the weighted average', correct: false },
            { text: 'Exactly the weighted average of the individual volatilities', correct: true },
            { text: 'Zero', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'The Sharpe Ratio and the Efficient Frontier',
      content: [
        {
          type: 'paragraph',
          text: 'Now that we can compute return and risk for any mix of A and B, the natural question is: which mix is "best"? Return alone isn\'t enough: 100% A has the highest return but also the highest risk. We need a common yardstick: the **Sharpe ratio**.',
        },
        {
          type: 'subheading',
          text: 'The Sharpe ratio: return per unit of risk',
        },
        {
          type: 'paragraph',
          text: 'Sharpe ratio = (portfolio return − risk-free rate) ÷ portfolio volatility. It answers: how much extra return am I getting for each unit of risk I take on? We\'ll use a risk-free rate of **2%** (think T-bills).',
        },
        {
          type: 'subheading',
          text: 'Tracing out every possible mix',
        },
        {
          type: 'list',
          items: [
            '100% B / 0% A → return 6%, volatility 10%, Sharpe 0.40',
            '75% B / 25% A → return 7.5%, volatility 11.1%, Sharpe 0.50',
            '50% B / 50% A → return 9%, volatility 14.8%, Sharpe 0.47',
            '25% B / 75% A → return 10.5%, volatility 19.6%, Sharpe 0.43',
            '0% B / 100% A → return 12%, volatility 25%, Sharpe 0.40',
          ],
        },
        {
          type: 'paragraph',
          text: "Notice the Sharpe ratio doesn't rise in a straight line as you add more of the higher-return asset: it **peaks around 75% B / 25% A**, then falls even though return keeps climbing. Adding too much of the volatile stock eventually costs more in risk than it earns in return. That peak is the **tangency portfolio**: the single best risk/return trade-off achievable from these two assets.",
        },
        {
          type: 'subheading',
          text: 'The efficient frontier',
        },
        {
          type: 'paragraph',
          text: 'Plot every possible mix\'s risk (x-axis) against its return (y-axis) and you get a curve. The upper-left edge of everything achievable is the **efficient frontier**: portfolios where you can\'t get more return without taking more risk, or less risk without giving up return. Everything below that edge is leaving free performance on the table.',
        },
        {
          type: 'callout',
          text: "The tangency portfolio is the point on the efficient frontier with the maximum Sharpe ratio: the single mix everyone would prefer regardless of personal risk tolerance, since they could just borrow or lend to scale it up or down to their taste.",
        },
        {
          type: 'callout',
          text: 'PortfoliU\'s "Max Sharpe" objective solves exactly this optimization automatically across as many assets as you hold, and its Efficient Frontier chart plots this exact curve for your actual portfolio.',
        },
      ],
      quiz: [
        {
          question: 'What does the Sharpe ratio measure?',
          options: [
            { text: 'Total return only', correct: false },
            { text: 'Return earned per unit of risk taken', correct: true },
            { text: 'The correlation between two assets', correct: false },
          ],
        },
        {
          question: 'In our example, which mix had the highest Sharpe ratio?',
          options: [
            { text: '100% A', correct: false },
            { text: '50% A / 50% B', correct: false },
            { text: '25% A / 75% B', correct: true },
          ],
        },
        {
          question: 'What is the efficient frontier?',
          options: [
            { text: 'Any portfolio with positive returns', correct: false },
            { text: 'The set of portfolios offering the best possible return for each level of risk', correct: true },
            { text: 'A portfolio with zero risk', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Correlation Is the Real Lever: A Deep Dive on Diversification',
      content: [
        {
          type: 'paragraph',
          text: 'Module 1 showed that a 0.3 correlation dropped our 50/50 portfolio\'s volatility from a naive 17.5% to about 14.8%. What if the correlation had been different? Same two assets, same 50/50 weights, same expected return; only correlation changes:',
        },
        {
          type: 'list',
          items: [
            'ρ = 1.0 (perfect lockstep) → volatility 17.5%',
            'ρ = 0.3 (our running example) → volatility 14.8%',
            'ρ = 0.0 (unrelated) → volatility 13.5%',
            'ρ = -0.3 (mild opposite) → volatility 12.0%',
            'ρ = -1.0 (perfect opposite) → volatility 7.5%',
          ],
        },
        {
          type: 'paragraph',
          text: "Lower (more negative) correlation means lower portfolio risk for the exact same two assets at the exact same weights and the exact same expected return. Diversification is entirely about correlation, not about how many tickers you own.",
        },
        {
          type: 'subheading',
          text: '"Number of stocks" is a bad proxy for diversification',
        },
        {
          type: 'paragraph',
          text: "Owning 20 stocks that are all mega-cap tech companies doesn't diversify much, because they tend to move together in downturns (high correlation). Owning just 5 stocks across genuinely different sectors or asset classes can diversify far better despite having fewer holdings.",
        },
        {
          type: 'subheading',
          text: 'Scaling beyond two assets: the covariance matrix',
        },
        {
          type: 'paragraph',
          text: 'With N assets, you need to estimate not just N variances but N(N-1)/2 pairwise correlations. For 10 assets that\'s 45 numbers; for 30 assets, 435; for the S&P 500, over **124,000**. This estimation burden is exactly why the next module exists.',
        },
        {
          type: 'callout',
          text: 'Diversification benefit comes from correlation, not asset count. A genuinely diversified portfolio holds assets that respond differently to the same economic shocks.',
        },
        {
          type: 'callout',
          text: 'PortfoliU computes your full covariance matrix automatically and reports concentration (HHI) and effective holdings, so you can see whether you\'re actually diversified or just holding a lot of similar things.',
        },
      ],
      quiz: [
        {
          question: "Holding our example's 50/50 mix, which correlation would give the LOWEST portfolio volatility?",
          options: [
            { text: '1.0', correct: false },
            { text: '0.3', correct: false },
            { text: '-1.0', correct: true },
          ],
        },
        {
          question: 'Why can 20 similar tech stocks diversify worse than 5 stocks across different sectors?',
          options: [
            { text: 'Because more stocks is always better', correct: false },
            { text: 'Because the tech stocks are highly correlated and move together', correct: true },
            { text: "Because sector doesn't matter", correct: false },
          ],
        },
        {
          question: 'How many pairwise correlations do you need to estimate for 30 assets?',
          options: [
            { text: '30', correct: false },
            { text: '60', correct: false },
            { text: '435', correct: true },
          ],
        },
      ],
    },
    {
      id: 4,
      title: "Risk Models: Why Raw Historical Covariance Isn't Enough",
      content: [
        {
          type: 'paragraph',
          text: "Module 3 showed the covariance matrix is central to diversification math, but also that it gets huge fast. There's a bigger problem: with limited historical data, the raw sample covariance matrix (just computed directly from past returns) is noisy and unreliable, especially the off-diagonal correlation estimates.",
        },
        {
          type: 'subheading',
          text: 'The noise problem',
        },
        {
          type: 'paragraph',
          text: "Say you have 5 years of monthly returns (60 data points) but you're estimating a 100-asset covariance matrix (4,950 pairwise correlations). You have far fewer data points than numbers to estimate. The sample matrix ends up overfit to historical noise, and optimizers built on it tend to make large, wrong-in-hindsight bets on whichever pairs happened to look best-diversifying in that specific historical window.",
        },
        {
          type: 'subheading',
          text: 'Fix 1: Shrinkage (Ledoit-Wolf)',
        },
        {
          type: 'paragraph',
          text: "The idea: blend the noisy sample covariance matrix toward a simpler, more stable \"target\" matrix (for example, one where all correlations are assumed equal). The optimal blend ratio is calculated statistically, not guessed. The result is a covariance estimate that overfits less, even though it's technically less accurate on the specific historical sample you happened to observe.",
        },
        {
          type: 'subheading',
          text: 'Fix 2: Factor models (PCA)',
        },
        {
          type: 'paragraph',
          text: 'A second idea: instead of directly estimating every pairwise correlation, assume returns are driven by a small number of common underlying factors: "the market," "growth vs. value," "interest-rate sensitivity." Principal Component Analysis (PCA) finds these factors directly from the data, cutting thousands of numbers down to a much smaller factor-exposure table.',
        },
        {
          type: 'list',
          items: [
            '**Sample covariance**: most flexible, but noisiest with limited data',
            '**Shrinkage**: blends the sample matrix toward stability; a solid general-purpose default',
            '**Factor model (PCA)**: fewest parameters, most stable, but assumes the factor structure is right',
            '**EWMA**: weights recent data more heavily, adapting faster to changing market regimes',
          ],
        },
        {
          type: 'callout',
          text: "With limited data, a \"worse-looking\" but more stable risk estimate usually produces better out-of-sample portfolios than the raw sample covariance.",
        },
        {
          type: 'callout',
          text: 'This is exactly why PortfoliU lets you choose the risk model (Sample, Ledoit-Wolf shrinkage, EWMA, or PCA factor) instead of hardcoding raw sample covariance.',
        },
      ],
      quiz: [
        {
          question: 'Why is raw sample covariance risky to use directly for optimization?',
          options: [
            { text: "It's always slower to calculate", correct: false },
            { text: "With limited historical data, it's noisy and overfit to the past", correct: true },
            { text: 'It ignores expected returns', correct: false },
          ],
        },
        {
          question: 'What does shrinkage do?',
          options: [
            { text: 'Deletes low-return assets', correct: false },
            { text: 'Blends the noisy sample matrix toward a more stable target', correct: true },
            { text: 'Increases the number of assets considered', correct: false },
          ],
        },
        {
          question: 'What is the main idea behind factor models like PCA in this context?',
          options: [
            { text: 'Explain returns via a small number of common underlying factors instead of every pairwise correlation', correct: true },
            { text: 'Ignore risk entirely', correct: false },
            { text: 'Only use the most recent day of data', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Black-Litterman: Taming Estimation Error in Expected Returns',
      content: [
        {
          type: 'paragraph',
          text: "Every module so far assumed we already knew expected returns (12% for A, 6% for B). In reality, estimating expected returns is far noisier than estimating risk, and mean-variance optimization is brutally sensitive to that noise.",
        },
        {
          type: 'subheading',
          text: 'The instability problem',
        },
        {
          type: 'paragraph',
          text: "Recall module 2's max-Sharpe mix was about 75% B / 25% A. Nudge Stock A's expected return estimate from 12% up to just 14% (a small, entirely plausible estimation error) and rerun the same math: the max-Sharpe weight can swing to nearly 50%+ A. A tiny, unreliable change to an input you can barely estimate accurately produces a huge, confident-looking change to the output. This is the single biggest practical criticism of naive Markowitz optimization.",
        },
        {
          type: 'subheading',
          text: "Black-Litterman's fix: start from the market, not your guess",
        },
        {
          type: 'paragraph',
          text: 'Instead of plugging in your own noisy historical-average return estimates directly, Black-Litterman starts from the "equilibrium" returns implied by actual market-cap weights, reverse-engineered by asking "what returns would make today\'s market weights optimal?" These equilibrium returns are far more stable than raw historical averages.',
        },
        {
          type: 'subheading',
          text: 'Then blend in your views, with a confidence level',
        },
        {
          type: 'paragraph',
          text: 'You then adjust the equilibrium returns only where you have an actual, deliberate view ("I think Stock A will outperform equilibrium by 2%, and I\'m 60% confident"), and Black-Litterman mathematically blends this with market equilibrium in proportion to your confidence. State no view, and you simply get plain market equilibrium back.',
        },
        {
          type: 'list',
          items: [
            'Produces far more stable, diversified portfolios than raw historical-mean-variance',
            'Avoids extreme all-in-one-asset allocations caused by noisy return estimates',
            'Lets you inject specific opinions without throwing out market information entirely',
          ],
        },
        {
          type: 'callout',
          text: "Black-Litterman doesn't fix risk estimation. That's shrinkage and factor models from the last module. It fixes the far noisier expected-return estimation problem, which is the more fragile half of mean-variance optimization.",
        },
        {
          type: 'callout',
          text: 'PortfoliU offers Black-Litterman return estimates as an alternative to plugging in raw historical averages, specifically to avoid the instability shown above.',
        },
      ],
      quiz: [
        {
          question: 'Why is naive mean-variance optimization considered unstable?',
          options: [
            { text: 'It runs too slowly', correct: false },
            { text: 'Small changes in expected-return estimates can cause large swings in optimal weights', correct: true },
            { text: "It can't handle more than 2 assets", correct: false },
          ],
        },
        {
          question: 'What does Black-Litterman start from instead of raw historical average returns?',
          options: [
            { text: 'A random guess', correct: false },
            { text: 'Equilibrium returns implied by market-cap weights', correct: true },
            { text: 'Zero expected return for every asset', correct: false },
          ],
        },
        {
          question: 'How does Black-Litterman incorporate your own opinions?',
          options: [
            { text: 'It ignores the market completely and uses only your view', correct: false },
            { text: 'It blends your view with market equilibrium, weighted by your confidence', correct: true },
            { text: 'It requires 100% confidence or no view at all', correct: false },
          ],
        },
      ],
    },
    {
      id: 6,
      title: 'Beyond Variance: CVaR, Risk Parity, and Choosing an Objective',
      content: [
        {
          type: 'paragraph',
          text: 'Every objective so far (min variance, max Sharpe) treats risk symmetrically: a portfolio that swings up 20% counts as exactly as "risky" as one that swings down 20%. Most investors don\'t actually feel that way. This closing module covers two ideas that address that, plus a wrap-up of every objective PortfoliU offers.',
        },
        {
          type: 'subheading',
          text: 'CVaR: focus on the bad scenarios specifically',
        },
        {
          type: 'paragraph',
          text: 'Conditional Value-at-Risk (CVaR) asks a more direct downside question: "in the worst 5% of scenarios, what\'s my average loss?" Rather than penalizing all variance equally, CVaR optimization specifically minimizes exposure to severe left-tail outcomes, directly targeting crash risk rather than day-to-day wiggle.',
        },
        {
          type: 'subheading',
          text: 'Risk parity: equalize risk contribution, not returns',
        },
        {
          type: 'paragraph',
          text: 'Max-Sharpe optimization concentrates weight wherever the best trade-off is; module 2 found a 75% B / 25% A tangency portfolio, mostly bonds. Risk parity asks a different question: what weights make each asset contribute equally to total portfolio risk? Since Stock A is 2.5× as volatile as Stock B (25% vs. 10%), risk parity weights roughly in inverse proportion to volatility: about **29% A / 71% B**, a genuinely different portfolio from a max-Sharpe or equal-dollar split, even though it happens to land close to our tangency portfolio here.',
        },
        {
          type: 'list',
          items: [
            '**Min variance**: lowest possible risk, ignores expected returns entirely',
            '**Max Sharpe**: best return per unit of risk, sensitive to return estimates (see module 5)',
            '**Target return / risk**: hit a specific number, optimize the other side',
            '**Risk parity**: equal risk contribution per asset, ignores expected returns, very stable',
            '**Max diversification**: maximize the ratio of weighted-average volatility to actual portfolio volatility',
            '**CVaR**: minimize average loss in the worst-case scenarios specifically',
            '**Net-of-cost**: like max Sharpe, but penalizes turnover and trading costs',
          ],
        },
        {
          type: 'callout',
          text: "There is no single \"best\" objective. Min variance and risk parity avoid return-estimation risk entirely (module 5's problem) by not using expected returns at all. Max Sharpe and target-return objectives capture more expected upside but inherit estimation-error fragility. CVaR trades some average-case efficiency for explicit crash protection.",
        },
        {
          type: 'subheading',
          text: 'Putting it all together',
        },
        {
          type: 'paragraph',
          text: "Across this track you've built, mentally, an entire portfolio optimizer from scratch: expected return and risk (module 1), the Sharpe ratio and efficient frontier (module 2), why correlation, not asset count, drives diversification (module 3), why raw covariance needs shrinkage or factor structure (module 4), why expected returns need Black-Litterman-style stabilization (module 5), and now the full menu of objectives beyond plain variance.",
        },
        {
          type: 'callout',
          text: "Every objective above (Min Variance, Max Sharpe, Target Return/Risk, Risk Parity, Max Diversification, CVaR, Net-of-Cost) is selectable directly in PortfoliU's optimizer. You've just learned what each one is actually doing under the hood.",
        },
      ],
      quiz: [
        {
          question: 'What does CVaR specifically target?',
          options: [
            { text: 'Overall day-to-day volatility', correct: false },
            { text: 'The average loss in the worst-case scenarios', correct: true },
            { text: 'Only the best-case scenarios', correct: false },
          ],
        },
        {
          question: 'What does risk parity try to equalize?',
          options: [
            { text: 'Expected return across assets', correct: false },
            { text: "Each asset's contribution to total portfolio risk", correct: true },
            { text: 'The number of shares of each asset', correct: false },
          ],
        },
        {
          question: 'Which objectives avoid relying on expected-return estimates at all?',
          options: [
            { text: 'Max Sharpe and Target Return', correct: false },
            { text: 'Min Variance and Risk Parity', correct: true },
            { text: 'Black-Litterman and CVaR', correct: false },
          ],
        },
      ],
    },
  ],
}

export const TRACKS: Track[] = [track1, track2, track3]
