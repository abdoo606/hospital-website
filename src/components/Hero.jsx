import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'
import { useCountUp } from '../hooks/useScrollFx.js'
import { resolveImage } from '../api.js'
import heroFallback from '../assets/hero-hospital.jpg'

function Stat({ value, suffix, label }) {
  const [ref, display] = useCountUp(Number(value) || 0)
  return (
    <div className="stat" ref={ref}>
      <div className="stat__value">
        {display}
        {suffix}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

export default function Hero() {
  const { data, status } = useSite()
  const { settings, stats, consultants } = data

  const seniorCount = consultants.length || 8

  return (
    <>
      <section className="hero" id="top">
        <div className="hero__media">
          <img
            src={resolveImage(settings.hero_image, heroFallback)}
            alt=""
            fetchPriority="high"
          />
        </div>

        <div className="container hero__inner">
          <div className="hero__badges">
            <span className="chip">
              <Icon name="award" size={15} /> {settings.accreditations?.split('·')[0]?.trim() || 'JCI Accredited'}
            </span>
            <span className="chip">
              <Icon name="clock" size={15} /> Appointments within 48 hours
            </span>
            <span className="chip">
              <Icon name="shield" size={15} /> All major insurers accepted
            </span>
            {status === 'fallback' && (
              <span className="chip chip--warn" title="Live content is unavailable right now">
                <Icon name="clock" size={15} /> Offline copy
              </span>
            )}
          </div>

          <h1>
            {settings.hero_heading} <em>{settings.hero_highlight}</em>
          </h1>

          <p className="hero__sub">{settings.hero_sub}</p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#booking">
              <Icon name="calendar" size={18} /> Book an appointment
            </a>
            <a className="btn btn--outline-light" href="#departments">
              Explore our specialties <Icon name="arrowRight" size={18} />
            </a>
          </div>

          <div className="hero__trust">
            <div className="trust-item">
              <span className="avatar-stack">
                {(consultants.length ? consultants.slice(0, 3) : [{}, {}, {}]).map((c, i) => (
                  <i
                    key={c.id ?? i}
                    style={{ background: ['#0e7c8b', '#b8924d', '#123444'][i] || '#16a7ba' }}
                  >
                    {c.name
                      ? c.name
                          .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/, '')
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                      : '+'}
                  </i>
                ))}
                <i style={{ background: '#16a7ba' }}>+</i>
              </span>
              <span>
                <strong>{seniorCount}+ consultants</strong>
                <span>across {data.departments.length} specialties</span>
              </span>
            </div>
            <div className="trust-item">
              <Icon name="star" size={22} />
              <span>
                <strong>4.9 / 5 patient rating</strong>
                <span>2,400+ verified reviews</span>
              </span>
            </div>
            <div className="trust-item">
              <Icon name="globe" size={22} />
              <span>
                <strong>International patients</strong>
                <span>20+ languages supported</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="stats">
        <div className="container">
          <div className="stats__card reveal">
            {stats.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 22, textAlign: 'center' }}>
        <p className="hero__addr">
          <Icon name="mapPin" size={16} /> {settings.address} · <Icon name="clock" size={16} />{' '}
          {settings.hours}
        </p>
      </div>
    </>
  )
}
