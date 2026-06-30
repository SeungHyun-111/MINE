import { useCallback, useEffect, useMemo, useState } from 'react'
import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function objectToList(val) {
  return Object.entries(val || {}).map(([id, item]) => ({ id, ...item }))
}

export function useSasek() {
  const { user } = useAuth()
  const [notes, setNotes] = useState({})
  const [birthdate, setBirthdateState] = useState(null)
  const [loading, setLoading] = useState(true)

  const notesPath = useMemo(() => user ? `users/${user.uid}/pages/sasek/notes` : null, [user])
  const birthdatePath = useMemo(() => user ? `users/${user.uid}/settings/birthdate` : null, [user])

  useEffect(() => {
    if (!notesPath) { setLoading(false); return }
    setLoading(true)
    return onValue(ref(db, notesPath), (snap) => {
      const raw = snap.val() || {}
      const parsed = {}
      Object.entries(raw).forEach(([itemId, entries]) => {
        parsed[itemId] = objectToList(entries).sort((a, b) => b.createdAt - a.createdAt)
      })
      setNotes(parsed)
      setLoading(false)
    })
  }, [notesPath])

  useEffect(() => {
    if (!birthdatePath) return
    return onValue(ref(db, birthdatePath), (snap) => {
      setBirthdateState(snap.val() || null)
    })
  }, [birthdatePath])

  const addNote = useCallback(async (itemId, text) => {
    if (!notesPath || !text.trim()) return
    const entryRef = push(ref(db, `${notesPath}/${itemId}`))
    await set(entryRef, { text: text.trim(), createdAt: Date.now() })
  }, [notesPath])

  const editNote = useCallback(async (itemId, noteId, newText) => {
    if (!notesPath || !newText.trim()) return
    await update(ref(db, `${notesPath}/${itemId}/${noteId}`), { text: newText.trim() })
  }, [notesPath])

  const deleteNote = useCallback(async (itemId, noteId) => {
    if (!notesPath) return
    await remove(ref(db, `${notesPath}/${itemId}/${noteId}`))
  }, [notesPath])

  const saveBirthdate = useCallback(async (dateStr) => {
    if (!birthdatePath) return
    await set(ref(db, birthdatePath), dateStr)
  }, [birthdatePath])

  const userAge = useMemo(() => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const notYetBirthday =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    if (notYetBirthday) age -= 1
    return age
  }, [birthdate])

  return { notes, loading, userAge, birthdate, addNote, editNote, deleteNote, saveBirthdate }
}
