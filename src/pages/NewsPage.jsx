import { useEffect, useState } from 'react'
import { Newspaper, RefreshCw, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { syncSource, subscribeNews } from '@/services/newsSync'
import { SOURCES } from '@/services/newsSources'

const TAB_KEYS = ['seoul', 'gangseo']

function NewsItem({ item, sourceKey }) {
  const link = sourceKey === 'gangseo' ? item.href : item.link
  const dept = item.dept ?? ''

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 hover:bg-[#f4f7f7] transition-colors border-b border-[#e8edf0] last:border-b-0 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {dept && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dcebed] text-[#2a6470] shrink-0">
              {dept}
            </span>
          )}
          {item.date && (
            <span className="text-[11px] text-[#789094]">
              {format(new Date(item.date + 'T00:00:00'), 'M.d (E)', { locale: ko })}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-[#1f4e5f] leading-snug line-clamp-2 group-hover:underline">
          {item.title}
        </p>
      </div>
      <ExternalLink size={13} className="shrink-0 mt-1 text-[#adc0c4] group-hover:text-[#55777b]" />
    </a>
  )
}

export default function NewsPage() {
  const [tab, setTab] = useState('seoul')
  const [items, setItems] = useState({ seoul: [], gangseo: [] })
  const [syncing, setSyncing] = useState({ seoul: false, gangseo: false })
  const [errors, setErrors] = useState({ seoul: null, gangseo: null })
  const [syncDone, setSyncDone] = useState({ seoul: false, gangseo: false })

  useEffect(() => {
    const unsubs = TAB_KEYS.map((key) =>
      subscribeNews(key, (data) =>
        setItems((prev) => ({ ...prev, [key]: data }))
      )
    )
    return () => unsubs.forEach((fn) => fn())
  }, [])

  useEffect(() => {
    TAB_KEYS.forEach((key) => triggerSync(key))
  }, [])

  async function triggerSync(key) {
    setSyncing((prev) => ({ ...prev, [key]: true }))
    setErrors((prev) => ({ ...prev, [key]: null }))
    try {
      await syncSource(key)
    } catch (err) {
      console.warn(`[NewsPage] ${key} sync failed:`, err)
      setErrors((prev) => ({ ...prev, [key]: String(err.message ?? err) }))
    } finally {
      setSyncing((prev) => ({ ...prev, [key]: false }))
      setSyncDone((prev) => ({ ...prev, [key]: true }))
    }
  }

  const current = items[tab] ?? []
  const source = SOURCES[tab]
  const isLoading = syncing[tab] && current.length === 0
  const isEmpty = !syncing[tab] && syncDone[tab] && current.length === 0

  return (
    <div className="min-h-full bg-[#f4f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#d6e1e3] px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-[#55777b]" />
            <h1 className="text-lg font-bold text-[#1f4e5f]">새소식</h1>
          </div>
          <button
            onClick={() => triggerSync(tab)}
            disabled={syncing[tab]}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#dcebed] px-3 py-1.5 text-xs font-bold text-[#2a6470] hover:bg-[#c9dfe2] disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={syncing[tab] ? 'animate-spin' : ''} />
            갱신
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#1f4e5f] text-white'
                  : 'text-[#55777b] hover:bg-[#f0f5f6]'
              }`}
            >
              {SOURCES[key].label}
              {syncing[key] && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#79a8a9] animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-0 py-2">
        {errors[tab] && (
          <div className="mx-4 mb-2 rounded-md border border-[#f0b8b8] bg-[#fff2f2] px-4 py-2.5 text-xs text-[#8a3d3d]">
            수집 실패: {errors[tab]}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#79a8a9] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-16 text-sm text-[#789094]">
            {source.label} 최근 {source.days}일치 새소식이 없습니다
          </div>
        )}

        {current.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-[#e8edf0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#789094]">
                {source.label} · 최근 {source.days}일
              </span>
              <span className="text-xs text-[#adc0c4]">{current.length}건</span>
            </div>
            {current.map((item) => (
              <NewsItem key={item.id} item={item} sourceKey={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
