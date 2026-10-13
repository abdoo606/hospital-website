import { useState } from 'react'
import { api } from '../../api.js'
import Icon from '../../components/Icon.jsx'
import { Alert, Field } from '../ui.jsx'

export default function Login({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })
      onSignedIn(res.user)
    } catch (err) {
      setError(err.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand">
          <span className="aside__mark" style={{ width: 40, height: 40 }}>
            <Icon name="cross" size={20} strokeWidth={2.4} />
          </span>
          <span>
            <strong style={{ color: 'var(--a-ink)' }}>Staff panel</strong>
            <small>Private hospital CMS</small>
          </span>
        </div>

        <h1 style={{ marginBottom: 16 }}>Sign in</h1>

        {error && <Alert kind="danger">{error}</Alert>}

        <Field label="Work email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            placeholder="you@hospital.com"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <button className="abtn abtn--primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="login__hint">
          Sessions last 12 hours and are protected by an httpOnly cookie. Five failed attempts from
          the same device will temporarily lock sign-in — call IT if you get locked out.
        </p>
      </form>
    </div>
  )
}
