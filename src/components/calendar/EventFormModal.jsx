import { format } from 'date-fns'
import { X } from 'lucide-react'

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
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
    }
  }

  const allDay = !!event.start?.date
  const startDate = event.start?.date || event.start?.dateTime?.slice(0, 10) || format(fallbackDate || new Date(), 'yyyy-MM-dd')
  const rawEndDate = event.end?.date || event.end?.dateTime?.slice(0, 10) || startDate
  const endDate = allDay ? addDays(rawEndDate, -1) : rawEndDate

  return {
    title: event.summary || '',
    startDate,
    endDate: endDate && endDate >= startDate ? endDate : startDate,
    allDay,
    startTime: allDay ? '' : event.start?.dateTime?.slice(11, 16) || '',
    endTime: allDay ? '' : event.end?.dateTime?.slice(11, 16) || '',
    memo: event.description || '',
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
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0044cc]/45 sm:items-center">
      <div className="w-full max-w-md bg-[#f0f5ff] rounded-t-lg sm:rounded-lg shadow-xl border border-[#aacce4]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#cce0ff] border-b border-[#aaccee]">
          <h2 className="text-base font-bold text-[#0044cc]">
            {isEditing ? '일정 수정' : '일정 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#4477cc] hover:bg-[#bbd5ff] hover:text-[#0044cc]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          {error && (
            <p className="text-sm text-[#7a3d3d] bg-[#fff0f0] border border-[#e4bcbc] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <label className="block">
            <span className="block text-xs font-bold text-[#4477cc] mb-1">제목</span>
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
              <span className="block text-xs font-bold text-[#4477cc] mb-1">시작 날짜</span>
              <input
                type="date"
                name="startDate"
                defaultValue={defaults.startDate}
                required
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[#4477cc] mb-1">종료 날짜</span>
              <input
                type="date"
                name="endDate"
                defaultValue={defaults.endDate}
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
              <span className="block text-xs font-bold text-[#4477cc] mb-1">시작 시간</span>
              <input
                type="text"
                name="startTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                placeholder="09:00"
                defaultValue={defaults.startTime}
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[#4477cc] mb-1">종료 시간</span>
              <input
                type="text"
                name="endTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                placeholder="10:00"
                defaultValue={defaults.endTime}
                className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-bold text-[#4477cc] mb-1">메모</span>
            <textarea
              name="memo"
              rows={3}
              defaultValue={defaults.memo}
              className="w-full resize-none rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
              placeholder="메모"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#4477cc] rounded-lg hover:bg-[#d5e8ff]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-[#0044cc] rounded-lg hover:bg-[#002080] disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
