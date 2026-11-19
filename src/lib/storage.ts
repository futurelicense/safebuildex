import { seed } from './seed'
import type { Database, SpaceId } from './types'

const UI_KEY = 'safebuild-v2-ui'

export function storageKey(space: SpaceId) {
  return `safebuild-v2-${space}`
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== 'object') return false
  const record = value as Database
  return (
    Array.isArray(record.projects) &&
    Array.isArray(record.hazards) &&
    Array.isArray(record.obs) &&
    Array.isArray(record.env) &&
    Array.isArray(record.controls) &&
    Array.isArray(record.actions) &&
    Array.isArray(record.runs) &&
    Array.isArray(record.reviews) &&
    Array.isArray(record.audit) &&
    Array.isArray(record.datasets) &&
    !!record.model &&
    typeof record.model.version === 'number'
  )
}

export function loadSpace(space: SpaceId): Database {
  try {
    const raw = localStorage.getItem(storageKey(space))
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isDatabase(parsed)) return parsed
    }
  } catch {
    /* fall through to a fresh workspace */
  }
  const fresh = seed(space === 'blank')
  localStorage.setItem(storageKey(space), JSON.stringify(fresh))
  return fresh
}

export function persistSpace(space: SpaceId, db: Database) {
  localStorage.setItem(storageKey(space), JSON.stringify(db))
}

export interface UiState {
  space: SpaceId
  page: number
  scope: string
  role: string
}

export function loadUi(): UiState {
  const fallback: UiState = { space: 'demo', page: 0, scope: 'all', role: 'Analyst' }
  try {
    const raw = localStorage.getItem(UI_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<UiState>
    return {
      space: parsed.space === 'blank' ? 'blank' : 'demo',
      page: typeof parsed.page === 'number' && parsed.page >= 0 && parsed.page <= 11 ? parsed.page : 0,
      scope: typeof parsed.scope === 'string' ? parsed.scope : 'all',
      role: typeof parsed.role === 'string' ? parsed.role : 'Analyst',
    }
  } catch {
    return fallback
  }
}

export function persistUi(state: UiState) {
  localStorage.setItem(UI_KEY, JSON.stringify(state))
}
