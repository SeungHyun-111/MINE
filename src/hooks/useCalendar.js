import { useState, useEffect, useCallback } from 'react'
import { addDays, addMonths, endOfMonth, format, getDay, startOfMonth, startOfWeek } from 'date-fns'
import { get, onValue, push, ref, serverTimestamp, update } from 'firebase/database'
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

function calendarEventsByDateRef(uid, date) {
  return ref(db, `users/${uid}/pages/calendar/eventsByDate/${date}`)
}

function addDateKeyDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return format(date, 'yyyy-MM-dd')
}

function getEventRange(event) {
  const start = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
  const rawEnd = event.end?.date || getDateTimeDateKey(event.end?.dateTime) || start

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) {
    return { start: null, end: null }
  }

  const exclusiveEnd = event.end?.date && rawEnd > start ? addDateKeyDays(rawEnd, -1) : rawEnd
  const end = exclusiveEnd && exclusiveEnd >= start ? exclusiveEnd : start

  return { start, end }
}

function getEventDateKeys(event) {
  const { start, end } = getEventRange(event)
  if (!start || !end) return []

  const keys = []
  let cursor = start
  while (cursor <= end) {
    keys.push(cursor)
    cursor = addDateKeyDays(cursor, 1)
  }
  return keys
}

function getVisibleMonthDateKeys(month) {
  const firstDay = startOfMonth(month)
  const visibleStart = startOfWeek(firstDay, { weekStartsOn: 0 })
  const rowCount = Math.ceil((getDay(firstDay) + endOfMonth(month).getDate()) / 7)

  return Array.from({ length: rowCount * 7 }, (_, index) => format(addDays(visibleStart, index), 'yyyy-MM-dd'))
}

async function writeEventWithDateIndex(uid, eventId, event, previousEvent = null) {
  const updates = {
    [`users/${uid}/pages/calendar/events/${eventId}`]: event,
  }

  getEventDateKeys(previousEvent || {}).forEach((date) => {
    updates[`users/${uid}/pages/calendar/eventsByDate/${date}/${eventId}`] = null
  })

  getEventDateKeys(event).forEach((date) => {
    updates[`users/${uid}/pages/calendar/eventsByDate/${date}/${eventId}`] = true
  })

  await update(ref(db), updates)
}

async function removeEventWithDateIndex(uid, eventId, event = null) {
  const updates = {
    [`users/${uid}/pages/calendar/events/${eventId}`]: null,
  }

  getEventDateKeys(event || {}).forEach((date) => {
    updates[`users/${uid}/pages/calendar/eventsByDate/${date}/${eventId}`] = null
  })

  await update(ref(db), updates)
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

    const dateKeys = getVisibleMonthDateKeys(currentMonth)
    const indexByDate = new Map()
    const eventsById = new Map()
    const eventUnsubs = new Map()
    const loadedIndexDates = new Set()
    let fallbackChecked = false
    let disposed = false

    const publish = () => {
      if (disposed) return
      setEvents(sortEvents([...eventsById.values()]))
      setLoading(false)
    }

    const reconcileEventSubscriptions = () => {
      const nextIds = new Set()
      indexByDate.forEach((value) => {
        Object.keys(value || {}).forEach((id) => nextIds.add(id))
      })

      eventUnsubs.forEach((unsubscribe, id) => {
        if (nextIds.has(id)) return
        unsubscribe()
        eventUnsubs.delete(id)
        eventsById.delete(id)
      })

      nextIds.forEach((id) => {
        if (eventUnsubs.has(id)) return

        const unsubscribe = onValue(
          calendarEventRef(user.uid, id),
          (snapshot) => {
            if (snapshot.exists()) {
              const event = snapshot.val()
              eventsById.set(id, {
                ...event,
                id,
                calendarId: event.calendarId || LOCAL_CALENDAR.id,
              })
            } else {
              eventsById.delete(id)
            }
            publish()
          },
          (e) => {
            console.error(e)
            setError(e.message)
            setLoading(false)
          }
        )

        eventUnsubs.set(id, unsubscribe)
      })

      publish()
    }

    const backfillMissingIndex = async () => {
      if (fallbackChecked || loadedIndexDates.size !== dateKeys.length) return
      fallbackChecked = true

      const hasIndexedEvents = [...indexByDate.values()].some((value) => Object.keys(value || {}).length > 0)
      if (hasIndexedEvents) return

      const snapshot = await get(calendarEventsRef(user.uid))
      const value = snapshot.val() || {}
      const updates = {}

      Object.entries(value).forEach(([id, event]) => {
        getEventDateKeys(event).forEach((date) => {
          updates[`users/${user.uid}/pages/calendar/eventsByDate/${date}/${id}`] = true
        })
      })

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates)
      }
    }

    const indexUnsubs = dateKeys.map((date) => onValue(
      calendarEventsByDateRef(user.uid, date),
      (snapshot) => {
        indexByDate.set(date, snapshot.val() || {})
        loadedIndexDates.add(date)
        reconcileEventSubscriptions()
        backfillMissingIndex().catch((e) => {
          console.error(e)
          setError(e.message)
          setLoading(false)
        })
      },
      (e) => {
        console.error(e)
        setEvents([])
        setError(e.message)
        setLoading(false)
      }
    ))

    return () => {
      disposed = true
      indexUnsubs.forEach((unsubscribe) => unsubscribe())
      eventUnsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [user, currentMonth])

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

      await writeEventWithDateIndex(user.uid, newRef.key, saved)
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

      const previousEvent = events.find((eventItem) => eventItem.id === eventId)
      await writeEventWithDateIndex(user.uid, eventId, updated, previousEvent)
      return { ...updated, id: eventId }
    }

    const updated = await updateEvent(null, calendarId, eventId, event)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...updated, calendarId } : e)))
    return updated
  }

  const removeEvent = async (calendarId, eventId) => {
    if (!CALENDAR_BACKEND_ENABLED) {
      if (!user) throw new Error('로그인이 필요합니다.')

      const previousEvent = events.find((eventItem) => eventItem.id === eventId)
      await removeEventWithDateIndex(user.uid, eventId, previousEvent)
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
        updates[`users/${user.uid}/pages/calendar/events/${event.id}`] = null
        getEventDateKeys(event).forEach((dateKey) => {
          updates[`users/${user.uid}/pages/calendar/eventsByDate/${dateKey}/${event.id}`] = null
        })
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

      const event = {
        ...makeEvent(formData),
        calendarId: LOCAL_CALENDAR.id,
        mineType: 'routine',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      updates[`users/${user.uid}/pages/calendar/events/${newRef.key}`] = event
      getEventDateKeys(event).forEach((dateKey) => {
        updates[`users/${user.uid}/pages/calendar/eventsByDate/${dateKey}/${newRef.key}`] = true
      })
    })

    await update(ref(db), updates)
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
