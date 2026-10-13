import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { useSite } from '../context/SiteData.jsx'
import { useScrolledPast } from '../hooks/useScrollFx.js'

const links = [
  { id: 'departments', label: 'Departments' },
  { id: 'doctors', label: 'Our Consultants' },
  { id: 'why', label: 'Why us' },
  { id: 'patients', label: 'Patients' },
  { id: 'faq', label: 'FAQ' },
]

const tel = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`

export function Logo({ compact = false }) {
  const { settings } = useSite()
  return (
    <a
      href="#top"
      className="logo"
      aria-label={`${settings.brand_name} ${settings.brand_suffix} — home`}
    >
      <span className="logo__mark">
        <Icon name="cross" size={20} strokeWidth={2.4} />
      </span>
      <span className="logo__text">
        {settings.brand_name}
        {!compact && <small>{settings.brand_suffix}</small>}
      </span>
    </a>
  )
}

export default function Header({ active }) {
  const { settings } = useSite()
  const stuck = useScrolledPast(10)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    return () => document.body.classList.remove('no-scroll')
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span className="topbar__item">
            <Icon name="shield" size={15} /> {settings.accreditations}
          </span>
          <span className="topbar__item topbar__item--right">
            <Icon name="ambulance" size={15} /> {settings.emergency_banner}{' '}
            <a href={tel(settings.emergency_phone)}>{settings.emergency_phone}</a>
          </span>
        </div>
      </div>

      <header className={`header ${stuck ? 'header--stuck' : ''}`}>
        <div className="container header__bar">
          <Logo />

          <nav className="nav" aria-label="Main navigation">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} className={active === l.id ? 'is-active' : ''}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="header__actions">
            <a className="header__phone" href={tel(settings.phone)}>
              <Icon name="phone" size={17} />
              {settings.phone}
            </a>
            <a className="btn btn--primary btn--sm header__cta" href="#booking">
              Book an appointment
            </a>
            <button
              className={`burger ${open ? 'is-open' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <nav aria-label="Mobile navigation">
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="drawer__actions">
          <a className="btn btn--primary btn--block" href="#booking" onClick={() => setOpen(false)}>
            Book an appointment
          </a>
          <a className="btn btn--ghost btn--block" href={tel(settings.emergency_phone)}>
            <Icon name="ambulance" size={18} /> Emergency {settings.emergency_phone}
          </a>
        </div>
      </div>
    </>
  )
}
