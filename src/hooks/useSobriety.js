import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, ref, remove, serverTimestamp, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function objectToCheckins(value) {
  return Object.entries(value || {}).reduce((acc, [date, item]) => {
    acc[date] = { date, ...item }
    return acc
  }, {})
}

export function useSobriety() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkinsPath = useMemo(() => (
    user ? `users/${user.uid}/pages/sobriety/checkins` : null
  ), [user])

  useEffect(() => {
    if (!checkinsPath) {
      setCheckins({})
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, checkinsPath),
      (snapshot) => {
        setCheckins(objectToCheckins(snapshot.val()))
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      },
    )
  }, [checkinsPath])

  const saveCheckin = useCallback(async (date, note = '') => {
    if (!checkinsPath || !date) return

    const previous = checkins[date] || {}
    const now = Date.now()
    await set(ref(db, `${checkinsPath}/${date}`), {
      checked: true,
      note: note.trim(),
      createdAt: previous.createdAt || now,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    })
  }, [checkins, checkinsPath])

  const removeCheckin = useCallback(async (date) => {
    if (!checkinsPath || !date) return
    await remove(ref(db, `${checkinsPath}/${date}`))
  }, [checkinsPath])

  return {
    checkins,
    loading,
    error,
    saveCheckin,
    removeCheckin,
  }
}
