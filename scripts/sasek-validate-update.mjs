import fs from 'node:fs'

const allowedFields = new Set(['refinedText', 'replyText', 'hasReply', 'replyUpdatedAt'])
const blockedFields = new Set(['text', 'createdAt', 'source', 'sourceFile', 'sourceOrder'])

function fail(message) {
  console.error(`Sasek update rejected: ${message}`)
  process.exit(1)
}

const file = process.argv[2]
if (!file) fail('pass a flat-path update JSON file.')

const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
const entries = Object.entries(raw)
if (entries.length === 0) fail('update JSON is empty.')

for (const [path, value] of entries) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    fail(`"${path}" contains a nested object. Use "stageId/noteId/field" leaf paths only.`)
  }

  const parts = path.split('/')
  if (parts.length !== 3) {
    fail(`"${path}" is not a notes/{stageId}/{noteId}/{field} relative path.`)
  }

  const [stageId, noteId, field] = parts
  if (!stageId || !noteId || !field) fail(`"${path}" has an empty path segment.`)
  if (blockedFields.has(field)) fail(`"${path}" tries to modify protected field "${field}".`)
  if (!allowedFields.has(field)) fail(`"${path}" is not an allowed refinement field.`)
}

console.log(`Sasek update OK: ${entries.length} leaf-field updates validated.`)
