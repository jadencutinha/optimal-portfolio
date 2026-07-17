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
            'Keep 3 to 6 months of living expenses in savings as an emergency fund',
            'Invest everything beyond that for the long term',
          ],
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: 'Halo is an investing tool, not a savings tool. It assumes you already have an emergency fund and are ready to put money to work for the long term. If you\'re still building your emergency fund, do that first.',
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
            { text: '3 to 6 months of expenses', correct: true },
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
            { text: '$2,000', correct: true},
            { text: '$1,500', correct: false },
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
            'Government bonds: low risk, low return (~3 to 4%)',
            'Corporate bonds: medium risk, medium return (~5 to 6%)',
            'Large-cap stocks: higher risk, higher return (~8 to 10% historically)',
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
          text: 'For Halo',
        },
        {
          type: 'paragraph',
          text: 'When you set your **risk tolerance** in Halo, you\'re deciding where on this spectrum you want to sit. Higher risk tolerance → optimizer targets higher return portfolios. Lower risk tolerance → optimizer targets more stable portfolios.',
        },
      ],
      quiz: [
        {
          question: 'An investment promises 20% returns with zero risk. What should you think?',
          options: [
            { text: "It's a great opportunity", correct: false },
            { text: 'It depends on the company', correct: false },
            { text: "It's probably a scam", correct: true },
          ],
        },
        {
          question: 'Which asset class historically has the highest long-term return?',
          options: [
            { text: 'Government bonds', correct: false },
            { text: 'Savings accounts', correct: false },
            { text: 'Large-cap stocks', correct: true },
          ],
        },
        {
          question: "Why does the stock market's 10% average return require patience?",
          options: [
            { text: 'Because individual years can be very positive or very negative', correct: true },
            { text: 'Because returns are guaranteed', correct: false },
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
          text: 'How Halo uses this',
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
            { text: 'Diversification', correct: true },
            { text: 'Compound interest', correct: false },
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
          text: 'Once Halo optimizes your portfolio, you\'ll see a bunch of numbers. Here\'s what they all mean in plain English.',
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
            { text: 'Your returns will be higher', correct: false },
            { text: 'Most of your money is in a few stocks', correct: true },
          ],
        },
        {
          question: 'Expected return is:',
          options: [
            { text: 'A guaranteed annual return', correct: false },
            { text: "The minimum you'll earn", correct: false },
            { text: 'A historical estimate of average annual return', correct: true },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Know Your Building Blocks: S&P 500, Nasdaq 100 Direct, and Bond Ladders',
      content: [
        {
          type: 'paragraph',
          text: 'Before you start picking stocks, it helps to know a few terms you\'ll run into constantly: the benchmarks everyone compares returns to, and the fixed-income tools some investors use alongside a stock portfolio.',
        },
        {
          type: 'subheading',
          text: 'What Is the S&P 500?',
        },
        {
          type: 'paragraph',
          text: 'The **S&P 500** is a stock market index that tracks 500 of the largest publicly traded U.S. companies, weighted by market value (bigger companies move the index more). It\'s the most widely used benchmark for "how is the stock market doing."',
        },
        {
          type: 'list',
          items: [
            'Spans nearly every sector: tech, healthcare, financials, energy, and more',
            '**Market-cap weighted**, so a company like Apple or Microsoft moves the index far more than a smaller company does',
            'Historically returned roughly 9-10% per year on average before inflation, though any single year can swing wildly in either direction',
            'Often used as the "bar to beat": if a portfolio underperforms the S&P 500 for years, a low-cost fund that just tracks it may be the simpler choice',
          ],
        },
        {
          type: 'subheading',
          text: 'What Is Nasdaq 100 Direct?',
        },
        {
          type: 'paragraph',
          text: 'The **Nasdaq 100** is an index of the 100 largest non-financial companies listed on the Nasdaq exchange, tilted heavily toward technology. "Direct" refers to **direct indexing**: instead of buying a single fund or ETF (like QQQ) that owns all 100 stocks for you, you buy the individual stocks yourself in roughly the same weights the index uses.',
        },
        {
          type: 'list',
          items: [
            'You get full control over which stocks you hold, so you can exclude a company you don\'t want or tilt weights differently',
            'You can sell individual losing positions to offset gains for tax purposes, something you can\'t do inside a shared fund',
            'It takes more effort and usually more money than buying one ETF, so it\'s typically only worth it once you have a meaningful amount invested',
          ],
        },
        {
          type: 'callout',
          text: 'Halo is direct indexing at your own scale: you choose the stocks that matter to you, and the optimizer decides how much of each to hold.',
        },
        {
          type: 'subheading',
          text: 'What Is a Treasury Bond Ladder?',
        },
        {
          type: 'paragraph',
          text: 'A **bond ladder** splits your money across several U.S. Treasury bonds that mature at different times, for example one maturing in 1 year, another in 2 years, another in 3, and so on, instead of putting it all into a single bond with one maturity date.',
        },
        {
          type: 'list',
          items: [
            '**Steady cash flow**: a chunk of your money matures and becomes available every year, so you\'re not locked up for a decade at a time',
            '**Lower interest rate risk**: when a rung matures, you reinvest it at whatever the current rate is, so you\'re never stuck holding only old, lower-paying bonds',
            'Treasury bonds are backed by the U.S. government, making them one of the safest fixed-income options available',
          ],
        },
        {
          type: 'subheading',
          text: 'So What Is Halo For?',
        },
        {
          type: 'paragraph',
          text: 'Halo is a **stock portfolio-building tool**. You pick the stocks you\'re interested in, and Halo runs real portfolio optimization math (the same models professional investors use) to figure out how much of your money should go into each one, balancing expected return against risk. It doesn\'t pick stocks for you, it\'s not an index fund, and it\'s not a bond ladder. It\'s a way to build and fine-tune your own stock portfolio with real math instead of guessing.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: 'Everything above is background you\'ll hear referenced constantly. Halo itself is the tool where you do the actual work: pick your stocks, and let the optimizer find the ideal weights between them.',
        },
      ],
      quiz: [
        {
          question: 'The S&P 500 tracks:',
          options: [
            { text: '500 of the largest U.S. companies, weighted by market value', correct: true },
            { text: '500 random small-cap stocks', correct: false },
            { text: 'Only technology companies', correct: false },
          ],
        },
        {
          question: 'What does "direct indexing," like Nasdaq 100 Direct, mean?',
          options: [
            { text: 'Buying one ETF that owns all the index stocks for you', correct: false },
            { text: 'Buying the individual stocks in an index yourself, instead of a fund', correct: true },
            { text: 'Investing directly in Treasury bonds', correct: false },
          ],
        },
        {
          question: 'What is the main benefit of a Treasury bond ladder?',
          options: [
            { text: 'Guaranteed high returns', correct: false },
            { text: 'Staggered maturities that provide steady cash flow and lower interest rate risk', correct: true },
            { text: 'It replaces the need for stocks entirely', correct: false },
          ],
        },
        {
          question: 'What does Halo actually do with the stocks you choose?',
          options: [
            { text: 'Picks the stocks for you automatically', correct: false },
            { text: 'Calculates the optimal allocation, or weights, between the stocks you chose', correct: true },
            { text: 'Replaces the need for saving money', correct: false },
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
  modules: [
    {
      id: 1,
      title: 'Loss Aversion and the Disposition Effect',
      content: [
        {
          type: 'paragraph',
          text: 'In the 1970s, psychologists Daniel Kahneman and Amos Tversky found something strange: people feel the pain of a loss about **twice as strongly** as the pleasure of an equivalent gain. Losing $100 hurts roughly twice as much as winning $100 feels good. This is **loss aversion**, and it quietly distorts almost every investing decision you make.',
        },
        {
          type: 'subheading',
          text: 'The disposition effect',
        },
        {
          type: 'paragraph',
          text: 'Loss aversion shows up most clearly in what researchers call the **disposition effect**: investors tend to sell their winning stocks too early (to lock in the good feeling) and hold onto their losing stocks too long (hoping they will "come back" so the loss never has to be realized). Studies of real brokerage accounts consistently find investors are much more likely to sell a stock that is up than one that is down, even when the losing stock has worse future prospects.',
        },
        {
          type: 'callout',
          text: 'A loss only becomes "real" to most people when they sell. So they avoid selling, even when holding on is the objectively worse decision. The stock does not know what you paid for it, and neither does the market.',
        },
        {
          type: 'subheading',
          text: 'Why this is expensive',
        },
        {
          type: 'list',
          items: [
            'Winners get sold too early, cutting off further gains',
            'Losers get held too long, sometimes turning a small loss into a large one',
            'Taxes get worse too: realizing gains too early triggers tax bills sooner, while unrealized losses that could offset them just sit there',
          ],
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'paragraph',
          text: 'Halo\'s optimizer has no memory of what you paid for anything. It looks only at expected return, risk, and correlation going forward, so it cannot fall into the disposition effect the way a person can. When Halo tells you to trim a position, it is because of where that asset sits in your portfolio today, not whether it happens to be a winner or a loser right now.',
        },
        {
          type: 'callout',
          text: 'Halo\'s Risk Assessment questionnaire, which you can take from the home screen, specifically checks whether your reaction to a hypothetical drop or your comfort with volatility shows signs of loss aversion, and flags it in your results if it does.',
        },
      ],
      quiz: [
        {
          question: 'According to loss aversion, how does losing $100 feel compared to winning $100?',
          options: [
            { text: 'About the same', correct: false },
            { text: 'Losses barely register compared to gains', correct: false },
            { text: 'Roughly twice as bad as winning $100 feels good', correct: true },
          ],
        },
        {
          question: 'What is the disposition effect?',
          options: [
            { text: 'Selling winners too early and holding losers too long', correct: true },
            { text: 'Selling everything at once regardless of performance', correct: false },
            { text: 'Only investing in assets you feel positive about', correct: false },
          ],
        },
        {
          question: 'Why does an optimizer like Halo avoid the disposition effect?',
          options: [
            { text: 'It only considers forward-looking risk and return, not your purchase price', correct: true },
            { text: 'It refuses to ever sell a losing position', correct: false },
            { text: 'It automatically sells anything that is currently up', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Overconfidence, Overtrading, and Home Bias',
      content: [
        {
          type: 'paragraph',
          text: 'Ask a room full of drivers if they are above average, and most will say yes. The same overconfidence shows up in investing: people tend to overestimate how much they know and how much control they have over outcomes that are largely driven by chance.',
        },
        {
          type: 'subheading',
          text: 'Overtrading hurts returns',
        },
        {
          type: 'paragraph',
          text: 'A well-known study of individual brokerage accounts by researchers Brad Barber and Terrance Odean found that the investors who traded the most earned significantly lower returns than those who traded the least, even before accounting for the extra fees and taxes from all that activity. Confidence in your own stock picks or market timing does not usually make you right more often. It mostly makes you trade more, and every trade has a cost.',
        },
        {
          type: 'subheading',
          text: 'Home bias',
        },
        {
          type: 'paragraph',
          text: 'Overconfidence also shows up as **home bias**: a tendency to overweight what feels familiar, like your own country\'s stocks, your employer\'s stock, or industries you personally work in. Familiarity feels like knowledge, but it is not the same thing as diversification, and it often leaves you concentrated exactly where your paycheck already depends on the outcome.',
        },
        {
          type: 'list',
          items: [
            'More trades means more transaction costs and often more taxes',
            'Confidence in a prediction is a feeling, not evidence that the prediction is accurate',
            'Overweighting familiar or local assets reduces diversification, even though it feels safer',
          ],
        },
        {
          type: 'callout',
          text: 'The investors who trade the most tend to earn the least. Activity feels like progress, but in investing, unnecessary activity is usually a cost, not an edge.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'paragraph',
          text: 'This is exactly why Halo offers a **net-of-cost** optimization objective: it targets a strong Sharpe ratio while explicitly penalizing turnover and trading costs, so the optimizer will not suggest constant small trades unless the benefit actually outweighs the cost. It also reports sector counts and concentration (HHI), so home bias toward one stock or sector is visible instead of hidden.',
        },
        {
          type: 'callout',
          text: 'Halo\'s Risk Assessment questionnaire also checks for overconfidence directly: describing yourself as an experienced investor while also picking the highest-risk answer on every question flags overconfidence as a bias to watch for in your results.',
        },
      ],
      quiz: [
        {
          question: "What did Barber and Odean's research find about frequent traders?",
          options: [
            { text: 'They earned higher returns than infrequent traders', correct: false },
            { text: 'Trading frequency had no effect on returns', correct: false },
            { text: 'They earned lower returns, even before fees and taxes', correct: true },
          ],
        },
        {
          question: 'What is home bias?',
          options: [
            { text: 'Overweighting familiar assets like local or employer stock', correct: true },
            { text: 'Avoiding all foreign investments for legal reasons', correct: false },
            { text: 'Only investing in real estate', correct: false },
          ],
        },
        {
          question: "How does Halo's net-of-cost objective address overtrading?",
          options: [
            { text: 'It bans all trading after the initial allocation', correct: false },
            { text: 'It targets a strong Sharpe ratio while penalizing turnover and trading costs', correct: true },
            { text: 'It ignores transaction costs entirely to maximize returns', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Herding and Recency Bias: Chasing the Hot Hand',
      content: [
        {
          type: 'paragraph',
          text: 'When something has gone up a lot recently, it feels safe. When something has gone down a lot recently, it feels dangerous. This is **recency bias**: giving too much weight to what happened lately and assuming it will keep happening, even though markets do not actually work that way.',
        },
        {
          type: 'subheading',
          text: 'Chasing past performance',
        },
        {
          type: 'paragraph',
          text: 'Fund flow data shows this clearly: money pours into mutual funds and sectors right after they have posted strong recent returns, and flows out right after weak returns. But research on mutual fund performance consistently finds that funds with the best returns over the past few years do not reliably keep outperforming going forward. Investors end up systematically buying high and selling low, chasing performance that has already happened.',
        },
        {
          type: 'subheading',
          text: 'Herding',
        },
        {
          type: 'paragraph',
          text: '**Herding** is the related tendency to do what everyone else seems to be doing, on the assumption that a crowd cannot all be wrong. But bubbles form exactly because of herding: each person feels reassured by everyone else piling in, right up until the moment everyone tries to leave at once.',
        },
        {
          type: 'list',
          items: [
            'Recent performance is one of the weakest predictors of future performance',
            'A hot streak often means an asset has already gotten expensive relative to its fundamentals',
            'Buying because "everyone else is buying" outsources your judgment to a crowd that may be making the same mistake you are',
          ],
        },
        {
          type: 'callout',
          text: 'Past performance getting excited headlines is not the same as future performance. By the time an investment is popular enough to feel obviously safe, much of its opportunity may already be priced in.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'paragraph',
          text: 'Halo builds your portfolio from a covariance matrix and optimization objective, not from whatever asset happens to be trending. Because the optimizer weighs every asset\'s expected return against its risk and its correlation with everything else you hold, a single hot performer will not automatically dominate your portfolio unless it genuinely improves your overall risk-adjusted return.',
        },
      ],
      quiz: [
        {
          question: 'What is recency bias?',
          options: [
            { text: 'Giving too much weight to recent performance when predicting the future', correct: true },
            { text: 'Only trusting the oldest data available', correct: false },
            { text: 'Ignoring all historical data', correct: false },
          ],
        },
        {
          question: 'What does research on mutual fund performance generally find?',
          options: [
            { text: 'Recent strong returns are a weak predictor of future returns', correct: true },
            { text: 'Recent top performers reliably keep outperforming', correct: false },
            { text: 'Fund performance is entirely random with no patterns at all', correct: false },
          ],
        },
        {
          question: 'Why is herding risky?',
          options: [
            { text: 'It guarantees losses for everyone involved', correct: false },
            { text: 'It only affects professional investors, not individuals', correct: false },
            { text: 'It outsources judgment to a crowd that may be making the same mistake', correct: true },
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Anchoring and Mental Accounting',
      content: [
        {
          type: 'paragraph',
          text: 'Two more biases distort how investors see the same dollar depending on where it came from or what number they first saw attached to it.',
        },
        {
          type: 'subheading',
          text: 'Anchoring',
        },
        {
          type: 'paragraph',
          text: '**Anchoring** is the tendency to fixate on an initial reference point, even when that point is arbitrary or no longer relevant. The most common investing example is the purchase price: "I will sell once it gets back to what I paid." But the price you paid has no bearing on what the asset is worth today or where it is headed next. The market does not remember your cost basis, only you do.',
        },
        {
          type: 'subheading',
          text: 'Mental accounting',
        },
        {
          type: 'paragraph',
          text: '**Mental accounting** is the habit of treating money differently depending on which mental "bucket" it sits in, even though money is completely interchangeable. A classic version is the "house money" effect: investors take bigger risks with gains than they would with their original principal, as if profit were somehow less real or less theirs than the money they started with. Someone might also keep a large cash pile "for emergencies" while carrying high-interest debt, treating the two buckets as unrelated when, financially, they are the same balance sheet.',
        },
        {
          type: 'list',
          items: [
            'Anchoring on your purchase price can keep you holding a losing position long past the point it makes sense',
            'Anchoring can also make you sell a winner too early because it "already made enough"',
            'Mental accounting causes people to take excessive risk with gains, or hold too much idle cash, purely based on which bucket the money is in',
          ],
        },
        {
          type: 'callout',
          text: 'A dollar is a dollar, regardless of whether it came from your paycheck, an inheritance, or a lucky trade. The moment you start treating dollars differently based on their origin, you are making decisions based on a story in your head rather than on the actual numbers.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'paragraph',
          text: "Halo's drift tracker watches your portfolio against your target weights and flags when any position has drifted outside your chosen tolerance band, regardless of whether that drift came from a gain or a loss. It treats every dollar in your portfolio the same way: as a claim on today's optimal allocation, not as money that is somehow different because of where it came from or what you originally paid for it.",
        },
        {
          type: 'callout',
          text: "Halo's Risk Assessment questionnaire checks for anchoring too: a long time horizon paired with answers focused on capital preservation flags anchoring to overly conservative expectations as a bias worth watching.",
        },
      ],
      quiz: [
        {
          question: 'What is anchoring, in an investing context?',
          options: [
            { text: 'Fixating on a reference point like your purchase price, even when it is no longer relevant', correct: true },
            { text: 'Only investing in physically anchored assets like real estate', correct: false },
            { text: 'Diversifying across many different anchors of risk', correct: false },
          ],
        },
        {
          question: 'What is the "house money" effect an example of?',
          options: [
            { text: 'Loss aversion', correct: false },
            { text: 'Mental accounting', correct: true },
            { text: 'Herding', correct: false },
          ],
        },
        {
          question: "How does Halo's drift tracker avoid mental accounting?",
          options: [
            { text: 'It ignores gains and only tracks losses', correct: false },
            { text: 'It flags drift from target weights regardless of whether it came from a gain or a loss', correct: true },
            { text: 'It keeps gains and principal in separate portfolios', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'The Behavior Gap: Why Rules Beat Willpower',
      content: [
        {
          type: 'paragraph',
          text: 'Every year, research firms compare the returns of investment funds to the actual returns earned by the average investor in those same funds. The gap is consistent and large: the average investor earns meaningfully less than the funds they invest in, because of poorly timed buying and selling. This is often called the **behavior gap**, and every bias covered in this track feeds into it.',
        },
        {
          type: 'subheading',
          text: 'Willpower is not a strategy',
        },
        {
          type: 'paragraph',
          text: 'Knowing about loss aversion, recency bias, and mental accounting does not automatically protect you from them. These biases operate quickly and emotionally, especially during a market crash or a euphoric rally, which is exactly when good judgment matters most and is hardest to access. Trying to simply "be more rational" in the moment is a weak defense against a brain that evolved for immediate survival, not long-term compounding.',
        },
        {
          type: 'subheading',
          text: 'Rules beat willpower',
        },
        {
          type: 'paragraph',
          text: 'The reliable fix is not more willpower, it is a pre-committed system that makes the decision before emotions are running high. Setting a target allocation and a rebalancing rule in advance means that when the market drops 20%, you already know what to do: rebalance back to target, which mechanically means buying more of what just got cheaper. You do not have to trust your in-the-moment judgment, because you already made the decision when you were calm.',
        },
        {
          type: 'list',
          items: [
            'Decide your target allocation and objective in advance, while you are calm and thinking clearly',
            'Use a rebalancing band so small drift is ignored and only meaningful drift triggers action',
            'Automate what you can, so a bad day in the market does not turn into a bad decision',
          ],
        },
        {
          type: 'callout',
          text: 'The investors who do best are usually not the ones who predict the market correctly. They are the ones who pre-commit to a sensible process and then let the process do the deciding when emotions would otherwise take over.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'paragraph',
          text: "This is the entire philosophy behind Halo. You set your risk tolerance and optimization objective once, in advance. The optimizer computes the target allocation from data, not headlines. The drift tracker tells you exactly when a rebalance is actually warranted, using a band you set ahead of time. Every bias in this track (loss aversion, overconfidence, herding, anchoring) loses most of its power once the decision has already been made by a rules-based system instead of by you in the heat of the moment.",
        },
      ],
      quiz: [
        {
          question: 'What is the "behavior gap"?',
          options: [
            { text: 'The difference between a fund\'s returns and the actual returns earned by average investors in it', correct: true },
            { text: 'The gap between a fund\'s stated fees and its actual fees', correct: false },
            { text: 'The difference between stock and bond returns', correct: false },
          ],
        },
        {
          question: 'Why is willpower alone considered a weak defense against investing biases?',
          options: [
            { text: 'Biases only affect inexperienced investors', correct: false },
            { text: 'Willpower works fine as long as you read enough about biases', correct: false },
            { text: 'Biases operate quickly and emotionally, especially during market extremes when judgment is hardest to access', correct: true },
          ],
        },
        {
          question: 'What is the recommended fix for behavioral biases in investing?',
          options: [
            { text: 'Check your portfolio more frequently to stay informed', correct: false },
            { text: 'Pre-commit to a target allocation and rebalancing rule while calm, then let the rule decide', correct: true },
            { text: 'Avoid setting any fixed targets so you can adapt to every market move', correct: false },
          ],
        },
      ],
    },
  ],
}

const track3: Track = {
  id: 3,
  title: 'Portfolio Optimization',
  description: 'Learn the math behind Halo: the same methods hedge funds use',
  estimatedTime: '45 min',
  difficulty: 'Advanced',
  modules: [
    {
      id: 1,
      title: "Mean-Variance Basics: Why 1 + 1 Doesn't Equal 2",
      content: [
        {
          type: 'paragraph',
          text: "Combining two investments isn't just averaging them. In 1952, Harry Markowitz showed that the **right** combination of assets can give you a better risk/return trade-off than any single asset alone, an insight that eventually won him a Nobel Prize. This track builds up the entire mathematical engine behind Halo's optimizer, one concept at a time, using one running example throughout.",
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
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's optimizer solves for exactly this: the mix of weights that gives you the best return-for-risk trade-off, using this same return/variance math scaled up to however many assets you hold. The next module covers how it decides which mix is actually \"best.\"",
        },
      ],
      quiz: [
        {
          question: "You blend a 12%-return stock with a 6%-return bond 50/50. What's the portfolio's expected return?",
          options: [
            { text: '6%', correct: false },
            { text: '12%', correct: false },
            { text: '9%', correct: true },
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
            { text: 'Zero', correct: false },
            { text: 'Exactly the weighted average of the individual volatilities', correct: true },
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
          text: 'Halo\'s "Max Sharpe" objective solves exactly this optimization automatically across as many assets as you hold, and its Efficient Frontier chart plots this exact curve for your actual portfolio.',
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
            { text: 'The set of portfolios offering the best possible return for each level of risk', correct: true },
            { text: 'Any portfolio with positive returns', correct: false },
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
          text: 'Halo computes your full covariance matrix automatically and reports concentration (HHI) and effective holdings, so you can see whether you\'re actually diversified or just holding a lot of similar things.',
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
            { text: 'Because the tech stocks are highly correlated and move together', correct: true },
            { text: 'Because more stocks is always better', correct: false },
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
          text: 'This is exactly why Halo lets you choose the risk model (Sample, Ledoit-Wolf shrinkage, EWMA, or PCA factor) instead of hardcoding raw sample covariance.',
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
            { text: 'Increases the number of assets considered', correct: false },
            { text: 'Blends the noisy sample matrix toward a more stable target', correct: true },
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
          text: 'Halo offers Black-Litterman return estimates as an alternative to plugging in raw historical averages, specifically to avoid the instability shown above.',
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
            { text: 'Zero expected return for every asset', correct: false },
            { text: 'Equilibrium returns implied by market-cap weights', correct: true },
          ],
        },
        {
          question: 'How does Black-Litterman incorporate your own opinions?',
          options: [
            { text: 'It blends your view with market equilibrium, weighted by your confidence', correct: true },
            { text: 'It ignores the market completely and uses only your view', correct: false },
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
          text: 'Every objective so far (min variance, max Sharpe) treats risk symmetrically: a portfolio that swings up 20% counts as exactly as "risky" as one that swings down 20%. Most investors don\'t actually feel that way. This closing module covers two ideas that address that, plus a wrap-up of every objective Halo offers.',
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
          text: "Every objective above (Min Variance, Max Sharpe, Target Return/Risk, Risk Parity, Max Diversification, CVaR, Net-of-Cost) is selectable directly in Halo's optimizer. You've just learned what each one is actually doing under the hood.",
        },
      ],
      quiz: [
        {
          question: 'What does CVaR specifically target?',
          options: [
            { text: 'Overall day-to-day volatility', correct: false },
            { text: 'Only the best-case scenarios', correct: false },
            { text: 'The average loss in the worst-case scenarios', correct: true },
          ],
        },
        {
          question: 'What does risk parity try to equalize?',
          options: [
            { text: "Each asset's contribution to total portfolio risk", correct: true },
            { text: 'Expected return across assets', correct: false },
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

const track4: Track = {
  id: 4,
  title: 'Portfolio Analysis',
  description: 'Learn to read what your portfolio\'s numbers are actually telling you: Sharpe, beta, drawdown, and diversification, decoded',
  estimatedTime: '30 min',
  difficulty: 'Intermediate',
  modules: [
    {
      id: 1,
      title: 'The Sharpe Ratio: Grading a Portfolio, Not Just Its Return',
      content: [
        {
          type: 'paragraph',
          text: "Two portfolios can post similar returns and still be nowhere near equally good. Return alone doesn't tell you how much risk was taken to get there, and that's exactly the gap the **Sharpe ratio** closes.",
        },
        {
          type: 'subheading',
          text: 'The formula',
        },
        {
          type: 'paragraph',
          text: 'Sharpe ratio = (portfolio return − risk-free rate) ÷ portfolio volatility. The same formula the optimizer uses internally to find the best mix of assets also works as a report card on a portfolio you already built.',
        },
        {
          type: 'subheading',
          text: 'A worked example',
        },
        {
          type: 'paragraph',
          text: "Say your portfolio returned **11%** this year with **16%** volatility, against a risk-free rate of **2%**. Sharpe = (11% − 2%) ÷ 16% = **0.56**. The S&P 500 returned **10%** with **18%** volatility over the same stretch: Sharpe = (10% − 2%) ÷ 18% = **0.44**.",
        },
        {
          type: 'paragraph',
          text: 'The raw return gap is only 1 point, but your portfolio earned more AND took less risk per unit of return, so its Sharpe ratio is meaningfully higher. That gap is invisible if you only compare returns.',
        },
        {
          type: 'callout',
          text: 'A higher Sharpe ratio means better risk-adjusted performance, not necessarily a higher return. A portfolio with a lower return can still have a higher Sharpe ratio if it took much less risk to get there.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: 'Every optimized portfolio shows its Sharpe ratio on the results screen, the Efficient Frontier chart marks the exact "Max Sharpe" point among every mix that was possible, and Max Sharpe is one of the optimizer\'s built-in objectives.',
        },
      ],
      quiz: [
        {
          question: 'What does the Sharpe ratio measure?',
          options: [
            { text: 'Total return only', correct: false },
            { text: 'Return earned per unit of risk taken', correct: true },
            { text: "The portfolio's correlation with the market", correct: false },
          ],
        },
        {
          question: 'Portfolio X returns 11% at 16% volatility; Portfolio Y returns 13% at 30% volatility. Risk-free rate is 2%. Which has the higher Sharpe ratio?',
          options: [
            { text: 'Portfolio X (0.56 vs 0.37)', correct: true },
            { text: 'Portfolio Y, because its return is higher', correct: false },
            { text: 'They are equal', correct: false },
          ],
        },
        {
          question: 'Can a portfolio with a lower return ever have a higher Sharpe ratio than one with a higher return?',
          options: [
            { text: 'No, Sharpe ratio always follows return', correct: false },
            { text: 'Yes, if it took proportionally less risk to earn that return', correct: true },
            { text: 'Only if volatility is zero', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Beta: How Much Your Portfolio Swings With the Market',
      content: [
        {
          type: 'paragraph',
          text: "Volatility measures how much your portfolio swings, full stop. **Beta** measures something more specific: how much of that swinging is explained by the broader market moving. It's the difference between \"risky\" and \"exposed to the market.\"",
        },
        {
          type: 'subheading',
          text: 'Reading a beta value',
        },
        {
          type: 'list',
          items: [
            '**β = 1**: moves in step with the market (e.g. an S&P 500 index fund)',
            '**β > 1**: amplifies market moves (up more in rallies, down more in selloffs)',
            '**β < 1**: dampens market moves, a portfolio with real ballast',
            '**β near 0 or negative**: little to no relationship with market direction',
          ],
        },
        {
          type: 'subheading',
          text: 'A worked example',
        },
        {
          type: 'paragraph',
          text: 'Beta = correlation with the benchmark × (portfolio volatility ÷ benchmark volatility). Your portfolio moves with the S&P 500 at a correlation of **0.85**, with volatility **16%** against the benchmark\'s **18%**: beta = 0.85 × (16% ÷ 18%) = **0.76**. For every 1% the S&P 500 moves, your portfolio tends to move about 0.76%: real market exposure, but dampened.',
        },
        {
          type: 'subheading',
          text: 'Alpha: the part beta doesn\'t explain',
        },
        {
          type: 'paragraph',
          text: 'Alpha = actual return − [risk-free rate + beta × (benchmark return − risk-free rate)]. Using the same numbers: alpha = 11% − [2% + 0.76 × (10% − 2%)] = 11% − 8.1% = **2.9%**. That 2.9% is return your portfolio produced beyond what its market exposure alone would predict.',
        },
        {
          type: 'callout',
          text: "Beta describes exposure: how much of the ride is just the market. Alpha describes edge: what's left over after accounting for that exposure. A high-beta portfolio isn't automatically a skillfully built one.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: "Backtesting your portfolio against a benchmark reports both alpha and beta side by side, so you can see how much of your performance came from market exposure versus how much was genuinely additive.",
        },
      ],
      quiz: [
        {
          question: 'A portfolio has a beta of 0.6. If the S&P 500 drops 10%, what would you roughly expect?',
          options: [
            { text: 'The portfolio drops about 6%', correct: true },
            { text: 'The portfolio drops about 16%', correct: false },
            { text: 'The portfolio is unaffected', correct: false },
          ],
        },
        {
          question: 'What does alpha represent?',
          options: [
            { text: 'The same thing as beta, just renamed', correct: false },
            { text: "Return earned beyond what the portfolio's market exposure alone would predict", correct: true },
            { text: 'Total portfolio volatility', correct: false },
          ],
        },
        {
          question: 'Is a beta of 1.4 inherently "better" than a beta of 0.7?',
          options: [
            { text: 'Yes, higher beta always means a better portfolio', correct: false },
            { text: 'No, beta describes market exposure, not skill or quality', correct: true },
            { text: 'Yes, but only if volatility is also high', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Volatility: The Risk Number Behind Every Other Metric',
      content: [
        {
          type: 'paragraph',
          text: "Volatility, the annualized standard deviation of returns, is the single most-reused number in portfolio analysis. It's the denominator in the Sharpe ratio, an input to beta, and the risk half of every risk/return tradeoff you've seen so far.",
        },
        {
          type: 'subheading',
          text: 'From daily swings to an annual number',
        },
        {
          type: 'paragraph',
          text: 'Volatility is usually measured day-to-day, then scaled up to an annual figure by multiplying by the square root of the number of trading days in a year (about 252): a daily standard deviation of roughly **1%** scales to about 1% × √252 ≈ **16%** annualized. That square-root scaling is why volatility grows slower than time: 4x the trading days is only 2x the volatility.',
        },
        {
          type: 'subheading',
          text: 'Volatility isn\'t inherently bad',
        },
        {
          type: 'paragraph',
          text: "Standard volatility treats a sharp rally and a sharp selloff identically: both are just \"big moves.\" Most investors only actually mind the downside half. That blind spot is exactly what the next two modules exist to fix.",
        },
        {
          type: 'callout',
          text: 'A higher-volatility portfolio isn\'t automatically worse. It only becomes a problem when it isn\'t compensated for with proportionally higher expected return, which is precisely what the Sharpe ratio checks.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: 'Every portfolio result reports annualized volatility directly, and it\'s the risk axis on the Efficient Frontier chart: every point on that curve is a real (volatility, return) pair.',
        },
      ],
      quiz: [
        {
          question: 'What does "annualized volatility" mean?',
          options: [
            { text: 'Daily price swings scaled up to a yearly figure', correct: true },
            { text: 'The highest single-day loss of the year', correct: false },
            { text: 'The total return over the year', correct: false },
          ],
        },
        {
          question: 'A portfolio has a daily standard deviation of about 1%. Roughly what is its annualized volatility (√252 ≈ 15.9)?',
          options: [
            { text: 'About 1%', correct: false },
            { text: 'About 16%', correct: true },
            { text: 'About 252%', correct: false },
          ],
        },
        {
          question: 'Does standard volatility distinguish between upside and downside swings?',
          options: [
            { text: 'Yes, it only counts downside moves', correct: false },
            { text: 'No, it treats a sharp rally and a sharp selloff the same way', correct: true },
            { text: 'Yes, it only counts upside moves', correct: false },
          ],
        },
      ],
    },
    {
      id: 4,
      title: "Max Drawdown: The Worst Ride You'd Have Actually Lived Through",
      content: [
        {
          type: 'paragraph',
          text: "Two portfolios can have the exact same average return and still feel completely different to hold, because average return hides the path. **Max drawdown** measures the path: the largest peak-to-trough decline a portfolio actually experienced.",
        },
        {
          type: 'subheading',
          text: 'What it measures',
        },
        {
          type: 'paragraph',
          text: "At every point in time, compare the portfolio's current value to its highest value so far. The largest drop from any peak to the lowest point that followed it, before a new peak was set, is the max drawdown. It's expressed as a negative percentage: **−18%** means the portfolio was once 18% below its prior high-water mark.",
        },
        {
          type: 'subheading',
          text: 'Why it matters more than average return alone',
        },
        {
          type: 'paragraph',
          text: 'Say your portfolio and the S&P 500 both averaged similar returns over a rough year, but your portfolio\'s max drawdown was **−18%** while the S&P 500\'s was **−24%**. Same rough average, very different worst moment. That gap matters because a big enough drawdown is exactly what tends to push investors into panic-selling near the bottom, turning a paper loss into a permanent one.',
        },
        {
          type: 'subheading',
          text: 'The Calmar ratio: return relative to your worst drawdown',
        },
        {
          type: 'paragraph',
          text: 'Calmar ratio = annualized return ÷ |max drawdown|. Using the numbers above: 11% ÷ 18% = **0.61**. Like the Sharpe ratio, higher is better, but Calmar specifically rewards portfolios that avoid deep drawdowns rather than ones that merely avoid day-to-day wiggle.',
        },
        {
          type: 'callout',
          text: "A shallower max drawdown isn't just a nicer number: it's the difference between a portfolio an investor can actually stick with through a downturn and one that gets abandoned at the worst possible time.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: "Backtesting a portfolio charts its drawdown curve directly alongside its growth curve, and the metrics table reports Calmar ratio next to Sharpe so you can compare how each portfolio handled its worst stretch.",
        },
      ],
      quiz: [
        {
          question: 'What does max drawdown measure?',
          options: [
            { text: 'The average annual return', correct: false },
            { text: "The largest peak-to-trough decline a portfolio actually experienced", correct: true },
            { text: 'The correlation with the benchmark', correct: false },
          ],
        },
        {
          question: 'Why can two portfolios with the same average return still be very different to actually hold?',
          options: [
            { text: 'Average return already accounts for the path taken', correct: false },
            { text: 'One could have had a much deeper drawdown along the way, even with the same average', correct: true },
            { text: 'They can\'t be different if the average return matches', correct: false },
          ],
        },
        {
          question: 'What does the Calmar ratio reward?',
          options: [
            { text: 'High return relative to a shallow max drawdown', correct: true },
            { text: 'High volatility regardless of drawdown', correct: false },
            { text: 'A high beta to the market', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Concentration and Effective Holdings: Are You Actually Diversified?',
      content: [
        {
          type: 'paragraph',
          text: "Owning more tickers isn't the same as being diversified: that was true back when we compared 20 similar tech stocks to 5 stocks across different sectors. This module gives you the actual number to check it for your own portfolio.",
        },
        {
          type: 'subheading',
          text: 'Concentration (HHI)',
        },
        {
          type: 'paragraph',
          text: "The Herfindahl-Hirschman Index sums the square of every position's weight. Say your portfolio is 40% / 25% / 20% / 10% / 5% across five holdings: HHI = 0.40² + 0.25² + 0.20² + 0.10² + 0.05² = 0.16 + 0.0625 + 0.04 + 0.01 + 0.0025 = **0.275**. HHI runs from near 0 (spread evenly across many positions) to 1 (100% in a single position).",
        },
        {
          type: 'subheading',
          text: 'Effective holdings: how many positions actually matter',
        },
        {
          type: 'paragraph',
          text: "Effective holdings = 1 ÷ HHI. For the portfolio above: 1 ÷ 0.275 ≈ **3.6**. Five positions on paper, but only about 3.6 of them are large enough to meaningfully move the portfolio. Compare that to five equal 20% positions: HHI = 5 × 0.20² = 0.20, effective holdings = 1 ÷ 0.20 = **5**, exactly matching the actual position count, because nothing is small enough to ignore.",
        },
        {
          type: 'list',
          items: [
            'HHI close to 0 → broadly spread, few concentration risks',
            'HHI close to 1 → dangerously concentrated in one or two positions',
            'Effective holdings well below your actual position count → some of those positions are too small to matter',
          ],
        },
        {
          type: 'callout',
          text: 'A portfolio can hold 20 tickers and still be effectively concentrated in 3 or 4 of them. Effective holdings is what tells you the difference between owning positions and being diversified across them.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: 'Every portfolio breakdown reports Concentration (HHI) and Effective Holdings directly, right alongside volatility and Sharpe ratio, so you can see whether your allocation is actually spread out or just looks that way on the weight table.',
        },
      ],
      quiz: [
        {
          question: 'A portfolio is split 50% / 30% / 20% across three positions. What is its HHI? (0.50² + 0.30² + 0.20² = 0.25 + 0.09 + 0.04)',
          options: [
            { text: '0.38', correct: true },
            { text: '1.00', correct: false },
            { text: '0.10', correct: false },
          ],
        },
        {
          question: 'A portfolio has an HHI of 0.25. What are its effective holdings (1 ÷ HHI)?',
          options: [
            { text: '2', correct: false },
            { text: '4', correct: true },
            { text: '0.25', correct: false },
          ],
        },
        {
          question: 'A portfolio holds 10 tickers but its effective holdings come out to 2.5. What does that tell you?',
          options: [
            { text: 'The portfolio is well diversified across all 10 positions', correct: false },
            { text: 'A small number of positions dominate the portfolio despite holding 10 tickers', correct: true },
            { text: 'The portfolio has negative correlation between its assets', correct: false },
          ],
        },
      ],
    },
    {
      id: 6,
      title: 'Beyond Sharpe: Sortino, Calmar, and Information Ratio',
      content: [
        {
          type: 'paragraph',
          text: "The Sharpe ratio treats every swing, up or down, as equally bad. Most investors don't actually mind upside swings. This module covers three more risk-adjusted metrics that each fix a different blind spot the Sharpe ratio leaves open.",
        },
        {
          type: 'subheading',
          text: 'Sortino ratio: only the downside counts',
        },
        {
          type: 'paragraph',
          text: "Sortino ratio = (portfolio return − risk-free rate) ÷ downside deviation, where downside deviation only measures the spread of negative-return periods. If your portfolio's downside deviation is **11%** (lower than its full 16% volatility, since it ignores the good days): Sortino = (11% − 2%) ÷ 11% = **0.82**, noticeably higher than its 0.56 Sharpe ratio, because Sortino stops penalizing the upside noise Sharpe counts against it.",
        },
        {
          type: 'subheading',
          text: 'Calmar ratio, revisited',
        },
        {
          type: 'paragraph',
          text: "Calmar ratio, covered last module, is return relative to max drawdown rather than to overall volatility. Use it when you care more about surviving the worst stretch than about smoothing out everyday noise.",
        },
        {
          type: 'subheading',
          text: 'Information ratio: is the edge repeatable?',
        },
        {
          type: 'paragraph',
          text: "Information ratio = average active return (portfolio − benchmark) ÷ tracking error (the volatility of that difference). Where alpha tells you the average edge over a benchmark, information ratio tells you how consistently that edge showed up: a small, steady edge can have a higher information ratio than a large, erratic one.",
        },
        {
          type: 'list',
          items: [
            '**Sharpe**: return per unit of total risk (up and down)',
            '**Sortino**: return per unit of downside-only risk',
            '**Calmar**: return relative to the worst drawdown actually experienced',
            '**Information ratio**: how consistently a portfolio beats its benchmark, not just by how much on average',
          ],
        },
        {
          type: 'callout',
          text: 'No single ratio tells the whole story. A portfolio can look great on Sharpe and mediocre on Calmar, or vice versa: the four together describe different shapes of the same risk.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for PortfoliU',
        },
        {
          type: 'callout',
          text: 'A full backtest report puts CAGR, Volatility, Sharpe, Sortino, Max Drawdown, Calmar, Alpha, Beta, and Information Ratio side by side in one table, every metric from this entire track, on your own portfolio.',
        },
      ],
      quiz: [
        {
          question: 'What is the key difference between the Sharpe ratio and the Sortino ratio?',
          options: [
            { text: 'Sortino only penalizes downside volatility, Sharpe penalizes both directions equally', correct: true },
            { text: 'They are the same formula with different names', correct: false },
            { text: 'Sharpe only looks at the most recent month of returns', correct: false },
          ],
        },
        {
          question: 'What does the information ratio measure?',
          options: [
            { text: 'How consistently a portfolio outperforms its benchmark, not just the average amount', correct: true },
            { text: 'The total volatility of a single portfolio in isolation', correct: false },
            { text: 'The number of positions in a portfolio', correct: false },
          ],
        },
        {
          question: 'Why might you look at more than one risk-adjusted metric instead of just the Sharpe ratio?',
          options: [
            { text: 'Because Sharpe is always wrong', correct: false },
            { text: 'Because each metric highlights a different shape of risk, and a portfolio can look great on one and mediocre on another', correct: true },
            { text: 'Because more metrics always means a higher score', correct: false },
          ],
        },
      ],
    },
  ],
}

const track5: Track = {
  id: 5,
  title: 'Institutional Investing',
  description: 'How hedge funds generate ideas, size positions, and manage risk.',
  estimatedTime: '30 min',
  difficulty: 'Advanced',
  modules: [
    {
      id: 1,
      title: 'How Institutional Investors Actually Generate Ideas',
      content: [
        {
          type: 'paragraph',
          text: "Institutional investors don't pick stocks by browsing headlines. Funds run a repeatable idea-generation process long before a single trade is placed, and that process is what separates a hunch from a position.",
        },
        {
          type: 'subheading',
          text: 'Where ideas come from',
        },
        {
          type: 'list',
          items: [
            '**Fundamental research**: reading filings and earnings calls to find a business the market has mispriced',
            '**Industry theses**: forming a macro or sector view first, then finding the best vehicle to express it',
            '**Quantitative screens**: rules-based filters run across thousands of securities at once',
            '**Alternative data**: satellite imagery, card-spend panels, web traffic — used to test a thesis before it shows up in official numbers',
          ],
        },
        {
          type: 'subheading',
          text: 'From idea to position: the variant view',
        },
        {
          type: 'paragraph',
          text: "An idea only becomes a position after it clears one test: is this a specific, falsifiable belief that differs from what the market is already pricing in? \"I think this company is good\" isn't an edge. \"I believe X will happen within Y months, and the current price assumes it won't\" is.",
        },
        {
          type: 'callout',
          text: 'An edge is a variant view against consensus, not a general opinion. If the market already agrees with you, there is no mispricing left to capture.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "The optimizer takes a list of tickers as a given input. Everything upstream of that — why THESE tickers and not others — is the idea-generation process this module describes. Halo picks up exactly where that process ends.",
        },
      ],
      quiz: [
        {
          question: 'What separates a real investment edge from a general opinion?',
          options: [
            { text: 'Believing a company is well-run', correct: false },
            { text: 'A specific, falsifiable view that differs from what the market is already pricing in', correct: true },
            { text: 'Reading more news articles about it than other investors', correct: false },
          ],
        },
        {
          question: 'What is alternative data used for in idea generation?',
          options: [
            { text: 'Replacing financial statements entirely', correct: false },
            { text: 'Testing a thesis against real-world signals before it shows up in official numbers', correct: true },
            { text: 'Predicting the exact stock price a year out', correct: false },
          ],
        },
        {
          question: 'Why is "the market already agrees with me" a problem for an investment idea?',
          options: [
            { text: "It isn't a problem, consensus ideas are the safest", correct: false },
            { text: 'If the price already reflects that belief, there is no mispricing left to profit from', correct: true },
            { text: 'Because consensus views are always wrong', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: "Position Sizing: Why 'How Much' Matters More Than 'What'",
      content: [
        {
          type: 'paragraph',
          text: "A correct idea sized wrong can still hurt you: oversize a rare high-conviction bet and one bad surprise causes real damage; undersize it and it barely moves the portfolio even when you're right. Sizing is its own decision, not an afterthought to selection.",
        },
        {
          type: 'subheading',
          text: 'The Kelly criterion',
        },
        {
          type: 'paragraph',
          text: 'The Kelly criterion sizes a bet using edge relative to risk: roughly, the fraction of capital to risk grows with your expected edge and shrinks with the variance of the outcome. Say a strategy has an expected edge of 8% a year against a variance that implies a full-Kelly allocation of 40% of capital. Most professionals size well below that, often at "half-Kelly" or less.',
        },
        {
          type: 'callout',
          text: "Full Kelly is aggressive and assumes your edge estimate is exactly right. Professionals size at a fraction of Kelly specifically because edge estimates are noisy — betting the full theoretical amount on an imperfect estimate risks real capital on a number that's probably a little wrong.",
        },
        {
          type: 'subheading',
          text: 'Conviction-weighted sizing in practice',
        },
        {
          type: 'list',
          items: [
            '**Liquidity**: can you actually build and exit the position without moving the price against yourself?',
            "**Correlation to the existing book**: a new \"diversifying\" idea that moves 80% in step with your biggest position isn't diversifying at all",
            '**Catalyst and time horizon**: a thesis that plays out in a month can be sized differently than one that takes years',
          ],
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "The optimizer's output weights are position sizes. Choosing max_sharpe or target_risk as an objective is a systematic way of answering the sizing question this module describes, instead of guessing at percentages.",
        },
      ],
      quiz: [
        {
          question: 'What does the Kelly criterion size a position by?',
          options: [
            { text: 'Equal weight across every idea in the portfolio', correct: false },
            { text: "Expected edge relative to the risk (variance) of the outcome", correct: true },
            { text: 'How long the idea has been held', correct: false },
          ],
        },
        {
          question: 'Why do professionals typically size at a fraction of full Kelly, like half-Kelly?',
          options: [
            { text: 'Full Kelly is illegal for institutional investors', correct: false },
            { text: 'Because edge estimates are noisy, and full Kelly assumes the estimate is exactly right', correct: true },
            { text: 'Half-Kelly always produces higher returns than full Kelly', correct: false },
          ],
        },
        {
          question: 'A new position moves 80% in step with your largest existing holding. What does that mean for its diversification value?',
          options: [
            { text: "It adds meaningful diversification because it's a different company", correct: false },
            { text: "It adds little diversification value despite being a separate name, due to the high correlation", correct: true },
            { text: 'Correlation to existing holdings is irrelevant to sizing', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Hedge Fund Strategy Taxonomy',
      content: [
        {
          type: 'paragraph',
          text: '"Hedge fund" describes a legal and fee structure, not a strategy. Funds differ enormously in what they actually do day to day, and the differences matter for understanding risk and return.',
        },
        {
          type: 'subheading',
          text: 'The main strategy families',
        },
        {
          type: 'list',
          items: [
            '**Long/Short Equity**: buy undervalued stocks, short overvalued ones, often to reduce net exposure to the overall market',
            '**Global Macro**: bets on interest rates, currencies, and broad economic trends rather than individual companies',
            '**Event-Driven**: profits from a specific corporate event resolving — mergers, spin-offs, bankruptcies',
            '**Relative Value / Arbitrage**: exploits a pricing gap between two related securities that should converge, such as convertible or statistical arbitrage',
          ],
        },
        {
          type: 'subheading',
          text: 'Net and gross exposure',
        },
        {
          type: 'paragraph',
          text: 'Net exposure = long% − short%. Gross exposure = long% + short%. A market-neutral fund targets roughly 0% net exposure, so its returns come from stock selection rather than the market going up or down.',
        },
        {
          type: 'callout',
          text: 'Two funds can hold completely different net exposure while running the same amount of gross capital. Net exposure tells you how much the fund depends on the market direction being right; gross tells you how much leverage and concentration risk is actually in the book.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's optimizer currently builds long-only portfolios — every weight is a non-negative allocation, so net exposure is always 100%. Understanding net and gross exposure here is exactly what changes if a platform ever adds short positions.",
        },
      ],
      quiz: [
        {
          question: 'What does "hedge fund" technically describe?',
          options: [
            { text: 'A specific investment strategy every fund follows', correct: false },
            { text: 'A legal and fee structure, not a strategy — funds under it can do very different things', correct: true },
            { text: 'A fund that only ever shorts stocks', correct: false },
          ],
        },
        {
          question: 'A fund is 70% long and 40% short. What is its net exposure?',
          options: [
            { text: '110%', correct: false },
            { text: '30%', correct: true },
            { text: '70%', correct: false },
          ],
        },
        {
          question: 'Why would a market-neutral fund target roughly 0% net exposure?',
          options: [
            { text: 'So its returns come from stock selection rather than the overall market direction', correct: true },
            { text: 'Because 0% net exposure is required by law', correct: false },
            { text: 'To maximize exposure to a rising market', correct: false },
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Risk Management: Position Limits and Value at Risk',
      content: [
        {
          type: 'paragraph',
          text: "Generating good ideas isn't enough on its own. Institutional risk management exists so that one bad idea — or one correct idea gone wrong — can't put the whole fund at risk.",
        },
        {
          type: 'subheading',
          text: 'Value at Risk (VaR)',
        },
        {
          type: 'paragraph',
          text: 'VaR is a statistical estimate of the maximum expected loss over a given horizon at a given confidence level. A "1-day 95% VaR of $2M" means there is roughly a 5% chance of losing more than $2M in a single day, based on historical or modeled volatility.',
        },
        {
          type: 'callout',
          text: "VaR describes typical bad days, not crisis days. It's built on statistical assumptions that tend to break down exactly when markets are most stressed — which is why risk managers also stress-test against specific historical crises instead of relying on a single statistical number.",
        },
        {
          type: 'subheading',
          text: 'Hard limits',
        },
        {
          type: 'list',
          items: [
            '**Position limits**: no single name over a set percentage of the book',
            '**Sector or factor limits**: caps on exposure to one industry or shared risk factor',
            '**Gross/net exposure caps**: bounding total leverage and market direction risk',
            '**Stop-losses**: a predefined point at which a losing position is cut rather than argued about in the moment',
          ],
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's stress-test feature runs your portfolio against specific historical windows — the 2008 financial crisis, the 2020 COVID crash, the 2022 rate shock — for exactly this reason: a statistical risk number alone doesn't tell you what actually happens to your portfolio in a real crisis.",
        },
      ],
      quiz: [
        {
          question: 'A fund reports a 1-day 95% VaR of $2M. What does that mean?',
          options: [
            { text: 'The fund will lose exactly $2M tomorrow', correct: false },
            { text: 'There is roughly a 5% chance of losing more than $2M in a single day', correct: true },
            { text: 'The fund is guaranteed not to lose more than $2M', correct: false },
          ],
        },
        {
          question: 'Why do risk managers stress-test against specific historical crises in addition to using VaR?',
          options: [
            { text: "Because VaR's statistical assumptions tend to break down in real crisis conditions", correct: true },
            { text: 'Because VaR is illegal to use alone', correct: false },
            { text: "Stress tests and VaR measure exactly the same thing", correct: false },
          ],
        },
        {
          question: 'What is a stop-loss?',
          options: [
            { text: 'A guarantee that a position cannot lose money', correct: false },
            { text: 'A predefined point at which a losing position is cut, decided in advance rather than in the moment', correct: true },
            { text: 'A tax on excessive trading', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Prime Brokerage, Leverage, and Short Selling Mechanics',
      content: [
        {
          type: 'paragraph',
          text: "Hedge funds don't just buy assets outright. Most use leverage and short selling, and both run through a prime broker — the institution that lends a fund shares and capital.",
        },
        {
          type: 'subheading',
          text: 'How short selling actually works',
        },
        {
          type: 'paragraph',
          text: "To short a stock, a fund borrows shares from the prime broker, sells them immediately, and must eventually buy them back to return them. A long position's loss is capped at 100% (the stock can only go to zero); a short position's loss is theoretically unlimited, because there is no ceiling on how high a price can rise.",
        },
        {
          type: 'subheading',
          text: 'Leverage and margin calls',
        },
        {
          type: 'paragraph',
          text: "Leverage lets a fund control a larger position than its own capital alone would allow, amplifying both gains and losses. If losses erode the collateral cushion behind a leveraged position, the broker can issue a margin call, forcing the fund to post more capital or close positions, often at the worst possible time.",
        },
        {
          type: 'callout',
          text: "The 2021 GameStop short squeeze is a well-known real-world illustration of unlimited short-side risk: a heavily shorted stock's price spike forced short sellers to buy back shares to limit their losses, and that buying pushed the price up further still.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's optimizer builds long-only portfolios, so none of this leverage or margin mechanics applies directly to what you build here — which is exactly why professionally leveraged portfolios and a long-only portfolio like the ones you build in Halo can behave so differently under stress.",
        },
      ],
      quiz: [
        {
          question: "Why is a short position's potential loss described as unlimited, unlike a long position?",
          options: [
            { text: "A long position's loss is unlimited instead", correct: false },
            { text: 'A stock price can rise indefinitely, while a long position can only lose up to 100% (the stock going to zero)', correct: true },
            { text: 'Short positions are always more heavily regulated', correct: false },
          ],
        },
        {
          question: 'What triggers a margin call?',
          options: [
            { text: 'A position becoming profitable', correct: false },
            { text: "Losses eroding the collateral cushion behind a leveraged position", correct: true },
            { text: 'The end of the trading day', correct: false },
          ],
        },
        {
          question: 'In a short squeeze, why does short sellers buying back shares to cut losses tend to push the price up further?',
          options: [
            { text: 'It has no effect on price', correct: false },
            { text: "That buying itself adds new demand for the stock, adding more upward pressure on the price", correct: true },
            { text: 'Because short sellers are required to buy at a fixed government-set price', correct: false },
          ],
        },
      ],
    },
  ],
}

const track6: Track = {
  id: 6,
  title: 'Quantitative Investing',
  description: 'Factor investing, systematic strategies, and market regimes.',
  estimatedTime: '30 min',
  difficulty: 'Advanced',
  modules: [
    {
      id: 1,
      title: "What Makes a Strategy 'Quantitative'?",
      content: [
        {
          type: 'paragraph',
          text: 'Discretionary investing means a person makes each call, informed by judgment. Systematic (quantitative) investing means a fixed, rules-based process makes the decision, so the same inputs always produce the same output.',
        },
        {
          type: 'subheading',
          text: 'The systematic pipeline',
        },
        {
          type: 'list',
          items: [
            '**Signal**: a rules-based measure believed to predict returns, e.g. "cheap relative to earnings"',
            '**Portfolio construction**: turning signals into actual position weights, often via optimization',
            '**Execution**: actually placing the trades the model calls for',
            '**Monitoring and backtesting**: continuously checking whether the process still works',
          ],
        },
        {
          type: 'subheading',
          text: 'Why systematic over discretionary?',
        },
        {
          type: 'paragraph',
          text: 'A systematic process removes day-to-day emotional bias, scales across thousands of securities a human could never track individually, and can be tested rigorously against history before a dollar is risked.',
        },
        {
          type: 'callout',
          text: "A systematic strategy is only as good as its signal and its backtest. If a rule was reverse-engineered to fit the past, it will look great in a backtest and fail in real trading — the subject of this track's final module.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: 'The optimizer itself is a systematic process: give it the same tickers, objective, and risk model twice, and it always produces the same weights — exactly the discipline described here.',
        },
      ],
      quiz: [
        {
          question: 'What distinguishes systematic (quantitative) investing from discretionary investing?',
          options: [
            { text: 'Systematic investing only trades bonds', correct: false },
            { text: 'A fixed, rules-based process makes the decision, so the same inputs always produce the same output', correct: true },
            { text: 'Discretionary investing is always more profitable', correct: false },
          ],
        },
        {
          question: 'What is a "signal" in a systematic strategy?',
          options: [
            { text: 'The final trade confirmation', correct: false },
            { text: 'A rules-based measure believed to predict returns', correct: true },
            { text: 'A regulatory filing requirement', correct: false },
          ],
        },
        {
          question: 'Why is a systematic strategy "only as good as its signal and its backtest"?',
          options: [
            { text: 'Because a rule fit too closely to past data can look great historically but fail going forward', correct: true },
            { text: 'Because systematic strategies never use historical data', correct: false },
            { text: 'Because backtests are always accurate predictors of the future', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Factor Investing: Value, Momentum, Size, and Quality',
      content: [
        {
          type: 'paragraph',
          text: 'A factor is a measurable characteristic of a stock that has historically been associated with different average returns. Factor investing systematically tilts a portfolio toward these characteristics, rather than picking individual names one at a time.',
        },
        {
          type: 'subheading',
          text: 'The classic factors',
        },
        {
          type: 'list',
          items: [
            '**Value**: stocks cheap relative to fundamentals (low price-to-earnings or price-to-book) have historically outperformed expensive ones, formalized by Fama and French',
            '**Momentum**: stocks that have risen over the past 6–12 months have tended to keep rising in the near term, documented by Jegadeesh and Titman',
            '**Size**: smaller companies have historically shown a return premium over larger ones, though less consistently in recent decades',
            '**Quality**: profitable, low-debt, stable-earnings companies have tended to outperform on a risk-adjusted basis',
          ],
        },
        {
          type: 'subheading',
          text: 'A worked example',
        },
        {
          type: 'paragraph',
          text: 'Say two companies sit in the same sector: Stock A trades at a P/E of 10, Stock B at a P/E of 30. A value tilt, all else equal, would overweight the cheaper Stock A relative to a market-cap-weighted benchmark.',
        },
        {
          type: 'callout',
          text: "Factors are statistical tendencies observed across large numbers of stocks over long periods, not guarantees for any single stock or year. Any one factor can underperform for years at a time.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's factor risk model estimates covariance using shared statistical factors extracted from asset returns — the same \"characteristics investors get paid to hold\" logic, used here for risk estimation rather than stock-picking.",
        },
      ],
      quiz: [
        {
          question: 'What is a "factor" in factor investing?',
          options: [
            { text: 'A single company picked by a portfolio manager', correct: false },
            { text: 'A measurable stock characteristic historically associated with different average returns', correct: true },
            { text: 'A government regulation on trading', correct: false },
          ],
        },
        {
          question: 'Which factor is defined by favoring stocks that are cheap relative to their fundamentals?',
          options: [
            { text: 'Momentum', correct: false },
            { text: 'Value', correct: true },
            { text: 'Size', correct: false },
          ],
        },
        {
          question: 'Why can a factor underperform for years at a time?',
          options: [
            { text: 'Factors are statistical tendencies over large samples and long periods, not guarantees for any single stretch of time', correct: true },
            { text: 'Because factor investing is banned during market downturns', correct: false },
            { text: 'It cannot — factors always outperform every year by definition', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Momentum and Mean Reversion: Two Sides of Market Behavior',
      content: [
        {
          type: 'paragraph',
          text: "Markets show both momentum (trends persisting) over medium horizons and mean reversion (extreme moves reversing) over other horizons. These aren't contradictory — they operate on different time frames and different underlying causes.",
        },
        {
          type: 'subheading',
          text: 'Momentum',
        },
        {
          type: 'paragraph',
          text: 'Cross-sectional momentum ranks stocks by recent performance and favors recent winners over recent losers. Time-series momentum looks at a single asset\'s own trend to predict its next move. Both are commonly explained by underreaction: information diffuses into prices gradually rather than instantly.',
        },
        {
          type: 'subheading',
          text: 'Mean reversion',
        },
        {
          type: 'paragraph',
          text: 'Short-term reversal shows up at very short horizons (days to weeks). Long-horizon reversal shows up over years: stocks that were the worst performers over the past 3–5 years have tended to outperform the best performers over the following 3–5 years. This is commonly explained by overreaction rather than underreaction.',
        },
        {
          type: 'callout',
          text: 'The word "trend" means different things at different horizons. A stock can show 12-month momentum and 1-week mean reversion at the very same time — they are not the same phenomenon.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's backtest lets you test how a portfolio would have performed over a historical lookback window you choose — exactly the kind of horizon-dependent analysis this module describes, since the right lookback window depends on which effect you're trying to capture.",
        },
      ],
      quiz: [
        {
          question: 'What is the difference between cross-sectional and time-series momentum?',
          options: [
            { text: 'They are two names for the exact same calculation', correct: false },
            { text: "Cross-sectional ranks stocks against each other; time-series looks at a single asset's own trend", correct: true },
            { text: 'Time-series momentum only applies to currencies', correct: false },
          ],
        },
        {
          question: 'Long-horizon reversal describes what pattern?',
          options: [
            { text: "The worst performers over 3–5 years tending to outperform the best performers over the following 3–5 years", correct: true },
            { text: 'Stock prices never changing over long periods', correct: false },
            { text: 'Winning stocks always continuing to win for decades', correct: false },
          ],
        },
        {
          question: 'Can a stock show both 12-month momentum and 1-week mean reversion at the same time?',
          options: [
            { text: 'No, the two effects are mutually exclusive', correct: false },
            { text: 'Yes, because they operate on different time horizons and different causes', correct: true },
            { text: 'Only during a recession', correct: false },
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Market Regimes: Why No Strategy Works Forever',
      content: [
        {
          type: 'paragraph',
          text: 'A regime is a persistent market environment — rising rates, high volatility, risk-on or risk-off sentiment — in which certain strategies work well and others don\'t. Regimes shift, sometimes abruptly, and a strategy calibrated for one can struggle badly in the next.',
        },
        {
          type: 'subheading',
          text: 'Factor crowding',
        },
        {
          type: 'paragraph',
          text: 'When too much capital chases the same factor, expected returns compress and the trade becomes fragile. The August 2007 "quant crash" is a well-documented illustration: many quantitative long/short funds with similar factor exposures suffered sharp, correlated losses over just a few days as one fund\'s forced deleveraging triggered others\' losses in a chain reaction, unrelated to any change in the underlying companies\' fundamentals.',
        },
        {
          type: 'subheading',
          text: 'Volatility regimes',
        },
        {
          type: 'paragraph',
          text: "A strategy calibrated on a low-volatility period can end up under-sized for risk once volatility rises, or over-sized once it falls. This is part of why an estimation window matters: a model weighting recent data more heavily (like an EWMA risk model) adapts faster to a regime shift than one using a long, equally-weighted history.",
        },
        {
          type: 'callout',
          text: 'Crowding and volatility regimes are two separate risks that can compound: a crowded factor trade is most dangerous precisely when a volatility regime shift forces many funds to deleverage at the same time.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: 'This is exactly why Halo offers multiple risk models — sample, Ledoit-Wolf shrinkage, EWMA, and factor — instead of just one. Different models respond differently to regime shifts, and no single covariance estimate is right in every environment.',
        },
      ],
      quiz: [
        {
          question: 'What caused the August 2007 "quant crash," as commonly described?',
          options: [
            { text: 'A sudden change in the fundamentals of the companies held', correct: false },
            { text: 'Many funds with similar, crowded factor exposures were forced to deleverage together, triggering correlated losses', correct: true },
            { text: 'A change in government interest rate policy that day', correct: false },
          ],
        },
        {
          question: 'Why might an EWMA risk model adapt faster to a volatility regime shift than a long equally-weighted sample covariance?',
          options: [
            { text: "It weights recent data more heavily, so recent volatility changes affect the estimate faster", correct: true },
            { text: 'It ignores volatility entirely', correct: false },
            { text: 'It only uses data from more than 10 years ago', correct: false },
          ],
        },
        {
          question: 'Why does Halo offer more than one risk model?',
          options: [
            { text: 'Because different models respond differently to regime shifts, and no single one is right in every environment', correct: true },
            { text: 'To make the interface look more advanced', correct: false },
            { text: 'Because only one risk model is actually accurate and the rest are legacy options', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Backtesting Pitfalls: Overfitting and Look-Ahead Bias',
      content: [
        {
          type: 'paragraph',
          text: "A backtest is a simulation, not a track record on real money, and it's surprisingly easy to make a system look better than it will ever perform live.",
        },
        {
          type: 'subheading',
          text: 'Overfitting',
        },
        {
          type: 'paragraph',
          text: "Testing enough variations of a rule against the same historical data will eventually turn up one that \"worked\" by chance alone, not because it captures a real, repeatable pattern. The more parameters tuned to fit the past, the larger this risk grows.",
        },
        {
          type: 'subheading',
          text: 'Look-ahead and survivorship bias',
        },
        {
          type: 'list',
          items: [
            "**Look-ahead bias**: accidentally using information in a backtest that wouldn't actually have been known at the time, like applying today's index membership list to a decade-old simulation",
            "**Survivorship bias**: testing only on companies that still exist today, silently excluding the ones that went bankrupt or were delisted — which flatters the results",
          ],
        },
        {
          type: 'callout',
          text: 'The standard defense against overfitting is out-of-sample testing: build the rule on one period of history, then test it, unmodified, on a later period it never saw during development.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's backtest always runs on a defined historical lookback window you select, and reports the result honestly, including drawdowns, rather than only surfacing the metrics that flatter the strategy — the same discipline this module describes.",
        },
      ],
      quiz: [
        {
          question: 'Why does testing many rule variations against the same historical data risk overfitting?',
          options: [
            { text: "It doesn't — more variations always means a more reliable rule", correct: false },
            { text: 'Eventually one variation will look like it "worked" by chance alone, not because it captures a real pattern', correct: true },
            { text: 'Because backtesting software has a fixed limit on variations tested', correct: false },
          ],
        },
        {
          question: 'What is survivorship bias in backtesting?',
          options: [
            { text: 'Testing only on companies that still exist today, excluding ones that went bankrupt or were delisted, flattering the results', correct: true },
            { text: 'Only testing strategies that have already been profitable', correct: false },
            { text: 'A bias toward buying the largest companies in an index', correct: false },
          ],
        },
        {
          question: 'What is the standard defense against overfitting a backtested rule?',
          options: [
            { text: 'Testing the rule, unmodified, on a later period of history it never saw during development', correct: true },
            { text: 'Adding as many additional parameters as possible', correct: false },
            { text: 'Only backtesting over a single, recent month', correct: false },
          ],
        },
      ],
    },
  ],
}

const track7: Track = {
  id: 7,
  title: 'Capital Allocation',
  description: 'Conviction vs. concentration: portfolio construction at scale.',
  estimatedTime: '30 min',
  difficulty: 'Advanced',
  modules: [
    {
      id: 1,
      title: 'Concentration vs. Diversification: The Core Tension',
      content: [
        {
          type: 'paragraph',
          text: "Two respected schools of thought pull in opposite directions: concentrate capital in your best few ideas for undiluted upside, or diversify broadly to reduce risk. Both have real theoretical grounding.",
        },
        {
          type: 'subheading',
          text: 'The case for concentration',
        },
        {
          type: 'paragraph',
          text: "Concentrated investors argue that an investor's 20th-best idea is, by definition, worse than their 1st-best idea — so heavily diversifying across many mediocre ideas dilutes a genuine edge back down toward the market average.",
        },
        {
          type: 'subheading',
          text: 'The case for diversification',
        },
        {
          type: 'paragraph',
          text: "Markowitz's 1952 insight, sometimes called the only \"free lunch\" in investing, is that combining assets that aren't perfectly correlated reduces a portfolio's risk without necessarily giving up expected return.",
        },
        {
          type: 'subheading',
          text: 'Effective number of bets',
        },
        {
          type: 'paragraph',
          text: "A 20-stock portfolio isn't automatically diversified if all 20 are highly correlated with each other, like an all-technology book. The \"effective\" number of independent bets can be far lower than the number of holdings suggests.",
        },
        {
          type: 'callout',
          text: 'Diversification only reduces risk to the extent the holdings are not perfectly correlated. Adding more names that all move together adds very little real diversification, however large the holdings list looks.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "This is precisely the tradeoff Halo's optimizer objectives encode: max_sharpe leans toward concentrating on the best risk-adjusted combination, while min_variance leans toward the diversification side. Picking an objective is picking a side of this debate.",
        },
      ],
      quiz: [
        {
          question: 'What is the core argument for concentrated investing?',
          options: [
            { text: 'Diluting capital across many mediocre ideas dilutes a genuine edge back toward the market average', correct: true },
            { text: 'Concentration always eliminates risk entirely', correct: false },
            { text: 'Diversification is illegal for institutional investors', correct: false },
          ],
        },
        {
          question: "Why is Markowitz's diversification insight sometimes called a \"free lunch\"?",
          options: [
            { text: 'It reduces risk without necessarily costing expected return, as long as assets are not perfectly correlated', correct: true },
            { text: 'It guarantees higher returns for every portfolio', correct: false },
            { text: 'It eliminates all transaction costs', correct: false },
          ],
        },
        {
          question: 'Why might a 20-stock, all-technology portfolio not actually be well diversified?',
          options: [
            { text: 'Twenty holdings is always enough for full diversification regardless of correlation', correct: false },
            { text: 'If the holdings are highly correlated with each other, the effective number of independent bets is much lower than 20', correct: true },
            { text: 'Technology stocks cannot be included in a diversified portfolio', correct: false },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Conviction-Weighted Position Sizing',
      content: [
        {
          type: 'paragraph',
          text: 'Given several ideas of different conviction, how should capital split across all of them — not just one bet considered in isolation? This is the portfolio-level version of the sizing question.',
        },
        {
          type: 'subheading',
          text: 'Equal-weighting is a hidden decision',
        },
        {
          type: 'paragraph',
          text: "Splitting capital equally across N ideas feels neutral, but it's actually a conviction statement: that all N ideas are equally good. That's rarely true in practice, so equal-weighting is simple, but it isn't actually a neutral default.",
        },
        {
          type: 'subheading',
          text: 'Weighting by edge and risk',
        },
        {
          type: 'paragraph',
          text: "Higher expected edge and lower risk (volatility, and correlation to the rest of the book) argue for a larger allocation. This is the intuition behind mean-variance optimization: it's a formal way of solving this weighting problem instead of doing it by feel.",
        },
        {
          type: 'callout',
          text: 'A mean-variance optimizer fed noisy, overconfident return estimates can produce extreme, unstable weights — a well-known critique of naive optimization. Shrinkage and robust estimation methods exist specifically to tame this.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's target_return and target_risk objectives let you directly express a conviction — \"I want this level of return\" or \"I can tolerate this much risk\" — and let the optimizer solve the weighting problem, rather than eyeballing percentages yourself.",
        },
      ],
      quiz: [
        {
          question: 'Why is equal-weighting across several ideas not actually a "neutral" choice?',
          options: [
            { text: "It implicitly states that all the ideas are equally good, which is rarely true", correct: true },
            { text: 'Equal-weighting is mathematically impossible', correct: false },
            { text: 'It always produces the lowest possible risk', correct: false },
          ],
        },
        {
          question: 'What two things argue for giving an idea a larger allocation, according to this module?',
          options: [
            { text: 'How recently the idea was proposed and how popular it is', correct: false },
            { text: 'Higher expected edge and lower risk relative to the rest of the book', correct: true },
            { text: 'The size of the company alone', correct: false },
          ],
        },
        {
          question: 'What is a known risk of feeding a mean-variance optimizer noisy, overconfident return estimates?',
          options: [
            { text: 'It always fails to run and returns an error', correct: false },
            { text: 'It can produce extreme, unstable weights', correct: true },
            { text: 'It automatically corrects the noisy estimates on its own', correct: false },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Risk Parity and Equal Risk Contribution',
      content: [
        {
          type: 'paragraph',
          text: 'Traditional allocation splits capital by dollars, like a 60% stocks / 40% bonds split. Risk parity instead splits by risk, since dollar weight and risk contribution are not the same thing.',
        },
        {
          type: 'subheading',
          text: 'Why dollar-weighting can hide risk concentration',
        },
        {
          type: 'paragraph',
          text: "In a 60/40 portfolio, stocks are typically far more volatile than bonds. So even though only 60% of dollars sit in stocks, the large majority of the portfolio's actual day-to-day risk usually comes from that 60% slice, not split evenly with the 40% in bonds.",
        },
        {
          type: 'subheading',
          text: 'Equal risk contribution',
        },
        {
          type: 'paragraph',
          text: "Risk parity, popularized by approaches like Bridgewater's \"All Weather\" strategy, sizes each asset so it contributes roughly equal risk to the total portfolio. In practice this often means smaller dollar allocations to volatile assets and larger (sometimes leveraged) allocations to stable ones.",
        },
        {
          type: 'callout',
          text: "Risk parity is a reminder that a portfolio's dollar weights and its actual risk profile can look completely different. Two portfolios with the same dollar allocation can carry very different amounts of real risk.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: 'The min_variance and target_risk objectives, paired with the Ledoit-Wolf or EWMA risk models, are Halo\'s tools for reasoning about a portfolio in terms of risk contribution rather than dollar weights — the same shift in thinking this module describes.',
        },
      ],
      quiz: [
        {
          question: 'In a traditional 60/40 stocks/bonds portfolio, where does most of the actual day-to-day risk typically come from?',
          options: [
            { text: 'Split evenly between the 60% and the 40%', correct: false },
            { text: 'Mostly from the 60% stock allocation, since stocks are typically far more volatile than bonds', correct: true },
            { text: 'Mostly from the 40% bond allocation', correct: false },
          ],
        },
        {
          question: 'What does risk parity aim to equalize across assets in a portfolio?',
          options: [
            { text: 'The dollar amount invested in each asset', correct: false },
            { text: 'The risk contribution each asset makes to the total portfolio', correct: true },
            { text: 'The number of shares held of each asset', correct: false },
          ],
        },
        {
          question: 'Why might a risk-parity approach use smaller dollar allocations to volatile assets?',
          options: [
            { text: 'To reduce that asset\'s outsized contribution to total portfolio risk and bring it in line with less volatile assets', correct: true },
            { text: 'Volatile assets are always illegal to hold in large size', correct: false },
            { text: 'To maximize the dollar amount invested in the riskiest assets', correct: false },
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Rebalancing: Discipline vs. Drift',
      content: [
        {
          type: 'paragraph',
          text: "A portfolio's weights drift away from target as prices move. Rebalancing brings them back — but when and how to do it is a real design decision, not an afterthought.",
        },
        {
          type: 'subheading',
          text: 'Calendar vs. threshold rebalancing',
        },
        {
          type: 'list',
          items: [
            '**Calendar rebalancing**: review and reset on a fixed schedule, such as quarterly — simple and predictable',
            '**Threshold rebalancing**: only rebalance when a holding drifts beyond a set tolerance band, such as ±5 percentage points from target — trades less often, but reacts to actual market moves',
          ],
        },
        {
          type: 'subheading',
          text: 'The cost side of rebalancing',
        },
        {
          type: 'paragraph',
          text: 'Every rebalance can trigger transaction costs and, in a taxable account, realized capital gains. Rebalancing too often erodes returns to costs; rebalancing too rarely lets risk drift away from what was originally intended. It is a real tradeoff, not a free action.',
        },
        {
          type: 'callout',
          text: 'Rebalancing is a disciplined form of "sell high, buy low": trimming what has grown to stay overweight, and adding to what has lagged to stay underweight — which is behaviorally difficult to do purely on instinct.',
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "This is exactly what Halo's Invest platform rebalancing tools do: compare your current live positions to your target weights and generate the trade plan needed to bring them back in line.",
        },
      ],
      quiz: [
        {
          question: 'What is the difference between calendar rebalancing and threshold rebalancing?',
          options: [
            { text: 'They are two names for the same approach', correct: false },
            { text: 'Calendar rebalancing resets on a fixed schedule; threshold rebalancing triggers only once a holding drifts past a set tolerance', correct: true },
            { text: 'Threshold rebalancing can only be used with bonds', correct: false },
          ],
        },
        {
          question: 'Why is rebalancing too often a real cost, not a free action?',
          options: [
            { text: 'It has no downside — you should rebalance as often as possible', correct: false },
            { text: 'It can trigger transaction costs and realized capital gains that erode returns', correct: true },
            { text: 'Rebalancing is only possible once per year by regulation', correct: false },
          ],
        },
        {
          question: 'Why is rebalancing described as a disciplined form of "sell high, buy low"?',
          options: [
            { text: "It trims positions that have grown to stay overweight, and adds to ones that have lagged to stay underweight", correct: true },
            { text: 'It always sells the entire portfolio and starts over', correct: false },
            { text: 'It only ever buys, never sells', correct: false },
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Portfolio Construction at Scale: Constraints and Capacity',
      content: [
        {
          type: 'paragraph',
          text: "An optimizer's unconstrained \"best\" portfolio often isn't actually investable in the real world. Institutional allocators layer on constraints that reflect real-world limits the math alone doesn't know about.",
        },
        {
          type: 'subheading',
          text: 'Common real-world constraints',
        },
        {
          type: 'list',
          items: [
            '**Position limits**: a cap on any single holding, to bound single-name risk regardless of what the model wants',
            '**Sector or group caps**: avoiding accidental concentration in one industry, even spread across many individual names',
            '**Liquidity constraints**: a position sized small enough relative to a stock\'s trading volume that it can actually be exited without moving the price',
            '**Capacity**: a strategy that works cleanly at $10M can behave completely differently at $10B, once the trades themselves start moving prices',
          ],
        },
        {
          type: 'subheading',
          text: "Constraints don't mean giving up on optimization",
        },
        {
          type: 'paragraph',
          text: 'A constrained optimization still finds the best portfolio possible — just within the boundaries of what is actually implementable. Objectives and constraints work together, not against each other.',
        },
        {
          type: 'callout',
          text: "An unconstrained \"optimal\" portfolio that can't actually be built or exited at real-world size isn't optimal at all — it's a math result with no path to implementation.",
        },
        {
          type: 'subheading',
          text: 'Why this matters for Halo',
        },
        {
          type: 'callout',
          text: "Halo's Pro-tier sector and position constraints exist for exactly this reason: to keep the optimizer's mathematical rigor while enforcing the real-world limits this module describes, instead of trusting an unconstrained \"best\" portfolio blindly.",
        },
      ],
      quiz: [
        {
          question: 'Why might an optimizer\'s unconstrained "best" portfolio not actually be investable?',
          options: [
            { text: 'Unconstrained portfolios are always the most investable option', correct: false },
            { text: "It may ignore real-world limits like liquidity, concentration, or capacity that the math doesn't account for", correct: true },
            { text: 'Optimizers cannot produce a portfolio without constraints', correct: false },
          ],
        },
        {
          question: 'What does a "capacity" constraint account for?',
          options: [
            { text: 'A strategy that works at small scale potentially behaving differently at much larger scale, once trades start moving prices', correct: true },
            { text: 'The maximum number of holdings allowed by law', correct: false },
            { text: 'How many years a strategy has existed', correct: false },
          ],
        },
        {
          question: 'Do constraints and optimization objectives work against each other?',
          options: [
            { text: 'Yes, constraints always cancel out any benefit of optimization', correct: false },
            { text: 'No — a constrained optimization still finds the best portfolio possible within what is actually implementable', correct: true },
            { text: 'Constraints and objectives are unrelated to each other', correct: false },
          ],
        },
      ],
    },
  ],
}

export const TRACKS: Track[] = [track1, track2, track3, track4, track5, track6, track7]
