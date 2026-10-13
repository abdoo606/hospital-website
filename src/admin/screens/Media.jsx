import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api.js'
import Icon from '../../components/Icon.jsx'
import { Alert, EmptyState, Spinner, useToast } from '../ui.jsx'

const prettySize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Media() {
  const toast = useToast()
  const inputRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/media')
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

  const uploadFiles = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploading(true)
    for (const file of list) {
      const form = new FormData()
      form.append('file', file)
      try {
        await api.upload('/api/admin/media', form)
        toast(`${file.name} uploaded.`)
      } catch (err) {
        toast(`${file.name}: ${err.message}`, 'error')
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    load()
  }

  const useIn = async (item, setting) => {
    try {
      await api.put('/api/admin/settings', { [setting]: item.url })
      toast(`Set as the ${setting.replace('_image', '').replace('_', ' ')} image on the website.`)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.original_name || item.filename}? Images still used on the site will show as broken.`)) {
      return
    }
    try {
      await api.del(`/api/admin/media/${item.id}`)
      toast('File deleted.')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <Alert kind="info">
        Upload the hospital's own photography rather than stock images — real buildings, real clinical
        teams and real patients (with written consent) convert far better. JPG, PNG, WEBP, AVIF or GIF
        up to 6 MB.
      </Alert>

      {error && <Alert kind="danger">{error}</Alert>}

      <div
        className="panel"
        style={{ marginBottom: 20, borderStyle: dragging ? 'dashed' : 'solid', borderColor: dragging ? 'var(--a-teal)' : undefined }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          uploadFiles(e.dataTransfer.files)
        }}
      >
        <div className="panel__body" style={{ textAlign: 'center', padding: '34px 20px' }}>
          <Icon name="sparkle" size={28} />
          <h2 style={{ marginTop: 10 }}>Drop images here</h2>
          <p className="muted">or</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <button className="abtn abtn--primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Choose files'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Library</h2>
          <div style={{ flex: 1 }} />
          <span className="small muted">{items.length} image(s)</span>
        </div>
        <div className="panel__body">
          {loading ? (
            <Spinner label="Loading library…" />
          ) : items.length === 0 ? (
            <EmptyState title="No images yet">Upload the hospital's logo, reception and wards to get started.</EmptyState>
          ) : (
            <div className="media-grid">
              {items.map((item) => (
                <div className="media-card" key={item.id}>
                  <img src={item.url} alt={item.alt || item.original_name} loading="lazy" />
                  <div className="media-card__body">
                    <span className="media-card__name" title={item.original_name}>
                      {item.original_name || item.filename}
                    </span>
                    <span className="muted" style={{ fontSize: '0.72rem' }}>
                      {prettySize(item.size)} · {item.uploaded_by}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="abtn abtn--sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}${item.url}`)
                          toast('Image URL copied.')
                        }}
                      >
                        Copy URL
                      </button>
                      <button className="abtn abtn--sm" onClick={() => useIn(item, 'hero_image')}>
                        Hero
                      </button>
                      <button className="abtn abtn--sm" onClick={() => useIn(item, 'about_image')}>
                        About
                      </button>
                      <button className="abtn abtn--sm" onClick={() => useIn(item, 'facility_image')}>
                        Facility
                      </button>
                      <button className="abtn abtn--sm abtn--danger" onClick={() => remove(item)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
