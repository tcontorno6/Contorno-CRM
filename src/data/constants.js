// Shared constants used across the app.

export const PIPELINE_STAGES = [
  { id: 'New', label: 'New', color: '#64748b' },
  { id: 'Contacted', label: 'Contacted', color: '#0ea5e9' },
  { id: 'Qualified', label: 'Qualified', color: '#6366f1' },
  { id: 'Meeting Scheduled', label: 'Meeting', color: '#8b5cf6' },
  { id: 'Proposal Sent', label: 'Proposal', color: '#f59e0b' },
  { id: 'Won', label: 'Client', color: '#16a34a' },
  { id: 'Lost', label: 'Lost', color: '#ef4444' },
]

// Stages that count as "open" (still being worked).
export const OPEN_STAGES = ['New', 'Contacted', 'Qualified', 'Meeting Scheduled', 'Proposal Sent']

// Probability a lead at each stage becomes a client — used for the weighted forecast.
export const STAGE_PROBABILITY = {
  New: 0.1,
  Contacted: 0.2,
  Qualified: 0.35,
  'Meeting Scheduled': 0.55,
  'Proposal Sent': 0.75,
  Won: 1,
  Lost: 0,
}

// Default onboarding checklist applied when a prospect becomes a Client.
export const ONBOARDING_CHECKLIST = [
  { id: 'ima', label: 'Investment Management Agreement (IMA) signed' },
  { id: 'crs', label: 'Form CRS delivered' },
  { id: 'acat', label: 'ACAT account transfer initiated' },
  { id: 'open', label: 'Accounts opened & funded' },
  { id: 'ips', label: 'Risk profile / IPS completed' },
  { id: 'welcome', label: 'Welcome packet & intro to service team' },
]

export const LEAD_SOURCES = [
  'Referral',
  'COI / Professional Partner',
  'Existing Client',
  'LinkedIn',
  'Website',
  'Seminar / Event',
  'Cold Call',
  'Social Media',
  'Advertisement',
  'Networking',
  'Walk-in',
  'Other',
]

export const PRIORITIES = [
  { id: 'Hot', label: 'Hot', color: '#ef4444' },
  { id: 'Warm', label: 'Warm', color: '#f59e0b' },
  { id: 'Cold', label: 'Cold', color: '#0ea5e9' },
]

export const INTERACTION_TYPES = [
  'Call',
  'Email',
  'Meeting',
  'Video Call',
  'Text',
  'Voicemail',
  'Note',
]

export const INTERACTION_OUTCOMES = [
  'Connected',
  'No Answer',
  'Left Voicemail',
  'Scheduled Follow-up',
  'Sent Information',
  'Positive',
  'Needs Time',
  'Not Interested',
  'No Outcome',
]

export const LOST_REASONS = [
  'Went with competitor',
  'No budget / assets',
  'Bad timing',
  'Unresponsive',
  'Not a fit',
  'Chose to self-manage',
  'Other',
]

export const stageMeta = (id) =>
  PIPELINE_STAGES.find((s) => s.id === id) || { id, label: id, color: '#94a3b8' }

export const priorityMeta = (id) =>
  PRIORITIES.find((p) => p.id === id) || { id, label: id, color: '#94a3b8' }
