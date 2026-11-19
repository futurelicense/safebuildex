import { PHASES } from '../lib/catalog'
import { uid } from '../lib/format'
import { useStore } from '../lib/store'
import { Card, Field, Form, Screen, SelectField, Table } from '../components/ui'

export function Projects() {
  const { db, commit, flash, setScope, setPage } = useStore()

  function addProject(data: Record<string, string>) {
    const name = data.Name.trim()
    const location = data.Location.trim()
    if (!name || !location) {
      flash('Enter a project name and location', 'error')
      return false
    }
    commit((draft) => {
      draft.projects.push({ id: uid(), name, location, phase: data.Phase, target: 80 })
    }, `Project created: ${name}`)
    flash(`Project created: ${name}`)
  }

  return (
    <Screen>
      <Card title="Register a fictional project">
        <Form onSubmit={addProject}>
          <Field label="Name" name="Name" />
          <Field label="Location" name="Location" />
          <SelectField label="Phase" name="Phase" options={PHASES} />
        </Form>
      </Card>
      <Card title="Project registry">
        <Table
          head={['ID', 'Project', 'Location', 'Phase', 'Explore']}
          empty="No projects yet. Register a fictional project to begin."
          rows={db.projects.map((project) => [
            project.id,
            project.name,
            project.location,
            project.phase,
            <button
              key={project.id}
              className="btn secondary small"
              onClick={() => {
                setScope(project.id)
                setPage(3)
              }}
            >
              Open
            </button>,
          ])}
        />
      </Card>
    </Screen>
  )
}
