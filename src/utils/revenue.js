// Revenue modelling: turn estimated AUM into advisory revenue.
//
//   annual fee     = AUM x feeRate           (e.g. 1%)
//   lifetime value = annual fee x avgYears    (avg client lifespan)
//   weighted value = lifetime value x P(stage becoming a client)

import { STAGE_PROBABILITY, OPEN_STAGES, PIPELINE_STAGES } from '../data/constants'

export const annualFee = (aum, settings) =>
  Number(aum || 0) * (settings?.feeRate ?? 0.01)

export const lifetimeValue = (aum, settings) =>
  annualFee(aum, settings) * (settings?.avgClientYears ?? 10)

export const stageProbability = (status) => STAGE_PROBABILITY[status] ?? 0

// Weighted forecast across the open pipeline.
export function forecast(leads, settings) {
  const open = leads.filter((l) => OPEN_STAGES.includes(l.status))

  const grossLTV = open.reduce((s, l) => s + lifetimeValue(l.estimatedValue, settings), 0)
  const weightedLTV = open.reduce(
    (s, l) => s + lifetimeValue(l.estimatedValue, settings) * stageProbability(l.status),
    0
  )
  const weightedAnnual = open.reduce(
    (s, l) => s + annualFee(l.estimatedValue, settings) * stageProbability(l.status),
    0
  )
  const openAUM = open.reduce((s, l) => s + Number(l.estimatedValue || 0), 0)

  // Per-stage breakdown for the forecast table.
  const byStage = PIPELINE_STAGES.filter((s) => OPEN_STAGES.includes(s.id)).map((stage) => {
    const rows = open.filter((l) => l.status === stage.id)
    const ltv = rows.reduce((s, l) => s + lifetimeValue(l.estimatedValue, settings), 0)
    const p = stageProbability(stage.id)
    return {
      ...stage,
      count: rows.length,
      probability: p,
      ltv,
      weighted: ltv * p,
    }
  })

  return { open: open.length, openAUM, grossLTV, weightedLTV, weightedAnnual, byStage }
}
