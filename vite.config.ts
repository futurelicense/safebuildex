import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'

const MODEL = 'llama-3.3-70b-versatile'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 20_000) {
        reject(new Error('too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

function groqGateway(apiKey: string): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      send(res, 405, { mode: 'local', reason: 'Use POST.' })
      return
    }
    if (!apiKey) {
      send(res, 200, { mode: 'local', reason: 'GROQ_API_KEY is not set on the server. The engine reading is kept.' })
      return
    }
    let question = ''
    let context = ''
    try {
      const parsed: unknown = JSON.parse(await readBody(req))
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid')
      const record = parsed as { question?: unknown; context?: unknown }
      if (typeof record.question !== 'string' || typeof record.context !== 'string') throw new Error('invalid')
      question = record.question.trim()
      context = record.context
      if (!question || question.length > 2000 || context.length > 8000) throw new Error('invalid')
    } catch {
      send(res, 400, { mode: 'local', reason: 'The reading request was not accepted.' })
      return
    }
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content:
                'You explain a saved SAFE-BUILD result. Use only numbers that appear in CONTEXT, copied exactly. Do not compute a new forecast, rate, interval, percentile, or cost. Do not clear work, remove a required control, or replace a safety reviewer. If CONTEXT lacks a fact, say it is not in the saved run. Write at most two short paragraphs.',
            },
            { role: 'user', content: `QUESTION\n${question}\n\nCONTEXT\n${context}` },
          ],
        }),
      })
      const json = (await response.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } }
      const content = json.choices?.[0]?.message?.content?.trim()
      if (!response.ok || !content) {
        send(res, 200, { mode: 'local', reason: 'Groq did not return a reading. The engine reading is kept.' })
        return
      }
      send(res, 200, { mode: 'live', model: MODEL, content })
    } catch {
      send(res, 200, { mode: 'local', reason: 'Groq did not respond. The engine reading is kept.' })
    }
  }

  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/api/groq', (req, res) => {
      void handle(req, res)
    })
  }

  return { name: 'groq-gateway', configureServer: attach, configurePreviewServer: attach }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), groqGateway(env.GROQ_API_KEY ?? '')],
    base: './',
  }
})
