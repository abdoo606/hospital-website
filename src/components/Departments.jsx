import { useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { departments } from '../data/site.js'

export default function Departments({ onEnquire }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments.filter((d) =>
      [d.name, d.tagline, d.blurb, ...d.highlights].join(' ').toLowerCase().includes(q),
    )
  }, [query])

  return (
    <section className="section" id="departments">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">Centres of excellence</span>
          <h2>Thirty specialties under one roof</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>
            Every department is led by substantive consultants and supported by on-site imaging,
            theatres and critical care — so your pathway never leaves the building.
          </p>
        </div>

        <div className="dept-search">
          <span className="dept-search__icon">
            <Icon name="sliders" size={18} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a specialty, condition or treatment — e.g. cardiology, knee, MRI"
            aria-label="Search specialties"
          />
          {query && (
            <button className="dept-search__clear" onClick={() => setQuery('')} aria-label="Clear">
              ✕
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <h3>No department matches “{query}”</h3>
            <p>
              We treat far more than we list. <a href="#booking">Ask our team</a> and we will match
              you with the right consultant.
            </p>
          </div>
        ) : (
          <div className="grid grid--3">
            {results.map((d, i) => (
              <article className="card reveal" key={d.id} data-delay={String((i % 3) + 1)}>
                <span className="card__icon">
                  <Icon name={d.icon} size={24} />
                </span>
                <span className="card__tagline">{d.tagline}</span>
                <h3>{d.name}</h3>
                <p>{d.blurb}</p>
                <ul className="card__list">
                  {d.highlights.map((h) => (
                    <li key={h}>
                      <Icon name="check" size={15} strokeWidth={2.4} />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="card__foot">
                  <span className="availability">
                    <span className="dot-live" />
                    {d.wait}
                  </span>
                  <button
                    className="link-arrow card__enquire"
                    onClick={() => onEnquire({ dept: d.name })}
                  >
                    Enquire <Icon name="arrowRight" size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
