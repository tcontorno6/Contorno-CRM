// Formatting helpers.

export const currency = (n) => {
  if (n == null || n === '') return '$0'
  const num = Number(n)
  if (Number.isNaN(num)) return '$0'
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`
  if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(0)}k`
  return `$${num.toLocaleString()}`
}

export const currencyFull = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const relativeDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d - now
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day')
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60))
  if (Math.abs(diffHrs) >= 1) return rtf.format(diffHrs, 'hour')
  const diffMin = Math.round(diffMs / (1000 * 60))
  return rtf.format(diffMin, 'minute')
}

export const daysBetween = (iso, ref = new Date()) => {
  if (!iso) return null
  const d = new Date(iso)
  return Math.floor((ref - d) / (1000 * 60 * 60 * 24))
}

export const initials = (name = '') =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

export const uid = (prefix = 'id') =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
