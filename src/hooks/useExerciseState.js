import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

const EMPTY_EXERCISE_STATE = {
  favorites: [],
  routinesMeta: null,
  routineItemsByDay: null,
}

const GUEST_STORAGE_KEY = 'mine.exerciseState.guest'

function readGuestState() {
  try {
    const value = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) ?? 'null')
    return value && typeof value === 'object' ? value : EMPTY_EXERCISE_STATE
  } catch {
    return EMPTY_EXERCISE_STATE
  }
}

function writeGuestState(nextState) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextState))
  } catch {
    // Exercise changes can still work for the current session if browser storage is unavailable.
  }
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
      setState(readGuestState())
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
    const itemsByDay = Object.fromEntries(
      Object.entries(defaultRoutines).map(([id, routine]) => [id, routine.items]),
    )

    if (!exercisePath) {
      const nextState = {
        favorites: state.favorites,
        routinesMeta: defaultRoutines,
        routineItemsByDay: itemsByDay,
      }
      setState(nextState)
      writeGuestState(nextState)
      return
    }

    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: defaultRoutines,
      [`${exercisePath}/routines/itemsByDay`]: itemsByDay,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [defaultRoutines, exercisePath, state.favorites])

  const saveFavorites = useCallback(async (favorites) => {
    if (!exercisePath) {
      setState((current) => {
        const nextState = { ...current, favorites }
        writeGuestState(nextState)
        return nextState
      })
      return
    }
    await update(ref(db), {
      [`${exercisePath}/favorites`]: favorites,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutinesMeta = useCallback(async (routinesMeta) => {
    if (!exercisePath) {
      setState((current) => {
        const nextState = { ...current, routinesMeta }
        writeGuestState(nextState)
        return nextState
      })
      return
    }
    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: routinesMeta,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const saveRoutineItemsByDay = useCallback(async (routineItemsByDay) => {
    if (!exercisePath) {
      setState((current) => {
        const nextState = { ...current, routineItemsByDay }
        writeGuestState(nextState)
        return nextState
      })
      return
    }
    await update(ref(db), {
      [`${exercisePath}/routines/itemsByDay`]: routineItemsByDay,
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [exercisePath])

  const removeExerciseState = useCallback(async () => {
    if (!exercisePath) {
      localStorage.removeItem(GUEST_STORAGE_KEY)
      setState(EMPTY_EXERCISE_STATE)
      return
    }
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
