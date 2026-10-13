import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'
import { resolveImage } from '../api.js'
import consultationFallback from '../assets/consultation.jpg'
import facilityFallback from '../assets/facility.jpg'

const steps = [
  {
    title: 'Tell us what you need',
    body: 'One short online request or a single phone call. A named coordinator replies within two working hours with consultant options and costs.',
  },
  {
    title: 'Meet your consultant',
    body: 'Typically within 48 hours, with diagnostics on the same visit where clinically appropriate. You see the consultant, not a trainee.',
  },
  {
    title: 'Treat, recover, follow up',
    body: 'Fixed-price treatment in private en-suite rooms, a written recovery plan and follow-up consultations included in the package.',
  },
]

export default function WhyUs() {
  const { settings } = useSite()

  return (
    <>
      <section className="section" id="why">
        <div className="container">
          <div className="split">
            <div className="split__media reveal">
              <img
                src={resolveImage(settings.about_image, consultationFallback)}
                alt={`A consultant talking with a patient at ${settings.brand_name || 'the hospital'}`}
                loading="lazy"
              />
              <div className="split__badge">
                <Icon name="clock" size={26} />
                <span>
                  <strong>Average 31-minute</strong>
                  <span>first consultation — not 8</span>
                </span>
              </div>
            </div>

            <div className="reveal" data-delay="1">
              <span className="eyebrow">The difference</span>
              <h2>Time is the treatment</h2>
              <p className="lead-in">
                Private medicine fails when it is rushed. We built our clinic templates around longer
                appointments, so your consultant has the space to understand the whole picture —
                history, lifestyle, worries and all.
              </p>
              <ul className="checklist">
                <li>
                  <Icon name="checkCircle" size={19} />
                  <span>
                    <strong>Named consultant from start to finish.</strong> You are not handed
                    between teams mid-pathway.
                  </span>
                </li>
                <li>
                  <Icon name="checkCircle" size={19} />
                  <span>
                    <strong>Diagnostics on the same day wherever possible.</strong> MRI, CT, PET-CT
                    and pathology all on site.
                  </span>
                </li>
                <li>
                  <Icon name="checkCircle" size={19} />
                  <span>
                    <strong>Fixed-price packages, quoted in writing.</strong> Surgery, stay, implants
                    and follow-up included.
                  </span>
                </li>
                <li>
                  <Icon name="checkCircle" size={19} />
                  <span>
                    <strong>Records in your hands in 48 hours.</strong> Secure portal access, shared
                    with your GP on request.
                  </span>
                </li>
              </ul>
              <a className="link-arrow" href="#booking">
                Request your appointment <Icon name="arrowRight" size={17} />
              </a>
            </div>
          </div>

          <div className="split split--reverse" style={{ marginTop: 110 }}>
            <div className="split__media reveal">
              <img
                src={resolveImage(settings.facility_image, facilityFallback)}
                alt="Modern imaging suite and operating theatre"
                loading="lazy"
              />
              <div className="split__badge">
                <Icon name="scan" size={26} />
                <span>
                  <strong>3T MRI &amp; PET-CT</strong>
                  <span>reported by consultant radiologists</span>
                </span>
              </div>
            </div>

            <div className="reveal" data-delay="1">
              <span className="eyebrow">Facilities</span>
              <h2>Technology most private hospitals lease — we own</h2>
              <p className="lead-in">
                Owning our imaging and theatres means we control the waiting list, not a third party.
                Faster scans, faster decisions, faster recovery.
              </p>
              <div className="facility-grid">
                <div className="facility">
                  <Icon name="scan" size={22} />
                  <strong>Robotic surgery</strong>
                  <span>Precision arthroplasty &amp; urology</span>
                </div>
                <div className="facility">
                  <Icon name="heart" size={22} />
                  <strong>Cath labs</strong>
                  <span>24/7 primary angioplasty</span>
                </div>
                <div className="facility">
                  <Icon name="users" size={22} />
                  <strong>Level 3 NICU</strong>
                  <span>Neonatal intensive care on site</span>
                </div>
                <div className="facility">
                  <Icon name="file" size={22} />
                  <strong>Digital records</strong>
                  <span>Same-week reporting for every scan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--ink">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps from enquiry to recovery</h2>
            <p className="lede">No forms to chase, no call-back queues, no surprises on the invoice.</p>
          </div>
          <div className="steps">
            {steps.map((s, i) => (
              <div className="step reveal" key={s.title} data-delay={String(i + 1)}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
