import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'

const items = [
  {
    icon: 'globe',
    title: 'International Patient Office',
    body: 'Visa invitation letters, medical-record translation, airport transfers and interpreters in more than 20 languages.',
  },
  {
    icon: 'file',
    title: 'Written quotations before admission',
    body: 'A fixed-price package covering surgeon, anaesthetist, theatre, implants, your stay and follow-up.',
  },
  {
    icon: 'shield',
    title: 'Direct insurance billing',
    body: 'We bill your insurer directly and handle pre-authorisation — you focus on getting well.',
  },
  {
    icon: 'users',
    title: 'Family & companion support',
    body: 'Private rooms with companion beds, on-site accommodation partners and family liaison nurses.',
  },
]

export default function Patients() {
  const { data } = useSite()
  const insurers = data.insurers

  return (
    <section className="section section--mist" id="patients">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Patients &amp; insurance</span>
          <h2>Private care, made straightforward</h2>
          <p className="lede">
            Whether you are self-funding or insured, local or flying in, one dedicated coordinator
            handles everything from paperwork to parking.
          </p>
        </div>

        <div className="grid grid--2 patients__grid">
          {insurers.length > 0 && (
            <div className="card patients__card reveal">
              <h3>We are recognised by</h3>
              <p>
                All major UK and international insurers, with direct billing and same-day
                pre-authorisation for most policies.
              </p>
              <div className="pill-row">
                {insurers.map((i) => (
                  <span className="pill" key={i}>
                    {i}
                  </span>
                ))}
              </div>
              <p className="muted patients__fine">
                Not insured? Ask for our fixed-price self-pay packages — most patients are surprised
                by the difference.
              </p>
            </div>
          )}

          <ul className="patients__list">
            {items.map((it) => (
              <li key={it.title} className="reveal">
                <Icon name={it.icon} size={22} />
                <span>
                  <strong>{it.title}</strong>
                  <span>{it.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="quote-block reveal patients__quote">
          <div className="qmark">“</div>
          <blockquote>
            Our standards are set by the people we treat: measured waiting times, published patient
            outcomes and a satisfaction score we review every single month.
          </blockquote>
          <cite>
            Chief Medical Officer
            <span>{data.settings.brand_name} {data.settings.brand_suffix}</span>
          </cite>
          <div className="quote-metrics">
            <div>
              <strong>98%</strong>
              <span>would recommend us</span>
            </div>
            <div>
              <strong>&lt;2 hrs</strong>
              <span>enquiry response time</span>
            </div>
            <div>
              <strong>0.3%</strong>
              <span>surgical site infection rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
