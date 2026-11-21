import { useEffect, useState } from 'react'

const STATIONS = [
  {
    id: 'path',
    rail: 'Path',
    kicker: 'The system',
    title: 'Four stages share one record.',
    line: 'Model the month, point the historical rate ahead, keep required controls, then a person signs.',
    page: 0,
    open: 'Open the dashboard',
  },
  {
    id: 'model',
    rail: 'Model',
    kicker: '01 · Model',
    title: 'Every month carries hours and cases.',
    line: 'Four demo sites, twelve months each, become one portfolio ledger. Hazards stay attached to the task that creates them.',
    page: 3,
    open: 'Open the exposure studio',
  },
  {
    id: 'forecast',
    rail: 'Forecast',
    kicker: '02 · Predict',
    title: 'The forecast is that rate, pointed ahead.',
    line: 'Expected count = recordable cases ÷ worker-hours × the hours you are about to work. The band is an illustration, not a calibrated site prediction.',
    page: 4,
    open: 'Open the forecast',
  },
  {
    id: 'scenario',
    rail: 'Scenario',
    kicker: '02 · Predict',
    title: 'A stress case multiplies the same rate.',
    line: 'You name the condition and choose the multiplier. Two thousand seeded draws then give the 50th, 80th, and 95th counts. The same seed repeats.',
    page: 5,
    open: 'Open the scenario lab',
  },
  {
    id: 'optimize',
    rail: 'Controls',
    kicker: '03 · Optimize',
    title: 'Required controls cannot be removed.',
    line: 'The solver searches every candidate bundle. A bundle that drops a required control is never eligible, even when it would cost less.',
    page: 6,
    open: 'Open control selection',
  },
  {
    id: 'deliver',
    rail: 'Sign-off',
    kicker: '04 · Deliver',
    title: 'A person signs. Groq only reads the card.',
    line: 'The count stays the engine result. Groq may repeat the numbers on the saved run. A draft that introduces another number is discarded.',
    page: 8,
    open: 'Open the review center',
  },
] as const

const SITES = [
  ['Cedar Green Office', 'Austin', '118,140', '8'],
  ['Harbor Transit Annex', 'Seattle', '130,140', '8'],
  ['Summit Learning Center', 'Charlotte', '142,140', '8'],
  ['Riverbend Retrofit', 'Denver', '154,140', '9'],
]

const DRAWS = [
  [0, 787],
  [1, 730],
  [2, 351],
  [3, 107],
  [4, 23],
  [5, 2],
]

export function Tour({
  onClose,
  onOpen,
  onSignIn,
}: {
  onClose: () => void
  onOpen?: (page: number) => void
  onSignIn?: () => void
}) {
  const [step, setStep] = useState(0)
  const station = STATIONS[step]

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setStep((current) => Math.min(current + 1, STATIONS.length - 1))
      if (event.key === 'ArrowLeft') setStep((current) => Math.max(current - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <header className="tour-bar">
        <strong>
          <span aria-hidden="true">◈</span> How SAFE-BUILD works
        </strong>
        <button className="tour-close" type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="tour-rail" role="tablist" aria-label="Tour stages">
        {STATIONS.map((item, index) => (
          <button key={item.id} type="button" role="tab" aria-selected={index === step} className={index === step ? 'on' : ''} onClick={() => setStep(index)}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            {item.rail}
          </button>
        ))}
      </div>
      <div className="tour-stage">
        <div className="tour-copy">
          <p className="landing-kicker">{station.kicker}</p>
          <h1 id="tour-title">{station.title}</h1>
          <p>{station.line}</p>
        </div>
        <div className="tour-board" key={station.id}>
          {station.id === 'path' ? <PathBoard /> : null}
          {station.id === 'model' ? <ModelBoard /> : null}
          {station.id === 'forecast' ? <ForecastBoard /> : null}
          {station.id === 'scenario' ? <ScenarioBoard /> : null}
          {station.id === 'optimize' ? <OptimizeBoard /> : null}
          {station.id === 'deliver' ? <DeliverBoard /> : null}
        </div>
      </div>
      <footer className="tour-foot">
        <button className="btn secondary" type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
          Back
        </button>
        <span>
          {step + 1} of {STATIONS.length}
        </span>
        <div className="tour-actions">
          {onOpen ? (
            <button className="btn secondary" type="button" onClick={() => onOpen(station.page)}>
              {station.open}
            </button>
          ) : null}
          {onSignIn && !onOpen ? (
            <button className="btn secondary" type="button" onClick={onSignIn}>
              Sign in
            </button>
          ) : null}
          {step < STATIONS.length - 1 ? (
            <button className="btn" type="button" onClick={() => setStep((current) => current + 1)}>
              Next
            </button>
          ) : (
            <button className="btn" type="button" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

function PathBoard() {
  const stages = [
    ['01', 'Model', 'Register, hazards, monthly hours'],
    ['02', 'Predict', 'Historical rate and a seeded stress case'],
    ['03', 'Optimize', 'Budget, staff, required controls'],
    ['04', 'Deliver', 'Reviewer, owner, evidence'],
  ]
  return (
    <div className="tour-path" aria-label="Model, predict, optimize, deliver">
      {stages.map(([step, name, detail]) => (
        <article key={step}>
          <b>{step}</b>
          <h3>{name}</h3>
          <p>{detail}</p>
        </article>
      ))}
    </div>
  )
}

function ModelBoard() {
  return (
    <div className="tour-model">
      <ul>
        {SITES.map(([name, city, hours, cases]) => (
          <li key={name}>
            <span>
              <strong>{name}</strong>
              <em>{city}</em>
            </span>
            <span>
              {hours} h<small>{cases} cases</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="tour-join" aria-hidden="true">
        →
      </div>
      <div className="tour-ledger">
        <small>Portfolio · 2025</small>
        <strong>544,560</strong>
        <em>worker-hours</em>
        <strong>33</strong>
        <em>recordable cases</em>
        <p>48 monthly observations. One rate for the whole scope.</p>
      </div>
      <div className="tour-hazards">
        {['Falls · Roofing', 'Heat · Outdoor shift', 'Struck-by · Material handling', 'Electrical · Installation', 'Dust · Cutting'].map((hazard) => (
          <span key={hazard}>{hazard}</span>
        ))}
      </div>
    </div>
  )
}

function ForecastBoard() {
  return (
    <div className="tour-forecast">
      <div className="tour-eq" aria-label="33 recordables divided by 544,560 hours, times 10,000 hours, equals 0.61">
        <div>
          <small>Recordables</small>
          <strong>33</strong>
        </div>
        <span>÷</span>
        <div>
          <small>Worker-hours</small>
          <strong>544,560</strong>
        </div>
        <span>×</span>
        <div>
          <small>Hours ahead</small>
          <strong>10,000</strong>
        </div>
        <span>=</span>
        <div className="is-result">
          <small>Expected count</small>
          <strong>0.61</strong>
        </div>
      </div>
      <div className="tour-ruler">
        <div className="tour-track">
          <i style={{ left: '32.3%' }} />
        </div>
        <div className="tour-scale">
          <span>0</span>
          <span className="tour-mid">0.61</span>
          <span>1.89</span>
        </div>
      </div>
      <p>Illustrative interval for those 10,000 hours. The lower end is floored at 0.</p>
    </div>
  )
}

function ScenarioBoard() {
  return (
    <div className="tour-scenario">
      <div className="tour-mult">
        <div>
          <small>Saved rate</small>
          <strong>0.61</strong>
        </div>
        <span>×</span>
        <div>
          <small>Your multiplier</small>
          <strong>1.5</strong>
        </div>
        <span>=</span>
        <div className="is-result">
          <small>Expected count</small>
          <strong>0.91</strong>
        </div>
        <em>Illustrative high heat · a label, not a threshold</em>
      </div>
      <div className="tour-draws" aria-label="Two thousand seeded draws. P50 is 1, P80 is 2, P95 is 3.">
        <div className="tour-bars">
          {DRAWS.map(([bucket, count]) => (
            <div key={bucket}>
              <b>{count}</b>
              <i style={{ height: `${Math.max(8, (count / 787) * 100)}%` }} />
              <span>{bucket}</span>
              {bucket === 1 ? <em>P50</em> : null}
              {bucket === 2 ? <em>P80</em> : null}
              {bucket === 3 ? <em>P95</em> : null}
            </div>
          ))}
        </div>
        <p>2,000 draws · seed 42 · counts of 0 through 5</p>
      </div>
    </div>
  )
}

function OptimizeBoard() {
  const rows = [
    ['C1', 'Required protection', 'Locked in', '4,500'],
    ['C2', 'Required inspection', 'Locked in', '1,200'],
    ['C5', 'Task redesign', 'Chosen', '5,200'],
    ['C3', 'Engineering isolation', 'Left out', '3,500'],
    ['C4', 'Exposure monitoring', 'Left out', '1,800'],
  ]
  return (
    <div className="tour-opt">
      <ul>
        {rows.map(([id, name, state, cost]) => (
          <li key={id} className={state === 'Left out' ? 'out' : state === 'Locked in' ? 'lock' : 'pick'}>
            <b>{id}</b>
            <span>{name}</span>
            <em>{state}</em>
            <small>${cost}</small>
          </li>
        ))}
      </ul>
      <div className="tour-meters">
        <Meter label="Budget" value="10,900 of 12,000" width="90.8%" />
        <Meter label="Staff hours" value="21 of 25" width="84%" />
        <Meter label="Residual index" value="46.8 · baseline 100" width="46.8%" />
      </div>
    </div>
  )
}

function Meter({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <span>
        {label}
        <em>{value}</em>
      </span>
      <i>
        <b style={{ width }} />
      </i>
    </div>
  )
}

function DeliverBoard() {
  return (
    <div className="tour-deliver">
      <article>
        <small>Saved forecast</small>
        <strong>0.61</strong>
        <p>Interval 0 to 1.89 · model v1</p>
        <div className="tour-sign">
          <b>Safety reviewer</b>
          <span>Rationale, owner, due date, evidence</span>
        </div>
      </article>
      <article>
        <small>Groq reads the card</small>
        <p className="kept">
          <b>0.61</b> kept
        </p>
        <p className="dropped">
          <b>4</b> discarded
        </p>
        <p>Only numbers already on the saved run may remain.</p>
      </article>
      <p className="tour-local">The passphrase, the projects, and this run stay in this browser.</p>
    </div>
  )
}
