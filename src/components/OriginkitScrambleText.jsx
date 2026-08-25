import { useEffect, useMemo, useRef, useState } from 'react'

const GLITCH_CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const GLITCH_CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz'

function randomCharFor(char, pool) {
  if (pool) return pool[Math.floor(Math.random() * pool.length)]
  const isLower = char === char.toLowerCase() && char !== char.toUpperCase()
  const chars = isLower ? GLITCH_CHARS_LOWER : GLITCH_CHARS_UPPER
  return chars[Math.floor(Math.random() * chars.length)]
}

export default function OriginkitScrambleText({
  words = 'Scramble Text',
  color = '#ffffff',
  font,
  tag = 'p',
  enterAnimation = {},
  hoverAnimation = {},
  className = '',
  style,
}) {
  const Tag = tag
  const text = String(words)
  const [display, setDisplay] = useState('')
  const [hovering, setHovering] = useState(false)
  const [flickerIndexes, setFlickerIndexes] = useState(new Set())
  const frameRef = useRef(null)
  const hoverFrameRef = useRef(null)

  const chars = useMemo(() => text.split(''), [text])
  const finalStyle = {
    color,
    fontFamily: font?.fontFamily,
    fontWeight: font?.fontWeight || (font?.variant === 'Bold' ? 700 : undefined),
    fontSize: font?.fontSize,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
    textAlign: font?.textAlign,
    ...style,
  }

  useEffect(() => {
    const duration = (enterAnimation.ease?.duration ?? 1.7) * 1000
    const intensity = Math.max(1, Math.min(100, enterAnimation.scrambleIntensity ?? 70))
    const flickerIntensity = Math.max(0, Math.min(100, enterAnimation.flickerIntensity ?? 45))
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const revealCount = Math.min(chars.length, Math.floor(chars.length * progress * 1.14))
      const ghostCount = Math.min(chars.length, revealCount + Math.ceil(chars.length * 0.18))
      const nextFlickerIndexes = new Set()

      setDisplay(chars.map((char, index) => {
        if (char.trim() === '') return char
        if (index < revealCount) {
          if (Math.random() * 100 < flickerIntensity * (1 - progress)) {
            nextFlickerIndexes.add(index)
          }
          return char
        }
        if (index < ghostCount) {
          return Math.random() * 100 < intensity ? randomCharFor(char) : ''
        }
        return ''
      }).join(''))
      setFlickerIndexes(nextFlickerIndexes)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(text)
        setFlickerIndexes(new Set())
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [
    chars,
    enterAnimation.ease?.duration,
    enterAnimation.flickerColor,
    enterAnimation.flickerIntensity,
    enterAnimation.scrambleIntensity,
    text,
  ])

  useEffect(() => {
    if (!hovering || hoverAnimation.type === 'none') return undefined

    const pool = hoverAnimation.glitchChars || 'abcdefghijklmnopqrstuvwxyz'
    const radius = Math.max(1, hoverAnimation.radius || 2)
    const start = performance.now()
    const duration = (hoverAnimation.waveEase?.duration ?? 0.85) * 1000

    const tick = (now) => {
      const progress = ((now - start) % duration) / duration
      const center = Math.floor(progress * chars.length)
      const nextFlickerIndexes = new Set()
      setDisplay(chars.map((char, index) => {
        if (char.trim() === '') return char
        const distance = Math.abs(index - center)
        if (distance <= radius) {
          nextFlickerIndexes.add(index)
          return randomCharFor(char, pool)
        }
        return char
      }).join(''))
      setFlickerIndexes(nextFlickerIndexes)
      hoverFrameRef.current = requestAnimationFrame(tick)
    }

    hoverFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current)
      hoverFrameRef.current = null
      setDisplay(text)
      setFlickerIndexes(new Set())
    }
  }, [
    chars,
    hoverAnimation.glitchChars,
    hoverAnimation.radius,
    hoverAnimation.type,
    hoverAnimation.waveEase?.duration,
    hovering,
    text,
  ])

  return (
    <Tag
      className={className}
      style={finalStyle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {chars.map((char, index) => {
        const current = display[index] ?? ''
        const hidden = current === ''
        return (
          <span
            key={`${char}_${index}`}
            style={{
              color: flickerIndexes.has(index)
                ? enterAnimation.flickerColor || hoverAnimation.flickerColor || '#8de0d2'
                : undefined,
              opacity: hidden ? 0 : 1,
              display: 'inline-block',
              minWidth: char.trim() === '' ? '0.32em' : '0.56em',
              transform: hidden ? 'translateY(0.12em)' : 'translateY(0)',
              transition: hidden ? 'none' : 'opacity 90ms ease-out, transform 120ms ease-out',
            }}
          >
            {current || char}
          </span>
        )
      })}
    </Tag>
  )
}
