import { sum } from '../lib/analytics'
import { fmt, uid } from '../lib/format'
import { useStore } from '../lib/store'
import { BarChart, Card, Field, Form, Metric, ProjectField, Screen, Table } from '../components/ui'

export function Sustainability() {
  const { db, env, commit, flash, projectName } = useStore()
  const periods = [...new Set(env.map((row) => row.period))].sort().slice(-12)

  function addEnv(data: Record<string, string>) {
    const energy = Number(data['Energy kWh'])
    const water = Number(data['Water gal'])
    const waste = Number(data['Waste tons'])
    const diverted = Number(data['Diverted tons'])
    if (!data.p || [energy, water, waste, diverted].some((value) => !Number.isFinite(value) || value < 0) || diverted > waste) {
      flash('Check the project and waste totals. Diverted tons cannot exceed waste.', 'error')
      return false
    }
    commit((draft) => {
      draft.env.push({ id: uid(), p: data.p, period: data.Period, energy, water, waste, diverted })
    }, 'Environmental observation added')
    flash('Environmental observation added')
  }

  return (
    <Screen>
      <div className="metrics">
        <Metric label="Energy (kWh)" value={fmt(sum(env, (row) => row.energy))} />
        <Metric label="Water (gal)" value={fmt(sum(env, (row) => row.water))} />
        <Metric label="Waste (tons)" value={fmt(sum(env, (row) => row.waste))} />
        <Metric label="Diverted (tons)" value={fmt(sum(env, (row) => row.diverted))} />
      </div>
      <Card title="Record environmental observation">
        {db.projects.length === 0 ? (
          <p className="empty">Create a project before recording environmental totals.</p>
        ) : (
          <Form onSubmit={addEnv}>
            <ProjectField />
            <Field label="Period" name="Period" type="month" defaultValue="2026-01" />
            <Field label="Energy kWh" name="Energy kWh" type="number" defaultValue={10000} min="0" />
            <Field label="Water gal" name="Water gal" type="number" defaultValue={20000} min="0" />
            <Field label="Waste tons" name="Waste tons" type="number" defaultValue={10} min="0" />
            <Field label="Diverted tons" name="Diverted tons" type="number" defaultValue={8} min="0" />
          </Form>
        )}
      </Card>
      <div className="split">
        <Card title="Energy trend">
          <BarChart rows={periods.map((period) => ({ label: period.slice(5), value: sum(env.filter((row) => row.period === period), (row) => row.energy) }))} />
        </Card>
        <Card title="Environmental register">
          <Table
            head={['Project', 'Month', 'kWh', 'Water gal', 'Waste tons', 'Diverted']}
            rows={env.map((row) => [projectName(row.p), row.period, fmt(row.energy), fmt(row.water), fmt(row.waste), fmt(row.diverted)])}
          />
        </Card>
      </div>
      <p className="muted">Environmental indicators are separate from injury labels and do not establish green-building certification.</p>
    </Screen>
  )
}
