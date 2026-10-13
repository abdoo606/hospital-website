import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { api } from '../api.js'
import { useSite } from '../context/SiteData.jsx'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  dept: '',
  doctor: '',
  date: '',
  time: 'As soon as possible',
  funder: 'Self-funding',
  message: '',
  consent: false,
  website: '', // honeypot — must stay empty
}

const times = [
  'As soon as possible',
  'Morning (08:00 – 12:00)',
  'Afternoon (12:00 – 17:00)',
  'Evening (17:00 – 20:00)',
]

export default function Booking({ preselect }) {
  const { data, settings } = useSite()
  const { departments, consultants } = data

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const tel = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`

  useEffect(() => {
    if (!preselect) return
    setSubmitted(null)
    setServerError('')
    setForm((f) => ({
      ...f,
      dept: preselect.dept || f.dept,
      doctor: preselect.doctor || f.doctor,
    }))
    setErrors({})
  }, [preselect])

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setServerError('')
  }

  /** Client-side checks mirror the server's rules — the server is still authoritative. */
  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address.'
    if (form.phone.replace(/[^\d]/g, '').length < 7)
      next.phone = 'Please enter a contact number we can reach you on.'
    if (!form.consent) next.consent = 'We need your consent to contact you.'
    setErrors(next)
    return next
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const problems = validate()
    const firstInvalid = Object.keys(problems)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSending(true)
    setServerError('')
    try {
      const result = await api.post('/api/appointments', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.dept,
        consultant: form.doctor,
        date: form.date,
        time: form.time,
        funder: form.funder,
        message: form.message,
        consent: form.consent,
        website: form.website,
      })
      setSubmitted({ reference: result?.reference, ...form })
      setForm(emptyForm)
    } catch (err) {
      if (err.status === 429) {
        setServerError(
          'Too many requests from this device. Please try again shortly, or call us and we will book you in directly.',
        )
      } else if (err.status === 400) {
        setServerError(err.message || 'Some details need checking. Please review the form.')
      } else {
        setServerError(
          `We could not send your request right now. Please call ${settings.phone} or email ${settings.email} so we do not miss you.`,
        )
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section" id="booking">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Book your appointment</span>
          <h2>Request a consultation</h2>
          <p className="lede">
            Send us the details and a named coordinator will call you back within two working hours
            with consultant options, availability and costs.
          </p>
        </div>

        <div className="booking">
          <aside className="booking__aside reveal">
            <ul>
              <li>
                <Icon name="phone" size={20} />
                <span>
                  <strong>Appointments &amp; enquiries</strong>
                  <span>
                    <a href={tel(settings.phone)}>{settings.phone}</a> · {settings.hours}
                  </span>
                </span>
              </li>
              <li>
                <Icon name="ambulance" size={20} />
                <span>
                  <strong>Emergency — 24 hours</strong>
                  <span>
                    <a href={tel(settings.emergency_phone)}>{settings.emergency_phone}</a> · Walk in
                    without an appointment
                  </span>
                </span>
              </li>
              <li>
                <Icon name="mail" size={20} />
                <span>
                  <strong>Email</strong>
                  <span>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </span>
                </span>
              </li>
              <li>
                <Icon name="mapPin" size={20} />
                <span>
                  <strong>Where to find us</strong>
                  <span>{settings.address}</span>
                </span>
              </li>
              <li>
                <Icon name="park" size={20} />
                <span>
                  <strong>Parking &amp; transport</strong>
                  <span>Free valet parking, and public transport stops within a short walk.</span>
                </span>
              </li>
            </ul>
          </aside>

          <div className="form-card reveal" data-delay="1">
            {submitted ? (
              <div className="form-success">
                <span className="form-success__icon">
                  <Icon name="checkCircle" size={30} />
                </span>
                <h3>Request received, {submitted.name.split(' ')[0]}</h3>
                <p className="lead-in">Your reference number is</p>
                <code>{submitted.reference}</code>
                <p className="lead-in">
                  A coordinator from our {submitted.dept || 'patient services'} team will call you on{' '}
                  {submitted.phone} within two working hours to confirm your appointment
                  {submitted.doctor ? ` with ${submitted.doctor}` : ''}.
                </p>
                <button className="btn btn--ghost" onClick={() => setSubmitted(null)}>
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="name">
                      Full name <span className="req">*</span>
                    </label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={set('name')}
                      aria-invalid={Boolean(errors.name)}
                      placeholder="e.g. Sarah Whitfield"
                      autoComplete="name"
                    />
                    {errors.name && <span className="field__error">{errors.name}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">
                      Phone <span className="req">*</span>
                    </label>
                    <input
                      id="phone"
                      value={form.phone}
                      onChange={set('phone')}
                      aria-invalid={Boolean(errors.phone)}
                      placeholder="+44 7700 900123"
                      autoComplete="tel"
                    />
                    {errors.phone && <span className="field__error">{errors.phone}</span>}
                  </div>

                  <div className="field field--full">
                    <label htmlFor="email">
                      Email <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      aria-invalid={Boolean(errors.email)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {errors.email && <span className="field__error">{errors.email}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="dept">Department</label>
                    <select id="dept" value={form.dept} onChange={set('dept')}>
                      <option value="">Not sure yet</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="doctor">Preferred consultant</label>
                    <select id="doctor" value={form.doctor} onChange={set('doctor')}>
                      <option value="">No preference — match me</option>
                      {consultants
                        .filter((d) => !form.dept || d.dept === form.dept)
                        .map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="date">Preferred date</label>
                    <input id="date" type="date" value={form.date} onChange={set('date')} />
                  </div>

                  <div className="field">
                    <label htmlFor="time">Preferred time</label>
                    <select id="time" value={form.time} onChange={set('time')}>
                      {times.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field field--full">
                    <label htmlFor="funder">How are you funding treatment?</label>
                    <select id="funder" value={form.funder} onChange={set('funder')}>
                      <option>Self-funding</option>
                      {data.insurers.map((i) => (
                        <option key={i}>{i} insurance</option>
                      ))}
                      <option>Embassy / corporate sponsor</option>
                    </select>
                  </div>

                  <div className="field field--full">
                    <label htmlFor="message">Tell us briefly what you need</label>
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Symptoms, previous treatment, referral letters or anything we should know…"
                    />
                  </div>

                  {/* Honeypot: hidden from patients, filled by bots. */}
                  <div className="hp-field" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={set('website')}
                    />
                  </div>

                  <label className="consent" htmlFor="consent">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={form.consent}
                      onChange={set('consent')}
                      aria-invalid={Boolean(errors.consent)}
                    />
                    <span>
                      I consent to {settings.brand_name} {settings.brand_suffix} storing these details
                      and contacting me about my enquiry. We never share your information with third
                      parties.
                      {errors.consent && <b className="field__error"> {errors.consent}</b>}
                    </span>
                  </label>

                  {serverError && (
                    <div className="form-alert" role="alert">
                      <Icon name="shield" size={18} />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="form-foot">
                    <button className="btn btn--primary" type="submit" disabled={sending}>
                      {sending ? (
                        'Sending…'
                      ) : (
                        <>
                          <Icon name="calendar" size={18} /> Request appointment
                        </>
                      )}
                    </button>
                    <p className="form-note">
                      {settings.booking_note || 'Typical response time: under 2 working hours.'} For
                      emergencies call {settings.emergency_phone}.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
