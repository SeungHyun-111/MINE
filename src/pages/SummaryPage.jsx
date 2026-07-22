import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { onValue, ref } from 'firebase/database'
import { CheckCircle2, CloudSun, Newspaper, Repeat } from 'lucide-react'
import LiquidMemoBoard from '@/components/LiquidMemoBoard'
import { useAuth } from '@/hooks/useAuth'
import { useCalendar } from '@/hooks/useCalendar'
import { useEuphony } from '@/hooks/useEuphony'
import { useTodos } from '@/hooks/useTodos'
import { useWeather } from '@/hooks/useWeather'
import { useRoutines } from '@/hooks/useRoutines'
import { usePet } from '@/hooks/usePet'
import CharacterSprite from '@/components/game/CharacterSprite'
import { db } from '@/lib/firebase'
import { addDateKeyDays, formatDateKey, getDateTimeDateKey, parseDateKey } from '@/lib/dateTime'

const ROUTINE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const PRIORITY_COLORS = {
  high: { bg: '#e85252', text: '#fff' },
  medium: { bg: '#0044cc', text: '#fff' },
  low: { bg: '#99ccff', text: '#0044cc' },
}

const LIQUID_BG_IMAGES = Object.values(import.meta.glob('../assets/liquid-bg/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
  query: '?url',
}))

function addDateDays(dateString, days) {
  return addDateKeyDays(dateString, days)
}

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

function getEventRange(event) {
  const start = event.start?.date || getDateTimeDateKey(event.start?.dateTime)
  const rawEnd = event.end?.date || getDateTimeDateKey(event.end?.dateTime) || start
  const end = event.end?.date ? addDateDays(rawEnd, -1) : rawEnd
  return { start, end: end && end >= start ? end : start }
}

function includesDate(event, dateStr) {
  const { start, end } = getEventRange(event)
  return !!start && start <= dateStr && dateStr <= end
}

function weatherDateLabel(value, fallbackDate = new Date()) {
  if (!value) return format(fallbackDate, 'MM.dd')

  const normalized = String(value)
  const dashed = normalized.includes('-')
    ? normalized
    : normalized.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
  const date = parseDateKey(dashed)

  return !date || Number.isNaN(date.getTime()) ? format(fallbackDate, 'MM.dd') : format(date, 'MM.dd')
}

function shortTitle(value) {
  return (value || '(제목 없음)').trim().slice(0, 2)
}

function shortRoutine(value) {
  return (value || '일정').trim().slice(0, 3)
}

function todoGanttEndDate(todo, todayString, rangeEndString) {
  const start = todo.startDate || todayString
  const end = todo.endDate || start
  if (!todo.completed && todo.sectionId !== 'done' && end < todayString) {
    return rangeEndString >= todayString ? todayString : rangeEndString
  }
  return end
}

function useNewsScraps() {
  const { user } = useAuth()
  const [scraps, setScraps] = useState([])

  useEffect(() => {
    if (!user) {
      setScraps([])
      return undefined
    }

    return onValue(ref(db, `users/${user.uid}/pages/news/scraps`), (snapshot) => {
      const items = objectToList(snapshot.val()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
      setScraps(items)
    })
  }, [user])

  return scraps
}

function Card({ icon: Icon, title, children, className = '', onClick }) {
  return (
    <section
      onClick={onClick}
      className={`overflow-hidden rounded-lg border border-[#bbd5f5] bg-white/90 shadow-sm ${onClick ? 'cursor-pointer active:brightness-[0.97]' : ''} ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[#d5e8ff] px-3 py-2">
        <Icon size={15} className="text-[#4477cc]" />
        <h2 className="text-xs font-black text-[#0044cc]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function WeeklySchedule({ events, today, weekDays, onOpenCalendarDate }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
      <div className="grid grid-cols-7 border-b border-[#bbd5f5] bg-[#eef3ff]">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={formatDateKey(day)}
              className={`border-r border-[#bbd5f5] px-1 py-1 text-center last:border-r-0 ${
                isToday ? 'bg-[#cce0ff]' : ''
              }`}
            >
              <p className="text-[10px] font-semibold leading-tight text-[#4477cc]">
                {format(day, 'EEE', { locale: ko })}
              </p>
              <p className={`text-[15px] font-black leading-tight ${isToday ? 'text-[#0044cc]' : 'text-[#3355aa]'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7 bg-white/90">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((event) => includesDate(event, dateStr))
          const isToday = isSameDay(day, today)

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onOpenCalendarDate?.(day)}
              className={`min-w-0 border-r border-[#d5e8ff] px-1 py-1.5 text-center transition-colors last:border-r-0 active:bg-[#e6f2f3] ${
                isToday ? 'bg-[#f3fbfb]' : ''
              }`}
            >
              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-start gap-1">
                {dayEvents.length === 0 ? (
                  <span className="mt-7 text-[9px] leading-none text-[#7799cc]">없음</span>
                ) : (
                  <>
                    <span className="rounded-full bg-[#0044cc] px-1.5 py-0.5 text-[9px] font-black leading-none text-white">
                      {dayEvents.length}건
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {dayEvents.map((event) => {
                        const isHigh = event.priority === 'high'
                        return (
                          <span
                            key={event.id}
                            className={`max-w-full rounded px-1 py-0.5 text-[10px] font-bold leading-none ${
                              isHigh ? 'bg-[#e85252] text-white' : 'bg-[#d5e8ff] text-[#0044cc]'
                            } ${event.status === 'done' ? 'line-through opacity-70' : ''}`}
                          >
                            {isHigh ? '!' : ''}{shortTitle(event.summary)}
                          </span>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LegacyWeatherSummary() {
  const { weather, cacheLoading } = useWeather({ scope: 'summary' })
  const current = weather?.current
  const today = weather?.daily?.[0]

  return (
    <Card icon={CloudSun} title="날씨" className="bg-[#f5f9ff]">
      <div className="px-4 py-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5577bb]">현재</p>
            <p className="text-3xl font-black leading-none text-[#0044cc]">{cacheLoading ? '-' : current?.temp || '-'}°</p>
          </div>
          <p className="rounded-full bg-[#d5e8ff] px-2 py-1 text-xs font-black text-[#0055ff]">
            {current?.sky || '대기'}
          </p>
        </div>
        <p className="mt-3 truncate text-xs font-semibold text-[#5577bb]">
          최저 {today?.minTemp || '-'}° · 최고 {today?.maxTemp || '-'}° · 습도 {current?.humidity || '-'}%
        </p>
      </div>
    </Card>
  )
}

void LegacyWeatherSummary

function WeatherSummary({ onOpenWeather }) {
  const { weather, cacheLoading } = useWeather({ scope: 'summary' })
  const current = weather?.current
  const today = weather?.daily?.[0]
  const tomorrow = weather?.daily?.[1]
  const todayDate = weatherDateLabel(today?.date)
  const tomorrowDate = weatherDateLabel(tomorrow?.date, addDays(new Date(), 1))

  return (
    <button
      type="button"
      onClick={onOpenWeather}
      className="overflow-hidden rounded-lg border border-[#bbd5f5] bg-white/90 px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-[#f7fbfb]"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[#aabbdd]">★</span>
        <h2 className="truncate text-sm font-black text-[#3f484d]">마포구 상암동</h2>
        <span className="text-xs font-black text-[#9aa7ad]">⊕</span>
      </div>

      <div className="mt-3 flex justify-center">
        <span className="rounded-full border border-[#bbd0ee] px-3 py-1 text-[11px] font-black text-[#223366]">
          현재 {todayDate}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffc400] text-[11px] font-black text-[#e0a000]">
          맑
        </div>
        <div className="text-center">
          <p className="text-[44px] font-black leading-none tracking-tight text-black">
            {cacheLoading ? '-' : current?.temp || '-'}°
          </p>
          <p className="mt-1 text-sm font-black text-black">{current?.sky || '-'}</p>
        </div>
      </div>

      <p className="mt-1 text-center text-[11px] font-black text-[#4466aa]">
        최저{today?.minTemp || '-'}° · 최고{today?.maxTemp || '-'}°
      </p>

      <div className="mx-auto my-3 h-px w-4/5 bg-[#ccddf0]" />

      <div className="flex justify-center">
        <span className="rounded-full border border-[#bbd0ee] px-3 py-1 text-[11px] font-black text-[#223366]">
          내일 {tomorrowDate}
        </span>
      </div>

      <div className="mt-3 text-center">
        <div className="mb-1 flex justify-center gap-9 text-[10px] font-black text-[#4466aa]">
          <span>최저</span>
          <span>최고</span>
        </div>
        <p className="text-[28px] font-black leading-none text-black">
          {tomorrow?.minTemp || '-'}° / {tomorrow?.maxTemp || '-'}°
        </p>
      </div>

      <div className="mx-auto mt-3 w-4/5 border-t border-[#ccddf0] pt-2 text-[11px] font-black text-[#223366]">
        <p>오전 {tomorrow?.sky || '-'} <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
        <p>오후 {tomorrow?.sky || '-'} <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
      </div>
    </button>
  )
}

void WeatherSummary

function CompactWeatherSummary({ onOpenWeather }) {
  const { weather, cacheLoading } = useWeather({ scope: 'summary' })
  const current = weather?.current
  const today = weather?.daily?.[0]
  const tomorrow = weather?.daily?.[1]
  const sunriseSunset = weather?.sunriseSunset || {}
  const todayDate = weatherDateLabel(today?.date)
  const tomorrowDate = weatherDateLabel(tomorrow?.date, addDays(new Date(), 1))

  return (
    <button
      type="button"
      onClick={onOpenWeather}
      className="w-full overflow-hidden rounded-lg border border-[#bbd5f5] bg-white/90 px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-[#f7fbfb]"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-[#aabbdd]">★</span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-black text-[#3f484d]">마포구 상암동</h2>
        <span className="shrink-0 text-xs font-black text-[#9aa7ad]">⊕</span>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffc400] text-[11px] font-black text-[#e0a000]">
          맑
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full border border-[#bbd0ee] px-2 py-0.5 text-[10px] font-black text-[#223366]">
              현재 {todayDate}
            </span>
            <span className="min-w-0 truncate text-xs font-black text-black">{current?.sky || '-'}</span>
          </div>
          <div className="mt-1 flex min-w-0 items-end gap-2">
            <p className="text-[38px] font-black leading-none tracking-tight text-black">
              {cacheLoading ? '-' : current?.temp || '-'}°
            </p>
            <p className="min-w-0 truncate pb-1 text-[11px] font-black text-[#4466aa]">
              최저 {today?.minTemp || '-'}° · 최고 {today?.maxTemp || '-'}°
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-black leading-tight text-[#223366]">
        <div className="min-w-0 rounded-md border border-[#d5e8ff] bg-[#f8fbff] px-2 py-2">
          <p className="truncate text-[#4466aa]">오늘</p>
          <p className="mt-1 truncate text-[11px] text-black">{today?.minTemp || '-'}°/{today?.maxTemp || '-'}°</p>
          <p className="mt-1 truncate">강수 <span className="text-[#1769ff]">{today?.pop || '-'}%</span></p>
        </div>
        <div className="min-w-0 rounded-md border border-[#d5e8ff] bg-[#f8fbff] px-2 py-2">
          <p className="truncate text-[#4466aa]">내일 {tomorrowDate}</p>
          <p className="mt-1 truncate text-[11px] text-black">{tomorrow?.minTemp || '-'}°/{tomorrow?.maxTemp || '-'}°</p>
          <p className="mt-1 truncate">강수 <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
        </div>
        <div className="min-w-0 rounded-md border border-[#d5e8ff] bg-[#f8fbff] px-2 py-2">
          <p className="truncate text-[#4466aa]">일출·일몰</p>
          <p className="mt-1 truncate">↑ {sunriseSunset.sunrise || '-'}</p>
          <p className="mt-1 truncate">↓ {sunriseSunset.sunset || '-'}</p>
        </div>
      </div>
    </button>
  )
}

function EuphonySummary({ onOpenPage }) {
  const { highlights } = useEuphony({ seedDefaults: false })
  const quoteViewportRef = useRef(null)
  const quoteContentRef = useRef(null)
  const [quoteScroll, setQuoteScroll] = useState({ enabled: false, distance: 0, duration: 7 })
  const pick = useMemo(() => {
    if (highlights.length === 0) return null
    return highlights[Math.floor(Math.random() * highlights.length)]
  }, [highlights])
  const liquidBg = useMemo(() => {
    if (LIQUID_BG_IMAGES.length === 0) return ''
    return LIQUID_BG_IMAGES[Math.floor(Math.random() * LIQUID_BG_IMAGES.length)]
  }, [])

  useLayoutEffect(() => {
    const updateQuoteScroll = () => {
      const viewport = quoteViewportRef.current
      const content = quoteContentRef.current
      if (!viewport || !content) return

      const overflow = content.scrollHeight - viewport.clientHeight
      setQuoteScroll({
        enabled: overflow > 2,
        distance: Math.max(0, overflow),
        duration: Math.min(14, Math.max(6, overflow / 16)),
      })
    }

    updateQuoteScroll()
    window.addEventListener('resize', updateQuoteScroll)
    return () => window.removeEventListener('resize', updateQuoteScroll)
  }, [pick])

  return (
    <section
      onClick={() => onOpenPage?.('euphony')}
      className="liquid-glass col-span-full flex h-[168px] cursor-pointer flex-col rounded-[28px] px-4 py-4 text-[#002fa3] active:brightness-[0.97]"
    >
      {liquidBg && (
        <div className="euphony-liquid-bg-wrap" aria-hidden="true">
          <img className="euphony-liquid-bg" src={liquidBg} alt="" />
          <div className="absolute inset-0 bg-white/20" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.62),rgba(255,255,255,0.2)_46%,rgba(255,255,255,0.48))]" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <h2 className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(24,72,96,0.5)]">
          Euphony
        </h2>
      </div>

      <div ref={quoteViewportRef} className="mt-3 min-h-0 flex-1 overflow-hidden">
        <div
          ref={quoteContentRef}
          className={quoteScroll.enabled ? 'euphony-summary-roll' : ''}
          style={{
            '--euphony-roll-distance': `${quoteScroll.distance}px`,
            animationDuration: `${quoteScroll.duration}s`,
          }}
        >
          <p className="text-[clamp(11px,3.2vw,14px)] font-black leading-[1.45] text-[#14384b] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
            {pick?.text || '저장된 문장을 기다리는 중'}
          </p>
          <p className="mt-3 text-[clamp(9px,2.6vw,11px)] font-bold leading-snug text-[#4b6d78] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
            {pick?.bookTitle || 'Euphony'} {pick?.author ? `· ${pick.author}` : ''}
          </p>
        </div>
      </div>
    </section>
  )
}

function TodoGanttChart({ onOpenPage }) {
  const { todos } = useTodos()
  const currentDateKey = format(new Date(), 'yyyy-MM-dd')
  const { today, days, dayStrings, todayString } = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return {
      today,
      days,
      dayStrings: days.map((d) => format(d, 'yyyy-MM-dd')),
      todayString: format(today, 'yyyy-MM-dd'),
    }
  }, [currentDateKey])

  const activeTodos = todos
    .filter((t) => !t.completed && t.startDate)
    .filter((t) => {
      const end = todoGanttEndDate(t, todayString, dayStrings[6])
      return t.startDate <= dayStrings[6] && end >= dayStrings[0]
    })
    .slice(0, 7)

  return (
    <section
      onClick={() => onOpenPage?.('todo')}
      className="col-span-full cursor-pointer overflow-hidden rounded-lg border border-[#bbd5f5] bg-white/90 shadow-sm active:brightness-[0.97]"
    >
      <div className="flex items-center gap-2 border-b border-[#d5e8ff] px-3 py-2">
        <CheckCircle2 size={15} className="text-[#4477cc]" />
        <h2 className="text-xs font-black text-[#0044cc]">TODO</h2>
      </div>

      <div className="grid grid-cols-7 border-b border-[#d5e8ff] bg-[#eef3ff]">
        {days.map((day) => (
          <div
            key={formatDateKey(day)}
            className={`py-1 text-center ${isSameDay(day, today) ? 'bg-[#cce0ff]' : ''}`}
          >
            <p className="text-[9px] font-bold text-[#4477cc]">{format(day, 'EEE', { locale: ko })}</p>
            <p className="text-[12px] font-black text-[#0044cc]">{format(day, 'd')}</p>
          </div>
        ))}
      </div>

      <div className="py-1">
        {activeTodos.length === 0 ? (
          <p className="py-3 text-center text-xs font-semibold text-[#7799cc]">이번 주 일정 없음</p>
        ) : (
          activeTodos.map((todo) => {
            const startDate = todo.startDate
            const endDate = todoGanttEndDate(todo, todayString, dayStrings[6])

            const barStartIdx = (() => {
              const idx = dayStrings.findIndex((d) => d >= startDate)
              return idx === -1 ? 0 : idx
            })()
            let barEndIdx = -1
            for (let i = 6; i >= 0; i--) {
              if (dayStrings[i] <= endDate) { barEndIdx = i; break }
            }
            if (barEndIdx < barStartIdx) return null

            const spanCount = barEndIdx - barStartIdx + 1
            const leftPct = (barStartIdx / 7) * 100
            const widthPct = (spanCount / 7) * 100
            const fontSize = spanCount >= 6 ? 11 : spanCount >= 4 ? 10 : spanCount >= 2 ? 9 : 7
            const colors = PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium

            return (
              <div key={todo.id} className="relative h-7">
                <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`h-full border-r border-[#f0f5ff] last:border-0 ${isSameDay(day, today) ? 'bg-[#f5f9ff]' : ''}`}
                    />
                  ))}
                </div>
                <div
                  className="absolute top-1 bottom-1 flex items-center justify-center overflow-hidden rounded-full"
                  style={{
                    left: `calc(${leftPct}% + 2px)`,
                    width: `calc(${widthPct}% - 4px)`,
                    backgroundColor: colors.bg,
                  }}
                >
                  <span
                    className="truncate px-1.5 font-black leading-none"
                    style={{ fontSize: `${fontSize}px`, color: colors.text }}
                  >
                    {todo.title}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

const NEWS_ROW_H = 28

function NewsScrapsSummary({ className = '', onOpenNewsPage }) {
  const scraps = useNewsScraps()
  const rolling = scraps.length > 0 ? [...scraps, ...scraps] : []
  const duration = Math.max(5, scraps.length * 1.6)

  return (
    <Card icon={Newspaper} title={`스크랩한 소식 · ${scraps.length}건`} className={className} onClick={() => onOpenNewsPage?.('scraps')}>
      {scraps.length === 0 ? (
        <p className="px-3 py-2 text-xs font-semibold text-[#7799cc]">스크랩 없음</p>
      ) : (
        <div className="overflow-hidden" style={{ height: NEWS_ROW_H * 3 }}>
          <div
            className="memo-roll-y"
            style={{ animationDuration: `${duration}s` }}
          >
            {rolling.map((item, i) => (
              <div
                key={`${item.id}_${i}`}
                className="flex items-center gap-2 px-3"
                style={{ height: NEWS_ROW_H }}
              >
                <span className="shrink-0 rounded-full bg-[#d5e8ff] px-2 py-0.5 text-[9px] font-black text-[#0044cc]">
                  소식
                </span>
                <span className="truncate text-[11px] font-bold text-[#3355aa]">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

const PET_FILTER = {
  신남: 'brightness(1.12) saturate(1.3)',
  행복: 'brightness(1.06) saturate(1.15)',
  보통: 'none',
  슬픔: 'brightness(0.88) saturate(0.6) hue-rotate(200deg)',
  위기: 'brightness(0.9) saturate(0.8) hue-rotate(330deg)',
}

function PetWidget({ onOpenPage }) {
  const { pet, emotion, daysTogether } = usePet()
  const spriteFilter = PET_FILTER[emotion?.label] ?? 'none'

  if (!pet) return null

  return (
    <button
      type="button"
      onClick={() => onOpenPage?.('game')}
      className="relative overflow-hidden rounded-lg border border-[#bbd5f5] shadow-sm active:brightness-95"
      style={{
        backgroundImage: 'image-set(url("/game-bg.webp") type("image/webp"), url("/game-bg.jpg") type("image/jpeg"))',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        imageRendering: 'pixelated',
        minHeight: 120,
      }}
    >
      {/* 이름 + 감정 뱃지 */}
      <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
          {pet.name}
        </span>
        {emotion && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur-sm"
            style={{ background: emotion.bg + 'dd', color: emotion.color }}
          >
            {emotion.emoji} {emotion.label}
          </span>
        )}
      </div>

      {/* 함께한 날 */}
      <div className="absolute right-2 top-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
        {daysTogether}일째
      </div>

      {/* 캐릭터 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <CharacterSprite
          emotionLabel={emotion?.label}
          filter={spriteFilter}
          size={80}
          walkLimit={46}
        />
      </div>
    </button>
  )
}

function RoutineSummary({ onOpenPage }) {
  const { routines } = useRoutines()

  return (
    <Card icon={Repeat} title="정기일정" onClick={() => onOpenPage?.('routine')}>
      <div className="grid grid-cols-3 gap-1 px-3 py-3">
        {['daily', 'weekly', 'monthly'].map((type) => {
          const typedRoutines = routines.filter((routine) => routine.type === type)
          return (
            <div key={type} className="min-w-0 rounded-md bg-[#f4f8f8] px-1.5 py-2 text-center">
              <p className="text-[9px] font-bold text-[#5577bb]">{ROUTINE_LABELS[type]}</p>
              <div className="mt-1 flex min-h-[38px] flex-col items-center justify-start gap-0.5">
                {typedRoutines.length === 0 ? (
                  <span className="mt-2 text-[9px] font-bold leading-none text-[#7799cc]">없음</span>
                ) : (
                  <>
                    {typedRoutines.slice(0, 2).map((routine) => (
                      <span
                        key={routine.id}
                        className="max-w-full rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-black leading-none text-[#0044cc]"
                      >
                        {shortRoutine(routine.text)}
                      </span>
                    ))}
                    {typedRoutines.length > 2 && (
                      <span className="rounded-full bg-[#cce0ff] px-1.5 text-[10px] font-black leading-none text-[#4477cc]">
                        ...
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function SummaryPage({ onOpenCalendarDate, onOpenPage, onOpenNewsPage }) {
  const { events } = useCalendar()
  const currentDateKey = format(new Date(), 'yyyy-MM-dd')
  const { today, weekDays } = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 0 })

    return {
      today,
      weekDays: Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    }
  }, [currentDateKey])
  const openWeatherPage = useCallback(() => onOpenPage?.('weather'), [onOpenPage])
  const openMemoPage = useCallback(() => onOpenPage?.('memo'), [onOpenPage])

  return (
    <div className="min-h-full bg-[#f0f5ff] p-3 md:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <CompactWeatherSummary onOpenWeather={openWeatherPage} />

        <div className="grid grid-cols-2 gap-3">
          <EuphonySummary onOpenPage={onOpenPage} />
          <RoutineSummary onOpenPage={onOpenPage} />
          <PetWidget onOpenPage={onOpenPage} />
          <div
            className="col-span-full cursor-pointer active:brightness-[0.97]"
            onClick={openMemoPage}
          >
            <LiquidMemoBoard className="col-span-full" />
          </div>
          <NewsScrapsSummary className="col-span-full" onOpenNewsPage={onOpenNewsPage} />
          <TodoGanttChart onOpenPage={onOpenPage} />
        </div>

        <WeeklySchedule
          events={events}
          today={today}
          weekDays={weekDays}
          onOpenCalendarDate={onOpenCalendarDate}
        />
      </div>
    </div>
  )
}
