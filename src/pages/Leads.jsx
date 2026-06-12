import { useMemo, useState } from 'react'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader, Avatar, EmptyState } from '../components/ui'
import { StageBadge, PriorityBadge } from '../components/Badge'
import { PIPELINE_STAGES } from '../data/constants'
import { allSources } from '../utils/stats'
import { currency, fmtDate, daysBetween } from '../utils/format'

export default function Leads({ nav }) {
  const { leads, interactions } = useStore()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState('all')
  const [source, setSource] = useState('all')
  const [sort, setSort] = useState({ key: 'updatedAt', dir: 'desc' })

  const lastTouch = useMemo(() => {
    const m = {}
    interactions.forEach((i) => {
      if (!m[i.leadId] || new Date(i.date) > new Date(m[i.leadId])) m[i.leadId] = i.date
    })
    return m
  }, [interactions])

  const filtered = useMemo(() => {
    let rows = leads.filter((l) => {
      const matchQ =
        !q ||
        [l.name, l.email, l.company, l.referredBy, (l.tags || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase())
      const matchStage = stage === 'all' || l.status === stage
      const matchSource = source === 'all' || l.source === source
      return matchQ && matchStage && matchSource
    })
    const { key, dir } = sort
    rows = [...rows].sort((a, b) => {
      let av = a[key], bv = b[key]
      if (key === 'estimatedValue') { av = Number(av || 0); bv = Number(bv || 0) }
      if (key === 'updatedAt') { av = new Date(av); bv = new Date(bv) }
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [leads, q, stage, source, sort])

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  return (
    <div className="page">
      <PageHeader
        title="Leads"
        subtitle={`${filtered.length} of ${leads.length} prospects`}
        actions={
          <button className="btn primary" onClick={nav.newLead}>
            <Plus size={16} /> New lead
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search name, email, tag, referrer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">All stages</option>
          {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All sources</option>
          {allSources(leads).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No leads match"
          body="Try clearing filters or add a new prospect."
          action={<button className="btn primary" onClick={nav.newLead}><Plus size={16} /> New lead</button>}
        />
      ) : (
        <div className="card no-pad">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} className="sortable">Name <ArrowUpDown size={12} /></th>
                <th>Stage</th>
                <th>Source</th>
                <th>Priority</th>
                <th onClick={() => toggleSort('estimatedValue')} className="sortable right">Value <ArrowUpDown size={12} /></th>
                <th>Last contact</th>
                <th>Next follow-up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const since = daysBetween(lastTouch[l.id])
                return (
                  <tr key={l.id} onClick={() => nav.openLead(l.id)}>
                    <td>
                      <div className="cell-name">
                        <Avatar name={l.name} />
                        <div>
                          <span className="cn-title">{l.name}</span>
                          <span className="cn-sub">{l.company || l.email || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td><StageBadge status={l.status} /></td>
                    <td>{l.source}{l.referredBy ? <span className="cn-sub block">via {l.referredBy}</span> : null}</td>
                    <td><PriorityBadge priority={l.priority} /></td>
                    <td className="right strong">{currency(l.estimatedValue)}</td>
                    <td className={since != null && since > 14 ? 'warn' : ''}>
                      {since == null ? '—' : since === 0 ? 'Today' : `${since}d ago`}
                    </td>
                    <td>{l.nextFollowUp ? fmtDate(l.nextFollowUp) : <span className="muted">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
