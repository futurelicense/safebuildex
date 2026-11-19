import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadSpace, loadUi, persistSpace, persistUi } from './storage'
import { seed } from './seed'
import { uid, now } from './format'
import type { ActionItem, Database, EnvObs, Hazard, Observation, Role, SpaceId, Toast } from './types'

interface Store {
  space: SpaceId
  page: number
  scope: string
  role: Role
  db: Database
  toast: Toast | null
  report: string
  observations: Observation[]
  hazards: Hazard[]
  env: EnvObs[]
  actions: ActionItem[]
  setPage: (page: number) => void
  setScope: (scope: string) => void
  setRole: (role: Role) => void
  changeSpace: (space: SpaceId) => void
  projectName: (id: string) => string
  commit: (recipe: (draft: Database) => void, event?: string) => void
  resetSpace: () => void
  flash: (text: string, tone?: Toast['tone']) => void
  setReport: (report: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = loadUi()
  const [space, setSpace] = useState<SpaceId>(initial.space)
  const [page, setPage] = useState(initial.page)
  const [scope, setScopeState] = useState(initial.scope)
  const [role, setRole] = useState<Role>((['Analyst', 'Safety reviewer', 'Site supervisor', 'Executive'] as const).includes(initial.role as Role) ? (initial.role as Role) : 'Analyst')
  const [db, setDb] = useState<Database>(() => loadSpace(initial.space))
  const [toast, setToast] = useState<Toast | null>(null)
  const [report, setReport] = useState('')
  const spaceRef = useRef(space)
  const roleRef = useRef(role)
  spaceRef.current = space
  roleRef.current = role

  useEffect(() => {
    persistUi({ space, page, scope, role })
  }, [space, page, scope, role])

  useEffect(() => {
    try {
      persistSpace(space, db)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'storage unavailable'
      setToast({ id: uid(), text: `Local storage unavailable: ${message}`, tone: 'error' })
    }
  }, [space, db])

  useEffect(() => {
    if (scope !== 'all' && !db.projects.some((project) => project.id === scope)) setScopeState('all')
  }, [db.projects, scope])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  const flash = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    setToast({ id: uid(), text, tone })
  }, [])

  const commit = useCallback((recipe: (draft: Database) => boolean | void, event?: string) => {
    setDb((current) => {
      const next = structuredClone(current)
      if (recipe(next) === false) return current
      if (event) next.audit.unshift({ id: uid(), date: now(), role: roleRef.current, event })
      return next
    })
  }, [])

  const setScope = useCallback((next: string) => {
    setScopeState(next)
    setReport('')
  }, [])

  const changeSpace = useCallback((next: SpaceId) => {
    setSpace(next)
    setDb(loadSpace(next))
    setScopeState('all')
    setReport('')
  }, [])

  const resetSpace = useCallback(() => {
    const fresh = seed(spaceRef.current === 'blank')
    fresh.audit.unshift({ id: uid(), date: now(), role: roleRef.current, event: 'Workspace reset' })
    setDb(fresh)
    setScopeState('all')
    setReport('')
    flash('Workspace reset on this device')
  }, [flash])

  const projectName = useCallback(
    (id: string) => (id === 'all' ? 'All projects' : db.projects.find((project) => project.id === id)?.name || id),
    [db.projects],
  )

  const observations = useMemo(() => db.obs.filter((row) => scope === 'all' || row.p === scope), [db.obs, scope])
  const hazards = useMemo(() => db.hazards.filter((row) => scope === 'all' || row.p === scope), [db.hazards, scope])
  const env = useMemo(() => db.env.filter((row) => scope === 'all' || row.p === scope), [db.env, scope])
  const actions = useMemo(
    () => db.actions.filter((row) => scope === 'all' || row.p === scope || row.p === 'all'),
    [db.actions, scope],
  )

  const value = useMemo<Store>(
    () => ({
      space,
      page,
      scope,
      role,
      db,
      toast,
      report,
      observations,
      hazards,
      env,
      actions,
      setPage,
      setScope,
      setRole,
      changeSpace,
      projectName,
      commit,
      resetSpace,
      flash,
      setReport,
    }),
    [space, page, scope, role, db, toast, report, observations, hazards, env, actions, setScope, changeSpace, projectName, commit, resetSpace, flash],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('SAFE-BUILD store is unavailable')
  return store
}
