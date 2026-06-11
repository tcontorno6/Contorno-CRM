import { useState } from 'react'
import Modal from './Modal'
import NoteFeedback from './NoteFeedback'
import { useStore } from '../context/StoreContext'
import { INTERACTION_TYPES, INTERACTION_OUTCOMES } from '../data/constants'

export default function InteractionForm({ lead, interaction, prefill, onClose }) {
  const { addInteraction, updateInteraction } = useStore()
  const editing = Boolean(interaction)

  const [form, setForm] = useState({
    type: interaction?.type || prefill?.type || 'Call',
    direction: interaction?.direction || 'Outbound',
    outcome: interaction?.outcome || 'Connected',
    date: (interaction?.date || new Date().toISOString()).slice(0, 16),
    notes: interaction?.notes || '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      date: new Date(form.date).toISOString(),
    }
    if (editing) updateInteraction(interaction.id, payload)
    else addInteraction({ ...payload, leadId: lead.id })
    onClose?.()
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={editing ? 'Edit interaction' : `Log interaction · ${lead.name}`}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>
            {editing ? 'Save' : 'Log it'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="form-grid">
        <label className="field">
          <span>Type</span>
          <select value={form.type} onChange={set('type')}>
            {INTERACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Direction</span>
          <select value={form.direction} onChange={set('direction')}>
            <option>Outbound</option>
            <option>Inbound</option>
          </select>
        </label>
        <label className="field">
          <span>Outcome</span>
          <select value={form.outcome} onChange={set('outcome')}>
            {INTERACTION_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Date & time</span>
          <input type="datetime-local" value={form.date} onChange={set('date')} />
        </label>

        <label className="field span2">
          <span>Notes — how did it go?</span>
          <textarea
            value={form.notes} onChange={set('notes')} rows={5}
            placeholder="What did you discuss? How did they respond? What's the next step?"
          />
        </label>

        <div className="span2">
          <NoteFeedback text={form.notes} lead={lead} />
        </div>
      </form>
    </Modal>
  )
}
