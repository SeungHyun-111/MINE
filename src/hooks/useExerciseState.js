import { useCallback, useEffect, useMemo, useState } from 'react'
import { get, onValue, ref, serverTimestamp, set, update } from 'firebase/database'
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

function updateGuestState(updater) {
  const current = readGuestState()
  const nextState = updater(current)
  writeGuestState(nextState)
  return nextState
}

export function useExerciseState(defaultRoutines) {
  const { user } = useAuth()
  const [state, setState] = useState(EMPTY_EXERCISE_STATE)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState(null)

  const exercisePath = useMemo(() => (
    user ? `users/${user.uid}/pages/exercise` : null
  ), [user])

  useEffect(() => {
    if (!exercisePath) {
      setState(readGuestState())
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
  }, [exercisePath])

  const seedDefaults = useCallback(async () => {
    const itemsByDay = Object.fromEntries(
      Object.entries(defaultRoutines).map(([id, routine]) => [id, routine.items]),
    )

    if (!exercisePath) {
      const current = readGuestState()
      const nextState = {
        favorites: current.favorites,
        routinesMeta: {
          ...defaultRoutines,
          ...(current.routinesMeta || {}),
        },
        routineItemsByDay: {
          ...itemsByDay,
          ...(current.routineItemsByDay || {}),
        },
      }
      setState(nextState)
      writeGuestState(nextState)
      return
    }

    const snapshot = await get(ref(db, exercisePath))
    const current = snapshot.val() || {}

    await update(ref(db), {
      [`${exercisePath}/routines/meta`]: {
        ...defaultRoutines,
        ...(current.routines?.meta || {}),
      },
      [`${exercisePath}/routines/itemsByDay`]: {
        ...itemsByDay,
        ...(current.routines?.itemsByDay || {}),
      },
      [`${exercisePath}/updatedAtServer`]: serverTimestamp(),
    })
  }, [defaultRoutines, exercisePath])

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

  const saveRoutine = useCallback(async (routineId, routine, items = []) => {
    if (!exercisePath) {
      setState(updateGuestState((current) => ({
        ...current,
        routinesMeta: {
          ...(current.routinesMeta || {}),
          [routineId]: routine,
        },
        routineItemsByDay: {
          ...(current.routineItemsByDay || {}),
          [routineId]: items,
        },
      })))
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
      setState(updateGuestState((current) => {
        const routinesMeta = { ...(current.routinesMeta || {}) }
        const routineItemsByDay = { ...(current.routineItemsByDay || {}) }
        delete routinesMeta[routineId]
        delete routineItemsByDay[routineId]
        return { ...current, routinesMeta, routineItemsByDay }
      }))
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
      localStorage.removeItem(GUEST_STORAGE_KEY)
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
    seedDefaults,
    saveFavorites,
    saveRoutinesMeta,
    saveRoutineItemsByDay,
    saveRoutine,
    removeRoutine,
    removeExerciseState,
  }
}
