// Derived metrics for the dashboard and insights.

import { OPEN_STAGES, LEAD_SOURCES } from '../data/constants'
import { daysBetween } from './format'

export function computeStats(leads, interactions) {
  const total = leads.length
  const won = leads.filter((l) => l.status === 'Won')
  const lost = leads.filter((l) => l.status === 'Lost')
  const open = leads.filter((l) => OPEN_STAGES.includes(l.status))
  const decided = won.length + lost.length

  const pipelineValue = open.reduce((s, l) => s + Number(l.estimatedValue || 0), 0)
  const wonValue = won.reduce((s, l) => s + Number(l.estimatedValue || 0), 0)
  const conversionRate = decided ? Math.round((won.length / decided) * 100) : 0

  const now = new Date()
  const thisMonth = (iso) => {
    const d = new Date(iso)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }
  const newThisMonth = leads.filter((l) => thisMonth(l.createdAt)).length
  const wonThisMonth = won.filter((l) => thisMonth(l.updatedAt)).length

  // Last touch per lead
  const lastTouch = {}
  interactions.forEach((i) => {
    if (!lastTouch[i.leadId] || new Date(i.date) > new Date(lastTouch[i.leadId])) {
      lastTouch[i.leadId] = i.date
    }
  })

  // Follow-ups due (today or overdue) among open leads
  const followUpsDue = open.filter((l) => {
    if (!l.nextFollowUp) return false
    const d = new Date(l.nextFollowUp)
    return d <= new Date(new Date().setHours(23, 59, 59, 999))
  })

  const stale = open.filter((l) => (daysBetween(lastTouch[l.id]) ?? 999) > 14)

  return {
    total,
    open: open.length,
    won: won.length,
    lost: lost.length,
    pipelineValue,
    wonValue,
    conversionRate,
    newThisMonth,
    wonThisMonth,
    followUpsDue,
    stale,
    lastTouch,
  }
}

export function sourceBreakdown(leads) {
  const map = {}
  LEAD_SOURCES.forEach((s) => (map[s] = { source: s, count: 0, won: 0, value: 0 }))
  leads.forEach((l) => {
    const key = map[l.source] ? l.source : 'Other'
    map[key].count += 1
    if (l.status === 'Won') {
      map[key].won += 1
      map[key].value += Number(l.estimatedValue || 0)
    }
  })
  return Object.values(map)
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function stageBreakdown(leads, stages) {
  return stages.map((st) => ({
    ...st,
    count: leads.filter((l) => l.status === st.id).length,
    value: leads
      .filter((l) => l.status === st.id)
      .reduce((s, l) => s + Number(l.estimatedValue || 0), 0),
  }))
}

// Leads created per week for the last 8 weeks
export function leadTrend(leads, weeks = 8) {
  const out = []
  const now = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(now.getDate() - i * 7 - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const count = leads.filter((l) => {
      const d = new Date(l.createdAt)
      return d >= start && d < end
    }).length
    const wonCount = leads.filter((l) => {
      const d = new Date(l.updatedAt)
      return l.status === 'Won' && d >= start && d < end
    }).length
    out.push({
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leads: count,
      won: wonCount,
    })
  }
  return out
}
