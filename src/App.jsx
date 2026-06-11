import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import Pipeline from './pages/Pipeline'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import ContactLog from './pages/ContactLog'
import Heatmap from './pages/Heatmap'
import Insights from './pages/Insights'
import SettingsPage from './pages/Settings'
import LeadForm from './components/LeadForm'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [showNewLead, setShowNewLead] = useState(false)

  const openLead = (id) => setSelectedLeadId(id)
  const closeLead = () => setSelectedLeadId(null)

  const go = (v) => {
    setSelectedLeadId(null)
    setView(v)
  }

  const nav = { openLead, go, newLead: () => setShowNewLead(true) }

  let page
  if (selectedLeadId) {
    page = <LeadDetail leadId={selectedLeadId} onBack={closeLead} nav={nav} />
  } else if (view === 'dashboard') {
    page = <Dashboard nav={nav} />
  } else if (view === 'today') {
    page = <Today nav={nav} />
  } else if (view === 'pipeline') {
    page = <Pipeline nav={nav} />
  } else if (view === 'leads') {
    page = <Leads nav={nav} />
  } else if (view === 'contacts') {
    page = <ContactLog nav={nav} />
  } else if (view === 'heatmap') {
    page = <Heatmap />
  } else if (view === 'insights') {
    page = <Insights nav={nav} />
  } else if (view === 'settings') {
    page = <SettingsPage />
  }

  return (
    <div className="app">
      <Sidebar view={selectedLeadId ? null : view} setView={go} />
      <main className="main">{page}</main>
      {showNewLead && (
        <LeadForm
          onClose={() => setShowNewLead(false)}
          onSaved={(id) => {
            setShowNewLead(false)
            openLead(id)
          }}
        />
      )}
    </div>
  )
}
