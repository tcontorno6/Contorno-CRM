import { useState } from 'react'
import Modal from './Modal'
import { useStore } from '../context/StoreContext'
import { allSources } from '../utils/stats'
import {
  PIPELINE_STAGES, PRIORITIES, LOST_REASONS,
} from '../data/constants'

const toInputDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function LeadForm({ lead, onClose, onSaved }) {
  const { addLead, updateLead, leads } = useStore()
  const editing = Boolean(lead)

  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    source: lead?.source || 'Referral',
    referredBy: lead?.referredBy || '',
    status: lead?.status || 'New',
    priority: lead?.priority || 'Warm',
    estimatedValue: lead?.estimatedValue || '',
    tags: (lead?.tags || []).join(', '),
    nextFollowUp: toInputDate(lead?.nextFollowUp),
    notes: lead?.notes || '',
    lostReason: lead?.lostReason || '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      ...form,
      estimatedValue: Number(form.estimatedValue) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      nextFollowUp: form.nextFollowUp ? new Date(form.nextFollowUp).toISOString() : '',
    }
    if (editing) {
      updateLead(lead.id, payload)
      onSaved?.(lead.id)
    } else {
      // addLead via reducer creates id internally; we mirror it here.
      const tmpId = `l${Date.now()}`
      addLead({ ...payload, id: tmpId })
      onSaved?.(tmpId)
    }
    onClose?.()
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={editing ? 'Edit lead' : 'New lead'}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add lead'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="form-grid">
        <label className="field span2">
          <span>Full name *</span>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Jane Doe" autoFocus />
        </label>

        <label className="field">
          <span>Email</span>
          <input value={form.email} onChange={set('email')} placeholder="jane@email.com" />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={form.phone} onChange={set('phone')} placeholder="(555) 555-5555" />
        </label>

        <label className="field span2">
          <span>Occupation / company</span>
          <input value={form.company} onChange={set('company')} placeholder="e.g. Retired engineer" />
        </label>

        <label className="field">
          <span>Lead source</span>
          <input
            list="lead-source-options"
            value={form.source}
            onChange={set('source')}
            placeholder="Pick one or type your own…"
          />
          <datalist id="lead-source-options">
            {allSources(leads).map((s) => <option key={s} value={s} />)}
          </datalist>
        </label>
        <label className="field">
          <span>Referred by</span>
          <input value={form.referredBy} onChange={set('referredBy')} placeholder="Name (if referral)" />
        </label>

        <label className="field">
          <span>Stage</span>
          <select value={form.status} onChange={set('status')}>
            {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Priority</span>
          <select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Est. value (AUM / revenue)</span>
          <input
            type="number" value={form.estimatedValue} onChange={set('estimatedValue')}
            placeholder="500000" min="0"
          />
        </label>
        <label className="field">
          <span>Next follow-up</span>
          <input type="date" value={form.nextFollowUp} onChange={set('nextFollowUp')} />
        </label>

        <label className="field span2">
          <span>Tags (comma-separated)</span>
          <input value={form.tags} onChange={set('tags')} placeholder="Retirement, Rollover" />
        </label>

        {form.status === 'Lost' && (
          <label className="field span2">
            <span>Lost reason</span>
            <select value={form.lostReason} onChange={set('lostReason')}>
              <option value="">Select…</option>
              {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        )}

        <label className="field span2">
          <span>Notes</span>
          <textarea
            value={form.notes} onChange={set('notes')} rows={4}
            placeholder="Background, goals, situation…"
          />
        </label>
      </form>
    </Modal>
  )
}
