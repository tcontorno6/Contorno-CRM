import { useState } from 'react'
import { Plus, GripVertical } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader } from '../components/ui'
import { PriorityBadge } from '../components/Badge'
import { PIPELINE_STAGES } from '../data/constants'
import { currency, fmtDate, initials } from '../utils/format'

export default function Pipeline({ nav }) {
  const { leads, updateLead } = useStore()
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const onDrop = (stageId) => {
    if (dragId) {
      const lead = leads.find((l) => l.id === dragId)
      if (lead && lead.status !== stageId) updateLead(dragId, { status: stageId })
    }
    setDragId(null)
    setOverStage(null)
  }

  return (
    <div className="page">
      <PageHeader
        title="Pipeline"
        subtitle="Drag a card to move a prospect through your sales stages."
        actions={
          <button className="btn primary" onClick={nav.newLead}>
            <Plus size={16} /> New lead
          </button>
        }
      />

      <div className="board">
        {PIPELINE_STAGES.map((stage) => {
          const cards = leads.filter((l) => l.status === stage.id)
          const value = cards.reduce((s, l) => s + Number(l.estimatedValue || 0), 0)
          return (
            <div
              key={stage.id}
              className={`column ${overStage === stage.id ? 'drop' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id) }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={() => onDrop(stage.id)}
            >
              <div className="column-head">
                <span className="column-dot" style={{ background: stage.color }} />
                <span className="column-title">{stage.label}</span>
                <span className="column-count">{cards.length}</span>
              </div>
              <div className="column-value">{currency(value)}</div>

              <div className="column-body">
                {cards.map((l) => (
                  <article
                    key={l.id}
                    className={`kard ${dragId === l.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null) }}
                    onClick={() => nav.openLead(l.id)}
                  >
                    <div className="kard-top">
                      <span className="kard-avatar">{initials(l.name)}</span>
                      <div className="kard-id">
                        <span className="kard-name">{l.name}</span>
                        <span className="kard-company">{l.company || l.source}</span>
                      </div>
                      <GripVertical size={15} className="kard-grip" />
                    </div>
                    <div className="kard-meta">
                      <span className="kard-value">{currency(l.estimatedValue)}</span>
                      <PriorityBadge priority={l.priority} />
                    </div>
                    {l.nextFollowUp && (
                      <div className="kard-foot">Follow-up {fmtDate(l.nextFollowUp)}</div>
                    )}
                  </article>
                ))}
                {cards.length === 0 && <div className="column-empty">Drop here</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
