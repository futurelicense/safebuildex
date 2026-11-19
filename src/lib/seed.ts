import type { Database } from './types'
import { now } from './format'

export function seed(blank = false): Database {
  const projects = blank
    ? []
    : ['Cedar Green Office', 'Harbor Transit Annex', 'Summit Learning Center', 'Riverbend Retrofit'].map(
        (name, i) => ({
          id: `P${i + 1}`,
          name,
          location: ['Austin, TX', 'Seattle, WA', 'Charlotte, NC', 'Denver, CO'][i],
          phase: ['Structural', 'Excavation', 'Envelope', 'Mechanical'][i],
          target: 80,
        }),
      )

  const hazards: Database['hazards'] = []
  const obs: Database['obs'] = []
  const env: Database['env'] = []

  projects.forEach((project, i) => {
    ;['Falls', 'Heat exposure', 'Struck-by', 'Electrical', 'Dust exposure'].forEach((name, j) => {
      hazards.push({
        id: `${project.id}H${j}`,
        p: project.id,
        name,
        task: ['Roofing', 'Outdoor shift', 'Material handling', 'Installation', 'Cutting'][j],
        likelihood: 2 + ((i + j) % 3),
        severity: 3 + (j % 3),
        mandatory: true,
      })
    })
    for (let month = 1; month <= 12; month++) {
      const period = `2025-${String(month).padStart(2, '0')}`
      obs.push({
        id: `${project.id}O${month}`,
        p: project.id,
        period,
        hours: 9000 + i * 1000 + month * 130,
        cases: (month + i) % 5 === 0 ? 2 : (month + i) % 3 === 0 ? 1 : 0,
        dart: (month + i) % 5 === 0 ? 1 : 0,
        near: 2 + ((month + i) % 7),
      })
      env.push({
        id: `${project.id}E${month}`,
        p: project.id,
        period,
        energy: 14000 + month * 500 + i * 1000,
        water: 21000 + month * 400,
        waste: 10 + (month % 5),
        diverted: 7 + (month % 3),
      })
    }
  })

  return {
    projects,
    hazards,
    obs,
    env,
    controls: blank
      ? []
      : [
          { id: 'C1', name: 'Required protection package (illustrative)', type: 'Engineering', mandatory: true, cost: 4500, staff: 8, effect: 0.2 },
          { id: 'C2', name: 'Required inspection package (illustrative)', type: 'Administrative', mandatory: true, cost: 1200, staff: 6, effect: 0.1 },
          { id: 'C3', name: 'Additional engineering isolation', type: 'Engineering', mandatory: false, cost: 3500, staff: 5, effect: 0.25 },
          { id: 'C4', name: 'Additional exposure monitoring', type: 'Administrative', mandatory: false, cost: 1800, staff: 4, effect: 0.12 },
          { id: 'C5', name: 'Additional task redesign', type: 'Elimination', mandatory: false, cost: 5200, staff: 7, effect: 0.35 },
        ],
    actions: [],
    runs: [],
    reviews: [],
    audit: [],
    datasets: blank
      ? []
      : [{ id: 'FIX-001', name: 'Synthetic monthly exposure fixture', mode: 'SYNTHETIC', rows: obs.length, date: now(), hash: 'seed-v1' }],
    model: { version: 1, method: 'Historical rate', notes: 'Illustrative exposure-matched baseline' },
  }
}
