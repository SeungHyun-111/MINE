import { memo, useEffect, useRef, useState } from 'react'

import stand1 from '@/assets/charcters/서있음1.png'
import walk1  from '@/assets/charcters/걷기1.png'
import walk2  from '@/assets/charcters/걷기2.png'
import play1  from '@/assets/charcters/놀기1.png'
import play2  from '@/assets/charcters/놀기2.png'
import eat1   from '@/assets/charcters/식사1.png'
import eat2   from '@/assets/charcters/식사2.png'
import eat3   from '@/assets/charcters/식사3.png'
import wash1  from '@/assets/charcters/씻기1.png'
import wash2  from '@/assets/charcters/씻기2.png'
import sit    from '@/assets/charcters/앉음.png'
import cry    from '@/assets/charcters/울기.png'
import laugh  from '@/assets/charcters/웃기.png'
import sleep1 from '@/assets/charcters/자기1.png'
import sleep2 from '@/assets/charcters/자기2.png'
import annoy  from '@/assets/charcters/짜증.png'

/*
 * 정렬 기준:
 *   foot   — 서있기/걷기/표정류 (발 기준): object-position bottom
 *   center — 식사/씻기/잠자기/놀기류 (중앙 비율): object-position center
 * 두 그룹을 같은 루프에 섞으면 캐릭터가 위아래로 튀므로 주의.
 */

const IDLE_WALK = { frames: [walk1, walk2], fps: 4, align: 'foot' }
const IDLE_REST = {
  신남: { frames: [laugh, stand1, laugh], fps: 1.5, align: 'foot' },
  행복: { frames: [laugh, sit], fps: 1, align: 'foot' },
  보통: { frames: [sit, stand1], fps: 0.7, align: 'foot' },
  슬픔: { frames: [cry, sit, cry], fps: 1, align: 'foot' },
  위기: { frames: [annoy, cry, annoy], fps: 1.4, align: 'foot' },
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function randomEdgeTarget(currentX, walkLimit) {
  const inner = Math.max(20, walkLimit * 0.4)
  const outer = Math.max(inner + 1, walkLimit)

  if (currentX > inner * 0.35) return randomBetween(-outer, -inner)
  if (currentX < -inner * 0.35) return randomBetween(inner, outer)
  return Math.random() < 0.5 ? randomBetween(-outer, -inner) : randomBetween(inner, outer)
}

function createIdleSegment(currentX = 0, direction = 1, walkLimit = 92) {
  if (Math.random() < 0.1) {
    return {
      mode: 'rest',
      x: currentX,
      direction,
      duration: Math.round(randomBetween(6500, 10000)),
    }
  }

  const targetX = randomEdgeTarget(currentX, walkLimit)
  const distance = Math.abs(targetX - currentX)
  return {
    mode: 'walk',
    x: targetX,
    direction: targetX >= currentX ? 1 : -1,
    duration: Math.round(Math.max(3200, Math.min(7200, distance * randomBetween(34, 42)))),
  }
}

export const SPRITE_ACTION = {
  feed:   { frames: [eat1, eat2, eat3],  fps: 4,   align: 'center', duration: 2400 },
  play:   { frames: [play1, play2],      fps: 4,   align: 'center', duration: 2000 },
  sleep:  { frames: [sleep1, sleep2],   fps: 1.5, align: 'center', duration: 3000 },
  clean:  { frames: [wash1, wash2],      fps: 4,   align: 'center', duration: 2500 },
  praise: { frames: [laugh, stand1],    fps: 4,   align: 'foot',   duration: 1500 },
}

export { laugh as SPRITE_LAUGH, stand1 as SPRITE_STAND }

function CharacterSprite({
  emotionLabel = '보통',
  activeAction = null,
  filter = 'none',
  size = 120,
  walkLimit = 92,
}) {
  const [idle, setIdle] = useState(() => createIdleSegment(0, 1, walkLimit))
  const [frameIdx, setFrameIdx] = useState(0)
  const timerRef = useRef(null)
  const idleTimerRef = useRef(null)

  const actionAnim = activeAction && SPRITE_ACTION[activeAction]
  const restAnim = IDLE_REST[emotionLabel] ?? IDLE_REST['보통']
  const idleAnim = idle.mode === 'walk' ? IDLE_WALK : restAnim
  const anim = actionAnim || idleAnim

  const { frames, fps, align } = anim

  useEffect(() => {
    clearTimeout(idleTimerRef.current)
    if (actionAnim) return

    idleTimerRef.current = setTimeout(() => {
      setIdle((current) => createIdleSegment(current.x, current.direction, walkLimit))
    }, idle.duration)

    return () => clearTimeout(idleTimerRef.current)
  }, [actionAnim, idle, walkLimit])

  useEffect(() => {
    setFrameIdx(0)
    clearInterval(timerRef.current)
    if (frames.length <= 1) return
    timerRef.current = setInterval(
      () => setFrameIdx((i) => (i + 1) % frames.length),
      1000 / fps,
    )
    return () => clearInterval(timerRef.current)
  }, [frames, fps])

  const isIdle = !actionAnim
  const isWalkingIdle = isIdle && idle.mode === 'walk'

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: isIdle ? `translateX(${idle.x}px)` : 'translateX(0)',
        transition: isWalkingIdle ? `transform ${idle.duration}ms linear` : 'transform 0.35s ease-out',
      }}
    >
      <img
        src={frames[frameIdx] ?? frames[0]}
        alt="character"
        title={emotionLabel}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          objectPosition: align === 'foot' ? 'bottom center' : 'center center',
          imageRendering: 'pixelated',
          filter,
          transform: isWalkingIdle && idle.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)',
          transition: 'filter 0.4s',
        }}
      />
    </div>
  )
}

export default memo(CharacterSprite)
