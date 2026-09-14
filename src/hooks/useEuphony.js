import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  onValue,
  get,
  push,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function normalizeHighlight(id, item = {}) {
  if (item.meta) {
    return {
      id,
      ...item.meta,
      text: typeof item.text === 'string' ? item.text : item.text?.value || '',
    }
  }

  return { id, ...item }
}

function highlightNodeFromPayload(payload) {
  const { text, ...meta } = payload
  return {
    meta,
    text: text || '',
  }
}

function bookKey(value) {
  const normalized = (value || '').trim()
  return normalized ? encodeURIComponent(normalized) : ''
}

function addBookIndexUpdate(updates, uid, highlightId, bookTitle, value) {
  const key = bookKey(bookTitle)
  if (!key) return
  updates[`users/${uid}/pages/euphony/highlightsByBook/${key}/${highlightId}`] = value
}

function splitHighlightUpdates(basePath, payload) {
  const updates = {}
  const meta = { ...payload }

  if (Object.prototype.hasOwnProperty.call(meta, 'text')) {
    updates[`${basePath}/text`] = meta.text || ''
    delete meta.text
  }

  Object.entries(meta).forEach(([key, value]) => {
    updates[`${basePath}/meta/${key}`] = value
  })

  return updates
}

async function loadDefaultHighlights() {
  const module = await import('@/data/euphonyDefaults')
  return module.DEFAULT_HIGHLIGHTS
}

export function useEuphony({ seedDefaults = true } = {}) {
  const { user } = useAuth()
  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const seeded = useRef(false)

  const euphonyPath = useMemo(() => (
    user ? `users/${user.uid}/pages/euphony` : null
  ), [user])
  const highlightsPath = useMemo(() => (
    euphonyPath ? `${euphonyPath}/highlights` : null
  ), [euphonyPath])

  useEffect(() => {
    if (!highlightsPath) {
      setHighlights([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, highlightsPath),
      async (snapshot) => {
        const rawValue = snapshot.val() || {}
        const items = Object.entries(rawValue)
          .map(([id, item]) => normalizeHighlight(id, item))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setHighlights(items)
        setLoading(false)

        if (!seedDefaults) return

        if (items.length === 0 && !seeded.current) {
          const metadata = (await get(ref(db, `${euphonyPath}/metadata`))).val() || {}
          if (metadata.defaultHighlightsSeededAt) return

          seeded.current = true
          const defaultHighlights = await loadDefaultHighlights()
          const updates = {}
          defaultHighlights.forEach((highlight, index) => {
            updates[`${highlightsPath}/${highlight.id}`] = highlightNodeFromPayload({
              text: highlight.text,
              highlightedAt: highlight.highlightedAt,
              bookTitle: highlight.bookTitle,
              author: highlight.author || '',
              order: index + 1,
              createdAt: Date.now() - index,
              updatedAt: Date.now() - index,
              createdAtServer: serverTimestamp(),
              updatedAtServer: serverTimestamp(),
            })
            addBookIndexUpdate(updates, user.uid, highlight.id, highlight.bookTitle, true)
          })
          updates[`${euphonyPath}/metadata/defaultHighlightsSeededAt`] = serverTimestamp()
          await update(ref(db), updates)
        } else {
          const backfill = {}

          Object.entries(rawValue).forEach(([id, item]) => {
            const normalized = normalizeHighlight(id, item)
            if (!item?.meta) {
              backfill[`${highlightsPath}/${id}`] = highlightNodeFromPayload(normalized)
            }
            addBookIndexUpdate(backfill, user.uid, id, normalized.bookTitle, true)
          })
          if (Object.keys(backfill).length > 0) {
            await update(ref(db), backfill)
          }
        }
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    )
  }, [euphonyPath, highlightsPath, seedDefaults, user])

  const updateHighlight = useCallback(async (highlightId, payload) => {
    if (!highlightsPath || !highlightId) return
    const previous = highlights.find((highlight) => highlight.id === highlightId)
    const updates = splitHighlightUpdates(`${highlightsPath}/${highlightId}`, {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })

    if (Object.prototype.hasOwnProperty.call(payload, 'bookTitle')) {
      addBookIndexUpdate(updates, user.uid, highlightId, previous?.bookTitle, null)
      addBookIndexUpdate(updates, user.uid, highlightId, payload.bookTitle, true)
    }

    await update(ref(db), updates)
  }, [highlights, highlightsPath, user])

  const removeHighlight = useCallback(async (highlightId) => {
    if (!highlightsPath || !highlightId) return
    const previous = highlights.find((highlight) => highlight.id === highlightId)
    const updates = {
      [`${highlightsPath}/${highlightId}`]: null,
    }
    addBookIndexUpdate(updates, user.uid, highlightId, previous?.bookTitle, null)
    await update(ref(db), updates)
  }, [highlights, highlightsPath, user])

  const addHighlight = useCallback(async () => {
    if (!highlightsPath) return null

    const highlightRef = push(ref(db, highlightsPath))
    const now = Date.now()
    const payload = {
      text: '새 하이라이트 문장을 입력하세요.',
      highlightedAt: new Date(now).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bookTitle: '책 제목',
      author: '저자',
      order: 0,
      createdAt: now,
      updatedAt: now,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    }

    await set(highlightRef, highlightNodeFromPayload(payload))
    const key = bookKey(payload.bookTitle)
    if (key) {
      await update(ref(db), {
        [`users/${user.uid}/pages/euphony/highlightsByBook/${key}/${highlightRef.key}`]: true,
      })
    }
    return { id: highlightRef.key, ...payload }
  }, [highlightsPath, user])

  return {
    highlights,
    loading,
    error,
    addHighlight,
    updateHighlight,
    removeHighlight,
  }
}
