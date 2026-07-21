interface Review {
  name: string
  role: string
  rating: number
  quote: string
}

const LEFT_REVIEWS: Review[] = [
  {
    name: 'Maya R.',
    role: 'First-time investor',
    rating: 5,
    quote:
      'I finally understand what the efficient frontier actually is. The lessons are short and everything just clicked.',
  },
  {
    name: 'Devin K.',
    role: 'Retail investor',
    rating: 5,
    quote:
      'Backtested my own picks against the S&P in about two minutes. Watching my portfolio beat the index was the moment it hooked me.',
  },
  {
    name: 'Priya S.',
    role: 'Pro member',
    rating: 5,
    quote:
      'The behavioral coach caught me over concentrating in tech and I had no idea I was doing it.',
  },
  {
    name: 'Leo M.',
    role: 'CS student',
    rating: 4,
    quote: 'Clean, fast and it actually teaches the why behind every number.',
  },
  {
    name: 'Sofia L.',
    role: 'Day-one user',
    rating: 5,
    quote: 'The paper trading account made me confident before putting in a single real dollar.',
  },
  {
    name: 'Grace H.',
    role: 'Finance major',
    rating: 5,
    quote: 'Finally a tool that treats investing like math and not a casino.',
  },
]

const RIGHT_REVIEWS: Review[] = [
  {
    name: 'Marcus T.',
    role: 'Weekend builder',
    rating: 5,
    quote:
      'Went from zero to building a real optimized portfolio in a weekend. The math is right there but it never feels heavy.',
  },
  {
    name: 'Hannah B.',
    role: 'Long-term investor',
    rating: 5,
    quote: 'Stress testing through past crashes was eye opening. I rebalanced the next day.',
  },
  {
    name: 'Aaron W.',
    role: 'Pro member',
    rating: 5,
    quote:
      'Best finance learning tool I have used and I have tried a lot of them. The certificate was a nice bonus.',
  },
  {
    name: 'Ines G.',
    role: 'New to investing',
    rating: 4,
    quote: 'I love that the optimizer explains its choices instead of just handing me weights.',
  },
  {
    name: 'Noah P.',
    role: 'Verified learner',
    rating: 5,
    quote:
      'The course map makes learning feel like a game. I cleared three sectors without noticing the time.',
  },
  {
    name: 'Tomas V.',
    role: 'Retail investor',
    rating: 5,
    quote: 'The AI assistant answered my portfolio questions better than my finance professor.',
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-card__stars" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className={index < rating ? 'is-on' : 'is-off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review-card">
      <Stars rating={review.rating} />
      <p className="review-card__quote">{review.quote}</p>
      <div className="review-card__who">
        <span className="review-card__avatar" aria-hidden="true">
          {initials(review.name)}
        </span>
        <span className="review-card__meta">
          <span className="review-card__name">{review.name}</span>
          <span className="review-card__role">{review.role}</span>
        </span>
      </div>
    </article>
  )
}

function Rail({ reviews, direction }: { reviews: Review[]; direction: 'up' | 'down' }) {
  const trackClass =
    direction === 'down' ? 'review-rail__track review-rail__track--down' : 'review-rail__track'
  return (
    <div className={`review-rail review-rail--${direction === 'up' ? 'left' : 'right'}`}>
      <div className={trackClass}>
        {[0, 1].map((copy) =>
          reviews.map((review) => (
            <div key={`${copy}-${review.name}`} aria-hidden={copy === 1 ? true : undefined}>
              <ReviewCard review={review} />
            </div>
          )),
        )}
      </div>
    </div>
  )
}

export function ReviewRail() {
  return (
    <div className="review-rails" aria-label="What learners say about Halo!">
      <Rail reviews={LEFT_REVIEWS} direction="up" />
      <Rail reviews={RIGHT_REVIEWS} direction="down" />
    </div>
  )
}
