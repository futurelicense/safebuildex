import type { Control, Observation } from './types'

export function sum<T>(items: T[], read: (item: T) => number) {
  return items.reduce((total, item) => total + read(item), 0)
}

export function aggregate(rows: Observation[]) {
  return {
    h: sum(rows, (row) => row.hours),
    c: sum(rows, (row) => row.cases),
    d: sum(rows, (row) => row.dart),
    n: sum(rows, (row) => row.near),
  }
}

export function rate(cases: number, hours: number) {
  return hours > 0 ? (200000 * cases) / hours : Number.NaN
}

export function forecastInterval(cases: number, hours: number, futureHours: number) {
  const mu = (cases / hours) * futureHours
  const spread = 1.645 * Math.sqrt(mu)
  return { mu, lower: Math.max(0, mu - spread), upper: mu + spread }
}

function makeRng(seed: number) {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return (state + 1) / 4294967297
  }
}

function poisson(lambda: number, rnd: () => number) {
  let total = 0
  let remaining = lambda
  while (remaining > 0) {
    const chunk = Math.min(remaining, 20)
    let product = 1
    let count = 0
    const limit = Math.exp(-chunk)
    do {
      count += 1
      product *= rnd()
    } while (product > limit)
    total += count - 1
    remaining -= chunk
  }
  return total
}

export function scenarioDistribution(mu: number, seed: number) {
  const rnd = makeRng(seed)
  const samples = Array.from({ length: 2000 }, () => poisson(mu, rnd)).sort((a, b) => a - b)
  const counts = Array.from({ length: 10 }, (_, index) => [
    index,
    samples.filter((value) => (index === 9 ? value >= 9 : value === index)).length,
  ]) as [number, number][]
  return { p50: samples[999], p80: samples[1599], p95: samples[1899], counts }
}

export function selectControls(controls: Control[], budget: number, staff: number) {
  let best: { selected: Control[]; cost: number; staff: number; residual: number } | null = null
  const limit = 2 ** controls.length
  for (let mask = 0; mask < limit; mask++) {
    const selected = controls.filter((_, index) => (mask & (1 << index)) !== 0)
    if (controls.some((control) => control.mandatory && !selected.includes(control))) continue
    const cost = sum(selected, (control) => control.cost)
    const hours = sum(selected, (control) => control.staff)
    if (cost > budget || hours > staff) continue
    const residual = selected.reduce((value, control) => value * (1 - control.effect), 1)
    if (!best || residual < best.residual - 1e-9 || (Math.abs(residual - best.residual) < 1e-9 && cost < best.cost)) {
      best = { selected: selected.map((control) => ({ ...control })), cost, staff: hours, residual }
    }
  }
  return best
}

export function backtest(rows: Observation[]) {
  const months = [...new Set(rows.map((row) => row.period))].sort()
  const cut = Math.floor(months.length * 0.75)
  const trainMonths = new Set(months.slice(0, cut))
  const testMonths = new Set(months.slice(cut))
  const train = aggregate(rows.filter((row) => trainMonths.has(row.period)))
  const result = train.h
    ? rows
        .filter((row) => testMonths.has(row.period))
        .map((row) => ({ p: row.p, period: row.period, actual: row.cases, pred: (train.c / train.h) * row.hours }))
    : []
  return {
    rows: result,
    n: result.length,
    mae: result.length ? sum(result, (row) => Math.abs(row.pred - row.actual)) / result.length : Number.NaN,
    rmse: result.length ? Math.sqrt(sum(result, (row) => (row.pred - row.actual) ** 2) / result.length) : Number.NaN,
    bias: result.length ? sum(result, (row) => row.pred - row.actual) / result.length : Number.NaN,
  }
}
