import { useMemo, useState } from 'react'
import { Dumbbell, RotateCcw, Search, Target } from 'lucide-react'

const MUSCLE_IMAGE = '/exercise-muscle-map.png'

const MUSCLES = {
  traps: {
      label: '승모근',
      short: '목과 어깨 안정',
      description: '목 뒤와 어깨 위쪽 라인을 잡아주는 부위입니다.',
      color: '#64748b',
      exercises: ['덤벨 슈러그', '페이스 풀', '업라이트 로우'],
    },
  sternocleidomastoid: {
      label: '흉쇄유돌근',
      short: '목 전면 라인',
      description: '목 앞쪽에서 쇄골까지 이어지는 근육입니다. 목의 회전과 자세 안정에 관여합니다.',
      color: '#94a3b8',
      exercises: ['넥 플렉션', '가벼운 목 스트레칭', '자세 교정 운동'],
    },
  rhomboid: {
      label: '능형근',
      short: '견갑골 모으기',
      description: '등 위쪽에서 견갑골을 안쪽으로 모으는 데 쓰이는 근육입니다.',
      color: '#8b5cf6',
      exercises: ['시티드 로우', '페이스 풀', '밴드 풀어파트'],
    },
  chest: {
      label: '대흉근',
      short: '밀기 힘',
      description: '가슴 전면의 큰 근육입니다. 벤치프레스, 푸시업처럼 앞으로 미는 운동에 쓰입니다.',
      color: '#ef6f6c',
      exercises: ['푸시업', '덤벨 벤치프레스', '체스트 프레스'],
    },
  deltoid_front: {
      label: '전면 삼각근',
      short: '상체 라인',
      description: '어깨를 감싸는 근육입니다. 팔을 들거나 머리 위로 미는 동작에 관여합니다.',
      color: '#f4a261',
      exercises: ['숄더 프레스', '사이드 레터럴 레이즈', '아놀드 프레스'],
    },
  biceps: {
      label: '이두근',
      short: '굽히고 펴기',
      description: '팔 앞쪽 근육입니다. 팔꿈치를 굽히고 당기는 동작에 쓰입니다.',
      color: '#2a9d8f',
      exercises: ['덤벨 컬', '바벨 컬', '해머 컬'],
    },
  brachialis: {
      label: '상완근',
      short: '팔꿈치 굽힘',
      description: '이두근 아래쪽에 있는 팔 근육입니다. 팔꿈치를 굽히는 힘에 관여합니다.',
      color: '#0f766e',
      exercises: ['해머 컬', '리버스 컬', '프리처 컬'],
    },
  forearm_front: {
      label: '전완근',
      short: '손목과 그립',
      description: '아래팔 근육입니다. 손목 움직임과 악력에 관여합니다.',
      color: '#06b6d4',
      exercises: ['리스트 컬', '리버스 컬', '파머스 워크'],
    },
  abs: {
      label: '복직근',
      short: '중심 안정',
      description: '몸통 전면의 중심 근육입니다. 자세 유지와 몸통 굽힘에 관여합니다.',
      color: '#457b9d',
      exercises: ['플랭크', '크런치', '데드 버그'],
    },
  obliques: {
      label: '외복사근',
      short: '옆구리 회전',
      description: '옆구리 근육입니다. 몸통 회전과 측면 안정에 쓰입니다.',
      color: '#ff4f7b',
      exercises: ['사이드 플랭크', '러시안 트위스트', '케이블 우드찹'],
    },
  serratus: {
      label: '전거근',
      short: '견갑 안정',
      description: '갈비뼈 옆면에 붙은 근육입니다. 팔을 앞으로 밀고 견갑골을 안정시키는 데 쓰입니다.',
      color: '#ec4899',
      exercises: ['푸시업 플러스', '월 슬라이드', '덤벨 풀오버'],
    },
  rectus_femoris: {
      label: '대퇴직근',
      short: '허벅지 중앙',
      description: '허벅지 앞쪽 중앙을 지나는 근육입니다. 무릎 펴기와 고관절 굽힘에 관여합니다.',
      color: '#ca8a04',
      exercises: ['레그 익스텐션', '스쿼트', '런지'],
    },
  vastus_lateralis: {
      label: '외측광근',
      short: '허벅지 바깥',
      description: '허벅지 바깥쪽 앞면 근육입니다. 무릎을 펴는 힘에 중요합니다.',
      color: '#f59e0b',
      exercises: ['레그 프레스', '스쿼트', '스텝업'],
    },
  quad: {
      label: '대퇴사두근',
      short: '무릎 펴기',
      description: '허벅지 앞쪽 근육입니다. 앉았다 일어나는 동작에 중요합니다.',
      color: '#e9c46a',
      exercises: ['스쿼트', '런지', '레그 프레스'],
    },
  inner_thigh: {
      label: '내측광근',
      short: '허벅지 안쪽',
      description: '허벅지 안쪽 안정에 관여하는 근육입니다.',
      color: '#d9a441',
      exercises: ['와이드 스쿼트', '코펜하겐 플랭크', '어덕터 머신'],
    },
  tibialis: {
      label: '전경골근',
      short: '정강이',
      description: '발등을 들어 올리는 정강이 앞쪽 근육입니다.',
      color: '#22c55e',
      exercises: ['토 레이즈', '힐 워크', '밴드 도르시플렉션'],
    },
  calf_front: {
      label: '전면 비복근',
      short: '종아리',
      description: '종아리 전면 쪽 영역입니다.',
      color: '#84cc16',
      exercises: ['카프 레이즈', '점프 로프', '스프린트'],
    },
  rear_deltoid: {
      label: '후면 삼각근',
      short: '어깨 뒤쪽',
      description: '어깨 뒤쪽 근육입니다. 팔을 뒤로 벌리거나 당기는 동작에 쓰입니다.',
      color: '#fb923c',
      exercises: ['리어 델트 플라이', '페이스 풀', '벤트오버 레이즈'],
    },
  triceps: {
      label: '삼두근',
      short: '팔 펴기',
      description: '팔 뒤쪽 근육입니다. 팔꿈치를 펴는 동작에 중요합니다.',
      color: '#10b981',
      exercises: ['딥스', '트라이셉스 푸시다운', '오버헤드 익스텐션'],
    },
  lat: {
      label: '광배근',
      short: '당기는 힘',
      description: '등 옆쪽의 큰 근육입니다. 당기기 운동과 팔을 몸쪽으로 모으는 동작에 쓰입니다.',
      color: '#7b68ee',
      exercises: ['랫 풀다운', '시티드 로우', '풀업'],
    },
  erector_spinae: {
      label: '척추기립근',
      short: '허리 안정',
      description: '척추를 세우고 허리를 안정시키는 근육입니다.',
      color: '#6366f1',
      exercises: ['백 익스텐션', '루마니안 데드리프트', '버드독'],
    },
  glute: {
      label: '대둔근',
      short: '엉덩이 힘',
      description: '엉덩이 근육입니다. 고관절을 펴는 힘과 하체 안정에 중요합니다.',
      color: '#d76aa2',
      exercises: ['힙 쓰러스트', '글루트 브릿지', '런지'],
    },
  hamstring: {
      label: '햄스트링',
      short: '허벅지 뒤쪽',
      description: '허벅지 뒤쪽 근육입니다. 무릎 굽힘과 고관절 폄에 관여합니다.',
      color: '#f97316',
      exercises: ['레그 컬', '루마니안 데드리프트', '굿모닝'],
    },
  adductor_back: {
      label: '대퇴내전근',
      short: '허벅지 안쪽',
      description: '다리를 몸 중앙으로 모으는 데 관여하는 근육입니다.',
      color: '#ea580c',
      exercises: ['어덕터 머신', '사이드 런지', '코펜하겐 플랭크'],
    },
  calf_back: {
      label: '후면 비복근',
      short: '종아리',
      description: '종아리 근육입니다. 발목을 밀어내는 힘을 만듭니다.',
      color: '#84cc16',
      exercises: ['스탠딩 카프 레이즈', '시티드 카프 레이즈', '점프 로프'],
    },
}

const HOTSPOTS = [
  { id: 'sternocleidomastoid', label: '흉쇄유돌근', cx: 324, cy: 341, rx: 10, ry: 42 },
  { id: 'sternocleidomastoid', label: '흉쇄유돌근', cx: 376, cy: 341, rx: 10, ry: 42 },
  { id: 'traps', label: '승모근 전면', cx: 356, cy: 347, rx: 34, ry: 32 },
  { id: 'chest', label: '대흉근', cx: 356, cy: 431, rx: 121, ry: 57 },
  { id: 'deltoid_front', label: '전면 삼각근', cx: 227, cy: 418, rx: 34, ry: 51 },
  { id: 'deltoid_front', label: '전면 삼각근', cx: 472, cy: 418, rx: 32, ry: 50 },
  { id: 'biceps', label: '이두근', cx: 210, cy: 504, rx: 22, ry: 58 },
  { id: 'biceps', label: '이두근', cx: 488, cy: 504, rx: 21, ry: 56 },
  { id: 'brachialis', label: '상완근', cx: 223, cy: 541, rx: 16, ry: 35 },
  { id: 'brachialis', label: '상완근', cx: 477, cy: 541, rx: 15, ry: 34 },
  { id: 'forearm_front', label: '전완근', cx: 191, cy: 630, rx: 24, ry: 70 },
  { id: 'forearm_front', label: '전완근', cx: 507, cy: 630, rx: 23, ry: 68 },
  { id: 'abs', label: '복직근', cx: 355, cy: 591, rx: 44, ry: 106 },
  { id: 'serratus', label: '전거근', cx: 274, cy: 549, rx: 18, ry: 48 },
  { id: 'serratus', label: '전거근', cx: 427, cy: 549, rx: 17, ry: 47 },
  { id: 'obliques', label: '외복사근', cx: 298, cy: 594, rx: 24, ry: 82 },
  { id: 'obliques', label: '외복사근', cx: 403, cy: 594, rx: 23, ry: 80 },
  { id: 'quad', label: '대퇴사두근', cx: 289, cy: 819, rx: 39, ry: 129 },
  { id: 'quad', label: '대퇴사두근', cx: 412, cy: 819, rx: 38, ry: 127 },
  { id: 'rectus_femoris', label: '대퇴직근', cx: 308, cy: 832, rx: 18, ry: 105 },
  { id: 'rectus_femoris', label: '대퇴직근', cx: 394, cy: 832, rx: 17, ry: 103 },
  { id: 'vastus_lateralis', label: '외측광근', cx: 272, cy: 842, rx: 22, ry: 113 },
  { id: 'vastus_lateralis', label: '외측광근', cx: 429, cy: 842, rx: 21, ry: 111 },
  { id: 'inner_thigh', label: '내측광근', cx: 334, cy: 812, rx: 18, ry: 103 },
  { id: 'inner_thigh', label: '내측광근', cx: 370, cy: 812, rx: 17, ry: 101 },
  { id: 'tibialis', label: '전경골근', cx: 279, cy: 1045, rx: 20, ry: 108 },
  { id: 'tibialis', label: '전경골근', cx: 417, cy: 1045, rx: 19, ry: 106 },
  { id: 'calf_front', label: '전면 비복근', cx: 310, cy: 1030, rx: 20, ry: 100 },
  { id: 'calf_front', label: '전면 비복근', cx: 443, cy: 1030, rx: 19, ry: 98 },
  { id: 'traps', label: '승모근 후면', cx: 791, cy: 402, rx: 50, ry: 91 },
  { id: 'rhomboid', label: '능형근', cx: 791, cy: 447, rx: 47, ry: 67 },
  { id: 'rear_deltoid', label: '후면 삼각근', cx: 662, cy: 421, rx: 33, ry: 47 },
  { id: 'rear_deltoid', label: '후면 삼각근', cx: 900, cy: 421, rx: 33, ry: 47 },
  { id: 'triceps', label: '삼두근', cx: 642, cy: 511, rx: 23, ry: 64 },
  { id: 'triceps', label: '삼두근', cx: 928, cy: 511, rx: 23, ry: 64 },
  { id: 'lat', label: '광배근', cx: 727, cy: 526, rx: 38, ry: 93 },
  { id: 'lat', label: '광배근', cx: 850, cy: 526, rx: 38, ry: 93 },
  { id: 'erector_spinae', label: '척추기립근', cx: 792, cy: 555, rx: 15, ry: 117 },
  { id: 'glute', label: '대둔근', cx: 748, cy: 711, rx: 46, ry: 67 },
  { id: 'glute', label: '대둔근', cx: 836, cy: 711, rx: 46, ry: 67 },
  { id: 'hamstring', label: '햄스트링', cx: 725, cy: 867, rx: 33, ry: 109 },
  { id: 'hamstring', label: '햄스트링', cx: 858, cy: 867, rx: 33, ry: 109 },
  { id: 'adductor_back', label: '대퇴내전근', cx: 758, cy: 866, rx: 15, ry: 98 },
  { id: 'adductor_back', label: '대퇴내전근', cx: 825, cy: 866, rx: 15, ry: 98 },
  { id: 'calf_back', label: '후면 비복근', cx: 716, cy: 1036, rx: 28, ry: 76 },
  { id: 'calf_back', label: '후면 비복근', cx: 867, cy: 1036, rx: 28, ry: 76 },
]

const MUSCLE_FILTERS = [
  'sternocleidomastoid',
  'traps',
  'chest',
  'deltoid_front',
  'biceps',
  'brachialis',
  'forearm_front',
  'serratus',
  'abs',
  'obliques',
  'quad',
  'rectus_femoris',
  'vastus_lateralis',
  'inner_thigh',
  'tibialis',
  'calf_front',
  'rhomboid',
  'rear_deltoid',
  'triceps',
  'lat',
  'erector_spinae',
  'glute',
  'hamstring',
  'adductor_back',
  'calf_back',
]

function MuscleFigure({ activeId, onSelect }) {
  const active = MUSCLES[activeId]

  return (
    <div className="relative mx-auto aspect-[1149/1369] h-[min(78vh,860px)] min-h-[560px] max-w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <img
        src={MUSCLE_IMAGE}
        alt="성인 남성 근육도 전면과 후면"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 1149 1369" className="absolute inset-0 h-full w-full" aria-label="근육 선택 영역">
        {HOTSPOTS.map((spot, index) => {
          const selected = spot.id === activeId

          return (
            <ellipse
              key={`${spot.id}-${index}`}
              cx={spot.cx}
              cy={spot.cy}
              rx={spot.rx}
              ry={spot.ry}
              fill={selected ? `${active.color}8f` : 'transparent'}
              stroke={selected ? active.color : 'transparent'}
              strokeWidth={selected ? 3 : 0}
              className="cursor-pointer transition hover:fill-[#134e4a2e] focus:outline-none"
              role="button"
              tabIndex="0"
              aria-label={`${spot.label} 운동 보기`}
              onClick={() => onSelect(spot.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(spot.id)
                }
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}

export default function ExercisePageProposal() {
  const [activeId, setActiveId] = useState('chest')
  const active = useMemo(() => MUSCLES[activeId], [activeId])

  return (
    <section className="min-h-full bg-[#e8eff3] text-slate-900">
      <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_370px]">
        <main className="relative overflow-hidden border-r border-slate-300/70 bg-[#f6f8fa] px-4 py-4">
          <div className="relative z-10 flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#134e4a]"
                placeholder="운동명 검색"
              />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[calc(100svh-7rem)] items-center justify-center">
            <MuscleFigure activeId={activeId} onSelect={setActiveId} />
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: active.color }} />
              {active.label} 선택됨
            </div>
          </div>
        </main>

        <aside className="flex flex-col gap-4 bg-[#e8eff3] p-5">
          <header className="rounded-lg border border-white/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-[#134e4a]">운동</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">근육별 운동 찾기</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              전면과 후면 근육도에서 원하는 부위를 누르면 해당 운동 설명이 바뀝니다.
            </p>
          </header>

          <div className="rounded-lg border border-white/80 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg text-white" style={{ backgroundColor: active.color }}>
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black">{active.label} 운동</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{active.short}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{active.description}</p>
          </div>

          <div className="rounded-lg border border-white/80 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-950">추천 운동</h3>
            <div className="mt-4 flex flex-col gap-3">
              {active.exercises.map((exercise, index) => (
                <button
                  type="button"
                  key={exercise}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#134e4a] hover:bg-white"
                >
                  <span>
                    <span className="block text-sm font-black text-slate-900">{exercise}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{index + 1}세트 예시와 자세 설명 연결</span>
                  </span>
                  <span className="text-sm font-black text-[#134e4a]">보기</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">부위 바로 선택</span>
              <button
                type="button"
                onClick={() => setActiveId('chest')}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-600"
              >
                <RotateCcw size={14} />
                초기화
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_FILTERS.map((id) => (
                <button
                  type="button"
                  key={id}
                  data-muscle-id={id}
                  onClick={() => setActiveId(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${activeId === id ? 'text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200'}`}
                  style={activeId === id ? { backgroundColor: MUSCLES[id].color } : undefined}
                >
                  {MUSCLES[id].label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#134e4a] text-sm font-black text-white shadow-sm">
            <Dumbbell size={18} />
            선택 부위로 루틴 만들기
          </button>
        </aside>
      </div>
    </section>
  )
}

