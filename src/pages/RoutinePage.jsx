import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useRoutines } from '@/hooks/useRoutines'

const ROUTINE_TYPES = [
  { id: 'daily', label: 'Daily', sublabel: '매일' },
  { id: 'weekly', label: 'Weekly', sublabel: '매주' },
  { id: 'monthly', label: 'Monthly', sublabel: '매월' },
]

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

export default function RoutinePage() {
  const { routines, loading, error, addRoutine, removeRoutine } = useRoutines()

  return (
    <div className="min-h-full bg-[#f0f5ff] p-4 md:p-6">
      <h1 className="mb-4 text-lg font-bold text-[#0044cc]">정기일정</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
          {error}
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
    </div>
  )
}
