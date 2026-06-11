import {
  LayoutDashboard, KanbanSquare, Users, MessageSquareText,
  Lightbulb, Settings, TrendingUp, Grid3x3, CheckSquare,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'contacts', label: 'Contact Log', icon: MessageSquareText },
  { id: 'heatmap', label: 'Activity Heatmap', icon: Grid3x3 },
  { id: 'insights', label: 'Coaching & Insights', icon: Lightbulb },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ view, setView }) {
  const { settings } = useStore()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><TrendingUp size={20} /></div>
        <div className="brand-text">
          <span className="brand-name">Contorno</span>
          <span className="brand-sub">CRM</span>
        </div>
      </div>

      <nav className="nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => setView(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="advisor-card">
          <div className="advisor-avatar">
            {(settings.advisorName || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="advisor-meta">
            <span className="advisor-name">{settings.advisorName}</span>
            <span className="advisor-firm">{settings.firmName}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
