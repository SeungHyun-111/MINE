import { useState } from 'react'
import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarRange, Check, Plus, Trash2, X } from 'lucide-react'
import { useTodos } from '@/hooks/useTodos'

const PRIORITIES = {
  high: { label: '높음', className: 'bg-[#e9b5b5] text-[#743b3b]' },
  medium: { label: '보통', className: 'bg-[#dcebed] text-[#1f4e5f]' },
  low: { label: '낮음', className: 'bg-[#e9eee6] text-[#53664f]' },
}

function toDateString(date) {
  return format(date, 'yyyy-MM-dd')
}

function diffDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
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

function TodoAddModal({ sections, initialValues, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(initialValues?.startDate || toDateString(new Date()))
  const [endDate, setEndDate] = useState(initialValues?.endDate || initialValues?.startDate || toDateString(new Date()))
  const [sectionId, setSectionId] = useState(initialValues?.sectionId || 'todo')
  const [priority, setPriority] = useState('medium')

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1f4e5f]/45 px-3 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg border border-[#c9d6de] bg-[#f4f7f7] shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#c3dadd] bg-[#dcebed] px-4 py-3">
          <h2 className="text-base font-bold text-[#1f4e5f]">Todo 추가</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#55777b] hover:bg-[#cfe1e4] hover:text-[#1f4e5f]"
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
            className="w-full resize-none rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9]"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{sectionLabel(section)}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9]"
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
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#55777b] hover:bg-[#e1edef]"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f4e5f] px-4 py-2 text-sm font-bold text-white hover:bg-[#173f4e]"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ganttBarClass(todo, todayString) {
  if (todo.completed || todo.sectionId === 'done') {
    return 'bg-[#c8d8d9] text-[#55777b] line-through'
  }
  if ((todo.endDate || todo.startDate) < todayString) {
    return 'bg-[#b94a48] text-white'
  }
  if (todo.sectionId === 'doing') {
    return 'bg-[#2563eb] text-white'
  }
  return 'bg-[#1f4e5f] text-white'
}

function displayEndDate(todo, todayString) {
  const start = todo.startDate || todayString
  const end = todo.endDate || start
  if (
    !todo.completed &&
    todo.sectionId !== 'done' &&
    start <= todayString &&
    end < todayString
  ) {
    return todayString
  }

  return end
}

function nextTodoAction(todo) {
  const sectionId = todo.sectionId || 'todo'
  if (sectionId === 'todo') return '진행 중으로 이동'
  if (sectionId === 'doing') return '완료로 이동'
  return todo.calendarReady ? '캘린더 반영 대기 중' : '캘린더 반영 표시'
}

function GanttChart({ sections, todos, onCellDoubleClick }) {
  const today = new Date()
  const todayString = toDateString(today)
  const rangeStart = startOfWeek(today, { weekStartsOn: 0 })
  const days = Array.from({ length: 14 }, (_, index) => addDays(rangeStart, index))
  const rangeStartString = toDateString(rangeStart)
  const rangeEndString = toDateString(days[days.length - 1])

  const visibleTodos = todos.filter((todo) => {
    const start = todo.startDate || rangeStartString
    const end = todo.endDate || start
    return end >= rangeStartString && start <= rangeEndString
  })
  const todosBySection = visibleTodos.reduce((acc, todo) => {
    const key = todo.sectionId || 'todo'
    if (!acc[key]) acc[key] = []
    acc[key].push(todo)
    return acc
  }, {})

  return (
    <section className="hidden overflow-hidden rounded-lg border border-[#c9d6de] bg-white shadow-sm md:block">
      <div className="flex items-center justify-between border-b border-[#92bdc0] bg-[#aacfd0] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={20} className="text-[#1f4e5f]" />
          <div>
            <h2 className="text-base font-bold text-[#1f4e5f]">Todo 간트</h2>
            <p className="text-xs font-medium text-[#426d78]">
              {format(days[0], 'M월 d일', { locale: ko })} - {format(days[13], 'M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        <p className="text-xs font-semibold text-[#1f4e5f]">2주 보기</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[120px_repeat(14,minmax(48px,1fr))] border-b border-[#d4e1e3] bg-[#eef5f5]">
            <div className="px-3 py-2 text-xs font-bold text-[#55777b]">섹션</div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`border-l border-[#d4e1e3] px-1 py-2 text-center ${
                  isSameDay(day, today) ? 'bg-[#dcebed]' : ''
                }`}
              >
                <p className="text-[11px] font-semibold text-[#55777b]">{format(day, 'EEE', { locale: ko })}</p>
                <p className="text-sm font-bold text-[#1f4e5f]">{format(day, 'd')}</p>
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
                className="grid grid-cols-[120px_1fr] border-b border-[#e3ecee] last:border-b-0"
              >
                <div className="border-r border-[#e3ecee] bg-[#f7fafa] px-3 py-3 text-sm font-bold text-[#1f4e5f]">
                  {sectionLabel(section)}
                </div>
                <div
                  className="relative bg-white"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #e3ecee 1px, transparent 1px)',
                    backgroundSize: 'calc(100% / 14) 100%',
                    minHeight: rowHeight,
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))]">
                    {days.map((day) => (
                      <button
                        type="button"
                        key={`${section.id}_${day.toISOString()}`}
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
                    const startOffset = clamp(diffDays(rangeStartString, todo.startDate || rangeStartString), 0, 13)
                    const endOffset = clamp(diffDays(rangeStartString, displayEndDate(todo, todayString)), 0, 13)
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

function TodoList({ sections, todos, onAdvance, onUpdate, onRemove, onAdd }) {
  const todosBySection = todos.reduce((acc, todo) => {
    const key = todo.sectionId || 'todo'
    if (!acc[key]) acc[key] = []
    acc[key].push(todo)
    return acc
  }, {})

  return (
    <section className="overflow-hidden rounded-lg border border-[#c9d6de] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#c3dadd] bg-[#dcebed] px-4 py-3">
        <h2 className="text-base font-bold text-[#1f4e5f]">Todo 리스트</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f4e5f] px-3 py-2 text-sm font-bold text-white active:bg-[#123542]"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      <div className="divide-y divide-[#e0eaec]">
        {sections.map((section) => {
          const sectionTodos = todosBySection[section.id] || []

          return (
            <div key={section.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1f4e5f]">{sectionLabel(section)}</h3>
                <span className="text-xs font-semibold text-[#789094]">{sectionTodos.length}</span>
              </div>

              {sectionTodos.length === 0 ? (
                <p className="py-3 text-sm text-[#9aadb1]">등록된 Todo가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {sectionTodos.map((todo) => (
                    <li key={todo.id} className="flex items-start gap-2 rounded-lg border border-[#e0eaec] bg-[#fbfdfd] px-3 py-3">
                      <button
                        onClick={() => onAdvance(todo)}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          todo.completed || todo.sectionId === 'done' ? 'border-[#1f4e5f] bg-[#1f4e5f] text-white' : 'border-[#aacfd0] text-transparent hover:text-[#1f4e5f]'
                        }`}
                        title={nextTodoAction(todo)}
                        aria-label={nextTodoAction(todo)}
                      >
                        <Check size={14} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <textarea
                          value={todo.title || ''}
                          rows={2}
                          onChange={(event) => onUpdate(todo.id, { title: event.target.value })}
                          className={`w-full resize-none overflow-hidden break-words bg-transparent text-sm font-semibold leading-5 text-[#304852] outline-none ${
                            todo.completed ? 'line-through text-[#789094]' : ''
                          }`}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#789094]">
                          <span className="break-keep">{todo.startDate} - {todo.endDate}</span>
                          {todo.calendarReady && (
                            <span className="rounded-full bg-[#fff2df] px-2 py-0.5 font-bold text-[#7a4a10]">
                              캘린더 반영 대기
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 font-bold ${PRIORITIES[todo.priority || 'medium'].className}`}>
                            {PRIORITIES[todo.priority || 'medium'].label}
                          </span>
                          <select
                            value={todo.sectionId || 'todo'}
                            onChange={(event) => onUpdate(todo.id, { sectionId: event.target.value })}
                            className="rounded-md border border-[#aacfd0] bg-white px-2 py-1 text-xs text-[#1f4e5f] outline-none"
                          >
                            {sections.map((item) => (
                              <option key={item.id} value={item.id}>{sectionLabel(item)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemove(todo.id)}
                        className="shrink-0 p-2 text-[#789094] hover:text-[#7a3d3d]"
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

  const openAddModal = (initialValues = {}) => {
    setAddModal(initialValues)
  }

  return (
    <div className="min-h-full bg-[#f4f7f7] p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1f4e5f]">Todo</h1>
        <p className="text-sm text-[#55777b] md:hidden">모바일에서는 리스트 중심으로 관리합니다.</p>
        <p className="hidden text-sm text-[#55777b] md:block">간트 차트의 날짜 셀을 더블클릭해 Todo를 추가합니다.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-[#c8dadc] bg-white px-3 py-2 text-sm font-medium text-[#55777b]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#79a8a9] border-t-transparent" />
            RTDB 동기화 중
          </div>
        )}

        <TodoList
          sections={sections}
          todos={todos}
          onAdvance={advanceTodo}
          onUpdate={updateTodo}
          onRemove={removeTodo}
          onAdd={() => openAddModal()}
        />
        <GanttChart sections={sections} todos={todos} onCellDoubleClick={openAddModal} />
      </div>

      {addModal && (
        <TodoAddModal
          sections={sections}
          initialValues={addModal}
          onClose={() => setAddModal(null)}
          onSubmit={addTodo}
        />
      )}
    </div>
  )
}
