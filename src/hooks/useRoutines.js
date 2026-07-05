import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, push, ref, remove, serverTimestamp, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [weeklyRoutines, setWeeklyRoutines] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const routinesPath = useMemo(() => (
    user ? `users/${user.uid}/pages/routine/items` : null
  ), [user])
  const weeklyRoutinesPath = useMemo(() => (
    user ? `users/${user.uid}/pages/routine/weekly` : null
  ), [user])

  useEffect(() => {
    if (!routinesPath) {
      setRoutines([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, routinesPath),
      (snapshot) => {
        const items = objectToList(snapshot.val()).sort((a, b) => {
          const aOrder = Number.isFinite(a.order) ? a.order : null
          const bOrder = Number.isFinite(b.order) ? b.order : null
          if (aOrder != null || bOrder != null) {
            return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER)
          }
          return (a.createdAt || 0) - (b.createdAt || 0)
        })
        setRoutines(items)
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    )
  }, [routinesPath])

  useEffect(() => {
    if (!weeklyRoutinesPath) {
      setWeeklyRoutines({})
      return undefined
    }

    return onValue(
      ref(db, weeklyRoutinesPath),
      (snapshot) => {
        setWeeklyRoutines(snapshot.val() || {})
      },
      (e) => {
        console.error(e)
        setError(e.message)
      }
    )
  }, [weeklyRoutinesPath])

  const addRoutine = useCallback(async (text, type) => {
    if (!routinesPath || !text.trim()) return null
    const routineRef = push(ref(db, routinesPath))
    await set(routineRef, {
      text: text.trim(),
      type,
      createdAt: Date.now(),
      order: Date.now(),
      createdAtServer: serverTimestamp(),
    })
    return routineRef.key
  }, [routinesPath])

  const removeRoutine = useCallback(async (id) => {
    if (!routinesPath) return
    await remove(ref(db, `${routinesPath}/${id}`))
  }, [routinesPath])

  const saveWeeklyRoutines = useCallback(async (nextWeeklyRoutines) => {
    if (!weeklyRoutinesPath) return
    await set(ref(db, weeklyRoutinesPath), nextWeeklyRoutines)
  }, [weeklyRoutinesPath])

  const addWeeklyRoutine = useCallback(async (day, routine) => {
    const next = {
      ...weeklyRoutines,
      [day]: [...(weeklyRoutines[day] || []), routine],
    }
    await saveWeeklyRoutines(next)
  }, [saveWeeklyRoutines, weeklyRoutines])

  const updateWeeklyRoutine = useCallback(async (day, index, routine) => {
    const dayRoutines = [...(weeklyRoutines[day] || [])]
    dayRoutines[index] = routine
    await saveWeeklyRoutines({ ...weeklyRoutines, [day]: dayRoutines })
  }, [saveWeeklyRoutines, weeklyRoutines])

  const removeWeeklyRoutine = useCallback(async (day, index) => {
    const dayRoutines = (weeklyRoutines[day] || []).filter((_, itemIndex) => itemIndex !== index)
    await saveWeeklyRoutines({ ...weeklyRoutines, [day]: dayRoutines })
  }, [saveWeeklyRoutines, weeklyRoutines])

  const reorderRoutines = useCallback(async (orderedRoutines) => {
    if (!routinesPath) return

    const updates = {}
    orderedRoutines.forEach((routine, index) => {
      updates[`${routinesPath}/${routine.id}/order`] = index
    })

    await update(ref(db), updates)
  }, [routinesPath])

  const reorderWeeklyRoutines = useCallback(async (day, orderedRoutines) => {
    await saveWeeklyRoutines({ ...weeklyRoutines, [day]: orderedRoutines })
  }, [saveWeeklyRoutines, weeklyRoutines])

  return {
    routines,
    weeklyRoutines,
    loading,
    error,
    addRoutine,
    removeRoutine,
    reorderRoutines,
    addWeeklyRoutine,
    updateWeeklyRoutine,
    removeWeeklyRoutine,
    reorderWeeklyRoutines,
  }
}
