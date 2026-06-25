import { SOURCES } from './newsSources'

const CACHE_TTL_MS = 30 * 60 * 1000
const CACHE_PREFIX = 'mine:news:'
const NEWS_PROXY_URL = 'https://news-proxy.weras1993.workers.dev/?url='

function cutoffDate(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function cacheKey(key) {
  return `${CACHE_PREFIX}${key}`
}

function readLocalCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(key)) ?? 'null')
    if (!cached?.items || !cached?.savedAt) return null
    return cached
  } catch {
    return null
  }
}

function writeLocalCache(key, items) {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify({
      savedAt: Date.now(),
      items,
    }))
  } catch {
    // localStorage can be disabled or full; news still works without caching.
  }
}

function proxiedUrl(rawUrl) {
  return `${NEWS_PROXY_URL}${encodeURIComponent(rawUrl)}`
}

function requestUrls(source, rawUrl) {
  const urls = [
    proxiedUrl(rawUrl),
    rawUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawUrl)}`,
  ]

  if (!source.useProxyFirst) {
    return [rawUrl, ...urls.filter((url) => url !== rawUrl)]
  }

  return urls
}

async function fetchText(source, rawUrl) {
  let lastError

  for (const url of requestUrls(source, rawUrl)) {
    try {
      const res = await fetch(url, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('뉴스 소스를 불러오지 못했습니다.')
}

async function fetchFreshNews(key) {
  const source = SOURCES[key]
  if (!source) throw new Error(`Unknown news source: ${key}`)

  const cutoff = cutoffDate(source.days)
  const news = []
  const seen = new Set()
  let stopped = false

  for (let page = 1; page <= source.maxPages && !stopped; page += 1) {
    const text = await fetchText(source, source.buildUrl(page))
    const items = source.parse(text)

    if (items.length === 0) break

    let pageHasRecent = false
    for (const item of items) {
      if (!item.date || item.date < cutoff || seen.has(item.id)) continue
      pageHasRecent = true
      seen.add(item.id)
      news.push(item)
    }

    if (!pageHasRecent) stopped = true
  }

  return news.sort((a, b) => {
    const d = (b.date ?? '').localeCompare(a.date ?? '')
    return d !== 0 ? d : Number(b.id ?? 0) - Number(a.id ?? 0)
  })
}

export function getCachedNews(key) {
  return readLocalCache(key)?.items ?? []
}

export async function loadNews(key, { force = false } = {}) {
  const cached = readLocalCache(key)
  const isFresh = cached && Date.now() - cached.savedAt < CACHE_TTL_MS

  if (!force && isFresh) {
    return { items: cached.items, fromCache: true }
  }

  try {
    const items = await fetchFreshNews(key)
    writeLocalCache(key, items)
    return { items, fromCache: false }
  } catch (error) {
    if (cached?.items) {
      return { items: cached.items, fromCache: true, error }
    }
    throw error
  }
}

export async function loadNewsDetail(key, item) {
  const source = SOURCES[key]
  if (!source) throw new Error(`Unknown news source: ${key}`)

  if (item.content) return item.content
  if (!source.detailUrl) return ''

  const text = await fetchText(source, source.detailUrl(item))
  return source.parseDetail(text)
}
