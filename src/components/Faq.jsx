import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'

export default function Faq() {
  const { data } = useSite()
  const { settings, faqs } = data
  const tel = `tel:${String(settings.phone || '').replace(/[^\d+]/g, '')}`

  if (!faqs.length) return null

  return (
    <section className="section section--mist" id="faq">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">Good to know</span>
          <h2>Questions patients ask us most</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>
            Can’t find your answer? Call {settings.phone} and speak to a human within a minute.
          </p>
        </div>

        <div className="faq">
          {faqs.map((f, i) => (
            <details key={f.id ?? f.question} open={i === 0}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>

        <div className="faq__cta">
          <Icon name="phone" size={20} />
          <span>
            Still unsure? <a href="#booking">Send us a request</a> or call{' '}
            <a href={tel}>{settings.phone}</a> — no call centres, no automated menus.
          </span>
        </div>
      </div>
    </section>
  )
}
