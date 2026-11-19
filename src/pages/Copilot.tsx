import { useState } from 'react'
import { aggregate } from '../lib/analytics'
import { exposureBrief, governanceBrief, planBrief, READ_EXPOSURE, READ_FORECAST, READ_GOVERNANCE, READ_PLAN, READ_SCENARIO, forecastBrief, scenarioBrief, type Reading } from '../lib/briefing'
import { alignedReading } from '../lib/groq'
import { useStore } from '../lib/store'
import type { ForecastRun, OptimizationRun, ScenarioRun } from '../lib/types'
import { Card, Screen, Tag } from '../components/ui'

const TOPICS = ['Exposure and incident rates', 'Latest forecast', 'Latest scenario', 'Latest control optimization', 'Safety governance boundaries']

export function Copilot() {
  const { db, observations, scope, commit, projectName } = useStore()
  const [topic, setTopic] = useState(TOPICS[0])
  const [pending, setPending] = useState(false)
  const [answer, setAnswer] = useState<Reading | null>(null)

  async function explain() {
    const totals = aggregate(observations)
    const scopeName = projectName(scope)
    let question = READ_EXPOSURE
    let brief = exposureBrief(scopeName, totals.c, totals.h, totals.d, observations.length)
    if (topic === 'Safety governance boundaries') {
      question = READ_GOVERNANCE
      brief = governanceBrief()
    } else if (topic === 'Latest forecast') {
      const run = db.runs.find((item): item is ForecastRun => item.kind === 'Forecast' && (scope === 'all' || item.scope === scope))
      if (!run) {
        setAnswer({ text: 'Insufficient evidence: create a saved forecast in this scope first.', source: 'engine', note: 'There is no saved forecast for Groq to read.' })
        return
      }
      question = READ_FORECAST
      brief = forecastBrief(run, projectName(run.scope))
    } else if (topic === 'Latest scenario') {
      const run = db.runs.find((item): item is ScenarioRun => item.kind === 'Scenario' && (scope === 'all' || item.scope === scope))
      if (!run) {
        setAnswer({ text: 'Insufficient evidence: create a saved scenario in this scope first.', source: 'engine', note: 'There is no saved scenario for Groq to read.' })
        return
      }
      question = READ_SCENARIO
      brief = scenarioBrief(run, projectName(run.scope))
    } else if (topic === 'Latest control optimization') {
      const run = db.runs.find((item): item is OptimizationRun => item.kind === 'Optimization' && (scope === 'all' || item.scope === scope))
      if (!run) {
        setAnswer({ text: 'Insufficient evidence: create a saved optimization in this scope first.', source: 'engine', note: 'There is no saved optimization for Groq to read.' })
        return
      }
      question = READ_PLAN
      brief = planBrief(run)
    }
    setPending(true)
    const result = await alignedReading(question, brief.context, brief.text)
    setAnswer(result)
    setPending(false)
    commit(() => undefined, result.source === 'groq' ? 'Groq reading aligned to the saved model' : 'Engine reading kept')
  }

  return (
    <Screen>
      <Card title="SAFE-BUILD advisory assistant">
        <p>
          <Tag tone={answer?.source === 'groq' ? '' : 'warn'}>
            {answer?.source === 'groq' ? 'Groq, aligned to the saved model' : 'Engine reading'}
          </Tag>
        </p>
        <p>
          Groq explains a saved run through the local server. It may repeat only the numbers already in that run. The historical-rate count is not recomputed here. Observation rows and the passphrase stay on this device.
        </p>
        <label>
          Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            {TOPICS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="toolbar">
          <button className="btn" disabled={pending} onClick={() => void explain()}>
            {pending ? 'Reading the saved result…' : 'Generate explanation'}
          </button>
        </div>
        <div className="notice">{answer?.text ?? 'Select a topic to begin.'}</div>
        {answer?.note ? <p className="muted">{answer.note}</p> : null}
      </Card>
    </Screen>
  )
}
