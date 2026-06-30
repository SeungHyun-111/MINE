import { useEffect, useRef, useState } from 'react'

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

const IDLE = {
  신남:  { frames: [walk1, walk2, laugh, walk1, walk2], fps: 5,   align: 'foot' },
  행복:  { frames: [stand1, laugh],                      fps: 2,   align: 'foot' },
  보통:  { frames: [stand1],                             fps: 1,   align: 'foot' },
  슬픔:  { frames: [cry, sit, cry],                     fps: 1.5, align: 'foot' },
  위기:  { frames: [annoy, cry, annoy],                 fps: 3,   align: 'foot' },
}

export const SPRITE_ACTION = {
  feed:   { frames: [eat1, eat2, eat3],  fps: 4,   align: 'center', duration: 2400 },
  play:   { frames: [play1, play2],      fps: 4,   align: 'center', duration: 2000 },
  sleep:  { frames: [sleep1, sleep2],   fps: 1.5, align: 'center', duration: 3000 },
  clean:  { frames: [wash1, wash2],      fps: 4,   align: 'center', duration: 2500 },
  praise: { frames: [laugh, stand1],    fps: 4,   align: 'foot',   duration: 1500 },
}

export { laugh as SPRITE_LAUGH, stand1 as SPRITE_STAND }

export default function CharacterSprite({ emotionLabel = '보통', activeAction = null, filter = 'none', size = 120 }) {
  const [frameIdx, setFrameIdx] = useState(0)
  const timerRef = useRef(null)

  const anim = (activeAction && SPRITE_ACTION[activeAction])
    ? SPRITE_ACTION[activeAction]
    : IDLE[emotionLabel] ?? IDLE['보통']

  const { frames, fps, align } = anim

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

  return (
    <img
      src={frames[frameIdx] ?? frames[0]}
      alt="character"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        objectPosition: align === 'foot' ? 'bottom center' : 'center center',
        imageRendering: 'pixelated',
        filter,
        transition: 'filter 0.4s',
      }}
    />
  )
}
