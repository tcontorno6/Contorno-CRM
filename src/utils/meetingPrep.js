// Generates a one-page meeting prep brief from a lead's history.
// Synchronous + rule-based so it works offline; getMeetingBrief() is an async
// wrapper you can repoint at the Claude API later (same shape out).

import { analyzeNote } from './coaching'
import { annualFee, lifetimeValue } from './revenue'
import { currency, currencyFull, fmtDate } from './format'

const TAG_POINTS = {
  Retirement: 'Walk through a retirement income projection — when can they realistically retire and on how much?',
  Rollover: 'Map out the 401(k)/IRA rollover: tax treatment, timing, and consolidation benefits.',
  'Tax Planning': 'Bring a concrete tax idea (Roth conversions, gain harvesting, entity structure) to demonstrate value early.',
  'Business Owner': 'Cover business-owner planning: retirement plan design (SEP/Solo-401k), succession, and entity tax strategy.',
  'Equity Comp': 'Address concentrated stock and a sell-down schedule for their RSUs/options.',
  Estate: 'Discuss beneficiary alignment, titling, and coordinating with their estate attorney.',
  Inheritance: 'Handle the inheritance with care — prioritize their comfort and a simple, clear plan.',
  'High Income': 'Lead with tax efficiency and cash-flow planning for high earners.',
  'Student Loans': 'Bring a student-loan repayment vs. invest analysis.',
  Pension: 'Run the pension election (lump sum vs. annuity) and how it fits their income plan.',
}

const NEXT_BY_STAGE = {
  New: 'Book a discovery meeting and send a short agenda beforehand.',
  Contacted: 'Complete a thorough discovery / fact-find — goals, assets, concerns, timeline.',
  Qualified: 'Schedule the planning presentation and gather any missing statements.',
  'Meeting Scheduled': 'Prepare and deliver the plan; aim to leave with a clear decision or next date.',
  'Proposal Sent': 'Follow up on the proposal, resolve open objections, and ask for the business.',
  Won: 'Kick off onboarding — IMA, Form CRS, and ACAT transfer.',
  Lost: 'Keep on a long-term nurture; revisit when a life event hits.',
}

function detectConcerns(text) {
  const t = text.toLowerCase()
  const out = []
  const add = (re, label) => { if (re.test(t)) out.push(label) }
  add(/in[\s-]?house (cpa|tax|accountant)|one[\s-]?stop|full[\s-]?service/, 'Wants integrated tax/services under one roof')
  add(/shopping|other firm|another (advisor|firm)|comparing|second opinion|new firm|evaluating/, 'Comparing you against other firms')
  add(/current advisor|already (have|has)|existing advisor|happy with/, 'Has an existing advisor')
  add(/\bfee|fees|expensive|cost|pricey|cheaper|1%/, 'Fee sensitivity')
  add(/spouse|wife|husband|partner/, 'Spouse is a co-decision-maker — include them')
  add(/voicemail|no answer|unresponsive|hasn'?t (responded|replied)|hard to reach/, 'Has been hard to reach')
  add(/returns|performance|beat the market|outperform/, 'Anchored on performance/returns')
  add(/too busy|swamped|no time|after (the )?project/, 'Time-constrained')
  add(/think about it|needs time|not sure|on the fence/, 'Hesitant — needs a nudge to decide')
  return [...new Set(out)]
}

export function generateMeetingBrief(lead, interactions, settings) {
  const history = [...interactions]
    .filter((i) => i.leadId === lead.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const combined = [lead.notes, ...history.map((h) => h.notes)].filter(Boolean).join('. ')

  const snapshot = [
    { label: 'Stage', value: lead.status === 'Won' ? 'Client' : lead.status },
    { label: 'Priority', value: lead.priority },
    { label: 'Source', value: lead.source + (lead.referredBy ? ` (via ${lead.referredBy})` : '') },
    { label: 'Estimated AUM', value: currencyFull(lead.estimatedValue) },
    { label: 'Annual fee', value: currency(annualFee(lead.estimatedValue, settings)) },
    { label: 'Lifetime value', value: currency(lifetimeValue(lead.estimatedValue, settings)) },
  ]

  const concerns = detectConcerns(combined)

  // Talking points: objection-handling from the coaching engine + tag-driven ideas.
  const coachTips = analyzeNote(combined, lead).suggestions
  const tagPoints = (lead.tags || []).map((t) => TAG_POINTS[t]).filter(Boolean)
  const talkingPoints = [...new Set([...coachTips, ...tagPoints])].slice(0, 6)

  const nextSteps = [NEXT_BY_STAGE[lead.status] || 'Agree on a clear next step before you part ways.']
  if (lead.nextFollowUp) nextSteps.push(`A follow-up is already on the calendar for ${fmtDate(lead.nextFollowUp)}.`)

  const last = history[0]

  return {
    name: lead.name,
    company: lead.company,
    generatedAt: new Date().toISOString(),
    snapshot,
    lastTouch: last
      ? { line: `${last.type} · ${last.outcome} · ${fmtDate(last.date)}`, notes: last.notes }
      : null,
    history: history.slice(0, 5),
    concerns,
    talkingPoints,
    nextSteps,
    tags: lead.tags || [],
  }
}

export async function getMeetingBrief(lead, interactions, settings) {
  // Swap this body for a Claude API call to get a fully written brief.
  return generateMeetingBrief(lead, interactions, settings)
}
