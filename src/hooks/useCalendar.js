import { useState, useEffect, useCallback } from 'react'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import {
  connectCalendar,
  createEvent,
  deleteEvent,
  fetchAllEvents,
  fetchCalendarList,
  getCalendarConnectionStatus,
  makeEvent,
  updateEvent,
} from '@/lib/googleCalendar'

const CALENDAR_BACKEND_ENABLED = false

export function useCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [calendars, setCalendars] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const loadCalendars = useCallback(async () => {
    if (!user || !CALENDAR_BACKEND_ENABLED) {
      setEvents([])
      setCalendars([])
      setConnected(CALENDAR_BACKEND_ENABLED)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const isConnected = await getCalendarConnectionStatus()
      setConnected(isConnected)

      if (!isConnected) {
        setEvents([])
        setCalendars([])
        return
      }

      const items = await fetchCalendarList()
      setCalendars(items)
    } catch (e) {
      console.error(e)
      setEvents([])
      setCalendars([])
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCalendars()
  }, [loadCalendars])

  const load = useCallback(async () => {
    if (!CALENDAR_BACKEND_ENABLED || !user || !connected || calendars.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const timeMin = startOfMonth(currentMonth)
      const timeMax = endOfMonth(currentMonth)
      const items = await fetchAllEvents(timeMin, timeMax, calendars)
      setEvents(items)
    } catch (e) {
      console.error(e)
      setEvents([])
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, connected, currentMonth, calendars])

  useEffect(() => {
    load()
  }, [load])

  const startCalendarConnection = async () => {
    if (!CALENDAR_BACKEND_ENABLED) return
    setError(null)
    await connectCalendar()
  }

  const addEvent = async (formData) => {
    const event = makeEvent(formData)
    const created = await createEvent(null, event)
    setEvents((prev) => [...prev, { ...created, calendarId: 'primary' }])
    return created
  }

  const editEvent = async (calendarId, eventId, formData) => {
    const event = makeEvent(formData)
    const updated = await updateEvent(null, calendarId, eventId, event)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...updated, calendarId } : e)))
    return updated
  }

  const removeEvent = async (calendarId, eventId) => {
    await deleteEvent(null, calendarId, eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const prevMonth = () => setCurrentMonth((d) => addMonths(d, -1))
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1))

  return {
    events,
    calendars,
    connected,
    loading,
    error,
    currentMonth,
    prevMonth,
    nextMonth,
    addEvent,
    editEvent,
    removeEvent,
    connectCalendar: startCalendarConnection,
    reload: load,
    reloadCalendars: loadCalendars,
  }
}
