import type { Observation, Project } from './types'
import { uid } from './format'

export function parseExposureImport(text: string, projects: Project[], existing: Observation[]) {
  const parsed: unknown = JSON.parse(text)
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('Expected nonempty array')
  const projectIds = new Set(projects.map((project) => project.id))
  const rows: Observation[] = parsed.map((row) => {
    const record = row as Record<string, unknown>
    const { p: project, period, hours, cases, dart, near } = record
    if (typeof project !== 'string' || !projectIds.has(project)) throw new Error('Invalid project, period, hours or counts')
    if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Invalid project, period, hours or counts')
    if (typeof hours !== 'number' || typeof cases !== 'number' || typeof dart !== 'number' || typeof near !== 'number') {
      throw new Error('Invalid project, period, hours or counts')
    }
    if (![hours, cases, dart, near].every((value) => Number.isFinite(value) && value >= 0) || hours <= 0 || dart > cases) {
      throw new Error('Invalid project, period, hours or counts')
    }
    if (![cases, dart, near].every((value) => Number.isInteger(value))) throw new Error('Invalid project, period, hours or counts')
    return { id: uid(), p: project, period, hours, cases, dart, near }
  })
  const keys = new Set(existing.map((row) => `${row.p}|${row.period}`))
  for (const row of rows) {
    const key = `${row.p}|${row.period}`
    if (keys.has(key)) throw new Error('Duplicate project/month')
    keys.add(key)
  }
  return rows
}
