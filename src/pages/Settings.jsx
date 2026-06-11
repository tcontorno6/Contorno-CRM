import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Trash2, Save, Database } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { PageHeader } from '../components/ui'
import Modal from '../components/Modal'

export default function SettingsPage() {
  const { leads, interactions, settings, updateSettings, importData, reset, clearAll } = useStore()
  const fileRef = useRef(null)
  const [profile, setProfile] = useState({
    advisorName: settings.advisorName,
    firmName: settings.firmName,
    monthlyGoal: settings.monthlyGoal,
    feePct: ((settings.feeRate ?? 0.01) * 100).toString(),
    avgClientYears: settings.avgClientYears ?? 10,
  })
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'clear'
  const [msg, setMsg] = useState('')

  const saveProfile = () => {
    updateSettings({
      advisorName: profile.advisorName,
      firmName: profile.firmName,
      monthlyGoal: Number(profile.monthlyGoal) || 0,
      feeRate: (Number(profile.feePct) || 0) / 100,
      avgClientYears: Number(profile.avgClientYears) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ leads, interactions, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `advisor-crm-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.leads) throw new Error('No leads in file')
        importData(data)
        setMsg(`Imported ${data.leads.length} leads.`)
      } catch (err) {
        setMsg('Could not read that file — make sure it is a backup exported from this app.')
      }
      setTimeout(() => setMsg(''), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Your profile, goals, and data." />

      <div className="card settings-card">
        <h3 className="side-title">Advisor profile</h3>
        <div className="form-grid">
          <label className="field">
            <span>Your name</span>
            <input value={profile.advisorName} onChange={(e) => setProfile({ ...profile, advisorName: e.target.value })} />
          </label>
          <label className="field">
            <span>Firm name</span>
            <input value={profile.firmName} onChange={(e) => setProfile({ ...profile, firmName: e.target.value })} />
          </label>
          <label className="field">
            <span>Monthly new-client goal</span>
            <input type="number" min="0" value={profile.monthlyGoal} onChange={(e) => setProfile({ ...profile, monthlyGoal: e.target.value })} />
          </label>
          <label className="field">
            <span>Advisory fee (%)</span>
            <input type="number" min="0" step="0.05" value={profile.feePct} onChange={(e) => setProfile({ ...profile, feePct: e.target.value })} />
          </label>
          <label className="field">
            <span>Avg. client lifespan (years)</span>
            <input type="number" min="1" value={profile.avgClientYears} onChange={(e) => setProfile({ ...profile, avgClientYears: e.target.value })} />
          </label>
        </div>
        <p className="muted field-note">Used to estimate each prospect's annual fee and lifetime value across the app.</p>
        <div className="settings-actions">
          <button className="btn primary" onClick={saveProfile}>
            <Save size={15} /> {saved ? 'Saved!' : 'Save profile'}
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <h3 className="side-title"><Database size={15} /> Data</h3>
        <p className="muted">
          Your data lives only in this browser (localStorage). Export regularly to keep a backup,
          or to move it to another machine.
        </p>
        {msg && <div className="inline-note">{msg}</div>}
        <div className="settings-actions wrap">
          <button className="btn ghost" onClick={exportData}><Download size={15} /> Export backup (JSON)</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
          <button className="btn ghost" onClick={() => setConfirm('reset')}><RotateCcw size={15} /> Reset to demo data</button>
          <button className="btn danger-ghost" onClick={() => setConfirm('clear')}><Trash2 size={15} /> Clear everything</button>
        </div>
      </div>

      <div className="settings-stats">
        <span><strong>{leads.length}</strong> leads</span>
        <span><strong>{interactions.length}</strong> interactions logged</span>
      </div>

      {confirm && (
        <Modal
          open
          onClose={() => setConfirm(null)}
          title={confirm === 'reset' ? 'Reset to demo data?' : 'Clear everything?'}
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className="btn danger"
                onClick={() => {
                  confirm === 'reset' ? reset() : clearAll()
                  setConfirm(null)
                }}
              >
                {confirm === 'reset' ? 'Reset' : 'Clear all data'}
              </button>
            </>
          }
        >
          <p>
            {confirm === 'reset'
              ? 'This replaces your current data with the original sample leads. Export a backup first if you want to keep your work.'
              : 'This permanently deletes all leads and interactions, leaving you with a blank slate. This cannot be undone.'}
          </p>
        </Modal>
      )}
    </div>
  )
}
