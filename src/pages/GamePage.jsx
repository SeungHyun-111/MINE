import { useEffect, useState } from 'react'
import { ACTIONS, usePet } from '@/hooks/usePet'


/* ── 감정별 캐릭터 애니메이션 ── */
const EMOTION_ANIM = {
  신남: {
    keyframes: `
      @keyframes em-excited {
        0%,100% { transform: translateY(0) scale(1) rotate(-2deg); }
        25%      { transform: translateY(-14px) scale(1.08) rotate(2deg); }
        50%      { transform: translateY(-4px) scale(1.04) rotate(-1deg); }
        75%      { transform: translateY(-10px) scale(1.06) rotate(1deg); }
      }`,
    name: 'em-excited',
    duration: '0.55s',
    filter: 'brightness(1.12) saturate(1.3)',
  },
  행복: {
    keyframes: `
      @keyframes em-happy {
        0%,100% { transform: translateY(0) rotate(0deg); }
        40%      { transform: translateY(-10px) rotate(1.5deg); }
        60%      { transform: translateY(-8px) rotate(-1deg); }
      }`,
    name: 'em-happy',
    duration: '1.2s',
    filter: 'brightness(1.06) saturate(1.15)',
  },
  보통: {
    keyframes: `
      @keyframes em-normal {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }`,
    name: 'em-normal',
    duration: '2.4s',
    filter: 'none',
  },
  슬픔: {
    keyframes: `
      @keyframes em-sad {
        0%,100% { transform: translateY(0) rotate(-1deg); }
        50%      { transform: translateY(-3px) rotate(1deg); }
      }`,
    name: 'em-sad',
    duration: '3.5s',
    filter: 'brightness(0.88) saturate(0.6) hue-rotate(200deg)',
  },
  위기: {
    keyframes: `
      @keyframes em-crisis {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-5px) rotate(-2deg); }
        40%      { transform: translateX(5px) rotate(2deg); }
        60%      { transform: translateX(-3px); }
        80%      { transform: translateX(3px); }
      }`,
    name: 'em-crisis',
    duration: '0.45s',
    filter: 'brightness(0.9) saturate(0.8) hue-rotate(330deg)',
  },
}

/* ── 버튼 누를 때 파티클 이모지 ── */
const ACTION_PARTICLES = {
  feed:   ['🍖','✨','😋'],
  play:   ['⭐','🎮','💫'],
  sleep:  ['💤','😴','💤'],
  clean:  ['✨','🚿','💦'],
  praise: ['💝','🌸','💕'],
}

const STAT_META = {
  happiness:   { label: '행복',  emoji: '😊' },
  hunger:      { label: '배고픔', emoji: '🍖' },
  energy:      { label: '에너지', emoji: '⚡' },
  cleanliness: { label: '청결',  emoji: '🛁' },
}

function statColor(v) {
  if (v > 60) return '#22c55e'
  if (v > 30) return '#ffc400'
  return '#e85252'
}

function fmtCooldown(ms) {
  if (ms <= 0) return null
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/* ── 파티클 컴포넌트 ── */
function Particle({ emoji, index, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])

  const x = (index - 1) * 36
  return (
    <span
      className="pointer-events-none absolute bottom-1/2 select-none text-2xl"
      style={{
        left: `calc(50% + ${x}px)`,
        animation: 'particle-rise 1.2s ease-out forwards',
      }}
    >
      {emoji}
    </span>
  )
}

function StatBar({ statKey, value }) {
  const meta = STAT_META[statKey]
  const pct = Math.round(value)
  const color = statColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-center text-sm">{meta.emoji}</span>
      <span className="w-12 shrink-0 text-[11px] font-black text-[#3355aa]">{meta.label}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#d5e8ff]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-[11px] font-black" style={{ color }}>{pct}</span>
    </div>
  )
}

function ActionButton({ actionKey, cooldownMs, onAction }) {
  const action = ACTIONS[actionKey]
  const remaining = fmtCooldown(cooldownMs)
  const onCooldown = cooldownMs > 0

  return (
    <button
      type="button"
      onClick={() => !onCooldown && onAction(actionKey)}
      className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 transition-all active:scale-90 ${
        onCooldown
          ? 'border-[#d5e8ff] bg-[#f0f5ff] opacity-40'
          : 'border-[#99ccff] bg-white/90 shadow-sm active:bg-[#d5e8ff]'
      }`}
    >
      <span className="text-2xl leading-none">{action.emoji}</span>
      <span className="text-[10px] font-black text-[#0044cc]">{action.label}</span>
      {remaining
        ? <span className="text-[9px] font-bold text-[#7799cc]">{remaining}</span>
        : <span className="text-[9px] font-bold text-[#22c55e]">OK</span>
      }
    </button>
  )
}

function AdoptScreen({ onAdopt }) {
  const [name, setName] = useState('')
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-[#f0f5ff] p-6">
      <img src="/character.png" alt="character" className="h-36 w-36 object-contain drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />
      <div className="text-center">
        <p className="text-xl font-black text-[#0044cc]">새 친구를 만났어요!</p>
        <p className="mt-1 text-sm text-[#5588bb]">이름을 지어주세요</p>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력..."
        maxLength={10}
        className="w-full max-w-xs rounded-xl border border-[#99ccff] bg-white/90 px-4 py-3 text-center text-lg font-black text-[#0044cc] placeholder-[#99ccff] outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-[#cce0ff]"
      />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => onAdopt(name.trim())}
        className="rounded-2xl bg-[#0044cc] px-8 py-3 text-sm font-black text-white shadow-lg disabled:opacity-40 active:scale-95"
      >
        만나기 🎉
      </button>
    </div>
  )
}

export default function GamePage() {
  const { pet, loading, emotion, affLevel, daysTogether, cooldowns, initPet, doAction } = usePet()
  const [particles, setParticles] = useState([])

  const anim = emotion ? EMOTION_ANIM[emotion.label] : EMOTION_ANIM['보통']

  const handleAction = async (key) => {
    const ok = await doAction(key)
    if (!ok) return
    const emojis = ACTION_PARTICLES[key] || ['✨']
    const newParticles = emojis.map((emoji, i) => ({ id: Date.now() + i, emoji, index: i }))
    setParticles((prev) => [...prev, ...newParticles])
  }

  const removeParticle = (id) => setParticles((prev) => prev.filter((p) => p.id !== id))

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f0f5ff]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0044cc] border-t-transparent" />
      </div>
    )
  }

  if (!pet) return <AdoptScreen onAdopt={initPet} />

  return (
    <>
      {/* 감정별 keyframes 주입 */}
      {anim && <style>{anim.keyframes}</style>}
      <style>{`
        @keyframes particle-rise {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translateY(-80px) scale(1.3); opacity: 0; }
        }
      `}</style>

      <div className="min-h-full bg-[#f0f5ff] p-3">
        <div className="mx-auto flex max-w-md flex-col gap-3">

          {/* 헤더: 함께한날 / 친밀도 / 감정 */}
          <div className="flex items-center justify-between rounded-2xl border border-[#bbd5f5] bg-white/90 px-4 py-2.5 shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#7799cc]">함께한 날</p>
              <p className="text-2xl font-black leading-none text-[#0044cc]">
                {daysTogether}<span className="ml-0.5 text-sm font-bold">일</span>
              </p>
            </div>
            <div className="h-8 w-px bg-[#d5e8ff]" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#7799cc]">친밀도</p>
              <p className="text-[11px] font-black leading-tight" style={{ color: affLevel.color }}>
                {affLevel.label}
              </p>
              <div className="mt-0.5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-4 rounded-full transition-all duration-500"
                    style={{ backgroundColor: i < Math.ceil((pet.stats.affection / 100) * 5) ? affLevel.color : '#d5e8ff' }}
                  />
                ))}
              </div>
            </div>
            <div className="h-8 w-px bg-[#d5e8ff]" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#7799cc]">감정</p>
              <p className="text-2xl leading-none">{emotion?.emoji}</p>
              <p className="text-[10px] font-black" style={{ color: emotion?.color }}>{emotion?.label}</p>
            </div>
          </div>

          {/* 캐릭터 */}
          <div
            className="relative flex h-56 flex-col items-end justify-end overflow-hidden rounded-3xl pb-4"
            style={{
              backgroundImage: 'url(/game-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              imageRendering: 'pixelated',
            }}
          >
            {/* 파티클 */}
            {particles.map((p) => (
              <Particle key={p.id} emoji={p.emoji} index={p.index} onDone={() => removeParticle(p.id)} />
            ))}

            {/* 캐릭터 이미지 — 바닥에 세워두기 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <img
                src="/character.png"
                alt={pet.name}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'contain',
                  filter: anim?.filter || 'none',
                  animation: anim ? `${anim.name} ${anim.duration} ease-in-out infinite` : 'none',
                  imageRendering: 'pixelated',
                }}
              />
            </div>

            {/* 이름 + 감정 뱃지 — 좌상단 */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-black text-white backdrop-blur-sm">
                {pet.name}
              </span>
              {emotion && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-black backdrop-blur-sm"
                  style={{ background: emotion.bg + 'dd', color: emotion.color }}>
                  {emotion.emoji} {emotion.label}
                </span>
              )}
            </div>
          </div>

          {/* 스탯 */}
          <section className="rounded-2xl border border-[#bbd5f5] bg-white/90 px-4 py-3 shadow-sm">
            <p className="mb-2.5 text-[11px] font-black text-[#4477cc]">상태</p>
            <div className="flex flex-col gap-2.5">
              {Object.keys(STAT_META).map((key) => (
                <StatBar key={key} statKey={key} value={pet.stats[key] ?? 0} />
              ))}
            </div>
          </section>

          {/* 액션 버튼 */}
          <section className="rounded-2xl border border-[#bbd5f5] bg-white/90 px-4 py-3 shadow-sm">
            <p className="mb-2.5 text-[11px] font-black text-[#4477cc]">케어</p>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(ACTIONS).map((key) => (
                <ActionButton key={key} actionKey={key} cooldownMs={cooldowns[key] ?? 0} onAction={handleAction} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
