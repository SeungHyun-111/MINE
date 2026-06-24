import { useState, useEffect, useCallback } from 'react'
import { fetchCalendarList, fetchAllEvents, createEvent, updateEvent, deleteEvent, makeEvent } from '@/lib/googleCalendar'
import { useAuth } from '@/hooks/useAuth'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'

export function useCalendar() {
  const { accessToken } = useAuth()
  const [events, setEvents] = useState([])
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 캘린더 목록 최초 1회 로드
  useEffect(() => {
    if (!accessToken) return
    fetchCalendarList(accessToken)
      .then(setCalendars)
      .catch(console.error)
  }, [accessToken])

  const load = useCallback(async () => {
    if (!accessToken || calendars.length === 0) return
    setLoading(true)
    try {
      const timeMin = startOfMonth(currentMonth)
      const timeMax = endOfMonth(currentMonth)
      const items = await fetchAllEvents(accessToken, timeMin, timeMax, calendars)
      setEvents(items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [accessToken, currentMonth, calendars])

  useEffect(() => {
    load()
  }, [load])

  const addEvent = async (formData) => {
    const event = makeEvent(formData)
    const created = await createEvent(accessToken, event)
    setEvents((prev) => [...prev, { ...created, calendarId: 'primary' }])
    return created
  }

  const editEvent = async (calendarId, eventId, formData) => {
    const event = makeEvent(formData)
    const updated = await updateEvent(accessToken, calendarId, eventId, event)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...updated, calendarId } : e)))
    return updated
  }

  const removeEvent = async (calendarId, eventId) => {
    await deleteEvent(accessToken, calendarId, eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const prevMonth = () => setCurrentMonth((d) => addMonths(d, -1))
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1))

  return {
    events,
    calendars,
    loading,
    currentMonth,
    prevMonth,
    nextMonth,
    addEvent,
    editEvent,
    removeEvent,
    reload: load,
  }
}
