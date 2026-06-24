import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// Google Calendar 색상 ID → Tailwind 클래스
const COLOR_MAP = {
  '1': 'bg-blue-400',
  '2': 'bg-green-500',
  '3': 'bg-purple-400',
  '4': 'bg-red-400',
  '5': 'bg-yellow-400',
  '6': 'bg-orange-400',
  '7': 'bg-teal-400',
  '8': 'bg-gray-400',
  '9': 'bg-indigo-400',
  '10': 'bg-lime-500',
  '11': 'bg-pink-400',
}

// 캘린더 backgroundColor(hex) → inline style
function getEventStyle(event, calendars) {
  if (event.colorId) {
    return { className: COLOR_MAP[event.colorId] || 'bg-indigo-400', style: {} }
  }
  const cal = calendars?.find((c) => c.id === event.calendarId)
  if (cal?.backgroundColor) {
    return { className: '', style: { backgroundColor: cal.backgroundColor } }
  }
  return { className: 'bg-indigo-400', style: {} }
}

function getEventDate(event) {
  return event.start?.date || event.start?.dateTime?.slice(0, 10)
}

export default function CalendarView({ events, calendars, currentMonth, onMonthChange, onDayClick, selectedDate }) {
  const firstDay = startOfMonth(currentMonth)
  const lastDay = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay)

  const eventsByDate = {}
  events.forEach((event) => {
    const dateStr = getEventDate(event)
    if (!dateStr) return
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = []
    eventsByDate[dateStr].push(event)
  })

  return (
    <div className="bg-white">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-bold text-gray-800">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[64px] border-b border-gray-50" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[dateStr] || []
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const dayOfWeek = getDay(day)

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(day)}
              className={`min-h-[64px] p-1 border-b border-gray-50 flex flex-col items-center text-left transition-colors ${
                isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                  today
                    ? 'bg-indigo-500 text-white'
                    : isSelected
                    ? 'text-indigo-600 font-bold'
                    : dayOfWeek === 0
                    ? 'text-red-400'
                    : dayOfWeek === 6
                    ? 'text-blue-400'
                    : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* 이벤트 점 */}
              <div className="flex flex-col gap-0.5 w-full px-0.5">
                {dayEvents.slice(0, 2).map((event) => {
                  const { className, style } = getEventStyle(event, calendars)
                  return (
                    <div
                      key={event.id}
                      className={`text-white text-[10px] leading-tight rounded px-1 truncate ${className}`}
                      style={style}
                    >
                      {event.summary}
                    </div>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-gray-400 px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
