import { useMemo, useState } from 'react'
import { getDay } from 'date-fns'
import { CalendarPlus, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import { useRoutines } from '@/hooks/useRoutines'
import { getDateTimeDateKey, getSeoulDateKey } from '@/lib/dateTime'

const ROUTINE_TYPES = [
  { id: 'daily', label: 'Daily', sublabel: '매일' },
  { id: 'weekly', label: 'Weekly', sublabel: '매주' },
  { id: 'monthly', label: 'Monthly', sublabel: '매월' },
]

const WEEK_DAYS = [
  { key: 'sun', label: '일', full: '일요일' },
  { key: 'mon', label: '월', full: '월요일' },
  { key: 'tue', label: '화', full: '화요일' },
  { key: 'wed', label: '수', full: '수요일' },
  { key: 'thu', label: '목', full: '목요일' },
  { key: 'fri', label: '금', full: '금요일' },
  { key: 'sat', label: '토', full: '토요일' },
]

const EMPTY_ROUTINE = {
  startTime: '09:00',
  endTime: '10:00',
  title: '',
  content: '',
  priority: 'medium',
}

const ROUTINE_PRIORITIES = [
  { id: 'high', label: '높음' },
  { id: 'medium', label: '보통' },
  { id: 'low', label: '낮음' },
]

function todayKey() {
  return WEEK_DAYS[getDay(new Date())].key
}

function RoutineColumn({ type, routines, onAdd, onRemove }) {
  const [text, setText] = useState('')

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!text.trim()) return
    await onAdd(text, type.id)
    setText('')
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
      <div className="border-b border-[#bbd5f5] bg-[#cce0ff] px-4 py-3">
        <h2 className="text-base font-bold text-[#0044cc]">{type.label}</h2>
        <p className="text-xs font-medium text-[#5577bb]">{type.sublabel}</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 border-b border-[#d5e8ff] px-3 py-2.5">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="일정 추가..."
          className="min-w-0 flex-1 rounded border border-[#99ccff] bg-[#f5f9ff] px-2.5 py-1.5 text-sm outline-none focus:border-[#5588bb]"
        />
        <button
          type="submit"
          className="flex items-center rounded bg-[#0044cc] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#002080]"
          aria-label={`${type.label} 추가`}
        >
          <Plus size={14} />
        </button>
      </form>

      <ul className="flex-1 divide-y divide-[#e8f0f1]">
        {routines.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm font-bold text-[#7799cc]">일정 없음</li>
        ) : (
          routines.map((routine) => (
            <li key={routine.id} className="flex items-center gap-2 px-4 py-2.5">
              <span className="min-w-0 flex-1 text-sm font-medium text-[#1a3d8a]">{routine.text}</span>
              <button
                type="button"
                onClick={() => onRemove(routine.id)}
                className="shrink-0 rounded p-1 text-[#7799cc] hover:bg-[#fff0f0] hover:text-[#7a3d3d]"
                aria-label="삭제"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function WeeklyRoutineForm({ selectedDay, onAdd }) {
  const [form, setForm] = useState(EMPTY_ROUTINE)

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    await onAdd(selectedDay, {
      startTime: form.startTime,
      endTime: form.endTime || form.startTime,
      title: form.title.trim(),
      content: form.content.trim(),
      priority: form.priority || 'medium',
    })
    setForm({ ...EMPTY_ROUTINE, startTime: form.startTime, endTime: form.endTime })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 overflow-x-auto border-b border-[#d5e8ff] bg-[#f5f9ff] p-3">
      <TimeInput value={form.startTime} onChange={(value) => updateField('startTime', value)} ariaLabel="시작시간" />
      <TimeInput value={form.endTime} onChange={(value) => updateField('endTime', value)} ariaLabel="종료시간" placeholder="10:00" />
      <input
        value={form.title}
        onChange={(event) => updateField('title', event.target.value)}
        placeholder="루틴 제목"
        className="h-9 w-[132px] shrink-0 rounded-lg border border-[#99ccff] bg-white/90 px-3 text-sm outline-none focus:border-[#5588bb] md:w-[180px]"
      />
      <input
        value={form.content}
        onChange={(event) => updateField('content', event.target.value)}
        placeholder="내용"
        className="h-9 w-[150px] shrink-0 rounded-lg border border-[#99ccff] bg-white/90 px-3 text-sm outline-none focus:border-[#5588bb] md:w-[240px]"
      />
      <select
        value={form.priority}
        onChange={(event) => updateField('priority', event.target.value)}
        className="h-9 w-[78px] shrink-0 rounded-lg border border-[#99ccff] bg-white/90 px-2 text-sm font-bold text-[#0044cc] outline-none focus:border-[#5588bb]"
        aria-label="중요도"
      >
        {ROUTINE_PRIORITIES.map((priority) => (
          <option key={priority.id} value={priority.id}>{priority.label}</option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex h-9 w-12 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0044cc] text-sm font-black text-white hover:bg-[#002080] sm:w-20"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">추가</span>
      </button>
    </form>
  )
}

function TimeInput({ value, onChange, ariaLabel, placeholder = '09:00' }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="^([01]\d|2[0-3]):[0-5]\d$"
      maxLength={5}
      placeholder={placeholder}
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-[72px] shrink-0 rounded-lg border border-[#d5e8ff] bg-white/90 px-2 text-xs font-bold text-[#0044cc] outline-none focus:border-[#5588bb]"
      aria-label={ariaLabel}
    />
  )
}

function WeeklyRoutineRow({ routine, index, dayKey, isEditing, onToggle, onUpdate, onRemove }) {
  const [draft, setDraft] = useState(routine)

  const updateField = (name, value) => {
    const next = { ...draft, [name]: value }
    setDraft(next)
    onUpdate(dayKey, index, {
      startTime: next.startTime,
      endTime: next.endTime || next.startTime,
      title: next.title?.trim() || '',
      content: next.content?.trim() || '',
      priority: next.priority || 'medium',
    })
  }

  const timeText = `${draft.startTime || '--:--'}-${draft.endTime || draft.startTime || '--:--'}`
  const titleText = draft.title?.trim() || '제목 없음'
  const contentText = draft.content?.trim()
  const isHigh = draft.priority === 'high'

  return (
    <li className="px-3 py-1.5">
      <div className="flex min-h-10 items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="grid min-w-0 flex-1 grid-cols-[18px_92px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-[#eef6ff]"
          aria-expanded={isEditing}
        >
          <span className="text-[#4477cc]">
            {isEditing ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <span className="text-xs font-black text-[#0044cc]">{timeText}</span>
          <span className="min-w-0 truncate text-sm font-black text-[#1a3d8a]">
            {isHigh && <span className="mr-1 rounded bg-[#e85252] px-1.5 py-0.5 text-[10px] text-white">중요</span>}
            {titleText}
            {contentText ? <span className="font-medium text-[#5577bb]"> · {contentText}</span> : null}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRemove(dayKey, index)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9d5c5c] hover:bg-[#fff0f0]"
          aria-label="삭제"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {isEditing && (
        <div className="grid gap-2 pb-2 pl-7 pt-1 md:grid-cols-[88px_88px_minmax(150px,1fr)_minmax(180px,1.1fr)_96px]">
          <TimeInput value={draft.startTime} onChange={(value) => updateField('startTime', value)} ariaLabel="시작시간" />
          <TimeInput value={draft.endTime} onChange={(value) => updateField('endTime', value)} ariaLabel="종료시간" placeholder="10:00" />
          <input
            value={draft.title || ''}
            onChange={(event) => updateField('title', event.target.value)}
            className="rounded-lg border border-[#d5e8ff] bg-white/90 px-2 py-1.5 text-sm font-bold text-[#1a3d8a] outline-none"
            aria-label="제목"
          />
          <input
            value={draft.content || ''}
            onChange={(event) => updateField('content', event.target.value)}
            className="rounded-lg border border-[#d5e8ff] bg-white/90 px-2 py-1.5 text-sm text-[#3355aa] outline-none"
            aria-label="내용"
          />
          <select
            value={draft.priority || 'medium'}
            onChange={(event) => updateField('priority', event.target.value)}
            className={`rounded-lg border px-2 py-1.5 text-sm font-bold outline-none ${
              isHigh
                ? 'border-[#e85252] bg-[#e85252] text-white'
                : 'border-[#d5e8ff] bg-white/90 text-[#0044cc]'
            }`}
            aria-label="중요도"
          >
            {ROUTINE_PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>{priority.label}</option>
            ))}
          </select>
        </div>
      )}
    </li>
  )
}

function WeeklyRoutineBoard({
  weeklyRoutines,
  onAdd,
  onUpdate,
  onRemove,
  onPushToday,
  pushing,
}) {
  const [selectedDay, setSelectedDay] = useState(todayKey)
  const [editingKey, setEditingKey] = useState('')
  const selectedMeta = WEEK_DAYS.find((day) => day.key === selectedDay)
  const selectedRoutines = weeklyRoutines[selectedDay] || []
  const todayMeta = WEEK_DAYS.find((day) => day.key === todayKey())
  const todayRoutines = weeklyRoutines[todayMeta.key] || []

  return (
    <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#bbd5f5] bg-[#cce0ff] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-black text-[#0044cc]">주간 루틴</h2>
          <p className="text-xs font-bold text-[#5577bb]">
            루틴은 원본으로 남고, 승인한 순간의 내용만 오늘 캘린더에 생성됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPushToday(todayMeta.key)}
          disabled={pushing || todayRoutines.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0044cc] px-4 py-2 text-sm font-black text-white hover:bg-[#002080] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus size={17} />
          오늘 캘린더로 보내기
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-[#d5e8ff] bg-[#eef3ff]">
        {WEEK_DAYS.map((day) => {
          const isSelected = day.key === selectedDay
          const isToday = day.key === todayMeta.key
          return (
            <button
              type="button"
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`border-r border-[#d5e8ff] px-2 py-2 text-center text-sm font-black last:border-r-0 ${
                isSelected ? 'bg-[#0044cc] text-white' : isToday ? 'bg-[#d5e8ff] text-[#0044cc]' : 'text-[#4477cc]'
              }`}
            >
              {day.label}
            </button>
          )
        })}
      </div>

      <WeeklyRoutineForm selectedDay={selectedDay} onAdd={onAdd} />

      <div className="border-b border-[#d5e8ff] px-4 py-2">
        <p className="text-sm font-black text-[#0044cc]">{selectedMeta.full}</p>
      </div>

      {selectedRoutines.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm font-bold text-[#7799cc]">등록된 루틴이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-[#d5e8ff]">
          {selectedRoutines.map((routine, index) => {
            const rowKey = `${selectedDay}_${index}`
            return (
              <WeeklyRoutineRow
                key={`${selectedDay}_${index}_${routine.title}_${routine.startTime}`}
                routine={routine}
                index={index}
                dayKey={selectedDay}
                isEditing={editingKey === rowKey}
                onToggle={() => setEditingKey((current) => (current === rowKey ? '' : rowKey))}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function RoutinePage() {
  const {
    routines,
    weeklyRoutines,
    loading,
    error,
    addRoutine,
    removeRoutine,
    addWeeklyRoutine,
    updateWeeklyRoutine,
    removeWeeklyRoutine,
  } = useRoutines()
  const { events, replaceRoutineEventsForDate } = useCalendar()
  const [pushError, setPushError] = useState(null)
  const [pushing, setPushing] = useState(false)
  const todayDate = useMemo(() => getSeoulDateKey(), [])

  const handlePushToday = async (dayKey) => {
    const todayRoutines = weeklyRoutines[dayKey] || []
    if (todayRoutines.length === 0) return

    const hasRoutineEvents = events.some((event) => {
      const eventDate = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
      return eventDate === todayDate && event.mineType === 'routine'
    })

    if (hasRoutineEvents) {
      const ok = window.confirm('오늘 캘린더의 기존 루틴 일정이 현재 루틴 내용으로 전부 엎어써집니다. 계속할까요?')
      if (!ok) return
    }

    setPushing(true)
    setPushError(null)
    try {
      await replaceRoutineEventsForDate(todayDate, todayRoutines)
      window.alert('오늘 캘린더에 루틴을 보냈습니다.')
    } catch (e) {
      console.error(e)
      setPushError(e.message)
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f0f5ff] p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-[#0044cc]">정기일정</h1>

      {(error || pushError) && (
        <div className="mb-4 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
          {error || pushError}
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#bbddff] bg-white/90 px-3 py-2 text-sm font-medium text-[#4477cc]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5588bb] border-t-transparent" />
          RTDB 동기화 중
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROUTINE_TYPES.map((type) => (
          <RoutineColumn
            key={type.id}
            type={type}
            routines={routines.filter((r) => r.type === type.id)}
            onAdd={addRoutine}
            onRemove={removeRoutine}
          />
        ))}
      </div>

      <div className="mt-4">
        <WeeklyRoutineBoard
          weeklyRoutines={weeklyRoutines}
          onAdd={addWeeklyRoutine}
          onUpdate={updateWeeklyRoutine}
          onRemove={removeWeeklyRoutine}
          onPushToday={handlePushToday}
          pushing={pushing}
        />
      </div>
    </div>
  )
}
