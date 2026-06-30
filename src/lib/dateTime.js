const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function getSeoulDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function parseDateKey(dateKey) {
  const match = DATE_KEY_RE.exec(dateKey || '')
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function addDateKeyDays(dateKey, days) {
  const date = parseDateKey(dateKey)
  if (!date) return dateKey

  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

export function getDateTimeDateKey(value) {
  return value?.slice(0, 10) || ''
}

export function getDateTimeTime(value) {
  return value?.slice(11, 16) || ''
}

export function clampDateInputYear(event) {
  const input = event.currentTarget
  const value = input.value

  if (!value) return

  const [year, month = '', day = ''] = value.split('-')
  if (year.length <= 4) return

  input.value = [year.slice(0, 4), month, day].filter(Boolean).join('-')
}
