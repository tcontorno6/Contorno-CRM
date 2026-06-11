import { useMemo, useState } from 'react'
import { Phone, Mail, Calendar, MessageSquareText, Search, Filter } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader, Avatar, EmptyState } from '../components/ui'
import { INTERACTION_TYPES } from '../data/constants'
import { fmtDateTime, initials } from '../utils/format'

const typeIcon = {
  Call: Phone, Email: Mail, Meeting: Calendar, 'Video Call': Calendar,
  Text: MessageSquareText, Voicemail: Phone, Note: MessageSquareText,
}

export default function ContactLog({ nav }) {
  const { interactions, leads } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')

  const leadOf = (id) => leads.find((l) => l.id === id)

  const rows = useMemo(() => {
    return [...interactions]
      .filter((i) => {
        const lead = leadOf(i.leadId)
        const matchT = type === 'all' || i.type === type
        const matchQ =
          !q ||
          [i.notes, i.outcome, lead?.name].join(' ').toLowerCase().includes(q.toLowerCase())
        return matchT && matchQ
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [interactions, leads, q, type])

  // Group by day
  const groups = useMemo(() => {
    const m = new Map()
    rows.forEach((i) => {
      const key = new Date(i.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(i)
    })
    return [...m.entries()]
  }, [rows])

  return (
    <div className="page">
      <PageHeader title="Contact Log" subtitle={`${rows.length} interactions across all prospects`} />

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search notes, outcomes, names…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {INTERACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Filter} title="No interactions found" body="Adjust your search or log a new interaction from a lead." />
      ) : (
        <div className="log-feed">
          {groups.map(([day, items]) => (
            <div key={day} className="log-day">
              <div className="log-day-label">{day}</div>
              <div className="card no-pad">
                <ul className="log global">
                  {items.map((i) => {
                    const lead = leadOf(i.leadId)
                    const Icon = typeIcon[i.type] || MessageSquareText
                    return (
                      <li key={i.id} className="log-item clickable" onClick={() => lead && nav.openLead(lead.id)}>
                        <span className={`log-icon log-${i.direction === 'Inbound' ? 'in' : 'out'}`}><Icon size={15} /></span>
                        <div className="log-body">
                          <div className="log-head">
                            <span className="cn-title">{lead?.name || 'Unknown'}</span>
                            <span className="log-type">{i.type}</span>
                            <span className="log-outcome">{i.outcome}</span>
                            <span className="log-date">{fmtDateTime(i.date)}</span>
                          </div>
                          {i.notes && <p className="log-notes">{i.notes}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
