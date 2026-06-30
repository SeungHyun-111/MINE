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
import { addDateKeyDays, getDateTimeDateKey, getDateTimeTime } from '@/lib/dateTime'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

const COLOR_MAP = {
  1: 'bg-blue-400',
  2: 'bg-green-500',
  3: 'bg-purple-400',
  4: 'bg-red-400',
  5: 'bg-yellow-400',
  6: 'bg-orange-400',
  7: 'bg-teal-400',
  8: 'bg-gray-400',
  9: 'bg-indigo-400',
  10: 'bg-lime-500',
  11: 'bg-pink-400',
}

function addDays(dateString, days) {
  return addDateKeyDays(dateString, days)
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
  const start = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
  const rawEnd = event.end?.date || getDateTimeDateKey(event.end?.dateTime) || start

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
  return getDateTimeTime(event.start?.dateTime)
}

function groupEventsByTime(events) {
  return events.reduce((groups, event) => {
    const time = getBadgeTime(event)
    const key = time || 'all-day'
    const group = groups.find((item) => item.key === key)

    if (group) {
      group.events.push(event)
    } else {
      groups.push({ key, time, events: [event] })
    }

    return groups
  }, [])
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
    <section className={`flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm md:min-h-0 ${
      selectedDate ? 'min-h-[520px]' : 'h-full min-h-0'
    }`}>
      <div className="flex items-center justify-center gap-3 border-b border-[#92bdc0] bg-[#99ccff] px-4 py-3">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="w-32 text-center text-lg font-bold text-[#0044cc]">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff] active:bg-[#c9dfe1]"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-[#bbd5f5] bg-[#eef3ff]">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold ${
              index === 0 ? 'text-[#ba7373]' : index === 6 ? 'text-[#4f7f91]' : 'text-[#4477cc]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 auto-rows-fr bg-white/90">
        {Array.from({ length: startPad }).map((_, index) => (
          <div key={`pad-${index}`} className="min-h-[86px] border-b border-r border-[#d5e8ff] bg-[#f5f9ff] md:min-h-[112px]" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((event) => includesDate(event, dateStr))
          const dayEventGroups = groupEventsByTime(dayEvents)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const dayOfWeek = getDay(day)

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
              className={`flex min-h-[86px] flex-col items-center border-b border-r border-[#d5e8ff] p-1.5 text-left transition-colors md:min-h-[112px] ${
                isSelected ? 'bg-[#e6f2f3]' : 'bg-white/90 hover:bg-[#f0f5ff] active:bg-[#eaf1f2]'
              }`}
            >
              <span
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
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

              <div className="flex w-full min-w-0 flex-col gap-1">
                {dayEventGroups.slice(0, 2).map((group) => {
                  const event = group.events[0]
                  const { className, style } = getEventStyle(event, calendars)
                  const isDone = group.events.every((item) => item.status === 'done')
                  const isHigh = group.events.some((item) => item.priority === 'high')
                  const suffix = group.events.length > 1 ? ` 외 ${group.events.length - 1}` : ''

                  return (
                    <div
                      key={`${dateStr}_${group.key}`}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] leading-tight text-white ${isDone ? 'line-through opacity-70' : ''} ${isHigh ? 'bg-[#e85252]' : className}`}
                      style={isHigh ? {} : style}
                    >
                      {isHigh && <span className="mr-1 font-black">중요</span>}
                      {group.time && <span className="font-semibold">{group.time} </span>}
                      {event.summary || '(제목 없음)'}{suffix}
                    </div>
                  )
                })}
                {dayEventGroups.length > 2 && (
                  <div className="px-1 text-[10px] text-[#5577bb]">
                    +{dayEventGroups.length - 2}
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
