// Seoul RSS uses non-standard tags: wDate (not pubDate), cn (not description)
function parseSeoulRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const items = Array.from(doc.querySelectorAll('channel > item'))
  return items
    .map((el) => {
      const link = el.querySelector('link')?.textContent?.trim() ?? ''
      const wDate = el.querySelector('wDate')?.textContent?.trim() ?? ''
      const title = el.querySelector('title')?.textContent?.trim() ?? ''
      const archiveMatch = link.match(/\/archives\/(\d+)/)
      if (!archiveMatch) return null
      return {
        id: archiveMatch[1],
        title,
        link,
        date: wDate.slice(0, 10),
      }
    })
    .filter(Boolean)
}

function parseGangseoHtml(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const rows = Array.from(doc.querySelectorAll('table.is-board tbody tr'))
  return rows
    .filter((tr) => !tr.querySelector('img[alt="공지"]'))
    .map((tr) => {
      const anchor = tr.querySelector('a[href*="/gs040101/"]')
      if (!anchor) return null
      const href = anchor.getAttribute('href') ?? ''
      const nttNoMatch = href.match(/\/gs040101\/(\d+)/)
      if (!nttNoMatch) return null
      const tds = tr.querySelectorAll('td')
      const dateMatch = tds[3]?.textContent?.match(/\d{4}-\d{2}-\d{2}/)
      return {
        id: nttNoMatch[1],
        title: anchor.textContent?.trim() ?? '',
        href: `https://www.gangseo.seoul.kr/gs040101/${nttNoMatch[1]}`,
        date: dateMatch?.[0] ?? '',
        dept: tds[2]?.textContent?.trim() ?? '',
      }
    })
    .filter(Boolean)
}

export const PROXY_LIST = [
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest=',
]

export const SOURCES = {
  seoul: {
    label: '서울시',
    type: 'rss',
    buildUrl: (page) =>
      `https://www.seoul.go.kr/realmnews/rss/realmNews.do?fetchStart=${page}`,
    dbPath: 'news/seoul',
    days: 7,
    maxPages: 5,
    parse: parseSeoulRss,
  },
  gangseo: {
    label: '강서구',
    type: 'html',
    buildUrl: (page) =>
      `https://www.gangseo.seoul.kr/gs040101?curPage=${page}`,
    dbPath: 'news/gangseo',
    days: 7,
    maxPages: 5,
    parse: parseGangseoHtml,
  },
}
