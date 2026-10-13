import Icon from './Icon.jsx'
import { Logo } from './Header.jsx'
import { useSite } from '../context/SiteData.jsx'

const year = new Date().getFullYear()

export default function Footer() {
  const { data, settings } = useSite()
  const tel = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`
  const departments = data.departments.slice(0, 6)

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <Logo compact />
            <p style={{ maxWidth: '34ch' }}>
              A private hospital built around consultant-led, transparent healthcare for patients in
              the UK and overseas.
            </p>
            <span className="footer__emergency">
              <Icon name="ambulance" size={17} /> {settings.emergency_banner} ·{' '}
              <a href={tel(settings.emergency_phone)}>{settings.emergency_phone}</a>
            </span>
          </div>

          <div>
            <h4>Departments</h4>
            <ul>
              {departments.map((d) => (
                <li key={d.id}>
                  <a href="#departments">{d.name}</a>
                </li>
              ))}
              <li>
                <a href="#departments">All specialties →</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Patients</h4>
            <ul>
              <li>
                <a href="#booking">Book an appointment</a>
              </li>
              <li>
                <a href="#patients">Insurance &amp; funding</a>
              </li>
              <li>
                <a href="#patients">International patients</a>
              </li>
              <li>
                <a href="#faq">Fees &amp; packages</a>
              </li>
              <li>
                <a href="#doctors">Find a consultant</a>
              </li>
              <li>
                <a href="#faq">Rights &amp; responsibilities</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="footer__contact">
              <li>
                <Icon name="mapPin" size={17} />
                <span>{settings.address}</span>
              </li>
              <li>
                <Icon name="phone" size={17} />
                <span>
                  <a href={tel(settings.phone)}>{settings.phone}</a>
                </span>
              </li>
              <li>
                <Icon name="mail" size={17} />
                <span>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </span>
              </li>
              <li>
                <Icon name="clock" size={17} />
                <span>{settings.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {settings.legal_name || `${settings.brand_name} ${settings.brand_suffix}`}. All
            rights reserved.
          </span>
          <span className="footer__legal">
            <a href="#top">Privacy notice</a>
            <a href="#top">Terms of service</a>
            <a href="#top">Cookie policy</a>
            <a href="#top">Accessibility</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
