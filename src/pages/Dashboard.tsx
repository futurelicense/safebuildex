import { FLOW } from '../lib/catalog'
import { aggregate, rate, sum } from '../lib/analytics'
import { fmt } from '../lib/format'
import { useStore } from '../lib/store'
import { BarChart, Card, Metric, Screen, Table } from '../components/ui'

export function Dashboard() {
  const { observations, hazards, env, actions, db, setPage, scope } = useStore()
  const totals = aggregate(observations)
  const waste = sum(env, (row) => row.waste)
  const diverted = sum(env, (row) => row.diverted)
  const periods = [...new Set(observations.map((row) => row.period))].sort().slice(-12)
  const high = hazards.filter((hazard) => hazard.likelihood * hazard.severity >= 12).length
  const waiting = db.reviews.filter((review) => review.status === 'Submitted').length
  const projects = db.projects.filter((project) => scope === 'all' || project.id === scope)

  return (
    <Screen>
      <div className="flow">
        {FLOW.map((step) => (
          <button key={step.label} onClick={() => setPage(step.page)}>
            <small>{step.step}</small>
            <b>{step.label}</b>
          </button>
        ))}
      </div>
      <div className="metrics">
        <Metric label="Recordable incidence (TRIR)" value={fmt(rate(totals.c, totals.h))} note="Per 200,000 hours" />
        <Metric label="DART rate" value={fmt(rate(totals.d, totals.h))} note="Per 200,000 hours" />
        <Metric label="Exposure hours" value={fmt(totals.h)} note="Synthetic observation totals" />
        <Metric label="Open control actions" value={actions.filter((action) => action.status === 'Open').length} note="Requires human review" />
        <Metric label="Near-miss reports" value={fmt(totals.n)} note="Reporting volume, not severity" />
        <Metric label="Waste diversion" value={waste > 0 ? `${fmt((100 * diverted) / waste)}%` : 'N/A'} note="Independent sustainability KPI" />
      </div>
      <div className="split">
        <Card title="Monthly recordable observations">
          <BarChart rows={periods.map((period) => ({ label: period.slice(5), value: sum(observations.filter((row) => row.period === period), (row) => row.cases) }))} />
        </Card>
        <Card title="Site portfolio">
          <Table
            head={['Project', 'Phase', 'Hours', 'TRIR']}
            rows={projects.map((project) => {
              const projectTotals = aggregate(db.obs.filter((row) => row.p === project.id))
              return [project.name, project.phase, fmt(projectTotals.h), fmt(rate(projectTotals.c, projectTotals.h))]
            })}
          />
        </Card>
      </div>
      <Card title="Safety review signals">
        <p>{high} illustrative high-priority hazard ratings. Ratings are ordinal, not incident probabilities.</p>
        <p>{waiting} plans awaiting review.</p>
        <button className="btn" onClick={() => setPage(8)}>
          Open action center
        </button>
      </Card>
    </Screen>
  )
}
