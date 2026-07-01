import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { ERAS, STAGES } from '@/pages/sasekData'
import { useSasek } from '@/hooks/useSasek'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const C = {
  paper: '#F3EEE3',
  ink: '#2B2620',
  red: '#A8362B',
  gold: '#B8923F',
  paperDark: '#E8E0CC',
  redLight: '#f5ebe9',
}

function getEraBadge(era, eraIndex, userAge) {
  if (userAge == null) return null
  const nextAge = ERAS[eraIndex + 1]?.age ?? Infinity
  if (userAge < era.age) return { label: '다가올 길', color: C.gold }
  if (userAge < nextAge) return { label: '지금 여기', color: C.red }
  return { label: '지나온 길', color: '#7a7060' }
}

function BirthdateModal({ onSave }) {
  const [val, setVal] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(43,38,32,0.7)' }}>
      <div className="rounded-2xl p-8 w-80 shadow-2xl flex flex-col gap-4" style={{ background: C.paper, color: C.ink }}>
        <p className="text-center font-bold text-lg" style={{ color: C.ink }}>생년월일을 입력하세요</p>
        <p className="text-center text-sm" style={{ color: C.gold }}>나이별 이칭 배지 계산에 사용됩니다</p>
        <input
          type="date"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="border rounded-lg px-3 py-2 text-center text-base outline-none"
          style={{ borderColor: C.gold, background: C.paperDark, color: C.ink }}
        />
        <button
          onClick={() => val && onSave(val)}
          className="rounded-lg py-2 font-bold text-sm transition-opacity hover:opacity-80"
          style={{ background: C.red, color: C.paper }}
        >
          저장
        </button>
      </div>
    </div>
  )
}

function EraTimeline({ eras, userAge, onSelect }) {
  const currentIdx = eras.reduce(
    (acc, era, i) => (userAge != null && userAge >= era.age ? i : acc),
    -1
  )
  const currentEra = eras[currentIdx]
  const nextEra = eras[currentIdx + 1]
  const yearsToNext = nextEra && userAge ? nextEra.age - userAge : null

  return (
    <div
      className="rounded-2xl overflow-hidden mb-8"
      style={{ background: `${C.paper}f0`, border: `1px solid ${C.gold}44` }}
    >
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: C.gold, fontFamily: 'serif' }}>
          思 索
        </p>
        {currentEra ? (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-bold" style={{ color: C.ink, fontFamily: 'serif' }}>
                {currentEra.name}
              </span>
              <span className="text-sm" style={{ color: `${C.ink}77` }}>
                {currentEra.read} · {userAge}세
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: C.red }}>
              {currentEra.gloss}
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: `${C.ink}55` }}>
            생년월일을 설정하면 나의 이칭을 확인할 수 있어요
          </p>
        )}
      </div>

      <div className="h-px mx-5" style={{ background: `${C.gold}33` }} />

      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start">
          {eras.flatMap((era, i) => {
            const badge = getEraBadge(era, i, userAge)
            const isNow = badge?.label === '지금 여기'
            const isPast = badge?.label === '지나온 길'
            const nodes = []

            if (i > 0) {
              nodes.push(
                <div
                  key={`line-${i}`}
                  className="flex-1 h-px"
                  style={{
                    marginTop: 9,
                    background: currentIdx >= i ? C.ink : `${C.ink}22`,
                  }}
                />
              )
            }

            nodes.push(
              <button
                key={era.id}
                onClick={() => onSelect(era)}
                className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <div
                    className="rounded-full"
                    style={{
                      width: isNow ? 18 : 10,
                      height: isNow ? 18 : 10,
                      background: isNow ? C.red : isPast ? C.ink : 'transparent',
                      border: `2px solid ${isNow ? C.red : isPast ? C.ink : `${C.ink}33`}`,
                      boxShadow: isNow ? `0 0 0 4px ${C.red}20` : undefined,
                    }}
                  />
                </div>
                <span
                  className="text-[11px]"
                  style={{
                    color: isNow ? C.red : isPast ? C.ink : `${C.ink}44`,
                    fontWeight: isNow ? 700 : 500,
                  }}
                >
                  {era.read}
                </span>
              </button>
            )

            return nodes
          })}
        </div>
      </div>
    </div>
  )
}

function StageTimeline({ stages, notes, onSelect }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: `${C.paper}f0`, border: `1px solid ${C.gold}44` }}
    >
      <p className="text-[11px] px-5 pt-4 pb-3" style={{ color: `${C.ink}55` }}>
        대학 팔조목(大學 八條目)
      </p>
      <div className="h-px mx-5" style={{ background: `${C.gold}33` }} />
      <div className="flex justify-around px-3 py-4">
        {stages.map(stage => {
          const noteCount = notes[stage.id]?.length ?? 0
          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage)}
              className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold relative"
                style={{
                  fontSize: 15,
                  background: noteCount > 0 ? `${C.red}18` : C.paperDark,
                  border: `1.5px solid ${noteCount > 0 ? C.red : C.gold}55`,
                  color: noteCount > 0 ? C.red : C.ink,
                }}
              >
                {stage.name[0]}
                {noteCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                    style={{ fontSize: 9, background: C.red, color: C.paper }}
                  >
                    {noteCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: `${C.ink}55` }}>{stage.read}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StageDetailSheet({ stage, notes, onClose, onSaveNote, onEditNote, onDeleteNote }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)
  const stageNotes = notes[stage.id] || []

  useEffect(() => { textareaRef.current?.focus() }, [stage.id])

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onSaveNote(stage.id, text)
    setText('')
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col justify-end"
      style={{ bottom: 88 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(43,38,32,0.5)' }} onClick={onClose} />
      <div
        className="relative z-10 rounded-3xl flex flex-col overflow-hidden"
        style={{ background: C.paper, maxHeight: '90%' }}
      >
        <div className="h-1 w-12 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: C.gold }} />

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {/* 헤더 */}
          <div className="flex items-start justify-between pt-3 pb-5">
            <div>
              <p className="text-[11px] tracking-widest mb-1.5" style={{ color: C.gold }}>대학 팔조목</p>
              <div className="text-4xl font-bold" style={{ color: C.ink, fontFamily: 'serif' }}>{stage.name}</div>
              <p className="text-sm mt-1" style={{ color: `${C.ink}77` }}>{stage.read} · {stage.gloss}</p>
            </div>
            <button onClick={onClose} className="p-1 mt-1" style={{ color: `${C.ink}55` }}>
              <X size={20} />
            </button>
          </div>

          {/* 원문 */}
          <div className="mb-5">
            <p className="text-xs mb-2" style={{ color: `${C.ink}55` }}>原文 · 원문</p>
            <div
              className="pl-4 pr-4 py-3 rounded-r-xl"
              style={{ borderLeft: `3px solid ${C.red}`, background: C.paperDark }}
            >
              <p className="text-lg leading-relaxed" style={{ color: C.ink, fontFamily: 'serif' }}>
                {stage.source}
              </p>
            </div>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: C.ink }}>{stage.translation}</p>
            <p className="text-xs mt-1" style={{ color: `${C.ink}44` }}>— {stage.ref}</p>
          </div>

          {/* 지금 마음에 새길 것 */}
          <div className="mb-5">
            <p className="text-xs mb-2" style={{ color: `${C.ink}55` }}>지금 마음에 새길 것</p>
            <div className="rounded-xl px-4 py-3" style={{ background: C.paperDark }}>
              <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{stage.desc}</p>
            </div>
          </div>

          {/* 我記 입력 */}
          <div className="mb-5">
            <p className="text-xs mb-2" style={{ color: `${C.ink}55` }}>
              我記 · <span style={{ color: `${C.ink}44` }}>내가 적어둔 것</span>
            </p>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="이 단계를 위해 새겨둘 한 마디를 적어보세요"
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none"
              style={{ background: C.paperDark, border: `1.5px solid ${C.gold}55`, color: C.ink }}
            />
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: C.ink, color: C.paper }}
            >
              {saving ? '저장 중...' : '새겨두기'}
            </button>
          </div>

          {/* 과거 기록 */}
          <div>
            <p className="text-xs mb-2" style={{ color: `${C.ink}55` }}>이 단계의 사색 · {stageNotes.length}건</p>
            {stageNotes.length === 0 ? (
              <p className="text-xs" style={{ color: `${C.ink}44` }}>아직 기록된 사색이 없습니다</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stageNotes.map(note => (
                  <NoteItem key={note.id} note={note} itemId={stage.id} onEdit={onEditNote} onDelete={onDeleteNote} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NoteItem({ note, itemId, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(note.text)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setSaving(true)
    await onEdit(itemId, note.id, trimmed)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl p-4" style={{ background: C.paperDark, border: `1px solid ${C.gold}33` }}>
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={3}
          autoFocus
          className="w-full resize-none rounded-lg px-3 py-2 text-sm leading-relaxed outline-none"
          style={{ background: C.paper, border: `1px solid ${C.gold}55`, color: C.ink }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={saving || !editText.trim()}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-40"
            style={{ background: C.ink, color: C.paper }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => { setEditText(note.text); setEditing(false) }}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: `${C.ink}15`, color: C.ink }}
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4" style={{ background: C.paperDark, border: `1px solid ${C.gold}33` }}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.ink }}>{note.text}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: `${C.ink}55` }}>
          {format(new Date(note.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
        </p>
        <div className="flex gap-3">
          <button onClick={() => { setEditText(note.text); setEditing(true) }} style={{ color: `${C.ink}44` }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(itemId, note.id)} style={{ color: `${C.red}bb` }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailSheet({ item, notes, onClose, onSaveNote, onEditNote, onDeleteNote }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)
  const itemNotes = notes[item.id] || []

  useEffect(() => {
    textareaRef.current?.focus()
  }, [item.id])

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onSaveNote(item.id, text)
    setText('')
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col justify-end"
      style={{ bottom: 88 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(43,38,32,0.5)' }} onClick={onClose} />
      <div
        className="relative z-10 rounded-3xl flex flex-col overflow-hidden"
        style={{ background: C.paper, maxHeight: '90%' }}
      >
        <div className="h-1 w-12 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: C.gold }} />

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {/* 헤더 */}
          <div className="flex items-start justify-between pt-2 pb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: C.ink }}>{item.name}</span>
                <span className="text-base" style={{ color: C.gold }}>{item.read}</span>
                {'age' in item && (
                  <span className="text-sm ml-1" style={{ color: `${C.ink}66` }}>{item.age}세</span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: C.red }}>{item.gloss}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full" style={{ color: `${C.ink}66` }}>
              <X size={20} />
            </button>
          </div>

          {/* 원문 */}
          <div className="rounded-xl p-4 mb-4" style={{ background: C.paperDark, border: `1px solid ${C.gold}55` }}>
            <p className="text-xs font-medium mb-1" style={{ color: C.gold }}>원문</p>
            <p className="text-base leading-relaxed" style={{ color: C.ink, fontFamily: 'serif' }}>{item.source || item.name}</p>
          </div>

          {/* 풀이 */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-1" style={{ color: `${C.ink}77` }}>풀이</p>
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{item.desc}</p>
          </div>

          {/* 我記 입력 */}
          <div className="mb-5">
            <p className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: C.red }}>
              <span>我記</span>
              <span className="text-xs font-normal" style={{ color: `${C.ink}66` }}>나의 단상을 적어두세요</span>
            </p>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder="오늘의 생각을 기록하세요..."
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none"
              style={{
                background: C.paperDark,
                border: `1.5px solid ${C.gold}55`,
                color: C.ink,
              }}
            />
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: C.red, color: C.paper }}
            >
              {saving ? '저장 중...' : '단상 저장'}
            </button>
          </div>

          {itemNotes.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-3" style={{ color: `${C.ink}77` }}>쌓인 단상 {itemNotes.length}개</p>
              <div className="flex flex-col gap-3">
                {itemNotes.map(note => (
                  <NoteItem key={note.id} note={note} itemId={item.id} onEdit={onEditNote} onDelete={onDeleteNote} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SasekPage() {
  const { notes, loading, userAge, birthdate, addNote, editNote, deleteNote, saveBirthdate } = useSasek()
  const [selected, setSelected] = useState(null)
  const [sasekStage, setSasekStage] = useState(STAGES[0])
  const [sasekText, setSasekText] = useState('')
  const [sasekSaving, setSasekSaving] = useState(false)

  const handleSasek = async () => {
    if (!sasekText.trim()) return
    setSasekSaving(true)
    await addNote(sasekStage.id, sasekText)
    setSasekText('')
    setSasekSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: C.ink }}>
        <div className="h-8 w-8 rounded-full border-4 animate-spin" style={{ borderColor: `${C.gold}44`, borderTopColor: C.gold }} />
      </div>
    )
  }

  return (
    <div className="min-h-full relative isolate overflow-hidden">
      <img
        src="/jBackG.webp"
        alt=""
        className="pointer-events-none fixed inset-0 -z-10 h-svh w-screen object-cover object-center md:absolute md:h-full md:w-full"
      />
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 -z-[5]" style={{ background: 'rgba(43,38,32,0.38)' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 pb-28">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold" style={{ color: C.paper, textShadow: `0 2px 12px ${C.ink}` }}>正</h1>
          <p className="text-sm mt-1" style={{ color: `${C.paper}cc` }}>思索 — 나의 길을 바라보다</p>
          <div className="h-px w-24 mx-auto mt-3" style={{ background: `${C.gold}88` }} />
        </div>

        {/* 나이별 이칭 섹션 */}
        <EraTimeline
          eras={ERAS}
          userAge={userAge}
          onSelect={era => setSelected({ type: 'era', item: era })}
        />

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: `${C.gold}44` }} />
          <span className="text-xs" style={{ color: `${C.gold}cc`, fontFamily: 'serif' }}>大學 八條目</span>
          <div className="flex-1 h-px" style={{ background: `${C.gold}44` }} />
        </div>

        {/* 오늘의 사색 */}
        <div className="rounded-2xl mb-4" style={{ background: `${C.paper}f0`, border: `1px solid ${C.gold}44` }}>
          <div className="px-5 pt-4 pb-5">
            <p className="text-xs mb-2" style={{ color: `${C.ink}55` }}>오늘의 사색</p>
            <textarea
              value={sasekText}
              onChange={e => setSasekText(e.target.value)}
              rows={3}
              placeholder="지금 머릿속에 있는 고민을 적어보세요"
              className="w-full resize-none outline-none bg-transparent text-sm leading-relaxed"
              style={{ color: C.ink }}
            />
            <div className="h-px mt-1 mb-4" style={{ background: `${C.ink}18` }} />

            {/* 조목 선택 */}
            <div className="flex justify-between mb-3">
              {STAGES.map(stage => {
                const isSel = sasekStage?.id === stage.id
                return (
                  <button
                    key={stage.id}
                    onClick={() => setSasekStage(stage)}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all active:scale-90"
                    style={{
                      fontSize: 15,
                      background: isSel ? C.red : 'transparent',
                      border: `1.5px solid ${isSel ? C.red : `${C.ink}33`}`,
                      color: isSel ? C.paper : C.ink,
                    }}
                  >
                    {stage.name[0]}
                  </button>
                )
              })}
            </div>

            {/* 선택된 조목 정보 */}
            {sasekStage && (
              <p className="text-sm mb-4">
                <span className="font-bold" style={{ color: C.red }}>{sasekStage.name}</span>
                {' '}
                <span style={{ color: `${C.ink}77` }}>{sasekStage.read} — {sasekStage.gloss}</span>
              </p>
            )}

            <button
              onClick={handleSasek}
              disabled={!sasekText.trim() || sasekSaving}
              className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: C.ink, color: C.paper }}
            >
              {sasekSaving ? '기록 중...' : '기록하기 · 印'}
            </button>
          </div>
        </div>

        {/* 팔조목 리스트 */}
        {(() => {
          const firstNoteIdx = STAGES.findIndex(s => (notes[s.id]?.length ?? 0) > 0)
          const jigumId = firstNoteIdx >= 0 ? STAGES[firstNoteIdx].id : STAGES[0].id
          return (
            <div className="rounded-2xl overflow-hidden" style={{ background: `${C.paper}f0`, border: `1px solid ${C.gold}44` }}>
              <div className="px-5 pt-4 pb-2">
                <p className="text-sm font-bold" style={{ color: C.ink }}>대학 팔조목(大學 八條目)</p>
                <p className="text-xs mt-0.5 mb-1" style={{ color: `${C.ink}55` }}>단계를 눌러보면 원문과 내 다짐을 볼 수 있어요</p>
              </div>
              {STAGES.map((stage, i) => {
                const noteCount = notes[stage.id]?.length ?? 0
                const hasNotes = noteCount > 0
                const isJigum = stage.id === jigumId
                return (
                  <button
                    key={stage.id}
                    onClick={() => setSelected({ type: 'stage', item: stage })}
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all active:bg-black/5"
                    style={{ borderTop: `1px solid ${C.gold}22` }}
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold"
                      style={{
                        fontSize: 16,
                        background: hasNotes ? `${C.red}15` : C.paperDark,
                        border: `1.5px solid ${hasNotes ? C.red : `${C.ink}22`}`,
                        color: hasNotes ? C.red : `${C.ink}55`,
                      }}
                    >
                      {stage.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold" style={{ color: C.ink }}>{stage.name}</span>
                        {isJigum && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: `${C.red}18`, color: C.red }}>
                            지금
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: `${C.ink}66` }}>
                        {stage.read} · {stage.gloss}
                      </p>
                    </div>
                    {noteCount > 0 && (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${C.gold}22`, color: C.gold }}>
                        {noteCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* 바텀시트 */}
      {selected?.type === 'era' && (
        <DetailSheet
          item={selected.item}
          notes={notes}
          onClose={() => setSelected(null)}
          onSaveNote={addNote}
          onEditNote={editNote}
          onDeleteNote={deleteNote}
        />
      )}
      {selected?.type === 'stage' && (
        <StageDetailSheet
          stage={selected.item}
          notes={notes}
          onClose={() => setSelected(null)}
          onSaveNote={addNote}
          onEditNote={editNote}
          onDeleteNote={deleteNote}
        />
      )}

      {/* 생년월일 미설정 시 모달 */}
      {!birthdate && !loading && (
        <BirthdateModal onSave={saveBirthdate} />
      )}
    </div>
  )
}
