import { aggregate, scenarioDistribution } from '../lib/analytics'
import { fmt, now, uid } from '../lib/format'
import { useStore } from '../lib/store'
import type { ScenarioRun } from '../lib/types'
import { BarChart, Card, Field, Form, Metric, Screen, Table } from '../components/ui'

export function Scenario() {
  const { db, observations, scope, commit, flash } = useStore()
  const latest = db.runs.find((run): run is ScenarioRun => run.kind === 'Scenario' && run.scope === scope)
  const history = db.runs.filter((run): run is ScenarioRun => run.kind === 'Scenario')

  function runScenario(data: Record<string, string>) {
    const totals = aggregate(observations)
    const hours = Number(data.Hours)
    const factor = Number(data.Multiplier)
    const seed = Number(data.Seed)
    if (!totals.h) {
      flash('Add exposure observations first', 'error')
      return false
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > 10000000 || !Number.isFinite(factor) || factor < 0 || factor > 10) {
      flash('Check hours and the multiplier', 'error')
      return false
    }
    if (!Number.isInteger(seed) || seed < 1) {
      flash('Seed must be a positive whole number', 'error')
      return false
    }
    const mu = (totals.c / totals.h) * hours * factor
    if (mu > 1000) {
      flash('Reduce the scenario expected count to 1000 or less', 'error')
      return false
    }
    const distribution = scenarioDistribution(mu, seed >>> 0)
    const run: ScenarioRun = {
      id: uid(),
      kind: 'Scenario',
      scope,
      date: now(),
      version: db.model.version,
      hours,
      factor,
      seed: seed >>> 0,
      weather: data.Weather.trim(),
      mu,
      ...distribution,
      inputs: observations.map((row) => ({ ...row })),
    }
    commit((draft) => {
      draft.runs.unshift(run)
    }, 'Seeded scenario executed')
    flash('Scenario saved on this device')
  }

  return (
    <Screen>
      <Card title="Weather-context stress simulation">
        <p>
          Enter a fictional shift condition and an independently assumed multiplier. No automatic heat, wind, or weather safety threshold is inferred. Consult official alerts and qualified safety staff.
        </p>
        <Form submitLabel="Run scenario" onSubmit={runScenario}>
          <Field label="Weather" name="Weather" defaultValue="Illustrative high heat" />
          <Field label="Hours" name="Hours" type="number" defaultValue={10000} min="1" max="10000000" />
          <Field label="Multiplier" name="Multiplier" type="number" defaultValue={1.5} min="0" max="10" step="0.1" />
          <Field label="Seed" name="Seed" type="number" defaultValue={42} min="1" max="4294967295" step="1" />
        </Form>
        <p>
          <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">
            Official NWS weather and alerts
          </a>
        </p>
      </Card>
      {latest ? (
        <>
          <div className="metrics">
            <Metric label="Expected count" value={fmt(latest.mu)} />
            <Metric label="P50" value={latest.p50} />
            <Metric label="P80" value={latest.p80} />
            <Metric label="P95" value={latest.p95} />
          </div>
          <Card title="Simulated recordable counts · 2,000 samples">
            <BarChart rows={latest.counts.map(([bucket, count]) => ({ label: bucket === 9 ? '9+' : String(bucket), value: count }))} />
          </Card>
        </>
      ) : null}
      <Card title="Scenario archive">
        <Table
          head={['Run', 'Weather assumption', 'Multiplier', 'P95', 'Seed']}
          empty="No saved scenarios yet."
          rows={history.map((run) => [run.id, run.weather, run.factor, run.p95, run.seed])}
        />
      </Card>
    </Screen>
  )
}
