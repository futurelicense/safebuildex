import { useEffect, useState } from 'react'
import { download, shortStamp } from '../lib/format'
import { storageKey } from '../lib/storage'
import { useStore } from '../lib/store'
import { Card, Screen, Table } from '../components/ui'

export function Governance() {
  const { db, role, space, commit, flash, resetSpace } = useStore()
  const [notes, setNotes] = useState(db.model.notes)
  useEffect(() => setNotes(db.model.notes), [db.model.notes, space])
  const bytes = new Blob([JSON.stringify(db)]).size

  function revise() {
    if (!notes.trim()) {
      flash('Enter research revision notes', 'error')
      return
    }
    commit((draft) => {
      draft.model = { version: draft.model.version + 1, method: 'Historical rate', notes: notes.trim() }
    }, 'Model revision registered')
    flash(`Model v${db.model.version + 1} registered locally`)
  }

  function reset() {
    if (!window.confirm('Reset only this workspace? All of its local edits will be lost.')) return
    resetSpace()
  }

  return (
    <Screen>
      <Card title="Model registry">
        <p>
          Version {db.model.version} · {db.model.method}
        </p>
        <p>{db.model.notes}</p>
        <label>
          Research revision notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="toolbar">
          <button className="btn" onClick={revise}>
            Register research revision
          </button>
        </div>
        <p className="muted">Version registration does not train or validate a model.</p>
      </Card>
      <div className="split">
        <Card title="Workspace policy">
          <p>Mode: synthetic only. No sensitive worker information.</p>
          <p>Role: {role} (simulated)</p>
          <p>
            Stored in localStorage as <code>{storageKey(space)}</code> · {bytes.toLocaleString('en-US')} bytes. Browser storage is editable by the device owner and is not secure institutional storage.
          </p>
          <div className="toolbar">
            <button className="btn secondary" onClick={() => download('safe-build-workspace.json', JSON.stringify(db, null, 2))}>
              Export workspace
            </button>
            <button className="btn danger" onClick={reset}>
              Reset this workspace
            </button>
          </div>
        </Card>
        <Card title="Audit history">
          <Table
            head={['Time', 'Actor role', 'Event']}
            empty="No local events yet."
            rows={db.audit.map((event) => [shortStamp(event.date), event.role, event.event])}
          />
        </Card>
      </div>
    </Screen>
  )
}
