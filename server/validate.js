/** Server-side validation. Never trust the browser — every rule is enforced here too. */

export const str = (v, { max = 5000, required = false, field = 'field' } = {}) => {
  const value = typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v)
  if (required && !value) return { error: `${field} is required.` }
  if (value.length > max) return { error: `${field} must be under ${max} characters.` }
  return { value }
}

export const int = (v, { min = 0, max = 100000, field = 'field', fallback = 0 } = {}) => {
  if (v === '' || v === undefined || v === null) return { value: fallback }
  const n = Number(v)
  if (!Number.isFinite(n)) return { error: `${field} must be a number.` }
  const rounded = Math.trunc(n)
  if (rounded < min || rounded > max) return { error: `${field} must be between ${min} and ${max}.` }
  return { value: rounded }
}

export const num = (v, { min = 0, max = 100000, field = 'field', fallback = 0 } = {}) => {
  if (v === '' || v === undefined || v === null) return { value: fallback }
  const n = Number(v)
  if (!Number.isFinite(n)) return { error: `${field} must be a number.` }
  if (n < min || n > max) return { error: `${field} must be between ${min} and ${max}.` }
  return { value: n }
}

export const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0)

export const email = (v, { field = 'Email' } = {}) => {
  const value = String(v ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { error: `${field} is not valid.` }
  if (value.length > 200) return { error: `${field} is too long.` }
  return { value }
}

export const phone = (v, { field = 'Phone' } = {}) => {
  const value = String(v ?? '').trim()
  const digits = value.replace(/[^\d]/g, '')
  if (digits.length < 7 || digits.length > 20) return { error: `${field} is not a valid number.` }
  return { value }
}

export const list = (v, { max = 12, itemMax = 160 } = {}) => {
  const arr = Array.isArray(v)
    ? v
    : String(v ?? '')
        .split('\n')
        .map((s) => s.trim())
  const clean = arr
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .slice(0, max)
    .map((s) => s.slice(0, itemMax))
  return { value: clean }
}

export const oneOf = (v, allowed, { field = 'field', fallback } = {}) => {
  if (allowed.includes(v)) return { value: v }
  if (fallback !== undefined) return { value: fallback }
  return { error: `${field} must be one of: ${allowed.join(', ')}.` }
}

export const id = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Runs a map of rule functions and collects the first error. */
export function validate(input, rules) {
  const out = {}
  for (const [key, rule] of Object.entries(rules)) {
    const result = rule(input[key], key)
    if (result.error) return { error: result.error }
    out[key] = result.value
  }
  return { value: out }
}

export const reference = () =>
  `MER-${Math.floor(100000 + Math.random() * 899999)}`
