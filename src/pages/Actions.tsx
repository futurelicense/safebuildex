import { useState } from 'react'
import { now } from '../lib/format'
import { useStore } from '../lib/store'
import { Card, Screen, Table } from '../components/ui'

export function Actions() {
  const { db, actions, role, commit, flash } = useStore()
  const [decision, setDecision] = useState<{ id: string; status: string; note: string } | null>(null)
  const [assignment, setAssignment] = useState<{ id: string; owner: string; due: string } | null>(null)
  const [evidence, setEvidence] = useState<{ id: string; text: string } | null>(null)

  function saveDecision() {
    if (!decision?.note.trim()) {
      flash('Enter a review rationale', 'error')
      return
    }
    if (role !== 'Safety reviewer') {
      flash('Switch to the simulated Safety reviewer role', 'error')
      return
    }
    commit((draft) => {
      const review = draft.reviews.find((item) => item.id === decision.id)
      if (!review || review.status !== 'Submitted') return false
      review.status = decision.status
      review.note = decision.note.trim()
      review.date = now()
      if (decision.status === 'Approved for simulation') {
        const run = draft.runs.find((item) => item.id === review.run && item.kind === 'Optimization')
        if (run?.kind === 'Optimization') {
          run.selected?.forEach((control) => {
            draft.actions.push({
              id: `${review.id}-${control.id}`,
              name: control.name,
              p: review.scope,
              owner: 'Unassigned',
              due: '',
              status: 'Open',
              review: review.id,
              evidence: '',
            })
          })
        }
      }
    }, `Review ${decision.status}`)
    setDecision(null)
    flash(`Review recorded: ${decision.status}`)
  }

  function saveAssignment() {
    if (!assignment) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(assignment.due)) {
      flash('Enter a due date as YYYY-MM-DD', 'error')
      return
    }
    commit((draft) => {
      const action = draft.actions.find((item) => item.id === assignment.id)
      if (!action) return
      action.owner = assignment.owner.trim() || 'Unassigned'
      action.due = assignment.due
    }, 'Action assigned')
    setAssignment(null)
    flash('Action assigned')
  }

  function saveEvidence() {
    if (role !== 'Safety reviewer') {
      flash('Reviewer role required', 'error')
      return
    }
    if (!evidence?.text.trim()) {
      flash('Enter a synthetic closure evidence reference', 'error')
      return
    }
    commit((draft) => {
      const action = draft.actions.find((item) => item.id === evidence.id)
      if (!action) return
      action.evidence = evidence.text.trim()
      action.status = 'Verified (simulation)'
    }, 'Simulated control closure verified')
    setEvidence(null)
    flash('Simulated closure verified')
  }

  function reopen(id: string) {
    if (role !== 'Safety reviewer') {
      flash('Reviewer role required', 'error')
      return
    }
    commit((draft) => {
      const action = draft.actions.find((item) => item.id === id)
      if (action) action.status = 'Open'
    }, 'Control reopened')
    flash('Control reopened')
  }

  return (
    <Screen>
      <Card title="Review queue">
        <Table
          head={['Run', 'Status', 'Rationale', 'Review']}
          empty="No plans have been submitted."
          rows={db.reviews.map((review) => [
            review.run,
            review.status,
            review.note || '—',
            review.status === 'Submitted' && role === 'Safety reviewer' ? (
              <span className="row-actions" key={review.id}>
                <button className="btn small" onClick={() => setDecision({ id: review.id, status: 'Approved for simulation', note: '' })}>
                  Approve simulated plan
                </button>
                <button className="btn secondary small" onClick={() => setDecision({ id: review.id, status: 'Changes requested', note: '' })}>
                  Request changes
                </button>
              </span>
            ) : (
              '—'
            ),
          ])}
        />
        {decision ? (
          <div className="inline-form">
            <p>
              Recording <strong>{decision.status}</strong> for run {db.reviews.find((review) => review.id === decision.id)?.run}. This is a research record only.
            </p>
            <label>
              Rationale
              <textarea value={decision.note} onChange={(event) => setDecision({ ...decision, note: event.target.value })} />
            </label>
            <div className="toolbar">
              <button className="btn" onClick={saveDecision}>
                Save decision
              </button>
              <button className="btn secondary" onClick={() => setDecision(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Card>
      <Card title="Control action tracker">
        <Table
          head={['Control', 'Owner role', 'Due', 'State', 'Evidence', 'Actions']}
          rows={actions.map((action) => [
            action.name,
            action.owner,
            action.due || '—',
            action.status,
            action.evidence || '—',
            <span className="row-actions" key={action.id}>
              <button className="btn secondary small" onClick={() => setAssignment({ id: action.id, owner: action.owner, due: action.due })}>
                Assign
              </button>
              {role === 'Safety reviewer' ? (
                action.status === 'Open' ? (
                  <button className="btn small" onClick={() => setEvidence({ id: action.id, text: '' })}>
                    Verify
                  </button>
                ) : (
                  <button className="btn secondary small" onClick={() => reopen(action.id)}>
                    Reopen
                  </button>
                )
              ) : null}
            </span>,
          ])}
        />
        {assignment ? (
          <div className="inline-form">
            <div className="grid-form">
              <label>
                Responsible role (not a worker name)
                <input value={assignment.owner} onChange={(event) => setAssignment({ ...assignment, owner: event.target.value })} />
              </label>
              <label>
                Due date
                <input type="date" value={assignment.due} onChange={(event) => setAssignment({ ...assignment, due: event.target.value })} />
              </label>
            </div>
            <div className="toolbar">
              <button className="btn" onClick={saveAssignment}>
                Save assignment
              </button>
              <button className="btn secondary" onClick={() => setAssignment(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {evidence ? (
          <div className="inline-form">
            <label>
              Synthetic closure evidence reference
              <input value={evidence.text} onChange={(event) => setEvidence({ ...evidence, text: event.target.value })} />
            </label>
            <div className="toolbar">
              <button className="btn" onClick={saveEvidence}>
                Verify closure
              </button>
              <button className="btn secondary" onClick={() => setEvidence(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        <div className="notice">Role switching is simulated. Review and closure are research records only. No action changes real jobsite status or stop-work authority.</div>
      </Card>
    </Screen>
  )
}
