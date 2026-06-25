import { useEffect, useMemo, useState } from 'react'
import { MoreVertical, Plus } from 'lucide-react'
import backgroundImage from '../../e88d2de1f6d41bb9d5cd335cd9a5f0a0.jpg'
import { useEuphony } from '@/hooks/useEuphony'

function EditableField({ value, className, multiline = false, rows = 1, placeholder, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => {
    setDraft(value || '')
  }, [value])

  const save = () => {
    setEditing(false)
    if (draft !== (value || '')) onSave(draft)
  }

  if (editing) {
    const inputClass = `${className} rounded-md bg-white/30 outline-none ring-1 ring-[#6fa39c]`
    if (multiline) {
      const widthCh = Math.min(Math.max(draft.length + 2, 28), 120)
      return (
        <textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            event.currentTarget.style.height = 'auto'
            event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDraft(value || '')
              setEditing(false)
            }
          }}
          rows={rows}
          autoFocus
          className={`${inputClass} min-h-0 max-w-full resize-none overflow-hidden px-2 py-1`}
          style={{ width: `${widthCh}ch` }}
          placeholder={placeholder}
        />
      )
    }

    return (
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save()
          if (event.key === 'Escape') {
            setDraft(value || '')
            setEditing(false)
          }
        }}
        autoFocus
        size={Math.max((draft || placeholder || '').length + 1, 4)}
        className={`${inputClass} px-2 py-1`}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${className} text-left hover:underline`}
    >
      {value || placeholder}
    </button>
  )
}

function HighlightCard({ highlight, onUpdate, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingText, setEditingText] = useState(false)

  return (
    <article className="relative rounded-xl border border-white/50 bg-white/20 p-3 shadow-sm backdrop-blur-[2px]">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="absolute right-3 top-3 rounded-md border border-white/40 bg-white/20 p-1.5 text-[#1f3f3b] hover:bg-white/35"
        aria-label="메뉴"
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <div className="absolute right-3 top-11 z-10 w-24 overflow-hidden rounded-md border border-white/50 bg-white/80 text-xs font-bold text-[#1f3f3b] shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setEditingText(true)
              setMenuOpen(false)
            }}
            className="block w-full px-3 py-2 text-left hover:bg-white"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onRemove(highlight.id)}
            className="block w-full px-3 py-2 text-left text-[#8a3d3d] hover:bg-[#fff0f0]"
          >
            삭제
          </button>
        </div>
      )}

      <div className="pr-10">
        <div className="mb-1 font-serif text-4xl font-black leading-none text-[#182e2c]">“</div>
        <div className="inline-block max-w-full">
          {editingText ? (
            <EditableField
              value={highlight.text || ''}
              onSave={(value) => {
                onUpdate(highlight.id, { text: value })
                setEditingText(false)
              }}
              multiline
              rows={1}
              className="text-sm font-medium leading-6 text-[#1f2f2d] md:text-base"
              placeholder="문장을 입력하세요."
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingText(true)}
              className="inline-block max-w-full text-left text-sm font-medium leading-6 text-[#1f2f2d] hover:underline md:text-base"
            >
              {highlight.text || '문장을 입력하세요.'}
            </button>
          )}
          <div className="mt-1 text-right font-serif text-4xl font-black leading-none text-[#182e2c]">”</div>
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <EditableField
          value={highlight.highlightedAt || ''}
          onSave={(value) => onUpdate(highlight.id, { highlightedAt: value })}
          className="shrink-0 text-xs font-bold text-[#395f5b]"
          placeholder="날짜"
        />
        <div className="flex min-w-0 items-center gap-1.5">
          <EditableField
            value={highlight.author || ''}
            onSave={(value) => onUpdate(highlight.id, { author: value })}
            placeholder="저자"
            className="rounded-md border border-white/40 bg-white/20 px-3 py-1.5 text-right text-xs font-bold text-[#1f3f3b] placeholder:text-[#557b76]"
          />
          <EditableField
            value={highlight.bookTitle || ''}
            onSave={(value) => onUpdate(highlight.id, { bookTitle: value })}
            placeholder="책 제목"
            className="rounded-md border border-white/40 bg-white/20 px-3 py-1.5 text-right text-xs font-bold text-[#1f3f3b] placeholder:text-[#557b76]"
          />
        </div>
      </div>
    </article>
  )
}

export default function EuphonyPage() {
  const { highlights, loading, error, addHighlight, updateHighlight, removeHighlight } = useEuphony()
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')

  const bookTitles = useMemo(() => [...new Set(highlights.map((h) => h.bookTitle).filter(Boolean))], [highlights])
  const authors = useMemo(() => [...new Set(highlights.map((h) => h.author).filter(Boolean))], [highlights])

  const filtered = highlights.filter((h) => {
    if (selectedBook && h.bookTitle !== selectedBook) return false
    if (selectedAuthor && h.author !== selectedAuthor) return false
    return true
  })

  return (
    <div className="h-full overflow-y-auto bg-[#edf4f2] p-0.5 text-[#173f3d]">
      <main className="relative min-h-[calc(100svh-4px)] overflow-hidden rounded-sm border border-[#c7d8d5]">
        <img
          src={backgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-70"
        />
        <div className="relative min-h-[calc(100svh-4px)] px-4 py-5 md:px-8 md:py-7">
          <section className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#2f7771]">Euphony</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-6xl">Euphony</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="rounded-md border border-white/40 bg-white/20 px-2.5 py-2 text-xs font-bold text-[#1f3f3b] shadow-sm backdrop-blur-[2px] focus:outline-none"
              >
                <option value="">도서명</option>
                {bookTitles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="rounded-md border border-white/40 bg-white/20 px-2.5 py-2 text-xs font-bold text-[#1f3f3b] shadow-sm backdrop-blur-[2px] focus:outline-none"
              >
                <option value="">저자명</option>
                {authors.map((author) => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addHighlight}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/40 bg-white/20 px-3 py-2 text-xs font-black text-[#1f3f3b] shadow-sm backdrop-blur-[2px] hover:bg-white/35"
              >
                <Plus size={14} />
                추가
              </button>
            </div>
          </section>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-xl border border-white/50 bg-white/20 p-3 text-sm font-bold text-[#395f5b] shadow-sm backdrop-blur-[2px]">
                RTDB 동기화 중
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#e4bcbc] bg-[#fff0f0]/70 p-3 text-sm font-bold text-[#7a3d3d] shadow-sm">
                {error}
              </div>
            )}

            {filtered.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                onUpdate={updateHighlight}
                onRemove={removeHighlight}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
