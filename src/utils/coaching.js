// Rule-based coaching engine.
//
// Two public functions:
//   analyzeNote(text, lead)         -> structured feedback on a single note / interaction
//   leadFlowSuggestions(leads, ix)  -> portfolio-level ideas to grow lead flow
//
// Both are SYNCHRONOUS and deterministic so the app works offline with no API key.
// They're wrapped by getNoteFeedback() / getFlowSuggestions() which are async, so a
// real Claude API call can be swapped in later without touching the UI. See README.

import { OPEN_STAGES } from '../data/constants'
import { daysBetween } from './format'

/* ------------------------------------------------------------------ */
/* Note / interaction feedback                                        */
/* ------------------------------------------------------------------ */

const POSITIVE = ['interested', 'engaged', 'excited', 'motivated', 'ready', 'signed', 'agreed', 'great call', 'warm', 'positive', 'enthusiastic', 'committed', 'on board', 'loved', 'keen', 'eager']
const NEGATIVE = ['not interested', 'unresponsive', 'no answer', 'skeptical', 'hesitant', 'reluctant', 'cold', 'declined', 'pushback', 'concerned', 'worried', 'frustrated', 'annoyed', 'stalled']
const NEXT_STEP = ['next step', 'next time', 'follow up', 'follow-up', 'schedule', 'scheduled', 'meeting set', 'send', 'sending', 'call back', 'will call', 'plan to', 'set up', 'booked', 'book a', 'circle back', 'next meeting']
const DISCOVERY = ['goal', 'goals', 'family', 'retire', 'retirement', 'risk', 'timeline', 'concern', 'values', 'kids', 'children', 'grandkids', 'income', 'worried about', 'dream', 'legacy', 'health']

const has = (text, words) => words.filter((w) => text.includes(w))
const hit = (text, re) => re.test(text)

export function analyzeNote(rawText, lead = {}) {
  const text = (rawText || '').toLowerCase().trim()
  const wordCount = text ? text.split(/\s+/).length : 0

  const strengths = []
  // Suggestions carry a weight so the most relevant, specific advice surfaces first.
  const tips = []
  const tip = (w, t) => tips.push({ w, t })
  let score = 50

  if (wordCount === 0) {
    return {
      score: 0,
      sentiment: 'neutral',
      summary: 'No note yet. Even one line about how it went helps the next touch land.',
      strengths: [],
      suggestions: [
        'Jot a quick note after every interaction — what they said, how they felt, and the next step.',
        'Capture one personal detail (family, goals, a worry) you can reference next time.',
      ],
    }
  }

  // ---- Length / detail ----
  if (wordCount >= 25) {
    strengths.push('Detailed note — a solid record for your future self and for compliance.')
    score += 10
  } else if (wordCount < 8) {
    tip(4, 'Add a little more detail — capture what they said, how they felt, and the next step so this note is still useful weeks from now.')
    score -= 6
  }

  // ---- Sentiment ----
  const pos = has(text, POSITIVE)
  const neg = has(text, NEGATIVE)
  let sentiment = 'neutral'
  if (pos.length > neg.length) {
    sentiment = 'positive'
    strengths.push('Reads as a warm interaction — strike while it\'s hot with a prompt next touch.')
    score += 10
  } else if (neg.length > pos.length) {
    sentiment = 'cautious'
    score -= 4
  }

  // ---- COMPETITIVE THREAT + in-house services (highest priority) ----
  const inHouseCPA = hit(text, /in[\s-]?house (cpa|tax|accountant|accounting)|cpa on staff|own cpa|their (cpa|accountant)|in[\s-]?house (attorney|estate|legal)/)
  const shopping = hit(text, /shopping|comparing|other firm|another (advisor|firm)|interview(ing)?|second opinion|new firm|looking at|evaluating|met with|talking to (another|other)|competitor/)
  const oneStop = hit(text, /one[\s-]?stop|all under one roof|everything in one place|full[\s-]?service|integrated/)

  if (inHouseCPA) {
    sentiment = 'cautious'
    tip(12, 'They\'re drawn to a competitor\'s in-house CPA. Neutralize it: introduce them to a CPA in your COI network (or your go-to tax partner) and present your team + trusted partners as a full-service bench. Offer a joint planning session so they get that integrated, "all-in-one" feel without leaving you.')
    score -= 6
  } else if (shopping) {
    sentiment = 'cautious'
    tip(10, 'They\'re shopping around. Ask directly: "What\'s most important to you in choosing an advisor?" — then tailor your pitch to exactly that. Differentiate on what only you offer (your COI partners, your process, your accessibility) and move faster than the competition.')
    score -= 4
  }
  if (oneStop && !inHouseCPA) {
    tip(8, 'They value a one-stop shop. Position your COI network (CPA, estate attorney, insurance) as your "virtual family office" — you coordinate the whole team so they don\'t have to.')
  }

  // ---- Already has an advisor ----
  if (hit(text, /current advisor|already (have|has) (an )?advisor|happy with|existing advisor|works with (an )?advisor/)) {
    sentiment = 'cautious'
    tip(9, 'They already have an advisor. Don\'t bash the incumbent — plant a seed. Ask "What\'s the one thing you wish your advisor did better?" Offer a no-pressure second opinion and stay in their orbit; many switch when a life event hits.')
    score -= 3
  }

  // ---- Fees ----
  if (hit(text, /\bfee|fees|expensive|too much|cost|pricey|cheaper|\b1%/)) {
    tip(8, 'On fees, reframe from cost to value: quantify what good planning saves them (taxes avoided, behavioral mistakes prevented, time back). Anchor your fee against the size of the decisions you\'re guiding.')
  }

  // ---- "Think about it" / stalling ----
  if (hit(text, /think about it|need(s)? time|get back to|not sure|on the fence|mull|sleep on/)) {
    tip(8, '"I\'ll think about it" usually hides a specific concern. Ask: "If you had to name one thing holding you back, what would it be?" — then book a firm follow-up date before you end the call.')
  }

  // ---- Unresponsive / voicemail ----
  if (hit(text, /voicemail|no answer|didn'?t (pick up|answer)|unresponsive|ghost|no reply|hasn'?t (responded|replied|called back)/)) {
    tip(7, 'Vary your channel and timing — a short text or email after a missed call, at a different time of day. Set a simple 3-touch cadence and a polite "break-up" message so the lead doesn\'t sit in limbo.')
  }

  // ---- Not interested ----
  if (hit(text, /not interested|no thanks|declined|passed|not a fit|prefers? (to )?(diy|self|manage)/)) {
    tip(6, 'Before closing it out, ask for value: "No problem — who else do you know who might benefit from a second look at their plan?" A dead lead can still produce a referral.')
  }

  // ---- Returns/performance focus ----
  if (hit(text, /returns|performance|beat the market|outperform|how much will i make|chasing/)) {
    tip(6, 'They\'re anchored on returns. Gently redirect to plan, risk, and goals — show how your value is in the planning and behavior coaching, not just picking funds. Set realistic expectations now to avoid pressure later.')
  }

  // ---- Too busy / procrastination ----
  if (hit(text, /too busy|swamped|after (the )?project|crazy at work|no time|later this/)) {
    tip(6, 'Make saying yes easy: propose one specific, short slot ("a focused 30 minutes next Tuesday at 8am") rather than asking them to find time. Lower the activation energy.')
  }

  // ---- Discovery depth ----
  if (has(text, DISCOVERY).length >= 1) {
    strengths.push('You captured something about their goals or situation — that personal context builds trust and gives you a reason to follow up.')
    score += 8
  } else {
    tip(4, 'Dig into the "why" next time: their goals, family, timeline, and biggest worry. People decide on emotion and justify with logic.')
  }

  // ---- Spouse / decision maker ----
  if (hit(text, /spouse|wife|husband|partner|both of them|decision together/)) {
    strengths.push('Decision-maker awareness — get both partners in the room early; it meaningfully lifts close rates and reduces "let me talk to my spouse" stalls.')
  }

  // ---- Referral ----
  if (hit(text, /referral|referred|introduc/)) {
    strengths.push('Referral lead — name the referrer early and thank them afterward; the borrowed trust shortens the sales cycle and keeps referrals flowing.')
  }

  // ---- Next step captured? ----
  const hasNext = has(text, NEXT_STEP).length > 0 || hit(text, /\b(mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow|next week|\d{1,2}(am|pm)/)
  if (hasNext) {
    strengths.push('A clear next step is captured — that\'s the single biggest driver of moving a prospect forward.')
    score += 14
  } else {
    tip(lead.priority === 'Hot' ? 9 : 7, 'No next step recorded. Never leave an interaction open-ended — lock in the follow-up (date + channel) before you hang up.')
    score -= 8
  }

  // ---- Hot lead urgency ----
  if (lead.priority === 'Hot' && !hasNext) {
    tip(9, 'This is a HOT lead — get the next touch on the calendar within 24–48 hours before the interest cools.')
  }

  score = Math.max(0, Math.min(100, score))

  const summary =
    score >= 75
      ? 'Strong note. You captured the sentiment, the context, and a path forward.'
      : score >= 50
        ? 'Solid note. The tips below will help you turn this conversation into a next step.'
        : 'This conversation has real signals to act on — here\'s how to move it forward.'

  const suggestions = tips.sort((a, b) => b.w - a.w).slice(0, 4).map((x) => x.t)

  return {
    score,
    sentiment,
    summary,
    strengths: strengths.slice(0, 4),
    suggestions,
  }
}

/* ------------------------------------------------------------------ */
/* Lead-flow suggestions (portfolio level)                            */
/* ------------------------------------------------------------------ */

export function leadFlowSuggestions(leads = [], interactions = []) {
  const out = []
  const total = leads.length || 1

  // Source breakdown
  const bySource = {}
  leads.forEach((l) => {
    bySource[l.source] = (bySource[l.source] || 0) + 1
  })
  const won = leads.filter((l) => l.status === 'Won')
  const wonBySource = {}
  won.forEach((l) => {
    wonBySource[l.source] = (wonBySource[l.source] || 0) + 1
  })

  // 1. Referrals are your best source?
  const referralCount = bySource['Referral'] || 0
  const referralShare = referralCount / total
  const referralWins = wonBySource['Referral'] || 0
  if (referralWins > 0 && referralShare < 0.4) {
    out.push({
      icon: 'users',
      title: 'Lean harder into referrals',
      body: `Referrals are converting for you (${referralWins} won) but are only ${Math.round(referralShare * 100)}% of your pipeline. Ask every happy client for one introduction this month, and thank past referrers — they tend to send more.`,
      tag: 'High leverage',
    })
  } else if (referralShare < 0.25) {
    out.push({
      icon: 'users',
      title: 'Build a referral habit',
      body: 'Only a small share of your leads come from referrals — usually the highest-converting, lowest-cost source. Add a simple "who else do you know?" ask to every annual review and onboarding.',
      tag: 'High leverage',
    })
  }

  // 2. Source concentration risk
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]
  if (topSource && topSource[1] / total > 0.55) {
    out.push({
      icon: 'alert',
      title: 'Diversify your lead sources',
      body: `${Math.round((topSource[1] / total) * 100)}% of your leads come from ${topSource[0]}. That's a single point of failure. Pick one new channel this quarter (a seminar, a LinkedIn cadence, or a centre-of-influence partnership) and test it.`,
      tag: 'Risk',
    })
  }

  // 3. Stale open leads (no contact in 14+ days)
  const lastTouch = {}
  interactions.forEach((i) => {
    if (!lastTouch[i.leadId] || new Date(i.date) > new Date(lastTouch[i.leadId])) {
      lastTouch[i.leadId] = i.date
    }
  })
  const stale = leads.filter(
    (l) => OPEN_STAGES.includes(l.status) && (daysBetween(lastTouch[l.id]) ?? 999) > 14
  )
  if (stale.length > 0) {
    out.push({
      icon: 'clock',
      title: `Re-engage ${stale.length} cooling lead${stale.length > 1 ? 's' : ''}`,
      body: `${stale.length} open lead${stale.length > 1 ? 's have' : ' has'} gone 2+ weeks without contact (${stale.slice(0, 3).map((l) => l.name).join(', ')}${stale.length > 3 ? '…' : ''}). A quick "thinking of you" touch revives more deals than chasing brand-new leads.`,
      tag: 'Quick win',
    })
  }

  // 4. Seminar / event ROI
  const eventLeads = leads.filter((l) => l.source === 'Seminar / Event')
  if (eventLeads.length > 0) {
    const eventWins = eventLeads.filter((l) => l.status === 'Won').length
    out.push({
      icon: 'mic',
      title: 'Double down on events',
      body: `Events have brought in ${eventLeads.length} lead${eventLeads.length > 1 ? 's' : ''}${eventWins ? ` and ${eventWins} client${eventWins > 1 ? 's' : ''}` : ''}. Workshops on Social Security, taxes, or retirement income are repeatable. Schedule the next one and ask attendees to bring a friend.`,
      tag: 'Scalable',
    })
  } else {
    out.push({
      icon: 'mic',
      title: 'Try an educational workshop',
      body: 'You have no event-sourced leads yet. A small seminar on Social Security or tax planning is one of the most reliable ways advisors generate qualified prospects. Partner with a CPA or estate attorney to share the room.',
      tag: 'New channel',
    })
  }

  // 5. New-lead follow-up speed
  const newLeads = leads.filter((l) => l.status === 'New')
  const slowNew = newLeads.filter((l) => (daysBetween(l.createdAt) ?? 0) > 2 && !lastTouch[l.id])
  if (slowNew.length > 0) {
    out.push({
      icon: 'zap',
      title: 'Speed up first contact',
      body: `${slowNew.length} new lead${slowNew.length > 1 ? 's have' : ' has'} been waiting 2+ days for a first touch. Contacting a lead within 5 minutes vs. an hour can multiply your conversion. Block a daily "new lead" window first thing each morning.`,
      tag: 'Quick win',
    })
  }

  // 6. Centre-of-influence partnerships
  const coiSources = leads.filter((l) =>
    (l.referredBy || '').match(/attorney|cpa|accountant|estate|lawyer/i)
  )
  if (coiSources.length > 0) {
    out.push({
      icon: 'handshake',
      title: 'Nurture your COI partnerships',
      body: `You've gotten ${coiSources.length} lead${coiSources.length > 1 ? 's' : ''} from professional partners (attorneys/CPAs). These are gold. Set up a quarterly coffee with each one and send reciprocal referrals to keep the pipeline flowing.`,
      tag: 'High leverage',
    })
  }

  // Always include an evergreen idea if list is short
  if (out.length < 3) {
    out.push({
      icon: 'linkedin',
      title: 'Be consistent on LinkedIn',
      body: 'Post one helpful, plain-English insight per week (taxes, markets, retirement). Comment on prospects\' posts. Over months this compounds into inbound conversations with zero ad spend.',
      tag: 'Long game',
    })
  }

  return out
}

/* ------------------------------------------------------------------ */
/* Async wrappers — swap in a Claude API call here if desired         */
/* ------------------------------------------------------------------ */

export async function getNoteFeedback(text, lead) {
  // To use the real Claude API instead, replace the body with a fetch to your
  // backend / the Anthropic API and map the response into the same shape:
  //   { score, sentiment, summary, strengths[], suggestions[] }
  return analyzeNote(text, lead)
}

export async function getFlowSuggestions(leads, interactions) {
  return leadFlowSuggestions(leads, interactions)
}
