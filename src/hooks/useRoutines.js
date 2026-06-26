import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, push, ref, remove, serverTimestamp, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const routinesPath = useMemo(() => (
    user ? `users/${user.uid}/pages/routine/items` : null
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
        const items = objectToList(snapshot.val()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
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

  const addRoutine = useCallback(async (text, type) => {
    if (!routinesPath || !text.trim()) return null
    const routineRef = push(ref(db, routinesPath))
    await set(routineRef, {
      text: text.trim(),
      type,
      createdAt: Date.now(),
      createdAtServer: serverTimestamp(),
    })
    return routineRef.key
  }, [routinesPath])

  const removeRoutine = useCallback(async (id) => {
    if (!routinesPath) return
    await remove(ref(db, `${routinesPath}/${id}`))
  }, [routinesPath])

  return { routines, loading, error, addRoutine, removeRoutine }
}
