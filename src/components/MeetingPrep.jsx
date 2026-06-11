import { useMemo } from 'react'
import { Printer, AlertCircle, MessageCircle, ListChecks, Clock, X } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { generateMeetingBrief } from '../utils/meetingPrep'
import { fmtDate } from '../utils/format'

export default function MeetingPrep({ lead, onClose }) {
  const { interactions, settings } = useStore()
  const brief = useMemo(
    () => generateMeetingBrief(lead, interactions, settings),
    [lead, interactions, settings]
  )

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal modal-wide prep" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header prep-header">
          <div>
            <h3>Meeting prep — {brief.name}</h3>
            <span className="prep-sub">{brief.company || 'Prospect'} · generated {fmtDate(brief.generatedAt)}</span>
          </div>
          <div className="prep-tools">
            <button className="btn ghost sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="modal-body prep-body" id="prep-printable">
          <section className="prep-snapshot">
            {brief.snapshot.map((s) => (
              <div key={s.label} className="prep-stat">
                <span className="prep-stat-label">{s.label}</span>
                <span className="prep-stat-value">{s.value}</span>
              </div>
            ))}
          </section>

          {brief.tags.length > 0 && (
            <div className="prep-tags">{brief.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
          )}

          {brief.lastTouch && (
            <section className="prep-section">
              <h4><Clock size={14} /> Last conversation</h4>
              <p className="prep-lasttouch">{brief.lastTouch.line}</p>
              {brief.lastTouch.notes && <p className="prep-quote">"{brief.lastTouch.notes}"</p>}
            </section>
          )}

          {brief.concerns.length > 0 && (
            <section className="prep-section">
              <h4><AlertCircle size={14} /> Open concerns to address</h4>
              <ul className="prep-list concerns">{brief.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </section>
          )}

          <section className="prep-section">
            <h4><MessageCircle size={14} /> Suggested talking points</h4>
            {brief.talkingPoints.length > 0 ? (
              <ul className="prep-list">{brief.talkingPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
            ) : (
              <p className="muted">Log a few notes on this lead and prep will suggest tailored talking points.</p>
            )}
          </section>

          <section className="prep-section">
            <h4><ListChecks size={14} /> Recommended next steps</h4>
            <ul className="prep-list">{brief.nextSteps.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </section>

          {brief.history.length > 0 && (
            <section className="prep-section">
              <h4><Clock size={14} /> Interaction history</h4>
              <ul className="prep-history">
                {brief.history.map((h) => (
                  <li key={h.id}>
                    <span className="ph-meta">{h.type} · {h.outcome} · {fmtDate(h.date)}</span>
                    {h.notes && <span className="ph-notes">{h.notes}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
