import { useState } from 'react'
import { Shell } from './components/Shell'
import { loadSession, signOut, type Session } from './lib/auth'
import { StoreProvider, useStore } from './lib/store'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Tour } from './pages/Tour'
import { Actions } from './pages/Actions'
import { Copilot } from './pages/Copilot'
import { Dashboard } from './pages/Dashboard'
import { DataHub } from './pages/DataHub'
import { Forecast } from './pages/Forecast'
import { Governance } from './pages/Governance'
import { Hazards } from './pages/Hazards'
import { Optimize } from './pages/Optimize'
import { Projects } from './pages/Projects'
import { Reports } from './pages/Reports'
import { Scenario } from './pages/Scenario'
import { Sustainability } from './pages/Sustainability'

const PAGES = [Dashboard, DataHub, Projects, Hazards, Forecast, Scenario, Optimize, Sustainability, Actions, Copilot, Governance, Reports]

function Workspace({ person, onLogout }: { person: string; onLogout: () => void }) {
  const { page, setPage } = useStore()
  const [tour, setTour] = useState(false)
  const Page = PAGES[page] ?? Dashboard
  return (
    <Shell person={person} onLogout={onLogout} onTour={() => setTour(true)}>
      <Page />
      {tour ? (
        <Tour
          onClose={() => setTour(false)}
          onOpen={(next) => {
            setPage(next)
            setTour(false)
          }}
        />
      ) : null}
    </Shell>
  )
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [gate, setGate] = useState<'landing' | 'login' | 'tour'>('landing')
  if (!session) {
    if (gate === 'login') return <Login onBack={() => setGate('landing')} onEnter={(name) => setSession({ name })} />
    if (gate === 'tour') return <Tour onClose={() => setGate('landing')} onSignIn={() => setGate('login')} />
    return <Landing onSignIn={() => setGate('login')} onTour={() => setGate('tour')} />
  }
  return (
    <StoreProvider>
      <Workspace
        person={session.name}
        onLogout={() => {
          signOut()
          setSession(null)
          setGate('landing')
        }}
      />
    </StoreProvider>
  )
}
