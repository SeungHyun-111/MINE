import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Database, Download, FlaskConical, Ticket } from 'lucide-react'

const LOTTO_DATA_URL = '/data/lotto-draws.json'
const DRAW_PAGE_SIZE = 100

const CSV_COLUMNS = [
  'draw_no',
  'draw_date',
  'num1',
  'num2',
  'num3',
  'num4',
  'num5',
  'num6',
  'bonus',
  'first_winner_count',
  'first_prize_amount',
  'first_total_amount',
  'second_winner_count',
  'second_prize_amount',
  'third_winner_count',
  'third_prize_amount',
  'total_sales_amount',
]

const GYEONGJA_RESULT = {
  drawNo: 1234,
  drawDate: '2026-07-25',
  numbers: [1, 15, 19, 31, 35, 43],
  bonus: 27,
}

const JEONGMI_RESULT = {
  drawNo: 1235,
  drawDate: '2026-08-01',
  numbers: [6, 7, 11, 15, 39, 43],
  bonus: 20,
}

const GAPIN_RESULT = {
  drawNo: 1236,
  drawDate: '2026-08-08',
  numbers: [12, 18, 21, 29, 34, 38],
  bonus: 10,
}

const SINYU_RESULT = {
  drawNo: 1237,
  drawDate: '2026-08-15',
  numbers: [10, 20, 23, 34, 37, 40],
  bonus: 36,
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
    result: JEONGMI_RESULT,
    performance: {
      total: 14,
      items: [
        { label: '3개 적중', count: 1 },
        { label: '2개 적중', count: 4 },
        { label: '낙첨', count: 9 },
      ],
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
    resultReview: [
      {
        title: '실제 결과 분석',
        text: '1235회 실제 당첨번호는 6, 7, 11, 15, 39, 43이고 보너스는 20이었다. 정미일 분석은 26 중심축을 너무 강하게 잡았고, 실제 결과는 6·7 초반 연속, 11·15의 10번대, 39·43 고구간 방어수 쪽으로 열렸다.',
      },
      {
        title: '살아 있었던 판단',
        text: '정미일 추천 후보 안에서는 11, 15, 20, 39, 43이 살아 있었다. 특히 20은 본번호가 아니라 보너스로 들어왔고, 39·43은 패착 보완용 고구간 방어수로 열어둔 판단이 맞았다.',
      },
      {
        title: '가장 큰 패착',
        text: '26을 모든 조합에 넣은 것이 가장 큰 쏠림이었다. 정미일 표본의 최상위 중심축이라는 근거는 있었지만, 한 숫자를 전 게임에 고정하면서 6·7 같은 초반 이탈값을 받을 여지가 줄었다.',
      },
      {
        title: '갑인일에 넘길 교훈',
        text: '다음 갑인일에서는 중심축을 1개로 두더라도 지역별 조합마다 다르게 분산한다. 직전 결과에서 살아난 7·11·15·39·43은 잔향으로 보되 그대로 복사하지 않고, 갑인일 표본의 18·16·31·1끝·5끝 흐름과 섞어야 한다.',
      },
    ],
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
  {
    id: 'gapin',
    title: '갑인일 지역 수동 분석',
    subtitle: '1236회 · 2026-08-08 · 갑인일 토요일',
    summary: '갑인일 20회 표본, 1끝·5끝, 11~20 강세, 연속번호, 정미일 패착 보정, 지역 기운을 결합한 10개 추천 조합',
    result: GAPIN_RESULT,
    performance: {
      total: 10,
      items: [
        { label: '2개 적중', count: 2 },
        { label: '1개 적중', count: 5 },
        { label: '낙첨', count: 3 },
      ],
    },
    energy: {
      title: '갑인일 기운',
      text: '갑인일은 갑목(甲木)이 인목(寅木)을 타고 위로 뻗는 날로 본다. 숫자 흐름은 시작점이 분명한 1끝, 상승감이 있는 5끝, 그리고 11~20 구간의 줄기가 강하다. 다만 목기운이 위로만 솟으면 중후반 구간을 비우기 쉬우므로 30번대와 40번대 방어수를 지역별로 다르게 열어둔다.',
    },
    aiOpinion: [
      {
        title: '1. 일진 전용 표본 추출',
        text: '이번 대상은 2026-08-08 1236회 갑인일이다. 로또 시행 이후 이번 회차 전 갑인일 토요일 표본은 36, 96, 156, 216, 276, 336, 396, 456, 516, 576, 636, 696, 756, 816, 876, 936, 996, 1056, 1116, 1176회로 총 20회다.',
      },
      {
        title: '2. 기본 데이터 점수',
        text: '갑인일 최상위 번호는 18이 7회, 7·16이 6회, 15·31이 5회다. 1·11·20·21·34는 4회 출현했고, 5·10·17·23·28·30·35·39·40·41은 3회 출현했다. 구간은 11~20이 35개로 가장 강하다.',
      },
      {
        title: '3. 미신 점수와 에너지맵',
        text: '끝수는 1끝이 20회로 가장 강하고, 5끝 16회, 0끝·8끝 각 13회, 6끝 12회, 7끝 11회 순서다. 갑목의 시작성은 1끝, 인목의 상승성은 5끝과 30번대 확장수에 점수를 준다.',
      },
      {
        title: '4. 패착 보정',
        text: '1235회 정미일에서는 26을 모든 조합에 고정한 것이 패착이었다. 갑인일에서는 18·7·16·15·31을 중심 후보로 보되 한 숫자에 전부 걸지 않고, 지역별로 중심축과 방어수를 다르게 배치한다.',
      },
      {
        title: '5. 용지 분산 점수',
        text: '11~20 구간이 강하지만 6개 중 3개 이상을 몰아넣지 않는다. 1~10, 21~30, 31~40, 41~45 중 최소 두 구간 이상을 열어두고, 40번대는 약한 구간이지만 방어수로 한두 조합에 남긴다.',
      },
      {
        title: '6. 인접 주차 기운 참조',
        text: '직전 1235회 결과 6·7·11·15·39·43 중 갑인일 표본과 겹치는 7·11·15·39는 살아 있는 잔향으로 본다. 43은 직전 고구간 잔향이지만 갑인일 표본에서는 약하므로 직접 반복보다 40·41·45 같은 역할 후보로 치환한다.',
      },
      {
        title: '지역 기운 결합',
        text: '영등포는 철길·금융·유동성, 부산은 바다·항구·큰 물길, 천안은 교차점·중심 이동, 변산은 산과 바다·해넘이의 닫힘과 열림으로 본다. 같은 갑인일 데이터라도 지역마다 중심축과 방어수를 다르게 둔다.',
      },
    ],
    resultReview: [
      {
        title: '실제 결과 분석',
        text: '1236회 실제 당첨번호는 12, 18, 21, 29, 34, 38이고 보너스는 10이었다. 추천 조합 10개 중 2개 적중 조합이 2개, 1개 적중 조합이 5개, 본번호 미적중 조합이 3개로 기록된다.',
      },
      {
        title: '맞았던 흐름',
        text: '갑인일 핵심축으로 봤던 18은 여러 조합에서 살아남았고, 부산·온라인 균형형 쪽의 34도 실제 당첨번호에 들어왔다. 천안 수동은 18·21, 온라인 CODE D는 18·34로 각각 2개를 맞췄다.',
      },
      {
        title: '빗나간 지점',
        text: '7·16·31을 강하게 본 중심축은 실제 결과에서 빠졌고, 12·29·38 쪽의 중후반 분산을 충분히 열지 못했다. CODE E의 10은 보너스에는 걸렸지만 본번호 적중으로 보지는 않는다.',
      },
    ],
    picks: [
      {
        name: '영등포 수동 · 주력',
        numbers: [7, 11, 18, 24, 31, 39],
        note: '교통, 철길, 금융, 유동성의 기운. 갑인일 핵심 7·18·31에 직전 생존 잔향 11·39를 붙이고, 24로 중간 구간을 열어둔 이번 주 최주력 조합',
        featured: true,
      },
      {
        name: '부산 수동',
        numbers: [5, 16, 20, 34, 40, 41],
        note: '바다와 항구, 큰 물길의 기운. 갑인일 강수 16·20·34에 5끝을 세우고, 40·41로 고구간 방어를 두껍게 열어둔 조합',
      },
      {
        name: '천안 수동',
        numbers: [1, 15, 18, 21, 30, 35],
        note: '교차점과 중심 이동의 기운. 1끝·5끝을 강하게 받고 18을 중심축으로 두며, 30·35로 갑인일 상승 흐름을 받는 균형형',
        featured: true,
      },
      {
        name: '변산 수동',
        numbers: [7, 16, 23, 28, 31, 45],
        note: '산과 바다, 해넘이, 끝에서 다시 열리는 기운. 7·16·31 핵심에 8끝 28과 고구간 방어 45를 섞은 변칙 방어형',
      },
      {
        name: '사용자 추천',
        numbers: [7, 15, 16, 20, 31, 40],
        note: '사용자 직접 추천 조합. 갑인일 상위권인 7·16·15·31을 강하게 묶고, 20과 40으로 0끝·중후반 방어 흐름을 보강한 데이터 압축형',
        featured: true,
      },
      {
        name: 'GPT추천(온라인구매) CODE A · 데이터',
        numbers: [7, 16, 18, 23, 31, 41],
        note: '18 중심, 7·16 핵심, 23 중간빈도, 31과 41을 붙인 데이터형. 갑인일 과거 표본 기준 최고 일치는 3개로 보고 기록',
      },
      {
        name: 'GPT추천(온라인구매) CODE B · 1끝',
        numbers: [1, 11, 18, 20, 35, 41],
        note: '갑인일 최강 끝수인 1끝을 1·11·41로 세우고, 18 중심축과 20·35 보조 흐름을 결합한 1끝 강화형',
      },
      {
        name: 'GPT추천(온라인구매) CODE C · 연속형',
        numbers: [7, 15, 21, 22, 31, 40],
        note: '21–22 연속쌍을 의도적으로 열어둔 조합. 7·15·31의 갑인일 핵심 후보와 40번대 방어 흐름을 함께 반영',
      },
      {
        name: 'GPT추천(온라인구매) CODE D · 균형형',
        numbers: [5, 16, 18, 24, 34, 39],
        note: '이번 온라인구매 주력. 갑인일 핵심수 18·16을 포함하고, 30번대와 1~45 분산, 연속 없음, 과거 조합과의 충분한 차이, 용지 균형을 모두 본 조합',
        featured: true,
      },
      {
        name: 'GPT추천(온라인구매) CODE E · 변칙형',
        numbers: [10, 17, 18, 28, 35, 45],
        note: '18을 중심에 두고 28·35·45로 중후반 변칙을 열며, 10·17을 붙여 0끝과 7끝의 보조 리듬을 살린 변칙형',
      },
    ],
  },
  {
    id: 'sinyu',
    title: '신유일 · 광복절 토요일 분석',
    subtitle: '1237회 · 2026-08-15 · 신유일 토요일 · 광복절',
    summary: '신유일 20회 표본과 광복절 토요일 과거 회차를 결합하고, 사용자 원형 분석 3개를 함께 기록',
    result: SINYU_RESULT,
    performance: {
      total: 7,
      items: [
        { label: '1개 적중', count: 2 },
        { label: '미적중', count: 5 },
      ],
    },
    energy: {
      title: '신유일 + 광복절 기운',
      text: '신유일 표본에서는 33이 가장 강하고, 7·13·16·22가 뒤를 받친다. 끝수는 3끝, 7끝, 5끝이 강하며, 광복절 토요일 과거 회차에서는 3·8·42와 중후반 방어 흐름이 반복적으로 보였다.',
    },
    aiOpinion: [
      {
        title: '신유일 표본',
        text: '이전 신유일 토요일 20회 표본에서 33은 7회 출현으로 가장 강했다. 7·13·16·22는 각 5회, 3·12·17·27·37은 각 4회로 뒤를 받쳤다.',
      },
      {
        title: '광복절 토요일 보정',
        text: '로또 시행 이후 광복절이 토요일이었던 회차는 2009년, 2015년, 2020년이 있었고, 3·8·42가 눈에 띄게 반복됐다. 특히 42는 고구간 방어수로 열어둘 가치가 있다.',
      },
      {
        title: '패착 보정',
        text: '최근 3회 분석의 패착은 중심축을 너무 강하게 고정한 점이었다. 이번에는 33을 가장 강하게 보되, 모든 판단을 33 하나에 몰지 않고 신유일 핵심수와 광복절 반복수를 나눠 담는다.',
      },
    ],
    resultReview: [
      {
        title: '실제 결과 분석',
        text: '1237회 실제 당첨번호는 10, 20, 23, 34, 37, 40이고 보너스는 36이었다. 추천 조합 7개 중 37 하나를 맞춘 조합이 2개, 본번호 미적중 조합이 5개로 기록된다.',
      },
      {
        title: '맞은 흐름',
        text: '신유일 표본에서 37은 4회 출현과 강한 7끝 흐름으로 열어둔 숫자였고, 사용자 추천 1과 사용자 추천 3에 들어가 실제 본번호와 겹쳤다.',
      },
      {
        title: '빗나간 지점',
        text: '33을 중심축으로 너무 강하게 봤고, 실제 결과의 10·20·23·34·40처럼 0끝과 20~40 구간으로 넓게 퍼지는 흐름을 충분히 받지 못했다. 광복절 반복수로 본 3·8·42도 이번 회차에서는 작동하지 않았다.',
      },
    ],
    picks: [
      {
        name: '신유일 주력',
        numbers: [7, 13, 16, 22, 33, 42],
        note: '신유일 표본 최강수 33과 상위권 7·13·16·22를 중심으로 두고, 광복절 토요일 고구간 반복수 42를 방어수로 붙인 주력 조합',
        featured: true,
        purchased: true,
      },
      {
        name: '온라인 구매용 · 광복절 보정',
        numbers: [3, 8, 18, 24, 33, 42],
        note: '광복절 토요일 과거값을 가장 직접적으로 반영한 조합. 반복수 3·8·42에 신유일 최강수 33, 그리고 2009년 광복절 흐름의 18·24를 함께 배치',
        featured: true,
      },
      {
        name: '사용자 추천 1 · 가장 신유일스러운 조합',
        numbers: [7, 13, 16, 22, 33, 37],
        note: '빈도, 끝수, 구간, 직전 동일 일진을 겹친 정석형. 33 단독 1위, 7·13·16·22 공동 최상위권, 37은 4회 출현과 강한 7끝을 반영',
        featured: true,
        purchased: true,
      },
      {
        name: '사용자 추천 2 · 3끝·7끝 강화형',
        numbers: [3, 13, 17, 27, 33, 43],
        note: '신유일에서 가장 강한 3끝과 7끝을 정면으로 가져간 조합. 3·13·33·43의 3끝, 17·27의 7끝을 묶은 신유일 원형 강화형',
        featured: true,
        purchased: true,
      },
      {
        name: '사용자 추천 3 · 연속수·날짜형',
        numbers: [7, 12, 13, 15, 33, 37],
        note: '12-13 반복 연속쌍, 8월 15일 날짜수 15, 최다 출현 33, 강한 7끝 7·37을 결합한 조합. 11~20 구간을 12·13·15로 의도적으로 강조',
        featured: true,
        purchased: true,
      },
      {
        name: '에너지맵 추천 1 · 조건 중첩형',
        numbers: [3, 7, 13, 16, 17, 33],
        note: '3끝·7끝, 11~20 구간, 반복 연속쌍, 직전 신유일, 8월 15일 날짜 가중이 겹치는 숫자를 우선한 에너지맵 압축 조합',
        purchased: true,
      },
      {
        name: '에너지맵 추천 2 · 초중반 몰빵형',
        numbers: [3, 7, 13, 15, 16, 17],
        note: '단순 빈도보다 여러 신유일 조건이 동시에 겹치는 숫자를 우선한 조합. 30번대·40번대 방어수 없이 초중반 흐름에 집중',
      },
    ],
  },
  {
    id: 'mujin',
    title: '무진일 분석',
    subtitle: '1238회 · 2026-08-22 · 무진일 주요수',
    summary: '무진일 빈도 TOP, 현재 HOT 흐름, 잠복 복귀수, 날짜 변칙수를 나눠 구성한 5장 조합',
    performance: {
      total: 5,
      pending: true,
    },
    energy: {
      title: '무진일 기운',
      text: '이번 무진일은 11을 단독 1위 축으로 보고, 13·16·30·32·34의 상위 빈도를 강하게 반영한다. 다만 무진일 자체에만 매달리지 않고 최근 20회와 최근 10회 흐름, 장기 미출현 복귀 가능성, 8월 22일의 날짜수까지 별도 축으로 나눠 포트폴리오를 구성한다.',
    },
    aiOpinion: [
      {
        title: '중심 판단',
        text: 'CODE A는 무진일 자체 빈도만 가장 정석적으로 믿는 조합이고, CODE B는 무진일 강세와 최근 HOT 흐름이 동시에 겹치는 숫자를 우선한다. 특히 34는 직전 1237회에 나왔지만 현재 데이터상 여전히 강하기 때문에 제거하지 않는다.',
      },
      {
        title: '보정 판단',
        text: 'CODE C는 최근 미출현이 길어진 숫자 중 무진일에서 완전히 약하지 않은 후보를 복귀 축으로 본다. 32는 무진일 최상위권이면서 최근 14회 동안 안 나온 숫자라 일진 HOT과 전체 잠복이 만나는 핵심 교차점이다.',
      },
      {
        title: '흐름 판단',
        text: 'CODE D는 무진일 최강 숫자보다 현재 실제 추첨 흐름에서 계속 보이는 숫자를 더 많이 본 조합이다. CODE E는 8월 22일의 날짜수에서 출발하지만, 14·30·34·43이 무진일 데이터와 다시 연결되는 변칙형이다.',
      },
    ],
    resultReview: [],
    picks: [
      {
        name: 'CODE A · 무진일 정통형',
        numbers: [11, 13, 16, 30, 32, 34],
        note: '가장 정석적으로 뽑은 조합. 11은 무진일 단독 1위 6회, 13·16·30·32·34는 전부 5회로 사실상 무진일 빈도 TOP만으로 구성했다. 11~20 강구간 3개와 30번대 3개를 둔, 무진일 자체를 가장 강하게 믿는 조합.',
        purchased: true,
      },
      {
        name: 'CODE B · 무진일 × 현재 HOT 교차형',
        numbers: [13, 14, 18, 23, 34, 42],
        note: '주력 조합. 13·14·34는 무진일 각 5회, 18·23·42는 각 4회다. 최근 20회에서도 34와 18은 5회, 13과 42는 4회라 무진일에서도 강하고 현재 전체 흐름에서도 살아 있는 숫자를 우선했다.',
        featured: true,
        purchased: true,
      },
      {
        name: 'CODE C · 잠복 복귀형',
        numbers: [5, 11, 17, 32, 43, 45],
        note: '지난주 10·23 같은 숫자를 놓치지 않기 위한 별도 축. 현재 미출현은 5가 24회, 32가 14회, 45가 13회, 17이 11회다. 32는 무진일 5회 최상위권이면서 최근에는 잠복 중이라 이번 조합의 핵심.',
        purchased: true,
      },
      {
        name: 'CODE D · 현재 흐름 강세형',
        numbers: [12, 15, 18, 28, 31, 34],
        note: '무진일에 너무 매달리지 않고 현재 로또 전체 흐름을 더 많이 본 조합. 최근 20회에서 28은 6회, 18과 34는 5회, 15와 31은 4회이고, 최근 10회에서도 12·15·31·34가 각 3회로 계속 보인다.',
        purchased: true,
      },
      {
        name: 'CODE E · 날짜·무진일 변칙형',
        numbers: [8, 14, 22, 30, 34, 43],
        note: '8월 22일을 미신적으로 반영한 조합. 8월의 8, 22일의 22, 8+22의 30, 22-8의 14를 쓰되 14·30·34는 무진일 각 5회, 43은 4회라 날짜수가 무진일 데이터와 다시 연결된다.',
        purchased: true,
      },
      {
        name: '미구매 · 무진일 역발상 조합',
        numbers: [3, 10, 19, 25, 37, 40],
        note: '무진일 과거 회차에서 반복 출현한 중간 빈도수 위주로 구성하고, 지난주처럼 최상위 빈출수에만 몰리지 않도록 10·20·30번대를 분산. 최근 당첨에서 확인된 0끝 흐름은 10·40 두 개까지만 열어두고, 19·25·37로 홀짝과 고저 구간을 분산한 역발상 조합.',
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

const RETROSPECTIVE_GROUPS = [
  {
    title: '3회차 성과 요약',
    items: [
      '작성일: 2026-08-12',
      '경자일 1234회는 7게임 중 4개 적중 조합 3개가 나왔다. 강한 축을 잡는 데는 성공했지만 31·43 방어수를 충분히 열지 못했다.',
      '정미일 1235회는 14게임 중 3개 적중 1개, 2개 적중 4개였다. 26을 과하게 고정한 것이 가장 큰 패착이었다.',
      '갑인일 1236회는 10게임 중 2개 적중 2개, 1개 적중 5개였다. 18·34 흐름은 잡았지만 12·29·38 분산을 놓쳤다.',
      '전체 31게임 기준 3개 이상 적중은 4게임, 2개 이상 적중은 10게임이다. 2개까지는 자주 닿지만 3개 이상으로 올리는 장치가 부족했다.',
    ],
  },
  {
    title: '반복된 패착',
    items: [
      '한 숫자를 중심축으로 강하게 고정하면 실제 결과가 그 축을 비껴갈 때 전체 조합이 같이 무너졌다.',
      '직전 회차에서 살아남은 숫자를 너무 직접적으로 복사했다. 역할은 참고하되 번호 자체는 분산 후보로 바꿔야 한다.',
      '고빈도 번호를 많이 넣은 조합은 설명은 좋아졌지만 실제 당첨의 이탈값을 받는 힘이 약했다.',
      '30번대와 40번대 방어를 열어두는 판단은 맞았지만, 구체 후보가 31·40·43·45 쪽에 몰려 34·38 같은 중간 방어수를 놓쳤다.',
    ],
  },
  {
    title: '맞았던 판단',
    items: [
      '경자일은 1·15·19·35 축을 잡아 4개 적중 조합을 만들었다. 일진 표본과 끝수 흐름을 같이 본 방식은 유효했다.',
      '정미일은 11·15·39·43의 잔향과 보너스 20을 일부 조합에서 포착했다. 직전 흐름을 완전히 버리지 않은 점은 맞았다.',
      '갑인일은 18을 핵심 후보로 본 판단과 34를 포함한 균형형 조합이 실제 결과와 맞았다.',
      '지역별 조합처럼 서로 다른 역할을 부여한 방식은 단일 데이터 몰빵보다 실패가 덜 컸다.',
    ],
  },
  {
    title: '성공률을 높이는 새 규칙',
    items: [
      '중심축은 한 회차에 최대 2개까지만 고정한다. 나머지는 보조축 2개, 방어수 2개로 강제 분산한다.',
      '직전 회차 번호는 그대로 복사하지 말고 역할만 분류한다. 초반 연속, 10번대 허리, 30번대 방어, 40번대 방어처럼 역할 후보군으로 바꾼다.',
      '모든 추천 묶음 안에 저빈도·중빈도·고빈도 번호가 최소 1개씩 들어가게 한다. 고빈도 4개 이상 조합은 최대 1장만 허용한다.',
      '최근 패착 번호의 대체 후보를 반드시 둔다. 31을 놓쳤다면 다음에는 30·34·38, 43을 놓쳤다면 40·41·44·45처럼 같은 구간 후보를 나눠 담는다.',
      '최종 10게임을 만들 때 1~10, 11~20, 21~30, 31~40, 41~45 중 한 구간이 전체 포트폴리오에서 비지 않게 점검한다.',
    ],
  },
  {
    title: '다음 추천 포트폴리오 기준',
    items: [
      '주력 2장: 데이터 점수와 일진 점수가 동시에 높은 번호를 중심으로 구성한다.',
      '균형 4장: 중심축은 1개만 두고 구간·끝수·홀짝을 우선한다.',
      '방어 3장: 최근 3회에서 놓친 역할 후보를 넣되, 같은 숫자를 반복하지 않는다.',
      '변칙 1장: 설명이 약해도 포트폴리오 전체에서 비어 있는 구간과 끝수를 메우는 용도로 둔다.',
      '목표는 1등 예측보다 2개 적중을 3개 적중으로 끌어올리는 것이다. 따라서 “맞는 숫자 하나 더”를 위해 중복 중심축을 줄인다.',
    ],
  },
]

function topEntries(map, limit) {
  return Object.entries(map)
    .map(([key, value]) => ({ key: Number(key), value }))
    .sort((a, b) => b.value - a.value || a.key - b.key)
    .slice(0, limit)
}

function csvCell(value) {
  if (value === undefined || value === null) return '""'
  return `"${String(value).replaceAll('"', '""')}"`
}

function buildLottoCsv(draws) {
  const rows = draws.map(draw => [
    draw.drawNo,
    draw.drawDate,
    ...draw.numbers,
    draw.bonus,
    draw.firstWinnerCount,
    draw.firstPrizeAmount,
    draw.firstTotalAmount,
    draw.secondWinnerCount,
    draw.secondPrizeAmount,
    draw.thirdWinnerCount,
    draw.thirdPrizeAmount,
    draw.totalSalesAmount,
  ])

  return [
    CSV_COLUMNS.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\r\n')
}

function downloadLottoCsv(draws) {
  const latestDrawNo = draws.at(-1)?.drawNo ?? 0
  const csv = buildLottoCsv(draws)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `dhlottery_lotto645_1_${latestDrawNo}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
        <StatCard title="통합 데이터" value={`${draws.length}회`} caption={`JSON 기준 1회부터 ${latest.drawNo}회까지`} />
        <StatCard title="최신 회차" value={`${latest.drawNo}회`} caption={`${latest.drawDate} · ${latest.dayGanji}일 · ${getSourceLabel(latest.source)}`} />
        <StatCard title="CSV 최신 회차" value={`${csvLatest.drawNo}회`} caption={`${csvLatest.drawDate} · ${csvLatest.dayGanji}일`} />
        <StatCard title="CSV 최신 1등" value={`${csvLatest.firstWinnerCount}명`} caption={`${csvLatest.firstPrizeAmount.toLocaleString()}원`} />
      </section>

      <section className="rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#e3efff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[#0044cc]" />
            <h2 className="text-lg font-black text-[#0044cc]">통합 JSON 전체 데이터 요약</h2>
          </div>
          <button
            type="button"
            onClick={() => downloadLottoCsv(draws)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0044cc] px-4 text-sm font-black text-white transition-colors hover:bg-[#12376f]"
          >
            <Download size={16} />
            CSV 다운로드
          </button>
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
                    {pick.purchased && (
                      <span className="rounded-full bg-[#fff4d8] px-2 py-0.5 text-[11px] font-black text-[#8a5a00]">
                        구매
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

function RetrospectiveTab() {
  return (
    <section className="rounded-lg border border-[#d5e8ff] bg-white shadow-sm">
      <div className="border-b border-[#e3efff] px-4 py-4">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-[#0044cc]" />
          <h2 className="text-lg font-black text-[#0044cc]">패착 분석 · 2026-08-12</h2>
        </div>
        <p className="mt-1 text-xs font-bold text-[#5577bb]">
          경자일 1234회, 정미일 1235회, 갑인일 1236회 추천 결과를 비교한 개선안
        </p>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {RETROSPECTIVE_GROUPS.map(group => (
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
            ['retrospective', '패착분석'],
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
        {tab === 'retrospective' && <RetrospectiveTab />}
        {tab === 'data' && <DataTab draws={draws} loading={loading} error={error} />}
      </div>
    </div>
  )
}
