import { useEffect, useMemo, useState } from 'react'
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
import { db } from '@/lib/firebase'

const ROUTINE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const LIQUID_BG_IMAGES = Object.values(import.meta.glob('../assets/liquid-bg/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
  query: '?url',
}))

function addDateDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

function getEventRange(event) {
  const start = event.start?.date || event.start?.dateTime?.slice(0, 10)
  const rawEnd = event.end?.date || event.end?.dateTime?.slice(0, 10) || start
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
  const date = new Date(`${dashed}T00:00:00`)

  return Number.isNaN(date.getTime()) ? format(fallbackDate, 'MM.dd') : format(date, 'MM.dd')
}

function shortTitle(value) {
  return (value || '(제목 없음)').trim().slice(0, 2)
}

function shortRoutine(value) {
  return (value || '일정').trim().slice(0, 3)
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

function Card({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-[#d5e2e5] bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#e4ecef] px-3 py-2">
        <Icon size={15} className="text-[#55777b]" />
        <h2 className="text-xs font-black text-[#1f4e5f]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function WeeklySchedule({ events, today, weekDays, onOpenCalendarDate }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#c9d6de] bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-[#d4e1e3] bg-[#eef5f5]">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className={`border-r border-[#d4e1e3] px-1 py-1 text-center last:border-r-0 ${
                isToday ? 'bg-[#dcebed]' : ''
              }`}
            >
              <p className="text-[10px] font-semibold leading-tight text-[#55777b]">
                {format(day, 'EEE', { locale: ko })}
              </p>
              <p className={`text-[15px] font-black leading-tight ${isToday ? 'text-[#1f4e5f]' : 'text-[#52616a]'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid h-[92px] grid-cols-7 bg-white">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((event) => includesDate(event, dateStr))
          const isToday = isSameDay(day, today)

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onOpenCalendarDate?.(day)}
              className={`min-w-0 overflow-hidden border-r border-[#e3ecee] px-1 py-1.5 text-center transition-colors last:border-r-0 active:bg-[#e6f2f3] ${
                isToday ? 'bg-[#f3fbfb]' : ''
              }`}
            >
              <div className="flex h-full min-w-0 flex-col items-center justify-start gap-1">
                {dayEvents.length === 0 ? (
                  <span className="mt-7 text-[9px] leading-none text-[#9aadb1]">없음</span>
                ) : (
                  <>
                    <span className="rounded-full bg-[#1f4e5f] px-1.5 py-0.5 text-[9px] font-black leading-none text-white">
                      {dayEvents.length}건
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className="w-8 rounded bg-[#e1f0f1] px-1 py-0.5 text-[10px] font-bold leading-none text-[#1f4e5f]"
                        >
                          {shortTitle(event.summary)}
                        </span>
                      ))}
                    </div>
                    {dayEvents.length > 2 && (
                      <span className="rounded-full bg-[#dcebed] px-1.5 text-[10px] font-black leading-none text-[#55777b]">
                        ...
                      </span>
                    )}
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
  const { weather, cacheLoading } = useWeather()
  const current = weather?.current
  const today = weather?.daily?.[0]

  return (
    <Card icon={CloudSun} title="날씨" className="bg-[#fafdff]">
      <div className="px-4 py-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#789094]">현재</p>
            <p className="text-3xl font-black leading-none text-[#1f4e5f]">{cacheLoading ? '-' : current?.temp || '-'}°</p>
          </div>
          <p className="rounded-full bg-[#e1f0f1] px-2 py-1 text-xs font-black text-[#2a6470]">
            {current?.sky || '대기'}
          </p>
        </div>
        <p className="mt-3 truncate text-xs font-semibold text-[#789094]">
          최저 {today?.minTemp || '-'}° · 최고 {today?.maxTemp || '-'}° · 습도 {current?.humidity || '-'}%
        </p>
      </div>
    </Card>
  )
}

void LegacyWeatherSummary

function WeatherSummary({ onOpenWeather }) {
  const { weather, cacheLoading } = useWeather()
  const current = weather?.current
  const today = weather?.daily?.[0]
  const tomorrow = weather?.daily?.[1]
  const todayDate = weatherDateLabel(today?.date)
  const tomorrowDate = weatherDateLabel(tomorrow?.date, addDays(new Date(), 1))

  return (
    <button
      type="button"
      onClick={onOpenWeather}
      className="overflow-hidden rounded-lg border border-[#d5e2e5] bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-[#f7fbfb]"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[#c6d0d4]">★</span>
        <h2 className="truncate text-sm font-black text-[#3f484d]">마포구 상암동</h2>
        <span className="text-xs font-black text-[#9aa7ad]">⊕</span>
      </div>

      <div className="mt-3 flex justify-center">
        <span className="rounded-full border border-[#d6dde1] px-3 py-1 text-[11px] font-black text-[#303940]">
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

      <p className="mt-1 text-center text-[11px] font-black text-[#68737b]">
        최저{today?.minTemp || '-'}° · 최고{today?.maxTemp || '-'}°
      </p>

      <div className="mx-auto my-3 h-px w-4/5 bg-[#e2e7ea]" />

      <div className="flex justify-center">
        <span className="rounded-full border border-[#d6dde1] px-3 py-1 text-[11px] font-black text-[#303940]">
          내일 {tomorrowDate}
        </span>
      </div>

      <div className="mt-3 text-center">
        <div className="mb-1 flex justify-center gap-9 text-[10px] font-black text-[#68737b]">
          <span>최저</span>
          <span>최고</span>
        </div>
        <p className="text-[28px] font-black leading-none text-black">
          {tomorrow?.minTemp || '-'}° / {tomorrow?.maxTemp || '-'}°
        </p>
      </div>

      <div className="mx-auto mt-3 w-4/5 border-t border-[#e2e7ea] pt-2 text-[11px] font-black text-[#303940]">
        <p>오전 {tomorrow?.sky || '-'} <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
        <p>오후 {tomorrow?.sky || '-'} <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
      </div>
    </button>
  )
}

void WeatherSummary

function CompactWeatherSummary({ onOpenWeather }) {
  const { weather, cacheLoading } = useWeather()
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
      className="w-full overflow-hidden rounded-lg border border-[#d5e2e5] bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-[#f7fbfb]"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[#c6d0d4]">★</span>
        <h2 className="truncate text-sm font-black text-[#3f484d]">마포구 상암동</h2>
        <span className="text-xs font-black text-[#9aa7ad]">⊕</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffc400] text-[11px] font-black text-[#e0a000]">
          맑
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-[#d6dde1] px-2 py-0.5 text-[10px] font-black text-[#303940]">
              현재 {todayDate}
            </span>
            <span className="truncate text-xs font-black text-black">{current?.sky || '-'}</span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-[38px] font-black leading-none tracking-tight text-black">
              {cacheLoading ? '-' : current?.temp || '-'}°
            </p>
            <p className="pb-1 text-[11px] font-black text-[#68737b]">
              최저{today?.minTemp || '-'}° · 최고{today?.maxTemp || '-'}°
            </p>
          </div>
        </div>

        <div className="ml-auto grid min-w-[164px] grid-cols-2 gap-2 border-l border-[#e2e7ea] pl-3 text-[10px] font-black leading-tight text-[#303940]">
          <div>
            <p className="mb-1 text-[#68737b]">내일 {tomorrowDate}</p>
            <p>{tomorrow?.minTemp || '-'}°/{tomorrow?.maxTemp || '-'}°</p>
            <p>오전 <span className="text-[#1769ff]">{tomorrow?.pop || '-'}%</span></p>
          </div>
          <div>
            <p className="mb-1 text-[#68737b]">일출·일몰</p>
            <p>↑ {sunriseSunset.sunrise || '-'}</p>
            <p>↓ {sunriseSunset.sunset || '-'}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

function EuphonySummary() {
  const { highlights } = useEuphony()
  const pick = useMemo(() => {
    if (highlights.length === 0) return null
    return highlights[Math.floor(Math.random() * highlights.length)]
  }, [highlights])
  const liquidBg = useMemo(() => {
    if (LIQUID_BG_IMAGES.length === 0) return ''
    return LIQUID_BG_IMAGES[Math.floor(Math.random() * LIQUID_BG_IMAGES.length)]
  }, [])

  return (
    <section className="liquid-glass col-span-full min-h-[168px] rounded-[28px] px-4 py-4 text-[#143f55]">
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

      <p className="mt-3 text-[clamp(11px,3.2vw,14px)] font-black leading-[1.45] text-[#14384b] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
        {pick?.text || '저장된 문장을 기다리는 중'}
      </p>
      <p className="mt-3 text-[clamp(9px,2.6vw,11px)] font-bold leading-snug text-[#4b6d78] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
        {pick?.bookTitle || 'Euphony'} {pick?.author ? `· ${pick.author}` : ''}
      </p>
    </section>
  )
}

function TodoSummary() {
  const { todos } = useTodos()
  const doing = todos.filter((todo) => (todo.sectionId || 'todo') === 'doing' && !todo.completed)

  return (
    <Card icon={CheckCircle2} title="TODO 진행중">
      <div className="px-4 py-3">
        <p className="text-2xl font-black text-[#1f4e5f]">{doing.length}<span className="ml-1 text-sm">개</span></p>
        <div className="mt-2 space-y-1">
          {doing.slice(0, 3).map((todo) => (
            <p key={todo.id} className="truncate text-xs font-semibold text-[#55777b]">{todo.title}</p>
          ))}
          {doing.length === 0 && <p className="text-xs font-semibold text-[#9aadb1]">진행중인 할 일 없음</p>}
        </div>
      </div>
    </Card>
  )
}

function NewsScrapsSummary() {
  const scraps = useNewsScraps()

  return (
    <Card icon={Newspaper} title="스크랩한 소식">
      <div className="px-4 py-3">
        <p className="text-2xl font-black text-[#1f4e5f]">{scraps.length}<span className="ml-1 text-sm">건</span></p>
        <div className="mt-2 space-y-1">
          {scraps.slice(0, 2).map((item) => (
            <p key={item.id} className="truncate text-xs font-semibold text-[#55777b]">{item.title}</p>
          ))}
          {scraps.length === 0 && <p className="text-xs font-semibold text-[#9aadb1]">스크랩 없음</p>}
        </div>
      </div>
    </Card>
  )
}

function RoutineSummary() {
  const { routines } = useRoutines()

  return (
    <Card icon={Repeat} title="정기일정">
      <div className="grid grid-cols-3 gap-1 px-3 py-3">
        {['daily', 'weekly', 'monthly'].map((type) => {
          const typedRoutines = routines.filter((routine) => routine.type === type)
          return (
            <div key={type} className="min-w-0 rounded-md bg-[#f4f8f8] px-1.5 py-2 text-center">
              <p className="text-[9px] font-bold text-[#789094]">{ROUTINE_LABELS[type]}</p>
              <div className="mt-1 flex min-h-[38px] flex-col items-center justify-start gap-0.5">
                {typedRoutines.length === 0 ? (
                  <span className="mt-2 text-[9px] font-bold leading-none text-[#9aadb1]">없음</span>
                ) : (
                  <>
                    {typedRoutines.slice(0, 2).map((routine) => (
                      <span
                        key={routine.id}
                        className="max-w-full rounded bg-white px-1.5 py-0.5 text-[10px] font-black leading-none text-[#1f4e5f]"
                      >
                        {shortRoutine(routine.text)}
                      </span>
                    ))}
                    {typedRoutines.length > 2 && (
                      <span className="rounded-full bg-[#dcebed] px-1.5 text-[10px] font-black leading-none text-[#55777b]">
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

export default function SummaryPage({ onOpenCalendarDate, onOpenPage }) {
  const { events } = useCalendar()
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  return (
    <div className="min-h-full bg-[#f4f7f7] p-3 md:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <CompactWeatherSummary onOpenWeather={() => onOpenPage?.('weather')} />

        <div className="grid grid-cols-2 gap-3">
          <EuphonySummary />
          <RoutineSummary />
          <div aria-hidden="true" />
          <LiquidMemoBoard className="col-span-full" />
          <TodoSummary />
          <NewsScrapsSummary />
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
