import { format } from 'date-fns'
import { X } from 'lucide-react'
import { addDateKeyDays, clampDateInputYear, getDateTimeDateKey, getDateTimeTime } from '@/lib/dateTime'

function addDays(dateString, days) {
  return addDateKeyDays(dateString, days)
}

function eventToDefaults(event, fallbackDate) {
  if (!event) {
    const dateValue = format(fallbackDate || new Date(), 'yyyy-MM-dd')
    return {
      title: '',
      startDate: dateValue,
      endDate: dateValue,
      allDay: true,
      startTime: '',
      endTime: '',
      memo: '',
      priority: 'medium',
    }
  }

  const allDay = !!event.start?.date
  const startDate = event.start?.date || getDateTimeDateKey(event.start?.dateTime) || format(fallbackDate || new Date(), 'yyyy-MM-dd')
  const rawEndDate = event.end?.date || getDateTimeDateKey(event.end?.dateTime) || startDate
  const endDate = allDay ? addDays(rawEndDate, -1) : rawEndDate

  return {
    title: event.summary || '',
    startDate,
    endDate: endDate && endDate >= startDate ? endDate : startDate,
    allDay,
    startTime: allDay ? '' : getDateTimeTime(event.start?.dateTime),
    endTime: allDay ? '' : getDateTimeTime(event.end?.dateTime),
    memo: event.description || '',
    priority: event.priority || 'medium',
  }
}

export default function EventFormModal({ date, eventToEdit, error, saving, onClose, onSubmit }) {
  const defaults = eventToDefaults(eventToEdit, date)
  const isEditing = !!eventToEdit

  const handleSubmit = (event) => {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const allDay = form.get('allDay') === 'on'
    const startDate = form.get('startDate')
    const endDate = form.get('endDate') || startDate

    onSubmit({
      title: form.get('title').trim(),
      startDate,
      endDate,
      startTime: allDay ? '' : form.get('startTime'),
      endTime: allDay ? '' : form.get('endTime'),
      memo: form.get('memo').trim(),
      priority: form.get('priority') || 'medium',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0044cc]/45 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg border border-[#aacce4] bg-[#f0f5ff] shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#aaccee] bg-[#cce0ff] px-4 py-3">
          <h2 className="text-base font-bold text-[#0044cc]">
            {isEditing ? '일정 수정' : '일정 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#4477cc] hover:bg-[#bbd5ff] hover:text-[#0044cc]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          {error && (
            <p className="rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-3 py-2 text-sm text-[#7a3d3d]">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#4477cc]">제목</span>
            <input
              name="title"
              required
              autoFocus
              defaultValue={defaults.title}
              className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              placeholder="일정 제목"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#4477cc]">시작 날짜</span>
              <input
                type="date"
                name="startDate"
                defaultValue={defaults.startDate}
                max="9999-12-31"
                onInput={clampDateInputYear}
                required
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#4477cc]">종료 날짜</span>
              <input
                type="date"
                name="endDate"
                defaultValue={defaults.endDate}
                max="9999-12-31"
                onInput={clampDateInputYear}
                required
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-[#0044cc]">
            <input
              type="checkbox"
              name="allDay"
              defaultChecked={defaults.allDay}
              className="h-4 w-4 rounded border-[#99ccff] text-[#0044cc]"
            />
            종일
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#4477cc]">시작 시간</span>
              <input
                type="text"
                name="startTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                maxLength={5}
                placeholder="09:00"
                defaultValue={defaults.startTime}
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#4477cc]">종료 시간</span>
              <input
                type="text"
                name="endTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                maxLength={5}
                placeholder="10:00"
                defaultValue={defaults.endTime}
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#4477cc]">메모</span>
            <textarea
              name="memo"
              rows={3}
              defaultValue={defaults.memo}
              className="w-full resize-none rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              placeholder="메모"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[#4477cc]">중요도</span>
            <select
              name="priority"
              defaultValue={defaults.priority}
              className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold text-[#0044cc] outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
            >
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#4477cc] hover:bg-[#d5e8ff]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0044cc] px-4 py-2 text-sm font-bold text-white hover:bg-[#002080] disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
