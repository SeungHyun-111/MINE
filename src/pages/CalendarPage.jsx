import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import CalendarView from '@/components/calendar/CalendarView'
import DayEventList from '@/components/calendar/DayEventList'
import EventFormModal from '@/components/calendar/EventFormModal'

export default function CalendarPage({ focusDate, focusKey }) {
  const {
    events,
    calendars,
    connected,
    loading,
    error,
    currentMonth,
    goToMonth,
    addEvent,
    editEvent,
    removeEvent,
    connectCalendar,
  } = useCalendar()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [urlError, setUrlError] = useState(null)
  const effectiveError = urlError || error

  void AlertCircle
  void RefreshCw
  void connected
  void connectCalendar
  void effectiveError

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calendarError = params.get('calendarError')

    if (calendarError) setUrlError(calendarError)

    if (calendarError || params.has('calendarConnected')) {
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
    setIsDetailOpen(true)
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

  const handleMonthChange = (newMonth) => {
    goToMonth(newMonth)
  }

  const handleDaySelect = (date) => {
    setSelectedDate(date)
    setIsDetailOpen(true)
  }

  const openAddForm = (date = selectedDate) => {
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
      setIsDetailOpen(true)
    } catch (e) {
      console.error(e)
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveEvent = async (event) => {
    if (!window.confirm('이 일정을 삭제할까요?')) return

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

  return (
    <div className="flex flex-col h-full min-h-full bg-[#f0f5ff]">
      {/* Intentionally hidden for now; Google Calendar connection UI will be restored when backend integration is enabled.
      {!connected && (
        <div className="flex items-center justify-between gap-3 bg-[#fff8df] border-b border-[#e7d79a] px-4 py-3">
          <p className="text-sm font-medium text-[#665a2b]">Google Calendar 연결이 필요합니다.</p>
          <button
            onClick={connectCalendar}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0044cc] bg-[#d6edef] hover:bg-[#c4e1e3] px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            연결하기
          </button>
        </div>
      )}

      {effectiveError && (
        <div className="flex items-start justify-between gap-3 bg-[#fff0f0] border-b border-[#e4bcbc] px-4 py-3">
          <div className="flex items-start gap-2 text-sm font-medium text-[#7a3d3d]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{effectiveError}</p>
          </div>
          <button
            onClick={() => {
              setUrlError(null)
              connectCalendar()
            }}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-[#0044cc] bg-[#d6edef] hover:bg-[#c4e1e3] px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            다시 연결
          </button>
        </div>
      )}
      */}

      {loading && (
        <div className="flex justify-center py-2 bg-white/90 border-b border-[#bbd0ee]">
          <div className="w-4 h-4 border-2 border-[#5588bb] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="shrink-0 bg-[#e8f1f2] border-b border-[#bbddff] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
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
            className="w-full rounded-lg border border-[#99ccff] bg-white/90 pl-10 pr-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
          />
        </label>
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-y-auto p-3 pb-24 md:pb-3">
        <CalendarView
          events={filteredEvents}
          calendars={calendars}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onDayClick={handleDaySelect}
          onDayDoubleClick={openAddForm}
          selectedDate={selectedDate}
        />

        <div className="hidden md:block">
          <DayEventList
            date={selectedDate}
            events={filteredEvents}
            onAdd={() => openAddForm()}
            onEdit={openEditForm}
            onRemove={handleRemoveEvent}
          />
        </div>
      </div>

      {isDetailOpen && (
        <div className="fixed inset-x-0 bottom-[82px] z-30 px-3 md:hidden">
          <DayEventList
            date={selectedDate}
            events={filteredEvents}
            onAdd={() => openAddForm()}
            onEdit={openEditForm}
            onRemove={handleRemoveEvent}
            onClose={() => setIsDetailOpen(false)}
            variant="sheet"
          />
        </div>
      )}

      {isFormOpen && (
        <EventFormModal
          date={selectedDate}
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
