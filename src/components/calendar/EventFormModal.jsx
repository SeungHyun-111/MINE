import { format } from 'date-fns'
import { X } from 'lucide-react'

export default function EventFormModal({ date, error, saving, onClose, onSubmit }) {
  const dateValue = format(date || new Date(), 'yyyy-MM-dd')

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1f4e5f]/45 sm:items-center">
      <div className="w-full max-w-md bg-[#f4f7f7] rounded-t-lg sm:rounded-lg shadow-xl border border-[#c9d6de]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#dcebed] border-b border-[#c3dadd]">
          <h2 className="text-base font-bold text-[#1f4e5f]">일정 추가</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#55777b] hover:bg-[#cfe1e4] hover:text-[#1f4e5f]"
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
            <span className="block text-xs font-bold text-[#55777b] mb-1">제목</span>
            <input
              name="title"
              required
              autoFocus
              className="w-full rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              placeholder="일정 제목"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-bold text-[#55777b] mb-1">시작 일자</span>
              <input
                type="date"
                name="startDate"
                defaultValue={dateValue}
                required
                className="w-full rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[#55777b] mb-1">종료 일자</span>
              <input
                type="date"
                name="endDate"
                defaultValue={dateValue}
                required
                className="w-full rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-[#1f4e5f]">
            <input
              type="checkbox"
              name="allDay"
              defaultChecked
              className="h-4 w-4 rounded border-[#aacfd0] text-[#1f4e5f]"
            />
            종일
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-bold text-[#55777b] mb-1">시작 시간</span>
              <input
                type="text"
                name="startTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                placeholder="09:00"
                className="w-full rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-[#55777b] mb-1">종료 시간</span>
              <input
                type="text"
                name="endTime"
                inputMode="numeric"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                placeholder="10:00"
                className="w-full rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-bold text-[#55777b] mb-1">메모</span>
            <textarea
              name="memo"
              rows={3}
              className="w-full resize-none rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
              placeholder="메모"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#55777b] rounded-lg hover:bg-[#e1edef]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-[#1f4e5f] rounded-lg hover:bg-[#173f4e] disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
