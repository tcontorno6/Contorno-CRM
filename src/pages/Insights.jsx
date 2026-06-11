import {
  Users, AlertTriangle, Clock, Mic, Zap, Handshake, Linkedin,
  Lightbulb, TrendingUp, Award,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'
import { useStore } from '../context/StoreContext'
import { PageHeader } from '../components/ui'
import { leadFlowSuggestions } from '../utils/coaching'
import { sourceBreakdown, computeStats } from '../utils/stats'
import { currency } from '../utils/format'

const ICONS = { users: Users, alert: AlertTriangle, clock: Clock, mic: Mic, zap: Zap, handshake: Handshake, linkedin: Linkedin }
const COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#16a34a', '#ef4444', '#14b8a6', '#ec4899', '#64748b']

export default function Insights({ nav }) {
  const { leads, interactions } = useStore()
  const suggestions = leadFlowSuggestions(leads, interactions)
  const sources = sourceBreakdown(leads)
  const stats = computeStats(leads, interactions)

  // Source performance: conversion among decided leads per source
  const perf = sources.map((s) => {
    const all = leads.filter((l) => l.source === s.source)
    const decided = all.filter((l) => l.status === 'Won' || l.status === 'Lost').length
    const conv = decided ? Math.round((s.won / decided) * 100) : 0
    return { ...s, conv }
  })
  const best = [...perf].filter((p) => p.won > 0).sort((a, b) => b.conv - a.conv)[0]

  const pieData = sources.map((s) => ({ name: s.source, value: s.count }))

  return (
    <div className="page">
      <PageHeader
        title="Coaching & Insights"
        subtitle="Where your leads come from, what's converting, and how to get more."
      />

      <div className="insight-banner">
        <div className="ib-icon"><Lightbulb size={22} /></div>
        <div>
          <h3>Your lead engine at a glance</h3>
          <p>
            You're converting <strong>{stats.conversionRate}%</strong> of decided prospects
            {best ? <> and your strongest source is <strong>{best.source}</strong> ({best.conv}% close rate).</> : '.'}{' '}
            {stats.stale.length > 0
              ? <>Watch out — <strong>{stats.stale.length}</strong> open lead{stats.stale.length > 1 ? 's are' : ' is'} going cold.</>
              : 'Your follow-ups are in good shape.'}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3><TrendingUp size={16} /> Lead source mix</h3></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3><Award size={16} /> Source performance</h3></div>
          <div className="perf-table">
            <div className="perf-row perf-head">
              <span>Source</span><span>Leads</span><span>Clients</span><span>Close %</span><span>Value</span>
            </div>
            {perf.map((p) => (
              <div className="perf-row" key={p.source}>
                <span className="perf-name">{p.source}</span>
                <span>{p.count}</span>
                <span>{p.won}</span>
                <span>
                  <span className="conv-bar"><span style={{ width: `${p.conv}%` }} /></span>
                  {p.conv}%
                </span>
                <span className="strong">{currency(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-head section-head">
        <h3><Lightbulb size={18} /> Ways to grow your lead flow</h3>
      </div>
      <div className="suggestions">
        {suggestions.map((s, i) => {
          const Icon = ICONS[s.icon] || Lightbulb
          return (
            <div className="suggestion" key={i}>
              <div className="sg-icon"><Icon size={18} /></div>
              <div className="sg-body">
                <div className="sg-head">
                  <h4>{s.title}</h4>
                  <span className={`sg-tag tag-${s.tag.replace(/\s+/g, '-').toLowerCase()}`}>{s.tag}</span>
                </div>
                <p>{s.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="footnote">
        Tips are generated from your own pipeline data with a built-in rules engine — no internet or API key needed.
        You can wire this up to the Claude API later for fully dynamic coaching (see the README).
      </p>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 10, border: '1px solid #e2e8f0',
  boxShadow: '0 6px 24px rgba(15,23,42,.08)', fontSize: 12,
}
