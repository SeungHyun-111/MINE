import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

const EMPTY_EXERCISE_STATE = {
  favorites: [],
  routinesMeta: null,
  routineItemsByDay: null,
}

export function useExerciseState() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState(EMPTY_EXERCISE_STATE)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState(null)

  const exercisePath = useMemo(() => (
    user ? `users/${user.uid}/pages/exercise` : null
  ), [user])

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      setInitialized(false)
      return undefined
    }

    if (!exercisePath) {
      setState(EMPTY_EXERCISE_STATE)
      setLoading(false)
      setInitialized(true)
      return undefined
    }

    setLoading(true)
    setInitialized(false)
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
        setInitialized(true)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
        setInitialized(true)
      },
    )
  }, [authLoading, exercisePath])

  const saveFavorites = useCallback(async (favorites) => {
    if (!exercisePath) {
      return
    }
    await update(ref(db), {
      [`${exercisePath}/favorites`]: favorites,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutinesMeta = useCallback(async (routinesMeta) => {
    if (!exercisePath) {
      return
    }
    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: routinesMeta,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutineItemsByDay = useCallback(async (routineItemsByDay) => {
    if (!exercisePath) {
      return
    }
    await update(ref(db), {
      [`${exercisePath}/routines/itemsByDay`]: routineItemsByDay,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutine = useCallback(async (routineId, routine, items = []) => {
    if (!exercisePath) {
      return
    }

    await update(ref(db), {
      [`${exercisePath}/routines/meta/${routineId}`]: routine,
      [`${exercisePath}/routines/itemsByDay/${routineId}`]: items,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const removeRoutine = useCallback(async (routineId) => {
    if (!exercisePath) {
      return
    }

    await update(ref(db), {
      [`${exercisePath}/routines/meta/${routineId}`]: null,
      [`${exercisePath}/routines/itemsByDay/${routineId}`]: null,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const removeExerciseState = useCallback(async () => {
    if (!exercisePath) {
      setState(EMPTY_EXERCISE_STATE)
      return
    }
    await set(ref(db, exercisePath), null)
  }, [exercisePath])

  return {
    ...state,
    loading,
    initialized,
    error,
    connected: Boolean(exercisePath),
    saveFavorites,
    saveRoutinesMeta,
    saveRoutineItemsByDay,
    saveRoutine,
    removeRoutine,
    removeExerciseState,
  }
}
