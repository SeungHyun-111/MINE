function textFromHtml(html = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function parseSeoulRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const items = Array.from(doc.querySelectorAll('channel > item'))

  return items.map((el) => {
    const link = el.querySelector('link')?.textContent?.trim() ?? ''
    const wDate = el.querySelector('wDate')?.textContent?.trim() ?? ''
    const title = el.querySelector('title')?.textContent?.trim() ?? ''
    const contentHtml = el.querySelector('cn')?.textContent?.trim() ?? ''
    const archiveMatch = link.match(/\/archives\/(\d+)/)
    if (!archiveMatch || !title) return null

    return {
      id: archiveMatch[1],
      title,
      link,
      date: wDate.slice(0, 10),
      content: textFromHtml(contentHtml),
    }
  }).filter(Boolean)
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
      const idMatch = href.match(/\/gs040101\/(\d+)/)
      if (!idMatch) return null

      const cells = Array.from(tr.querySelectorAll('td'))
      const dateMatch = cells[3]?.textContent?.match(/\d{4}-\d{2}-\d{2}/)

      return {
        id: idMatch[1],
        title: anchor.textContent?.trim().replace(/\s+/g, ' ') ?? '',
        href: new URL(href, 'https://www.gangseo.seoul.kr').toString(),
        date: dateMatch?.[0] ?? '',
        dept: cells[2]?.textContent?.trim() ?? '',
        content: '',
      }
    })
    .filter(Boolean)
}

function parseGangseoDetail(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const content =
    doc.querySelector('.board-view') ??
    doc.querySelector('.board-view-wrap') ??
    doc.querySelector('.view-content') ??
    doc.querySelector('.content-body') ??
    doc.querySelector('#container')

  return content?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

export const SOURCES = {
  seoul: {
    label: '서울시',
    buildUrl: (page) =>
      `https://www.seoul.go.kr/realmnews/rss/realmNews.do?fetchStart=${page}`,
    days: 7,
    maxPages: 5,
    parse: parseSeoulRss,
    parseDetail: (item) => item.content ?? '',
  },
  gangseo: {
    label: '강서구',
    buildUrl: (page) =>
      `https://www.gangseo.seoul.kr/gs040101?curPage=${page}`,
    detailUrl: (item) => item.href,
    days: 7,
    maxPages: 5,
    parse: parseGangseoHtml,
    parseDetail: parseGangseoDetail,
    useProxyFirst: true,
  },
}
