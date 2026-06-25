import { ref, update, get, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { SOURCES, PROXY_LIST } from './newsSources'

const FRESHNESS_MS = 60 * 60 * 1000 // 60 minutes

async function fetchViaProxy(rawUrl) {
  let lastErr
  for (const proxy of PROXY_LIST) {
    try {
      const res = await fetch(proxy + encodeURIComponent(rawUrl), {
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) {
        console.warn(`[newsSync] proxy ${proxy} → HTTP ${res.status}`)
        lastErr = new Error(`HTTP ${res.status}`)
        continue
      }
      return await res.text()
    } catch (err) {
      console.warn(`[newsSync] proxy ${proxy} failed:`, err.message)
      lastErr = err
    }
  }
  throw lastErr ?? new Error('All proxies failed')
}

function cutoffDate(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

async function getLastSync(key) {
  try {
    const snap = await get(ref(db, `meta/${key}LastSync`))
    return snap.val()
  } catch {
    return null
  }
}

export async function syncSource(key) {
  const source = SOURCES[key]
  if (!source) throw new Error(`Unknown source: ${key}`)

  const lastSync = await getLastSync(key)
  if (lastSync && Date.now() - lastSync < FRESHNESS_MS) {
    console.log(`[newsSync] ${key}: fresh (${Math.round((Date.now() - lastSync) / 60000)}m ago), skipping`)
    return
  }

  const cutoff = cutoffDate(source.days)
  const rtdbUpdates = {}
  let stopped = false

  for (let page = 1; page <= source.maxPages && !stopped; page++) {
    let text
    try {
      text = await fetchViaProxy(source.buildUrl(page))
    } catch (err) {
      console.warn(`[newsSync] ${key} page ${page}:`, err.message)
      break
    }

    const items = source.parse(text)
    if (items.length === 0) {
      stopped = true
      break
    }

    let pageHasRecent = false
    for (const item of items) {
      if (!item.date || item.date < cutoff) continue
      pageHasRecent = true
      rtdbUpdates[`${source.dbPath}/${item.id}`] = item
    }

    if (!pageHasRecent) stopped = true
  }

  const count = Object.keys(rtdbUpdates).length
  if (count > 0) {
    await update(ref(db), rtdbUpdates)
    console.log(`[newsSync] ${key}: saved ${count} items`)
  }

  // mark sync time even if 0 items (avoids hammering on empty result)
  await update(ref(db, 'meta'), { [`${key}LastSync`]: Date.now() })
}

export function subscribeNews(key, callback) {
  const source = SOURCES[key]
  if (!source) return () => {}
  const r = ref(db, source.dbPath)
  const unsub = onValue(r, (snap) => {
    const raw = snap.val() ?? {}
    const items = Object.values(raw).sort((a, b) => {
      const d = (b.date ?? '').localeCompare(a.date ?? '')
      return d !== 0 ? d : Number(b.id ?? 0) - Number(a.id ?? 0)
    })
    callback(items)
  })
  return unsub
}
