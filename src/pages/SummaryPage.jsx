import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'

function addDateDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function getEventRange(event) {
  const start = event.start?.date || event.start?.dateTime?.slice(0, 10)
  const rawEnd = event.end?.date || event.end?.dateTime?.slice(0, 10) || start
  const end = event.end?.date ? addDateDays(rawEnd, -1) : rawEnd
  return { start, end: end && end >= start ? end : start }
}

function includesDate(event, dateStr) {
  const { start, end } = getEventRange(event)
  return !!start && start <= dateStr && dateStr <= end
}

function getEventTime(event) {
  if (event.start?.date) return '종일'
  return event.start?.dateTime?.slice(11, 16) || ''
}

export default function SummaryPage() {
  const { events } = useCalendar()
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  return (
    <div className="min-h-full bg-[#f4f7f7] p-4 md:p-6">
      <section className="bg-white border border-[#c9d6de] rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#aacfd0] border-b border-[#92bdc0]">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-[#1f4e5f]" />
            <div>
              <h1 className="text-lg font-bold text-[#1f4e5f]">종합</h1>
              <p className="text-xs font-medium text-[#426d78]">
                {format(weekStart, 'M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-[#1f4e5f]">
            오늘 {format(today, 'M월 d일 (EEE)', { locale: ko })}
          </p>
        </div>

        <div className="grid grid-cols-7 bg-[#eef5f5] border-b border-[#d4e1e3]">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className={`px-2 py-2 text-center border-r border-[#d4e1e3] last:border-r-0 ${
                  isToday ? 'bg-[#dcebed]' : ''
                }`}
              >
                <p className="text-xs font-semibold text-[#55777b]">
                  {format(day, 'EEE', { locale: ko })}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-[#1f4e5f]' : 'text-[#52616a]'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[260px] bg-white">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEvents = events.filter((event) => includesDate(event, dateStr))
            const isToday = isSameDay(day, today)

            return (
              <div
                key={dateStr}
                className={`border-r border-[#e3ecee] last:border-r-0 px-2 py-2 ${
                  isToday ? 'bg-[#f3fbfb]' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-[11px] text-[#9aadb1] py-1">일정 없음</p>
                  ) : (
                    dayEvents.slice(0, 4).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md bg-[#1f4e5f] px-2 py-1 text-[11px] leading-tight text-white"
                      >
                        <span className="font-bold mr-1">{getEventTime(event)}</span>
                        <span>{event.summary || '(제목 없음)'}</span>
                      </div>
                    ))
                  )}
                  {dayEvents.length > 4 && (
                    <p className="text-[11px] font-semibold text-[#55777b] px-1">
                      +{dayEvents.length - 4}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
