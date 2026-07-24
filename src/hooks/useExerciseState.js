import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

const EMPTY_EXERCISE_STATE = {
  favorites: [],
  routinesMeta: null,
  routineItemsByDay: null,
}

export function useExerciseState(defaultRoutines) {
  const { user } = useAuth()
  const [state, setState] = useState(EMPTY_EXERCISE_STATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const exercisePath = useMemo(() => (
    user ? `users/${user.uid}/pages/exercise` : null
  ), [user])

  useEffect(() => {
    if (!exercisePath) {
      setState(EMPTY_EXERCISE_STATE)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, exercisePath),
      (snapshot) => {
        const value = snapshot.val() || {}
        setState({
          favorites: Array.isArray(value.favorites) ? value.favorites : [],
          routinesMeta: value.routines?.meta || null,
          routineItemsByDay: value.routines?.itemsByDay || null,
        })
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      },
    )
  }, [exercisePath])

  const seedDefaults = useCallback(async () => {
    if (!exercisePath) return

    const itemsByDay = Object.fromEntries(
      Object.entries(defaultRoutines).map(([id, routine]) => [id, routine.items]),
    )

    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: defaultRoutines,
      [`${exercisePath}/routines/itemsByDay`]: itemsByDay,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [defaultRoutines, exercisePath])

  const saveFavorites = useCallback(async (favorites) => {
    if (!exercisePath) return
    await update(ref(db), {
      [`${exercisePath}/favorites`]: favorites,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutinesMeta = useCallback(async (routinesMeta) => {
    if (!exercisePath) return
    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: routinesMeta,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutineItemsByDay = useCallback(async (routineItemsByDay) => {
    if (!exercisePath) return
    await update(ref(db), {
      [`${exercisePath}/routines/itemsByDay`]: routineItemsByDay,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const removeExerciseState = useCallback(async () => {
    if (!exercisePath) return
    await set(ref(db, exercisePath), null)
  }, [exercisePath])

  return {
    ...state,
    loading,
    error,
    connected: Boolean(exercisePath),
    seedDefaults,
    saveFavorites,
    saveRoutinesMeta,
    saveRoutineItemsByDay,
    removeExerciseState,
  }
}

