import { useMemo, useState } from 'react'
import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarRange, Check, Plus, Trash2 } from 'lucide-react'
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

function TodoForm({ sections, onSubmit }) {
  const today = toDateString(new Date())
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [sectionId, setSectionId] = useState('todo')
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

    setTitle('')
    setStartDate(today)
    setEndDate(today)
    setSectionId('todo')
    setPriority('medium')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-[1fr_140px_140px_120px_110px_auto]">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="할 일 추가"
        className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
      />
      <input
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
      />
      <input
        type="date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9] focus:ring-2 focus:ring-[#d9e8e9]"
      />
      <select
        value={sectionId}
        onChange={(event) => setSectionId(event.target.value)}
        className="rounded-lg border border-[#aacfd0] bg-white px-3 py-2 text-sm outline-none focus:border-[#79a8a9]"
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>{section.title}</option>
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
      <button className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1f4e5f] px-4 py-2 text-sm font-bold text-white hover:bg-[#173f4e]">
        <Plus size={16} />
        추가
      </button>
    </form>
  )
}

function GanttChart({ sections, todos }) {
  const today = new Date()
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
    <section className="bg-white border border-[#c9d6de] rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#aacfd0] border-b border-[#92bdc0]">
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
          <div className="grid grid-cols-[120px_repeat(14,minmax(48px,1fr))] bg-[#eef5f5] border-b border-[#d4e1e3]">
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

            return (
              <div
                key={section.id}
                className="grid grid-cols-[120px_1fr] border-b border-[#e3ecee] last:border-b-0"
              >
                <div className="bg-[#f7fafa] px-3 py-3 text-sm font-bold text-[#1f4e5f] border-r border-[#e3ecee]">
                  {section.title}
                </div>
                <div
                  className="relative min-h-[74px] bg-white"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #e3ecee 1px, transparent 1px)',
                    backgroundSize: 'calc(100% / 14) 100%',
                  }}
                >
                  {sectionTodos.map((todo, index) => {
                    const startOffset = clamp(diffDays(rangeStartString, todo.startDate || rangeStartString), 0, 13)
                    const endOffset = clamp(diffDays(rangeStartString, todo.endDate || todo.startDate || rangeStartString), 0, 13)
                    const span = Math.max(endOffset - startOffset + 1, 1)

                    return (
                      <div
                        key={todo.id}
                        className={`absolute h-7 rounded-md px-2 text-xs font-semibold leading-7 truncate shadow-sm ${
                          todo.completed ? 'bg-[#c8d8d9] text-[#55777b] line-through' : 'bg-[#1f4e5f] text-white'
                        }`}
                        style={{
                          left: `calc(${startOffset} * 100% / 14 + 4px)`,
                          width: `calc(${span} * 100% / 14 - 8px)`,
                          top: 10 + (index % 2) * 34,
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

function TodoList({ sections, todos, onToggle, onUpdate, onRemove }) {
  const todosBySection = todos.reduce((acc, todo) => {
    const key = todo.sectionId || 'todo'
    if (!acc[key]) acc[key] = []
    acc[key].push(todo)
    return acc
  }, {})

  return (
    <section className="bg-white border border-[#c9d6de] rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[#dcebed] border-b border-[#c3dadd]">
        <h2 className="text-base font-bold text-[#1f4e5f]">Todo 리스트</h2>
      </div>

      <div className="divide-y divide-[#e0eaec]">
        {sections.map((section) => {
          const sectionTodos = todosBySection[section.id] || []

          return (
            <div key={section.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1f4e5f]">{section.title}</h3>
                <span className="text-xs font-semibold text-[#789094]">{sectionTodos.length}</span>
              </div>

              {sectionTodos.length === 0 ? (
                <p className="text-sm text-[#9aadb1] py-3">등록된 할 일이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {sectionTodos.map((todo) => (
                    <li key={todo.id} className="flex items-center gap-2 rounded-lg border border-[#e0eaec] bg-[#fbfdfd] px-3 py-2">
                      <button
                        onClick={() => onToggle(todo)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          todo.completed ? 'bg-[#1f4e5f] border-[#1f4e5f] text-white' : 'border-[#aacfd0] text-transparent'
                        }`}
                        aria-label="완료 토글"
                      >
                        <Check size={14} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <input
                          value={todo.title || ''}
                          onChange={(event) => onUpdate(todo.id, { title: event.target.value })}
                          className={`w-full bg-transparent text-sm font-semibold text-[#304852] outline-none ${
                            todo.completed ? 'line-through text-[#789094]' : ''
                          }`}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#789094]">
                          <span>{todo.startDate} - {todo.endDate}</span>
                          <span className={`rounded-full px-2 py-0.5 font-bold ${PRIORITIES[todo.priority || 'medium'].className}`}>
                            {PRIORITIES[todo.priority || 'medium'].label}
                          </span>
                        </div>
                      </div>

                      <select
                        value={todo.sectionId || 'todo'}
                        onChange={(event) => onUpdate(todo.id, { sectionId: event.target.value })}
                        className="hidden sm:block rounded-md border border-[#aacfd0] bg-white px-2 py-1 text-xs text-[#1f4e5f] outline-none"
                      >
                        {sections.map((item) => (
                          <option key={item.id} value={item.id}>{item.title}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => onRemove(todo.id)}
                        className="p-2 text-[#789094] hover:text-[#7a3d3d]"
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
  const { sections, todos, loading, error, addTodo, updateTodo, toggleTodo, removeTodo } = useTodos()

  return (
    <div className="min-h-full bg-[#f4f7f7] p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1f4e5f]">Todo</h1>
        <p className="text-sm text-[#55777b]">위에서 기간을 보고, 아래에서 바로 정리합니다.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-[#e8f1f2] border border-[#c8dadc] rounded-lg p-3 shadow-sm">
          <TodoForm sections={sections} onSubmit={addTodo} />
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-[#c8dadc] bg-white px-3 py-2 text-sm font-medium text-[#55777b]">
            <div className="w-4 h-4 border-2 border-[#79a8a9] border-t-transparent rounded-full animate-spin" />
            RTDB 동기화 중
          </div>
        )}

        <GanttChart sections={sections} todos={todos} />
        <TodoList
          sections={sections}
          todos={todos}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onRemove={removeTodo}
        />
      </div>
    </div>
  )
}
