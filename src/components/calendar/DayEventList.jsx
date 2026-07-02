import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronDown, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { addDateKeyDays, getDateTimeDateKey, getDateTimeTime } from '@/lib/dateTime'

const EVENT_STATUSES = [
  { id: 'pending', label: '미완료' },
  { id: 'done', label: '완료' },
  { id: 'carried', label: '이월' },
]

const EVENT_PRIORITIES = [
  { id: 'high', label: '높음' },
  { id: 'medium', label: '보통' },
  { id: 'low', label: '낮음' },
]

function addDays(dateString, days) {
  return addDateKeyDays(dateString, days)
}

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return '종일'
  return getDateTimeTime(dateTimeStr)
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

export default function DayEventList({
  date,
  events,
  onAdd,
  onEdit,
  onRemove,
  onStatusChange,
  onPriorityChange,
  onClose,
  variant = 'inline',
}) {
  if (!date) return null

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayEvents = events.filter((event) => includesDate(event, dateStr))
  const isPanel = variant === 'panel'

  return (
    <section
      className={
        isPanel
          ? 'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm'
          : 'flex max-h-[42svh] min-h-[220px] flex-col overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm'
      }
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#aaccee] bg-[#cce0ff] px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-[#4477cc]">선택한 날짜</p>
          <h3 className="text-sm font-bold text-[#0044cc]">
            {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#002080] active:bg-[#123542]"
          >
            <Plus size={16} />
            일정 추가
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#4477cc] hover:bg-[#bbd5ff] hover:text-[#0044cc]"
              aria-label="일정 목록 접기"
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {dayEvents.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#5577bb]">일정이 없습니다</p>
        ) : (
          <ul className="divide-y divide-[#d5e8ff] bg-[#f5f9ff]">
            {dayEvents.map((event) => {
              const isAllDay = !!event.start?.date
              const isDone = event.status === 'done'
              const isHigh = event.priority === 'high'

              return (
                <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex w-20 shrink-0 items-center gap-1.5 text-xs text-[#5577bb]">
                    {!isAllDay && <Clock size={12} />}
                    <span>{isAllDay ? '종일' : formatTime(event.start?.dateTime)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit?.(event)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className={`truncate text-sm font-semibold text-[#1a3d8a] ${isDone ? 'text-[#5577bb] line-through' : ''}`}>
                      {event.summary || '(제목 없음)'}
                    </p>
                    {event.description && (
                      <p className={`mt-0.5 truncate text-xs text-[#5577bb] ${isDone ? 'line-through' : ''}`}>
                        {event.description}
                      </p>
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <select
                      value={event.priority || 'medium'}
                      onChange={(changeEvent) => onPriorityChange?.(event, changeEvent.target.value)}
                      className={`h-8 rounded-md border px-1.5 text-xs font-bold outline-none ${
                        isHigh
                          ? 'border-[#e85252] bg-[#e85252] text-white'
                          : 'border-[#bbd5f5] bg-white/90 text-[#0044cc]'
                      }`}
                      aria-label="우선순위"
                    >
                      {EVENT_PRIORITIES.map((priority) => (
                        <option key={priority.id} value={priority.id}>{priority.label}</option>
                      ))}
                    </select>
                    <select
                      value={event.status || 'pending'}
                      onChange={(changeEvent) => onStatusChange?.(event, changeEvent.target.value)}
                      className="h-8 rounded-md border border-[#bbd5f5] bg-white/90 px-1.5 text-xs font-bold text-[#0044cc] outline-none"
                      aria-label="상태"
                    >
                      {EVENT_STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>{status.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onEdit?.(event)}
                      className="rounded-md p-1.5 text-[#4477cc] hover:bg-[#d5e8ff] hover:text-[#0044cc]"
                      aria-label="일정 수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove?.(event)}
                      className="rounded-md p-1.5 text-[#9d5c5c] hover:bg-[#fff0f0] hover:text-[#7a3d3d]"
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
