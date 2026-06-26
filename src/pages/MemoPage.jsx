import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Plus, Trash2, X } from 'lucide-react'
import { MEMO_PRIORITIES, MEMO_STAGES, useMemos } from '@/hooks/useMemos'

function formatLogTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
}

function stageMeta(stageId) {
  const normalized = stageId === 'review' ? 'progress' : stageId
  return MEMO_STAGES.find((stage) => stage.id === normalized) || MEMO_STAGES[0]
}

function stageValue(stageId) {
  return stageId === 'review' ? 'progress' : stageId || 'pending'
}

function priorityMeta(priorityId) {
  return MEMO_PRIORITIES.find((p) => p.id === priorityId) || null
}

function StatusBoard({ memos, onSelect }) {
  const activeMemos = memos.filter((memo) => memo.stage === 'pending' || memo.stage === 'progress' || memo.stage === 'review')
  const counts = MEMO_STAGES.map((stage) => ({
    ...stage,
    count: memos.filter((memo) => (memo.stage === 'review' ? 'progress' : memo.stage) === stage.id).length,
  }))
  const rolling = activeMemos.length > 0 ? [...activeMemos, ...activeMemos].slice(0, Math.min(activeMemos.length * 2, 10)) : []
  const primary = activeMemos[0]
  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}.${today.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][today.getDay()]})`
  const timeLabel = today.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <section className="overflow-hidden rounded-md border border-[#3355aa] bg-[#001133] shadow-sm">
      <div className="flex min-h-16 items-center gap-3 px-3 py-2 text-[#bbddff]">
        <div className="w-16 shrink-0 border-r border-[#355155] pr-3 text-left font-mono font-black leading-tight">
          <p className="text-sm text-[#99ccff]">{dateLabel}</p>
          <p className="text-sm text-[#99ccff]">{timeLabel}</p>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="relative h-8 overflow-hidden">
            <div className="memo-roll-y">
              {rolling.length === 0 ? (
                <div className="flex h-8 items-center text-sm font-black text-[#d7f1ef]">미완료/진행중 메모가 없습니다</div>
              ) : (
                rolling.map((memo, index) => (
                  <button
                    type="button"
                    key={`${memo.id}_${index}`}
                    onClick={() => onSelect(memo.id)}
                    className="flex h-8 w-full items-center gap-2 text-left text-sm font-black text-[#d7f1ef]"
                  >
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] ${stageMeta(memo.stage).tone}`}>
                      {stageMeta(memo.stage).label}
                    </span>
                    <span className="truncate">{memo.title || memo.content}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] font-black text-[#8fbcc0]">
            {counts.map((stage) => (
              <span key={stage.id}>{stage.label} {stage.count}</span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-l border-[#355155] pl-3 text-xs font-black">
          <button
            type="button"
            onClick={() => primary && onSelect(primary.id)}
            className="text-[#bbddff] hover:text-white"
            aria-label="닫기"
          >
            <X size={15} />
          </button>
          <span className="text-[#99ccff]">1/{Math.max(activeMemos.length, 1)}</span>
          <div className="grid gap-1">
            <button type="button" className="rounded border border-[#3355aa] px-1 text-[#99ccff]" aria-label="이전">
              <ChevronUp size={14} />
            </button>
            <button type="button" className="rounded border border-[#3355aa] px-1 text-[#99ccff]" aria-label="다음">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-[#112244] px-3 py-1.5 text-[11px] font-bold text-[#8fbcc0]">
        <FileText size={13} />
        <span>미완료/진행중 메모 현황</span>
      </div>
    </section>
  )
}

function MemoForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [stage, setStage] = useState('pending')
  const [priority, setPriority] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim() && !content.trim()) return

    await onSubmit({ title, content, stage, priority })
    setTitle('')
    setContent('')
    setStage('pending')
    setPriority('')
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#bbddff] bg-[#e8f1f2] p-3 shadow-sm">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="메모 제목"
        className="mb-2 w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        placeholder="메모 내용"
        className="w-full resize-none rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
      />
      <div className="mt-2 flex items-center gap-2">
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold text-[#0044cc] outline-none"
        >
          {MEMO_STAGES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold text-[#0044cc] outline-none"
        >
          <option value="">우선순위</option>
          {MEMO_PRIORITIES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-4 py-2 text-sm font-bold text-white hover:bg-[#002080]">
          <Plus size={16} />
          추가
        </button>
      </div>
    </form>
  )
}

function MemoEditor({ memo, onUpdate, onRemove }) {
  const [titleDraft, setTitleDraft] = useState(memo?.title || '')
  const [draft, setDraft] = useState(memo?.content || '')

  useEffect(() => {
    setTitleDraft(memo?.title || '')
    setDraft(memo?.content || '')
  }, [memo?.id, memo?.title, memo?.content])

  const meta = stageMeta(memo.stage)
  const logs = Array.isArray(memo.logs) ? [...memo.logs].reverse() : []

  return (
    <div className="bg-[#f5f9ff]">
      <div className="flex items-center justify-between border-b border-[#bbd5f5] py-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${meta.tone}`}>{meta.label}</span>
        <button
          type="button"
          onClick={() => onRemove(memo.id)}
          className="rounded-md p-2 text-[#5577bb] hover:bg-[#fff0f0] hover:text-[#7a3d3d]"
          aria-label="삭제"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-4 py-4">
        <input
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={() => onUpdate(memo, { title: titleDraft })}
          className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
        />

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => onUpdate(memo, { content: draft })}
          rows={8}
          className="w-full resize-none rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
        />

        <select
          value={stageValue(memo.stage)}
          onChange={(event) => onUpdate(memo, { stage: event.target.value })}
          className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold text-[#0044cc] outline-none"
        >
          {MEMO_STAGES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>

        <select
          value={memo.priority || ''}
          onChange={(event) => onUpdate(memo, { priority: event.target.value })}
          className="w-full rounded-lg border border-[#99ccff] bg-white/90 px-3 py-2 text-sm font-bold text-[#0044cc] outline-none"
        >
          <option value="">우선순위 없음</option>
          {MEMO_PRIORITIES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>

        <div>
          <h3 className="mb-2 text-sm font-black text-[#0044cc]">수정로그</h3>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#d5e8ff] bg-[#f5f9ff]">
            {logs.length === 0 ? (
              <p className="px-3 py-3 text-xs font-bold text-[#7799cc]">로그 없음</p>
            ) : (
              logs.map((log, index) => (
                <div key={`${log.createdAt}_${index}`} className="border-b border-[#d5e8ff] px-3 py-2 last:border-b-0">
                  <p className="text-xs font-black text-[#1a3d8a]">{log.message}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#5577bb]">{formatLogTime(log.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MemoPage() {
  const { memos, loading, error, addMemo, updateMemo, removeMemo } = useMemos()
  const [selectedId, setSelectedId] = useState('')
  const selectedMemo = useMemo(
    () => memos.find((memo) => memo.id === selectedId) || null,
    [memos, selectedId]
  )

  return (
    <div className="min-h-full bg-[#f0f5ff] p-4 md:p-6">
      <div className="space-y-4">
        <StatusBoard memos={memos} onSelect={setSelectedId} />

        {error && (
          <div className="rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#7a3d3d]">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-[#bbddff] bg-white/90 px-3 py-2 text-sm font-medium text-[#4477cc]">
            <div className="h-4 w-4 rounded-full border-2 border-[#5588bb] border-t-transparent animate-spin" />
            RTDB 동기화 중
          </div>
        )}

        <MemoForm onSubmit={addMemo} />

        <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
          <div className="border-b border-[#bbd5f5] bg-[#cce0ff] px-4 py-3">
            <h2 className="text-base font-bold text-[#0044cc]">메모 목록</h2>
          </div>
          <div className="divide-y divide-[#d5e8ff]">
            {memos.length === 0 ? (
              <p className="px-4 py-6 text-sm font-bold text-[#7799cc]">등록된 메모가 없습니다.</p>
            ) : (
              memos.map((memo) => {
                const meta = stageMeta(memo.stage)
                const isSelected = selectedMemo?.id === memo.id
                return (
                  <div key={memo.id} className={isSelected ? 'bg-[#eef7f7]' : 'bg-white/90'}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(isSelected ? '' : memo.id)}
                      className="block w-full overflow-x-auto px-4 py-3 text-left hover:bg-[#f5f9ff]"
                    >
                      <div className="grid min-w-[720px] grid-cols-[92px_112px_minmax(160px,0.8fr)_minmax(260px,1.2fr)] items-center gap-3">
                        <span className="text-[11px] font-bold text-[#5577bb]">{formatDate(memo.createdAt)}</span>
                        <select
                          value={stageValue(memo.stage)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateMemo(memo, { stage: event.target.value })}
                          className={`w-full rounded-full border px-2 py-1 text-[11px] font-black outline-none ${meta.tone}`}
                        >
                          {MEMO_STAGES.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                        <div className="flex min-w-0 items-center gap-1.5">
                          {memo.priority && priorityMeta(memo.priority) && (
                            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-black ${priorityMeta(memo.priority).tone}`}>
                              {priorityMeta(memo.priority).label}
                            </span>
                          )}
                          <p className="truncate text-sm font-black leading-relaxed text-[#1a3d8a]">{memo.title || '(제목 없음)'}</p>
                        </div>
                        <p className="truncate text-xs font-medium leading-relaxed text-[#5577bb]">{memo.content}</p>
                      </div>
                    </button>

                    {isSelected && (
                      <div className="border-t border-[#bbd5f5] px-4 pb-4">
                        <MemoEditor memo={memo} onUpdate={updateMemo} onRemove={removeMemo} />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
