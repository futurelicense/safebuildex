import { settleReading, type Reading } from './briefing'

type Live = { mode: 'live'; model: string; content: string }
type Local = { mode: 'local'; reason: string }

export async function askGroq(question: string, context: string): Promise<Live | Local> {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, context }),
    })
    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object') return { mode: 'local', reason: 'Groq did not return a reading.' }
    const record = payload as { mode?: string; content?: string; model?: string; reason?: string }
    if (record.mode === 'live' && typeof record.content === 'string' && record.content.trim()) {
      return { mode: 'live', model: record.model || 'groq', content: record.content }
    }
    return { mode: 'local', reason: record.reason || 'Groq did not return a reading.' }
  } catch {
    return { mode: 'local', reason: 'Groq did not respond. The engine reading is kept.' }
  }
}

/** Groq may narrate a saved engine result. A draft with any other number is discarded. */
export async function alignedReading(question: string, context: string, fallback: string): Promise<Reading> {
  const live = await askGroq(question, context)
  if (live.mode !== 'live') return settleReading(null, context, fallback, live.reason)
  return settleReading(live.content, context, fallback)
}
