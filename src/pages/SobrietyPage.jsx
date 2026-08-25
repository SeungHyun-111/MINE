import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarCheck2, Check, ChevronLeft, ChevronRight, Save, Trash2, WineOff } from 'lucide-react'
import { useSobriety } from '@/hooks/useSobriety'
import { formatDateKey, getSeoulDateKey, parseDateKey } from '@/lib/dateTime'

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function buildMonthDays(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
  const days = []

  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day)
  }

  return days
}

function diffInDays(startKey, endKey) {
  const start = parseDateKey(startKey)
  const end = parseDateKey(endKey)
  if (!start || !end) return 0
  return Math.round((end - start) / 86400000)
}

function calculateStreaks(checkins, todayKey) {
  const checkedDates = Object.values(checkins)
    .filter((item) => item.checked)
    .map((item) => item.date)
    .sort()

  let longest = 0
  let currentRun = 0
  let previousDate = null

  checkedDates.forEach((date) => {
    if (previousDate && diffInDays(previousDate, date) === 1) {
      currentRun += 1
    } else {
      currentRun = 1
    }

    longest = Math.max(longest, currentRun)
    previousDate = date
  })

  let current = 0
  let cursor = todayKey
  while (checkins[cursor]?.checked) {
    current += 1
    cursor = formatDateKey(addDays(parseDateKey(cursor), -1))
  }

  return { current, longest, total: checkedDates.length }
}

function KpiCard({ label, value, subtext }) {
  return (
    <div className="rounded-lg border border-[#bbd5f5] bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-xs font-bold text-[#5577bb]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0044cc]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#7799cc]">{subtext}</p>
    </div>
  )
}

function SobrietyEditor({ selectedDate, checkin, onSave, onRemove }) {
  const [note, setNote] = useState(checkin?.note || '')
  const selected = parseDateKey(selectedDate)

  useEffect(() => {
    setNote(checkin?.note || '')
  }, [checkin?.note, selectedDate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSave(selectedDate, note)
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#bbd5f5] bg-[#cce0ff] px-4 py-3">
        <CalendarCheck2 size={19} className="text-[#0044cc]" />
        <div>
          <h2 className="text-base font-black text-[#0044cc]">
            {selected ? format(selected, 'M월 d일 EEEE', { locale: ko }) : selectedDate}
          </h2>
          <p className="text-xs font-bold text-[#5577bb]">
            {checkin?.checked ? '금주 완료로 기록됨' : '아직 기록 없음'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={7}
          placeholder="오늘의 소감을 짧게 적어두기"
          className="w-full resize-none rounded-lg border border-[#99ccff] bg-[#f5f9ff] px-3 py-2 text-sm leading-6 text-[#1a3d8a] outline-none focus:border-[#5588bb] focus:ring-2 focus:ring-[#c8dfff]"
        />

        <div className="flex flex-wrap justify-end gap-2">
          {checkin?.checked && (
            <button
              type="button"
              onClick={() => onRemove(selectedDate)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4bcbc] bg-[#fff0f0] px-4 py-2 text-sm font-bold text-[#7a3d3d] hover:bg-[#ffe3e3]"
            >
              <Trash2 size={16} />
              삭제
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0044cc] px-4 py-2 text-sm font-black text-white hover:bg-[#002080]"
          >
            <Save size={16} />
            금주 체크 저장
          </button>
        </div>
      </form>
    </section>
  )
}

export default function SobrietyPage() {
  const { checkins, loading, error, saveCheckin, removeCheckin } = useSobriety()
  const todayKey = getSeoulDateKey()
  const [monthDate, setMonthDate] = useState(() => parseDateKey(todayKey) || new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const days = useMemo(() => buildMonthDays(monthDate), [monthDate])
  const selectedCheckin = checkins[selectedDate]

  const monthCheckins = useMemo(() => {
    const monthPrefix = format(monthDate, 'yyyy-MM')
    return Object.values(checkins).filter((item) => item.checked && item.date?.startsWith(monthPrefix))
  }, [checkins, monthDate])

  const kpis = useMemo(() => calculateStreaks(checkins, todayKey), [checkins, todayKey])

  const recentCheckins = useMemo(() => (
    Object.values(checkins)
      .filter((item) => item.checked)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  ), [checkins])

  const moveMonth = (amount) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const selectToday = () => {
    const today = parseDateKey(todayKey) || new Date()
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(todayKey)
  }

  return (
    <div className="min-h-full bg-[#f0f5ff] p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-[#0044cc]">
            <WineOff size={24} />
            금주
          </h1>
          <p className="mt-1 text-sm font-medium text-[#4477cc]">달력에 체크하고, 하루 소감을 RTDB에 저장합니다.</p>
        </div>
        <button
          type="button"
          onClick={selectToday}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/90 px-4 py-2 text-sm font-black text-[#0044cc] ring-1 ring-[#bbd5f5] hover:bg-[#dbeaff]"
        >
          <Check size={16} />
          오늘로 이동
        </button>
      </div>

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

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="이번 달"
          value={`${monthCheckins.length}일`}
          subtext={`${format(monthDate, 'M월')} 금주 체크`}
        />
        <KpiCard
          label="현재 연속"
          value={`${kpis.current}일`}
          subtext={kpis.current > 0 ? '오늘까지 이어지는 기록' : '오늘 기록을 기다리는 중'}
        />
        <KpiCard
          label="최장 연속"
          value={`${kpis.longest}일`}
          subtext="가장 길게 이어진 기간"
        />
        <KpiCard
          label="전체 기록"
          value={`${kpis.total}일`}
          subtext="RTDB에 저장된 체크 수"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#bbd5f5] bg-[#99ccff] px-3 py-3">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f5ff] text-[#0044cc] hover:bg-[#dbeaff]"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-black text-[#0044cc]">{format(monthDate, 'yyyy년 M월', { locale: ko })}</h2>
              <p className="text-xs font-bold text-[#2255aa]">이번 달 {monthCheckins.length}일 금주</p>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f5ff] text-[#0044cc] hover:bg-[#dbeaff]"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[#d5e8ff] bg-[#eef3ff]">
            {WEEK_LABELS.map((label) => (
              <div key={label} className="px-2 py-2 text-center text-xs font-black text-[#4477cc]">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = formatDateKey(day)
              const checkin = checkins[dateKey]
              const selected = selectedDate === dateKey
              const today = todayKey === dateKey
              const inMonth = isSameMonth(day, monthDate)

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`min-h-24 border-b border-r border-[#d5e8ff] p-2 text-left transition-colors last:border-r-0 hover:bg-[#eef7ff] ${
                    selected ? 'bg-[#dbeaff] ring-2 ring-inset ring-[#0044cc]' : inMonth ? 'bg-white/80' : 'bg-[#f6f8fb] text-[#9ab]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-black ${today ? 'text-[#e85252]' : 'text-[#0044cc]'}`}>
                      {format(day, 'd')}
                    </span>
                    {checkin?.checked && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1f8a5b] text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  {checkin?.note && (
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-[#3355aa]">
                      {checkin.note}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <div className="space-y-4">
          <SobrietyEditor
            selectedDate={selectedDate}
            checkin={selectedCheckin}
            onSave={saveCheckin}
            onRemove={removeCheckin}
          />

          <section className="overflow-hidden rounded-lg border border-[#aacce4] bg-white/90 shadow-sm">
            <div className="border-b border-[#bbd5f5] bg-[#cce0ff] px-4 py-3">
              <h2 className="text-base font-black text-[#0044cc]">최근 기록</h2>
            </div>
            {recentCheckins.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-bold text-[#7799cc]">아직 금주 기록이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-[#d5e8ff]">
                {recentCheckins.map((item) => (
                  <li key={item.date} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        const date = parseDateKey(item.date)
                        if (date) setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1))
                        setSelectedDate(item.date)
                      }}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-black text-[#0044cc]">{item.date}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#5577bb]">{item.note || '소감 없음'}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
