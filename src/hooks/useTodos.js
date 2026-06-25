import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

const DEFAULT_SECTIONS = [
  { id: 'todo', title: '할 일', order: 1 },
  { id: 'doing', title: '진행 중', order: 2 },
  { id: 'done', title: '완료', order: 3 },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

export function useTodos() {
  const { user } = useAuth()
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const seededSections = useRef(false)

  const paths = useMemo(() => {
    if (!user) return null
    const pagePath = `users/${user.uid}/pages/todo`
    return {
      sections: `${pagePath}/sections`,
      todos: `${pagePath}/items`,
    }
  }, [user])

  useEffect(() => {
    if (!paths) {
      setSections(DEFAULT_SECTIONS)
      setTodos([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    const unsubscribeSections = onValue(
      ref(db, paths.sections),
      async (snapshot) => {
        const items = objectToList(snapshot.val()).sort((a, b) => (a.order || 0) - (b.order || 0))
        setSections(items.length > 0 ? items : DEFAULT_SECTIONS)

        if (items.length === 0 && !seededSections.current) {
          seededSections.current = true
          const updates = {}
          DEFAULT_SECTIONS.forEach((section) => {
            updates[`${paths.sections}/${section.id}`] = section
          })
          await update(ref(db), updates)
        }
      },
      (e) => {
        console.error(e)
        setError(e.message)
      }
    )

    const unsubscribeTodos = onValue(
      ref(db, paths.todos),
      (snapshot) => {
        const items = objectToList(snapshot.val()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setTodos(items)
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeSections()
      unsubscribeTodos()
    }
  }, [paths])

  const addTodo = useCallback(async (payload) => {
    if (!paths) return

    const startDate = payload.startDate || todayString()
    const endDate = payload.endDate || startDate
    const todoRef = push(ref(db, paths.todos))

    await set(todoRef, {
      title: payload.title,
      memo: payload.memo || '',
      sectionId: payload.sectionId || 'todo',
      priority: payload.priority || 'medium',
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }, [paths])

  const updateTodo = useCallback(async (todoId, payload) => {
    if (!paths) return

    await update(ref(db, `${paths.todos}/${todoId}`), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  }, [paths])

  const advanceTodo = useCallback(async (todo) => {
    const sectionId = todo.sectionId || 'todo'

    if (sectionId === 'todo') {
      await updateTodo(todo.id, {
        completed: false,
        sectionId: 'doing',
      })
      return
    }

    if (sectionId === 'doing') {
      await updateTodo(todo.id, {
        completed: true,
        sectionId: 'done',
      })
      return
    }

    await updateTodo(todo.id, {
      calendarReady: true,
      calendarReadyAt: serverTimestamp(),
    })
  }, [updateTodo])

  const removeTodo = useCallback(async (todoId) => {
    if (!paths) return
    await remove(ref(db, `${paths.todos}/${todoId}`))
  }, [paths])

  return {
    sections,
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    advanceTodo,
    removeTodo,
    todayString,
    addDays,
  }
}
