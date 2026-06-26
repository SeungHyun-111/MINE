import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Pencil, Plus, Trash2, X } from 'lucide-react'

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

export default function DayEventList({ date, events, onAdd, onEdit, onRemove, onClose, variant = 'inline' }) {
  if (!date) return null

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events.filter((event) => includesDate(event, dateStr))
  const isSheet = variant === 'sheet'

  return (
    <section
      className={
        isSheet
          ? 'max-h-[42svh] overflow-hidden rounded-2xl border border-[#aabbee] bg-white/90 shadow-[0_10px_32px_rgba(31,78,95,0.22)]'
          : 'bg-white/90 border border-[#aacce4] rounded-lg shadow-sm overflow-hidden'
      }
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#cce0ff] border-b border-[#aaccee]">
        <div>
          <p className="text-xs font-semibold text-[#4477cc]">선택한 날짜</p>
          <h3 className="text-sm font-bold text-[#0044cc]">
            {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#002080] active:bg-[#123542]"
          >
            <Plus size={16} />
            일정 추가
          </button>
          {isSheet && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#4477cc] active:bg-[#bbd5ff]"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className={isSheet ? 'max-h-[30svh] overflow-y-auto' : ''}>
        {dayEvents.length === 0 ? (
          <p className="text-center text-[#5577bb] text-sm py-6">일정이 없습니다</p>
        ) : (
          <ul className="divide-y divide-[#d5e8ff] bg-[#f5f9ff]">
            {dayEvents.map((event) => {
              const isAllDay = !!event.start?.date
              return (
                <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[#5577bb] text-xs mt-0.5 w-20 shrink-0">
                    {!isAllDay && <Clock size={12} />}
                    <span>{isAllDay ? '종일' : formatTime(event.start?.dateTime)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit?.(event)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-semibold text-[#1a3d8a] truncate">
                      {event.summary || '(제목 없음)'}
                    </p>
                    {event.description && (
                      <p className="text-xs text-[#5577bb] mt-0.5 truncate">
                        {event.description}
                      </p>
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(event)}
                      className="p-1.5 rounded-md text-[#4477cc] hover:bg-[#d5e8ff] hover:text-[#0044cc]"
                      aria-label="일정 수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove?.(event)}
                      className="p-1.5 rounded-md text-[#9d5c5c] hover:bg-[#fff0f0] hover:text-[#7a3d3d]"
                      aria-label="일정 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
