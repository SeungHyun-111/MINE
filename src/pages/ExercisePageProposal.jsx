import { useMemo, useState } from 'react'
import { Dumbbell, Search, Target } from 'lucide-react'
import muscleWikiData from '../data/musclewikiExercises.json'

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
  { id: 'sternocleidomastoid', label: '흉쇄유돌근', cx: 332, cy: 341, rx: 10, ry: 42 },
  { id: 'sternocleidomastoid', label: '흉쇄유돌근', cx: 384, cy: 341, rx: 10, ry: 42 },
  { id: 'traps', label: '승모근 전면', cx: 363, cy: 347, rx: 34, ry: 32 },
  { id: 'chest', label: '대흉근', cx: 356, cy: 431, rx: 121, ry: 57 },
  { id: 'deltoid_front', label: '전면 삼각근', cx: 235, cy: 418, rx: 34, ry: 51 },
  { id: 'deltoid_front', label: '전면 삼각근', cx: 480, cy: 418, rx: 32, ry: 50 },
  { id: 'biceps', label: '이두근', cx: 218, cy: 504, rx: 22, ry: 58 },
  { id: 'biceps', label: '이두근', cx: 496, cy: 504, rx: 21, ry: 56 },
  { id: 'brachialis', label: '상완근', cx: 223, cy: 541, rx: 16, ry: 35 },
  { id: 'brachialis', label: '상완근', cx: 477, cy: 541, rx: 15, ry: 34 },
  { id: 'forearm_front', label: '전완근', cx: 199, cy: 630, rx: 24, ry: 70 },
  { id: 'forearm_front', label: '전완근', cx: 515, cy: 630, rx: 23, ry: 68 },
  { id: 'abs', label: '복직근', cx: 355, cy: 591, rx: 44, ry: 106 },
  { id: 'serratus', label: '전거근', cx: 274, cy: 549, rx: 18, ry: 48 },
  { id: 'serratus', label: '전거근', cx: 427, cy: 549, rx: 17, ry: 47 },
  { id: 'obliques', label: '외복사근', cx: 306, cy: 594, rx: 24, ry: 82 },
  { id: 'obliques', label: '외복사근', cx: 411, cy: 594, rx: 23, ry: 80 },
  { id: 'quad', label: '대퇴사두근', cx: 297, cy: 819, rx: 39, ry: 129 },
  { id: 'quad', label: '대퇴사두근', cx: 420, cy: 819, rx: 38, ry: 127 },
  { id: 'rectus_femoris', label: '대퇴직근', cx: 316, cy: 832, rx: 18, ry: 105 },
  { id: 'rectus_femoris', label: '대퇴직근', cx: 402, cy: 832, rx: 17, ry: 103 },
  { id: 'vastus_lateralis', label: '외측광근', cx: 280, cy: 842, rx: 22, ry: 113 },
  { id: 'vastus_lateralis', label: '외측광근', cx: 437, cy: 842, rx: 21, ry: 111 },
  { id: 'inner_thigh', label: '내측광근', cx: 334, cy: 812, rx: 18, ry: 103 },
  { id: 'inner_thigh', label: '내측광근', cx: 370, cy: 812, rx: 17, ry: 101 },
  { id: 'tibialis', label: '전경골근', cx: 287, cy: 1045, rx: 20, ry: 108 },
  { id: 'tibialis', label: '전경골근', cx: 425, cy: 1045, rx: 19, ry: 106 },
  { id: 'calf_front', label: '전면 비복근', cx: 294, cy: 1030, rx: 20, ry: 100 },
  { id: 'calf_front', label: '전면 비복근', cx: 427, cy: 1030, rx: 19, ry: 98 },
  { id: 'traps', label: '승모근 후면', cx: 783, cy: 402, rx: 50, ry: 91 },
  { id: 'rhomboid', label: '능형근', cx: 783, cy: 447, rx: 47, ry: 67 },
  { id: 'rear_deltoid', label: '후면 삼각근', cx: 662, cy: 421, rx: 33, ry: 47 },
  { id: 'rear_deltoid', label: '후면 삼각근', cx: 900, cy: 421, rx: 33, ry: 47 },
  { id: 'triceps', label: '삼두근', cx: 634, cy: 511, rx: 23, ry: 64 },
  { id: 'triceps', label: '삼두근', cx: 920, cy: 511, rx: 23, ry: 64 },
  { id: 'lat', label: '광배근', cx: 719, cy: 526, rx: 38, ry: 93 },
  { id: 'lat', label: '광배근', cx: 842, cy: 526, rx: 38, ry: 93 },
  { id: 'erector_spinae', label: '척추기립근', cx: 776, cy: 555, rx: 15, ry: 117 },
  { id: 'glute', label: '대둔근', cx: 780, cy: 711, rx: 86, ry: 67 },
  { id: 'hamstring', label: '햄스트링', cx: 709, cy: 867, rx: 33, ry: 109 },
  { id: 'hamstring', label: '햄스트링', cx: 842, cy: 867, rx: 33, ry: 109 },
  { id: 'adductor_back', label: '대퇴내전근', cx: 742, cy: 866, rx: 15, ry: 98 },
  { id: 'adductor_back', label: '대퇴내전근', cx: 809, cy: 866, rx: 15, ry: 98 },
  { id: 'calf_back', label: '후면 비복근', cx: 700, cy: 1036, rx: 28, ry: 76 },
  { id: 'calf_back', label: '후면 비복근', cx: 851, cy: 1036, rx: 28, ry: 76 },
]

const ROUTINES = {
  day1: {
    day: 'DAY 1',
    title: 'PUSH 5×5 체크리스트',
    tag: 'PUSH',
    items: [
      { id: 'bench-press', name: '벤치프레스', reps: '5', sets: '5', weight: '80' },
      { id: 'leg-extension', name: '레그 익스텐션', reps: '5', sets: '5', weight: '66' },
      { id: 'side-lateral', name: '덤벨 사이드 레터럴', reps: '10', sets: '5', weight: '10+10' },
      { id: 'incline-press', name: '덤벨 인클라인 프레스', reps: '5', sets: '5', weight: '30+30' },
      { id: 'leg-curl', name: '레그 컬', reps: '5', sets: '5', weight: '55' },
      { id: 'push-press', name: '푸쉬프레스', reps: '5', sets: '5', weight: '40' },
      { id: 'machine-shoulder', name: '머신 숄더프레스', reps: '5', sets: '5', weight: '60' },
      { id: 'cable-fly', name: '케이블 플라이', reps: '5', sets: '5', weight: '35' },
      { id: 'machine-situp', name: '머신 싯업', reps: '5', sets: '5', weight: '50' },
      { id: 'dips', name: '딥스', reps: '7', sets: '5', weight: '' },
      { id: 'upper-cable-fly', name: '케이블 어퍼 플라이', reps: '5', sets: '5', weight: '25' },
    ],
  },
  day2: {
    day: 'DAY 2',
    title: 'PULL 5×5 체크리스트',
    tag: 'PULL',
    items: [
      { id: 'pullup-machine', name: '풀업', reps: '5', sets: '5', weight: '기구' },
      { id: 'pull-leg-extension', name: '레그 익스텐션', reps: '5', sets: '5', weight: '66' },
      { id: 'reverse-pecdeck', name: '머신 리버스 팩덱', reps: '5', sets: '5', weight: '50' },
      { id: 'barbell-bent-row', name: '바벨 벤트 로우', reps: '7', sets: '5', weight: '70' },
      { id: 'pull-machine-situp', name: '머신 싯업', reps: '10', sets: '5', weight: '40', note: '50키로' },
      { id: 'front-lat-pulldown', name: '프론트 랫풀다운', reps: '5', sets: '5', weight: '37' },
      { id: 'pull-leg-curl', name: '레그 컬', reps: '5', sets: '5', weight: '55' },
      { id: 'ezbar-curl', name: '이지바 컬', reps: '7', sets: '5', weight: '30', note: '언더그립임' },
      { id: 'chest-supported-row', name: '체스트 서포티드 로우', reps: '5', sets: '5', weight: '70' },
      { id: 'behind-neck-lat-pulldown', name: '비하인드넥 랫풀다운', reps: '5', sets: '5', weight: '32' },
      { id: 'arm-curl-machine', name: '암컬 머신', reps: '5', sets: '5', weight: '25' },
    ],
  },
  day3: {
    day: 'DAY 3',
    title: 'LOWER + MIX 5×5 체크리스트',
    tag: 'LOWER + MIX',
    items: [
      { id: 'squat', name: '스쿼트', reps: '5', sets: '5', weight: '110' },
      { id: 'cable-side-lateral', name: '케이블 사이드 레터럴', reps: '7', sets: '5', weight: '25' },
      { id: 'leg-press', name: '레그프레스', reps: '5', sets: '5', weight: '240' },
      { id: 'chinup', name: '친업', reps: '5', sets: '5', weight: '' },
      { id: 'lower-leg-curl', name: '레그 컬', reps: '5', sets: '5', weight: '55', note: '첫 두세트 말고는 힙터치안됨' },
      { id: 'dumbbell-front-raise', name: '덤벨 프론트 레이즈', reps: '', sets: '', weight: '16' },
      { id: 'lower-leg-extension', name: '레그 익스텐션', reps: '5', sets: '5', weight: '66' },
      { id: 'lower-machine-situp', name: '머신 싯업', reps: '', sets: '', weight: '50', note: '함' },
      { id: 'machine-pecdeck-fly', name: '머신 팩덱 플라이', reps: '', sets: '', weight: '80' },
      { id: 'lower-cable-fly', name: '케이블 플라이', reps: '5', sets: '5', weight: '35' },
    ],
  },
}

const EXERCISE_TARGETS = {
  넥플렉션: 'sternocleidomastoid',
  '가벼운목스트레칭': 'sternocleidomastoid',
  자세교정운동: 'traps',
  덤벨슈러그: 'traps',
  페이스풀: 'rear_deltoid',
  업라이트로우: 'traps',
  시티드로우: 'rhomboid',
  밴드풀어파트: 'rhomboid',
  푸시업: 'chest',
  덤벨벤치프레스: 'chest',
  체스트프레스: 'chest',
  벤치프레스: 'chest',
  덤벨인클라인프레스: 'chest',
  케이블플라이: 'chest',
  케이블어퍼플라이: 'chest',
  머신팩덱플라이: 'chest',
  숄더프레스: 'deltoid_front',
  머신숄더프레스: 'deltoid_front',
  푸쉬프레스: 'deltoid_front',
  사이드레터럴레이즈: 'deltoid_front',
  덤벨사이드레터럴: 'deltoid_front',
  케이블사이드레터럴: 'deltoid_front',
  덤벨프론트레이즈: 'deltoid_front',
  아놀드프레스: 'deltoid_front',
  덤벨컬: 'biceps',
  바벨컬: 'biceps',
  이지바컬: 'biceps',
  암컬머신: 'biceps',
  해머컬: 'brachialis',
  리버스컬: 'forearm_front',
  프리처컬: 'biceps',
  리스트컬: 'forearm_front',
  파머스워크: 'forearm_front',
  플랭크: 'abs',
  크런치: 'abs',
  데드버그: 'abs',
  머신싯업: 'abs',
  사이드플랭크: 'obliques',
  러시안트위스트: 'obliques',
  케이블우드찹: 'obliques',
  푸시업플러스: 'serratus',
  월슬라이드: 'serratus',
  덤벨풀오버: 'serratus',
  레그익스텐션: 'rectus_femoris',
  스쿼트: 'quad',
  런지: 'quad',
  레그프레스: 'quad',
  스텝업: 'vastus_lateralis',
  와이드스쿼트: 'inner_thigh',
  코펜하겐플랭크: 'inner_thigh',
  어덕터머신: 'adductor_back',
  토레이즈: 'tibialis',
  힐워크: 'tibialis',
  밴드도르시플렉션: 'tibialis',
  카프레이즈: 'calf_front',
  점프로프: 'calf_back',
  스프린트: 'calf_front',
  리어델트플라이: 'rear_deltoid',
  벤트오버레이즈: 'rear_deltoid',
  머신리버스팩덱: 'rear_deltoid',
  딥스: 'triceps',
  트라이셉스푸시다운: 'triceps',
  오버헤드익스텐션: 'triceps',
  랫풀다운: 'lat',
  프론트랫풀다운: 'lat',
  비하인드넥랫풀다운: 'lat',
  풀업: 'lat',
  친업: 'lat',
  바벨벤트로우: 'lat',
  체스트서포티드로우: 'rhomboid',
  백익스텐션: 'erector_spinae',
  루마니안데드리프트: 'hamstring',
  버드독: 'erector_spinae',
  힙쓰러스트: 'glute',
  글루트브릿지: 'glute',
  레그컬: 'hamstring',
  굿모닝: 'hamstring',
  사이드런지: 'adductor_back',
  스탠딩카프레이즈: 'calf_back',
  시티드카프레이즈: 'calf_back',
}

const getExerciseTargetId = (name) => EXERCISE_TARGETS[name.replace(/\s/g, '')]

const getRoutineTargetIds = (items) => (
  [...new Set(items.map((item) => getExerciseTargetId(item.name)).filter(Boolean))]
)


function MuscleFigure({ activeId, routineTargetIds = [], highlightedId, onSelect }) {
  const active = MUSCLES[activeId]
  const routineTargetSet = useMemo(() => new Set(routineTargetIds), [routineTargetIds])

  return (
    <div className="relative mx-auto aspect-[1149/1369] h-[min(78vh,860px)] min-h-[560px] max-w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <img
        src={MUSCLE_IMAGE}
        alt="성인 남성 근육도 전면과 후면"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 1149 1369" className="absolute inset-0 h-full w-full" aria-label="근육 선택 영역">
        {HOTSPOTS.map((spot, index) => {
          const routineTarget = routineTargetSet.has(spot.id)
          const selected = spot.id === activeId
          const highlighted = spot.id === highlightedId
          const muscle = MUSCLES[spot.id]

          return (
            <ellipse
              key={`${spot.id}-${index}`}
              cx={spot.cx}
              cy={spot.cy}
              rx={spot.rx}
              ry={spot.ry}
              fill={
                highlighted
                  ? `${muscle.color}b8`
                  : routineTarget
                    ? `${muscle.color}66`
                    : selected
                      ? `${active.color}8f`
                      : 'transparent'
              }
              stroke={highlighted || routineTarget || selected ? muscle.color : 'transparent'}
              strokeWidth={highlighted ? 4 : routineTarget || selected ? 2.5 : 0}
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
  const [showRoutine, setShowRoutine] = useState(false)
  const [activeRoutineId, setActiveRoutineId] = useState('day1')
  const [routineItemsByDay, setRoutineItemsByDay] = useState(() => (
    Object.fromEntries(Object.entries(ROUTINES).map(([id, routine]) => [id, routine.items]))
  ))
  const [editingId, setEditingId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  const [extraMuscleIds, setExtraMuscleIds] = useState([])
  const active = useMemo(() => MUSCLES[activeId], [activeId])
  const activeRoutine = ROUTINES[activeRoutineId]
  const routineItems = routineItemsByDay[activeRoutineId]
  const routineTargetIds = useMemo(() => getRoutineTargetIds(routineItems), [routineItems])
  const visibleTargetIds = useMemo(
    () => [...new Set([...(showRoutine ? routineTargetIds : []), ...extraMuscleIds])],
    [extraMuscleIds, routineTargetIds, showRoutine],
  )
  const selectedExercise = useMemo(
    () => routineItems.find((item) => item.id === selectedExerciseId),
    [routineItems, selectedExerciseId],
  )
  const selectedExerciseTargetId = selectedExercise ? getExerciseTargetId(selectedExercise.name) : null
  const muscleWikiEntry = muscleWikiData.byMuscle[activeId]
  const muscleWikiExercises = muscleWikiEntry?.exercises ?? active.exercises.map((name) => ({ name, difficulty: null, url: null }))

  const selectExerciseTarget = (exerciseName, exerciseId = null) => {
    const targetId = getExerciseTargetId(exerciseName)
    if (exerciseId && selectedExerciseId === exerciseId) {
      setSelectedExerciseId(null)
      return
    }

    setSelectedExerciseId(exerciseId)
    if (targetId) setActiveId(targetId)
  }

  const selectMuscleTarget = (muscleId) => {
    setSelectedExerciseId(null)

    if (showRoutine && routineTargetIds.includes(muscleId)) {
      setActiveId(muscleId)
      return
    }

    setExtraMuscleIds((ids) => {
      if (ids.includes(muscleId)) {
        const next = ids.filter((id) => id !== muscleId)
        if (activeId === muscleId) setActiveId((showRoutine && routineTargetIds[0]) || next[0] || 'chest')
        return next
      }

      setActiveId(muscleId)
      return [...ids, muscleId]
    })
  }

  const updateRoutineItem = (itemId, field, value) => {
    setRoutineItemsByDay((routines) => ({
      ...routines,
      [activeRoutineId]: routines[activeRoutineId].map((item) => (
        item.id === itemId ? { ...item, [field]: value } : item
      )),
    }))
  }

  const moveRoutineItem = (targetId) => {
    if (!draggingId || draggingId === targetId) return

    setRoutineItemsByDay((routines) => {
      const currentItems = routines[activeRoutineId]
      const fromIndex = currentItems.findIndex((item) => item.id === draggingId)
      const toIndex = currentItems.findIndex((item) => item.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return routines

      const next = [...currentItems]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...routines, [activeRoutineId]: next }
    })
  }

  return (
    <section className="min-h-full bg-[#e8eff3] text-slate-900">
      <main className="relative min-h-full overflow-hidden bg-[#f6f8fa] px-4 py-4">
        <div className="relative z-10 flex justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#134e4a]"
              placeholder="운동명 검색"
            />
          </div>
        </div>

        <div className="relative z-10 grid min-h-[calc(100svh-7rem)] items-center gap-5 xl:grid-cols-[minmax(0,760px)_minmax(330px,1fr)_340px]">
          <div className="relative flex justify-center">
            <MuscleFigure
              activeId={activeId}
              routineTargetIds={visibleTargetIds}
              highlightedId={selectedExerciseTargetId ?? activeId}
              onSelect={selectMuscleTarget}
            />
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: active.color }} />
              {selectedExercise ? `${selectedExercise.name} 자극 부위` : `${active.label} 선택됨`}
            </div>
          </div>

          <div className="flex max-h-[calc(100svh-7rem)] flex-col gap-4 overflow-y-auto pr-1">
            {showRoutine && (
              <div className="rounded-lg border border-white/80 bg-white p-5 shadow-sm">
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {Object.entries(ROUTINES).map(([id, routine]) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        setActiveRoutineId(id)
                        setSelectedExerciseId(null)
                        setExtraMuscleIds([])
                        setEditingId(null)
                        setDraggingId(null)
                      }}
                      className={`h-9 rounded-lg text-xs font-black ring-1 transition ${
                        activeRoutineId === id
                          ? 'bg-[#134e4a] text-white ring-[#134e4a]'
                          : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-white'
                      }`}
                    >
                      {routine.day}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#ef4444]">{activeRoutine.day}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{activeRoutine.title}</h3>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">{activeRoutine.tag}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {routineItems.map((item) => {
                    const isEditing = editingId === item.id

                    return (
                      <div
                        key={item.id}
                        draggable={!isEditing}
                        onDragStart={() => setDraggingId(item.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => moveRoutineItem(item.id)}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() => selectExerciseTarget(item.name, item.id)}
                        onDoubleClick={() => setEditingId(item.id)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-bold text-slate-800 ${
                          selectedExerciseId === item.id
                            ? 'border-[#134e4a] bg-white shadow-sm'
                            : 'border-slate-200 bg-slate-50'
                        } ${draggingId === item.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-4 w-4 accent-[#134e4a]" />
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          {item.reps && item.sets && <span className="shrink-0 text-xs font-black text-slate-500">{item.reps}×{item.sets}</span>}
                          {item.weight && <span className="shrink-0 text-xs font-black text-[#134e4a]">{Number.isNaN(Number(item.weight)) ? item.weight : `${item.weight}kg`}</span>}
                        </div>
                        {item.note && <p className="mt-1 pl-7 text-xs font-semibold text-slate-500">{item.note}</p>}

                        {isEditing && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <label className="text-[11px] font-black text-slate-500">
                              횟수
                              <input
                                value={item.reps}
                                onChange={(event) => updateRoutineItem(item.id, 'reps', event.target.value)}
                                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-[#134e4a]"
                              />
                            </label>
                            <label className="text-[11px] font-black text-slate-500">
                              세트
                              <input
                                value={item.sets}
                                onChange={(event) => updateRoutineItem(item.id, 'sets', event.target.value)}
                                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-[#134e4a]"
                              />
                            </label>
                            <label className="text-[11px] font-black text-slate-500">
                              무게
                              <input
                                value={item.weight}
                                onChange={(event) => updateRoutineItem(item.id, 'weight', event.target.value)}
                                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-[#134e4a]"
                              />
                            </label>
                            <label className="col-span-3 text-[11px] font-black text-slate-500">
                              메모
                              <input
                                value={item.note ?? ''}
                                onChange={(event) => updateRoutineItem(item.id, 'note', event.target.value)}
                                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-[#134e4a]"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="col-span-3 h-8 rounded-md bg-[#134e4a] text-xs font-black text-white"
                            >
                              적용
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRoutine((prev) => !prev)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#134e4a] text-sm font-black text-white shadow-sm"
            >
              <Dumbbell size={18} />
              {showRoutine ? '루틴 접기' : '선택 부위로 루틴 만들기'}
            </button>
          </div>

          <aside className="flex max-h-[calc(100svh-7rem)] flex-col gap-4 overflow-y-auto pr-1">
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
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-950">추천 운동</h3>
                <span className="text-xs font-black text-slate-500">{muscleWikiExercises.length}개</span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {muscleWikiExercises.map((exercise, index) => (
                  <button
                    type="button"
                    key={`${exercise.name}-${exercise.url ?? index}`}
                    onClick={() => selectExerciseTarget(exercise.name)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#134e4a] hover:bg-white"
                  >
                    <span>
                      <span className="block text-sm font-black text-slate-900">{exercise.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        {exercise.difficulty ?? 'MuscleWiki'} · {index + 1}
                      </span>
                    </span>
                    {exercise.url && (
                      <a
                        href={exercise.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="shrink-0 text-sm font-black text-[#134e4a]"
                      >
                        원문
                      </a>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </section>
  )
}

