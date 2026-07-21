interface Review {
  name: string
  rating: number
  quote: string
}

const REVIEWS: Review[] = [
  {
    name: 'Nindya Cutinha',
    rating: 5,
    quote:
      'I loved the usability of the app and the multitude of features! I felt a lot more confident about my investing decisions and how to effectively use my money in the future. I would definitely recommend it!',
  },
  {
    name: 'Mike Osman',
    rating: 5,
    quote:
      'I thought it was very easy to use and understand. I look forward to seeing how much it can make me. I feel like I learned so much already.',
  },
  {
    name: 'Sol Park',
    rating: 5,
    quote:
      'I loved the investment features of the app. It was good to understand and play with paper trading before I actually went through with real funds. I also loved the details and visuals throughout!',
  },
  {
    name: 'Rahel Samantrai',
    rating: 5,
    quote:
      'The app was very user friendly and offered a great variety of helpful features. It made investing feel a lot less intimidating and gave me more confidence in managing my finances. I would definitely recommend it to others.',
  },
  {
    name: 'Violet Lee',
    rating: 5,
    quote:
      'I loved the idea and execution of the app. The space design was also top tier. Definitely going to use it to help me invest my summer income!',
  },
  {
    name: 'Andrew Grant',
    rating: 5,
    quote:
      "I signed up expecting another investing app with a pretty dashboard, and instead got an actual convex optimizer that made me feel like I'd snuck into a hedge fund's back office. The Learn map is dangerously fun, I cleared three sectors before realizing I'd been studying for an hour.",
  },
  {
    name: 'Rodrigo Panigassi',
    rating: 5,
    quote:
      'The app was so easy to use and helped me finally understand how to properly invest. Could not recommend more highly.',
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

function ReviewCard({ review, hidden }: { review: Review; hidden?: boolean }) {
  return (
    <article className="review-card" aria-hidden={hidden || undefined}>
      <Stars rating={review.rating} />
      <p className="review-card__quote">{review.quote}</p>
      <div className="review-card__who">
        <span className="review-card__avatar" aria-hidden="true">
          {initials(review.name)}
        </span>
        <span className="review-card__meta">
          <span className="review-card__name">{review.name}</span>
          <span className="review-card__role">Verified user</span>
        </span>
      </div>
    </article>
  )
}

export function ReviewRail() {
  return (
    <div className="review-rail" aria-label="What our users say about Halo!">
      <div className="review-rail__track">
        {[0, 1].map((copy) =>
          REVIEWS.map((review) => (
            <ReviewCard key={`${copy}-${review.name}`} review={review} hidden={copy === 1} />
          )),
        )}
      </div>
    </div>
  )
}
