export type Role = 'Analyst' | 'Safety reviewer' | 'Site supervisor' | 'Executive'
export type SpaceId = 'demo' | 'blank'

export interface Project {
  id: string
  name: string
  location: string
  phase: string
  target: number
}

export interface Hazard {
  id: string
  p: string
  name: string
  task: string
  likelihood: number
  severity: number
  mandatory: boolean
}

export interface Observation {
  id: string
  p: string
  period: string
  hours: number
  cases: number
  dart: number
  near: number
}

export interface EnvObs {
  id: string
  p: string
  period: string
  energy: number
  water: number
  waste: number
  diverted: number
}

export interface Control {
  id: string
  name: string
  type: string
  mandatory: boolean
  cost: number
  staff: number
  effect: number
}

export interface ActionItem {
  id: string
  name: string
  p: string
  owner: string
  due: string
  status: string
  review: string
  evidence: string
}

export interface ForecastRun {
  id: string
  kind: 'Forecast'
  scope: string
  version: number
  date: string
  hours: number
  mu: number
  lower: number
  upper: number
  inputs: Observation[]
  note: string
  reading?: string
  readingSource?: 'engine' | 'groq'
  readingNote?: string
}

export interface ScenarioRun {
  id: string
  kind: 'Scenario'
  scope: string
  date: string
  version: number
  hours: number
  factor: number
  seed: number
  weather: string
  mu: number
  p50: number
  p80: number
  p95: number
  counts: [number, number][]
  inputs: Observation[]
  reading?: string
  readingSource?: 'engine' | 'groq'
  readingNote?: string
}

export interface OptimizationRun {
  id: string
  kind: 'Optimization'
  date: string
  scope: string
  version: number
  budget: number
  capacity: number
  feasible: boolean
  selected?: Control[]
  cost?: number
  staff?: number
  residual?: number
  inputs: Control[]
}

export type Run = ForecastRun | ScenarioRun | OptimizationRun

export interface Review {
  id: string
  run: string
  scope: string
  status: string
  note: string
  date: string
}

export interface AuditEvent {
  id: string
  date: string
  role: string
  event: string
}

export interface DatasetSnap {
  id: string
  name: string
  mode: string
  rows: number
  date: string
  hash: string
}

export interface ModelInfo {
  version: number
  method: string
  notes: string
}

export interface Database {
  projects: Project[]
  hazards: Hazard[]
  obs: Observation[]
  env: EnvObs[]
  controls: Control[]
  actions: ActionItem[]
  runs: Run[]
  reviews: Review[]
  audit: AuditEvent[]
  datasets: DatasetSnap[]
  model: ModelInfo
}

export interface Toast {
  id: string
  text: string
  tone: 'ok' | 'error'
}
