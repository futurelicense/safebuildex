import { aggregate, backtest, rate } from '../lib/analytics'
import { download, fmt, now, toCsv } from '../lib/format'
import { useStore } from '../lib/store'
import { Card, Metric, Screen, Table } from '../components/ui'

export function Reports() {
  const { db, observations, scope, projectName, report, setReport, commit } = useStore()
  const evaluation = backtest(observations)
  const totals = aggregate(observations)

  function makeReport() {
    const brief = `SAFE-BUILD V2.0 | Synthetic research brief
Generated: ${now()}
Scope: ${scope === 'all' ? 'Portfolio' : projectName(scope)}
Exposure: ${totals.h} hours | Recordables: ${totals.c} | DART: ${totals.d}
TRIR: ${fmt(rate(totals.c, totals.h))} | DART rate: ${fmt(rate(totals.d, totals.h))}
Model version: ${db.model.version}
Holdout MAE: ${fmt(evaluation.mae)}; RMSE: ${fmt(evaluation.rmse)}
Source snapshots: ${db.datasets.map((dataset) => `${dataset.id} / ${dataset.name} / ${dataset.date}`).join('; ')}
Saved run IDs: ${db.runs
      .filter((run) => scope === 'all' || run.scope === scope)
      .map((run) => run.id)
      .join(', ')}
Limitations: synthetic records; illustrative models; no actual safety clearance, certification, or measured impact.`
    setReport(brief)
    commit(() => undefined, 'Research brief generated')
  }

  return (
    <Screen>
      <div className="metrics">
        <Metric label="Holdout observations" value={fmt(evaluation.n)} />
        <Metric label="MAE" value={fmt(evaluation.mae)} note="Recordable counts" />
        <Metric label="RMSE" value={fmt(evaluation.rmse)} note="Recordable counts" />
        <Metric label="Bias" value={fmt(evaluation.bias)} note="Predicted minus observed" />
      </div>
      <Card title="Chronological baseline backtest">
        <p>Train on the earliest 75% of distinct months and test on later months using matched exposure denominators. Synthetic results do not demonstrate actual predictive accuracy.</p>
        <Table
          head={['Month', 'Project', 'Actual', 'Predicted']}
          empty="Not enough months to hold out."
          rows={evaluation.rows.map((row) => [row.period, projectName(row.p), row.actual, fmt(row.pred)])}
        />
      </Card>
      <Card title="Research export center">
        <p>Generate a scoped evidence brief. Print / save as PDF uses the browser print dialog.</p>
        <div className="toolbar no-print">
          <button className="btn" onClick={makeReport}>
            Generate brief
          </button>
          <button className="btn secondary" onClick={() => download('exposure.csv', toCsv(observations as unknown as Record<string, unknown>[]), 'text/csv')}>
            Exposure CSV
          </button>
          <button
            className="btn secondary"
            onClick={() => download('runs.json', JSON.stringify(db.runs.filter((run) => scope === 'all' || run.scope === scope), null, 2))}
          >
            Runs JSON
          </button>
          <button className="btn secondary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
        <div className="notice" id="report">
          {report || 'No brief generated yet.'}
        </div>
      </Card>
    </Screen>
  )
}
