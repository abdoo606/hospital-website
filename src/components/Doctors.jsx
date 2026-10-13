import { useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'

const initials = (name) =>
  name
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

export default function Doctors({ onBook }) {
  const { data, specialties } = useSite()
  const consultants = data.consultants
  const [specialty, setSpecialty] = useState('All specialties')
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return consultants.filter((d) => {
      const byDept = specialty === 'All specialties' || d.dept === specialty
      const byText =
        !q ||
        [d.name, d.title, d.dept, d.languages, d.credentials].join(' ').toLowerCase().includes(q)
      return byDept && byText
    })
  }, [consultants, specialty, query])

  if (!consultants.length) return null

  return (
    <section className="section section--mist" id="doctors">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Meet the team</span>
          <h2>Consultants you can choose by name</h2>
          <p className="lede">
            Full transparency on experience, languages and availability. Pick your own consultant —
            and change your mind at any point without losing your place in the pathway.
          </p>
        </div>

        <div className="filterbar filterbar--doctor">
          <div className="doctor-search">
            <Icon name="users" size={17} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by consultant name or language"
              aria-label="Search consultants"
            />
          </div>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            aria-label="Filter by specialty"
          >
            {specialties.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <h3>No consultant matches your filters</h3>
            <p>Clear the filters, or let our team match you with the right specialist.</p>
          </div>
        ) : (
          <div className="grid grid--4">
            {results.map((d) => (
              <article className="card doctor anim-in" key={d.id}>
                <div className="doctor__top">
                  {d.photo ? (
                    <span className="monogram monogram--photo">
                      <img src={d.photo} alt={d.name} loading="lazy" />
                    </span>
                  ) : (
                    <span className="monogram">{initials(d.name)}</span>
                  )}
                  <div>
                    <h3 className="doctor__name">{d.name}</h3>
                    <p className="doctor__title">{d.title}</p>
                    {d.credentials && <span className="doctor__creds">{d.credentials}</span>}
                  </div>
                </div>
                <div className="doctor__body">
                  <div className="doctor__meta">
                    {Number(d.rating) > 0 && (
                      <span className="stars">
                        <Icon name="star" size={15} fill="currentColor" strokeWidth={0} />
                        {Number(d.rating).toFixed(1)}{' '}
                        {d.reviews ? <span className="muted">({d.reviews})</span> : null}
                      </span>
                    )}
                    {d.years ? <span>{d.years} yrs experience</span> : null}
                    {d.languages && <span>{d.languages}</span>}
                  </div>
                  {d.dept && (
                    <p className="doctor__dept">
                      <Icon name="cross" size={14} strokeWidth={2.4} /> {d.dept}
                    </p>
                  )}
                  <div className="doctor__foot">
                    {d.availability && (
                      <span className="availability">
                        <span className="dot-live" />
                        {d.availability}
                      </span>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => onBook(d)}>
                      Book
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="doctors__note">
          <Icon name="shield" size={16} /> Every consultant holds a substantive NHS or equivalent
          appointment and is revalidated annually.
        </p>
      </div>
    </section>
  )
}
