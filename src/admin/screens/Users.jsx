import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'
import {
  Alert,
  Confirm,
  Field,
  Modal,
  Spinner,
  formatDateTime,
  useToast,
} from '../ui.jsx'

const emptyForm = { name: '', email: '', role: 'editor', password: '' }

export default function Users({ user }) {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users')
      setItems(res.items)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    setSaving(true)
    setFormError('')
    try {
      await api.post('/api/admin/users', form)
      toast('Account created. The new user must choose their own password at first sign-in.')
      setCreating(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const patch = async (row, payload, message) => {
    try {
      await api.patch(`/api/admin/users/${row.id}`, payload)
      toast(message)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await api.del(`/api/admin/users/${confirm.id}`)
      toast('Account deleted.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetPassword = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/admin/users/${resetFor.id}`, { password: newPassword })
      toast('Password reset. The user must choose a new one when they next sign in.')
      setResetFor(null)
      setNewPassword('')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <Alert kind="danger">{error}</Alert>

  return (
    <>
      <Alert kind="info">
        Give reception an <strong>editor</strong> account — they can manage content and patient
        enquiries but cannot change site settings or manage staff accounts. Administrators can do
        everything.
      </Alert>

      <div className="toolbar">
        <button className="abtn abtn--primary" onClick={() => setCreating(true)}>
          + New user
        </button>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Staff accounts</h2>
          <div style={{ flex: 1 }} />
          <span className="small muted">{items.length} account(s)</span>
        </div>
        <div className="panel__body panel__body--flush">
          {loading ? (
            <Spinner label="Loading accounts…" />
          ) : (
            <div className="table-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last sign-in</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="cell-strong">
                        {row.name}
                        {row.id === user.id && <span className="cell-sub"> (you)</span>}
                      </td>
                      <td>{row.email}</td>
                      <td>
                        <select
                          className="ainput"
                          style={{ width: 110, padding: '5px 8px' }}
                          value={row.role}
                          onChange={(e) => patch(row, { role: e.target.value }, 'Role updated.')}
                          disabled={row.id === user.id}
                          aria-label={`Role for ${row.name}`}
                        >
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="small muted">
                        {row.last_login_at ? formatDateTime(row.last_login_at) : 'Never'}
                      </td>
                      <td>
                        {row.must_change_password ? (
                          <span className="badge badge--new">must set password</span>
                        ) : row.disabled ? (
                          <span className="badge badge--cancelled">disabled</span>
                        ) : (
                          <span className="badge badge--published">active</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="abtn abtn--sm"
                            onClick={() => {
                              setResetFor(row)
                              setNewPassword('')
                            }}
                          >
                            Reset password
                          </button>
                          <button
                            className="abtn abtn--sm"
                            disabled={row.id === user.id}
                            onClick={() =>
                              patch(
                                row,
                                { disabled: !row.disabled },
                                row.disabled ? 'Account re-enabled.' : 'Account disabled.',
                              )
                            }
                          >
                            {row.disabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            className="abtn abtn--sm abtn--danger"
                            disabled={row.id === user.id}
                            onClick={() => setConfirm(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {creating && (
        <Modal
          title="New staff account"
          subtitle="The user will be asked to set their own password the first time they sign in."
          onClose={() => setCreating(false)}
          footer={
            <>
              <button className="abtn" onClick={() => setCreating(false)} disabled={saving}>
                Cancel
              </button>
              <button className="abtn abtn--primary" onClick={create} disabled={saving}>
                {saving ? 'Creating…' : 'Create account'}
              </button>
            </>
          }
        >
          {formError && <Alert kind="danger">{formError}</Alert>}
          <Field label="Full name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Work email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="editor">Editor — content &amp; enquiries</option>
              <option value="admin">Administrator — full access</option>
            </select>
          </Field>
          <Field
            label="Temporary password"
            hint="At least 10 characters with an uppercase letter, a lowercase letter and a number. Share it securely — never by email."
          >
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
        </Modal>
      )}

      {resetFor && (
        <Modal
          title={`Reset password for ${resetFor.name}`}
          subtitle="They will be asked to choose their own password at the next sign-in."
          onClose={() => setResetFor(null)}
          footer={
            <>
              <button className="abtn" onClick={() => setResetFor(null)} disabled={saving}>
                Cancel
              </button>
              <button className="abtn abtn--primary" onClick={resetPassword} disabled={saving || !newPassword}>
                {saving ? 'Saving…' : 'Set password'}
              </button>
            </>
          }
        >
          <Field label="New temporary password">
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. Ward4-Secure-2026"
            />
          </Field>
        </Modal>
      )}

      {confirm && (
        <Confirm
          danger
          busy={saving}
          title={`Delete ${confirm.name}?`}
          body="This account will be removed immediately and can no longer sign in. Their changes stay in the activity log."
          confirmLabel="Delete account"
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      )}
    </>
  )
}
