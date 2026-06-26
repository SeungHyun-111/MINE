import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

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

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

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

function getEventRange(event) {
  const start = event.start?.date || event.start?.dateTime?.slice(0, 10)
  const rawEnd = event.end?.date || event.end?.dateTime?.slice(0, 10) || start

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) {
    return { start: null, end: null }
  }

  const exclusiveEnd = event.end?.date && rawEnd > start ? addDays(rawEnd, -1) : rawEnd
  const end = exclusiveEnd && exclusiveEnd >= start ? exclusiveEnd : start

  return { start, end }
}

function includesDate(event, dateStr) {
  const { start, end } = getEventRange(event)
  return !!start && start <= dateStr && dateStr <= end
}

function getBadgeTime(event) {
  if (event.start?.date) return '종일'
  return event.start?.dateTime?.slice(11, 16) || ''
}

export default function CalendarView({
  events,
  calendars,
  currentMonth,
  onMonthChange,
  onDayClick,
  onDayDoubleClick,
  selectedDate,
}) {
  const firstDay = startOfMonth(currentMonth)
  const lastDay = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay)

  return (
    <section className="bg-white/90 border border-[#aacce4] rounded-lg shadow-sm flex flex-col min-h-[520px] md:flex-1 md:min-h-0 overflow-hidden">
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-[#99ccff] border-b border-[#92bdc0]">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 rounded-full bg-[#f0f5ff] text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="w-32 text-center text-lg font-bold text-[#0044cc]">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-2 rounded-full bg-[#f0f5ff] text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 bg-[#eef3ff] border-b border-[#bbd5f5] shrink-0">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-2 ${
              i === 0 ? 'text-[#ba7373]' : i === 6 ? 'text-[#4f7f91]' : 'text-[#4477cc]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-white/90">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[76px] md:min-h-[112px] border-b border-r border-[#d5e8ff] bg-[#f5f9ff]" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((event) => includesDate(event, dateStr))
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const dayOfWeek = getDay(day)

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
              className={`min-h-[76px] md:min-h-[112px] p-1.5 border-b border-r border-[#d5e8ff] flex flex-col items-center text-left transition-colors ${
                isSelected ? 'bg-[#e6f2f3]' : 'bg-white/90 hover:bg-[#f0f5ff] active:bg-[#eaf1f2]'
              }`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                  today
                    ? 'bg-[#0044cc] text-white'
                    : isSelected
                      ? 'text-[#0044cc]'
                      : dayOfWeek === 0
                        ? 'text-[#ba7373]'
                        : dayOfWeek === 6
                          ? 'text-[#4f7f91]'
                          : 'text-[#3355aa]'
                }`}
              >
                {format(day, 'd')}
              </span>

              <div className="flex flex-col gap-1 w-full min-w-0">
                {dayEvents.slice(0, 2).map((event) => {
                  const { className, style } = getEventStyle(event, calendars)
                  const time = getBadgeTime(event)
                  return (
                    <div
                      key={event.id}
                      className={`text-white text-[10px] leading-tight rounded px-1.5 py-0.5 truncate ${className}`}
                      style={style}
                    >
                      {time && <span className="hidden sm:inline font-semibold mr-1">{time}</span>}
                      {event.summary || '(제목 없음)'}
                    </div>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-[#5577bb] px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
