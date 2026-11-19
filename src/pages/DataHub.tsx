import { useRef } from 'react'
import { SOURCES } from '../lib/catalog'
import { download, now, sha256, shortDate, uid } from '../lib/format'
import { parseExposureImport } from '../lib/import'
import { useStore } from '../lib/store'
import { Card, Screen, Table, Tag } from '../components/ui'

export function DataHub() {
  const { db, observations, commit, flash } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  async function importFile() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      flash('Choose a JSON file', 'error')
      return
    }
    try {
      const text = await file.text()
      const rows = parseExposureImport(text, db.projects, db.obs)
      const hash = await sha256(text)
      commit((draft) => {
        draft.obs.push(...rows)
        draft.datasets.push({ id: uid(), name: file.name, mode: 'SYNTHETIC', rows: rows.length, date: now(), hash })
      }, `Imported ${rows.length} synthetic observations`)
      if (fileRef.current) fileRef.current.value = ''
      flash(`Imported ${rows.length} synthetic observations`)
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Import failed', 'error')
    }
  }

  return (
    <Screen>
      <Card title="Source catalog">
        <Table
          head={['Authority', 'Access', 'Status']}
          rows={SOURCES.map(([name, href, access]) => [
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              {name}
            </a>,
            access,
            <Tag key={`${name}-status`} tone="warn">
              Not connected
            </Tag>,
          ])}
        />
      </Card>
      <div className="split">
        <Card title="Import synthetic exposure data">
          <p className="muted">
            JSON array of aggregate observations, for example {`{"p":"P1","period":"2026-01","hours":8000,"cases":1,"dart":0,"near":4}`}. No personal or restricted information. Import rejects duplicates, invalid denominators, and missing values.
          </p>
          <input ref={fileRef} type="file" accept=".json,application/json" />
          <div className="toolbar">
            <button className="btn" onClick={importFile}>
              Validate & import
            </button>
            <button className="btn secondary" onClick={() => download('exposure.json', JSON.stringify(observations, null, 2))}>
              Export fixture
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                download(
                  'exposure-template.json',
                  JSON.stringify([{ p: db.projects[0]?.id ?? 'P1', period: '2026-01', hours: 8000, cases: 1, dart: 0, near: 4 }], null, 2),
                )
              }
            >
              Download template
            </button>
          </div>
        </Card>
        <Card title="Dataset snapshots">
          <Table
            head={['Dataset', 'Rows', 'Date', 'Hash']}
            empty="No dataset snapshots yet."
            rows={db.datasets.map((dataset) => [dataset.name, dataset.rows, shortDate(dataset.date), (dataset.hash || '').slice(0, 16)])}
          />
        </Card>
      </div>
    </Screen>
  )
}
