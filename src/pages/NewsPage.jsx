import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Newspaper, RefreshCw, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { onValue, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { getCachedNews, loadNews, loadNewsDetail } from '@/services/newsSync'
import { SOURCES } from '@/services/newsSources'

const SOURCE_KEYS = ['seoul', 'gangseo']
const TAB_KEYS = ['seoul', 'gangseo', 'scraps']

function itemKey(sourceKey, item) {
  return `${sourceKey}_${item.id}`.replace(/[.#$[\]/]/g, '_')
}

function itemLink(sourceKey, item) {
  return sourceKey === 'gangseo' ? item.href ?? item.link : item.link ?? item.href
}

function dateLabel(date) {
  if (!date) return ''
  return format(new Date(`${date}T00:00:00`), 'M.d (E)', { locale: ko })
}

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

function makeScrapPayload(sourceKey, item) {
  return {
    sourceKey,
    sourceLabel: SOURCES[sourceKey]?.label ?? sourceKey,
    newsId: item.id,
    title: item.title ?? '',
    link: itemLink(sourceKey, item) ?? '',
    date: item.date ?? '',
    dept: item.dept ?? '',
    content: item.content ?? '',
    savedAt: Date.now(),
    savedAtServer: serverTimestamp(),
  }
}

function NewsRow({
  item,
  sourceKey,
  expanded,
  favorited,
  detailLoading,
  onToggleExpand,
  onToggleFavorite,
}) {
  const link = itemLink(sourceKey, item)
  const dept = item.dept ?? ''

  return (
    <div className="border-b border-[#d5e8ff] last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onToggleExpand()
        }}
        className="grid grid-cols-[34px_minmax(0,1fr)_88px_28px] md:grid-cols-[38px_120px_minmax(0,1fr)_112px_32px] items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#f5f9fa] cursor-pointer"
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite()
          }}
          className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors ${
            favorited ? 'text-[#d8a018] bg-[#fff6d8]' : 'text-[#99bbee] hover:text-[#d8a018] hover:bg-[#fff8df]'
          }`}
          aria-label={favorited ? '스크랩 해제' : '스크랩'}
        >
          <Star size={16} fill={favorited ? 'currentColor' : 'none'} />
        </button>

        <div className="hidden md:flex min-w-0">
          {dept && (
            <span className="truncate text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#cce0ff] text-[#0055ff]">
              {dept}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="md:hidden flex items-center gap-1.5 mb-0.5">
            {dept && (
              <span className="truncate text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#cce0ff] text-[#0055ff]">
                {dept}
              </span>
            )}
            {item.sourceLabel && (
              <span className="text-[10px] text-[#5577bb]">{item.sourceLabel}</span>
            )}
          </div>
          <p className="truncate font-medium text-[#0044cc]">{item.title}</p>
        </div>

        <span className="text-xs text-[#5577bb] text-right whitespace-nowrap">
          {dateLabel(item.date)}
        </span>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-[#99bbee] hover:text-[#4477cc] hover:bg-[#edf3f4]"
          aria-label="원문 열기"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-[52px] md:pl-[170px] pr-10 bg-[#f5f9ff]">
          {detailLoading ? (
            <div className="text-xs text-[#5577bb] py-2">본문을 불러오는 중...</div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#1a3d8a]">
              {item.content || '본문을 불러오지 못했습니다. 원문을 열어 확인해 주세요.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function NewsPage({ initialTab, focusKey }) {
  const { user } = useAuth()
  const [tab, setTab] = useState(initialTab || 'seoul')
  const [items, setItems] = useState(() => ({
    seoul: getCachedNews('seoul'),
    gangseo: getCachedNews('gangseo'),
  }))
  const [scraps, setScraps] = useState([])
  const [loading, setLoading] = useState({ seoul: false, gangseo: false })
  const [errors, setErrors] = useState({ seoul: null, gangseo: null, scraps: null })
  const [loaded, setLoaded] = useState({ seoul: false, gangseo: false })
  const [expandedId, setExpandedId] = useState(null)
  const [detailLoading, setDetailLoading] = useState({})

  const scrapsPath = useMemo(() => (
    user ? `users/${user.uid}/pages/news/scraps` : null
  ), [user])

  const scrapMap = useMemo(() => {
    const map = new Map()
    scraps.forEach((item) => map.set(item.id, item))
    return map
  }, [scraps])

  useEffect(() => {
    SOURCE_KEYS.forEach((key) => refreshNews(key))
  }, [])

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab, focusKey])

  useEffect(() => {
    if (!scrapsPath) {
      setScraps([])
      return undefined
    }

    return onValue(
      ref(db, scrapsPath),
      (snapshot) => {
        const list = objectToList(snapshot.val()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
        setScraps(list)
      },
      (error) => setErrors((prev) => ({ ...prev, scraps: error.message }))
    )
  }, [scrapsPath])

  async function refreshNews(key, options) {
    setLoading((prev) => ({ ...prev, [key]: true }))
    setErrors((prev) => ({ ...prev, [key]: null }))

    try {
      const result = await loadNews(key, options)
      setItems((prev) => ({ ...prev, [key]: result.items }))

      if (result.error) {
        setErrors((prev) => ({
          ...prev,
          [key]: `최신 갱신 실패, 저장된 목록을 표시합니다. ${result.error.message}`,
        }))
      }
    } catch (error) {
      console.warn(`[NewsPage] ${key} load failed:`, error)
      setErrors((prev) => ({ ...prev, [key]: error.message ?? String(error) }))
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }))
      setLoaded((prev) => ({ ...prev, [key]: true }))
    }
  }

  async function expandItem(sourceKey, item) {
    const key = itemKey(sourceKey, item)
    setExpandedId((prev) => (prev === key ? null : key))
    if (item.content || detailLoading[key]) return

    setDetailLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const content = await loadNewsDetail(sourceKey, item)
      setItems((prev) => ({
        ...prev,
        [sourceKey]: (prev[sourceKey] ?? []).map((news) => (
          news.id === item.id ? { ...news, content } : news
        )),
      }))
      setScraps((prev) => prev.map((scrap) => (
        scrap.id === key ? { ...scrap, content } : scrap
      )))
      if (scrapsPath && scrapMap.has(key)) {
        await update(ref(db, `${scrapsPath}/${key}`), { content })
      }
    } catch (error) {
      console.warn(`[NewsPage] detail failed:`, error)
    } finally {
      setDetailLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function toggleFavorite(sourceKey, item) {
    if (!scrapsPath) return

    const key = itemKey(sourceKey, item)
    const scrapRef = ref(db, `${scrapsPath}/${key}`)

    if (scrapMap.has(key)) {
      await remove(scrapRef)
      return
    }

    await set(scrapRef, makeScrapPayload(sourceKey, item))
  }

  const current = tab === 'scraps' ? scraps : items[tab] ?? []
  const isSourceTab = tab !== 'scraps'
  const source = SOURCES[tab]
  const isLoading = isSourceTab && loading[tab] && current.length === 0
  const isEmpty = isSourceTab
    ? !loading[tab] && loaded[tab] && current.length === 0
    : current.length === 0

  return (
    <div className="min-h-full bg-[#f0f5ff]">
      <div className="bg-white/90 border-b border-[#bbd0ee] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-[#4477cc]" />
            <h1 className="text-lg font-bold text-[#0044cc]">새소식</h1>
          </div>
          {isSourceTab && (
            <button
              onClick={() => refreshNews(tab, { force: true })}
              disabled={loading[tab]}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#cce0ff] px-3 py-1.5 text-xs font-bold text-[#0055ff] hover:bg-[#bbd8ff] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={loading[tab] ? 'animate-spin' : ''} />
              갱신
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => {
                setTab(key)
                setExpandedId(null)
              }}
              className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#0044cc] text-white'
                  : 'text-[#4477cc] hover:bg-[#f0f5f6]'
              }`}
            >
              {key === 'scraps' ? '스크랩' : SOURCES[key].label}
              {loading[key] && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#5588bb] animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full px-4 md:px-6 py-3">
        {errors[tab] && (
          <div className="mb-2 rounded-md border border-[#f0b8b8] bg-[#fff2f2] px-4 py-2.5 text-xs text-[#8a3d3d]">
            수집 실패: {errors[tab]}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#5588bb] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-16 text-sm text-[#5577bb]">
            {tab === 'scraps'
              ? '스크랩한 새소식이 없습니다'
              : `${source.label} 최근 ${source.days}일치 새소식이 없습니다`}
          </div>
        )}

        {current.length > 0 && (
          <div className="bg-white/90 rounded-lg shadow-sm overflow-hidden border border-[#d5e8ff]">
            <div className="px-4 py-2 border-b border-[#d5e8ff] flex items-center justify-between">
              <span className="text-xs font-bold text-[#5577bb]">
                {tab === 'scraps' ? '스크랩' : `${source.label} · 최근 ${source.days}일`}
              </span>
              <span className="text-xs text-[#99bbee]">{current.length}건</span>
            </div>

            {current.map((item) => {
              const sourceKey = tab === 'scraps' ? item.sourceKey : tab
              const key = itemKey(sourceKey, item.newsId ? { id: item.newsId } : item)
              const normalized = item.newsId ? { ...item, id: item.newsId, link: item.link } : item

              return (
                <NewsRow
                  key={key}
                  item={normalized}
                  sourceKey={sourceKey}
                  expanded={expandedId === key}
                  favorited={scrapMap.has(key)}
                  detailLoading={!!detailLoading[key]}
                  onToggleExpand={() => expandItem(sourceKey, normalized)}
                  onToggleFavorite={() => toggleFavorite(sourceKey, normalized)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
