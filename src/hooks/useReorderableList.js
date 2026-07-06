import { useCallback, useEffect, useId, useRef, useState } from 'react'

const INTERACTIVE_SELECTOR = 'button, input, textarea, select, option, a, [role="button"]'
const LONG_PRESS_MS = 260
const MOUSE_DRAG_DISTANCE = 7

function getDropTargetFromPoint(listId, sourceId, y) {
  const elements = [...document.querySelectorAll(`[data-reorder-list-id="${CSS.escape(listId)}"]`)]
    .filter((element) => element.dataset.reorderId !== sourceId)
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.height > 0)
    .sort((a, b) => a.rect.top - b.rect.top)

  if (elements.length === 0) return { id: '', position: 'after' }

  const first = elements[0]
  if (y < first.rect.top + first.rect.height / 2) {
    return { id: first.element.dataset.reorderId || '', position: 'before' }
  }

  for (const item of elements) {
    if (y < item.rect.top + item.rect.height / 2) {
      return { id: item.element.dataset.reorderId || '', position: 'before' }
    }
  }

  const last = elements[elements.length - 1]
  return { id: last.element.dataset.reorderId || '', position: 'after' }
}

function shouldIgnorePointerDown(target) {
  return target?.closest?.(INTERACTIVE_SELECTOR)
}

export function moveItemById(items, sourceId, targetId, position = 'after') {
  if (!sourceId || !targetId || sourceId === targetId) return items

  const sourceIndex = items.findIndex((item) => item.id === sourceId)
  const targetIndex = items.findIndex((item) => item.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return items

  const next = [...items]
  const [moved] = next.splice(sourceIndex, 1)
  const adjustedTargetIndex = next.findIndex((item) => item.id === targetId)
  next.splice(position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1, 0, moved)
  return next
}

export function useReorderableList({ items, onReorder }) {
  const listId = useId()
  const [draggingId, setDraggingId] = useState('')
  const [dropTarget, setDropTarget] = useState({ id: '', position: 'after' })
  const dragRef = useRef(null)
  const dropTargetRef = useRef({ id: '', position: 'after' })
  const suppressClickRef = useRef(false)
  const timerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetDrag = useCallback(() => {
    clearTimer()
    dragRef.current = null
    dropTargetRef.current = { id: '', position: 'after' }
    setDraggingId('')
    setDropTarget({ id: '', position: 'after' })
  }, [clearTimer])

  useEffect(() => resetDrag, [resetDrag])

  const startDrag = useCallback((id) => {
    dragRef.current = { ...(dragRef.current || {}), active: true, id }
    setDraggingId(id)
  }, [])

  const getItemProps = useCallback((id) => ({
    'data-reorder-id': id,
    'data-reorder-list-id': listId,
    onPointerDown: (event) => {
      if (event.button != null && event.button !== 0) return
      if (shouldIgnorePointerDown(event.target)) return

      const pointerType = event.pointerType || 'mouse'
      dragRef.current = {
        active: false,
        id,
        pointerId: event.pointerId,
        pointerType,
        startX: event.clientX,
        startY: event.clientY,
      }

      event.currentTarget.setPointerCapture?.(event.pointerId)

      if (pointerType === 'touch' || pointerType === 'pen') {
        timerRef.current = window.setTimeout(() => startDrag(id), LONG_PRESS_MS)
      }
    },
    onPointerMove: (event) => {
      const drag = dragRef.current
      if (!drag || drag.id !== id) return

      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)

      if (!drag.active) {
        if (drag.pointerType === 'touch' || drag.pointerType === 'pen') {
          if (distance > MOUSE_DRAG_DISTANCE) {
            resetDrag()
          }
          return
        }

        if (distance < MOUSE_DRAG_DISTANCE) return
        startDrag(id)
      }

      event.preventDefault()

      const nextTarget = getDropTargetFromPoint(listId, drag.id, event.clientY)
      if (!nextTarget.id || nextTarget.id === drag.id) {
        dropTargetRef.current = { id: '', position: 'after' }
        setDropTarget({ id: '', position: 'after' })
        return
      }

      dropTargetRef.current = nextTarget
      setDropTarget(nextTarget)
    },
    onPointerUp: async () => {
      const drag = dragRef.current
      const target = dropTargetRef.current
      resetDrag()

      if (!drag || drag.id !== id || !drag.active || !target.id || target.id === drag.id) return

      const nextItems = moveItemById(items, drag.id, target.id, target.position)
      if (nextItems !== items) {
        suppressClickRef.current = true
        window.setTimeout(() => {
          suppressClickRef.current = false
        }, 0)
        await onReorder?.(nextItems)
      }
    },
    onPointerCancel: resetDrag,
    onClickCapture: (event) => {
      if (!suppressClickRef.current) return
      event.preventDefault()
      event.stopPropagation()
    },
  }), [items, listId, onReorder, resetDrag, startDrag])

  return {
    draggingId,
    dropTarget,
    getItemProps,
    isDragging: !!draggingId,
  }
}
