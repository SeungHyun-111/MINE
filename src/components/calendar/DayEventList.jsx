import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Plus } from 'lucide-react'

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return '종일'
  return dateTimeStr.slice(11, 16)
}

function getEventRange(event) {
  const start = event.start?.date || event.start?.dateTime?.slice(0, 10)
  const rawEnd = event.end?.date || event.end?.dateTime?.slice(0, 10) || start
  const end = event.end?.date ? addDays(rawEnd, -1) : rawEnd
  return { start, end: end && end >= start ? end : start }
}

function includesDate(event, dateStr) {
  const { start, end } = getEventRange(event)
  return !!start && start <= dateStr && dateStr <= end
}

export default function DayEventList({ date, events, onAdd }) {
  if (!date) return null

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events.filter((event) => includesDate(event, dateStr))

  return (
    <section className="bg-white border border-[#c9d6de] rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#dcebed] border-b border-[#c3dadd]">
        <div>
          <p className="text-xs font-semibold text-[#55777b]">선택한 날짜</p>
          <h3 className="text-sm font-bold text-[#1f4e5f]">
          {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-[#1f4e5f] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#173f4e] active:bg-[#123542]"
        >
          <Plus size={16} />
          일정 추가
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <p className="text-center text-[#789094] text-sm py-6">일정이 없습니다</p>
      ) : (
        <ul className="divide-y divide-[#e0eaec] bg-[#fbfdfd]">
          {dayEvents.map((event) => {
            const isAllDay = !!event.start?.date
            return (
              <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[#789094] text-xs mt-0.5 w-20 shrink-0">
                  {!isAllDay && <Clock size={12} />}
                  <span>
                    {isAllDay ? '종일' : formatTime(event.start?.dateTime)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#304852] truncate">
                    {event.summary || '(제목 없음)'}
                  </p>
                  {event.description && (
                    <p className="text-xs text-[#789094] mt-0.5 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
