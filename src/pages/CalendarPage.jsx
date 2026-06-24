import { useState } from 'react'
import { useCalendar } from '@/hooks/useCalendar'
import { useAuth } from '@/hooks/useAuth'
import CalendarView from '@/components/calendar/CalendarView'
import DayEventList from '@/components/calendar/DayEventList'
import { RefreshCw } from 'lucide-react'

export default function CalendarPage() {
  const { accessToken, reconnectCalendar } = useAuth()
  const { events, calendars, loading, currentMonth, prevMonth, nextMonth } = useCalendar()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleMonthChange = (newMonth) => {
    if (newMonth < currentMonth) prevMonth()
    else nextMonth()
  }

  return (
    <div className="flex flex-col h-full">
      {/* 캘린더 권한 없을 때 배너 */}
      {!accessToken && (
        <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-700">구글 캘린더 연결이 필요합니다</p>
          <button
            onClick={reconnectCalendar}
            className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            연결하기
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 캘린더 */}
      <div className="overflow-y-auto flex-1">
        <CalendarView
          events={events}
          calendars={calendars}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onDayClick={setSelectedDate}
          selectedDate={selectedDate}
        />

        <DayEventList
          date={selectedDate}
          events={events}
          onAdd={() => {}}
        />
      </div>
    </div>
  )
}
