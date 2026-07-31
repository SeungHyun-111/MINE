import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Database, FlaskConical, Ticket } from 'lucide-react'

const LOTTO_DATA_URL = '/data/lotto-draws.json'
const DRAW_PAGE_SIZE = 100

const GYEONGJA_RESULT = {
  drawNo: 1234,
  drawDate: '2026-07-25',
  numbers: [1, 15, 19, 31, 35, 43],
  bonus: 27,
}

const ANALYSES = [
  {
    id: 'gyeongja',
    title: '경자일 분석',
    subtitle: '1234회 · 2026-07-25 · 경자일 토요일',
    summary: '5끝, 10번대, 직전 경자일 반복, 25일 기운을 중심으로 봤던 분석',
    result: GYEONGJA_RESULT,
    performance: {
      total: 7,
      items: [
        { label: '4등', count: 3 },
        { label: '낙첨', count: 4 },
      ],
    },
    energy: {
      title: '경자일 기운',
      text: '경자일은 금(金)의 선명함과 수(水)의 이동성이 같이 들어오는 날로 봤다. 숫자로는 끝수가 또렷한 1·5 계열, 차갑고 직선적인 10번대, 반복성이 강한 후보가 잘 살아난다고 해석했다. 다만 기운이 너무 한쪽으로 세면 20번대처럼 “좋아 보이는 축”에 과몰입하기 쉬운 날이기도 하다.',
    },
    aiOpinion: [
      {
        title: 'AI 종합의견',
        text: '사전 분석 기준으로는 15를 중심축으로 두고 1, 19, 25, 35를 보조축으로 보는 흐름이 가장 강했다. 경자일 특유의 날카로운 반복성 때문에 직전 경자일 후보와 5끝을 높게 봤고, 14·20·25·27·39 쪽을 강하게 열어뒀다.',
      },
      {
        title: '미신 해석',
        text: '경자일의 금수 기운은 “선명한 숫자, 차가운 숫자, 반복되는 숫자”에 점수를 주는 쪽으로 읽었다. 그래서 15, 19, 35처럼 모양과 끝수가 살아 있는 번호가 좋고, 39·43 같은 고구간은 보조로만 열어두는 판단을 했다.',
      },
    ],
    resultReview: [
      {
        title: '실제 결과 분석',
        text: '1234회 실제 당첨번호는 1, 15, 19, 31, 35, 43이고 보너스는 27이었다. 제안/구매 7개 중 4등 흐름이 나온 조합은 있었지만, 1등 조합을 맞춘 것은 아니다. 정확히는 일부 조합에서 1·15·19·35 네 숫자가 겹친 것으로 기록한다.',
      },
      {
        title: '살아 있었던 판단',
        text: '4등 조합들은 1, 15, 19, 35를 잡았다. 특히 15는 7게임 중 6게임에 들어간 중심축이었고, 1·19·35도 각각 3게임씩 배치되어 실제 당첨 흐름과 겹쳤다. 경자일 최다 출현, 1·19 공동 상위 빈도, 35의 5끝 강화 논리는 일부 유효했다.',
      },
      {
        title: '가장 큰 패착',
        text: '패착의 핵심은 20번대 과신보다 15·25 고정축에 가까운 포트폴리오 쏠림이었다. 15와 25가 각각 7게임 중 6게임에 들어갔는데, 15는 맞았지만 25는 전부 비껴갔다. 한 축이 맞고 한 축이 틀리면 여러 장이 동시에 4등권에서 멈추는 구조가 된다.',
      },
      {
        title: '분석이 어떻게 바뀌어야 하나',
        text: '31·43을 “그냥 넣자”가 아니라, 강한 숫자만 뽑는 방식에서 역할별 포트폴리오로 바뀌어야 한다. 중심축 15, 보조축 1·19·35처럼 강한 후보를 잡은 뒤, 남은 자리에는 고빈도 숫자가 아니라 구간을 열어주는 변칙 후보를 의무적으로 둬야 한다.',
      },
      {
        title: '31이 올라오려면',
        text: '31은 경자일 최상위 빈도나 5끝 논리로는 잘 안 올라온다. 대신 “20번대 과밀을 줄일 때 넘어갈 첫 30번대”, “용지 기준 가운데 아래로 흐름을 연결하는 번호”, “합계와 구간 균형을 맞추는 저강도 보정수”라는 역할 점수가 있어야 후보가 된다.',
      },
      {
        title: '43이 올라오려면',
        text: '43은 39·42·45보다 예뻐 보이지 않아서 밀렸다. 다음 분석에서는 40번대 후보를 단순 고빈도/끝수로만 고르지 말고, 중간 빈도라도 앞선 중심축과 겹치지 않는 고구간 방어수라면 별도 점수를 줘야 한다. 경자일의 43은 바로 이 방어수 역할이었다.',
      },
      {
        title: '보너스 27의 함정',
        text: '27은 2게임에 들어갔고 실제 보너스가 됐다. 하지만 본번호 20번대는 0개였다. 즉 20·25·27·28을 강하게 본 방향은 “기운은 스쳤지만 본번호 선택으로는 실패”한 케이스다. 20번대는 중심축이 아니라 보조축 한 자리로 제한했어야 했다.',
      },
      {
        title: '다음 분석에 반영할 점',
        text: '다음에는 번호를 중심축, 보조축, 변칙 방어수로 나눈다. 중심축은 1개만 거의 고정하고, 보조축은 3~4게임까지만 반복한다. 각 6개 조합에는 최소 1개 이상 “근거는 약하지만 구간을 열어주는 숫자”를 넣어야 한다. 같은 후보 반복보다 틀렸을 때 살아남는 분산이 필요하다.',
      },
    ],
    picks: [
      {
        name: '66485 A · 수동 낙첨',
        numbers: [13, 14, 15, 20, 25, 39],
        note: '에너지맵 계열. 15 중심축, 13·14·39 직전/25일 경자일 후보, 20·25 날짜·연도 기운을 반영',
      },
      {
        name: '66485 B · 수동 4등',
        numbers: [1, 15, 19, 25, 28, 35],
        note: '히트맵 핵심 후보. 실제 당첨번호 1·15·19·35와 겹쳐 4등 흐름을 만든 조합',
        featured: true,
      },
      {
        name: '61755 A · 수동 낙첨',
        numbers: [14, 15, 20, 25, 27, 39],
        note: '처음 제안한 가장 경자일스러운 조합. 15, 20, 25, 14, 39 축에 보너스가 된 27까지 포함',
      },
      {
        name: '61755 B · 수동 4등',
        numbers: [1, 15, 19, 25, 35, 45],
        note: '5끝 강화형. 실제 당첨번호 1·15·19·35와 겹쳤고, 45를 고구간 보조로 둔 조합',
        featured: true,
      },
      {
        name: '61755 C · 수동 낙첨',
        numbers: [13, 15, 20, 28, 39, 42],
        note: '같은 끝수와 구간 균형형. 13·15 경자일 기운, 20·28의 20번대, 39·42 고구간을 섞은 조합',
      },
      {
        name: '구매 A · 4등당첨',
        numbers: [1, 13, 15, 19, 25, 35],
        note: '히트맵을 구매용으로 다듬은 조합. 실제 당첨번호 1·15·19·35와 겹쳐 4등당첨으로 기록',
        featured: true,
      },
      {
        name: '구매 B · 낙첨',
        numbers: [13, 14, 20, 25, 27, 45],
        note: '15를 빼고 13·14·20·25·27·45로 분산한 보조 조합. 보너스 27은 있었지만 본번호 적중이 부족했던 낙첨 조합',
      },
      {
        name: '1234회 실제 결과',
        numbers: [1, 15, 19, 31, 35, 43],
        note: '보너스 27. 1·15·19·35는 후보권에 있었고, 31·43을 놓친 것이 핵심 패착',
        result: true,
      },
    ],
  },
  {
    id: 'jeongmi',
    title: '정미일 분석',
    subtitle: '1235회 · 2026-08-01 · 정미일 토요일',
    summary: '26 중심축, 3끝·4끝, 30번대, 경자일 패착 보완, 용지 분산을 반영한 분석',
    performance: {
      total: 14,
      pending: true,
    },
    energy: {
      title: '정미일 기운',
      text: '정미일은 정화(丁火)의 섬세한 불기운과 미토(未土)의 저장·응축 기운을 같이 본다. 확 튀는 숫자보다 안쪽에서 반복되는 숫자, 붙어 있는 연속쌍, 끝수 리듬이 좋은 편이라고 해석했다. 그래서 3끝·4끝, 26 중심축, 30번대 보조가 잘 맞는 날로 잡았다.',
    },
    aiOpinion: [
      {
        title: '경자일 이후 보정',
        text: '1234회에서 1·15·19·35는 방향이 맞았지만 20번대에 힘을 너무 실었다. 정미일에서는 26을 중심축으로 보되, 20번대 숫자를 한 장에 과하게 몰아넣지 않는 쪽으로 조정했다.',
      },
      {
        title: '정미일 핵심 신호',
        text: '정미일 표본에서는 26이 가장 강한 중심축이고, 3끝·4끝 흐름이 반복적으로 살아 있다. 그래서 3, 4, 13, 33, 34 계열을 미신 점수와 데이터 점수 양쪽에서 모두 후보로 둔다.',
      },
      {
        title: '주의할 패착',
        text: '33·34 연속쌍과 26 중심축이 너무 예쁘게 보이는 게 오히려 함정일 수 있다. 한 조합 안에 정미일 상위 신호만 꽉 채우면 실제 추첨의 이탈값을 못 받으니 39, 43 같은 보정 숫자를 섞었다.',
      },
      {
        title: 'AI 최종 의견',
        text: '원문 기준 정미일 추천은 26을 모든 조합의 고정축으로 둔 다중 패턴 포트폴리오다. 추가 14번은 A주차 경자일의 잔향과 패착 구조, B주차 정미일의 중심 데이터, C주차 갑인일의 상승 기운을 함께 본 보정형이다.',
      },
    ],
    resultReview: [],
    picks: [
      {
        name: '1 · 데이터 몰빵형',
        numbers: [4, 19, 20, 26, 33, 34],
        note: '정미일 최상위 빈도 4·20·26·33·34에 19–20, 33–34 연속쌍을 함께 넣은 압축형',
      },
      {
        name: '2 · 삼연번형',
        numbers: [4, 20, 26, 32, 33, 34],
        note: '26 최다 출현, 4·20 상위 빈도, 직전 정미일 32, 32–33–34 삼연속 구조',
      },
      {
        name: '3 · 끝수 집중형',
        numbers: [3, 4, 13, 26, 33, 34],
        note: '직전 정미일 3·4, 강한 3끝/4끝, 3–4와 33–34 연속쌍을 같이 반영',
      },
      {
        name: '4 · 정석 데이터형',
        numbers: [11, 19, 20, 26, 33, 38],
        note: '전부 정미일 출현 4회 이상 후보. 19–20 연속쌍, 26 중심축, 33·38의 30번대 보강',
      },
      {
        name: '5 · 공격적 데이터형',
        numbers: [4, 19, 20, 26, 33, 38],
        note: '4·20·26·33 상위권에 19–20 연속쌍과 38을 붙인 공격형. 초반 온라인 구매 라인',
      },
      {
        name: '6 · 직전 반복 안정형',
        numbers: [11, 19, 20, 26, 32, 38],
        note: '정석 데이터형의 33을 직전 정미일 번호 32로 바꾼 안정형. 19–20, 26, 30번대 흐름 유지',
      },
      {
        name: '7 · 끝수 변칙형',
        numbers: [4, 13, 14, 26, 30, 43],
        note: '4·26 중심에 13·14·30·43을 섞어 고빈도 몰림을 줄인 변칙형. 용지 좌우·상하 분산도 보완',
      },
      {
        name: '8 · 25–26 분산형',
        numbers: [8, 11, 25, 26, 34, 39],
        note: '다른 조합들이 19–20에 몰릴 때 25–26 연속쌍을 선택한 분산형. 직전 정미일 8 포함',
      },
      {
        name: '9 · 종합 주력형',
        numbers: [4, 13, 26, 32, 34, 39],
        note: '고빈도 4·26·34, 직전 정미일 4·32, 중간 보정 13·39를 묶은 원문 별표 주력 조합',
        featured: true,
      },
      {
        name: '10 · 통합 보조형',
        numbers: [3, 19, 20, 26, 36, 43],
        note: '19–20 데이터형과 3·36·43 변칙 후보를 결합. 패착 보완과 용지 분산을 같이 본 조합',
      },
      {
        name: '11 · 정석 데이터형 중복',
        numbers: [11, 19, 20, 26, 33, 38],
        note: '4번과 같은 조합. 원문 목록에 다시 등장한 중복 추천',
        duplicate: true,
      },
      {
        name: '12 · 순수 변칙형',
        numbers: [3, 14, 25, 26, 36, 43],
        note: '빈도 최상위는 26 하나만 남기고 25–26 연속쌍, 36·43 고구간, 3·14 변칙을 섞은 조합',
      },
      {
        name: '13 · 용지 균형형',
        numbers: [4, 13, 20, 26, 34, 43],
        note: '정미일 데이터, 경자일 패착 보완, 정미일 패턴, 감각, 용지 좌우·상하 분산을 모두 통과한 최종 균형형',
        featured: true,
      },
      {
        name: '14 · 구성비 보정 종합형',
        numbers: [4, 20, 26, 30, 35, 44],
        note: 'A 경자일에서 배운 30/40번대 방어 구조를 30·35로 받고, B 정미일 중심축 26과 보조축 4·20을 세운 뒤, C 갑인일의 상승·확장 기운을 44로 열어둔 조합',
        featured: true,
      },
    ],
  },
]

const METHOD_GROUPS = [
  {
    title: '1. 일진 전용 표본 추출',
    items: [
      '특정 일진이면서 토요일인 회차만 모은다.',
      '경자일과 정미일 모두 로또 시행 이후 20회 표본을 기준으로 봤다.',
      '전체 로또 평균과 비교하되, 통계적 유의성보다 재미용 패턴 탐색으로 취급한다.',
    ],
  },
  {
    title: '2. 기본 데이터 점수',
    items: [
      '개별 번호 출현 빈도',
      '끝수 빈도: 경자일은 5끝, 정미일은 3끝·4끝을 강하게 봄',
      '구간 분포: 1~10, 11~20, 21~30, 31~40, 41~45',
      '홀짝, 합계, 연속번호, 반복쌍을 같이 확인',
    ],
  },
  {
    title: '3. 미신 점수와 에너지맵',
    items: [
      '출현 1회당 기본 점수를 준다.',
      '상위 빈도, 날짜 끝수, 2026 숫자, 월 숫자, 직전 같은 일진 번호에 가중치를 준다.',
      '상위 점수 번호를 번호판 위에 히트맵, 에너지맵, 오라맵으로 표현한다.',
    ],
  },
  {
    title: '4. 패착 보정',
    items: [
      '패착 보정은 빠진 번호를 다음에 그대로 넣는 방식이 아니라, 그 번호가 맡았던 역할을 정의한 뒤 대상 일진 안에서 같은 역할 후보를 다시 찾는 작업이다.',
      '경자일의 31은 강한 축 바깥에서 30번대 초입을 열어준 저빈도 방어수였고, 43은 추천 포트폴리오가 비워둔 고구간 중간빈도 방어수였다.',
      '다만 보정 조합을 소외수로만 채우면 또 다른 패착이 된다. 중심축, 보조축, 방어수의 구성비를 먼저 정하고 그 안에서 후보를 고른다.',
      '정미일 20회에서는 26이 중심축, 4·20·33·34가 보조축이고, 30번대가 자주 등장한다. 기존 13게임에서 비어 있던 30·35·44는 방어수 역할로 본다.',
      '여기에 B주차 정미일 앞의 A주차 경자일 잔향과, 뒤의 C주차 2026-08-08 갑인일 기운을 같이 본다. A 경자일은 30/40번대 방어 구조를 남기고, C 갑인일은 목(木)의 상승·확장 기운으로 고구간을 닫지 않게 만든다.',
      '정미일 14번 조합은 1~6번 기술을 모두 적용해 중심축 1개(26), 보조축 2개(4·20), 분포/방어수 3개(30·35·44)로 구성비를 맞췄다.',
    ],
  },
  {
    title: '5. 용지 분산 점수',
    items: [
      '숫자 자체뿐 아니라 5×9 번호판 위치를 본다.',
      '왼쪽·오른쪽, 위·중간·아래가 너무 한쪽으로 몰리면 감점한다.',
      '최종 한 장에서는 데이터 점수와 번호판 분산을 같이 통과한 조합을 고른다.',
    ],
  },
  {
    title: '6. 인접 주차 기운 참조',
    items: [
      '분석 대상이 B주차라면 B만 단독으로 보지 않고, 바로 앞 A주차와 바로 뒤 C주차의 일진 기운을 함께 참고한다.',
      'A주차는 B로 들어오기 전의 잔향과 직전 패착 구조, C주차는 B 다음으로 빠져나가는 방향과 다음 기운의 압력으로 보고, B주차 숫자 해석의 배경값으로 둔다.',
      '이번 정미일 B주차 기준으로 A주차는 2026-07-25 경자일, C주차는 2026-08-08 갑인일로 본다.',
      'A 경자일은 31·43 자체를 복사하는 것이 아니라 강한 축 밖의 30/40번대 방어 구조를 남긴다.',
      'C 갑인일은 목(木)의 상승·확장 기운이 강하므로, B주차에서 40번대 방어수를 완전히 닫지 않는 보정 근거로 사용한다.',
      '여기서 보는 것은 당첨번호의 반복 패턴이 아니라 A·B·C 주차 사이의 기운 흐름이다.',
      '최종 추천은 B주차 자체의 데이터 점수를 중심에 두되, A주차의 남은 기운과 C주차로 넘어가는 기운을 보정 의견으로 붙인다.',
    ],
  },
]

function topEntries(map, limit) {
  return Object.entries(map)
    .map(([key, value]) => ({ key: Number(key), value }))
    .sort((a, b) => b.value - a.value || a.key - b.key)
    .slice(0, limit)
}

function buildStats(draws) {
  const numberCounts = Object.fromEntries(Array.from({ length: 45 }, (_, index) => [index + 1, 0]))
  const endingCounts = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index, 0]))
  const zoneCounts = {
    '1-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-45': 0,
  }

  draws.forEach(draw => {
    draw.numbers.forEach(number => {
      numberCounts[number] += 1
      endingCounts[number % 10] += 1
      if (number <= 10) zoneCounts['1-10'] += 1
      else if (number <= 20) zoneCounts['11-20'] += 1
      else if (number <= 30) zoneCounts['21-30'] += 1
      else if (number <= 40) zoneCounts['31-40'] += 1
      else zoneCounts['41-45'] += 1
    })
  })

  return {
    topNumbers: topEntries(numberCounts, 10),
    topEndings: topEntries(endingCounts, 5),
    zoneCounts: Object.entries(zoneCounts),
  }
}

function getHitNumbers(pick, result) {
  return pick.numbers.filter(number => result.numbers.includes(number))
}

function NumberBall({ value, muted = false, hit = false, bonus = false }) {
  const tone =
    muted ? 'bg-[#d8e2f0] text-[#6b86b8]' :
    bonus ? 'bg-white text-[#0044cc] ring-2 ring-[#0044cc]' :
    hit ? 'bg-[#0044cc] text-white ring-2 ring-[#9fc4ff]' :
    value <= 10 ? 'bg-[#f5c84b] text-[#4a3600]' :
    value <= 20 ? 'bg-[#5aa8ff] text-white' :
    value <= 30 ? 'bg-[#ef6f6c] text-white' :
    value <= 40 ? 'bg-[#8a8f9c] text-white' :
    'bg-[#56b46f] text-white'

  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-sm ${tone}`}>
      {value}
    </span>
  )
}

function StatCard({ title, value, caption }) {
  return (
    <div className="rounded-lg border border-[#d5e8ff] bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-[#5577bb]">{title}</p>
      <p className="mt-2 text-2xl font-black text-[#12376f]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#6b86b8]">{caption}</p>
    </div>
  )
}

function getSourceLabel(source) {
  return source === 'manual' ? '직접 입력' : source
}

function PerformanceBadge({ performance }) {
  if (!performance) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
      <span className="rounded-full bg-[#e8f2ff] px-3 py-1 text-[#0044cc]">
        제안 {performance.total}게임
      </span>
      {performance.pending ? (
        <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[#8a5a00]">
          결과 대기
        </span>
      ) : (
        performance.items.map(item => (
          <span
            key={item.label}
            className={`rounded-full px-3 py-1 ${
              item.label.includes('등') ? 'bg-[#e9f8ef] text-[#137343]' : 'bg-[#f1f4f8] text-[#6b86b8]'
            }`}
          >
            {item.label} {item.count}개
          </span>
        ))
      )}
    </div>
  )
}

function DrawHistoryList({ draws }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [ganjiFilter, setGanjiFilter] = useState('all')
  const ganjiOptions = useMemo(
    () => [...new Set(draws.map(draw => draw.dayGanji).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
    [draws]
  )
  const allDraws = useMemo(
    () => [...draws]
      .filter(draw => ganjiFilter === 'all' || draw.dayGanji === ganjiFilter)
      .reverse(),
    [draws, ganjiFilter]
  )
  const pageCount = Math.ceil(allDraws.length / DRAW_PAGE_SIZE)
  const visibleDraws = allDraws.slice((page - 1) * DRAW_PAGE_SIZE, page * DRAW_PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [ganjiFilter])

  return (
    <section className="rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div>
          <h2 className="text-lg font-black text-[#0044cc]">당첨번호 목록</h2>
          <p className="mt-1 text-xs font-bold text-[#5577bb]">
            통합 JSON 기준, 최신순 {allDraws.length}개
          </p>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-[#5577bb] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-[#e3efff] p-4">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-xs font-black text-[#5577bb]">
                {allDraws.length ? ((page - 1) * DRAW_PAGE_SIZE) + 1 : 0}~{Math.min(page * DRAW_PAGE_SIZE, allDraws.length)}번째 표시
              </p>
              <label className="flex items-center gap-2 text-xs font-black text-[#5577bb]">
                일진
                <select
                  value={ganjiFilter}
                  onChange={event => setGanjiFilter(event.target.value)}
                  className="rounded-md border border-[#bbd0ee] bg-white px-3 py-2 text-xs font-black text-[#0044cc] outline-none focus:ring-2 focus:ring-[#9fc4ff]"
                >
                  <option value="all">전체</option>
                  {ganjiOptions.map(ganji => (
                    <option key={ganji} value={ganji}>{ganji}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-md border border-[#bbd0ee] px-3 py-2 text-xs font-black text-[#0044cc] disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs font-black text-[#12376f]">{page} / {Math.max(pageCount, 1)}</span>
              <button
                type="button"
                onClick={() => setPage(current => Math.min(pageCount, current + 1))}
                disabled={page === pageCount || pageCount === 0}
                className="rounded-md border border-[#bbd0ee] px-3 py-2 text-xs font-black text-[#0044cc] disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            {visibleDraws.map(draw => (
              <article
                key={`${draw.source}-${draw.drawNo}`}
                className="grid gap-3 rounded-lg border border-[#e3efff] bg-[#f8fbff] p-3 md:grid-cols-[130px_1fr_auto]"
              >
                <div>
                  <p className="text-sm font-black text-[#12376f]">{draw.drawNo}회</p>
                  <p className="mt-1 text-xs font-bold text-[#6b86b8]">{draw.drawDate}</p>
                  <p className="mt-1 text-xs font-black text-[#0044cc]">{draw.dayGanji}일 · {getSourceLabel(draw.source)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {draw.numbers.map(number => <NumberBall key={number} value={number} />)}
                  <span className="text-xs font-black text-[#5577bb]">보너스</span>
                  <NumberBall value={draw.bonus} bonus />
                </div>
                {typeof draw.firstWinnerCount === 'number' && (
                  <div className="text-xs font-bold text-[#5577bb] md:text-right">
                    <p>1등 {draw.firstWinnerCount.toLocaleString()}명</p>
                    <p>{draw.firstPrizeAmount.toLocaleString()}원</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function CommentarySection({ title, items, tone = 'blue' }) {
  if (!items?.length) return null

  const headingColor = tone === 'amber' ? 'text-[#8a5a00]' : 'text-[#0044cc]'

  return (
    <div className="mt-4">
      <h3 className={`text-sm font-black ${headingColor}`}>{title}</h3>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        {items.map(item => (
          <article key={item.title} className="rounded-lg bg-[#f8fbff] p-3">
            <h4 className="text-sm font-black text-[#12376f]">{item.title}</h4>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#40689f]">{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function AnalysisCommentary({ analysis }) {
  const hasResult = Boolean(analysis.result)
  const unionHits = hasResult
    ? [...new Set(
        analysis.picks
          .filter(pick => !pick.result)
          .flatMap(pick => getHitNumbers(pick, analysis.result))
      )].sort((a, b) => a - b)
    : []
  const missed = hasResult
    ? analysis.result.numbers.filter(number => !unionHits.includes(number))
    : []

  return (
    <div className="mb-4 rounded-lg border border-[#bbd0ee] bg-white p-4">
      {analysis.energy && (
        <div className="rounded-lg bg-[#fff8e8] p-3">
          <h3 className="text-sm font-black text-[#8a5a00]">{analysis.energy.title}</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#6f551e]">{analysis.energy.text}</p>
        </div>
      )}

      <CommentarySection title="AI 종합의견" items={analysis.aiOpinion} />

      {hasResult && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[#eef6ff] p-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#0044cc]">{analysis.result.drawNo}회 실제 당첨번호</p>
            <p className="mt-1 text-xs font-bold text-[#5577bb]">보너스 {analysis.result.bonus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.result.numbers.map(number => <NumberBall key={number} value={number} hit />)}
            <NumberBall value={analysis.result.bonus} bonus />
          </div>
        </div>
      )}

      {!hasResult && (
        <div className="mt-4 rounded-lg bg-[#eef6ff] p-3">
          <p className="text-sm font-black text-[#0044cc]">AI 의견</p>
          <p className="mt-1 text-xs font-bold text-[#5577bb]">아직 당첨 결과가 없는 사전 분석입니다.</p>
        </div>
      )}

      <CommentarySection title="실제 결과 분석" items={analysis.resultReview} tone="amber" />

      {hasResult && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-[#e9f8ef] px-3 py-1 text-[#137343]">
            추천 후보와 겹친 번호: {unionHits.join(', ') || '없음'}
          </span>
          <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[#8a5a00]">
            추천 후보에서 빠진 당첨번호: {missed.join(', ') || '없음'}
          </span>
        </div>
      )}
    </div>
  )
}

function DataTab({ draws, loading, error }) {
  const stats = useMemo(() => draws.length ? buildStats(draws) : null, [draws])
  const latest = draws.at(-1)
  const csvLatest = [...draws].reverse().find(draw => draw.source === 'CSV')

  if (loading) {
    return (
      <div className="rounded-lg border border-[#d5e8ff] bg-white p-6 text-sm font-bold text-[#5577bb]">
        통합 JSON 데이터 읽는 중...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#f0b8b8] bg-white p-6 text-sm font-bold text-[#b53b3b]">
        {error}
      </div>
    )
  }

  if (!latest || !stats) return null

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="통합 데이터" value={`${draws.length}회`} caption="JSON 기준 1회부터 1234회까지" />
        <StatCard title="최신 회차" value={`${latest.drawNo}회`} caption={`${latest.drawDate} · ${latest.dayGanji}일 · ${getSourceLabel(latest.source)}`} />
        <StatCard title="CSV 최신 회차" value={`${csvLatest.drawNo}회`} caption={`${csvLatest.drawDate} · ${csvLatest.dayGanji}일`} />
        <StatCard title="CSV 최신 1등" value={`${csvLatest.firstWinnerCount}명`} caption={`${csvLatest.firstPrizeAmount.toLocaleString()}원`} />
      </section>

      <section className="rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#e3efff] px-4 py-4">
          <Database size={18} className="text-[#0044cc]" />
          <h2 className="text-lg font-black text-[#0044cc]">통합 JSON 전체 데이터 요약</h2>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-3">
          <article className="rounded-lg border border-[#d5e8ff] bg-[#f8fbff] p-4">
            <h3 className="text-sm font-black text-[#12376f]">전체 빈출 번호 Top 10</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {stats.topNumbers.map(item => (
                <div key={item.key} className="flex items-center gap-1">
                  <NumberBall value={item.key} />
                  <span className="text-xs font-black text-[#5577bb]">{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#d5e8ff] bg-[#f8fbff] p-4">
            <h3 className="text-sm font-black text-[#12376f]">끝수 Top 5</h3>
            <div className="mt-3 flex flex-col gap-2">
              {stats.topEndings.map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                  <span className="text-sm font-bold text-[#12376f]">{item.key}끝</span>
                  <span className="text-sm font-black text-[#0044cc]">{item.value}회</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#d5e8ff] bg-[#f8fbff] p-4">
            <h3 className="text-sm font-black text-[#12376f]">구간 분포</h3>
            <div className="mt-3 flex flex-col gap-2">
              {stats.zoneCounts.map(([zone, count]) => (
                <div key={zone} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                  <span className="text-sm font-bold text-[#12376f]">{zone}</span>
                  <span className="text-sm font-black text-[#0044cc]">{count}회</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <DrawHistoryList draws={draws} />
    </div>
  )
}

function AnalysisPanel({ analysis, open, onToggle }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f8fbff]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-[#0044cc]" />
            <h2 className="text-lg font-black text-[#0044cc]">{analysis.title}</h2>
          </div>
          <p className="mt-1 text-xs font-bold text-[#5577bb]">{analysis.subtitle}</p>
          <PerformanceBadge performance={analysis.performance} />
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#40689f]">{analysis.summary}</p>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-[#5577bb] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-[#e3efff] bg-[#f8fbff] p-4">
          <AnalysisCommentary analysis={analysis} />
          <div className="grid gap-3 lg:grid-cols-2">
            {analysis.picks.map((pick) => {
              const hits = analysis.result ? getHitNumbers(pick, analysis.result) : []

              return (
                <article key={pick.name} className="rounded-lg border border-[#d5e8ff] bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-[#12376f]">{pick.name}</p>
                    {pick.duplicate && (
                      <span className="rounded-full bg-[#fff4d8] px-2 py-0.5 text-[11px] font-black text-[#8a5a00]">
                        중복
                      </span>
                    )}
                    {pick.featured && (
                      <span className="rounded-full bg-[#e9f8ef] px-2 py-0.5 text-[11px] font-black text-[#137343]">
                        주력
                      </span>
                    )}
                    {pick.result && (
                      <span className="rounded-full bg-[#e9f8ef] px-2 py-0.5 text-[11px] font-black text-[#137343]">
                        결과
                      </span>
                    )}
                    {hits.length > 0 && !pick.result && (
                      <span className="rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[11px] font-black text-[#0044cc]">
                        {hits.length}개 적중
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pick.numbers.map(number => (
                      <NumberBall
                        key={number}
                        value={number}
                        hit={analysis.result?.numbers.includes(number)}
                        muted={analysis.result && !analysis.result.numbers.includes(number)}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-[#5577bb]">{pick.note}</p>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function MethodsTab() {
  return (
    <section className="rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
      <div className="border-b border-[#e3efff] px-4 py-4">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-[#0044cc]" />
          <h2 className="text-lg font-black text-[#0044cc]">분석기술 정리</h2>
        </div>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {METHOD_GROUPS.map(group => (
          <article key={group.title} className="rounded-lg border border-[#d5e8ff] bg-[#f8fbff] p-4">
            <h3 className="text-sm font-black text-[#12376f]">{group.title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {group.items.map(item => (
                <li key={item} className="text-sm font-medium leading-relaxed text-[#40689f]">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function LottoPage() {
  const [tab, setTab] = useState('picks')
  const [openId, setOpenId] = useState(null)
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    fetch(LOTTO_DATA_URL)
      .then(response => {
        if (!response.ok) throw new Error(`JSON 로드 실패: ${response.status}`)
        return response.json()
      })
      .then(data => {
        if (!alive) return
        setDraws(data.draws)
        setLoading(false)
      })
      .catch(err => {
        if (!alive) return
        setError(err.message)
        setLoading(false)
      })

    return () => { alive = false }
  }, [])

  return (
    <div className="min-h-full bg-[#f5f8ff] px-4 py-5 text-[#12376f] md:px-8 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5577bb]">Lotto Lab</p>
          <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:items-end">
            <h1 className="text-3xl font-black text-[#0044cc]">로또 분석</h1>
            <p className="rounded-lg border border-[#bbd0ee] bg-white px-3 py-2 text-xs font-black leading-relaxed text-[#5577bb]">
              웹앱은 기록/ 정리만하고, 분석과 최종 제안은 항상 생성형 AI의 도움을 받아 받는다.
            </p>
          </div>
        </header>

        <div className="flex rounded-lg border border-[#bbd0ee] bg-white p-1 shadow-sm">
          {[
            ['picks', '추천번호'],
            ['methods', '분석기술'],
            ['data', '당첨데이터'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`h-10 flex-1 rounded-md text-sm font-black transition-colors ${
                tab === id ? 'bg-[#0044cc] text-white' : 'text-[#5577bb] hover:bg-[#f0f5ff]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'picks' && (
          <div className="flex flex-col gap-3">
            {ANALYSES.map((analysis) => (
              <AnalysisPanel
                key={analysis.id}
                analysis={analysis}
                open={openId === analysis.id}
                onToggle={() => setOpenId(openId === analysis.id ? '' : analysis.id)}
              />
            ))}
          </div>
        )}
        {tab === 'methods' && <MethodsTab />}
        {tab === 'data' && <DataTab draws={draws} loading={loading} error={error} />}
      </div>
    </div>
  )
}
