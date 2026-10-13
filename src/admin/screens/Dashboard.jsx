import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { Alert, Spinner, StatusBadge, formatDateTime, relative } from '../ui.jsx'

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .get('/api/admin/overview')
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])

  if (error) return <Alert kind="danger">{error}</Alert>
  if (!data) return <Spinner label="Loading overview…" />

  const { totals, counts, recent, perDay } = data
  const max = Math.max(1, ...perDay.map((d) => d.n))

  return (
    <>
      {counts.new > 0 && (
        <Alert kind="warn">
          <strong>{counts.new} new {counts.new === 1 ? 'enquiry' : 'enquiries'}</strong> waiting for a
          first response. Set a response target your team can reliably meet, and direct emergencies to the verified emergency number.{' '}
          <button className="abtn abtn--sm" style={{ marginLeft: 8 }} onClick={() => onNavigate('enquiries')}>
            Open inbox
          </button>
        </Alert>
      )}

      <div className="stats-grid">
        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">New enquiries</div>
          <div className="stat-card__value">{counts.new}</div>
          <div className="stat-card__hint">{totals.thisWeek} received this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total enquiries</div>
          <div className="stat-card__value">{totals.appointments}</div>
          <div className="stat-card__hint">
            {counts.booked} booked · {counts.completed} completed
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Departments</div>
          <div className="stat-card__value">{totals.departments}</div>
          <div className="stat-card__hint">live on the public site</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Consultants</div>
          <div className="stat-card__value">{totals.consultants}</div>
          <div className="stat-card__hint">{totals.faqs} FAQs published</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Enquiries, last 14 days</h2>
          <div style={{ flex: 1 }} />
          <span className="small muted">Peak day: {max} {max === 1 ? 'enquiry' : 'enquiries'}</span>
        </div>
        <div className="panel__body">
          {perDay.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No enquiries in the last two weeks.
            </p>
          ) : (
            <>
              <div className="chart">
                {perDay.map((d) => (
                  <div
                    className="chart__bar"
                    key={d.day}
                    style={{ height: `${Math.max(4, (d.n / max) * 100)}%` }}
                    title={`${d.day}: ${d.n}`}
                  >
                    <span>{d.n}</span>
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                {perDay.map((d) => (
                  <span key={d.day}>{d.day.slice(5)}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Latest enquiries</h2>
          <div style={{ flex: 1 }} />
          <button className="abtn abtn--sm" onClick={() => onNavigate('enquiries')}>
            View all
          </button>
        </div>
        <div className="panel__body panel__body--flush">
          <div className="table-wrap">
            <table className="atable">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Patient</th>
                  <th>Interested in</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="is-clickable" onClick={() => onNavigate('enquiries')}>
                    <td className="mono">{a.reference}</td>
                    <td>
                      <div className="cell-strong">{a.patient_name}</div>
                      <div className="cell-sub">{a.email}</div>
                    </td>
                    <td>
                      <div>{a.department || '—'}</div>
                      {a.consultant && <div className="cell-sub">{a.consultant}</div>}
                    </td>
                    <td title={formatDateTime(a.created_at)}>{relative(a.created_at)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted" style={{ padding: 24, textAlign: 'center' }}>
                      No enquiries yet. They will appear here the moment a patient uses the website
                      form.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totals.unpublished > 0 && (
        <Alert kind="info">
          <strong>{totals.unpublished}</strong> item(s) are saved as drafts and are hidden from the
          public website.
        </Alert>
      )}
    </>
  )
}
