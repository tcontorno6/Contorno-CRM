import { useState } from 'react'
import {
  ArrowLeft, Pencil, Trash2, Plus, Phone, Mail, Building2,
  UserPlus, Calendar, Tag as TagIcon, MessageSquareText, Save, FileText,
} from 'lucide-react'
import { useStore, useLeadInteractions } from '../context/StoreContext'
import { StageBadge, PriorityBadge, Tag } from '../components/Badge'
import { Avatar } from '../components/ui'
import LeadForm from '../components/LeadForm'
import InteractionForm from '../components/InteractionForm'
import NoteFeedback from '../components/NoteFeedback'
import OnboardingChecklist from '../components/OnboardingChecklist'
import MeetingPrep from '../components/MeetingPrep'
import Modal from '../components/Modal'
import { PIPELINE_STAGES, INTERACTION_TYPES } from '../data/constants'
import { annualFee, lifetimeValue } from '../utils/revenue'
import { currency, currencyFull, fmtDate, fmtDateTime } from '../utils/format'

const typeIcon = {
  Call: Phone, Email: Mail, Meeting: Calendar, 'Video Call': Calendar,
  Text: MessageSquareText, Voicemail: Phone, Note: MessageSquareText,
}

export default function LeadDetail({ leadId, onBack }) {
  const { leads, settings, updateLead, deleteLead, deleteInteraction } = useStore()
  const lead = leads.find((l) => l.id === leadId)
  const interactions = useLeadInteractions(leadId)
  const [editing, setEditing] = useState(false)
  const [logging, setLogging] = useState(false)
  const [editIx, setEditIx] = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showPrep, setShowPrep] = useState(false)
  const [noteDraft, setNoteDraft] = useState(lead?.notes || '')
  const [noteDirty, setNoteDirty] = useState(false)

  if (!lead) {
    return (
      <div className="page">
        <button className="btn ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <p className="muted pad">This lead no longer exists.</p>
      </div>
    )
  }

  const saveNote = () => {
    updateLead(lead.id, { notes: noteDraft })
    setNoteDirty(false)
  }

  return (
    <div className="page">
      <div className="detail-top">
        <button className="btn ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="detail-actions">
          <button className="btn primary" onClick={() => setShowPrep(true)}><FileText size={15} /> Meeting prep</button>
          <button className="btn ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>
          <button className="btn danger-ghost" onClick={() => setConfirmDel(true)}><Trash2 size={15} /> Delete</button>
        </div>
      </div>

      <div className="detail-hero card">
        <div className="hero-left">
          <Avatar name={lead.name} />
          <div>
            <h1>{lead.name}</h1>
            <p className="hero-company">{lead.company || '—'}</p>
            <div className="hero-badges">
              <StageBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              {lead.status === 'Lost' && lead.lostReason && <Tag>Lost: {lead.lostReason}</Tag>}
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-value">{currencyFull(lead.estimatedValue)}</div>
          <span className="muted">estimated AUM</span>
          <div className="hero-rev">
            <span><strong>{currency(annualFee(lead.estimatedValue, settings))}</strong>/yr fee</span>
            <span className="hero-ltv">{currency(lifetimeValue(lead.estimatedValue, settings))} lifetime value</span>
          </div>
        </div>
      </div>

      <div className="stage-stepper">
        {PIPELINE_STAGES.filter((s) => s.id !== 'Lost').map((s) => {
          const order = PIPELINE_STAGES.findIndex((x) => x.id === lead.status)
          const idx = PIPELINE_STAGES.findIndex((x) => x.id === s.id)
          const done = lead.status !== 'Lost' && idx <= order
          return (
            <button
              key={s.id}
              className={`step ${lead.status === s.id ? 'current' : ''} ${done ? 'done' : ''}`}
              onClick={() => updateLead(lead.id, { status: s.id })}
              style={done ? { '--c': s.color } : undefined}
            >
              {s.label}
            </button>
          )
        })}
        <button
          className={`step step-lost ${lead.status === 'Lost' ? 'current' : ''}`}
          onClick={() => updateLead(lead.id, { status: 'Lost' })}
        >
          Lost
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          {lead.status === 'Won' && <OnboardingChecklist lead={lead} />}
          <div className="card">
            <div className="card-head">
              <h3><MessageSquareText size={16} /> Contact log</h3>
              <button className="btn primary sm" onClick={() => setLogging(true)}>
                <Plus size={15} /> Log interaction
              </button>
            </div>
            {interactions.length === 0 ? (
              <p className="muted pad">No interactions logged yet. Record your first touch.</p>
            ) : (
              <ul className="log">
                {interactions.map((i) => {
                  const Icon = typeIcon[i.type] || MessageSquareText
                  return (
                    <li key={i.id} className="log-item">
                      <span className={`log-icon log-${i.direction === 'Inbound' ? 'in' : 'out'}`}>
                        <Icon size={15} />
                      </span>
                      <div className="log-body">
                        <div className="log-head">
                          <span className="log-type">{i.type}</span>
                          <span className="log-outcome">{i.outcome}</span>
                          <span className="log-dir">{i.direction}</span>
                          <span className="log-date">{fmtDateTime(i.date)}</span>
                          <div className="log-tools">
                            <button className="icon-btn sm" onClick={() => setEditIx(i)} title="Edit"><Pencil size={13} /></button>
                            <button className="icon-btn sm" onClick={() => deleteInteraction(i.id)} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        {i.notes && <p className="log-notes">{i.notes}</p>}
                        {i.notes && <NoteFeedback text={i.notes} lead={lead} />}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Working notes</h3>
              {noteDirty && <button className="btn primary sm" onClick={saveNote}><Save size={14} /> Save</button>}
            </div>
            <textarea
              className="note-area"
              rows={5}
              value={noteDraft}
              onChange={(e) => { setNoteDraft(e.target.value); setNoteDirty(true) }}
              placeholder="Background, goals, situation, things to remember…"
            />
            <NoteFeedback text={noteDraft} lead={lead} />
          </div>
        </div>

        <aside className="detail-side">
          <div className="card">
            <h3 className="side-title">Details</h3>
            <dl className="info">
              <div><dt><Mail size={14} /> Email</dt><dd>{lead.email || '—'}</dd></div>
              <div><dt><Phone size={14} /> Phone</dt><dd>{lead.phone || '—'}</dd></div>
              <div><dt><Building2 size={14} /> Occupation</dt><dd>{lead.company || '—'}</dd></div>
              <div><dt><UserPlus size={14} /> Source</dt><dd>{lead.source}</dd></div>
              {lead.referredBy && <div><dt><UserPlus size={14} /> Referred by</dt><dd>{lead.referredBy}</dd></div>}
              <div><dt><Calendar size={14} /> Next follow-up</dt><dd>{lead.nextFollowUp ? fmtDate(lead.nextFollowUp) : '—'}</dd></div>
              <div><dt><Calendar size={14} /> Added</dt><dd>{fmtDate(lead.createdAt)}</dd></div>
            </dl>
            {lead.tags?.length > 0 && (
              <div className="side-tags">
                <span className="side-label"><TagIcon size={13} /> Tags</span>
                <div className="tag-row">{lead.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              </div>
            )}
          </div>

          <div className="card quick-log">
            <h3 className="side-title">Quick log</h3>
            <div className="quick-row">
              {INTERACTION_TYPES.slice(0, 4).map((t) => (
                <button key={t} className="chip-btn" onClick={() => setLogging(t)}>{t}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showPrep && <MeetingPrep lead={lead} onClose={() => setShowPrep(false)} />}
      {editing && <LeadForm lead={lead} onClose={() => setEditing(false)} />}
      {logging && (
        <InteractionForm
          lead={lead}
          prefill={typeof logging === 'string' ? { type: logging } : undefined}
          onClose={() => setLogging(false)}
        />
      )}
      {editIx && <InteractionForm lead={lead} interaction={editIx} onClose={() => setEditIx(null)} />}
      {confirmDel && (
        <Modal
          open
          onClose={() => setConfirmDel(false)}
          title="Delete lead?"
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="btn danger" onClick={() => { deleteLead(lead.id); onBack() }}>Delete</button>
            </>
          }
        >
          <p>This permanently removes <strong>{lead.name}</strong> and all logged interactions. This can't be undone.</p>
        </Modal>
      )}
    </div>
  )
}
