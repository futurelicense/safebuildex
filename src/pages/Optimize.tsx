import { HIERARCHY } from '../lib/catalog'
import { aggregate, selectControls } from '../lib/analytics'
import { fmt, money, now, uid } from '../lib/format'
import { useStore } from '../lib/store'
import type { OptimizationRun } from '../lib/types'
import { Card, Field, Form, Metric, Screen, SelectField, Table } from '../components/ui'

export function Optimize() {
  const { db, observations, scope, commit, flash, setPage } = useStore()
  const latest = db.runs.find((run): run is OptimizationRun => run.kind === 'Optimization' && run.scope === scope)
  const submitted = latest ? db.reviews.some((review) => review.run === latest.id) : false

  function addControl(data: Record<string, string>) {
    const effect = Number(data['Illustrative reduction'])
    const cost = Number(data.Cost)
    const staff = Number(data['Staff hours'])
    if (!data.Control.trim() || !Number.isFinite(effect) || effect < 0 || effect > 100 || cost < 0 || staff < 0) {
      flash('Check the control name, cost, staff hours, and reduction', 'error')
      return false
    }
    commit((draft) => {
      draft.controls.push({
        id: uid(),
        name: data.Control.trim(),
        type: data.Hierarchy,
        mandatory: data.Required === 'Yes',
        cost,
        staff,
        effect: effect / 100,
      })
    }, 'Control candidate added')
    flash('Control candidate added')
  }

  function optimize(data: Record<string, string>) {
    const budget = Number(data.Budget)
    const staff = Number(data['Staff capacity'])
    const totals = aggregate(observations)
    if (!db.controls.length || !db.controls.some((control) => control.mandatory) || !totals.h) {
      flash('Add exposure observations and mandatory control candidates first', 'error')
      return false
    }
    if (db.controls.length > 20) {
      flash('This workspace supports at most 20 controls', 'error')
      return false
    }
    if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(staff) || staff < 0) {
      flash('Enter a budget and staff capacity', 'error')
      return false
    }
    const best = selectControls(db.controls, budget, staff)
    const run: OptimizationRun = {
      id: uid(),
      kind: 'Optimization',
      date: now(),
      scope,
      version: db.model.version,
      budget,
      capacity: staff,
      feasible: !!best,
      ...(best ?? {}),
      inputs: db.controls.map((control) => ({ ...control })),
    }
    commit((draft) => {
      draft.runs.unshift(run)
    }, best ? 'Illustrative control bundle generated' : 'Infeasible constraints; escalation required')
    flash(best ? 'Control bundle saved on this device' : 'No feasible bundle. Escalation required.', best ? 'ok' : 'error')
  }

  function submitPlan() {
    if (!latest?.feasible) return
    if (db.reviews.some((review) => review.run === latest.id)) {
      flash('This run has already been submitted', 'error')
      return
    }
    commit((draft) => {
      if (draft.reviews.some((review) => review.run === latest.id)) return false
      draft.reviews.unshift({ id: uid(), run: latest.id, scope: latest.scope, status: 'Submitted', note: '', date: now() })
    }, 'Control plan submitted for independent review')
    flash('Plan submitted for review')
    setPage(8)
  }

  return (
    <Screen>
      <Card title="Control candidate library">
        <p className="muted">
          These are illustrative packages, not a determination of applicable legal controls. Required controls are non-negotiable in this solver. Effect assumptions are hypothetical and multiplicative.
        </p>
        <Table
          head={['Control', 'Hierarchy', 'Required', 'Cost', 'Staff hours', 'Assumed reduction']}
          empty="No control candidates yet."
          rows={db.controls.map((control) => [control.name, control.type, control.mandatory ? 'Yes' : 'No', money(control.cost), control.staff, `${fmt(control.effect * 100)}%`])}
        />
        <h2 className="inset">Add candidate</h2>
        <Form onSubmit={addControl}>
          <Field label="Control" name="Control" />
          <SelectField label="Hierarchy" name="Hierarchy" options={HIERARCHY} />
          <SelectField label="Required" name="Required" defaultValue="No" options={['No', 'Yes']} />
          <Field label="Cost" name="Cost" type="number" defaultValue={1000} min="0" />
          <Field label="Staff hours" name="Staff hours" type="number" defaultValue={4} min="0" />
          <Field label="Illustrative reduction" name="Illustrative reduction" type="number" defaultValue={10} min="0" max="100" />
        </Form>
      </Card>
      <Card title="Constrained control selection">
        <Form submitLabel="Solve" onSubmit={optimize}>
          <Field label="Budget" name="Budget" type="number" defaultValue={12000} min="0" />
          <Field label="Staff capacity" name="Staff capacity" type="number" defaultValue={25} min="0" />
        </Form>
      </Card>
      {latest ? (
        <Card title="Solver result">
          {latest.feasible && latest.selected ? (
            <>
              <div className="metrics three">
                <Metric label="Bundle cost" value={money(latest.cost ?? 0)} />
                <Metric label="Staff hours" value={fmt(latest.staff ?? 0)} />
                <Metric label="Residual risk index" value={fmt((latest.residual ?? 0) * 100)} note="Baseline index = 100" />
              </div>
              <Table head={['Selected candidate', 'Required']} rows={latest.selected.map((control) => [control.name, control.mandatory ? 'Yes' : 'No'])} />
              <div className="toolbar">
                <button className="btn" onClick={submitPlan} disabled={submitted}>
                  {submitted ? 'Already submitted' : 'Submit for simulation review'}
                </button>
              </div>
            </>
          ) : (
            <p className="danger">
              Infeasible. Mandatory controls cannot fit the supplied budget or staff capacity. Escalate to qualified safety personnel. Do not relax protections. This is not a work authorization.
            </p>
          )}
        </Card>
      ) : null}
    </Screen>
  )
}
