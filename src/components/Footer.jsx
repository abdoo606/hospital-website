import Icon from './Icon.jsx'
import { Logo } from './Header.jsx'
import { departments, hospital } from '../data/site.js'

const year = new Date().getFullYear()

export default function Footer() {
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
              <Icon name="ambulance" size={17} /> 24/7 Emergency ·{' '}
              <a href={`tel:${hospital.emergency.replace(/\s/g, '')}`}>{hospital.emergency}</a>
            </span>
          </div>

          <div>
            <h4>Departments</h4>
            <ul>
              {departments.slice(0, 6).map((d) => (
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
                <span>{hospital.address}</span>
              </li>
              <li>
                <Icon name="phone" size={17} />
                <span>
                  <a href={`tel:${hospital.phone.replace(/\s/g, '')}`}>{hospital.phone}</a>
                </span>
              </li>
              <li>
                <Icon name="mail" size={17} />
                <span>
                  <a href={`mailto:${hospital.email}`}>{hospital.email}</a>
                </span>
              </li>
              <li>
                <Icon name="clock" size={17} />
                <span>{hospital.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {hospital.name} {hospital.suffix}. All rights reserved.
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
