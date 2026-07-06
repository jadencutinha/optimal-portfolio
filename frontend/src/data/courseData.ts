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
            'Cash / savings account — very low risk, very low return (~2%)',
            'Government bonds — low risk, low return (~3–4%)',
            'Corporate bonds — medium risk, medium return (~5–6%)',
            'Large-cap stocks — higher risk, higher return (~8–10% historically)',
            'Small-cap stocks — even higher risk, even higher return potential',
            'Crypto — very high risk, unpredictable return',
          ],
        },
        {
          type: 'subheading',
          text: 'Key insight',
        },
        {
          type: 'paragraph',
          text: 'The stock market returns about **10% per year on average** — but in any given year it might be +30% or −40%. The average only works if you stay invested long enough to ride out the bad years. This is why **time horizon** matters so much.',
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
          text: 'The key concept behind diversification is **correlation** — how much two assets move together.',
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
          text: 'The average annual return you\'d expect based on historical data. If your portfolio shows **8.99% expected return**, that means historically a similar portfolio returned about 8.99% per year on average. This is not a guarantee — it\'s a historical estimate.',
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
          text: 'The most important metric. It measures **return per unit of risk**. A Sharpe ratio of 0.35 means you\'re getting 0.35% of return for every 1% of risk you take. Higher is better. The optimizer can maximize this — finding the portfolio that gives you the best return for the risk you\'re taking.',
        },
        {
          type: 'subheading',
          text: 'Concentration (HHI)',
        },
        {
          type: 'paragraph',
          text: '**Herfindahl-Hirschman Index** — measures how concentrated your portfolio is. A score close to 1 means very concentrated (most of your money in one or two stocks). A score close to 0 means very spread out. Lower is generally better for a diversified portfolio.',
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
  estimatedTime: '30 min',
  difficulty: 'Advanced',
  modules: [],
}

export const TRACKS: Track[] = [track1, track2, track3]
