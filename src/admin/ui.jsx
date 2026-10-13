import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'

// ============================================================
//  Toasts
// ============================================================

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((message, kind = 'ok') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setItems((list) => [...list, { id, message, kind }])
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'toast--error' : 'toast--ok'}`}>
            <Icon name={t.kind === 'error' ? 'shield' : 'checkCircle'} size={17} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ============================================================
//  Modal & drawer
// ============================================================

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const focusable = ref.current?.querySelector('input, select, textarea, button')
    focusable?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal__head">
          <div style={{ flex: 1 }}>
            <h2>{title}</h2>
            {subtitle && <p className="small muted" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
          <button className="abtn abtn--ghost abtn--icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="overlay" style={{ padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-panel__head">
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>{title}</h2>
            {subtitle && <p className="small muted" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
          <button className="abtn abtn--ghost abtn--icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="drawer-panel__body">{children}</div>
        {footer && <div className="drawer-panel__foot">{footer}</div>}
      </aside>
    </>
  )
}

export function Confirm({ title, body, confirmLabel = 'Confirm', danger = false, busy, onCancel, onConfirm }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="abtn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`abtn ${danger ? 'abtn--danger' : 'abtn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{body}</p>
    </Modal>
  )
}

// ============================================================
//  Form primitives
// ============================================================

export function Field({ label, hint, children, span = false }) {
  return (
    <div className={`afield ${span ? 'span-2' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{status}</span>
}

export function PublishBadge({ published }) {
  return (
    <span className={`badge ${published ? 'badge--published' : 'badge--draft'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="empty">
      <div className="spinner" style={{ margin: '0 auto 12px' }} />
      {label}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Alert({ kind = 'info', children }) {
  return (
    <div className={`alert alert--${kind}`}>
      <Icon name={kind === 'danger' ? 'shield' : 'checkCircle'} size={18} />
      <div>{children}</div>
    </div>
  )
}

// ============================================================
//  Formatting helpers
// ============================================================

export const formatDateTime = (value) => {
  if (!value) return '—'
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const relative = (value) => {
  if (!value) return ''
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDateTime(value).split(',')[0]
}
