/**
 * Download all Gmail messages as HTML files.
 * Usage: GMAIL_TOKEN=your_token node scripts/download-gmail.mjs
 */

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const TOKEN = process.env.GMAIL_TOKEN
if (!TOKEN) {
  console.error('Missing GMAIL_TOKEN environment variable.')
  console.error('Usage: GMAIL_TOKEN=your_token node scripts/download-gmail.mjs')
  process.exit(1)
}

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const OUT_DIR = './resource/gmail'

function authFetch(url) {
  return fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
}

async function listAllMessageIds() {
  const ids = []
  let pageToken = null

  do {
    const url = `${BASE}/messages?maxResults=500${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await authFetch(url)
    if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    if (data.messages) ids.push(...data.messages.map((m) => m.id))
    pageToken = data.nextPageToken ?? null
    console.log(`  Fetched ${ids.length} message IDs so far…`)
  } while (pageToken)

  return ids
}

function decodeBase64(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractHtml(payload) {
  // Direct body
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Search parts recursively
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = extractHtml(part)
      if (found) return found
    }
  }

  return null
}

function extractText(payload) {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return `<pre>${decodeBase64(payload.body.data)}</pre>`
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = extractText(part)
      if (found) return found
    }
  }
  return null
}

function getHeader(headers, name) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9\-_ ]/gi, '_').slice(0, 80)
}

async function downloadMessage(id, index, total) {
  const res = await authFetch(`${BASE}/messages/${id}?format=full`)
  if (!res.ok) {
    console.warn(`  [${index}/${total}] SKIP ${id}: ${res.status}`)
    return
  }
  const msg = await res.json()

  const headers = msg.payload?.headers ?? []
  const subject = getHeader(headers, 'subject') || '(no subject)'

  if (!subject.toUpperCase().includes('STEEL RING')) {
    console.log(`  [${index}/${total}] SKIP (no match): ${subject}`)
    return
  }

  const from = getHeader(headers, 'from')
  const date = getHeader(headers, 'date')

  const body = extractHtml(msg.payload) ?? extractText(msg.payload) ?? '<p>(no body)</p>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject.replace(/</g, '&lt;')}</title>
  <style>body{font-family:sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem}
  .meta{background:#f5f5f5;padding:1rem;border-radius:4px;margin-bottom:1.5rem;font-size:.9rem}
  .meta dt{font-weight:bold;display:inline}
  </style>
</head>
<body>
  <div class="meta">
    <dl>
      <dt>From:</dt> <dd>${from}</dd>
      <dt>Date:</dt> <dd>${date}</dd>
      <dt>Subject:</dt> <dd>${subject}</dd>
    </dl>
  </div>
  ${body}
</body>
</html>`

  const filename = `${String(index).padStart(5, '0')}_STEEL RING.html`
  await writeFile(join(OUT_DIR, filename), html, 'utf-8')
  console.log(`  [${index}/${total}] ${filename}`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log('Listing all message IDs…')
  const ids = await listAllMessageIds()
  console.log(`Total messages: ${ids.length}`)

  // Download with concurrency limit to avoid rate limits
  const CONCURRENCY = 5
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map((id, j) => downloadMessage(id, i + j + 1, ids.length)))
  }

  console.log(`\nDone. Files saved to ${OUT_DIR}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
