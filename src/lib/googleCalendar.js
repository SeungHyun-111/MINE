const BASE_URL = 'https://www.googleapis.com/calendar/v3'

function headers(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

// 구독 중인 모든 캘린더 목록 가져오기
export async function fetchCalendarList(accessToken) {
  const res = await fetch(`${BASE_URL}/users/me/calendarList`, {
    headers: headers(accessToken),
  })
  if (!res.ok) throw new Error('캘린더 목록을 불러오지 못했습니다.')
  const data = await res.json()
  return data.items
}

// 특정 캘린더의 일정 가져오기
async function fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  const res = await fetch(
    `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: headers(accessToken) }
  )

  if (!res.ok) return []
  const data = await res.json()
  return data.items.map((item) => ({
    ...item,
    calendarId,
  }))
}

// 모든 캘린더의 일정을 병렬로 가져오기
export async function fetchAllEvents(accessToken, timeMin, timeMax, calendars) {
  const results = await Promise.all(
    calendars.map((cal) =>
      fetchCalendarEvents(accessToken, cal.id, timeMin, timeMax)
    )
  )
  return results.flat().sort((a, b) => {
    const aTime = a.start?.dateTime || a.start?.date || ''
    const bTime = b.start?.dateTime || b.start?.date || ''
    return aTime.localeCompare(bTime)
  })
}

// 일정 생성 (기본 캘린더에)
export async function createEvent(accessToken, event) {
  const res = await fetch(`${BASE_URL}/calendars/primary/events`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify(event),
  })
  if (!res.ok) throw new Error('일정 생성에 실패했습니다.')
  return res.json()
}

// 일정 수정
export async function updateEvent(accessToken, calendarId, eventId, event) {
  const res = await fetch(
    `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: headers(accessToken),
      body: JSON.stringify(event),
    }
  )
  if (!res.ok) throw new Error('일정 수정에 실패했습니다.')
  return res.json()
}

// 일정 삭제
export async function deleteEvent(accessToken, calendarId, eventId) {
  const res = await fetch(
    `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE', headers: headers(accessToken) }
  )
  if (!res.ok) throw new Error('일정 삭제에 실패했습니다.')
}

// Google Calendar 이벤트 객체 생성 헬퍼
export function makeEvent({ title, date, startTime, endTime, memo }) {
  const isAllDay = !startTime

  if (isAllDay) {
    return {
      summary: title,
      description: memo || '',
      start: { date },
      end: { date },
    }
  }

  return {
    summary: title,
    description: memo || '',
    start: { dateTime: `${date}T${startTime}:00`, timeZone: 'Asia/Seoul' },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: 'Asia/Seoul' },
  }
}
