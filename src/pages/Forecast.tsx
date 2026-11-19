import { aggregate, forecastInterval } from '../lib/analytics'
import { fmt, now, uid } from '../lib/format'
import { useStore } from '../lib/store'
import type { ForecastRun } from '../lib/types'
import { Card, Field, Form, Metric, Screen, Table } from '../components/ui'

export function Forecast() {
  const { db, observations, scope, commit, flash, projectName } = useStore()
  const latest = db.runs.find((run): run is ForecastRun => run.kind === 'Forecast' && run.scope === scope)
  const history = db.runs.filter((run): run is ForecastRun => run.kind === 'Forecast')

  function runForecast(data: Record<string, string>) {
    const totals = aggregate(observations)
    const hours = Number(data.Hours)
    if (!totals.h) {
      flash('Add exposure observations first', 'error')
      return false
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > 100000000) {
      flash('Enter future hours between 1 and 100,000,000', 'error')
      return false
    }
    const interval = forecastInterval(totals.c, totals.h, hours)
    const run: ForecastRun = {
      id: uid(),
      kind: 'Forecast',
      scope,
      version: db.model.version,
      date: now(),
      hours,
      ...interval,
      inputs: observations.map((row) => ({ ...row })),
      note: 'Illustrative normal approximation, not calibrated',
    }
    commit((draft) => {
      draft.runs.unshift(run)
    }, 'Historical-rate forecast generated')
    flash('Historical-rate forecast saved on this device')
  }

  return (
    <Screen>
      <Card title="Historical exposure-rate forecast">
        <p>
          Expected count = historical recordable events / worker-hours × future hours. The illustrative interval uses a normal approximation to a Poisson count, not a calibrated site prediction.
        </p>
        <Form submitLabel="Run forecast" onSubmit={runForecast}>
          <Field label="Hours" name="Hours" type="number" defaultValue={10000} min="1" max="100000000" />
        </Form>
      </Card>
      {latest ? (
        <>
          <div className="metrics three">
            <Metric label="Expected count" value={fmt(latest.mu)} />
            <Metric label="Illustrative lower" value={fmt(latest.lower)} />
            <Metric label="Illustrative upper" value={fmt(latest.upper)} />
          </div>
          <Card title="Run provenance">
            <p>
              Run {latest.id} · model v{latest.version} · {latest.inputs.length} observation snapshots · {latest.hours.toLocaleString('en-US')} future hours
            </p>
            <p className="muted">{latest.note}</p>
          </Card>
        </>
      ) : null}
      <Card title="Saved forecast history">
        <Table
          head={['Run', 'Model', 'Expected', 'Scope']}
          empty="No saved forecasts yet."
          rows={history.map((run) => [run.id, run.version, fmt(run.mu), projectName(run.scope)])}
        />
      </Card>
    </Screen>
  )
}
