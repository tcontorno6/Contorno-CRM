import { Check, ClipboardCheck } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { ONBOARDING_CHECKLIST } from '../data/constants'

// Shown on a lead's detail page once they become a Client.
export default function OnboardingChecklist({ lead }) {
  const { updateLead } = useStore()
  const state = lead.checklist || {}

  const toggle = (id) =>
    updateLead(lead.id, { checklist: { ...state, [id]: !state[id] } })

  const done = ONBOARDING_CHECKLIST.filter((i) => state[i.id]).length
  const total = ONBOARDING_CHECKLIST.length
  const pct = Math.round((done / total) * 100)
  const complete = done === total

  return (
    <div className="card onboarding">
      <div className="card-head">
        <h3><ClipboardCheck size={16} /> Client onboarding</h3>
        <span className={`onb-progress ${complete ? 'done' : ''}`}>
          {complete ? 'Complete 🎉' : `${done}/${total}`}
        </span>
      </div>

      <div className="onb-bar"><div className="onb-fill" style={{ width: `${pct}%` }} /></div>

      <ul className="onb-list">
        {ONBOARDING_CHECKLIST.map((item) => {
          const checked = !!state[item.id]
          return (
            <li key={item.id} className={`onb-item ${checked ? 'checked' : ''}`} onClick={() => toggle(item.id)}>
              <span className="onb-box">{checked && <Check size={13} />}</span>
              <span className="onb-label">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
