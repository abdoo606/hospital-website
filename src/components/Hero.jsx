import Icon from './Icon.jsx'
import { hospital, stats } from '../data/site.js'
import { useCountUp } from '../hooks/useScrollFx.js'
import heroImg from '../assets/hero-hospital.jpg'

function Stat({ value, suffix, label }) {
  const [ref, display] = useCountUp(value)
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
  return (
    <>
      <section className="hero" id="top">
        <div className="hero__media">
          <img src={heroImg} alt="" fetchpriority="high" />
        </div>

        <div className="container hero__inner">
          <div className="hero__badges">
            <span className="chip">
              <Icon name="award" size={15} /> JCI Accredited
            </span>
            <span className="chip">
              <Icon name="clock" size={15} /> Appointments within 48 hours
            </span>
            <span className="chip">
              <Icon name="shield" size={15} /> All major insurers accepted
            </span>
          </div>

          <h1>
            Private healthcare, <em>without compromise.</em>
          </h1>

          <p className="hero__sub">
            Consultant-led medicine in one of Europe's most advanced private hospitals. Rapid
            access, transparent fixed pricing, and a team that treats you as a person — not a case
            number.
          </p>

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
                <i style={{ background: '#0e7c8b' }}>AH</i>
                <i style={{ background: '#b8924d' }}>DO</i>
                <i style={{ background: '#123444' }}>SM</i>
                <i style={{ background: '#16a7ba' }}>+</i>
              </span>
              <span>
                <strong>180+ consultants</strong>
                <span>across 30 specialties</span>
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
          <Icon name="mapPin" size={16} /> {hospital.address} · <Icon name="clock" size={16} />{' '}
          {hospital.hours}
        </p>
      </div>
    </>
  )
}
