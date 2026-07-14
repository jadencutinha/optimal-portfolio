import { useSurface } from '../lib/useSurface'

interface Member {
  name: string
  role: string
  photo?: string
}

const TEAM: Member[] = [
  { name: 'Jaden', role: 'Co-founder' },
  { name: 'Nadia', role: 'Co-founder' },
  { name: 'Bernardo', role: 'Co-founder' },
  { name: 'Chloe', role: 'Chief Morale Officer' },
]

export function AboutPage({ onBack }: { onBack: () => void }) {
  useSurface('platform')

  return (
    <div className="about-page">
      <header className="about-head">
        <button type="button" className="switch-plan about-back" onClick={onBack}>
          ← Home
        </button>
        <h1>About us</h1>
        <p>
          We built Halo because we wanted the tools we could never find. A small team, one shared
          conviction, and a lot of linear algebra.
        </p>
      </header>

      <div className="about-grid">
        {TEAM.map((member) => (
          <article key={member.name} className="about-card">
            <div className="about-photo">
              {member.photo ? (
                <img src={member.photo} alt={member.name} />
              ) : (
                <span className="about-photo__empty" aria-hidden="true">
                  {member.name.charAt(0)}
                </span>
              )}
            </div>
            <h2 className="about-name">{member.name}</h2>
            <p className="about-role">{member.role}</p>
            <p className="about-bio">[fill out]</p>
          </article>
        ))}
      </div>
    </div>
  )
}
