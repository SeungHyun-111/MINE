import { format, addDays } from 'date-fns'

const SERVICE_KEY = 'ngx/BFtjRyWWjj+yPeRTo2TrinX/wrFwkYpu1ROLrnac5ZLI+ckoMTL1wptN0WfsHSUTLmOgwz1UiLEHd8FVAw=='
const KMA_SHORT_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'
const KMA_MID_URL = 'https://apis.data.go.kr/1360000/MidFcstInfoService'
const RISE_SET_URL = 'https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo'
const ENABLE_RISE_SET_API = true

export const DEFAULT_WEATHER_LOCATION = {
  name: '마포구 상암동',
  nx: 58,
  ny: 126,
  midLandRegId: '11B00000',
  midTempRegId: '11B10101',
  riseSetLocation: '서울',
}

const SKY = {
  1: '맑음',
  3: '구름많음',
  4: '흐림',
}

const PTY = {
  0: '',
  1: '비',
  2: '비/눈',
  3: '눈',
  4: '소나기',
}

const WEATHER_ICON = {
  clear: '☀',
  cloud: '⛅',
  overcast: '☁',
  rain: '☔',
  snow: '❄',
}

function serviceKey() {
  return encodeURIComponent(SERVICE_KEY)
}

function ymd(date) {
  return format(date, 'yyyyMMdd')
}

function dashed(date) {
  return format(date, 'yyyy-MM-dd')
}

function latestBaseTime(times, bufferMinutes = 45) {
  const now = new Date(Date.now() - bufferMinutes * 60000)
  const hhmm = Number(format(now, 'HHmm'))
  const available = times.filter((time) => Number(time) <= hhmm)

  if (available.length > 0) {
    return { baseDate: ymd(now), baseTime: available[available.length - 1] }
  }

  const yesterday = addDays(now, -1)
  return { baseDate: ymd(yesterday), baseTime: times[times.length - 1] }
}

function latestMidTmFc() {
  const now = new Date(Date.now() - 90 * 60000)
  const hhmm = Number(format(now, 'HHmm'))

  if (hhmm >= 1800) return `${ymd(now)}1800`
  if (hhmm >= 600) return `${ymd(now)}0600`
  return `${ymd(addDays(now, -1))}1800`
}

async function fetchJson(url) {
  const response = await fetch(url)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 180)}`)
  }

  const data = JSON.parse(text)
  const header = data?.response?.header
  if (header && header.resultCode !== '00') {
    throw new Error(header.resultMsg || 'Weather API error')
  }

  return data
}

async function fetchText(url) {
  const response = await fetch(url)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 180)}`)
  }

  return text
}

function getItems(data) {
  const items = data?.response?.body?.items?.item
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

function groupForecastItems(items) {
  const grouped = {}

  items.forEach((item) => {
    const key = `${item.fcstDate}${item.fcstTime}`
    if (!grouped[key]) {
      grouped[key] = {
        date: item.fcstDate,
        time: item.fcstTime,
      }
    }
    grouped[key][item.category] = item.fcstValue
  })

  return Object.values(grouped).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

function weatherSummary(row) {
  const pty = Number(row.PTY || 0)
  const sky = Number(row.SKY || 1)
  if (pty === 1 || pty === 4) return { text: PTY[pty], icon: WEATHER_ICON.rain }
  if (pty === 2 || pty === 3) return { text: PTY[pty], icon: WEATHER_ICON.snow }
  if (sky === 1) return { text: SKY[sky], icon: WEATHER_ICON.clear }
  if (sky === 3) return { text: SKY[sky], icon: WEATHER_ICON.cloud }
  return { text: SKY[sky] || '흐림', icon: WEATHER_ICON.overcast }
}

function formatClock(hhmm) {
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`
}

function buildHourly(rows) {
  return rows.slice(0, 18).map((row) => {
    const summary = weatherSummary(row)
    return {
      date: row.date,
      time: formatClock(row.time),
      temp: row.TMP || row.T1H || '-',
      pop: row.POP || '0',
      humidity: row.REH || '-',
      wind: row.WSD || '-',
      sky: summary.text,
      icon: summary.icon,
    }
  })
}

function buildDaily(rows) {
  const byDate = {}
  rows.forEach((row) => {
    if (!byDate[row.date]) byDate[row.date] = []
    byDate[row.date].push(row)
  })

  return Object.entries(byDate).slice(0, 7).map(([date, dayRows]) => {
    const temps = dayRows.map((row) => Number(row.TMP)).filter((value) => !Number.isNaN(value))
    const pops = dayRows.map((row) => Number(row.POP || 0)).filter((value) => !Number.isNaN(value))
    const noon = dayRows.find((row) => row.time === '1200') || dayRows[0]
    const summary = weatherSummary(noon || {})
    const minFromApi = dayRows.find((row) => row.TMN)?.TMN
    const maxFromApi = dayRows.find((row) => row.TMX)?.TMX

    return {
      date,
      label: `${date.slice(4, 6)}.${date.slice(6, 8)}`,
      minTemp: minFromApi || (temps.length ? Math.min(...temps).toString() : '-'),
      maxTemp: maxFromApi || (temps.length ? Math.max(...temps).toString() : '-'),
      pop: pops.length ? Math.max(...pops).toString() : '0',
      sky: summary.text,
      icon: summary.icon,
    }
  })
}

function parseCurrent(items) {
  const current = {}
  items.forEach((item) => {
    current[item.category] = item.obsrValue
  })

  const summary = weatherSummary({
    PTY: current.PTY,
    SKY: current.SKY || 1,
  })

  return {
    temp: current.T1H || '-',
    humidity: current.REH || '-',
    wind: current.WSD || '-',
    rain: current.RN1 || '0',
    sky: summary.text,
    icon: summary.icon,
  }
}

function buildMidTerm(landItem, tempItem) {
  const result = []

  for (let day = 3; day <= 7; day += 1) {
    const am = landItem?.[`wf${day}Am`] || landItem?.[`wf${day}`] || ''
    const pm = landItem?.[`wf${day}Pm`] || landItem?.[`wf${day}`] || am
    const rnAm = landItem?.[`rnSt${day}Am`] || landItem?.[`rnSt${day}`] || ''
    const rnPm = landItem?.[`rnSt${day}Pm`] || landItem?.[`rnSt${day}`] || rnAm

    result.push({
      day,
      date: dashed(addDays(new Date(), day)),
      am,
      pm,
      rnAm,
      rnPm,
      minTemp: tempItem?.[`taMin${day}`] ?? '-',
      maxTemp: tempItem?.[`taMax${day}`] ?? '-',
    })
  }

  return result
}

function xmlValue(xml, tag) {
  return xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || ''
}

function settledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

function settledError(name, result) {
  if (result.status === 'fulfilled') return null
  return {
    source: name,
    message: result.reason?.message || String(result.reason),
  }
}

export async function fetchWeatherBundle(location = DEFAULT_WEATHER_LOCATION) {
  const ultra = latestBaseTime(Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}00`), 45)
  const vilage = latestBaseTime(['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'], 80)
  const tmFc = latestMidTmFc()
  const today = ymd(new Date())

  const commonShort = `serviceKey=${serviceKey()}&pageNo=1&numOfRows=1000&dataType=JSON&nx=${location.nx}&ny=${location.ny}`

  const [currentResult, forecastResult, midLandResult, midTempResult, riseSetResult] = await Promise.allSettled([
    fetchJson(`${KMA_SHORT_URL}/getUltraSrtNcst?${commonShort}&base_date=${ultra.baseDate}&base_time=${ultra.baseTime}`),
    fetchJson(`${KMA_SHORT_URL}/getVilageFcst?${commonShort}&base_date=${vilage.baseDate}&base_time=${vilage.baseTime}`),
    fetchJson(`${KMA_MID_URL}/getMidLandFcst?serviceKey=${serviceKey()}&pageNo=1&numOfRows=10&dataType=JSON&regId=${location.midLandRegId}&tmFc=${tmFc}`),
    fetchJson(`${KMA_MID_URL}/getMidTa?serviceKey=${serviceKey()}&pageNo=1&numOfRows=10&dataType=JSON&regId=${location.midTempRegId}&tmFc=${tmFc}`),
    ENABLE_RISE_SET_API
      ? fetchText(`${RISE_SET_URL}?serviceKey=${serviceKey()}&locdate=${today}&location=${encodeURIComponent(location.riseSetLocation)}`)
      : Promise.reject(new Error('RiseSetInfoService is disabled until API access is approved')),
  ])

  const currentData = settledValue(currentResult, null)
  const forecastData = settledValue(forecastResult, null)
  const midLandData = settledValue(midLandResult, null)
  const midTempData = settledValue(midTempResult, null)
  const riseSetXml = settledValue(riseSetResult, '')
  const apiErrors = [
    settledError('shortCurrent', currentResult),
    settledError('shortForecast', forecastResult),
    settledError('midLand', midLandResult),
    settledError('midTemp', midTempResult),
    settledError('sunriseSunset', riseSetResult),
  ].filter(Boolean)

  const forecastRows = groupForecastItems(getItems(forecastData))
  const daily = buildDaily(forecastRows)
  const midTerm = buildMidTerm(getItems(midLandData)[0], getItems(midTempData)[0])

  return {
    location,
    fetchedAt: new Date().toISOString(),
    baseTimes: {
      ultra,
      vilage,
      mid: tmFc,
    },
    apiErrors,
    current: parseCurrent(getItems(currentData)),
    hourly: buildHourly(forecastRows),
    daily,
    midTerm,
    sunriseSunset: {
      sunrise: xmlValue(riseSetXml, 'sunrise'),
      sunset: xmlValue(riseSetXml, 'sunset'),
      moonrise: xmlValue(riseSetXml, 'moonrise'),
      moonset: xmlValue(riseSetXml, 'moonset'),
    },
  }
}
