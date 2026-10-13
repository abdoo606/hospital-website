import { useState } from 'react'
import { api } from '../../api.js'
import { Alert, Field, useToast } from '../ui.jsx'

export default function ChangePassword({ user, forced = false, onDone }) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.post('/api/auth/password', { current, next })
      toast('Password updated.')
      setCurrent('')
      setNext('')
      setConfirm('')
      onDone?.({ ...user, must_change_password: false })
    } catch (err) {
      setError(err.message || 'Could not update the password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 620, margin: forced ? '0 auto' : 0 }}>
      <div className="panel__head">
        <h2>{forced ? 'Choose a new password' : 'Change your password'}</h2>
      </div>
      <div className="panel__body">
        {forced && (
          <Alert kind="warn">
            This account is still using the password it was created with. Choose your own password
            before continuing — hospital systems must not share default credentials.
          </Alert>
        )}
        {error && <Alert kind="danger">{error}</Alert>}

        <form onSubmit={submit}>
          <Field label="Current password">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <Field
            label="New password"
            hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
          >
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Repeat new password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="abtn abtn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
            {!forced && (
              <button type="button" className="abtn" onClick={() => onDone?.()}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
