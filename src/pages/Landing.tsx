const SITES = [
  ['Cedar Green Office', 'Structural', 'Austin'],
  ['Harbor Transit Annex', 'Excavation', 'Seattle'],
  ['Summit Learning Center', 'Envelope', 'Charlotte'],
  ['Riverbend Retrofit', 'Mechanical', 'Denver'],
]

const MONTHS = [2, 1, 4, 3, 2, 5, 1, 3, 4, 2, 3, 3]

export function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="gate">
      <header className="gate-bar">
        <strong>
          <span aria-hidden="true">◈</span> SAFE-BUILD <em>V2</em>
        </strong>
        <nav className="gate-nav">
          <a href="#method">Method</a>
          <a href="#forecast">Forecast</a>
          <a href="#modules">Modules</a>
          <button className="btn" type="button" onClick={onSignIn}>
            Sign in
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="landing-kicker">Occupational safety intelligence</p>
          <h1>See the next month before the crew is on the deck.</h1>
          <p>
            SAFE-BUILD turns a project’s hours and recordable history into a forecast, then keeps required protections in place while you compare what else the budget can carry.
          </p>
          <div className="hero-actions">
            <button className="btn" type="button" onClick={onSignIn}>
              Open the workspace
            </button>
            <a className="hero-link" href="#forecast">
              See a worked forecast
            </a>
          </div>
        </div>
        <div className="preview" aria-label="Demo workspace snapshot">
          <div className="preview-top">
            <span>Demo workspace</span>
            <span>4 projects · 2025</span>
          </div>
          <div className="preview-metrics">
            <div>
              <small>TRIR</small>
              <strong>12.12</strong>
            </div>
            <div>
              <small>DART</small>
              <strong>3.31</strong>
            </div>
            <div>
              <small>Hours</small>
              <strong>544,560</strong>
            </div>
          </div>
          <div className="preview-chart" aria-hidden="true">
            {MONTHS.map((value, index) => (
              <i key={index} style={{ height: `${value * 16}%` }} />
            ))}
          </div>
          <ul>
            {SITES.map(([name, phase, city]) => (
              <li key={name}>
                <span>{name}</span>
                <em>
                  {phase} · {city}
                </em>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="method" id="method">
        <div className="band">
          <p className="landing-kicker">The method</p>
          <h2>One path from the site register to a signed review.</h2>
          <ol>
            <li>
              <small>01</small>
              <h3>Model</h3>
              <p>Projects, tasks, and hazards, with worker-hours attached to every month.</p>
            </li>
            <li>
              <small>02</small>
              <h3>Predict</h3>
              <p>An expected recordable count for the hours ahead, plus a seeded stress case.</p>
            </li>
            <li>
              <small>03</small>
              <h3>Optimize</h3>
              <p>A control bundle that fits budget and staff. Required controls cannot be removed.</p>
            </li>
            <li>
              <small>04</small>
              <h3>Deliver</h3>
              <p>A reviewer rationale, an owner, a due date, and the closure evidence.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="forecast" id="forecast">
        <div className="band forecast-layout">
          <div>
            <p className="landing-kicker">Worked example</p>
            <h2>The forecast is the rate you already have, pointed at the hours you are about to work.</h2>
            <p>
              The demo portfolio recorded 33 cases across 544,560 hours. Ask for the next 10,000 hours and the expected count is 0.61, with an illustrative range of 0 to 1.89.
            </p>
            <p className="formula">33 recordables / 544,560 hours × 10,000 hours = 0.61</p>
          </div>
          <div className="forecast-points">
            <article>
              <h3>Scenario lab</h3>
              <p>Name the condition, set your own multiplier, and read the 50th, 80th, and 95th counts from 2,000 seeded draws. The same seed repeats the same result.</p>
            </article>
            <article>
              <h3>Controls stay mandatory</h3>
              <p>The solver searches the candidate library for the lowest residual index that still includes every required control and fits the budget and staff hours.</p>
            </article>
            <article>
              <h3>A person signs the plan</h3>
              <p>Nothing in the workspace clears work. A safety reviewer records the rationale before an action can be assigned or closed.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="band">
          <p className="landing-kicker">After you sign in</p>
          <h2>Twelve modules, already wired to the same record.</h2>
          <div className="module-groups">
            <div>
              <h3>Model</h3>
              <p>Data hub, project registry, hazard and exposure studio.</p>
            </div>
            <div>
              <h3>Predict</h3>
              <p>Historical-rate engine and the weather scenario lab.</p>
            </div>
            <div>
              <h3>Optimize</h3>
              <p>Control selection and sustainability, kept as separate measures.</p>
            </div>
            <div>
              <h3>Deliver</h3>
              <p>Review queue, local explanation, audit log, and the research brief.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="close">
        <div className="band close-inner">
          <h2>The workspace never leaves this browser.</h2>
          <p>Your passphrase, projects, forecasts, and review notes stay in local storage on this device. Signing out keeps the record where it is.</p>
          <button className="btn" type="button" onClick={onSignIn}>
            Sign in
          </button>
          <p className="landing-note">Synthetic research workspace. It does not clear work or replace qualified safety personnel.</p>
        </div>
      </section>
    </div>
  )
}
