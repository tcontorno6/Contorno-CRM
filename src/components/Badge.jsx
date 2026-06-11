import { stageMeta, priorityMeta } from '../data/constants'

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function StageBadge({ status }) {
  const m = stageMeta(status)
  return (
    <span className="badge" style={{ color: m.color, background: hexToRgba(m.color, 0.12) }}>
      <span className="dot" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const m = priorityMeta(priority)
  return (
    <span className="badge" style={{ color: m.color, background: hexToRgba(m.color, 0.12) }}>
      <span className="dot" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>
}
