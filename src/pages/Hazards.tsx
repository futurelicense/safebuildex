import { uid } from '../lib/format'
import { useStore } from '../lib/store'
import { Card, Field, Form, ProjectField, Screen, Table, Tag } from '../components/ui'

function whole(value: string) {
  return /^\d+$/.test(value) ? Number(value) : Number.NaN
}

export function Hazards() {
  const { db, hazards, commit, flash, projectName } = useStore()

  function addHazard(data: Record<string, string>) {
    if (!data.p) {
      flash('Create a project first', 'error')
      return false
    }
    const likelihood = whole(data.Likelihood)
    const severity = whole(data.Severity)
    if (likelihood < 1 || likelihood > 5 || severity < 1 || severity > 5) {
      flash('Likelihood and severity must be whole numbers from 1 to 5', 'error')
      return false
    }
    commit((draft) => {
      draft.hazards.push({
        id: uid(),
        p: data.p,
        name: data.Hazard.trim(),
        task: data.Task.trim(),
        likelihood,
        severity,
        mandatory: true,
      })
    }, 'Hazard registered')
    flash('Hazard registered')
  }

  function addObservation(data: Record<string, string>) {
    const hours = Number(data.Hours)
    const cases = whole(data.Recordable)
    const dart = whole(data.DART)
    const near = whole(data['Near misses'])
    if (!data.p || !Number.isFinite(hours) || hours <= 0 || !Number.isInteger(cases) || !Number.isInteger(dart) || !Number.isInteger(near) || dart > cases) {
      flash('Require a project, positive hours, whole counts, and DART at or below recordables', 'error')
      return false
    }
    commit((draft) => {
      draft.obs.push({ id: uid(), p: data.p, period: data.Period, hours, cases, dart, near })
    }, 'Synthetic observation added')
    flash('Synthetic observation added')
  }

  return (
    <Screen>
      <Card title="Register a synthetic hazard">
        {db.projects.length === 0 ? (
          <p className="empty">Create a project in the registry before adding hazards.</p>
        ) : (
          <Form onSubmit={addHazard}>
            <ProjectField />
            <Field label="Hazard" name="Hazard" />
            <Field label="Task" name="Task" />
            <Field label="Likelihood" name="Likelihood" type="number" defaultValue={3} min="1" max="5" step="1" />
            <Field label="Severity" name="Severity" type="number" defaultValue={4} min="1" max="5" step="1" />
          </Form>
        )}
      </Card>
      <div className="split">
        <Card title="Ordinal hazard matrix">
          <table className="matrix">
            <thead>
              <tr>
                <th>Severity / likelihood</th>
                {[1, 2, 3, 4, 5].map((value) => (
                  <th key={value}>{value}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map((severity) => (
                <tr key={severity}>
                  <th>{severity}</th>
                  {[1, 2, 3, 4, 5].map((likelihood) => {
                    const score = severity * likelihood
                    const count = hazards.filter((hazard) => hazard.severity === severity && hazard.likelihood === likelihood).length
                    return (
                      <td key={likelihood} className={score >= 12 ? 'hot' : score >= 6 ? 'warm' : 'cool'}>
                        {count}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Ordinal research ratings only. These are not probability estimates or clearance criteria.</p>
        </Card>
        <Card title="Add exposure observation">
          {db.projects.length === 0 ? (
            <p className="empty">Create a project before recording exposure.</p>
          ) : (
            <Form onSubmit={addObservation}>
              <ProjectField />
              <Field label="Period" name="Period" type="month" defaultValue="2026-01" />
              <Field label="Hours" name="Hours" type="number" defaultValue={8000} min="1" />
              <Field label="Recordable" name="Recordable" type="number" defaultValue={0} min="0" step="1" />
              <Field label="DART" name="DART" type="number" defaultValue={0} min="0" step="1" />
              <Field label="Near misses" name="Near misses" type="number" defaultValue={0} min="0" step="1" />
            </Form>
          )}
        </Card>
      </div>
      <Card title="Hazard register">
        <Table
          head={['Project', 'Task', 'Hazard', 'Likelihood', 'Severity', 'Rating']}
          rows={hazards.map((hazard) => {
            const rating = hazard.likelihood * hazard.severity
            return [
              projectName(hazard.p),
              hazard.task,
              hazard.name,
              hazard.likelihood,
              hazard.severity,
              <Tag key={hazard.id} tone={rating >= 12 ? 'bad' : ''}>
                {rating}
              </Tag>,
            ]
          })}
        />
      </Card>
    </Screen>
  )
}
