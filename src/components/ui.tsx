import type { FormEvent, ReactNode } from 'react'
import { PAGE_TITLES } from '../lib/catalog'
import { fmt } from '../lib/format'
import { aggregate } from '../lib/analytics'
import { useStore } from '../lib/store'

export function Screen({ children }: { children: ReactNode }) {
  const { page, scope, db, observations, projectName, space } = useStore()
  const totals = aggregate(observations)
  return (
    <section>
      <div className="banner no-print">
        SYNTHETIC RESEARCH / {space === 'demo' ? 'DEMO' : 'BLANK'} WORKSPACE · Not live safety monitoring, work clearance, or a substitute for qualified safety personnel. For an actual emergency, follow site procedures and contact emergency services.
      </div>
      <h1>{PAGE_TITLES[page]}</h1>
      <p className="lede">
        {scope === 'all' ? 'Portfolio scope' : projectName(scope)} · Model v{db.model.version} · Stored in this browser · {observations.length} exposure observations · {fmt(totals.h)} worker-hours
      </p>
      {children}
      <footer>SAFE-BUILD V2.0 · Local workspace · Model → Predict → Optimize → Deliver · No agency endorsement or validated outcome is claimed.</footer>
    </section>
  )
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function Metric({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="card metric-card">
      <div className="muted">{label}</div>
      <div className="metric">{value}</div>
      {note ? <div className="muted">{note}</div> : null}
    </div>
  )
}

export function Table({ head, rows, empty = 'No records in this scope.' }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="empty" colSpan={head.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function BarChart({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  if (!rows.length) return <p className="empty">No observations in this scope.</p>
  return (
    <div className="chart" aria-hidden="true">
      {rows.map((row, index) => (
        <div className="col" key={`${row.label}-${index}`}>
          <span>{fmt(row.value)}</span>
          <i style={{ height: `${Math.max(4, (row.value / max) * 100)}%` }} />
          <span>{row.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  min,
  max,
  step,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | number
  min?: string
  max?: string
  step?: string
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} defaultValue={defaultValue} min={min} max={max} step={step} required />
    </label>
  )
}

export function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: string[] }) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={defaultValue ?? options[0]} required>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

export function ProjectField() {
  const { db } = useStore()
  return (
    <label>
      Project
      <select name="p" required>
        {db.projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Form({
  children,
  submitLabel = 'Save',
  onSubmit,
}: {
  children: ReactNode
  submitLabel?: string
  onSubmit: (data: Record<string, string>) => void | false
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    if (onSubmit(data) !== false) event.currentTarget.reset()
  }
  return (
    <form className="grid-form" autoComplete="off" onSubmit={handleSubmit}>
      {children}
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

export function Tag({ children, tone = '' }: { children: ReactNode; tone?: '' | 'warn' | 'bad' }) {
  return <span className={`tag ${tone}`}>{children}</span>
}
