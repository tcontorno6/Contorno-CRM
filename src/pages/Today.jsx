import { useMemo, useState } from 'react'
import {
  Plus, Check, Clock, CalendarClock, CalendarDays, Inbox,
  Trash2, CornerUpRight, User,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader, EmptyState } from '../components/ui'
import { fmtDate, daysBetween } from '../utils/format'

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

export default function Today({ nav }) {
  const { tasks, leads, addTask, toggleTask, updateTask, deleteTask, updateLead } = useStore()
  const [title, setTitle] = useState('')
  const [leadId, setLeadId] = useState('')
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10))

  const leadName = (id) => leads.find((l) => l.id === id)?.name

  // Build a unified item list: stored tasks + lead follow-ups.
  const items = useMemo(() => {
    const taskItems = (tasks || []).map((t) => ({
      key: t.id, kind: 'task', id: t.id, title: t.title,
      leadId: t.leadId, due: t.due, done: t.done,
    }))
    const followItems = leads
      .filter((l) => l.nextFollowUp && l.status !== 'Lost')
      .map((l) => ({
        key: `fu-${l.id}`, kind: 'followup', id: l.id,
        title: `Follow up with ${l.name}`, leadId: l.id, due: l.nextFollowUp, done: false,
      }))
    return [...taskItems, ...followItems]
  }, [tasks, leads])

  const now = new Date()
  const today0 = startOfDay()
  const today1 = endOfDay()
  const weekEnd = endOfDay(new Date(now.getTime() + 7 * 864e5))

  const open = items.filter((i) => !i.done)
  const buckets = {
    overdue: open.filter((i) => i.due && new Date(i.due) < today0).sort(byDue),
    today: open.filter((i) => i.due && new Date(i.due) >= today0 && new Date(i.due) <= today1).sort(byDue),
    upcoming: open.filter((i) => i.due && new Date(i.due) > today1 && new Date(i.due) <= weekEnd).sort(byDue),
    later: open.filter((i) => !i.due || new Date(i.due) > weekEnd).sort(byDue),
  }
  const doneToday = items.filter(
    (i) => i.kind === 'task' && i.done
  )

  const completeItem = (item) => {
    if (item.kind === 'task') toggleTask(item.id)
    else updateLead(item.id, { nextFollowUp: '' }) // clear the follow-up
  }
  const snooze = (item, days) => {
    const base = item.due ? new Date(item.due) : new Date()
    base.setDate(base.getDate() + days)
    const iso = base.toISOString()
    if (item.kind === 'task') updateTask(item.id, { due: iso })
    else updateLead(item.id, { nextFollowUp: iso })
  }

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      leadId: leadId || null,
      due: due ? new Date(due).toISOString() : '',
    })
    setTitle(''); setLeadId('')
  }

  const total = buckets.overdue.length + buckets.today.length

  return (
    <div className="page">
      <PageHeader
        title="Today"
        subtitle={
          total === 0
            ? 'You\'re all caught up. Nice work.'
            : `${total} item${total > 1 ? 's' : ''} need attention today.`
        }
      />

      <form className="task-add" onSubmit={submit}>
        <div className="task-add-main">
          <Plus size={16} />
          <input
            placeholder="Add a task…  (e.g. Call Aisha to schedule discovery)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">No lead</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn primary" type="submit">Add</button>
      </form>

      {open.length === 0 ? (
        <EmptyState icon={Check} title="Nothing on your plate" body="Add a task above, or set follow-up dates on your leads to see them here." />
      ) : (
        <>
          <Bucket title="Overdue" icon={Clock} tone="danger" items={buckets.overdue} {...{ leadName, completeItem, snooze, deleteTask, nav, now }} />
          <Bucket title="Today" icon={CalendarClock} tone="primary" items={buckets.today} {...{ leadName, completeItem, snooze, deleteTask, nav, now }} />
          <Bucket title="Next 7 days" icon={CalendarDays} items={buckets.upcoming} {...{ leadName, completeItem, snooze, deleteTask, nav, now }} />
          <Bucket title="Later / no date" icon={Inbox} items={buckets.later} {...{ leadName, completeItem, snooze, deleteTask, nav, now }} />
        </>
      )}

      {doneToday.length > 0 && (
        <div className="done-strip">
          <span className="done-strip-label"><Check size={13} /> Completed</span>
          {doneToday.slice(0, 8).map((i) => (
            <button key={i.key} className="done-chip" onClick={() => toggleTask(i.id)} title="Mark not done">
              {i.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const byDue = (a, b) => {
  if (!a.due) return 1
  if (!b.due) return -1
  return new Date(a.due) - new Date(b.due)
}

function Bucket({ title, icon: Icon, tone, items, leadName, completeItem, snooze, deleteTask, nav }) {
  if (!items.length) return null
  return (
    <div className="task-bucket">
      <div className={`bucket-head bucket-${tone || 'default'}`}>
        <Icon size={15} />
        <span>{title}</span>
        <span className="bucket-count">{items.length}</span>
      </div>
      <div className="card no-pad">
        <ul className="task-list">
          {items.map((item) => {
            const overdueDays = item.due ? daysBetween(item.due) : null
            return (
              <li key={item.key} className="task-item">
                <button className="task-check" onClick={() => completeItem(item)} aria-label="Complete" />
                <div className="task-body" onClick={() => item.leadId && nav.openLead(item.leadId)}>
                  <span className="task-title">{item.title}</span>
                  <span className="task-meta">
                    {item.kind === 'followup' && <span className="task-tag"><CornerUpRight size={11} /> Follow-up</span>}
                    {item.leadId && item.kind === 'task' && (
                      <span className="task-tag"><User size={11} /> {leadName(item.leadId)}</span>
                    )}
                    {item.due && (
                      <span className={overdueDays > 0 ? 'task-due over' : 'task-due'}>
                        {fmtDate(item.due)}{overdueDays > 0 ? ` · ${overdueDays}d late` : ''}
                      </span>
                    )}
                  </span>
                </div>
                <div className="task-actions">
                  <button className="snooze-btn" onClick={() => snooze(item, 1)} title="Snooze 1 day">+1d</button>
                  <button className="snooze-btn" onClick={() => snooze(item, 7)} title="Snooze 1 week">+1w</button>
                  {item.kind === 'task' && (
                    <button className="icon-btn sm" onClick={() => deleteTask(item.id)} title="Delete"><Trash2 size={13} /></button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
