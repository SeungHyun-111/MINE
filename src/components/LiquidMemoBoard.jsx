import './LiquidMemoBoard.css'
import { memo, useMemo } from 'react'
import { useMemos } from '@/hooks/useMemos'

const MEMO_STAGE_LABELS = {
  pending: '대기',
  progress: '진행',
  done: '완료',
}

function memoStageValue(stage) {
  return stage === 'review' ? 'progress' : stage || 'pending'
}

function LiquidMemoBoard({ className = '' }) {
  const { memos } = useMemos()
  const { counts, rolling } = useMemo(() => {
    const normalized = memos.map((memo) => ({ ...memo, normalizedStage: memoStageValue(memo.stage) }))
    const counts = ['pending', 'progress', 'done'].map((stage) => ({
      stage,
      count: normalized.filter((memo) => memo.normalizedStage === stage).length,
    }))
    const activeMemos = normalized.filter((memo) => memo.normalizedStage === 'pending' || memo.normalizedStage === 'progress')
    const rolling = activeMemos.length > 0 ? [...activeMemos, ...activeMemos].slice(0, Math.min(activeMemos.length * 2, 10)) : []

    return { counts, rolling }
  }, [memos])

  return (
    <section className={`liquid-memo-box ${className}`} aria-label="메모 현황판">
      <div className="liquid-memo-content">
        <p className="liquid-memo-title">메모 현황판</p>

        <div className="liquid-memo-window">
          <div className="liquid-memo-roll">
            {rolling.length === 0 ? (
              <div className="liquid-memo-row">미완료/진행중 메모가 없습니다</div>
            ) : (
              rolling.map((memo, index) => (
                <div key={`${memo.id}_${index}`} className="liquid-memo-row">
                  <span className="liquid-memo-stage">
                    {MEMO_STAGE_LABELS[memo.normalizedStage]}
                  </span>
                  <span className="liquid-memo-text">{memo.title || memo.content}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="liquid-memo-counts">
          {counts.map((item) => (
            <span key={item.stage}>{MEMO_STAGE_LABELS[item.stage]} {item.count}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(LiquidMemoBoard)
