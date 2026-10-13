import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api.js'
import Icon from '../../components/Icon.jsx'
import {
  Alert,
  Confirm,
  Drawer,
  EmptyState,
  Field,
  Spinner,
  StatusBadge,
  formatDateTime,
  relative,
  useToast,
} from '../ui.jsx'

const STATUSES = ['all', 'new', 'contacted', 'booked', 'completed', 'cancelled', 'spam']

export default function Enquiries({ user }) {
  const toast = useToast()
  const [status, setStatus] = useState('new')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (query) params.set('q', query)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return params.toString()
  }, [status, query, from, to])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, overview] = await Promise.all([
        api.get(`/api/admin/appointments?limit=100&${queryString}`),
        api.get('/api/admin/overview'),
      ])
      setItems(list.items)
      setTotal(list.total)
      setCounts(overview.counts)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    load()
  }, [load])

  const openEnquiry = (row) => {
    setOpen(row)
    setNotes(row.notes || '')
  }

  const patch = async (payload, message) => {
    setSaving(true)
    try {
      const res = await api.patch(`/api/admin/appointments/${open.id}`, payload)
      setOpen(res.item)
      setItems((list) => list.map((item) => (item.id === res.item.id ? res.item : item)))
      toast(message)
      if (payload.status) load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async ({ hard }) => {
    setSaving(true)
    try {
      await api.del(`/api/admin/appointments/${open.id}${hard ? '?hard=1' : ''}`)
      toast(
        hard
          ? 'Enquiry removed from the live database. Check retained backups and exports before closing any data request.'
          : 'Enquiry moved to deleted.',
      )
      setConfirmDelete(null)
      setOpen(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportUrl = `/api/admin/appointments/export.csv?${queryString}`

  return (
    <>
      {error && <Alert kind="danger">{error}</Alert>}

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <input
          className="ainput"
          style={{ maxWidth: 300 }}
          type="search"
          placeholder="Search name, email, phone or reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search enquiries"
        />
        <label className="small muted">
          From{' '}
          <input
            className="ainput"
            style={{ width: 150, display: 'inline-block' }}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="small muted">
          To{' '}
          <input
            className="ainput"
            style={{ width: 150, display: 'inline-block' }}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {(from || to || query) && (
          <button
            className="abtn abtn--sm"
            onClick={() => {
              setQuery('')
              setFrom('')
              setTo('')
            }}
          >
            Clear
          </button>
        )}
        <div style={{ flex: 1 }} />
        <a className="abtn" href={exportUrl}>
          <Icon name="file" size={16} /> Export CSV
        </a>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>
            {status === 'all' ? 'All enquiries' : `${status[0].toUpperCase()}${status.slice(1)} enquiries`}
          </h2>
          <div style={{ flex: 1 }} />
          <span className="small muted">
            {total} record{total === 1 ? '' : 's'}
          </span>
        </div>
        <div className="panel__body panel__body--flush">
          {loading ? (
            <Spinner label="Loading enquiries…" />
          ) : items.length === 0 ? (
            <EmptyState title="Nothing here">
              {status === 'new'
                ? 'No new enquiries right now — the inbox is clear.'
                : 'No enquiries match these filters.'}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Interested in</th>
                    <th>Funding</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="is-clickable" onClick={() => openEnquiry(row)}>
                      <td>
                        <div className="cell-strong">{row.patient_name}</div>
                        <div className="cell-sub mono">{row.reference}</div>
                      </td>
                      <td>
                        <div>{row.phone}</div>
                        <div className="cell-sub">{row.email}</div>
                      </td>
                      <td>
                        <div>{row.department || <span className="muted">Unassigned</span>}</div>
                        {row.consultant && <div className="cell-sub">{row.consultant}</div>}
                      </td>
                      <td className="cell-sub">{row.funder || '—'}</td>
                      <td title={formatDateTime(row.created_at)}>
                        {relative(row.created_at)}
                        {row.priority === 'urgent' && (
                          <>
                            <br />
                            <span className="badge badge--urgent">urgent</span>
                          </>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={row.status} />
                        {row.notes && (
                          <div className="cell-sub" title={row.notes}>
                            📝 note
                          </div>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <a
                            className="abtn abtn--sm"
                            href={`mailto:${row.email}?subject=${encodeURIComponent(`Your enquiry ${row.reference} — ${row.department || 'appointment'}`)}`}
                          >
                            Email
                          </a>
                          <a className="abtn abtn--sm" href={`tel:${row.phone.replace(/\s/g, '')}`}>
                            Call
                          </a>
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

      {open && (
        <Drawer
          title={open.patient_name}
          subtitle={`${open.reference} · received ${relative(open.created_at)}`}
          onClose={() => setOpen(null)}
          footer={
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  className="abtn abtn--sm"
                  href={`mailto:${open.email}?subject=${encodeURIComponent(`Your enquiry ${open.reference}`)}`}
                >
                  Email patient
                </a>
                <a className="abtn abtn--sm" href={`tel:${open.phone.replace(/\s/g, '')}`}>
                  Call
                </a>
                <a
                  className="abtn abtn--sm"
                  href={`https://wa.me/${open.phone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
              <button className="abtn abtn--sm abtn--danger" onClick={() => setConfirmDelete('soft')}>
                Delete
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 18 }}>
            <StatusBadge status={open.status} />
            {open.priority === 'urgent' && <span className="badge badge--urgent" style={{ marginLeft: 6 }}>urgent</span>}
          </div>

          <h3>Change status</h3>
          <div className="segmented" style={{ marginBottom: 20 }}>
            {['new', 'contacted', 'booked', 'completed', 'cancelled', 'spam'].map((s) => (
              <button
                key={s}
                aria-pressed={open.status === s}
                disabled={saving}
                onClick={() => patch({ status: s }, `Marked as ${s}.`)}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <h3>Patient details</h3>
          <dl className="detail-list">
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${open.phone.replace(/\s/g, '')}`}>{open.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${open.email}`}>{open.email}</a>
              </dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{open.department || '—'}</dd>
            </div>
            <div>
              <dt>Consultant requested</dt>
              <dd>{open.consultant || 'No preference'}</dd>
            </div>
            <div>
              <dt>Preferred date / time</dt>
              <dd>{[open.preferred_date, open.preferred_time].filter(Boolean).join(' · ') || '—'}</dd>
            </div>
            <div>
              <dt>Funding</dt>
              <dd>{open.funder || '—'}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{formatDateTime(open.created_at)}</dd>
            </div>
            <div>
              <dt>Submitted from</dt>
              <dd className="small muted">
                {open.source} · {open.ip || 'unknown IP'}
              </dd>
            </div>
          </dl>

          {open.message && (
            <>
              <h3>What the patient told us</h3>
              <div
                style={{
                  background: 'var(--a-bg)',
                  border: '1px solid var(--a-line)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  whiteSpace: 'pre-wrap',
                  marginBottom: 20,
                }}
              >
                {open.message}
              </div>
            </>
          )}

          <h3>Priority</h3>
          <div className="segmented" style={{ marginBottom: 20 }}>
            {['low', 'normal', 'urgent'].map((p) => (
              <button
                key={p}
                aria-pressed={open.priority === p}
                disabled={saving}
                onClick={() => patch({ priority: p }, `Priority set to ${p}.`)}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <Field
            label="Internal notes"
            hint="Visible only to staff in this panel — never shown to the patient."
          >
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="abtn abtn--primary"
              disabled={saving || notes === (open.notes || '')}
              onClick={() => patch({ notes }, 'Notes saved.')}
            >
              {saving ? 'Saving…' : 'Save notes'}
            </button>
            <button className="abtn abtn--sm" onClick={() => setNotes(open.notes || '')} disabled={saving}>
              Reset
            </button>
          </div>

          {user.role === 'admin' && (
            <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--a-line)' }}>
              <h3>Data protection</h3>
              <p className="small muted">
                Follow the hospital’s approved process for a data erasure request. This action removes the
                enquiry from the live database, but backups, exports and other retained copies need to
                be handled separately. The deletion event is logged.
              </p>
              <button className="abtn abtn--danger abtn--sm" onClick={() => setConfirmDelete('hard')}>
                Remove this enquiry from the live database
              </button>
            </div>
          )}
        </Drawer>
      )}

      {confirmDelete && (
        <Confirm
          danger
          busy={saving}
          title={confirmDelete === 'hard' ? 'Remove this enquiry from the live database?' : 'Delete this enquiry?'}
          body={
            confirmDelete === 'hard'
              ? 'This removes the enquiry from the live database and cannot be undone. Copies may remain in backups, exports, logs or other systems; follow the hospital’s approved process before confirming an erasure request is complete.'
              : 'The enquiry is removed from your inbox. An administrator can still recover it from the database if this was a mistake.'
          }
          confirmLabel={confirmDelete === 'hard' ? 'Remove live record' : 'Delete'}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => remove({ hard: confirmDelete === 'hard' })}
        />
      )}
    </>
  )
}
