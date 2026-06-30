import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onValue, ref, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

// Stat decay: % per hour → per ms
const DECAY = {
  happiness:   2   / 3_600_000,
  hunger:      3   / 3_600_000,
  energy:      1.5 / 3_600_000,
  cleanliness: 0.5 / 3_600_000,
}

// Actions: stat deltas + cooldown (ms)
export const ACTIONS = {
  feed:   { label: '밥주기',  emoji: '🍖', hunger: +28, happiness: +5,  energy: 0,   cleanliness: 0,   affection: +1, cooldown: 2 * 3_600_000 },
  play:   { label: '놀기',    emoji: '🎮', hunger: -5,  happiness: +22, energy: -10, cleanliness: -5,  affection: +4, cooldown: 3_600_000 },
  sleep:  { label: '재우기',  emoji: '💤', hunger: 0,   happiness: +5,  energy: +35, cleanliness: 0,   affection: +2, cooldown: 6 * 3_600_000 },
  clean:  { label: '씻기',    emoji: '🛁', hunger: 0,   happiness: +8,  energy: 0,   cleanliness: +35, affection: +2, cooldown: 4 * 3_600_000 },
  praise: { label: '칭찬',    emoji: '💝', hunger: 0,   happiness: +12, energy: 0,   cleanliness: 0,   affection: +6, cooldown: 30 * 60_000 },
}

export const AFFECTION_LEVELS = [
  { min: 0,   label: '처음 만남',   color: '#99ccff' },
  { min: 20,  label: '아는 사이',   color: '#5588bb' },
  { min: 40,  label: '친구',        color: '#4477cc' },
  { min: 60,  label: '친한 친구',   color: '#0055ff' },
  { min: 80,  label: '절친',        color: '#0044cc' },
  { min: 95,  label: '영원한 친구', color: '#002fa3' },
]

export function getAffectionLevel(affection) {
  return [...AFFECTION_LEVELS].reverse().find((l) => affection >= l.min) || AFFECTION_LEVELS[0]
}

export function deriveEmotion(stats) {
  const base = (stats.happiness + stats.hunger + stats.energy + stats.cleanliness) / 4
  if (base > 85) return { label: '신남',  emoji: '🌟', color: '#ffc400', bg: '#fff8df' }
  if (base > 65) return { label: '행복',  emoji: '😊', color: '#22c55e', bg: '#f0fdf4' }
  if (base > 45) return { label: '보통',  emoji: '😐', color: '#5588bb', bg: '#f0f5ff' }
  if (base > 25) return { label: '슬픔',  emoji: '😢', color: '#7799cc', bg: '#eef3ff' }
  return               { label: '위기',  emoji: '😰', color: '#e85252', bg: '#fff0f0' }
}

const DEFAULT_STATS = { happiness: 80, hunger: 80, energy: 80, cleanliness: 90, affection: 0 }

function applyDecay(stats, elapsedMs) {
  const s = { ...stats }
  for (const [key, rate] of Object.entries(DECAY)) {
    s[key] = Math.max(0, (s[key] ?? 100) - rate * elapsedMs)
  }
  return s
}

function clamp(v) { return Math.min(100, Math.max(0, v)) }

export function usePet() {
  const { user } = useAuth()
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const path = useMemo(() => user ? `users/${user.uid}/game/pet` : null, [user])

  useEffect(() => {
    if (!path) { setLoading(false); return }
    return onValue(ref(db, path), (snap) => {
      setRaw(snap.val())
      setLoading(false)
    })
  }, [path])

  // Re-derive stats every 10s for live decay animation
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const pet = useMemo(() => {
    if (!raw) return null
    const elapsed = Date.now() - (raw.lastUpdated || Date.now())
    return { ...raw, stats: applyDecay(raw.stats ?? DEFAULT_STATS, elapsed) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, tick])

  const emotion   = useMemo(() => pet ? deriveEmotion(pet.stats) : null, [pet])
  const affLevel  = useMemo(() => getAffectionLevel(pet?.stats?.affection ?? 0), [pet])

  const daysTogether = useMemo(() => {
    if (!pet?.createdAt) return 0
    return Math.floor((Date.now() - pet.createdAt) / 86_400_000)
  }, [pet])

  const cooldowns = useMemo(() => {
    if (!raw?.lastActions) return {}
    const now = Date.now()
    return Object.fromEntries(
      Object.entries(ACTIONS).map(([key, act]) => {
        const last = raw.lastActions[key] || 0
        return [key, Math.max(0, act.cooldown - (now - last))]
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, tick])

  const initPet = useCallback(async (name) => {
    if (!path) return
    await update(ref(db, path), {
      name,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      stats: DEFAULT_STATS,
      lastActions: {},
    })
  }, [path])

  const resetCooldowns = useCallback(async () => {
    if (!path) return
    await update(ref(db, path), { lastActions: {} })
  }, [path])

  const doAction = useCallback(async (actionKey) => {
    if (!path || !raw) return false
    const action = ACTIONS[actionKey]
    if (!action) return false

    const last = raw.lastActions?.[actionKey] || 0
    if (Date.now() - last < action.cooldown) return false

    const elapsed = Date.now() - (raw.lastUpdated || Date.now())
    const base = applyDecay(raw.stats ?? DEFAULT_STATS, elapsed)

    const newStats = { ...base }
    for (const [key, delta] of Object.entries(action)) {
      if (key === 'label' || key === 'emoji' || key === 'cooldown') continue
      newStats[key] = clamp((newStats[key] ?? 0) + delta)
    }

    await update(ref(db, path), {
      stats: newStats,
      lastUpdated: Date.now(),
      [`lastActions/${actionKey}`]: Date.now(),
    })
    return true
  }, [path, raw])

  return { pet, loading, emotion, affLevel, daysTogether, cooldowns, initPet, doAction, resetCooldowns }
}
