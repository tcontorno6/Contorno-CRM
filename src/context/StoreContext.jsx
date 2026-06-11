import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadState, saveState, resetState, emptyState } from '../utils/storage'
import { uid } from '../utils/format'

const StoreContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_LEAD': {
      const now = new Date().toISOString()
      const lead = {
        id: uid('l'),
        name: '', email: '', phone: '', company: '',
        source: 'Referral', referredBy: '', status: 'New',
        priority: 'Warm', estimatedValue: 0, tags: [],
        nextFollowUp: '', notes: '', lostReason: '',
        ...action.lead,
        createdAt: now, updatedAt: now,
      }
      return { ...state, leads: [lead, ...state.leads] }
    }
    case 'UPDATE_LEAD': {
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.id ? { ...l, ...action.patch, updatedAt: new Date().toISOString() } : l
        ),
      }
    }
    case 'DELETE_LEAD': {
      return {
        ...state,
        leads: state.leads.filter((l) => l.id !== action.id),
        interactions: state.interactions.filter((i) => i.leadId !== action.id),
      }
    }
    case 'ADD_INTERACTION': {
      const now = new Date().toISOString()
      const interaction = {
        id: uid('i'),
        leadId: action.interaction.leadId,
        type: 'Call', direction: 'Outbound', outcome: 'No Outcome',
        date: now, notes: '',
        ...action.interaction,
        createdAt: now,
      }
      // Touch the lead's updatedAt
      const leads = state.leads.map((l) =>
        l.id === interaction.leadId ? { ...l, updatedAt: now } : l
      )
      return { ...state, leads, interactions: [interaction, ...state.interactions] }
    }
    case 'UPDATE_INTERACTION': {
      return {
        ...state,
        interactions: state.interactions.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i
        ),
      }
    }
    case 'DELETE_INTERACTION': {
      return {
        ...state,
        interactions: state.interactions.filter((i) => i.id !== action.id),
      }
    }
    case 'ADD_TASK': {
      const task = {
        id: uid('t'),
        title: '', leadId: null, due: '', done: false,
        createdAt: new Date().toISOString(), doneAt: '',
        ...action.task,
      }
      return { ...state, tasks: [task, ...(state.tasks || [])] }
    }
    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: (state.tasks || []).map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      }
    }
    case 'TOGGLE_TASK': {
      return {
        ...state,
        tasks: (state.tasks || []).map((t) =>
          t.id === action.id
            ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : '' }
            : t
        ),
      }
    }
    case 'DELETE_TASK': {
      return { ...state, tasks: (state.tasks || []).filter((t) => t.id !== action.id) }
    }
    case 'UPDATE_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.patch } }
    }
    case 'IMPORT': {
      return {
        leads: action.data.leads || [],
        interactions: action.data.interactions || [],
        tasks: action.data.tasks || [],
        settings: { ...state.settings, ...(action.data.settings || {}) },
      }
    }
    case 'RESET':
      return resetState()
    case 'CLEAR':
      return emptyState()
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const actions = useMemo(
    () => ({
      addLead: (lead) => dispatch({ type: 'ADD_LEAD', lead }),
      updateLead: (id, patch) => dispatch({ type: 'UPDATE_LEAD', id, patch }),
      deleteLead: (id) => dispatch({ type: 'DELETE_LEAD', id }),
      addInteraction: (interaction) => dispatch({ type: 'ADD_INTERACTION', interaction }),
      updateInteraction: (id, patch) => dispatch({ type: 'UPDATE_INTERACTION', id, patch }),
      deleteInteraction: (id) => dispatch({ type: 'DELETE_INTERACTION', id }),
      addTask: (task) => dispatch({ type: 'ADD_TASK', task }),
      updateTask: (id, patch) => dispatch({ type: 'UPDATE_TASK', id, patch }),
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', id }),
      deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      importData: (data) => dispatch({ type: 'IMPORT', data }),
      reset: () => dispatch({ type: 'RESET' }),
      clearAll: () => dispatch({ type: 'CLEAR' }),
    }),
    []
  )

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// Helper: interactions for a given lead, newest first.
export const useLeadInteractions = (leadId) => {
  const { interactions } = useStore()
  return useMemo(
    () =>
      interactions
        .filter((i) => i.leadId === leadId)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [interactions, leadId]
  )
}
