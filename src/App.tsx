import { Shell } from './components/Shell'
import { StoreProvider, useStore } from './lib/store'
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

function Workspace() {
  const { page } = useStore()
  const Page = PAGES[page] ?? Dashboard
  return (
    <Shell>
      <Page />
    </Shell>
  )
}

export function App() {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  )
}
