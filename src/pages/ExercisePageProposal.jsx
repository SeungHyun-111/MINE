import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell, Plus, Search, Star, Target, Trash2, X } from 'lucide-react'
import { useExerciseState } from '@/hooks/useExerciseState'
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

const getExerciseKey = (exercise) => exercise.url ?? exercise.name

const EXERCISE_WORD_READINGS = {
  '30': '30도',
  '1': '1',
  '2': '2',
  i: '아이',
  j: '제이',
  l: '엘',
  m: '엠',
  t: '티',
  degree: '디그리',
  abduction: '어브덕션',
  alternating: '얼터네이팅',
  and: '앤드',
  arm: '암',
  arms: '암',
  arnold: '아놀드',
  assisted: '어시스티드',
  bar: '바',
  barbell: '바벨',
  band: '밴드',
  banded: '밴디드',
  bayesian: '베이지안',
  bench: '벤치',
  bent: '벤트',
  bike: '바이크',
  bilateral: '바이래터럴',
  body: '바디',
  bodyweight: '바디웨이트',
  bosu: '보수',
  bow: '보우',
  box: '박스',
  braced: '브레이스드',
  bridge: '브릿지',
  bottom: '바텀',
  bugs: '버그',
  bulgarian: '불가리안',
  burpee: '버피',
  calf: '카프',
  cable: '케이블',
  cardio: '카디오',
  chest: '체스트',
  chin: '친',
  chopper: '초퍼',
  clean: '클린',
  climber: '클라이머',
  core: '코어',
  cross: '크로스',
  crosslateral: '크로스래터럴',
  crunch: '크런치',
  curl: '컬',
  curtsy: '커트시',
  deadlift: '데드리프트',
  decline: '디클라인',
  deficit: '디피싯',
  delt: '델트',
  dips: '딥스',
  down: '다운',
  drive: '드라이브',
  dumbbell: '덤벨',
  eccentric: '이센트릭',
  elbow: '엘보우',
  elevated: '엘리베이티드',
  erg: '에르그',
  extension: '익스텐션',
  external: '익스터널',
  ez: '이지',
  face: '페이스',
  feet: '피트',
  figure: '피겨',
  flat: '플랫',
  floor: '플로어',
  fly: '플라이',
  flys: '플라이',
  footwork: '풋워크',
  forearm: '포어암',
  forward: '포워드',
  four: '포',
  front: '프론트',
  full: '풀',
  glute: '글루트',
  goblet: '고블렛',
  good: '굿',
  grip: '그립',
  guillotine: '길로틴',
  half: '하프',
  hammer: '해머',
  hamstring: '햄스트링',
  hand: '핸드',
  hands: '핸드',
  hang: '행',
  hanging: '행잉',
  halo: '헤일로',
  heels: '힐',
  high: '하이',
  hip: '힙',
  hold: '홀드',
  horizontal: '호리존털',
  incline: '인클라인',
  in: '인',
  internally: '인터널리',
  inverted: '인버티드',
  is: '이즈',
  isometric: '아이소메트릭',
  jacks: '잭',
  jerk: '저크',
  jump: '점프',
  knee: '니',
  kneeling: '닐링',
  kettlebell: '케틀벨',
  kickback: '킥백',
  kickstand: '킥스탠드',
  landmine: '랜드마인',
  larsen: '라슨',
  lat: '랫',
  lateral: '래터럴',
  laying: '레잉',
  leg: '레그',
  lift: '리프트',
  limb: '림',
  loaded: '로디드',
  looking: '루킹',
  long: '롱',
  lotus: '로터스',
  low: '로우',
  lunge: '런지',
  lying: '라잉',
  machine: '머신',
  medicine: '메디신',
  mini: '미니',
  mixed: '믹스드',
  morning: '모닝',
  mountain: '마운틴',
  narrow: '내로우',
  neck: '넥',
  neutral: '뉴트럴',
  on: '온',
  one: '원',
  out: '아웃',
  over: '오버',
  overhand: '오버핸드',
  overhead: '오버헤드',
  pause: '포즈',
  pec: '펙',
  pendlay: '펜들레이',
  pike: '파이크',
  pilates: '필라테스',
  pinch: '핀치',
  plank: '플랭크',
  plate: '플레이트',
  pose: '포즈',
  position: '포지션',
  preacher: '프리처',
  prep: '프렙',
  preps: '프렙',
  pike: '파이크',
  press: '프레스',
  prayer: '프레이어',
  push: '푸시',
  pushdown: '푸시다운',
  pushup: '푸시업',
  quad: '쿼드',
  rack: '랙',
  row: '로우',
  rower: '로워',
  rowing: '로잉',
  raise: '레이즈',
  raises: '레이즈',
  reach: '리치',
  rear: '리어',
  reverse: '리버스',
  ring: '링',
  romanian: '루마니안',
  rope: '로프',
  rotated: '로테이티드',
  rotation: '로테이션',
  rolling: '롤링',
  russian: '러시안',
  seated: '시티드',
  shoulder: '숄더',
  shuffle: '셔플',
  side: '사이드',
  sideplank: '사이드 플랭크',
  sideways: '사이드웨이즈',
  single: '싱글',
  sit: '싯',
  situp: '싯업',
  sissy: '시시',
  skullcrusher: '스컬크러셔',
  slam: '슬램',
  smith: '스미스',
  snatch: '스내치',
  split: '스플릿',
  sprint: '스프린트',
  squat: '스쿼트',
  stability: '스태빌리티',
  staggered: '스태거드',
  standing: '스탠딩',
  step: '스텝',
  stomp: '스톰프',
  straight: '스트레이트',
  shoulder: '숄더',
  shrug: '슈러그',
  silverback: '실버백',
  stability: '스태빌리티',
  stretch: '스트레치',
  suitcase: '수트케이스',
  sumo: '스모',
  swing: '스윙',
  tap: '탭',
  the: '더',
  through: '스루',
  three: '쓰리',
  thrust: '쓰러스트',
  thruster: '쓰러스터',
  to: '투',
  toss: '토스',
  trap: '트랩',
  treadmill: '트레드밀',
  tricep: '트라이셉',
  trx: '티알엑스',
  twist: '트위스트',
  twisting: '트위스팅',
  two: '투',
  underhand: '언더핸드',
  unilateral: '유니래터럴',
  stretch: '스트레치',
  up: '업',
  ups: '업',
  upright: '업라이트',
  variation: '바리에이션',
  vitruvian: '비트루비안',
  waiters: '웨이터스',
  walk: '워크',
  walking: '워킹',
  wall: '월',
  weighted: '웨이티드',
  windmill: '윈드밀',
  windshield: '윈드쉴드',
  with: '위드',
  wood: '우드',
  wrist: '리스트',
  wiper: '와이퍼',
  ab: '앱',
  abdominals: '앱도미널',
  abductor: '어브덕터',
  active: '액티브',
  activation: '액티베이션',
  adduction: '어덕션',
  airplane: '에어플레인',
  alternate: '얼터네이트',
  angle: '앵글',
  ankle: '앵클',
  anterior: '앤티리어',
  apart: '어파트',
  archer: '아처',
  around: '어라운드',
  assault: '어썰트',
  atomic: '아토믹',
  baby: '베이비',
  backward: '백워드',
  backwards: '백워즈',
  back: '백',
  backstroke: '백스트로크',
  balance: '밸런스',
  ball: '볼',
  belt: '벨트',
  bend: '벤드',
  behind: '비하인드',
  bicep: '바이셉',
  biceps: '바이셉스',
  bicycle: '바이시클',
  bias: '바이어스',
  bird: '버드',
  block: '블록',
  blocks: '블록',
  bodybuilder: '바디빌더',
  bodybuilding: '바디빌딩',
  bounces: '바운스',
  bradford: '브래드포드',
  bug: '버그',
  butt: '버트',
  car: '카',
  carry: '캐리',
  catch: '캐치',
  calves: '카프',
  calve: '카프',
  chair: '체어',
  child: '차일드',
  circle: '서클',
  circles: '서클',
  circumductions: '서컴덕션',
  clapping: '클래핑',
  clamshell: '클램쉘',
  clamshells: '클램쉘',
  clock: '클락',
  close: '클로즈',
  coan: '코안',
  cobra: '코브라',
  concentration: '컨센트레이션',
  concentric: '컨센트릭',
  control: '컨트롤',
  conventional: '컨벤셔널',
  corpse: '콥스',
  cow: '카우',
  crescent: '크레센트',
  criss: '크리스',
  crow: '크로우',
  crusher: '크러셔',
  curve: '커브',
  dance: '댄스',
  dead: '데드',
  deadstop: '데드스톱',
  depth: '뎁스',
  deviations: '디비에이션',
  dhanurasana: '다누라사나',
  diamond: '다이아몬드',
  dip: '딥',
  dog: '도그',
  donkey: '동키',
  double: '더블',
  dowel: '다월',
  downward: '다운워드',
  drag: '드래그',
  dragonflag: '드래곤플래그',
  driver: '드라이버',
  dynamic: '다이내믹',
  eagle: '이글',
  easy: '이지',
  eight: '에이트',
  elliptical: '일립티컬',
  exercise: '엑서사이즈',
  expansion: '익스팬션',
  explosive: '익스플로시브',
  extended: '익스텐디드',
  extensor: '익스텐서',
  facing: '페이싱',
  fall: '폴',
  farmer: '파머',
  farmers: '파머스',
  femoral: '페모럴',
  fingers: '핑거',
  fire: '파이어',
  first: '퍼스트',
  five: '파이브',
  flexion: '플렉션',
  flexions: '플렉션',
  flexor: '플렉서',
  foam: '폼',
  frog: '프로그',
  from: '프롬',
  gastrocnemius: '가스트로크니미어스',
  gate: '게이트',
  gironda: '지론다',
  glide: '글라이드',
  gluteator: '글루테이터',
  gorilla: '고릴라',
  guilotine: '길로틴',
  hack: '핵',
  ham: '햄',
  hamtring: '햄스트링',
  happy: '해피',
  head: '헤드',
  headlock: '헤드락',
  headstand: '헤드스탠드',
  heismans: '하이즈먼',
  heel: '힐',
  hinge: '힌지',
  hollow: '할로우',
  holding: '홀딩',
  hooklying: '훅라잉',
  hop: '홉',
  hundred: '헌드레드',
  hydrant: '하이드런트',
  hyperextension: '하이퍼익스텐션',
  iytw: '아이 와이 티 더블유',
  inchworm: '인치웜',
  infinity: '인피니티',
  internal: '인터널',
  inward: '인워드',
  into: '인투',
  jack: '잭',
  jackknife: '잭나이프',
  jefferson: '제퍼슨',
  jog: '조그',
  jumping: '점핑',
  karaoke: '카라오케',
  kayak: '카약',
  kick: '킥',
  lacrosse: '라크로스',
  landing: '랜딩',
  lawnmower: '론모어',
  leaning: '리닝',
  left: '레프트',
  legged: '레그드',
  lever: '레버',
  line: '라인',
  load: '로드',
  loop: '루프',
  lord: '로드',
  lower: '로어',
  lowers: '로어',
  lumbar: '럼바',
  march: '마치',
  matsyasana: '마츠야사나',
  meadows: '메도우스',
  mid: '미드',
  midback: '미드백',
  mobilisation: '모빌리제이션',
  mobility: '모빌리티',
  monkey: '몽키',
  moon: '문',
  muscle: '머슬',
  needle: '니들',
  nerve: '너브',
  ninety: '나인티',
  nordic: '노르딕',
  oblique: '오블리크',
  obliques: '오블리크',
  offering: '오퍼링',
  off: '오프',
  offset: '오프셋',
  of: '오브',
  olympic: '올림픽',
  only: '온리',
  open: '오픈',
  openers: '오프너',
  opposite: '오포짓',
  outward: '아웃워드',
  pallof: '팔로프',
  parallel: '패러럴',
  partial: '파셜',
  partner: '파트너',
  pass: '패스',
  peanut: '피넛',
  pendulum: '펜듈럼',
  pigeon: '피전',
  piriformis: '피리포미스',
  place: '플레이스',
  plantar: '플랜터',
  plow: '플라우',
  pole: '폴',
  pop: '팝',
  pot: '팟',
  power: '파워',
  prone: '프론',
  pronated: '프로네이티드',
  pronations: '프로네이션',
  pulses: '펄스',
  pulse: '펄스',
  pull: '풀',
  pulling: '풀링',
  pulls: '풀',
  pulldown: '풀다운',
  pullover: '풀오버',
  pullthrough: '풀스루',
  pullup: '풀업',
  punch: '펀치',
  puppy: '퍼피',
  pyramid: '피라미드',
  ql: '큐엘',
  quadruped: '쿼드러페드',
  quick: '퀵',
  radial: '레이디얼',
  rainbow: '레인보우',
  raised: '레이즈드',
  rapunzel: '라푼젤',
  reclining: '리클라이닝',
  regression: '리그레션',
  renegade: '레니게이드',
  resisted: '리지스티드',
  restful: '레스트풀',
  revolved: '리볼브드',
  right: '라이트',
  roll: '롤',
  roller: '롤러',
  rollout: '롤아웃',
  rolls: '롤',
  rotating: '로테이팅',
  rotator: '로테이터',
  rotational: '로테이셔널',
  rounding: '라운딩',
  runners: '러너스',
  running: '러닝',
  salute: '살루트',
  same: '세임',
  saw: '소',
  scissor: '시저',
  scorpion: '스콜피온',
  scooter: '스쿠터',
  seal: '실',
  second: '세컨드',
  self: '셀프',
  series: '시리즈',
  serratus: '세라투스',
  service: '서비스',
  short: '쇼트',
  shuttle: '셔틀',
  skater: '스케이터',
  skating: '스케이팅',
  ski: '스키',
  skull: '스컬',
  skullover: '스컬오버',
  skydiver: '스카이다이버',
  slalom: '슬라럼',
  slider: '슬라이더',
  slow: '슬로우',
  somersault: '서머솔트',
  soleus: '솔레우스',
  spanish: '스패니시',
  spider: '스파이더',
  spinal: '스파이널',
  spine: '스파인',
  sphinx: '스핑크스',
  spoto: '스포토',
  squeeze: '스퀴즈',
  stair: '스테어',
  stance: '스탠스',
  star: '스타',
  start: '스타트',
  static: '스태틱',
  stationary: '스테이셔너리',
  stabilisation: '스태빌리제이션',
  stable: '스테이블',
  stiff: '스티프',
  stir: '스티어',
  straps: '스트랩',
  stretcher: '스트레처',
  stroke: '스트로크',
  superman: '슈퍼맨',
  supermans: '슈퍼맨',
  supinated: '슈피네이티드',
  supinating: '슈피네이팅',
  supinations: '슈피네이션',
  supine: '슈파인',
  supported: '서포티드',
  suprispinatus: '수프라스피나투스',
  swipe: '스와이프',
  switch: '스위치',
  swingthrough: '스윙스루',
  table: '테이블',
  tate: '테이트',
  teardrops: '티어드롭',
  teaser: '티저',
  tempo: '템포',
  tensioner: '텐셔너',
  thing: '씽',
  thoracic: '토라식',
  thread: '스레드',
  tie: '타이',
  tip: '팁',
  toe: '토',
  tool: '툴',
  top: '탑',
  touch: '터치',
  towel: '타월',
  tree: '트리',
  tuck: '턱',
  ulnar: '얼나',
  upper: '어퍼',
  urdhva: '우르드바',
  vajrasana: '바즈라사나',
  vertical: '버티컬',
  v: '브이',
  w: '더블유',
  walkover: '워크오버',
  warrior: '워리어',
  wheel: '휠',
  wide: '와이드',
  wild: '와일드',
  world: '월드',
  y: '와이',
  yogi: '요기',
  your: '유어',
  z: '지',
  zottman: '조트맨',
  zercher: '저처',
}

const EXERCISE_PHRASE_READINGS = {
  'push up': '푸시업',
}

const DIFFICULTY_LABELS = {
  Beginner: '초급',
  Intermediate: '중급',
  Advanced: '상급',
}

const LETTER_READINGS = {
  a: '에이',
  b: '비',
  c: '씨',
  d: '디',
  e: '이',
  f: '에프',
  g: '지',
  h: '에이치',
  i: '아이',
  j: '제이',
  k: '케이',
  l: '엘',
  m: '엠',
  n: '엔',
  o: '오',
  p: '피',
  q: '큐',
  r: '알',
  s: '에스',
  t: '티',
  u: '유',
  v: '브이',
  w: '더블유',
  x: '엑스',
  y: '와이',
  z: '지',
}

const formatUnknownWord = (word) => {
  const cleanWord = word.replace(/[()']/g, '')
  if (!cleanWord) return ''
  if (LETTER_READINGS[cleanWord]) return LETTER_READINGS[cleanWord]
  if (/^\d+$/.test(cleanWord)) return cleanWord
  if (/^\d+[a-z]+$/.test(cleanWord)) {
    return cleanWord.replace(/[a-z]+/g, (letters) => [...letters].map((letter) => LETTER_READINGS[letter] ?? letter).join(''))
  }

  if (cleanWord.endsWith('ies')) {
    const base = `${cleanWord.slice(0, -3)}y`
    if (EXERCISE_WORD_READINGS[base]) return EXERCISE_WORD_READINGS[base]
  }

  if (cleanWord.endsWith('es')) {
    const base = cleanWord.slice(0, -2)
    if (EXERCISE_WORD_READINGS[base]) return EXERCISE_WORD_READINGS[base]
  }

  if (cleanWord.endsWith('s')) {
    const base = cleanWord.slice(0, -1)
    if (EXERCISE_WORD_READINGS[base]) return EXERCISE_WORD_READINGS[base]
  }

  return cleanWord
}

const formatExerciseName = (name) => {
  const normalized = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!normalized) return name

  return normalized
    .split(' ')
    .map((word, index, words) => {
      const phrase = `${word} ${words[index + 1] ?? ''}`.trim()
      if (EXERCISE_PHRASE_READINGS[phrase]) return EXERCISE_PHRASE_READINGS[phrase]
      if (index > 0 && EXERCISE_PHRASE_READINGS[`${words[index - 1]} ${word}`]) return null
      return EXERCISE_WORD_READINGS[word.replace(/[()]/g, '')] ?? formatUnknownWord(word)
    })
    .filter(Boolean)
    .join(' ')
}


function MuscleFigure({ activeId, routineTargetIds = [], highlightedId, onSelect }) {
  const active = MUSCLES[activeId]
  const routineTargetSet = useMemo(() => new Set(routineTargetIds), [routineTargetIds])

  return (
    <div className="relative mx-auto aspect-[1149/1369] h-[min(76vh,820px)] min-h-[520px] max-w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
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
  const exerciseStore = useExerciseState(ROUTINES)
  const [activeId, setActiveId] = useState('chest')
  const [showRoutine, setShowRoutine] = useState(false)
  const [showAllRecommendations, setShowAllRecommendations] = useState(false)
  const [favoriteExercises, setFavoriteExercises] = useState([])
  const [routinesMeta, setRoutinesMeta] = useState(() => ROUTINES)
  const [routineDraftExercise, setRoutineDraftExercise] = useState(null)
  const [routineDraft, setRoutineDraft] = useState({
    routineId: 'day1',
    reps: '10',
    sets: '3',
    weight: '',
  })
  const [activeRoutineId, setActiveRoutineId] = useState('day1')
  const [routineItemsByDay, setRoutineItemsByDay] = useState(() => (
    Object.fromEntries(Object.entries(ROUTINES).map(([id, routine]) => [id, routine.items]))
  ))
  const [editingId, setEditingId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  const [extraMuscleIds, setExtraMuscleIds] = useState([])

  useEffect(() => {
    if (!exerciseStore.connected || exerciseStore.loading) return
    if (!exerciseStore.routinesMeta || !exerciseStore.routineItemsByDay) {
      exerciseStore.seedDefaults()
      return
    }

    setFavoriteExercises(exerciseStore.favorites)
    setRoutinesMeta(exerciseStore.routinesMeta)
    setRoutineItemsByDay(exerciseStore.routineItemsByDay)

    if (!exerciseStore.routinesMeta[activeRoutineId]) {
      const [firstRoutineId] = Object.keys(exerciseStore.routinesMeta)
      if (firstRoutineId) {
        setActiveRoutineId(firstRoutineId)
        setRoutineDraft((draft) => ({ ...draft, routineId: firstRoutineId }))
      }
    }
  }, [
    activeRoutineId,
    exerciseStore.connected,
    exerciseStore.favorites,
    exerciseStore.loading,
    exerciseStore.routineItemsByDay,
    exerciseStore.routinesMeta,
    exerciseStore.seedDefaults,
  ])

  const saveFavoritesState = (updater) => {
    setFavoriteExercises((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      exerciseStore.saveFavorites(next)
      return next
    })
  }

  const saveRoutinesMetaState = (updater) => {
    setRoutinesMeta((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      exerciseStore.saveRoutinesMeta(next)
      return next
    })
  }

  const saveRoutineItemsState = (updater) => {
    setRoutineItemsByDay((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      exerciseStore.saveRoutineItemsByDay(next)
      return next
    })
  }

  const active = useMemo(() => MUSCLES[activeId], [activeId])
  const activeRoutine = routinesMeta[activeRoutineId]
  const routineItems = routineItemsByDay[activeRoutineId] ?? []
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
  const visibleMuscleWikiExercises = showAllRecommendations ? muscleWikiExercises : muscleWikiExercises.slice(0, 5)
  const favoriteKeySet = useMemo(() => new Set(favoriteExercises.map(getExerciseKey)), [favoriteExercises])

  const toggleFavoriteExercise = (exercise) => {
    const key = getExerciseKey(exercise)
    saveFavoritesState((favorites) => (
      favorites.some((item) => getExerciseKey(item) === key)
        ? favorites.filter((item) => getExerciseKey(item) !== key)
        : [...favorites, exercise]
    ))
  }

  const openRoutineDraft = (exercise) => {
    setRoutineDraftExercise(exercise)
    setRoutineDraft((draft) => ({
      ...draft,
      routineId: activeRoutineId,
    }))
    selectExerciseTarget(exercise.name)
  }

  const addDraftExerciseToRoutine = () => {
    if (!routineDraftExercise) return

    const routineId = routineDraft.routineId
    const exerciseName = formatExerciseName(routineDraftExercise.name)
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nextItem = {
      id,
      name: exerciseName,
      reps: routineDraft.reps,
      sets: routineDraft.sets,
      weight: routineDraft.weight,
      note: routineDraftExercise.difficulty ? `${DIFFICULTY_LABELS[routineDraftExercise.difficulty] ?? routineDraftExercise.difficulty} 추천 운동` : '추천 운동',
    }

    saveRoutineItemsState((routines) => ({
      ...routines,
      [routineId]: [...(routines[routineId] ?? []), nextItem],
    }))
    setActiveRoutineId(routineId)
    setShowRoutine(true)
    setSelectedExerciseId(id)
    setRoutineDraftExercise(null)
  }

  const renderRoutineDraftForm = () => {
    if (!routineDraftExercise) return null

    return (
      <div className="rounded-lg border border-[#134e4a]/20 bg-[#f1f8f7] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#134e4a]">루틴에 추가</p>
            <h4 className="mt-1 truncate text-sm font-black text-slate-950">{formatExerciseName(routineDraftExercise.name)}</h4>
          </div>
          <button
            type="button"
            onClick={() => setRoutineDraftExercise(null)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
            aria-label="루틴 추가 닫기"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <label className="col-span-3 text-[11px] font-black text-slate-500">
            루틴
            <select
              value={routineDraft.routineId}
              onChange={(event) => setRoutineDraft((draft) => ({ ...draft, routineId: event.target.value }))}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none focus:border-[#134e4a]"
            >
              {Object.entries(routinesMeta).map(([id, routine]) => (
                <option key={id} value={id}>{routine.day} · {routine.title}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-black text-slate-500">
            횟수
            <input
              value={routineDraft.reps}
              onChange={(event) => setRoutineDraft((draft) => ({ ...draft, reps: event.target.value }))}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none focus:border-[#134e4a]"
            />
          </label>
          <label className="text-[11px] font-black text-slate-500">
            세트
            <input
              value={routineDraft.sets}
              onChange={(event) => setRoutineDraft((draft) => ({ ...draft, sets: event.target.value }))}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none focus:border-[#134e4a]"
            />
          </label>
          <label className="text-[11px] font-black text-slate-500">
            무게
            <input
              value={routineDraft.weight}
              onChange={(event) => setRoutineDraft((draft) => ({ ...draft, weight: event.target.value }))}
              placeholder="kg"
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-900 outline-none focus:border-[#134e4a]"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={addDraftExerciseToRoutine}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#134e4a] text-sm font-black text-white transition hover:bg-[#0f3f3b]"
        >
          선택한 루틴에 추가
        </button>
      </div>
    )
  }

  const selectExerciseTarget = (exerciseName, exerciseId = null) => {
    const targetId = getExerciseTargetId(exerciseName)
    if (exerciseId && selectedExerciseId === exerciseId) {
      setSelectedExerciseId(null)
      return
    }

    setSelectedExerciseId(exerciseId)
    if (targetId) {
      setShowAllRecommendations(false)
      setActiveId(targetId)
    }
  }

  const selectMuscleTarget = (muscleId) => {
    setSelectedExerciseId(null)
    setShowAllRecommendations(false)

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
    saveRoutineItemsState((routines) => ({
      ...routines,
      [activeRoutineId]: routines[activeRoutineId].map((item) => (
        item.id === itemId ? { ...item, [field]: value } : item
      )),
    }))
  }

  const moveRoutineItem = (targetId) => {
    if (!draggingId || draggingId === targetId) return

    saveRoutineItemsState((routines) => {
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

  const moveRoutineItemByStep = (itemId, direction) => {
    saveRoutineItemsState((routines) => {
      const currentItems = routines[activeRoutineId] ?? []
      const fromIndex = currentItems.findIndex((item) => item.id === itemId)
      const toIndex = fromIndex + direction
      if (fromIndex < 0 || toIndex < 0 || toIndex >= currentItems.length) return routines

      const next = [...currentItems]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...routines, [activeRoutineId]: next }
    })
  }

  const deleteRoutineItem = (itemId) => {
    saveRoutineItemsState((routines) => ({
      ...routines,
      [activeRoutineId]: (routines[activeRoutineId] ?? []).filter((item) => item.id !== itemId),
    }))
    if (selectedExerciseId === itemId) setSelectedExerciseId(null)
    if (editingId === itemId) setEditingId(null)
  }

  const createRoutine = () => {
    const nextNumber = Object.keys(routinesMeta).length + 1
    const id = `custom-routine-${Date.now()}`
    const nextRoutine = {
      day: `DAY ${nextNumber}`,
      title: `나의 루틴 ${nextNumber}`,
      tag: 'CUSTOM',
      items: [],
    }

    saveRoutinesMetaState((routines) => ({ ...routines, [id]: nextRoutine }))
    saveRoutineItemsState((routines) => ({ ...routines, [id]: [] }))
    setActiveRoutineId(id)
    setRoutineDraft((draft) => ({ ...draft, routineId: id }))
    setSelectedExerciseId(null)
    setEditingId(null)
    setDraggingId(null)
    setDragOverId(null)
  }

  const deleteActiveRoutine = () => {
    const routineIds = Object.keys(routinesMeta)
    if (routineIds.length <= 1) return

    const currentItems = routineItemsByDay[activeRoutineId] ?? []
    if (currentItems.length > 0 && !window.confirm('현재 루틴과 안의 운동을 삭제할까요?')) return

    const nextActiveId = routineIds.find((id) => id !== activeRoutineId)
    saveRoutinesMetaState((routines) => {
      const next = { ...routines }
      delete next[activeRoutineId]
      return next
    })
    saveRoutineItemsState((routines) => {
      const next = { ...routines }
      delete next[activeRoutineId]
      return next
    })
    setActiveRoutineId(nextActiveId)
    setRoutineDraft((draft) => ({ ...draft, routineId: nextActiveId }))
    setSelectedExerciseId(null)
    setEditingId(null)
    setDraggingId(null)
    setDragOverId(null)
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

        <div className="relative z-10 grid min-h-[calc(100svh-7rem)] items-start gap-5 pt-3 xl:grid-cols-[minmax(0,760px)_minmax(330px,1fr)_340px]">
          <div className="xl:sticky xl:top-4">
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

            <div className="mx-auto mt-4 min-h-14 max-w-[760px] rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-50 px-3 text-xs font-black text-red-600 ring-1 ring-red-100">
                  <Star size={14} fill="currentColor" />
                  즐겨찾기
                </span>
                {favoriteExercises.length === 0 && (
                  <span className="text-xs font-bold text-slate-400">추천 운동의 별을 눌러 담아두세요.</span>
                )}
                {favoriteExercises.map((exercise) => (
                  <button
                    type="button"
                    key={getExerciseKey(exercise)}
                    onClick={() => toggleFavoriteExercise(exercise)}
                    className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-white px-3 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-100"
                  >
                    <span className="truncate">{formatExerciseName(exercise.name)}</span>
                    <X size={13} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex max-h-[calc(100svh-7rem)] flex-col gap-4 overflow-y-auto pr-1">
            {showRoutine && (
              <div className="rounded-lg border border-white/80 bg-white p-5 shadow-sm">
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(routinesMeta).map(([id, routine]) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          setActiveRoutineId(id)
                          setRoutineDraft((draft) => ({ ...draft, routineId: id }))
                          setSelectedExerciseId(null)
                          setExtraMuscleIds([])
                          setEditingId(null)
                          setDraggingId(null)
                          setDragOverId(null)
                        }}
                        className={`h-9 rounded-lg text-xs font-black ring-1 transition ${
                          activeRoutineId === id
                            ? 'bg-[#134e4a] text-white ring-[#134e4a]'
                            : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {routine.day}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={createRoutine}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#134e4a] bg-white px-2 text-xs font-black text-[#134e4a] transition hover:bg-[#134e4a] hover:text-white"
                    >
                      <Plus size={14} />
                      루틴생성
                    </button>
                    <button
                      type="button"
                      onClick={deleteActiveRoutine}
                      disabled={Object.keys(routinesMeta).length <= 1}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-red-200 bg-white px-2 text-xs font-black text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#ef4444]">{activeRoutine.day}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{activeRoutine.title}</h3>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">{activeRoutine.tag}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {routineItems.map((item, index) => {
                    const isEditing = editingId === item.id
                    const isDragTarget = draggingId && draggingId !== item.id && dragOverId === item.id

                    return (
                      <div
                        key={item.id}
                        draggable={!isEditing}
                        onDragStart={() => setDraggingId(item.id)}
                        onDragOver={(event) => {
                          event.preventDefault()
                          setDragOverId(item.id)
                        }}
                        onDragLeave={() => {
                          if (dragOverId === item.id) setDragOverId(null)
                        }}
                        onDrop={() => {
                          moveRoutineItem(item.id)
                          setDragOverId(null)
                        }}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setDragOverId(null)
                        }}
                        onClick={() => selectExerciseTarget(item.name, item.id)}
                        onDoubleClick={() => setEditingId(item.id)}
                        className={`relative rounded-lg border px-3 py-2.5 text-sm font-bold text-slate-800 transition ${
                          selectedExerciseId === item.id
                            ? 'border-[#134e4a] bg-white shadow-sm'
                            : isDragTarget
                              ? 'border-[#134e4a] bg-[#e7f4f2] shadow-sm ring-2 ring-[#134e4a]/25'
                              : 'border-slate-200 bg-slate-50'
                        } ${draggingId === item.id ? 'opacity-50' : ''}`}
                      >
                        {isDragTarget && (
                          <div className="pointer-events-none absolute -top-2 left-3 right-3 h-1 rounded-full bg-[#134e4a]" />
                        )}
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-4 w-4 accent-[#134e4a]" />
                          <span className="flex shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                moveRoutineItemByStep(item.id, -1)
                              }}
                              disabled={index === 0}
                              className="inline-flex h-6 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-[#134e4a] disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`${item.name} 위로 이동`}
                            >
                              <ChevronUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                moveRoutineItemByStep(item.id, 1)
                              }}
                              disabled={index === routineItems.length - 1}
                              className="inline-flex h-6 w-8 items-center justify-center border-t border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-[#134e4a] disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`${item.name} 아래로 이동`}
                            >
                              <ChevronDown size={15} />
                            </button>
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          {item.reps && item.sets && <span className="shrink-0 text-xs font-black text-slate-500">{item.reps}×{item.sets}</span>}
                          {item.weight && <span className="shrink-0 text-xs font-black text-[#134e4a]">{Number.isNaN(Number(item.weight)) ? item.weight : `${item.weight}kg`}</span>}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteRoutineItem(item.id)
                            }}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
                            aria-label={`${item.name} 삭제`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {item.note && <p className="mt-1 pl-[4.75rem] text-xs font-semibold text-slate-500">{item.note}</p>}

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
              나의 루틴
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
                {visibleMuscleWikiExercises.map((exercise, index) => {
                  const exerciseName = formatExerciseName(exercise.name)
                  const favorited = favoriteKeySet.has(getExerciseKey(exercise))

                  const draftOpen = routineDraftExercise && getExerciseKey(routineDraftExercise) === getExerciseKey(exercise)

                  return (
                    <div key={`${exercise.name}-${exercise.url ?? index}`} className="flex flex-col gap-2">
                      <div
                        onClick={() => openRoutineDraft(exercise)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition hover:border-[#134e4a] hover:bg-white ${
                          draftOpen
                            ? 'border-[#134e4a] bg-white shadow-sm'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openRoutineDraft(exercise)
                          }
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-900">{exerciseName}</span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty ?? 'MuscleWiki'} · {index + 1}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleFavoriteExercise(exercise)
                            }}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-black transition ${
                              favorited
                                ? 'border-red-500 bg-red-50 text-red-500'
                                : 'border-slate-200 bg-white text-slate-400 hover:border-red-300 hover:text-red-500'
                            }`}
                            aria-label={`${exerciseName} 즐겨찾기`}
                          >
                            <Star size={15} fill={favorited ? 'currentColor' : 'none'} />
                          </button>
                          {exercise.url && (
                            <a
                              href={exercise.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-[#134e4a] bg-white px-3 text-xs font-black text-[#134e4a] transition hover:bg-[#134e4a] hover:text-white"
                            >
                              원문 보기
                            </a>
                          )}
                        </span>
                      </div>
                      {draftOpen && renderRoutineDraftForm()}
                    </div>
                  )
                })}
              </div>
              {muscleWikiExercises.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllRecommendations((prev) => !prev)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-[#134e4a] transition hover:border-[#134e4a]"
                >
                  {showAllRecommendations ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  {showAllRecommendations ? '접기' : `더보기 ${muscleWikiExercises.length - 5}개`}
                </button>
              )}
            </div>
          </aside>
        </div>

      </main>
    </section>
  )
}


