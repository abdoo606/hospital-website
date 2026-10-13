import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'
import { Alert, Field, Modal, Spinner, useToast } from '../ui.jsx'

function ImageField({ label, value, onChange, hint }) {
  const [picking, setPicking] = useState(false)
  const [items, setItems] = useState([])

  const openPicker = async () => {
    setPicking(true)
    try {
      const res = await api.get('/api/admin/media')
      setItems(res.items)
    } catch {
      setItems([])
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 84,
            height: 60,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--a-bg)',
            border: '1px solid var(--a-line)',
            flex: 'none',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.7rem',
            color: 'var(--a-muted)',
            textAlign: 'center',
          }}
        >
          {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'No image'}
        </div>
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <input
            className="ainput"
            type="text"
            placeholder="/uploads/photo.jpg — or leave blank to use the default"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="abtn abtn--sm" onClick={openPicker}>
              Choose from library
            </button>
            {value && (
              <button type="button" className="abtn abtn--sm" onClick={() => onChange('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {picking && (
        <Modal title="Media library" onClose={() => setPicking(false)} wide>
          {items.length === 0 ? (
            <p className="muted">No images uploaded yet — add some in the Media library screen.</p>
          ) : (
            <div className="media-grid">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="media-card"
                  style={{ cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  onClick={() => {
                    onChange(item.url)
                    setPicking(false)
                  }}
                >
                  <img src={item.url} alt={item.alt || item.original_name} />
                  <span className="media-card__body">
                    <span className="media-card__name">{item.original_name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </Field>
  )
}

export default function Settings({ user }) {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const readOnly = user.role !== 'admin'

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/settings')
      setSettings(res.settings)
      setDirty(false)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key) => (value) => {
    setSettings((s) => ({ ...s, [key]: value }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await api.put('/api/admin/settings', settings)
      setSettings(res.settings)
      setDirty(false)
      toast('Settings saved — the public website is updated.')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <Alert kind="danger">{error}</Alert>
  if (!settings) return <Spinner label="Loading settings…" />

  const text = (key) => ({
    value: settings[key] || '',
    onChange: (e) => set(key)(e.target.value),
    disabled: readOnly,
  })

  return (
    <>
      {readOnly && (
        <Alert kind="warn">
          You have the <strong>editor</strong> role. You can edit website content, but only an
          administrator can change these site settings.
        </Alert>
      )}

      <div className="toolbar">
        <button className="abtn abtn--primary" onClick={save} disabled={saving || readOnly || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
        {dirty && !readOnly && (
          <button className="abtn" onClick={load}>
            Discard
          </button>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Brand</h2>
        </div>
        <div className="panel__body">
          <div className="form-grid-2">
            <Field label="Hospital name" hint="Used in the logo and throughout the site">
              <input type="text" {...text('brand_name')} />
            </Field>
            <Field label="Name suffix" hint="e.g. Private Hospital, Medical Centre">
              <input type="text" {...text('brand_suffix')} />
            </Field>
            <Field label="Legal entity" hint="Shown in the footer copyright">
              <input type="text" {...text('legal_name')} />
            </Field>
            <Field label="Tagline">
              <input type="text" {...text('tagline')} />
            </Field>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Contact &amp; emergency</h2>
        </div>
        <div className="panel__body">
          <div className="form-grid-2">
            <Field label="Main phone">
              <input type="text" {...text('phone')} />
            </Field>
            <Field label="Emergency line (24/7)">
              <input type="text" {...text('emergency_phone')} />
            </Field>
            <Field label="Emergency banner label" hint="Shown in the top bar, e.g. “24/7 Emergency”">
              <input type="text" {...text('emergency_banner')} />
            </Field>
            <Field label="Accreditation line" hint="e.g. “JCI accredited · CQC registered private hospital”">
              <input type="text" {...text('accreditations')} />
            </Field>
            <Field label="Email">
              <input type="text" {...text('email')} />
            </Field>
            <Field label="Opening hours">
              <input type="text" {...text('hours')} />
            </Field>
            <Field label="Address" span>
              <input type="text" {...text('address')} />
            </Field>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Homepage hero &amp; statistics</h2>
        </div>
        <div className="panel__body">
          <div className="form-grid-2">
            <Field label="Headline (first part)">
              <input type="text" {...text('hero_heading')} />
            </Field>
            <Field label="Headline (highlighted part)">
              <input type="text" {...text('hero_highlight')} />
            </Field>
            <Field label="Supporting paragraph" span>
              <textarea {...text('hero_sub')} />
            </Field>
          </div>

          <h3 style={{ marginTop: 10 }}>Headline figures</h3>
          <p className="small muted">
            Only publish figures you can evidence — these appear prominently on the homepage.
          </p>
          <div className="form-grid-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="form-grid-2" style={{ gap: 10 }}>
                <Field label={`Figure ${n} — value`}>
                  <input type="text" {...text(`stat${n}_value`)} />
                </Field>
                <Field label="Suffix">
                  <input type="text" {...text(`stat${n}_suffix`)} placeholder="+ · % · /7" />
                </Field>
                <Field label="Label" span>
                  <input type="text" {...text(`stat${n}_label`)} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Photography</h2>
        </div>
        <div className="panel__body">
          <ImageField
            label="Homepage hero image"
            hint="Wide, landscape photograph — ideally 2000px or wider"
            value={settings.hero_image}
            onChange={set('hero_image')}
          />
          <ImageField
            label="“Time is the treatment” image"
            hint="A consultant with a patient works best"
            value={settings.about_image}
            onChange={set('about_image')}
          />
          <ImageField
            label="Facilities image"
            hint="Theatre, imaging suite or ward"
            value={settings.facility_image}
            onChange={set('facility_image')}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Legal &amp; privacy documents</h2>
        </div>
        <div className="panel__body">
          <Alert kind="warn">
            Link to documents approved for this hospital and jurisdiction. Adding a URL does not itself
            make the site compliant; have the content and data-processing setup reviewed before launch.
            Without a privacy notice URL, the booking form displays a demo warning.
          </Alert>
          <div className="form-grid-2">
            <Field label="Privacy notice URL" hint="Required before collecting real patient enquiries" span>
              <input type="url" placeholder="https://hospital.example/privacy" {...text('privacy_notice_url')} />
            </Field>
            <Field label="Terms of service URL">
              <input type="url" placeholder="https://hospital.example/terms" {...text('terms_url')} />
            </Field>
            <Field label="Cookie policy URL">
              <input type="url" placeholder="https://hospital.example/cookies" {...text('cookie_policy_url')} />
            </Field>
            <Field label="Accessibility statement URL">
              <input type="url" placeholder="https://hospital.example/accessibility" {...text('accessibility_url')} />
            </Field>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__head">
          <h2>Search engine listing</h2>
        </div>
        <div className="panel__body">
          <div className="form-grid-2">
            <Field label="Page title" hint="Around 60 characters works best in Google" span>
              <input type="text" {...text('seo_title')} />
            </Field>
            <Field label="Meta description" hint="Around 155 characters. Describe the hospital and its main promise." span>
              <textarea {...text('seo_description')} />
            </Field>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Booking form &amp; data retention</h2>
        </div>
        <div className="panel__body">
          <div className="form-grid-2">
            <Field
              label="Note next to the submit button"
              hint="Set the patient's expectation for how quickly they will hear back"
              span
            >
              <textarea {...text('booking_note')} />
            </Field>
            <Field
              label="Enquiry retention (months)"
              hint="Target retention period for your policy. Automatic expiry/deletion is not implemented yet; your team must apply and document the retention schedule."
            >
              <input type="number" {...text('retention_months')} />
            </Field>
          </div>
        </div>
      </div>
    </>
  )
}
