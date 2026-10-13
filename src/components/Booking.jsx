import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { departments, doctors, hospital, insurers } from '../data/site.js'

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
}

const times = ['As soon as possible', 'Morning (08:00 – 12:00)', 'Afternoon (12:00 – 17:00)', 'Evening (17:00 – 20:00)']

export default function Booking({ preselect }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    if (!preselect) return
    setSubmitted(null)
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
  }

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

  const onSubmit = (e) => {
    e.preventDefault()
    const problems = validate()
    const firstInvalid = Object.keys(problems)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    const ref = `MER-${Math.floor(100000 + Math.random() * 899999)}`
    const record = { ref, ...form, createdAt: new Date().toISOString() }
    try {
      const store = JSON.parse(localStorage.getItem('meridian:appointments') || '[]')
      localStorage.setItem('meridian:appointments', JSON.stringify([...store, record]))
    } catch {
      /* storage unavailable — the demo confirmation is still shown */
    }
    setSubmitted(record)
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
                    <a href={`tel:${hospital.phone.replace(/\s/g, '')}`}>{hospital.phone}</a> · Mon–Fri
                    07:00–21:00, Sat 08:00–16:00
                  </span>
                </span>
              </li>
              <li>
                <Icon name="ambulance" size={20} />
                <span>
                  <strong>Emergency — 24 hours</strong>
                  <span>
                    <a href={`tel:${hospital.emergency.replace(/\s/g, '')}`}>{hospital.emergency}</a>{' '}
                    · Walk in without an appointment
                  </span>
                </span>
              </li>
              <li>
                <Icon name="mail" size={20} />
                <span>
                  <strong>Email</strong>
                  <span>
                    <a href={`mailto:${hospital.email}`}>{hospital.email}</a>
                  </span>
                </span>
              </li>
              <li>
                <Icon name="mapPin" size={20} />
                <span>
                  <strong>Where to find us</strong>
                  <span>{hospital.address}</span>
                </span>
              </li>
              <li>
                <Icon name="park" size={20} />
                <span>
                  <strong>Parking &amp; transport</strong>
                  <span>Free valet parking, 4 min from Knightsbridge station.</span>
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
                <p className="lead-in">
                  Your reference number is
                </p>
                <code>{submitted.ref}</code>
                <p className="lead-in">
                  A coordinator from our{' '}
                  {submitted.dept || 'patient services'} team will call you on{' '}
                  {submitted.phone} within two working hours to confirm your appointment
                  {submitted.doctor ? ` with ${submitted.doctor}` : ''}.
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setForm(emptyForm)
                    setSubmitted(null)
                  }}
                >
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
                      {doctors
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
                      {insurers.map((i) => (
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

                  <label className="consent" htmlFor="consent">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={form.consent}
                      onChange={set('consent')}
                      aria-invalid={Boolean(errors.consent)}
                    />
                    <span>
                      I consent to Meridian Private Hospital storing these details and contacting me
                      about my enquiry. We never share your information with third parties.
                      {errors.consent && <b className="field__error"> {errors.consent}</b>}
                    </span>
                  </label>

                  <div className="form-foot">
                    <button className="btn btn--primary" type="submit">
                      <Icon name="calendar" size={18} /> Request appointment
                    </button>
                    <p className="form-note">
                      Typical response time: under 2 working hours. For emergencies call{' '}
                      {hospital.emergency}.
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
