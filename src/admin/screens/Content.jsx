import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api.js'
import Icon, { iconNames } from '../../components/Icon.jsx'
import { contentConfig } from '../content-config.js'
import {
  Alert,
  Confirm,
  EmptyState,
  Field,
  Modal,
  PublishBadge,
  Spinner,
  Switch,
  useToast,
} from '../ui.jsx'

const blankFromFields = (fields) =>
  Object.fromEntries(
    fields.map((f) => {
      if (f.type === 'toggle') return [f.key, true]
      if (f.type === 'number') return [f.key, f.key === 'sort_order' ? 10 : 0]
      if (f.type === 'list') return [f.key, '']
      return [f.key, '']
    }),
  )

/** Turns an API row into form state (arrays become newline lists). */
const rowToForm = (fields, row) =>
  Object.fromEntries(
    fields.map((f) => {
      const value = row[f.key]
      if (f.type === 'list') return [f.key, Array.isArray(value) ? value.join('\n') : '']
      if (f.type === 'toggle') return [f.key, Boolean(value)]
      if (value === null || value === undefined) return [f.key, f.type === 'number' ? 0 : '']
      return [f.key, value]
    }),
  )

export default function Content({ resource }) {
  const config = contentConfig[resource]
  const toast = useToast()

  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { row } | { isNew: true }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`${config.endpoint}`)
      setItems(res.items)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [config.endpoint])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    // Departments power the "Department" dropdown on consultants.
    api
      .get('/api/admin/content/departments')
      .then((res) => setDepartments(res.items))
      .catch(() => {})
  }, [])

  const departmentName = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q)),
    )
  }, [items, query])

  const openNew = () => {
    setForm(blankFromFields(config.fields))
    setFormError('')
    setEditing({ isNew: true })
  }

  const openEdit = (row) => {
    setForm(rowToForm(config.fields, row))
    setFormError('')
    setEditing({ row })
  }

  const save = async (e) => {
    e?.preventDefault()
    const missing = config.fields.find((f) => f.required && !String(form[f.key] ?? '').trim())
    if (missing) {
      setFormError(`${missing.label} is required.`)
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form }
      config.fields.forEach((f) => {
        if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0
        if (f.type === 'toggle') payload[f.key] = Boolean(payload[f.key])
        if (f.type === 'list') payload[f.key] = String(payload[f.key] || '')
      })

      if (editing.isNew) {
        await api.post(config.endpoint, payload)
        toast(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} added.`)
      } else {
        await api.patch(`${config.endpoint}/${editing.row.id}`, payload)
        toast('Changes saved. The public website is updated immediately.')
      }
      setEditing(null)
      load()
    } catch (err) {
      setFormError(err.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (row) => {
    try {
      await api.patch(`${config.endpoint}/${row.id}`, { published: !row.published })
      setItems((list) =>
        list.map((item) => (item.id === row.id ? { ...item, published: !item.published } : item)),
      )
      toast(row.published ? 'Moved to drafts — hidden from the website.' : 'Published.')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.del(`${config.endpoint}/${deleting.id}`)
      toast(`${config.singular} deleted.`)
      setDeleting(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const move = async (row, direction) => {
    const index = filtered.findIndex((r) => r.id === row.id)
    const swapWith = filtered[index + direction]
    if (!swapWith) return
    const order = items.map((r) => r.id)
    const a = order.indexOf(row.id)
    const b = order.indexOf(swapWith.id)
    ;[order[a], order[b]] = [order[b], order[a]]
    try {
      await api.post(`${config.endpoint}/reorder`, { ids: order })
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (loading) return <Spinner label={`Loading ${config.title.toLowerCase()}…`} />
  if (error) return <Alert kind="danger">{error}</Alert>

  return (
    <>
      <div className="toolbar">
        <button className="abtn abtn--primary" onClick={openNew}>
          + New {config.singular}
        </button>
        <input
          className="ainput"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder={`Search ${config.title.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${config.title}`}
        />
        <div style={{ flex: 1 }} />
        <span className="small muted">
          {filtered.length} of {items.length}
        </span>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>{config.title}</h2>
          <div style={{ flex: 1 }} />
          <span className="small muted">{config.description}</span>
        </div>
        <div className="panel__body panel__body--flush">
          {filtered.length === 0 ? (
            <EmptyState title={`No ${config.title.toLowerCase()} yet`}>
              Add your first {config.singular} — it appears on the public website straight away.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="atable">
                <thead>
                  <tr>
                    {config.columns.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      {config.columns.map((c) => (
                        <td key={c.key}>
                          {c.from === 'department_id' ? (
                            departmentName[row.department_id] || (
                              <span className="muted">Unassigned</span>
                            )
                          ) : (
                            <span className={c.strong ? 'cell-strong' : ''}>
                              {row[c.key] || <span className="muted">—</span>}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="abtn abtn--ghost abtn--sm"
                          onClick={() => togglePublished(row)}
                          title="Toggle visibility on the public website"
                        >
                          <PublishBadge published={row.published} />
                        </button>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="abtn abtn--sm abtn--icon"
                            onClick={() => move(row, -1)}
                            aria-label="Move up"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            className="abtn abtn--sm abtn--icon"
                            onClick={() => move(row, 1)}
                            aria-label="Move down"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button className="abtn abtn--sm" onClick={() => openEdit(row)}>
                            Edit
                          </button>
                          <button className="abtn abtn--sm abtn--danger" onClick={() => setDeleting(row)}>
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

      {editing && (
        <Modal
          title={editing.isNew ? `New ${config.singular}` : `Edit ${config.singular}`}
          subtitle={config.description}
          onClose={() => setEditing(null)}
          wide
          footer={
            <>
              <button className="abtn" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </button>
              <button className="abtn abtn--primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          {formError && <Alert kind="danger">{formError}</Alert>}
          <form className="form-grid-2" onSubmit={save}>
            {config.fields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint} span={f.span}>
                {f.type === 'textarea' && (
                  <textarea
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}

                {f.type === 'list' && (
                  <textarea
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={'One item per line'}
                  />
                )}

                {f.type === 'text' && (
                  <input
                    type="text"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}

                {f.type === 'number' && (
                  <input
                    type="number"
                    step={f.step || '1'}
                    value={form[f.key] ?? 0}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}

                {f.type === 'toggle' && (
                  <Switch
                    checked={Boolean(form[f.key])}
                    onChange={(checked) => setForm({ ...form, [f.key]: checked })}
                    label={form[f.key] ? 'Visible to patients' : 'Draft — hidden from the website'}
                  />
                )}

                {f.type === 'department' && (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                {f.type === 'image' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {form[f.key] ? (
                      <img
                        src={form[f.key]}
                        alt=""
                        style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 10 }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 10,
                          background: 'var(--a-teal-soft)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--a-teal)',
                        }}
                      >
                        <Icon name="users" size={20} />
                      </span>
                    )}
                    <input
                      type="text"
                      placeholder="/uploads/photo.jpg"
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="abtn abtn--sm"
                      onClick={() => setForm({ ...form, [f.key]: '' })}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {f.type === 'icon' && (
                  <div className="icon-grid">
                    {iconNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={form[f.key] === name}
                        onClick={() => setForm({ ...form, [f.key]: name })}
                        title={name}
                      >
                        <Icon name={name} size={20} />
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            ))}
          </form>
        </Modal>
      )}

      {deleting && (
        <Confirm
          danger
          title={`Delete this ${config.singular}?`}
          body={`“${deleting.name || deleting.question || deleting.quote}” will be removed from the website immediately. This cannot be undone.`}
          confirmLabel="Delete"
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </>
  )
}
