import { aggregate, rate } from './analytics'
import { fmt } from './format'
import type { ForecastRun, OptimizationRun, ScenarioRun } from './types'

export interface Reading {
  text: string
  source: 'engine' | 'groq'
  note: string
}

export const READ_FORECAST =
  'Explain this saved historical-rate forecast. Repeat the expected count and the interval exactly as written in CONTEXT. Say what the result does not claim. Do not produce a different forecast.'

export const READ_SCENARIO =
  'Explain this saved scenario. The expected count is the historical rate times the saved multiplier. Repeat the saved percentiles exactly as written in CONTEXT. The weather text is a label. Do not infer a weather threshold or produce a different forecast.'

export const READ_EXPOSURE =
  'Explain the saved exposure totals in CONTEXT. Repeat the rates exactly as written. Do not estimate a future count.'

export const READ_PLAN =
  'Explain this saved control result using only CONTEXT. Do not drop a required control or propose a different bundle.'

export const READ_GOVERNANCE =
  'Restate the governance boundaries in CONTEXT. Do not add a threshold, a fine, or a clearance decision.'

function clean(value: string, limit = 80) {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, limit)
}

function figure(label: string, value: number) {
  const shown = fmt(value)
  const plain = String(value)
  return shown === plain ? `${label}: ${shown}` : `${label}: ${shown} (${plain})`
}

function tokens(text: string) {
  return new Set(
    (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).flatMap((raw) => {
      const plain = raw.replace(/,/g, '')
      return plain === raw ? [raw] : [raw, plain]
    }),
  )
}

/** A number in the draft is allowed only when that same token is already in the saved context. */
export function unsupportedNumbers(answer: string, context: string) {
  const allowed = tokens(context)
  const nums = answer.match(/\d[\d,]*(?:\.\d+)?/g) ?? []
  const bad = nums.filter((raw) => {
    const plain = raw.replace(/,/g, '')
    if (/^(19|20)\d{2}$/.test(plain)) return false
    return !allowed.has(raw) && !allowed.has(plain)
  })
  return [...new Set(bad)]
}

export function settleReading(draft: string | null, context: string, fallback: string, reason?: string): Reading {
  if (!draft?.trim()) {
    return { text: fallback, source: 'engine', note: reason ?? 'Groq did not return a reading. The engine reading is kept.' }
  }
  const bad = unsupportedNumbers(draft, context)
  if (bad.length) {
    return {
      text: fallback,
      source: 'engine',
      note: `The Groq draft was discarded because it used numbers that are not in the saved result: ${bad.slice(0, 6).join(', ')}.`,
    }
  }
  return { text: draft.trim(), source: 'groq', note: 'Groq repeated figures from the saved result. It did not compute a new count.' }
}

export function forecastBrief(run: ForecastRun, scopeName: string) {
  const totals = aggregate(run.inputs)
  const trir = rate(totals.c, totals.h)
  const context = [
    'Method: Historical rate',
    'Formula: expected count = recordable cases / worker-hours × future hours',
    'Interval: normal approximation to a Poisson count, half-width 1.645 × square root of the expected count, lower floored at 0',
    'Approximate interval coverage: 90 percent',
    `Scope: ${clean(scopeName, 120)}`,
    `Model version: ${run.version}`,
    `Run: ${run.id}`,
    `Observation rows: ${run.inputs.length}`,
    figure('Recordable cases', totals.c),
    figure('Worker-hours', totals.h),
    figure('Future hours', run.hours),
    figure('Expected count', run.mu),
    figure('Illustrative lower', run.lower),
    figure('Illustrative upper', run.upper),
    figure('Historical TRIR', trir),
    'TRIR base hours: 200,000',
    'This is an illustrative research forecast. It does not clear work.',
  ].join('\n')
  const text = `On ${clean(scopeName, 120)}, the historical rate uses ${fmt(totals.c)} recordable cases and ${fmt(totals.h)} worker-hours. Pointed at ${fmt(run.hours)} future hours, the expected count is ${fmt(run.mu)}, with an illustrative interval of ${fmt(run.lower)} to ${fmt(run.upper)}. Historical TRIR for that exposure is ${fmt(trir)}. The interval is a normal approximation to a Poisson count, not a calibrated site prediction. This run does not clear work.`
  return { context, text }
}

export function scenarioBrief(run: ScenarioRun, scopeName: string) {
  const totals = aggregate(run.inputs)
  const weather = clean(run.weather) || 'Unlabeled condition'
  const context = [
    'Method: Historical rate × saved multiplier, then 2,000 seeded Poisson draws',
    'The weather text is a label. No heat, wind, or weather threshold is inferred.',
    `Scope: ${clean(scopeName, 120)}`,
    `Model version: ${run.version}`,
    `Run: ${run.id}`,
    `Weather label: ${weather}`,
    figure('Recordable cases', totals.c),
    figure('Worker-hours', totals.h),
    figure('Future hours', run.hours),
    figure('Multiplier', run.factor),
    figure('Seed', run.seed),
    figure('Expected count', run.mu),
    figure('P50', run.p50),
    figure('P80', run.p80),
    figure('P95', run.p95),
    'Draws: 2,000',
    'Percentile labels: 50, 80, 95',
    'This scenario does not clear work.',
  ].join('\n')
  const text = `The scenario keeps the historical rate and multiplies it by ${fmt(run.factor)} for “${weather}”. Over ${fmt(run.hours)} hours the expected count is ${fmt(run.mu)}. From 2,000 seeded draws with seed ${fmt(run.seed)}, the counts are P50 ${fmt(run.p50)}, P80 ${fmt(run.p80)}, and P95 ${fmt(run.p95)}. The weather text is a label. It does not set a safety threshold, and the result does not clear work.`
  return { context, text }
}

export function exposureBrief(scopeName: string, cases: number, hours: number, dart: number, rows: number) {
  const context = [
    `Scope: ${clean(scopeName, 120)}`,
    `Observation rows: ${rows}`,
    figure('Recordable cases', cases),
    figure('DART cases', dart),
    figure('Worker-hours', hours),
    figure('TRIR', rate(cases, hours)),
    figure('DART rate', rate(dart, hours)),
    'TRIR base hours: 200,000',
    'Near-miss reporting is not proof of changing risk.',
  ].join('\n')
  const text = `Scope ${clean(scopeName, 120)}: ${fmt(hours)} worker-hours and ${fmt(cases)} recordable cases. TRIR ${fmt(rate(cases, hours))}; DART ${fmt(rate(dart, hours))}. Source: local exposure observations. Near-miss reporting is not proof of changing risk.`
  return { context, text }
}

export function planBrief(run: OptimizationRun) {
  const context = run.feasible
    ? [
        'Method: exhaustive search; required controls stay in every candidate',
        `Run: ${run.id}`,
        `Model version: ${run.version}`,
        figure('Budget', run.budget),
        figure('Staff capacity', run.capacity),
        figure('Selected controls', run.selected?.length ?? 0),
        `Selected names: ${(run.selected ?? []).map((control) => clean(control.name, 40)).join(', ') || 'none'}`,
        figure('Cost', run.cost ?? 0),
        figure('Staff hours', run.staff ?? 0),
        figure('Residual index', (run.residual ?? 0) * 100),
        'Baseline index: 100',
        'Feasible: yes',
      ].join('\n')
    : [
        'Method: exhaustive search; required controls stay in every candidate',
        `Run: ${run.id}`,
        `Model version: ${run.version}`,
        figure('Budget', run.budget),
        figure('Staff capacity', run.capacity),
        'Feasible: no',
        'Escalation required.',
      ].join('\n')
  const text = run.feasible
    ? `Run ${run.id}, model version ${run.version}. Selected ${fmt(run.selected?.length ?? 0)} illustrative candidates; cost ${fmt(run.cost ?? 0)}; residual index ${fmt((run.residual ?? 0) * 100)} against a baseline of 100. Required controls stayed in the bundle.`
    : `Run ${run.id}, model version ${run.version}. No feasible bundle under the entered constraints. Escalation required.`
  return { context, text }
}

export function governanceBrief() {
  const context = [
    'Mandatory controls cannot be removed for cost savings.',
    'A safety reviewer records the rationale before an action is assigned or closed.',
    'This workspace does not clear work and does not replace qualified safety personnel.',
    'References in the source catalog: NIOSH hierarchy of controls and OSHA construction standards.',
  ].join('\n')
  return { context, text: context }
}
