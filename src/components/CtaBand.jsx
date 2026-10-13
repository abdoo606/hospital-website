import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'

export default function CtaBand() {
  const { settings } = useSite()
  const tel = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="cta-band reveal">
          <div>
            <span className="eyebrow" style={{ color: '#8fe0ea' }}>
              Ready when you are
            </span>
            <h2>Speak to a consultant this week</h2>
            <p>
              Private appointments, diagnostic imaging and surgery — arranged around your life, not
              around a waiting list.
            </p>
          </div>
          <div className="cta-band__actions">
            <a className="btn btn--light" href="#booking">
              <Icon name="calendar" size={18} /> Book an appointment
            </a>
            <a className="btn btn--outline-light" href={tel(settings.phone)}>
              <Icon name="phone" size={18} /> {settings.phone}
            </a>
            <p className="cta-band__phone">
              Emergency? Call <a href={tel(settings.emergency_phone)}>{settings.emergency_phone}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
