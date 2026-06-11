// localStorage-backed persistence with a versioned key.

import { seedLeads, seedInteractions, seedTasks } from '../data/seed'

const KEY = 'advisor-crm-v1'

const defaultSettings = () => ({
  advisorName: 'Your Name',
  firmName: 'Contorno Wealth',
  monthlyGoal: 8, // new clients per month target
  feeRate: 0.01, // advisory fee (1%)
  avgClientYears: 10, // average client lifespan, for lifetime value
  seeded: true,
})

const defaultState = () => ({
  leads: seedLeads,
  interactions: seedInteractions,
  tasks: seedTasks,
  settings: defaultSettings(),
})

// One-time clean-ups for data saved by earlier versions.
const migrate = (state) => {
  if (state.settings?.firmName === 'Meridian Wealth') {
    state.settings.firmName = 'Contorno Wealth'
  }
  if (!Array.isArray(state.tasks)) state.tasks = []
  return state
}

export const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return migrate({
      leads: parsed.leads || [],
      interactions: parsed.interactions || [],
      tasks: parsed.tasks || [],
      settings: { ...defaultSettings(), ...(parsed.settings || {}) },
    })
  } catch (e) {
    console.error('Failed to load state, using defaults', e)
    return defaultState()
  }
}

export const saveState = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state', e)
  }
}

export const resetState = () => {
  localStorage.removeItem(KEY)
  return defaultState()
}

export const emptyState = () => ({
  leads: [],
  interactions: [],
  tasks: [],
  settings: { ...defaultSettings(), seeded: false },
})
