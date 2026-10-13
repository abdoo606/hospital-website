import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import { ToastProvider, useToast, Spinner } from './ui.jsx'
import Login from './screens/Login.jsx'
import ChangePassword from './screens/ChangePassword.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Enquiries from './screens/Enquiries.jsx'
import Content from './screens/Content.jsx'
import Media from './screens/Media.jsx'
import Settings from './screens/Settings.jsx'
import Users from './screens/Users.jsx'
import Audit from './screens/Audit.jsx'

const contentRoutes = [
  { key: 'departments', label: 'Departments' },
  { key: 'consultants', label: 'Consultants' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'insurers', label: 'Insurers' },
]

const titles = {
  dashboard: ['Overview', 'What is happening with patient enquiries today'],
  enquiries: ['Patient enquiries', 'Every request submitted through the website'],
  media: ['Media library', 'Hospital photography and logos used across the site'],
  settings: ['Site settings', 'Brand, contact details, homepage and SEO'],
  users: ['Staff accounts', 'Who can sign in to this panel, and with what role'],
  audit: ['Activity log', 'A record of every change made in this panel'],
  account: ['My account', 'Your password and session'],
}

const routeFromHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return raw || 'dashboard'
}

function Panel({ user, onSignOut }) {
  const [route, setRoute] = useState(routeFromHash)
  const [newCount, setNewCount] = useState(0)
  const [brand, setBrand] = useState({ name: '', suffix: '' })

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    api
      .get('/api/admin/overview')
      .then((res) => setNewCount(res.counts.new))
      .catch(() => {})
    api
      .get('/api/admin/settings')
      .then((res) =>
        setBrand({
          name: res.settings.brand_name || 'Hospital',
          suffix: res.settings.brand_suffix || '',
        }),
      )
      .catch(() => {})
  }, [route])

  const navigate = useCallback((next) => {
    window.location.hash = `#/${next}`
    setRoute(next)
  }, [])

  const isContent = contentRoutes.some((r) => r.key === route)
  const [title, subtitle] = isContent
    ? [
        contentRoutes.find((r) => r.key === route).label,
        'Content shown on the public website',
      ]
    : titles[route] || titles.dashboard

  return (
    <div className="alayout">
      <aside className="aside">
        <div className="aside__brand">
          <span className="aside__mark">
            <Icon name="cross" size={18} strokeWidth={2.4} />
          </span>
          <span>
            {brand.name}
            <small>{brand.suffix || 'Staff panel'}</small>
          </span>
        </div>

        <div className="aside__nav">
          <div className="aside__group">Patients</div>
          <button
            className={`aside__link ${route === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => navigate('dashboard')}
          >
            <Icon name="award" size={17} /> Overview
          </button>
          <button
            className={`aside__link ${route === 'enquiries' ? 'is-active' : ''}`}
            onClick={() => navigate('enquiries')}
          >
            <Icon name="mail" size={17} /> Enquiries
            {newCount > 0 && <span className="pillcount">{newCount}</span>}
          </button>

          <div className="aside__group">Website content</div>
          {contentRoutes.map((r) => (
            <button
              key={r.key}
              className={`aside__link ${route === r.key ? 'is-active' : ''}`}
              onClick={() => navigate(r.key)}
            >
              <Icon
                name={
                  { departments: 'scan', consultants: 'users', faqs: 'file', testimonials: 'star', insurers: 'shield' }[
                    r.key
                  ]
                }
                size={17}
              />
              {r.label}
            </button>
          ))}
          <button
            className={`aside__link ${route === 'media' ? 'is-active' : ''}`}
            onClick={() => navigate('media')}
          >
            <Icon name="sparkle" size={17} /> Media library
          </button>
          <button
            className={`aside__link ${route === 'settings' ? 'is-active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <Icon name="sliders" size={17} /> Settings
          </button>

          {user.role === 'admin' && (
            <>
              <div className="aside__group">Administration</div>
              <button
                className={`aside__link ${route === 'users' ? 'is-active' : ''}`}
                onClick={() => navigate('users')}
              >
                <Icon name="shield" size={17} /> Staff accounts
              </button>
              <button
                className={`aside__link ${route === 'audit' ? 'is-active' : ''}`}
                onClick={() => navigate('audit')}
              >
                <Icon name="clock" size={17} /> Activity log
              </button>
            </>
          )}
        </div>

        <div className="aside__foot">
          <a href="/" target="_blank" rel="noreferrer">
            ↗ View public website
          </a>
        </div>
      </aside>

      <div className="amain">
        <header className="atopbar">
          <div className="atopbar__title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="atopbar__spacer" />
          <div className="who">
            <span className="who__avatar">
              {user.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')}
            </span>
            <span className="small">
              <strong style={{ display: 'block', color: 'var(--a-ink)' }}>{user.name}</strong>
              <span className="muted">{user.role === 'admin' ? 'Administrator' : 'Editor'}</span>
            </span>
          </div>
          <button className="abtn abtn--sm" onClick={() => navigate('account')}>
            Account
          </button>
          <button className="abtn abtn--sm" onClick={onSignOut}>
            Sign out
          </button>
        </header>

        <main className="acontent">
          {route === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {route === 'enquiries' && <Enquiries user={user} />}
          {isContent && <Content resource={route} />}
          {route === 'media' && <Media />}
          {route === 'settings' && <Settings user={user} />}
          {route === 'users' && user.role === 'admin' && <Users user={user} />}
          {route === 'audit' && user.role === 'admin' && <Audit />}
          {route === 'account' && <ChangePassword user={user} onDone={onSignOut} />}
        </main>
      </div>
    </div>
  )
}

function Shell() {
  const [state, setState] = useState({ loading: true, user: null })
  const toast = useToast()

  const loadSession = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me')
      setState({ loading: false, user: res.user })
    } catch {
      setState({ loading: false, user: null })
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      /* ignore */
    }
    toast('Signed out.')
    setState({ loading: false, user: null })
    window.location.hash = ''
  }, [toast])

  if (state.loading) {
    return (
      <div className="splash">
        <div className="spinner" />
        Loading staff panel…
      </div>
    )
  }

  if (!state.user) return <Login onSignedIn={(user) => setState({ loading: false, user })} />

  if (state.user.must_change_password) {
    return (
      <div style={{ padding: '40px 20px' }}>
        <ChangePassword
          user={state.user}
          forced
          onDone={(user) => setState({ loading: false, user: { ...user, must_change_password: false } })}
        />
      </div>
    )
  }

  return <Panel user={state.user} onSignOut={signOut} />
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}

export { Spinner }
