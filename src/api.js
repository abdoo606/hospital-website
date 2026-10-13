/** Small fetch wrapper used by the public site and the admin panel. */

async function request(path, { method = 'GET', body, signal, formData } = {}) {
  const res = await fetch(path, {
    method,
    signal,
    credentials: 'same-origin',
    headers: formData ? undefined : body ? { 'Content-Type': 'application/json' } : undefined,
    body: formData || (body ? JSON.stringify(body) : undefined),
  })

  let payload = null
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    payload = await res.json().catch(() => null)
  }

  if (!res.ok) {
    const error = new Error(payload?.error || `Request failed (${res.status})`)
    error.status = res.status
    error.payload = payload
    throw error
  }
  return payload
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', formData }),
}

/** `/uploads/photo.jpg` or an empty string → a usable image URL. */
export const resolveImage = (url, fallback) => (url && String(url).trim() ? url : fallback)
