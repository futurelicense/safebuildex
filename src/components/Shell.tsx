import type { ReactNode } from 'react'
import { NAV, ROLES } from '../lib/catalog'
import { useStore } from '../lib/store'
import type { Role, SpaceId } from '../lib/types'

export function Shell({ children, person, onLogout }: { children: ReactNode; person: string; onLogout: () => void }) {
  const store = useStore()
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <span className="mark" aria-hidden="true">
            ◈
          </span>
          <div>
            <strong>
              SAFE-BUILD <em>V2</em>
            </strong>
            <small>Occupational safety intelligence</small>
          </div>
        </div>
        <nav>
          {NAV.map((item) =>
            item.kind === 'label' ? (
              <div className="nav-label" key={item.text}>
                {item.text}
              </div>
            ) : (
              <button key={item.page} className={store.page === item.page ? 'active' : ''} onClick={() => store.setPage(item.page)}>
                <span>{String(item.page + 1).padStart(2, '0')}</span>
                {item.title}
              </button>
            ),
          )}
        </nav>
        <small className="aside-foot">Research workspace · This browser only</small>
      </aside>
      <div className="main">
        <header className="no-print">
          <div className="header-title">
            <strong>Safety operations</strong>
            <span>Local workspace</span>
          </div>
          <label>
            Workspace
            <select value={store.space} onChange={(event) => store.changeSpace(event.target.value as SpaceId)}>
              <option value="demo">Demo workspace</option>
              <option value="blank">Blank workspace</option>
            </select>
          </label>
          <label>
            Project
            <select value={store.scope} onChange={(event) => store.setScope(event.target.value)}>
              <option value="all">All projects</option>
              {store.db.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select value={store.role} onChange={(event) => store.setRole(event.target.value as Role)}>
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <div className="session">
            <span>{person}</span>
            <button className="btn secondary" type="button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>
        {store.toast ? <div className={`toast ${store.toast.tone}`}>{store.toast.text}</div> : null}
        {children}
      </div>
    </div>
  )
}
