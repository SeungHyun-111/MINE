import { useState } from 'react'
import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarRange, Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useTodos } from '@/hooks/useTodos'
import { clampDateInputYear, formatDateKey, parseDateKey } from '@/lib/dateTime'

const PRIORITIES = {
  high: { label: '높음', className: 'bg-[#e9b5b5] text-[#743b3b]' },
  medium: { label: '보통', className: 'bg-[#cce0ff] text-[#0044cc]' },
  low: { label: '낮음', className: 'bg-[#e9eee6] text-[#53664f]' },
}

function toDateString(date) {
  return format(date, 'yyyy-MM-dd')
}

function diffDays(startDate, endDate) {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)
  if (!start || !end) return 0
  return Math.round((end - start) / 86400000)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function sectionLabel(section) {
  const labels = {
    todo: '할 일',
    doing: '진행 중',
    done: '완료',
  }
  return labels[section.id] || section.title
}

function formatDateRange(startDate, endDate) {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)

  if (!start && !end) return '일정 없음'
  if (startDate === endDate || !end) {
    return start ? format(start, 'M.d (EEE)', { locale: ko }) : startDate
  }

  const startLabel = start ? format(start, 'M.d (EEE)', { locale: ko }) : startDate
  const endLabel = end ? format(end, 'M.d (EEE)', { locale: ko }) : endDate
  return `${startLabel} ~ ${endLabel}`
}

function plannedDateRange(todo) {
  const startDate = todo.startDate
  const endDate = todo.endDate || startDate
  return formatDateRange(startDate, endDate)
}

function progressDateRange(todo, todayString = toDateString(new Date())) {
  const sectionId = todo.sectionId || 'todo'
  if (sectionId === 'todo') return null

  const startDate = todo.progressStartDate || todo.startDate || todayString
  const endDate = sectionId === 'done'
    ? todo.progressEndDate || startDate
    : todayString

  return formatDateRange(startDate, endDate)
}

function TodoModal({ mode = 'add', sections, initialValues, onClose, onSubmit }) {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [startDate, setStartDate] = useState(initialValues?.startDate || toDateString(new Date()))
  const [endDate, setEndDate] = useState(initialValues?.endDate || initialValues?.startDate || toDateString(new Date()))
  const [sectionId, setSectionId] = useState(initialValues?.sectionId || 'todo')
  const [priority, setPriority] = useState(initialValues?.priority || 'medium')
  const titleText = mode === 'edit' ? 'Todo 수정' : 'Todo 추가'
  const submitText = mode === 'edit' ? '수정' : '추가'

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) return

    await onSubmit({
      title: title.trim(),
      startDate,
      endDate,
      sectionId,
      priority,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0044cc]/45 px-3 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg border border-[#aacce4] bg-[#f0f5ff] shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#aaccee] bg-[#cce0ff] px-4 py-3">
          <h2 className="text-base font-bold text-[#0044cc]">{titleText}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#4477cc] hover:bg-[#bbd5ff] hover:text-[#0044cc]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <textarea
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            rows={2}
            placeholder="Todo 제목"
            className="w-full resize-none rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              onInput={clampDateInputYear}
              max="9999-12-31"
              className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              onInput={clampDateInputYear}
              max="9999-12-31"
              className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb]"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{sectionLabel(section)}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb]"
            >
              {Object.entries(PRIORITIES).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </div>

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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-4 py-2 text-sm font-bold text-white hover:bg-[#002080]"
            >
              <Plus size={16} />
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ganttBarClass(todo, todayString) {
  if (todo.completed || todo.sectionId === 'done') {
    return 'bg-[#bbd8ff] text-[#4477cc] line-through'
  }
  if ((todo.endDate || todo.startDate) < todayString) {
    return 'bg-[#b94a48] text-white'
  }
  if (todo.sectionId === 'doing') {
    return 'bg-[#2563eb] text-white'
  }
  return 'bg-[#0044cc] text-white'
}

function ganttRange(todo, todayString) {
  const sectionId = todo.sectionId || 'todo'
  if (sectionId === 'doing') {
    const start = todo.progressStartDate || todo.startDate || todayString
    return { start, end: todayString }
  }
  if (sectionId === 'done') {
    const start = todo.progressStartDate || todo.startDate || todayString
    return { start, end: todo.progressEndDate || start }
  }

  const start = todo.startDate || todayString
  return { start, end: todo.endDate || start }
}

function nextTodoAction(todo) {
  const sectionId = todo.sectionId || 'todo'
  if (sectionId === 'todo') return '진행 중으로 이동'
  if (sectionId === 'doing') return '완료로 이동'
  return '다시 할 일로 이동'
}

function GanttChart({ sections, todos, onCellDoubleClick }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = new Date()
  const todayString = toDateString(today)
  const rangeStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 0 })
  const days = Array.from({ length: 14 }, (_, index) => addDays(rangeStart, index))
  const rangeStartString = toDateString(rangeStart)
  const rangeEndString = toDateString(days[days.length - 1])

  const visibleTodos = todos.filter((todo) => {
    const { start, end } = ganttRange(todo, todayString)
    return end >= rangeStartString && start <= rangeEndString
  })
  const todosBySection = visibleTodos.reduce((acc, todo) => {
    const key = todo.sectionId || 'todo'
    if (!acc[key]) acc[key] = []
    acc[key].push(todo)
    return acc
  }, {})

  return (
    <section className="hidden overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm md:block">
      <div className="flex items-center justify-between border-b border-[#92bdc0] bg-[#99ccff] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={20} className="text-[#0044cc]" />
          <div>
            <h2 className="text-base font-bold text-[#0044cc]">Todo 간트</h2>
            <p className="text-xs font-medium text-[#2255aa]">
              {format(days[0], 'M월 d일', { locale: ko })} - {format(days[13], 'M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value - 1)}
            className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff]"
            aria-label="직전 주차"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-lg bg-[#f0f5ff] px-3 py-2 text-xs font-black text-[#0044cc] hover:bg-[#cce0ff]"
          >
            이번 주
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value + 1)}
            className="rounded-full bg-[#f0f5ff] p-2 text-[#0044cc] hover:bg-[#cce0ff]"
            aria-label="다음 주차"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[120px_repeat(14,minmax(48px,1fr))] border-b border-[#bbd5f5] bg-[#eef3ff]">
            <div className="px-3 py-2 text-xs font-bold text-[#4477cc]">섹션</div>
            {days.map((day) => (
              <div
                key={formatDateKey(day)}
                className={`border-l border-[#bbd5f5] px-1 py-2 text-center ${
                  isSameDay(day, today) ? 'bg-[#cce0ff]' : ''
                }`}
              >
                <p className="text-[11px] font-semibold text-[#4477cc]">{format(day, 'EEE', { locale: ko })}</p>
                <p className="text-sm font-bold text-[#0044cc]">{format(day, 'd')}</p>
              </div>
            ))}
          </div>

          {sections.map((section) => {
            const sectionTodos = todosBySection[section.id] || []
            const laneCount = Math.max(sectionTodos.length, 1)
            const rowHeight = 20 + laneCount * 34

            return (
              <div
                key={section.id}
                className="grid grid-cols-[120px_1fr] border-b border-[#d5e8ff] last:border-b-0"
              >
                <div className="border-r border-[#d5e8ff] bg-[#f5f9ff] px-3 py-3 text-sm font-bold text-[#0044cc]">
                  {sectionLabel(section)}
                </div>
                <div
                  className="relative bg-white/90"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #d5e8ff 1px, transparent 1px)',
                    backgroundSize: 'calc(100% / 14) 100%',
                    minHeight: rowHeight,
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))]">
                    {days.map((day) => (
                      <button
                        type="button"
                        key={`${section.id}_${formatDateKey(day)}`}
                        onDoubleClick={() => onCellDoubleClick({
                          sectionId: section.id,
                          startDate: toDateString(day),
                          endDate: toDateString(day),
                        })}
                        className="border-l border-transparent hover:bg-[#eef7f7]/70"
                        aria-label={`${sectionLabel(section)} ${format(day, 'M월 d일', { locale: ko })} Todo 추가`}
                      />
                    ))}
                  </div>
                  {sectionTodos.map((todo, index) => {
                    const { start, end } = ganttRange(todo, todayString)
                    const startOffset = clamp(diffDays(rangeStartString, start || rangeStartString), 0, 13)
                    const endOffset = clamp(diffDays(rangeStartString, end || start || rangeStartString), 0, 13)
                    const span = Math.max(endOffset - startOffset + 1, 1)

                    return (
                      <div
                        key={todo.id}
                        className={`pointer-events-none absolute h-7 rounded-md px-2 text-xs font-semibold leading-7 truncate shadow-sm ${ganttBarClass(todo, todayString)}`}
                        style={{
                          left: `calc(${startOffset} * 100% / 14 + 4px)`,
                          width: `calc(${span} * 100% / 14 - 8px)`,
                          top: 10 + index * 34,
                        }}
                      >
                        {todo.title}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TodoList({ sections, todos, onAdvance, onEdit, onRemove, onAdd }) {
  const todosBySection = todos.reduce((acc, todo) => {
    const key = todo.sectionId || 'todo'
    if (!acc[key]) acc[key] = []
    acc[key].push(todo)
    return acc
  }, {})

  return (
    <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#aaccee] bg-[#cce0ff] px-4 py-3">
        <h2 className="text-base font-bold text-[#0044cc]">Todo 리스트</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-3 py-2 text-sm font-bold text-white active:bg-[#123542]"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      <div className="divide-y divide-[#d5e8ff]">
        {sections.map((section) => {
          const sectionTodos = todosBySection[section.id] || []

          return (
            <div key={section.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0044cc]">{sectionLabel(section)}</h3>
                <span className="text-xs font-semibold text-[#5577bb]">{sectionTodos.length}</span>
              </div>

              {sectionTodos.length === 0 ? (
                <p className="py-3 text-sm text-[#7799cc]">등록된 Todo가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {sectionTodos.map((todo) => (
                    <li key={todo.id} className="flex items-start gap-2 rounded-lg border border-[#d5e8ff] bg-[#f5f9ff] px-3 py-3">
                      <button
                        onClick={() => onAdvance(todo)}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          todo.completed || todo.sectionId === 'done' ? 'border-[#0044cc] bg-[#0044cc] text-white' : 'border-[#99ccff] text-transparent hover:text-[#0044cc]'
                        }`}
                        title={nextTodoAction(todo)}
                        aria-label={nextTodoAction(todo)}
                      >
                        <Check size={14} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`break-words text-sm font-semibold leading-5 text-[#1a3d8a] ${
                            todo.completed ? 'line-through text-[#5577bb]' : ''
                          }`}
                        >
                          {todo.title || '(제목 없음)'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5577bb]">
                          <span className="break-keep">계획 {plannedDateRange(todo)}</span>
                          {progressDateRange(todo) && (
                            <span className="break-keep rounded-full bg-[#eef3ff] px-2 py-0.5 font-bold text-[#0044cc]">
                              진행 {progressDateRange(todo)}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 font-bold ${PRIORITIES[todo.priority || 'medium'].className}`}>
                            {PRIORITIES[todo.priority || 'medium'].label}
                          </span>
                          <span className="rounded-full bg-white/90 px-2 py-0.5 font-bold text-[#0044cc]">
                            {sectionLabel(sections.find((item) => item.id === (todo.sectionId || 'todo')) || { id: todo.sectionId })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onEdit(todo)}
                        className="shrink-0 p-2 text-[#5577bb] hover:text-[#0044cc]"
                        aria-label="수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onRemove(todo.id)}
                        className="shrink-0 p-2 text-[#5577bb] hover:text-[#7a3d3d]"
                        aria-label="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function TodoPage() {
  const { sections, todos, loading, error, addTodo, updateTodo, advanceTodo, removeTodo } = useTodos()
  const [addModal, setAddModal] = useState(null)
  const [editTodo, setEditTodo] = useState(null)
  const todayString = toDateString(new Date())

  const openAddModal = (initialValues = {}) => {
    setAddModal(initialValues)
  }

  return (
    <div className="min-h-full bg-[#f0f5ff] p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#0044cc]">Todo</h1>
        <p className="text-sm text-[#4477cc] md:hidden">모바일에서는 리스트 중심으로 관리합니다.</p>
        <p className="hidden text-sm text-[#4477cc] md:block">간트 차트의 날짜 셀을 더블클릭해 Todo를 추가합니다.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-[#bbddff] bg-white/90 px-3 py-2 text-sm font-medium text-[#4477cc]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5588bb] border-t-transparent" />
            RTDB 동기화 중
          </div>
        )}

        <TodoList
          sections={sections}
          todos={todos}
          onAdvance={advanceTodo}
          onEdit={setEditTodo}
          onRemove={removeTodo}
          onAdd={() => openAddModal()}
        />
        <GanttChart sections={sections} todos={todos} onCellDoubleClick={openAddModal} />
      </div>

      {addModal && (
        <TodoModal
          sections={sections}
          initialValues={addModal}
          onClose={() => setAddModal(null)}
          onSubmit={addTodo}
        />
      )}
      {editTodo && (
        <TodoModal
          mode="edit"
          sections={sections}
          initialValues={editTodo}
          onClose={() => setEditTodo(null)}
          onSubmit={(payload) => {
            const previousSection = editTodo.sectionId || 'todo'
            const nextSection = payload.sectionId || 'todo'
            const nextPayload = { ...payload }

            if (nextSection === 'todo') {
              nextPayload.progressStartDate = null
              nextPayload.progressEndDate = null
            } else if (nextSection === 'doing') {
              nextPayload.progressStartDate = editTodo.progressStartDate || todayString
              nextPayload.progressEndDate = null
            } else if (nextSection === 'done') {
              nextPayload.progressStartDate = editTodo.progressStartDate || todayString
              nextPayload.progressEndDate = previousSection === 'done'
                ? editTodo.progressEndDate || todayString
                : todayString
            }

            return updateTodo(editTodo.id, nextPayload)
          }}
        />
      )}
    </div>
  )
}
