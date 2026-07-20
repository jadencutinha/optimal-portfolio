import { useSurface } from '../lib/useSurface'

interface Member {
  name: string
  role: string
  photo?: string
  bio?: string
}

const TEAM: Member[] = [
  {
    name: 'Jaden',
    role: 'Co-founder',
    photo: '/team/jaden.png',
    bio: 'Jaden is a Computer Science student at Princeton University with a minor in Quantitative Economics. He is passionate about building scalable software and leveraging technology to solve real-world problems. At Halo!, he develops the backend architecture, implements core platform functionality, and helps bring new features from concept to deployment.',
  },
  {
    name: 'Nadia',
    role: 'Co-founder',
    photo: '/team/nadia.png',
    bio: 'Nadia is a Computer Science & Mathematics student at Washington University in St. Louis, where she is also pursuing a second major in Cognitive Neuroscience. Passionate about both technology and how people learn, she enjoys building intuitive educational tools that make investing more accessible. At Halo!, she leads frontend development, course content creation, and platform testing to create a seamless user experience.',
  },
  {
    name: 'Bernardo',
    role: 'Co-founder',
    photo: '/team/bernardo.png',
    bio: 'Bernardo is a Computer Science student at Rutgers University with a passion for creating clean, user-friendly applications. As the newest member of the team, he contributes to frontend development and platform functionality, helping refine the user experience and bring new features to life.',
  },
  {
    name: 'Chloe',
    role: 'Chief Morale Officer',
    photo: '/team/chloe.png',
    bio: "Chloe works remotely (from under Nadia's desk) but her job is the same as everyone else's: keep morale high and remind the team to take a break every now and then.",
  },
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
            <p className="about-bio">{member.bio ?? '[fill out]'}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
