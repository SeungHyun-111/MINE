import http from 'node:http'
import https from 'node:https'

const ALLOWED_HOSTS = new Set([
  'www.seoul.go.kr',
  'www.gangseo.seoul.kr',
  'www.i-sh.co.kr',
])

function readTextFromUrl(url) {
  const client = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MINE news fetcher)',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
      },
      rejectUnauthorized: false,
    }, (upstream) => {
      let body = ''
      upstream.setEncoding('utf8')
      upstream.on('data', (chunk) => {
        body += chunk
      })
      upstream.on('end', () => {
        if ((upstream.statusCode || 500) >= 400) {
          reject(new Error(`Upstream HTTP ${upstream.statusCode}`))
          return
        }

        resolve({
          body,
          contentType: upstream.headers['content-type'] || 'text/plain; charset=utf-8',
        })
      })
    })

    req.setTimeout(15000, () => {
      req.destroy(new Error('Upstream request timed out'))
    })
    req.on('error', reject)
    req.end()
  })
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method not allowed',
    }
  }

  try {
    const rawUrl = event.queryStringParameters?.url
    if (!rawUrl) {
      return {
        statusCode: 400,
        body: 'Missing url',
      }
    }

    const url = new URL(rawUrl)
    if (!ALLOWED_HOSTS.has(url.hostname)) {
      return {
        statusCode: 403,
        body: 'Host not allowed',
      }
    }

    const { body, contentType } = await readTextFromUrl(url)

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': contentType,
      },
      body,
    }
  } catch (error) {
    return {
      statusCode: 502,
      body: error.message || 'News proxy failed',
    }
  }
}
