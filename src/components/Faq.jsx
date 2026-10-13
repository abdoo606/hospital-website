import Icon from './Icon.jsx'
import { faqs, hospital } from '../data/site.js'

export default function Faq() {
  return (
    <section className="section section--mist" id="faq">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">Good to know</span>
          <h2>Questions patients ask us most</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>
            Can't find your answer? Call {hospital.phone} and speak to a human within a minute.
          </p>
        </div>

        <div className="faq">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        <div className="faq__cta">
          <Icon name="phone" size={20} />
          <span>
            Still unsure? <a href="#booking">Send us a request</a> or call{' '}
            <a href={`tel:${hospital.phone.replace(/\s/g, '')}`}>{hospital.phone}</a> — no call
            centres, no automated menus.
          </span>
        </div>
      </div>
    </section>
  )
}
