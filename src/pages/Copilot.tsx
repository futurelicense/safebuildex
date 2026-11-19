import { useState } from 'react'
import { aggregate, rate } from '../lib/analytics'
import { fmt, money } from '../lib/format'
import { useStore } from '../lib/store'
import type { ForecastRun, OptimizationRun, ScenarioRun } from '../lib/types'
import { Card, Screen, Tag } from '../components/ui'

const TOPICS = ['Exposure and incident rates', 'Latest forecast', 'Latest scenario', 'Latest control optimization', 'Safety governance boundaries']

export function Copilot() {
  const { db, observations, scope, commit } = useStore()
  const [topic, setTopic] = useState(TOPICS[0])
  const [answer, setAnswer] = useState('Select a topic to begin.')

  function explain() {
    const totals = aggregate(observations)
    const kind = ({ 'Latest forecast': 'Forecast', 'Latest scenario': 'Scenario', 'Latest control optimization': 'Optimization' } as Record<string, string>)[topic]
    const run = db.runs.find((item) => item.kind === kind && (scope === 'all' || item.scope === scope))
    let text = ''
    if (topic === 'Exposure and incident rates') {
      text = `Scope: ${scope}. ${fmt(totals.h)} worker-hours, ${totals.c} recordable observations. TRIR ${fmt(rate(totals.c, totals.h))}; DART ${fmt(rate(totals.d, totals.h))}. Source: local exposure observations. Near-miss reporting is not proof of changing risk.`
    } else if (topic === 'Safety governance boundaries') {
      text = 'Mandatory controls cannot be removed for cost savings. All real decisions require competent personnel and applicable site procedures. Reference: NIOSH hierarchy of controls and OSHA construction standards in the source catalog.'
    } else if (!run) {
      text = 'Insufficient evidence: create a saved run in this scope first.'
    } else if (run.kind === 'Forecast') {
      const forecast = run as ForecastRun
      text = `Run ${forecast.id}, model version ${forecast.version}. Expected count ${fmt(forecast.mu)}; illustrative interval ${fmt(forecast.lower)}–${fmt(forecast.upper)}.`
    } else if (run.kind === 'Scenario') {
      const scenario = run as ScenarioRun
      text = `Run ${scenario.id}, model version ${scenario.version}. Assumed multiplier ${scenario.factor}, seed ${scenario.seed}, P95 count ${scenario.p95}.`
    } else {
      const plan = run as OptimizationRun
      text = plan.feasible
        ? `Run ${plan.id}, model version ${plan.version}. Selected ${plan.selected?.length ?? 0} illustrative candidates; cost ${money(plan.cost ?? 0)}; residual index ${fmt((plan.residual ?? 0) * 100)}.`
        : `Run ${plan.id}, model version ${plan.version}. No feasible bundle under the entered constraints. Escalation required.`
    }
    setAnswer(`${text}\nDemonstration only; not operational advice.`)
    commit(() => undefined, 'Local advisory explanation generated')
  }

  return (
    <Screen>
      <Card title="SAFE-BUILD advisory assistant">
        <p>
          <Tag tone="warn">Local deterministic demo · Groq not connected</Tag>
        </p>
        <p>Choose a topic to generate an explanation grounded in the current synthetic workspace. Nothing is sent off this device.</p>
        <label>
          Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            {TOPICS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="toolbar">
          <button className="btn" onClick={explain}>
            Generate explanation
          </button>
        </div>
        <div className="notice">{answer}</div>
        <p className="muted">External inference requires a secure gateway, approved context, and evaluation. No worker-identifiable data is sent.</p>
      </Card>
    </Screen>
  )
}
