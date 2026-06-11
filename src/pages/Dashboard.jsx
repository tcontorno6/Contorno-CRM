import {
  Plus, Users, DollarSign, Target, Trophy, CalendarClock,
  AlertTriangle, ArrowRight, Activity,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'
import { useStore } from '../context/StoreContext'
import { PageHeader, StatCard, Avatar } from '../components/ui'
import { StageBadge } from '../components/Badge'
import { computeStats, sourceBreakdown, stageBreakdown, leadTrend } from '../utils/stats'
import { forecast } from '../utils/revenue'
import { PIPELINE_STAGES } from '../data/constants'
import { currency, currencyFull, fmtDate, relativeDate } from '../utils/format'

const SOURCE_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#16a34a', '#ef4444', '#14b8a6', '#ec4899', '#64748b']

export default function Dashboard({ nav }) {
  const { leads, interactions, settings } = useStore()
  const stats = computeStats(leads, interactions)
  const sources = sourceBreakdown(leads)
  const stages = stageBreakdown(leads, PIPELINE_STAGES.filter((s) => s.id !== 'Lost'))
  const trend = leadTrend(leads)

  const recent = [...interactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
  const leadName = (id) => leads.find((l) => l.id === id)?.name || 'Unknown'

  const goalPct = settings.monthlyGoal
    ? Math.min(100, Math.round((stats.wonThisMonth / settings.monthlyGoal) * 100))
    : 0

  const fc = forecast(leads, settings)
  const feePct = ((settings.feeRate ?? 0.01) * 100).toFixed(settings.feeRate * 100 % 1 ? 2 : 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (settings.advisorName || '').split(' ')[0] || 'there'

  return (
    <div className="page">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle="Here's how your prospect pipeline is looking today."
        actions={
          <button className="btn primary" onClick={nav.newLead}>
            <Plus size={16} /> New lead
          </button>
        }
      />

      <div className="stat-row">
        <StatCard label="Open leads" value={stats.open} sub={`${stats.total} total tracked`} icon={Users} accent="#2563eb" />
        <StatCard label="Pipeline value" value={currency(stats.pipelineValue)} sub="Potential AUM in play" icon={DollarSign} accent="#16a34a" />
        <StatCard label="Conversion rate" value={`${stats.conversionRate}%`} sub={`${stats.won} clients · ${stats.lost} lost`} icon={Target} accent="#8b5cf6" />
        <StatCard label="New clients this month" value={`${stats.wonThisMonth} / ${settings.monthlyGoal}`} sub={`${goalPct}% of monthly goal`} icon={Trophy} accent="#f59e0b" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Lead flow — last 8 weeks</h3>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="leads" name="New leads" stroke="#2563eb" strokeWidth={2} fill="url(#gLeads)" />
                <Area type="monotone" dataKey="won" name="New clients" stroke="#16a34a" strokeWidth={2} fill="url(#gWon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Leads by source</h3>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sources} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="source" width={104} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" name="Leads" radius={[0, 5, 5, 0]} barSize={16}>
                  {sources.map((s, i) => <Cell key={s.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3><CalendarClock size={16} /> Follow-ups due</h3>
            <button className="link-btn" onClick={() => nav.go('leads')}>View all <ArrowRight size={14} /></button>
          </div>
          {stats.followUpsDue.length === 0 ? (
            <p className="muted pad">Nothing due today. You're on top of it. 🎉</p>
          ) : (
            <ul className="list">
              {stats.followUpsDue.slice(0, 6).map((l) => {
                const overdue = new Date(l.nextFollowUp) < new Date(new Date().setHours(0, 0, 0, 0))
                return (
                  <li key={l.id} className="list-row" onClick={() => nav.openLead(l.id)}>
                    <Avatar name={l.name} />
                    <div className="list-main">
                      <span className="list-title">{l.name}</span>
                      <span className="list-sub">{l.company || l.source}</span>
                    </div>
                    <span className={`pill ${overdue ? 'pill-danger' : 'pill-soft'}`}>
                      {overdue ? 'Overdue' : 'Today'} · {fmtDate(l.nextFollowUp)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {stats.stale.length > 0 && (
            <div className="inline-alert">
              <AlertTriangle size={15} />
              <span>{stats.stale.length} open lead{stats.stale.length > 1 ? 's have' : ' has'} gone quiet for 2+ weeks.</span>
              <button className="link-btn" onClick={() => nav.go('insights')}>See tips</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3><Activity size={16} /> Recent activity</h3>
            <button className="link-btn" onClick={() => nav.go('contacts')}>View all <ArrowRight size={14} /></button>
          </div>
          <ul className="timeline">
            {recent.map((i) => (
              <li key={i.id} className="tl-item" onClick={() => nav.openLead(i.leadId)}>
                <span className={`tl-dot tl-${i.direction === 'Inbound' ? 'in' : 'out'}`} />
                <div className="tl-body">
                  <span className="tl-title">
                    <strong>{i.type}</strong> with {leadName(i.leadId)}
                  </span>
                  <span className="tl-sub">{i.outcome} · {relativeDate(i.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Pipeline snapshot</h3>
          <span className="muted">{currencyFull(stats.pipelineValue)} open</span>
        </div>
        <div className="funnel">
          {stages.map((s) => {
            const max = Math.max(...stages.map((x) => x.count), 1)
            return (
              <div key={s.id} className="funnel-row" onClick={() => nav.go('pipeline')}>
                <span className="funnel-label">{s.label}</span>
                <div className="funnel-bar-track">
                  <div className="funnel-bar" style={{ width: `${(s.count / max) * 100}%`, background: s.color }}>
                    <span>{s.count}</span>
                  </div>
                </div>
                <span className="funnel-val">{currency(s.value)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3><DollarSign size={16} /> Revenue forecast</h3>
          <span className="muted">{feePct}% fee · {settings.avgClientYears}-yr lifetime value</span>
        </div>
        <div className="forecast-summary">
          <div className="fc-big">
            <span className="fc-amount">{currencyFull(Math.round(fc.weightedLTV))}</span>
            <span className="fc-label">Weighted pipeline value <em>(probability-adjusted lifetime value)</em></span>
          </div>
          <div className="fc-split">
            <div><span className="fc-num">{currencyFull(Math.round(fc.grossLTV))}</span><span className="fc-sub">Unweighted potential LTV</span></div>
            <div><span className="fc-num">{currencyFull(Math.round(fc.weightedAnnual))}</span><span className="fc-sub">Expected annual fees</span></div>
          </div>
        </div>
        <div className="forecast-table">
          <div className="fc-row fc-head">
            <span>Stage</span><span>Leads</span><span>Lifetime value</span><span>Close odds</span><span>Weighted</span>
          </div>
          {fc.byStage.map((s) => (
            <div className="fc-row" key={s.id} onClick={() => nav.go('pipeline')}>
              <span className="fc-stage"><span className="dot" style={{ background: s.color }} />{s.label}</span>
              <span>{s.count}</span>
              <span>{currency(s.ltv)}</span>
              <span className="fc-prob">{Math.round(s.probability * 100)}%</span>
              <span className="strong">{currency(s.weighted)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 6px 24px rgba(15,23,42,.08)',
  fontSize: 12,
}
