import { useEffect, useMemo, useState } from 'react'
import { isSameDay } from 'date-fns'
import { Search } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import CalendarView from '@/components/calendar/CalendarView'
import DayEventList from '@/components/calendar/DayEventList'
import EventFormModal from '@/components/calendar/EventFormModal'

export default function CalendarPage({ focusDate, focusKey }) {
  const {
    events,
    calendars,
    loading,
    error,
    currentMonth,
    goToMonth,
    addEvent,
    editEvent,
    removeEvent,
    updateEventStatus,
    updateEventPriority,
  } = useCalendar()
  const [selectedDate, setSelectedDate] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendarError') || params.has('calendarConnected')) {
      params.delete('calendarError')
      params.delete('calendarConnected')
      const query = params.toString()
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', nextUrl)
    }
  }, [])

  useEffect(() => {
    if (!focusDate) return

    const nextDate = new Date(focusDate)
    setSelectedDate(nextDate)
    goToMonth(nextDate)
  }, [focusDate, focusKey, goToMonth])

  const filteredEvents = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return events

    return events.filter((event) => {
      const calendar = calendars.find((cal) => cal.id === event.calendarId)
      return [
        event.summary,
        event.description,
        event.location,
        calendar?.summary,
      ].some((value) => value?.toLowerCase().includes(keyword))
    })
  }, [events, calendars, searchQuery])

  const handleDaySelect = (date) => {
    setSelectedDate((current) => (
      current && isSameDay(current, date) ? null : date
    ))
  }

  const openAddForm = (date = selectedDate || new Date()) => {
    setSelectedDate(date)
    setEditingEvent(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (event) => {
    setEditingEvent(event)
    setFormError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
    setFormError(null)
  }

  const handleSaveEvent = async (formData) => {
    setSaving(true)
    setFormError(null)

    try {
      if (editingEvent) {
        await editEvent(editingEvent.calendarId, editingEvent.id, formData)
      } else {
        await addEvent(formData)
      }
      closeForm()
    } catch (e) {
      console.error(e)
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveEvent = async (event) => {
    if (!window.confirm('일정을 삭제할까요?')) return

    setFormError(null)
    try {
      await removeEvent(event.calendarId, event.id)
    } catch (e) {
      console.error(e)
      setFormError(e.message)
      setEditingEvent(event)
      setIsFormOpen(true)
    }
  }

  const handleStatusChange = async (event, status) => {
    setFormError(null)
    try {
      await updateEventStatus(event.id, status)
    } catch (e) {
      console.error(e)
      setFormError(e.message)
    }
  }

  const handlePriorityChange = async (event, priority) => {
    setFormError(null)
    try {
      await updateEventPriority(event.id, priority)
    } catch (e) {
      console.error(e)
      setFormError(e.message)
    }
  }

  const renderDayList = (variant = 'inline') => {
    if (!selectedDate) return null

    return (
      <DayEventList
        date={selectedDate}
        events={filteredEvents}
        onAdd={() => openAddForm()}
        onEdit={openEditForm}
        onRemove={handleRemoveEvent}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onClose={() => setSelectedDate(null)}
        variant={variant}
      />
    )
  }

  return (
    <div className="flex h-full min-h-full flex-col bg-[#f0f5ff]">
      {loading && (
        <div className="flex justify-center border-b border-[#bbd0ee] bg-white/90 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5588bb] border-t-transparent" />
        </div>
      )}

      {(error || formError) && (
        <div className="border-b border-[#e4bcbc] bg-[#fff0f0] px-4 py-2 text-sm font-bold text-[#7a3d3d]">
          {formError || error}
        </div>
      )}

      <div className="shrink-0 border-b border-[#bbddff] bg-[#e8f1f2] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0044cc]">캘린더 검색</h2>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#4477cc] hover:text-[#0044cc]"
            >
              초기화
            </button>
          )}
        </div>
        <label className="relative block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5588bb]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="일정 검색"
            className="w-full rounded-lg border border-[#99ccff] bg-white/90 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:hidden">
        <div className={`min-h-0 flex-1 rounded-lg ${selectedDate ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          <CalendarView
            events={filteredEvents}
            calendars={calendars}
            currentMonth={currentMonth}
            onMonthChange={goToMonth}
            onDayClick={handleDaySelect}
            onDayDoubleClick={openAddForm}
            selectedDate={selectedDate}
          />
        </div>

        {selectedDate && (
          <div className="h-[34svh] min-h-[220px] shrink-0 overflow-hidden rounded-lg">
            {renderDayList('panel')}
          </div>
        )}
      </div>

      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 md:flex">
        <CalendarView
          events={filteredEvents}
          calendars={calendars}
          currentMonth={currentMonth}
          onMonthChange={goToMonth}
          onDayClick={handleDaySelect}
          onDayDoubleClick={openAddForm}
          selectedDate={selectedDate}
        />
        {renderDayList()}
      </div>

      {isFormOpen && (
        <EventFormModal
          date={selectedDate || new Date()}
          eventToEdit={editingEvent}
          error={formError}
          saving={saving}
          onClose={closeForm}
          onSubmit={handleSaveEvent}
        />
      )}
    </div>
  )
}
