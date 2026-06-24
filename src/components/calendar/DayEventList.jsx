import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Plus } from 'lucide-react'

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return '종일'
  return dateTimeStr.slice(11, 16)
}

export default function DayEventList({ date, events, onAdd }) {
  if (!date) return null

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events.filter((e) => {
    const d = e.start?.date || e.start?.dateTime?.slice(0, 10)
    return d === dateStr
  })

  return (
    <div className="bg-white border-t border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold text-gray-700">
          {format(date, 'M월 d일 (EEE)', { locale: ko })}
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-indigo-600 text-sm font-medium"
        >
          <Plus size={16} />
          일정 추가
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">일정이 없습니다</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {dayEvents.map((event) => {
            const isAllDay = !!event.start?.date
            return (
              <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5 w-20 shrink-0">
                  {!isAllDay && <Clock size={12} />}
                  <span>
                    {isAllDay ? '종일' : formatTime(event.start?.dateTime)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {event.summary || '(제목 없음)'}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
