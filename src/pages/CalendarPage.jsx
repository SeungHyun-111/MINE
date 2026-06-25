import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import CalendarView from '@/components/calendar/CalendarView'
import DayEventList from '@/components/calendar/DayEventList'
import EventFormModal from '@/components/calendar/EventFormModal'

export default function CalendarPage() {
  const {
    events,
    calendars,
    connected,
    loading,
    error,
    currentMonth,
    prevMonth,
    nextMonth,
    addEvent,
    connectCalendar,
  } = useCalendar()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [urlError, setUrlError] = useState(null)
  const effectiveError = urlError || error

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
    if (newMonth < currentMonth) prevMonth()
    else nextMonth()
  }

  const handleAddEvent = async (formData) => {
    setSaving(true)
    setFormError(null)

    try {
      await addEvent(formData)
      setIsFormOpen(false)
    } catch (e) {
      console.error(e)
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-full bg-[#f4f7f7]">
      {/* Intentionally hidden for now; Google Calendar connection UI will be restored when backend integration is enabled.
      {!connected && (
        <div className="flex items-center justify-between gap-3 bg-[#fff8df] border-b border-[#e7d79a] px-4 py-3">
          <p className="text-sm font-medium text-[#665a2b]">Google Calendar 연결이 필요합니다.</p>
          <button
            onClick={connectCalendar}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#1f4e5f] bg-[#d6edef] hover:bg-[#c4e1e3] px-3 py-1.5 rounded-lg transition-colors"
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
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-[#1f4e5f] bg-[#d6edef] hover:bg-[#c4e1e3] px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            다시 연결
          </button>
        </div>
      )}
      */}

      {loading && (
        <div className="flex justify-center py-2 bg-white border-b border-[#d6e1e3]">
          <div className="w-4 h-4 border-2 border-[#79a8a9] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="shrink-0 bg-[#e8f1f2] border-b border-[#c8dadc] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-[#1f4e5f]">캘린더 검색</h2>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#55777b] hover:text-[#1f4e5f]"
            >
              초기화
            </button>
          )}
        </div>
        <label className="relative block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#79a8a9]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="일정 검색"
            className="w-full rounded-lg border border-[#aacfd0] bg-white pl-10 pr-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
          />
        </label>
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-y-auto p-3">
        <CalendarView
          events={filteredEvents}
          calendars={calendars}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onDayClick={setSelectedDate}
          selectedDate={selectedDate}
        />

        <DayEventList
          date={selectedDate}
          events={filteredEvents}
          onAdd={() => setIsFormOpen(true)}
        />
      </div>

      {isFormOpen && (
        <EventFormModal
          date={selectedDate}
          error={formError}
          saving={saving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddEvent}
        />
      )}
    </div>
  )
}
