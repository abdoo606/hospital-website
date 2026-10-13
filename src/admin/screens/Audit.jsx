import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { Alert, Spinner, formatDateTime } from '../ui.jsx'

const actionBadge = (action) => {
  if (action === 'login') return 'badge--published'
  if (action === 'login_failed') return 'badge--urgent'
  if (action === 'delete') return 'badge--cancelled'
  if (action === 'create') return 'badge--booked'
  if (action === 'export') return 'badge--contacted'
  return 'badge--draft'
}

export default function Audit() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/admin/audit?limit=200')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) return <Alert kind="danger">{error}</Alert>
  if (loading) return <Spinner label="Loading activity…" />

  return (
    <>
      <Alert kind="info">
        Every sign-in, content change, export and deletion is recorded with the user, time and IP
        address. Keep this record — it is what an auditor or the data protection regulator will ask to
        see.
      </Alert>

      <div className="panel">
        <div className="panel__head">
          <h2>Last {items.length} events</h2>
        </div>
        <div className="panel__body panel__body--flush">
          <div className="table-wrap">
            <table className="atable">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Area</th>
                  <th>Detail</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="small nowrap" title={formatDateTime(row.created_at)}>
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="cell-strong">{row.user_email}</td>
                    <td>
                      <span className={`badge ${actionBadge(row.action)}`}>
                        {row.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{row.entity || '—'}</td>
                    <td className="small">{row.detail || '—'}</td>
                    <td className="small muted mono">{row.ip || '—'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 24, textAlign: 'center' }}>
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
