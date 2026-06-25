const ALLOWED_HOSTS = new Set([
  'www.gangseo.seoul.kr',
  'www.seoul.go.kr',
  'news.seoul.go.kr',
])

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

function corsResponse(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  })
}

function getTargetUrl(requestUrl) {
  const url = new URL(requestUrl)
  const rawTarget = url.searchParams.get('url')

  if (!rawTarget) {
    throw new Error('Missing url query parameter')
  }

  const target = new URL(rawTarget)
  if (target.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed')
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    throw new Error(`Host is not allowed: ${target.hostname}`)
  }

  return target
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return corsResponse(null, { status: 204 })
    }

    if (request.method !== 'GET') {
      return corsResponse('Method Not Allowed', { status: 405 })
    }

    let target
    try {
      target = getTargetUrl(request.url)
    } catch (error) {
      return corsResponse(error.message, { status: 400 })
    }

    try {
      const upstream = await fetch(target.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 mine-news-proxy',
          Accept: 'text/html,application/rss+xml,application/xml,text/xml,*/*',
        },
      })

      const headers = {
        ...CORS_HEADERS,
        'Content-Type': upstream.headers.get('Content-Type') ?? 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      }

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      })
    } catch (error) {
      return corsResponse(`Proxy fetch failed: ${error.message}`, { status: 502 })
    }
  },
}
