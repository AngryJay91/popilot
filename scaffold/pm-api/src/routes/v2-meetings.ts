import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET / - meeting minutes list
app.get('/', async (c) => {
  const { rows } = await queryOrThrow(
    `SELECT id, title,
      COALESCE(date, meeting_date) AS date,
      COALESCE(participants, attendees) AS participants,
      created_by, created_at
    FROM meetings ORDER BY COALESCE(date, meeting_date) DESC LIMIT 50`,
  )
  return c.json({ meetings: rows })
})

// GET /:id - meeting detail
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rows } = await queryOrThrow('SELECT * FROM meetings WHERE id = ?', [id])
  if (!rows.length) return c.json({ error: 'Meeting not found' }, 404)
  return c.json({ meeting: rows[0] })
})

// POST / - create meeting
app.post('/', async (c) => {
  const body = await c.req.json<{
    title: string; date: string; rawTranscript?: string
    summary?: string; agenda?: string; decisions?: string
    actionItems?: string; participants?: string
  }>()
  const createdBy = c.get('userName')

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO meetings (title, meeting_date, date, raw_transcript, summary, agenda, decisions, action_items, attendees, participants, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.title,
     body.date ?? null,         // meeting_date (legacy column)
     body.date ?? null,         // date (new column)
     body.rawTranscript ?? null,
     body.summary ?? null,
     body.agenda ?? null,
     body.decisions ?? null,
     body.actionItems ?? null,
     body.participants ?? null, // attendees (legacy column)
     body.participants ?? null, // participants (new column)
     createdBy],
  )
  return c.json({ ok: true }, 201)
})

// PATCH /:id - update meeting
app.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Record<string, unknown>>()
  const fieldMap: Record<string, string> = {
    title: 'title', date: 'date', rawTranscript: 'raw_transcript',
    summary: 'summary', agenda: 'agenda', decisions: 'decisions',
    actionItems: 'action_items', participants: 'participants',
  }
  const sets: string[] = []
  const args: (string | null)[] = []
  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) { sets.push(`${col} = ?`); args.push(body[key] as string ?? null) }
  }
  // Legacy column sync
  if (body.date !== undefined) { sets.push('meeting_date = ?'); args.push(body.date as string ?? null) }
  if (body.participants !== undefined) { sets.push('attendees = ?'); args.push(body.participants as string ?? null) }
  if (!sets.length) return c.json({ ok: true })
  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(String(id))
  await execute(`UPDATE meetings SET ${sets.join(', ')} WHERE id = ?`, args)
  return c.json({ ok: true })
})

// POST /:id/create-tasks - create tasks from action items
app.post('/:id/create-tasks', async (c) => {
  const id = Number(c.req.param('id'))
  const meeting = await query<{ action_items: string | null }>(
    'SELECT action_items FROM meetings WHERE id = ?', [id],
  )
  if (!meeting.rows.length) return c.json({ error: 'Meeting not found' }, 404)

  const actionItems = meeting.rows[0].action_items
  if (!actionItems) return c.json({ error: 'No action items' }, 400)

  // Split by lines and create stories
  const items = actionItems.split('\n').map(s => s.trim()).filter(Boolean)
  let created = 0
  for (const item of items) {
    await execute(
      'INSERT INTO pm_stories (title, description, status, priority) VALUES (?, ?, ?, ?)',
      [`[Meeting] ${item.slice(0, 60)}`, `Created from meeting #${id}.\n\n${item}`, 'backlog', 'medium'],
    )
    created++
  }

  return c.json({ ok: true, created })
})

// POST /:id/transcribe — audio file -> STT (Whisper)
app.post('/:id/transcribe', async (c) => {
  const id = Number(c.req.param('id'))

  // Get STT key from settings
  const settingsResult = await query(
    "SELECT key, value FROM settings WHERE key IN ('llm_api_key', 'llm_provider', 'stt_api_key')",
  )
  const sMap: Record<string, string> = {}
  for (const r of (settingsResult.rows ?? []) as Array<{ key: string; value: string }>) {
    sMap[r.key] = r.value
  }
  const sttKey = sMap.stt_api_key
  const llmKey = sMap.llm_api_key
  const provider = sMap.llm_provider || 'openai'

  let apiKey: string | undefined
  if (sttKey) {
    apiKey = sttKey
  } else if (provider === 'openai' && llmKey) {
    apiKey = llmKey
  }

  if (!apiKey) {
    return c.json({
      error: 'STT requires OpenAI Whisper. Set stt_api_key or OpenAI API key in /admin settings.'
    }, 400)
  }

  // Parse multipart/form-data
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'Audio file required' }, 400)

  // File size validation (25MB)
  if (file.size > 25 * 1024 * 1024) {
    return c.json({ error: 'File size exceeds 25MB' }, 413)
  }

  // Format validation
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext || '')) {
    return c.json({ error: 'Unsupported format. Supported: mp3, wav, m4a, webm, ogg' }, 400)
  }

  // Whisper API call
  const whisperForm = new FormData()
  whisperForm.append('file', file)
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('response_format', 'text')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: whisperForm,
  })

  if (!whisperRes.ok) {
    const errText = await whisperRes.text()
    return c.json({ error: `Whisper API failed: ${errText.slice(0, 200)}` }, 500)
  }

  const transcript = await whisperRes.text()

  // Save to DB
  await execute(
    'UPDATE meetings SET raw_transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [transcript, id],
  )

  return c.json({ ok: true, transcript })
})

// POST /:id/transcribe-chunk — segment STT (for live recording)
app.post('/:id/transcribe-chunk', async (c) => {
  const id = Number(c.req.param('id'))

  const settingsResult = await query(
    "SELECT key, value FROM settings WHERE key IN ('llm_api_key', 'llm_provider', 'stt_api_key')",
  )
  const sMap: Record<string, string> = {}
  for (const r of (settingsResult.rows ?? []) as Array<{ key: string; value: string }>) sMap[r.key] = r.value

  const sttKey = sMap.stt_api_key
  const provider = sMap.llm_provider || 'openai'
  const apiKey = sttKey || (provider === 'openai' ? sMap.llm_api_key : undefined)
  if (!apiKey) return c.json({ error: 'STT API key required' }, 400)

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'Audio file required' }, 400)

  const whisperForm = new FormData()
  whisperForm.append('file', file, 'chunk.webm')
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('response_format', 'text')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: whisperForm,
  })

  if (!res.ok) return c.json({ error: 'Whisper failed' }, 500)
  const text = await res.text()

  // Append to existing transcript
  const existing = await query('SELECT raw_transcript FROM meetings WHERE id = ?', [id])
  const prev = (existing.rows?.[0] as any)?.raw_transcript || ''
  await execute(
    'UPDATE meetings SET raw_transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [prev + ' ' + text, id],
  )

  return c.json({ ok: true, text })
})

// POST /:id/structurize — BYOM transcript structuring
app.post('/:id/structurize', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ apiKey?: string; model?: string; provider?: string }>()

  // Get API key, model, provider from settings
  const settingsResult = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key IN ('llm_api_key', 'llm_model', 'llm_provider', 'gemini_client_email', 'gemini_private_key')",
  )
  const sMap: Record<string, string> = {}
  for (const r of settingsResult.rows) sMap[r.key] = r.value

  const apiKey = body.apiKey ?? sMap.llm_api_key
  if (!apiKey) return c.json({ error: 'API key not configured. Set it in /admin settings.' }, 400)

  const meeting = await query<{ raw_transcript: string | null }>(
    'SELECT raw_transcript FROM meetings WHERE id = ?', [id],
  )
  if (!meeting.rows.length) return c.json({ error: 'Meeting not found' }, 404)
  if (!meeting.rows[0].raw_transcript) return c.json({ error: 'No transcript available' }, 400)

  const transcript = meeting.rows[0].raw_transcript
  const provider = body.provider ?? sMap.llm_provider ?? (apiKey.startsWith('sk-ant') ? 'anthropic' : apiKey.startsWith('AI') ? 'gemini' : 'openai')
  const model = body.model ?? sMap.llm_model ?? (provider === 'openai' ? 'gpt-4o-mini' : provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-sonnet-4-20250514')

  const systemPrompt = `You are an expert at structuring meeting transcripts.
Analyze the transcript below and return JSON:
{
  "summary": "One-line summary",
  "agenda": "Agenda items (newline separated)",
  "decisions": "Decisions made (newline separated)",
  "action_items": "Action items (newline separated, include assignee per line)"
}
Return only JSON.`

  try {
    let result: { summary: string; agenda: string; decisions: string; action_items: string }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
          response_format: { type: 'json_object' },
        }),
      })
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
      result = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: transcript }],
        }),
      })
      const data = await res.json() as { content?: Array<{ text?: string }> }
      const text = data.content?.[0]?.text ?? '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch?.[0] ?? '{}')
    }
    if (provider === 'gemini') {
      const geminiModel = model || 'gemini-2.0-flash'

      let geminiUrl: string
      let geminiHeaders: Record<string, string> = { 'Content-Type': 'application/json' }

      const geminiClientEmail = sMap.gemini_client_email
      const geminiPrivateKey = sMap.gemini_private_key

      if (geminiClientEmail && geminiPrivateKey) {
        const { getGeminiAccessToken } = await import('../utils/gemini-auth.js')
        const accessToken = await getGeminiAccessToken(geminiClientEmail, geminiPrivateKey)
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
        geminiHeaders['Authorization'] = `Bearer ${accessToken}`
      } else {
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
      }

      const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: geminiHeaders,
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${transcript}` }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      )
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch?.[0] ?? '{}')
    }

    // Update DB
    await execute(
      'UPDATE meetings SET summary = ?, agenda = ?, decisions = ?, action_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [result.summary ?? null, result.agenda ?? null, result.decisions ?? null, result.action_items ?? null, id],
    )

    return c.json({ ok: true, result })
  } catch (e) {
    return c.json({ error: `LLM call failed: ${String(e)}` }, 500)
  }
})

export default app
