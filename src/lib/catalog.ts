export const NAV = [
  { kind: 'label', text: 'Command center' },
  { kind: 'page', page: 0, title: 'Executive dashboard' },
  { kind: 'label', text: '01 · Model' },
  { kind: 'page', page: 1, title: 'Data integration hub' },
  { kind: 'page', page: 2, title: 'Project & site registry' },
  { kind: 'page', page: 3, title: 'Hazard & exposure studio' },
  { kind: 'label', text: '02 · Predict' },
  { kind: 'page', page: 4, title: 'Predictive safety engine' },
  { kind: 'page', page: 5, title: 'Weather & scenario lab' },
  { kind: 'label', text: '03 · Optimize' },
  { kind: 'page', page: 6, title: 'Control optimization' },
  { kind: 'page', page: 7, title: 'Sustainability analytics' },
  { kind: 'label', text: '04 · Deliver' },
  { kind: 'page', page: 8, title: 'Action & review center' },
  { kind: 'label', text: 'Governance & intelligence' },
  { kind: 'page', page: 9, title: 'Groq AI copilot' },
  { kind: 'page', page: 10, title: 'Governance & audit' },
  { kind: 'page', page: 11, title: 'Reports & validation' },
] as const

export const PAGE_TITLES = [
  'Executive dashboard',
  'Data integration hub',
  'Project & site registry',
  'Hazard & exposure studio',
  'Predictive safety engine',
  'Weather & scenario lab',
  'Control optimization',
  'Sustainability analytics',
  'Action & review center',
  'Groq AI copilot',
  'Governance & audit',
  'Reports & validation',
]

export const SOURCES: [string, string, string][] = [
  ['OSHA data', 'https://www.osha.gov/data', 'File download'],
  ['BLS IIF', 'https://www.bls.gov/iif/', 'File download / API candidate'],
  ['NOAA NWS', 'https://www.weather.gov/documentation/services-web-api', 'API candidate'],
  ['NOAA NCEI', 'https://www.ncei.noaa.gov/access/search/documentation/data-service/', 'API candidate'],
  ['EPA ENERGY STAR', 'https://www.energystar.gov/buildings', 'Public benchmark'],
  ['NIOSH hierarchy', 'https://www.cdc.gov/niosh/hierarchy-of-controls/about/index.html', 'Reference'],
  ['OSHA construction standards', 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926', 'Reference'],
  ['Groq', 'https://console.groq.com/docs/', 'Server gateway required'],
]

export const PHASES = ['Excavation', 'Structural', 'Envelope', 'Mechanical', 'Commissioning']
export const HIERARCHY = ['Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']
export const ROLES = ['Analyst', 'Safety reviewer', 'Site supervisor', 'Executive'] as const

export const FLOW = [
  { label: 'Model', page: 3, step: '01' },
  { label: 'Predict', page: 4, step: '02' },
  { label: 'Optimize', page: 6, step: '03' },
  { label: 'Deliver', page: 8, step: '04' },
]
