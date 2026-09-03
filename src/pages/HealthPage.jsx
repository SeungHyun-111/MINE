import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Pencil,
  Info,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import { onValue, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { addDateKeyDays, formatDateKey, getSeoulDateKey, parseDateKey } from '@/lib/dateTime'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useExerciseState } from '@/hooks/useExerciseState'

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const FIGHTER_PULLUP_TEMPLATE = {
  id: 'fighter-pullup-max-5',
  name: '러시안 파이터 풀업',
  subtitle: '파벨 차졸린식 4주 루틴, MAX 5개 기준',
  exercise: '풀업',
  principles: [
    '한 세트에서 실패지점까지 가지 않는다.',
    '세트 사이 최소 2분, 권장 2~5분 휴식.',
    '반동 없이 정자세로 수행한다.',
    '4주 종료 후 2일 완전 휴식 뒤 MAX를 재측정한다.',
  ],
  days: [
    { day: 1, sets: [5, 4, 3, 2, 1] },
    { day: 2, sets: [5, 4, 3, 2, 2] },
    { day: 3, sets: [5, 4, 3, 3, 2] },
    { day: 4, sets: [5, 4, 4, 3, 2] },
    { day: 5, sets: [5, 5, 4, 3, 2] },
    { day: 6, rest: true },
    { day: 7, sets: [6, 5, 4, 3, 2] },
    { day: 8, sets: [6, 5, 4, 3, 3] },
    { day: 9, sets: [6, 5, 4, 4, 3] },
    { day: 10, sets: [6, 5, 5, 4, 3] },
    { day: 11, sets: [6, 6, 5, 4, 3] },
    { day: 12, rest: true },
    { day: 13, sets: [7, 6, 5, 4, 3] },
    { day: 14, sets: [7, 6, 5, 4, 4] },
    { day: 15, sets: [7, 6, 5, 5, 4] },
    { day: 16, sets: [7, 6, 6, 5, 4] },
    { day: 17, sets: [7, 7, 6, 5, 4] },
    { day: 18, rest: true },
    { day: 19, sets: [8, 7, 6, 5, 4] },
    { day: 20, sets: [8, 7, 6, 5, 5] },
    { day: 21, sets: [8, 7, 6, 6, 5] },
    { day: 22, sets: [8, 7, 7, 6, 5] },
    { day: 23, sets: [8, 8, 7, 6, 5] },
    { day: 24, rest: true },
    { day: 25, sets: [9, 8, 7, 6, 5] },
    { day: 26, sets: [9, 8, 7, 6, 6] },
    { day: 27, sets: [9, 8, 7, 7, 6] },
    { day: 28, sets: [9, 8, 8, 7, 6] },
    { day: 29, sets: [9, 9, 8, 7, 6] },
    { day: 30, rest: true },
    { day: 31, rest: true, title: '완전 휴식' },
    { day: 32, rest: true, title: '완전 휴식' },
    { day: 33, test: true, title: '풀업 MAX 재측정' },
  ],
}

function getDayTotal(day) {
  return day.sets?.reduce((sum, value) => sum + value, 0) || 0
}

function buildMonthDays(date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 })
  const days = []

  for (let current = start; current <= end; current = addDays(current, 1)) {
    days.push(current)
  }

  return days
}

function makeSchedule(startDate) {
  return FIGHTER_PULLUP_TEMPLATE.days.reduce((map, day) => {
    map[addDateKeyDays(startDate, day.day - 1)] = day
    return map
  }, {})
}

function normalizeActualSets(values, targetSets = []) {
  return targetSets.map((target, index) => {
    const value = Number(values[index])
    return Number.isFinite(value) ? value : target
  })
}

function hasFighterRecord(record) {
  return Boolean(record?.done || record?.actualSets || record?.memo)
}

function hasDateRecord(record) {
  return Boolean(
    record?.checked
      || record?.done
      || record?.actualSets
      || record?.memo
      || record?.routineEntries?.length,
  )
}

function stripFighterRecord(record) {
  const next = {}
  if (record?.checked) next.checked = record.checked
  if (record?.routineEntries?.length) next.routineEntries = record.routineEntries
  if (!hasDateRecord(next)) return null

  next.updatedAt = Date.now()
  return next
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg border border-[#d7dfd3] bg-white px-3 py-2">
      <p className="text-xs font-bold text-[#66736a]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#18251d]">{value}</p>
    </div>
  )
}

const NEON_COLOR = '#F1E63C'
const NEON_EDGE_COPIES = 2
const NEON_GLOW_LAYERS = [
  { blur: 8, opacity: 0.5, reach: 0.3 },
  { blur: 15, opacity: 0.3, reach: 0.6 },
  { blur: 57, opacity: 0.18, reach: 1 },
]
const NEON_MAX_GLOW_BLUR = Math.max(...NEON_GLOW_LAYERS.map((layer) => layer.blur))
const NEON_MAX_GLOW_REACH = 36
const NEON_BAND_MASK = {
  WebkitMaskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  WebkitMaskClip: 'content-box, border-box',
  WebkitMaskComposite: 'xor',
  maskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  maskClip: 'content-box, border-box',
  maskComposite: 'exclude',
}

function withAlpha(input, alpha) {
  const value = Math.max(0, Math.min(1, alpha))
  const hex = input.trim().match(/^#([0-9a-f]{3,8})$/i)
  if (!hex) return `rgba(241,230,60,${value})`

  let color = hex[1]
  if (color.length === 3 || color.length === 4) {
    color = color.split('').map((part) => part + part).join('')
  }

  const numeric = parseInt(color.slice(0, 6), 16)
  return `rgba(${(numeric >> 16) & 255},${(numeric >> 8) & 255},${numeric & 255},${value})`
}

function perimeterPoint(progress, width, height) {
  const distance = (((progress % 1) + 1) % 1) * 2 * (width + height)
  if (distance < width) return [distance, 0]
  if (distance < width + height) return [width, distance - width]
  if (distance < width * 2 + height) return [width - (distance - width - height), height]
  return [0, height - (distance - width * 2 - height)]
}

function cornerLap(corner, width, height) {
  const perimeter = 2 * (width + height)
  const corners = [0, width / perimeter, (width + height) / perimeter, (width * 2 + height) / perimeter]
  return Math.floor(corner / 4) + corners[((corner % 4) + 4) % 4]
}

function perimeterAngle(progress, width, height) {
  const [x, y] = perimeterPoint(progress, width, height)
  return (Math.atan2(x - width / 2, height / 2 - y) * 180) / Math.PI
}

function buildNeonArc(lap, lengthPct, width, height, color) {
  const safeWidth = width > 0 ? width : 100
  const safeHeight = height > 0 ? height : 100
  const length = Math.max(0, Math.min(100, lengthPct))
  const span = Math.max(0.015, (length / 100) * 0.5)
  const solid = length / 100
  const stops = []
  let base = 0
  let previous = 0
  let accumulated = 0

  for (let index = 0; index <= 24; index += 1) {
    const fraction = index / 24
    const angle = perimeterAngle(lap + (fraction - 0.5) * span, safeWidth, safeHeight)

    if (index === 0) {
      base = angle
    } else {
      let delta = angle - previous
      while (delta > 180) delta -= 360
      while (delta < -180) delta += 360
      accumulated += delta
    }
    previous = angle

    const t = Math.abs(fraction - 0.5) * 2
    const k = solid >= 1 ? 1 : t <= solid ? 1 : 1 - (t - solid) / (1 - solid)
    stops.push(`${withAlpha(color, k * k * (3 - 2 * k))} ${accumulated.toFixed(2)}deg`)
  }

  const end = accumulated.toFixed(2)
  stops.push(`${withAlpha(color, 0)} ${end}deg`)
  stops.push(`${withAlpha(color, 0)} 360deg`)

  return `conic-gradient(from ${base.toFixed(2)}deg at 50% 50%, ${stops.join(', ')})`
}

function easeBezier(points) {
  const [x1, y1, x2, y2] = points
  const bez = (a, b, t) => {
    const u = 1 - t
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t
  }

  return (t) => {
    const x = Math.max(0, Math.min(1, t))
    let s = x
    for (let i = 0; i < 8; i += 1) {
      const currentX = bez(x1, x2, s) - x
      const u = 1 - s
      const dx = 3 * u * u * x1 + 6 * u * s * (x2 - x1) + 3 * s * s * (1 - x2)
      if (Math.abs(dx) < 1e-6) break
      s = Math.max(0, Math.min(1, s - currentX / dx))
    }
    return bez(y1, y2, s)
  }
}

const neonGlideEase = easeBezier([0.65, 0, 0.35, 1])

function NeonBorder() {
  const rootRef = useRef(null)
  const groupARef = useRef(null)
  const groupBRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const thickness = 10
  const borderSize = 57
  const radius = 0
  const glowAmount = 1
  const glowOuter = 10 + NEON_MAX_GLOW_REACH + NEON_MAX_GLOW_BLUR * 2

  useEffect(() => {
    const element = rootRef.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect()
      if (rect.width === sizeRef.current.w && rect.height === sizeRef.current.h) return
      sizeRef.current = { w: rect.width, h: rect.height }
      setSize(sizeRef.current)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frameId = 0
    let last = performance.now()
    let corner = 0
    let stepProgress = 0

    const frame = (now) => {
      const delta = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const beat = (30 + ((4 - 30) * (17 - 1)) / 19) / 4

      stepProgress += delta / beat
      while (stepProgress >= 1) {
        stepProgress -= 1
        corner += 1
      }

      const eased = neonGlideEase(stepProgress)
      const { w, h } = sizeRef.current
      const safeWidth = w > 0 ? w : 100
      const safeHeight = h > 0 ? h : 100
      const from = cornerLap(corner, safeWidth, safeHeight)
      const to = cornerLap(corner + 1, safeWidth, safeHeight)
      const lap = from + (to - from) * eased

      groupARef.current?.style.setProperty('--arc', buildNeonArc(lap, borderSize, w, h, NEON_COLOR))
      groupBRef.current?.style.setProperty('--arc', buildNeonArc(lap + 0.5, borderSize, w, h, NEON_COLOR))
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const band = (ring, offset = 0) => (
    <div
      style={{
        position: 'absolute',
        inset: offset - ring,
        boxSizing: 'border-box',
        padding: ring,
        borderRadius: radius,
        background: 'var(--arc)',
        ...NEON_BAND_MASK,
      }}
    />
  )

  const glowLayer = (key, ring, blur, opacity) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        inset: -glowOuter,
        boxSizing: 'border-box',
        padding: glowOuter,
        borderRadius: radius,
        opacity,
        mixBlendMode: 'plus-lighter',
        filter: blur ? `blur(${blur.toFixed(1)}px)` : 'none',
        WebkitFilter: blur ? `blur(${blur.toFixed(1)}px)` : 'none',
        ...NEON_BAND_MASK,
      }}
    >
      {band(ring, glowOuter)}
    </div>
  )

  const glowGroup = (start, elementRef) => (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        '--arc': buildNeonArc(start, borderSize, size.w, size.h, NEON_COLOR),
      }}
    >
      {NEON_GLOW_LAYERS.map((layer, index) => (
        glowLayer(`glow-${index}`, thickness + glowAmount * NEON_MAX_GLOW_REACH * layer.reach, layer.blur, layer.opacity)
      ))}
      {Array.from({ length: NEON_EDGE_COPIES }).map((_, index) => (
        <div key={`edge-${index}`} style={{ position: 'absolute', inset: 0, mixBlendMode: 'plus-lighter' }}>
          {band(thickness)}
        </div>
      ))}
    </div>
  )

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-0 overflow-visible">
      {glowGroup(0, groupARef)}
      {glowGroup(0.5, groupBRef)}
    </div>
  )
}

export default function HealthPage() {
  const { user } = useAuth()
  const exerciseStore = useExerciseState({})
  const [plan, setPlan] = useState(null)
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [startDraft, setStartDraft] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => parseDateKey(getSeoulDateKey()) || new Date())
  const [selectedDate, setSelectedDate] = useState(getSeoulDateKey())
  const [memoDraft, setMemoDraft] = useState('')
  const [actualDraft, setActualDraft] = useState([])
  const [routineToAdd, setRoutineToAdd] = useState('')
  const [editingRoutineId, setEditingRoutineId] = useState('')
  const [editingRoutineDraft, setEditingRoutineDraft] = useState(null)

  const healthPath = useMemo(() => (user ? `users/${user.uid}/pages/health` : null), [user])
  const schedule = useMemo(() => (plan?.startDate ? makeSchedule(plan.startDate) : {}), [plan?.startDate])
  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth])
  const selectedPlan = schedule[selectedDate]
  const selectedRecord = records[selectedDate]
  const exerciseRoutines = useMemo(() => {
    const meta = exerciseStore.routinesMeta || {}
    const itemsByDay = exerciseStore.routineItemsByDay || {}

    return Object.entries(meta).map(([id, routine]) => ({
      id,
      ...routine,
      items: itemsByDay[id] || [],
    }))
  }, [exerciseStore.routineItemsByDay, exerciseStore.routinesMeta])

  const stats = useMemo(() => {
    const scheduledTrainingDays = plan ? FIGHTER_PULLUP_TEMPLATE.days.filter((day) => day.sets).length : 0
    const completed = Object.entries(records).filter(([dateKey, record]) => schedule[dateKey]?.sets && record.done).length
    const targetVolume = plan ? FIGHTER_PULLUP_TEMPLATE.days.reduce((sum, day) => sum + getDayTotal(day), 0) : 0
    const actualVolume = Object.entries(records).reduce(
      (sum, [dateKey, record]) => {
        if (!schedule[dateKey]?.sets) return sum
        return sum + (record.actualSets || []).reduce((setSum, value) => setSum + Number(value || 0), 0)
      },
      0,
    )

    return { scheduledTrainingDays, completed, targetVolume, actualVolume }
  }, [plan, records, schedule])

  useEffect(() => {
    if (!healthPath) {
      setPlan(null)
      setRecords({})
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, healthPath),
      (snapshot) => {
        const value = snapshot.val() || {}
        setPlan(value.plan || null)
        setRecords(value.records || {})
        setStartDraft(value.plan?.startDate || '')
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      },
    )
  }, [healthPath])

  useEffect(() => {
    const record = records[selectedDate]
    setMemoDraft(record?.memo || '')
    setActualDraft(record?.actualSets || selectedPlan?.sets || [])
    setEditingRoutineId('')
    setEditingRoutineDraft(null)
  }, [records, selectedDate, selectedPlan])

  const createPlan = async () => {
    if (!healthPath || !startDraft) return

    const updates = {
      [`${healthPath}/plan`]: {
        templateId: FIGHTER_PULLUP_TEMPLATE.id,
        title: FIGHTER_PULLUP_TEMPLATE.name,
        startDate: startDraft,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      },
      [`${healthPath}/updatedAtServer`]: serverTimestamp(),
    }

    Object.entries(records).forEach(([dateKey, record]) => {
      if (!hasFighterRecord(record)) return
      updates[`${healthPath}/records/${dateKey}`] = stripFighterRecord(record)
    })

    await update(ref(db), updates)
    setCurrentMonth(parseDateKey(startDraft) || new Date())
    setSelectedDate(startDraft)
  }

  const deletePlan = async () => {
    if (!healthPath || !plan) return
    const ok = window.confirm('러시안 파이터 풀업 계획과 해당 수행 기록만 삭제할까요?')
    if (!ok) return

    const updates = {
      [`${healthPath}/plan`]: null,
      [`${healthPath}/updatedAtServer`]: serverTimestamp(),
    }

    Object.entries(records).forEach(([dateKey, record]) => {
      if (!hasFighterRecord(record)) return
      updates[`${healthPath}/records/${dateKey}`] = stripFighterRecord(record)
    })

    await update(ref(db), updates)
    setCurrentMonth(parseDateKey(getSeoulDateKey()) || new Date())
    setSelectedDate(getSeoulDateKey())
    setStartDraft('')
  }

  const updateStartDraft = (value) => {
    setStartDraft(value)
    setCurrentMonth(parseDateKey(value) || new Date())
    setSelectedDate(value)
  }

  const saveRecord = async () => {
    if (!healthPath || !selectedPlan) return

    await update(ref(db, `${healthPath}/records/${selectedDate}`), {
      done: true,
      actualSets: selectedPlan.sets ? normalizeActualSets(actualDraft, selectedPlan.sets) : [],
      memo: memoDraft.trim(),
      savedAt: Date.now(),
      savedAtServer: serverTimestamp(),
    })
  }

  const toggleDateChecked = async (dateKey) => {
    if (!healthPath) return

    const record = records[dateKey] || {}
    const nextChecked = !record.checked

    if (nextChecked) {
      await update(ref(db, `${healthPath}/records/${dateKey}`), {
        checked: true,
        checkedAt: Date.now(),
        checkedAtServer: serverTimestamp(),
      })
      return
    }

    const nextRecord = { ...record }
    delete nextRecord.checked
    delete nextRecord.checkedAt

    if (!hasDateRecord(nextRecord)) {
      await remove(ref(db, `${healthPath}/records/${dateKey}`))
      return
    }

    await update(ref(db, `${healthPath}/records/${dateKey}`), {
      checked: null,
      checkedAt: null,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })
  }

  const deleteSelectedFighterRecord = async () => {
    if (!healthPath) return

    const nextRecord = stripFighterRecord(selectedRecord)
    if (nextRecord) {
      await set(ref(db, `${healthPath}/records/${selectedDate}`), nextRecord)
    } else {
      await remove(ref(db, `${healthPath}/records/${selectedDate}`))
    }
  }

  const deleteAllFighterRecords = async () => {
    if (!healthPath) return

    const datesWithFighterRecords = Object.entries(records).filter(([, record]) => hasFighterRecord(record))
    if (datesWithFighterRecords.length === 0) return

    const ok = window.confirm('러시안 파이터 풀업 수행 기록을 전체 삭제할까요?')
    if (!ok) return

    const updates = {
      [`${healthPath}/updatedAtServer`]: serverTimestamp(),
    }

    datesWithFighterRecords.forEach(([dateKey, record]) => {
      updates[`${healthPath}/records/${dateKey}`] = stripFighterRecord(record)
    })

    await update(ref(db), updates)
  }

  const addExerciseRoutineToDate = async () => {
    if (!healthPath || !routineToAdd) return

    const routine = exerciseRoutines.find((item) => item.id === routineToAdd)
    if (!routine) return

    const currentEntries = selectedRecord?.routineEntries || []
    const nextEntry = {
      id: `${routine.id}-${Date.now()}`,
      sourceRoutineId: routine.id,
      day: routine.day || '',
      title: routine.title || '나의 루틴',
      tag: routine.tag || '',
      items: routine.items || [],
      addedAt: Date.now(),
    }

    await update(ref(db, `${healthPath}/records/${selectedDate}`), {
      routineEntries: [...currentEntries, nextEntry],
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })
    setRoutineToAdd('')
  }

  const startEditRoutineEntry = (entry) => {
    setEditingRoutineId(entry.id)
    setEditingRoutineDraft({
      title: entry.title || '',
      day: entry.day || '',
      tag: entry.tag || '',
      items: (entry.items || []).map((item) => ({ ...item })),
    })
  }

  const updateEditingRoutineField = (field, value) => {
    setEditingRoutineDraft((draft) => ({ ...(draft || {}), [field]: value }))
  }

  const updateEditingRoutineItem = (index, field, value) => {
    setEditingRoutineDraft((draft) => {
      const items = [...(draft?.items || [])]
      items[index] = { ...(items[index] || {}), [field]: value }
      return { ...(draft || {}), items }
    })
  }

  const saveRoutineEntryEdit = async () => {
    if (!healthPath || !editingRoutineId || !editingRoutineDraft) return

    const nextEntries = (selectedRecord?.routineEntries || []).map((entry) => (
      entry.id === editingRoutineId
        ? {
            ...entry,
            title: editingRoutineDraft.title.trim() || entry.title,
            day: editingRoutineDraft.day.trim(),
            tag: editingRoutineDraft.tag.trim(),
            items: editingRoutineDraft.items || [],
            editedAt: Date.now(),
          }
        : entry
    ))

    await update(ref(db, `${healthPath}/records/${selectedDate}`), {
      routineEntries: nextEntries,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })
    setEditingRoutineId('')
    setEditingRoutineDraft(null)
  }

  const deleteRoutineEntry = async (entryId) => {
    if (!healthPath) return
    const nextEntries = (selectedRecord?.routineEntries || []).filter((entry) => entry.id !== entryId)

    if (nextEntries.length === 0 && !hasFighterRecord(selectedRecord) && !selectedRecord?.checked) {
      await remove(ref(db, `${healthPath}/records/${selectedDate}`))
      return
    }

    await update(ref(db, `${healthPath}/records/${selectedDate}`), {
      routineEntries: nextEntries.length ? nextEntries : null,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })
  }

  const selectedDateObject = parseDateKey(selectedDate) || new Date()

  return (
    <div className="min-h-full bg-[#f4f1e8] text-[#18251d]">
      <div className="border-b border-[#d8d0bd] bg-[#fbfaf5] px-4 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-black">운동 계획</h1>
            <p className="text-sm font-semibold text-[#5f695f]">
              시작 날짜를 찍어 루틴을 캘린더에 생성하고, 헬스장에서 실제 수행한 세트를 기록합니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="grid gap-1 text-xs font-black text-[#5f695f]">
              러시안 풀업 시작일
              <input
                type="date"
                value={startDraft}
                onChange={(event) => updateStartDraft(event.target.value)}
                className="h-10 rounded-lg border border-[#cfc6b2] bg-white px-3 text-sm font-bold text-[#18251d] outline-none focus:border-[#2f7d46]"
              />
            </label>
            <button
              type="button"
              onClick={createPlan}
              disabled={!startDraft || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2f7d46] px-4 text-sm font-black text-white hover:bg-[#256339] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CalendarCheck size={17} />
              {plan ? '러시안 풀업 다시 생성' : '러시안 풀업 생성'}
            </button>
            {plan && (
              <button
                type="button"
                onClick={deletePlan}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7b7ac] bg-white px-4 text-sm font-black text-[#9d3f2a] hover:bg-[#fff3ef]"
              >
                <Trash2 size={17} />
                러시안 풀업 삭제
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-[#edc4bb] bg-[#fff3ef] px-3 py-2 text-sm font-bold text-[#9d3f2a]">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_380px] md:p-6">
        <section className="overflow-hidden rounded-lg border border-[#d8d0bd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e4ddce] bg-[#fbfaf5] px-3 py-3">
            <button
              type="button"
              onClick={() => setCurrentMonth((date) => subMonths(date, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#2f7d46] hover:bg-[#edf5eb]"
              aria-label="이전 달"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base font-black">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h2>
            <button
              type="button"
              onClick={() => setCurrentMonth((date) => addMonths(date, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#2f7d46] hover:bg-[#edf5eb]"
              aria-label="다음 달"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[#e4ddce] bg-[#f1eadc]">
            {WEEK_LABELS.map((label) => (
              <div key={label} className="px-2 py-2 text-center text-xs font-black text-[#6b604e]">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((date) => {
              const dateKey = formatDateKey(date)
              const plan = schedule[dateKey]
              const record = records[dateKey]
              const inMonth = isSameMonth(date, currentMonth)
              const selected = dateKey === selectedDate
              const today = dateKey === getSeoulDateKey()
              const dateChecked = Boolean(record?.checked)
              const routineTitles = (record?.routineEntries || []).map((entry) => entry.title).filter(Boolean)

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative flex min-h-[94px] flex-col overflow-visible border-b border-r border-[#eee7d8] p-2 text-left transition-colors hover:bg-[#f8f6ee] md:min-h-[118px] ${
                    selected ? 'bg-[#e7f3e3] ring-2 ring-inset ring-[#2f7d46]' : ''
                  } ${inMonth ? 'text-[#18251d]' : 'bg-[#fafafa] text-[#a39a8a]'}`}
                >
                  {dateChecked && <NeonBorder />}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${today ? 'bg-[#cf4f2f] text-white' : ''}`}>
                      {format(date, 'd')}
                    </span>
                    <span
                      className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#cfc6b2] bg-white/90 text-[#2f7d46]"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleDateChecked(dateKey)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dateChecked}
                        onChange={() => {}}
                        className="sr-only"
                        aria-label={`${format(date, 'M월 d일')} 체크`}
                      />
                      {dateChecked ? <Check size={16} strokeWidth={3} /> : null}
                    </span>
                  </div>

                  {plan && (
                    <div className="relative z-10 mt-2 min-w-0">
                      <p className="text-xs font-black text-[#2f7d46]">DAY {plan.day}</p>
                      <p className="mt-1 truncate text-xs font-bold">
                        {plan.test ? 'MAX 재측정' : plan.rest ? plan.title || '휴식' : plan.sets.join('-')}
                      </p>
                      {plan.sets && <p className="mt-1 text-[11px] font-bold text-[#7a6d59]">총 {getDayTotal(plan)}회</p>}
                    </div>
                  )}
                  {routineTitles.length > 0 && (
                    <div className="relative z-10 mt-2 grid gap-1">
                      {routineTitles.slice(0, 2).map((title) => (
                        <div key={title} className="truncate rounded-md bg-[#fff3df] px-2 py-1 text-[11px] font-black text-[#9a5a18]">
                          {title}
                        </div>
                      ))}
                      {routineTitles.length > 2 && (
                        <div className="rounded-md bg-[#fff3df] px-2 py-1 text-[11px] font-black text-[#9a5a18]">
                          +{routineTitles.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-[#d8d0bd] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e7f3e3] text-[#2f7d46]">
                <Dumbbell size={21} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black">{FIGHTER_PULLUP_TEMPLATE.name}</h2>
                <p className="text-xs font-bold text-[#687064]">{FIGHTER_PULLUP_TEMPLATE.subtitle}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatBox label="운동일" value={`${stats.scheduledTrainingDays}일`} />
              <StatBox label="완료" value={`${stats.completed}일`} />
              <StatBox label="목표 총량" value={`${stats.targetVolume}회`} />
              <StatBox label="실제 총량" value={`${stats.actualVolume}회`} />
            </div>
          </section>

          <section className="rounded-lg border border-[#d8d0bd] bg-white shadow-sm">
            <div className="border-b border-[#e4ddce] bg-[#fbfaf5] px-4 py-3">
              <p className="text-xs font-black text-[#687064]">{format(selectedDateObject, 'yyyy.MM.dd EEEE', { locale: ko })}</p>
              <h2 className="mt-1 text-lg font-black">
                {selectedPlan ? `DAY ${selectedPlan.day}` : plan ? '루틴 없음' : '시작일을 선택하세요'}
              </h2>
            </div>

            <div className="grid gap-4 p-4">
              <section className="rounded-lg border border-[#e4ddce] bg-[#fbfaf5] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Dumbbell size={16} className="text-[#2f7d46]" />
                  <h3 className="text-sm font-black">운동 루틴 추가</h3>
                </div>
                <div className="grid grid-cols-[1fr_72px] gap-2">
                  <select
                    value={routineToAdd}
                    onChange={(event) => setRoutineToAdd(event.target.value)}
                    disabled={exerciseRoutines.length === 0}
                    className="h-10 min-w-0 rounded-lg border border-[#cfc6b2] bg-white px-3 text-sm font-bold outline-none focus:border-[#2f7d46] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="추가할 운동 루틴"
                  >
                    <option value="">
                      {exerciseRoutines.length === 0 ? '운동 페이지 루틴 없음' : '루틴 선택'}
                    </option>
                    {exerciseRoutines.map((routine) => (
                      <option key={routine.id} value={routine.id}>
                        {routine.day} · {routine.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addExerciseRoutineToDate}
                    disabled={!routineToAdd}
                    className="h-10 rounded-lg bg-[#2f7d46] text-sm font-black text-white hover:bg-[#256339] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    추가
                  </button>
                </div>
                <div className="mt-3 grid gap-2">
                  {(selectedRecord?.routineEntries || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#d8d0bd] px-3 py-4 text-center text-xs font-bold text-[#756b5a]">
                      이 날짜에 추가된 운동 루틴이 없습니다.
                    </p>
                  ) : (
                    selectedRecord.routineEntries.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-[#e4ddce] bg-white p-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-[#2f7d46]">{entry.day || entry.tag || '루틴'}</p>
                            <h4 className="mt-1 truncate text-sm font-black">{entry.title}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditRoutineEntry(entry)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#756b5a] hover:bg-[#f8f6ee]"
                            aria-label={`${entry.title} 수정`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRoutineEntry(entry.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9d3f2a] hover:bg-[#fff3ef]"
                            aria-label={`${entry.title} 삭제`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {editingRoutineId === entry.id && editingRoutineDraft ? (
                          <div className="mt-3 grid gap-2 rounded-lg bg-[#fbfaf5] p-3">
                            <div className="grid grid-cols-[80px_1fr] gap-2">
                              <input
                                value={editingRoutineDraft.day}
                                onChange={(event) => updateEditingRoutineField('day', event.target.value)}
                                className="h-9 rounded-md border border-[#cfc6b2] bg-white px-2 text-xs font-black outline-none focus:border-[#2f7d46]"
                                aria-label="루틴 DAY"
                              />
                              <input
                                value={editingRoutineDraft.title}
                                onChange={(event) => updateEditingRoutineField('title', event.target.value)}
                                className="h-9 rounded-md border border-[#cfc6b2] bg-white px-2 text-sm font-black outline-none focus:border-[#2f7d46]"
                                aria-label="루틴명"
                              />
                            </div>
                            <div className="grid gap-2 overflow-x-auto">
                              {(editingRoutineDraft.items || []).map((item, index) => (
                                <div key={item.id || index} className="grid min-w-[320px] grid-cols-[1fr_52px_52px_64px] gap-1">
                                  <input
                                    value={item.name || ''}
                                    onChange={(event) => updateEditingRoutineItem(index, 'name', event.target.value)}
                                    className="h-8 min-w-0 rounded-md border border-[#e4ddce] bg-white px-2 text-xs font-bold outline-none focus:border-[#2f7d46]"
                                    aria-label="운동명"
                                  />
                                  <input
                                    value={item.reps || ''}
                                    onChange={(event) => updateEditingRoutineItem(index, 'reps', event.target.value)}
                                    className="h-8 rounded-md border border-[#e4ddce] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2f7d46]"
                                    aria-label="횟수"
                                  />
                                  <input
                                    value={item.sets || ''}
                                    onChange={(event) => updateEditingRoutineItem(index, 'sets', event.target.value)}
                                    className="h-8 rounded-md border border-[#e4ddce] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2f7d46]"
                                    aria-label="세트"
                                  />
                                  <input
                                    value={item.weight || ''}
                                    onChange={(event) => updateEditingRoutineItem(index, 'weight', event.target.value)}
                                    className="h-8 rounded-md border border-[#e4ddce] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2f7d46]"
                                    aria-label="무게"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={saveRoutineEntryEdit}
                                className="h-9 rounded-lg bg-[#2f7d46] text-xs font-black text-white hover:bg-[#256339]"
                              >
                                수정 저장
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoutineId('')
                                  setEditingRoutineDraft(null)
                                }}
                                className="h-9 rounded-lg border border-[#cfc6b2] text-xs font-black text-[#756b5a] hover:bg-[#f8f6ee]"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 grid gap-1">
                            {(entry.items || []).map((item) => (
                              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-bold text-[#4d594f]">
                                <span className="min-w-0 truncate">{item.name}</span>
                                <span>{item.reps && item.sets ? `${item.reps}x${item.sets}` : ''}</span>
                                <span className="text-[#2f7d46]">{item.weight ? `${item.weight}kg` : ''}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {!selectedPlan && (
                <div className="rounded-lg border border-dashed border-[#cfc6b2] px-3 py-8 text-center text-sm font-bold text-[#756b5a]">
                  {plan ? '선택한 날짜에는 배치된 운동 계획이 없습니다.' : '시작 날짜를 고르고 생성하면 DAY 1부터 자동으로 연결됩니다.'}
                </div>
              )}

              {selectedPlan?.rest && (
                <div className="rounded-lg bg-[#f1eadc] px-4 py-6 text-center">
                  <p className="text-xl font-black">{selectedPlan.title || '휴식'}</p>
                  <p className="mt-1 text-sm font-bold text-[#756b5a]">회복도 루틴의 일부로 기록합니다.</p>
                </div>
              )}

              {selectedPlan?.test && (
                <div className="rounded-lg bg-[#fff3df] px-4 py-6 text-center">
                  <p className="text-xl font-black">풀업 MAX 재측정</p>
                  <p className="mt-1 text-sm font-bold text-[#756b5a]">2일 완전 휴식 후 최대 반복 수를 측정합니다.</p>
                </div>
              )}

              {selectedPlan?.sets && (
                <div>
                  <div className="mb-2 grid grid-cols-[52px_1fr_1fr] gap-2 text-xs font-black text-[#687064]">
                    <span>세트</span>
                    <span>목표</span>
                    <span>실제</span>
                  </div>
                  <div className="grid gap-2">
                    {selectedPlan.sets.map((target, index) => (
                      <div key={`${selectedDate}-${index}`} className="grid grid-cols-[52px_1fr_1fr] items-center gap-2">
                        <span className="text-sm font-black">{index + 1}세트</span>
                        <span className="rounded-lg bg-[#f1eadc] px-3 py-2 text-center text-sm font-black">{target}회</span>
                        <input
                          type="number"
                          min="0"
                          value={actualDraft[index] ?? ''}
                          onChange={(event) => {
                            const next = [...actualDraft]
                            next[index] = event.target.value
                            setActualDraft(next)
                          }}
                          className="h-10 rounded-lg border border-[#cfc6b2] px-3 text-center text-sm font-black outline-none focus:border-[#2f7d46]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlan && (
                <>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-black text-[#687064]">운동 메모</span>
                    <textarea
                      value={memoDraft}
                      onChange={(event) => setMemoDraft(event.target.value)}
                      rows={3}
                      placeholder="컨디션, 실패한 세트, 통증, 휴식시간 등을 적어두세요."
                      className="resize-none rounded-lg border border-[#cfc6b2] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2f7d46]"
                    />
                  </label>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={saveRecord}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2f7d46] text-sm font-black text-white hover:bg-[#256339]"
                    >
                      <Save size={17} />
                      수행 기록 저장
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={deleteSelectedFighterRecord}
                        disabled={!hasFighterRecord(selectedRecord)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cfc6b2] text-xs font-black text-[#756b5a] hover:bg-[#f8f6ee] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={15} />
                        선택일자 삭제
                      </button>
                      <button
                        type="button"
                        onClick={deleteAllFighterRecords}
                        disabled={!Object.values(records).some((record) => hasFighterRecord(record))}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7b7ac] text-xs font-black text-[#9d3f2a] hover:bg-[#fff3ef] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        일괄삭제
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#d8d0bd] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Info size={17} className="text-[#2f7d46]" />
              <h2 className="text-sm font-black">운동 정보</h2>
            </div>
            <ul className="grid gap-2 text-sm font-semibold text-[#4d594f]">
              {FIGHTER_PULLUP_TEMPLATE.principles.map((principle) => (
                <li key={principle} className="rounded-lg bg-[#f8f6ee] px-3 py-2">
                  {principle}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-[#d8d0bd] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarCheck size={17} className="text-[#2f7d46]" />
              <h2 className="text-sm font-black">전체 루틴표</h2>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-[#e4ddce]">
              {FIGHTER_PULLUP_TEMPLATE.days.map((day) => (
                <button
                  type="button"
                  key={day.day}
                  onClick={() => plan?.startDate && setSelectedDate(addDateKeyDays(plan.startDate, day.day - 1))}
                  disabled={!plan?.startDate}
                  className="grid w-full grid-cols-[56px_1fr_64px] border-b border-[#eee7d8] px-3 py-2 text-left text-xs font-bold last:border-b-0 hover:bg-[#f8f6ee] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>DAY {day.day}</span>
                  <span>{day.test ? 'MAX 재측정' : day.rest ? day.title || '휴식' : day.sets.join('-')}</span>
                  <span className="text-right">{day.sets ? `${getDayTotal(day)}회` : ''}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
