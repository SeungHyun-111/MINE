import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

function callable(name) {
  return httpsCallable(functions, name)
}

function functionError(error, fallback) {
  return new Error(error?.message || fallback)
}

function nextDate(date) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + 1)
  return next.toISOString().slice(0, 10)
}

export async function getCalendarConnectionStatus() {
  try {
    const result = await callable('getCalendarConnectionStatus')()
    return !!result.data.connected
  } catch (error) {
    throw functionError(error, '캘린더 연결 상태를 확인하지 못했습니다.')
  }
}

export async function connectCalendar() {
  try {
    const result = await callable('getCalendarConnectUrl')({
      appUrl: window.location.origin,
    })
    window.location.assign(result.data.url)
  } catch (error) {
    throw functionError(error, '캘린더 연결을 시작하지 못했습니다.')
  }
}

export async function fetchCalendarList() {
  try {
    const result = await callable('listCalendarCalendars')()
    return result.data.items || []
  } catch (error) {
    throw functionError(error, '캘린더 목록을 불러오지 못했습니다.')
  }
}

async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  try {
    const result = await callable('listCalendarEvents')({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    })

    return (result.data.items || []).map((item) => ({
      ...item,
      calendarId,
    }))
  } catch (error) {
    throw functionError(error, `${calendarId}: 일정을 불러오지 못했습니다.`)
  }
}

export async function fetchAllEvents(timeMin, timeMax, calendars) {
  const results = await Promise.allSettled(
    calendars.map((cal) =>
      fetchCalendarEvents(cal.id, timeMin, timeMax)
    )
  )

  const failed = results.filter((result) => result.status === 'rejected')
  if (failed.length === results.length) {
    throw new Error(`일정을 불러오지 못했습니다: ${failed[0].reason.message}`)
  }

  failed.forEach((result) => console.warn(result.reason))

  return results.flatMap((result) => (
    result.status === 'fulfilled' ? result.value : []
  )).sort((a, b) => {
    const aTime = a.start?.dateTime || a.start?.date || ''
    const bTime = b.start?.dateTime || b.start?.date || ''
    return aTime.localeCompare(bTime)
  })
}

export async function createEvent(_accessToken, event) {
  try {
    const result = await callable('createCalendarEvent')({ event })
    return result.data
  } catch (error) {
    throw functionError(error, '일정 생성에 실패했습니다.')
  }
}

export async function updateEvent(_accessToken, calendarId, eventId, event) {
  try {
    const result = await callable('updateCalendarEvent')({ calendarId, eventId, event })
    return result.data
  } catch (error) {
    throw functionError(error, '일정 수정에 실패했습니다.')
  }
}

export async function deleteEvent(_accessToken, calendarId, eventId) {
  try {
    await callable('deleteCalendarEvent')({ calendarId, eventId })
  } catch (error) {
    throw functionError(error, '일정 삭제에 실패했습니다.')
  }
}

export function makeEvent({ title, date, startDate, endDate, startTime, endTime, memo }) {
  const safeStartDate = startDate || date
  const safeEndDate = endDate || safeStartDate
  const isAllDay = !startTime

  if (isAllDay) {
    return {
      summary: title,
      description: memo || '',
      start: { date: safeStartDate },
      end: { date: nextDate(safeEndDate) },
    }
  }

  const safeEndTime = endTime || startTime

  return {
    summary: title,
    description: memo || '',
    start: { dateTime: `${safeStartDate}T${startTime}:00`, timeZone: 'Asia/Seoul' },
    end: { dateTime: `${safeEndDate}T${safeEndTime}:00`, timeZone: 'Asia/Seoul' },
  }
}
