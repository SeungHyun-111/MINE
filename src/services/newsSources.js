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

function parseSeoulHtml(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const anchors = Array.from(doc.querySelectorAll('a[href*="news.seoul.go.kr/"][href*="/archives/"]'))

  return anchors.map((anchor) => {
    const link = anchor.href
    const archiveMatch = link.match(/\/archives\/(\d+)/)
    const title = anchor.querySelector('.subject')?.textContent?.trim().replace(/\s+/g, ' ') ?? ''
    const date = anchor.querySelector('.date')?.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''
    const content = anchor.querySelector('.txt')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (!archiveMatch || !title) return null

    return {
      id: archiveMatch[1],
      title,
      link,
      date,
      content,
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

function parseShHtml(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const rows = Array.from(doc.querySelectorAll('#listTb tbody tr'))

  return rows
    .map((tr) => {
      const anchor = tr.querySelector('a[onclick*="getDetailView"]')
      if (!anchor) return null

      const seqMatch = anchor.getAttribute('onclick')?.match(/getDetailView\(['"]?(\d+)['"]?\)/)
      if (!seqMatch) return null

      const cells = Array.from(tr.querySelectorAll('td'))
      const dateMatch = cells.find((cell) => /\d{4}-\d{2}-\d{2}/.test(cell.textContent ?? ''))
        ?.textContent
        ?.match(/\d{4}-\d{2}-\d{2}/)

      return {
        id: seqMatch[1],
        title: anchor.textContent?.trim().replace(/\s+/g, ' ') ?? '',
        href: `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_241/view.do?seq=${seqMatch[1]}&multi_itm_seqs=1,2,4,8,16,32,64,128,256,512,1024`,
        date: dateMatch?.[0] ?? '',
        dept: cells[2]?.textContent?.trim().replace(/\s+/g, ' ') ?? '',
        content: '',
      }
    })
    .filter(Boolean)
}

function parseShDetail(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const content =
    doc.querySelector('.viewTable') ??
    doc.querySelector('.board-view') ??
    doc.querySelector('.view-content') ??
    doc.querySelector('.contents')

  return content?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function shLocalUrl(rawUrl) {
  const url = new URL(rawUrl)
  return `/sh-news${url.pathname}${url.search}`
}

export const SOURCES = {
  seoul: {
    label: '서울시',
    buildUrl: (page) =>
      `https://www.seoul.go.kr/realmnews/in/list.do?pageIndex=${page}`,
    fallbackBuildUrl: (page) =>
      `https://www.seoul.go.kr/realmnews/rss/realmNews.do?fetchStart=${page}`,
    days: 7,
    maxPages: 5,
    parse: parseSeoulHtml,
    fallbackParse: parseSeoulRss,
    parseDetail: (item) => item.content ?? '',
    useNetlifyProxy: true,
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
    useNetlifyProxy: true,
  },
  sh: {
    label: 'SH공사',
    buildUrl: (page) =>
      `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_241/list.do?multi_itm_seqs=1,2,4,8,16,32,64,128,256,512,1024&page=${page}`,
    detailUrl: (item) => item.href,
    localUrl: shLocalUrl,
    days: 7,
    maxPages: 5,
    parse: parseShHtml,
    parseDetail: parseShDetail,
    useProxyFirst: true,
    useNetlifyProxy: true,
  },
}
