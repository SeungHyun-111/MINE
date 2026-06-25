import { useCallback, useEffect, useMemo, useState } from 'react'
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

export const MEMO_STAGES = [
  { id: 'pending', label: '미완료', tone: 'bg-[#fff2df] text-[#7a4a10] border-[#ead2a5]' },
  { id: 'progress', label: '진행중', tone: 'bg-[#e7f0ff] text-[#244f8f] border-[#bfd2ef]' },
  { id: 'done', label: '완료', tone: 'bg-[#e9f4ee] text-[#2d6544] border-[#c7dfd1]' },
]

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

function stageLabel(stageId) {
  return MEMO_STAGES.find((stage) => stage.id === stageId)?.label || stageId
}

function logEntry(type, message) {
  return {
    type,
    message,
    createdAt: Date.now(),
  }
}

export function useMemos() {
  const { user } = useAuth()
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const memosPath = useMemo(() => (
    user ? `users/${user.uid}/pages/memo/items` : null
  ), [user])

  useEffect(() => {
    if (!memosPath) {
      setMemos([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, memosPath),
      (snapshot) => {
        const items = objectToList(snapshot.val()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        setMemos(items)
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    )
  }, [memosPath])

  const addMemo = useCallback(async ({ title, content, stage = 'pending' }) => {
    if (!memosPath || !content.trim()) return null

    const memoRef = push(ref(db, memosPath))
    const now = Date.now()
    const payload = {
      title: title?.trim() || content.trim().slice(0, 24),
      content: content.trim(),
      stage,
      logs: [logEntry('create', '메모 생성')],
      createdAt: now,
      updatedAt: now,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    }

    await set(memoRef, payload)
    return { id: memoRef.key, ...payload }
  }, [memosPath])

  const updateMemo = useCallback(async (memo, payload) => {
    if (!memosPath || !memo?.id) return

    const updates = {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    }
    const logs = Array.isArray(memo.logs) ? memo.logs : []

    if (payload.title != null && payload.title !== memo.title) {
      updates.logs = [...logs, logEntry('title', '제목 수정')]
    }

    if (payload.content != null && payload.content !== memo.content) {
      updates.logs = [...(updates.logs || logs), logEntry('content', '내용 수정')]
    }

    if (payload.stage && payload.stage !== memo.stage) {
      updates.logs = [...(updates.logs || logs), logEntry('stage', `${stageLabel(memo.stage)} → ${stageLabel(payload.stage)}`)]
    }

    await update(ref(db, `${memosPath}/${memo.id}`), updates)
  }, [memosPath])

  const removeMemo = useCallback(async (memoId) => {
    if (!memosPath) return
    await remove(ref(db, `${memosPath}/${memoId}`))
  }, [memosPath])

  return {
    memos,
    loading,
    error,
    addMemo,
    updateMemo,
    removeMemo,
  }
}
