export function fmt(value: number) {
  return Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'N/A'
}

export function money(value: number) {
  return `$${fmt(value)}`
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function now() {
  return new Date().toISOString()
}

export function shortDate(iso: string) {
  return iso ? iso.slice(0, 10) : ''
}

export function shortStamp(iso: string) {
  return iso ? iso.slice(0, 19).replace('T', ' ') : ''
}

export function download(name: string, data: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [keys.join(','), ...rows.map((row) => keys.map((key) => cell(row[key])).join(','))].join('\n')
}

export async function sha256(text: string) {
  if (!crypto.subtle) return 'Unavailable'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
