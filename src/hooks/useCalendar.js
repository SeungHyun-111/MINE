import { useState, useEffect, useCallback } from 'react'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import { onValue, push, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { getDateTimeDateKey } from '@/lib/dateTime'
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

// Intentionally disabled for now; Google Calendar backend integration will be enabled later.
const CALENDAR_BACKEND_ENABLED = false

const LOCAL_CALENDAR = {
  id: 'mine',
  summary: '내 일정',
  backgroundColor: '#1f4e5f',
}

function calendarEventsRef(uid) {
  return ref(db, `users/${uid}/pages/calendar/events`)
}

function calendarEventRef(uid, eventId) {
  return ref(db, `users/${uid}/pages/calendar/events/${eventId}`)
}

function sortEvents(items) {
  return [...items].sort((a, b) => {
    const aTime = a.start?.dateTime || a.start?.date || ''
    const bTime = b.start?.dateTime || b.start?.date || ''
    return aTime.localeCompare(bTime)
  })
}

export function useCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [calendars, setCalendars] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const loadCalendars = useCallback(async () => {
    if (!user) {
      setEvents([])
      setCalendars([])
      setConnected(false)
      setError(null)
      setLoading(false)
      return
    }

    if (!CALENDAR_BACKEND_ENABLED) {
      setCalendars([LOCAL_CALENDAR])
      setConnected(true)
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

  useEffect(() => {
    if (!user || CALENDAR_BACKEND_ENABLED) return undefined

    setLoading(true)
    setError(null)

    return onValue(
      calendarEventsRef(user.uid),
      (snapshot) => {
        const value = snapshot.val() || {}
        const items = Object.entries(value).map(([id, event]) => ({
          ...event,
          id,
          calendarId: event.calendarId || LOCAL_CALENDAR.id,
        }))

        setEvents(sortEvents(items))
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setEvents([])
        setError(e.message)
        setLoading(false)
      }
    )
  }, [user])

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

    if (!CALENDAR_BACKEND_ENABLED) {
      if (!user) throw new Error('로그인이 필요합니다.')

      const newRef = push(calendarEventsRef(user.uid))
      const saved = {
        ...event,
        calendarId: LOCAL_CALENDAR.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await set(newRef, saved)
      return { ...saved, id: newRef.key }
    }

    const created = await createEvent(null, event)
    setEvents((prev) => [...prev, { ...created, calendarId: 'primary' }])
    return created
  }

  const editEvent = async (calendarId, eventId, formData) => {
    const event = makeEvent(formData)

    if (!CALENDAR_BACKEND_ENABLED) {
      if (!user) throw new Error('로그인이 필요합니다.')

      const updated = {
        ...event,
        calendarId: calendarId || LOCAL_CALENDAR.id,
        updatedAt: serverTimestamp(),
      }

      await update(calendarEventRef(user.uid, eventId), updated)
      return { ...updated, id: eventId }
    }

    const updated = await updateEvent(null, calendarId, eventId, event)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...updated, calendarId } : e)))
    return updated
  }

  const removeEvent = async (calendarId, eventId) => {
    if (!CALENDAR_BACKEND_ENABLED) {
      if (!user) throw new Error('로그인이 필요합니다.')

      await remove(calendarEventRef(user.uid, eventId))
      return
    }

    await deleteEvent(null, calendarId, eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const updateEventStatus = async (eventId, status) => {
    if (CALENDAR_BACKEND_ENABLED) {
      throw new Error('濡쒖뻄 罹섎┛???먯꽌留??ъ슜 媛?ν빀?덈떎.')
    }
    if (!user) throw new Error('濡쒓렇?몄씠 ?꾩슂?⑸땲??')

    await update(calendarEventRef(user.uid, eventId), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  const updateEventPriority = async (eventId, priority) => {
    if (CALENDAR_BACKEND_ENABLED) {
      throw new Error('嚥≪뮇六?筌?꼶????癒?퐣筌?????揶쎛?館鍮??덈뼄.')
    }
    if (!user) throw new Error('嚥≪뮄??紐꾩뵠 ?袁⑹뒄??몃빍??')

    await update(calendarEventRef(user.uid, eventId), {
      priority,
      updatedAt: serverTimestamp(),
    })
  }

  const replaceRoutineEventsForDate = async (date, routines) => {
    if (CALENDAR_BACKEND_ENABLED) {
      throw new Error('濡쒖뻄 罹섎┛???먯꽌留??ъ슜 媛?ν빀?덈떎.')
    }
    if (!user) throw new Error('濡쒓렇?몄씠 ?꾩슂?⑸땲??')

    const updates = {}

    events.forEach((event) => {
      const eventDate = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
      if (eventDate === date && event.mineType === 'routine') {
        updates[event.id] = null
      }
    })

    routines.forEach((routine) => {
      const newRef = push(calendarEventsRef(user.uid))
      const formData = {
        title: routine.title,
        startDate: date,
        endDate: date,
        startTime: routine.startTime,
        endTime: routine.endTime,
        memo: routine.content,
        priority: routine.priority || 'medium',
      }

      updates[newRef.key] = {
        ...makeEvent(formData),
        calendarId: LOCAL_CALENDAR.id,
        mineType: 'routine',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    })

    await update(calendarEventsRef(user.uid), updates)
  }

  const prevMonth = useCallback(() => setCurrentMonth((d) => addMonths(d, -1)), [])
  const nextMonth = useCallback(() => setCurrentMonth((d) => addMonths(d, 1)), [])
  const goToMonth = useCallback((date) => setCurrentMonth(startOfMonth(date)), [])

  return {
    events,
    calendars,
    connected,
    loading,
    error,
    currentMonth,
    prevMonth,
    nextMonth,
    goToMonth,
    addEvent,
    editEvent,
    removeEvent,
    updateEventStatus,
    updateEventPriority,
    replaceRoutineEventsForDate,
    connectCalendar: startCalendarConnection,
    reload: load,
    reloadCalendars: loadCalendars,
  }
}
