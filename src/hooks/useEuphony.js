import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

const DEFAULT_HIGHLIGHTS = [
  {
    id: 'highlight_20220519_2248',
    text: '그는 칭찬을 받으려고 고대하는 어린애처럼 반쯤 웃고 있었다. 그리고 반쯤은 두려워하고 있었다. 몇 초 뒤, 그의 얼굴은 후자 쪽으로 기울었다.',
    highlightedAt: '2022.05.19 22:48',
    bookTitle: '너의 췌장을 먹고 싶어',
  },
  {
    id: 'highlight_20220519_2241',
    text: '저녁 바람이 불어 아직 살아있는 내 마음을 달래주었다. 아주 조금, 일요일에 나갈지 말지 긍정적으로 검토해보자는 생각이 들었다.',
    highlightedAt: '2022.05.19 22:41',
    bookTitle: '너의 췌장을 먹고 싶어',
  },
  {
    id: 'highlight_20220519_2240',
    text: '그녀가 바라보는 길거리의 색깔과 내가 보는 길거리의 색깔은 원래대로라면 서로 달라서는 안 되는 것이다. 목덜미를 쓰다듬으며 내가 살아있는지를 확인했다. 심장의 박동에 맞춰 발을 내딛다 보니 덧없는 목숨을 억지로 흔들고 있는 듯한 느낌이 들어 속이 울렁거렸다.',
    highlightedAt: '2022.05.19 22:40',
    bookTitle: '너의 췌장을 먹고 싶어',
  },
  {
    id: 'highlight_20220519_2238',
    text: '“췌장은 소화와 에너지 생산의 조정 역할을 한다. 이를테면 당분을 에너지로 바꾸기 위해 인슐린을 만들어낸다. 만일 췌장이 없으면 인간은 에너지를 얻지 못해 죽는다. 그래서 너한테 내 췌장을 대접해드릴 수는 없겠다.',
    highlightedAt: '2022.05.19 22:38',
    bookTitle: '너의 췌장을 먹고 싶어',
  },
  {
    id: 'highlight_20220519_2236',
    text: '인생의 지침서나 자기계발서 쪽은 좋아하지 않고 소설을 즐겨 읽는다. 침대에 누워 하얀 베개에 머리나 턱을 얹고 문고본을 읽는다. 하드커버는 무겁기 때문에 되도록 문고본이 바람직하다.',
    highlightedAt: '2022.05.19 22:36',
    bookTitle: '너의 췌장을 먹고 싶어',
  },
  {
    id: 'torrent_20250711_0016',
    text: '상대방이라는 책을 읽는 거라고, 그렇게 두 배의 시간을 살 수 있는 거라고,',
    highlightedAt: '2025.07.11 00:16',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20250211_1745',
    text: '슬픔과 너무 가까이 지내면 슬픔에도 중독될 수 있어. 슬픔이 행복보다 익숙해지고 행복이 낯설어질 수 있어. 우리 그러지 말자. 미리 두려워하지 말고 모든 걸 다 겪자.”',
    highlightedAt: '2025.02.11 17:45',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241208_1254',
    text: '용감해졌다. 깨지지 않았다. 부서지지 않았다. 다만 헝클어졌을 뿐이다. 마음속으로 곱씹으며 도담이 말했다.',
    highlightedAt: '2024.12.08 12:54',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241208_1247',
    text: '그중에는 서로 각자의 연인과 함께한 일들도 있었지만 질투는 느끼지 않았다. 그때 있어 준 사람들이 표류하는 망망대해에서 겨우 매달릴 구명환이 되어 주었음을 서로가 누구보다 잘 알았다. 오히려 고마웠다.',
    highlightedAt: '2024.12.08 12:47',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241208_1236',
    text: '공부를 멈추고 갑자기 결혼을 하고 아이를 낳았다. 덜컥 아이가 생겨서 한 결혼도 아니었다. 어떻게 그런 확신을 가질 수 있는 걸까. 무슨 일이 벌어질지 모르는 세상이었다',
    highlightedAt: '2024.12.08 12:36',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241208_1230',
    text: '그때는 나도 그럴 수밖에 없었어. 심했어. 좀 심한 말을 했기로서니……. 묵직한 돌덩이가 묶여 있는 것처럼 마음이 무거웠다. 그 말을 듣던 해솔의 처연한 표정이 잊히지 않았다.',
    highlightedAt: '2024.12.08 12:30',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1100',
    text: '그러나 사소한 다툼에서도 도담은 결코 미안하다고 말하고 싶지 않았다. 그 말이 둘의 애정에 독이 되리라는 것을 본능적으로 알았다.',
    highlightedAt: '2024.12.05 11:00',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1050_a',
    text: '너무 행복해서 불안하고 두려워졌다. 빵빵하게 부풀어 오른 풍선처럼 언제 갑자기 뻥 하고 터져 버릴까 봐 아슬아슬하고 벅찬 기분이었다. 그간 겪은 큰 불행에 익숙해져서 담을 수 있는 행복의 크기가 쪼그라든 것 같았다.',
    highlightedAt: '2024.12.05 10:50',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1050_b',
    text: '그해의 마지막 날 아침, 자고 일어나 보니 온 세상이 눈으로 하얗게 뒤덮여 있었다. 새하얀 백지처럼. 무엇이든 새롭게 시작할 수 있을 것 같았다.',
    highlightedAt: '2024.12.05 10:50',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1048',
    text: '도담은 같이 취하고 싶어 했지만 해솔은 술을 멀리했다. 취하는 것을 두려워했고 조금만 정신이 흐트러져도 큰일이 일어날 것처럼 경계했다.',
    highlightedAt: '2024.12.05 10:48',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1046',
    text: '밤을 꼴딱 새우고 아침이 되자 기다릴 수 없었다. 도담이 보고 싶었다. 당장 도담을 만나야 했다. 해솔은 걸음을 옮겼다. 튼튼한 다리로 도담을 향해 달려갔다. 가슴이 두근거렸다. 모처럼 살아 있다는 기분을',
    highlightedAt: '2024.12.05 10:46',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1042',
    text: '죽음을 망각하고 영원히 살것처럼 구는 게 젊은이들의 특권이라면 해솔은 젊음을 잃어 버렸다.',
    highlightedAt: '2024.12.05 10:42',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1041_a',
    text: '자신의 안이함이 두려웠다. 그런 끔찍한 실수를 반복하지 않으려면 늘 앞을 예측하고 예민하게 깨어 있어야 한다고 생각했다.',
    highlightedAt: '2024.12.05 10:41',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1041_b',
    text: '매순간 분열했다. 낮에 웃고 지내도 밤에 불을 끄고 누우면 슬픔과 우울이 찾아왔다. 취하면 무뎌지고 시간을 마음껏 탕진하는 기분이 들었고 그게 좋았다. 점점 의식을 놓아 버릴 기세로 마시며 굴러떨어지는 기분에 의존했다. 세상이 빙빙 돌았다.',
    highlightedAt: '2024.12.05 10:41',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1038',
    text: '남들처럼 추억을 만들고 웃고 즐기는 연애를 바랄 뿐이었다. 상대방의 지옥을 짊어진다는 선택지는 없었다. 연애라는 건 상대방이라는 책을 읽는 거라고, 그렇게 두 배의 시간을 살 수 있는 거라고,',
    highlightedAt: '2024.12.05 10:38',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1029',
    text: '철문이 시끄러운 소리를 내며 닫혔다. 다시는 열리지 않았다. 그게 마지막이었다.',
    highlightedAt: '2024.12.05 10:29',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1024',
    text: '어떤 말은 혀를 통해 입 밖으로 내뱉어지는 순간, 의식을 붙들어 매고 돌이킬 수 없는 힘을 가진다.',
    highlightedAt: '2024.12.05 10:24',
    bookTitle: '급류',
  },
  {
    id: 'torrent_20241205_1008',
    text: '마침내 중성 부력을 몸소 체험했을 때, 도담은 자유롭게 살라는 아빠의 마음이 무엇이었는지 알 수 있었다.',
    highlightedAt: '2024.12.05 10:08',
    bookTitle: '급류',
  },
]

function objectToList(value) {
  return Object.entries(value || {}).map(([id, item]) => ({ id, ...item }))
}

export function useEuphony() {
  const { user } = useAuth()
  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const seeded = useRef(false)

  const highlightsPath = useMemo(() => (
    user ? `users/${user.uid}/pages/euphony/highlights` : null
  ), [user])

  useEffect(() => {
    if (!highlightsPath) {
      setHighlights([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)

    return onValue(
      ref(db, highlightsPath),
      async (snapshot) => {
        const items = objectToList(snapshot.val()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setHighlights(items)
        setLoading(false)

        if (items.length === 0 && !seeded.current) {
          seeded.current = true
          const updates = {}
          DEFAULT_HIGHLIGHTS.forEach((highlight, index) => {
            updates[`${highlightsPath}/${highlight.id}`] = {
              text: highlight.text,
              highlightedAt: highlight.highlightedAt,
              bookTitle: highlight.bookTitle,
              order: index + 1,
              createdAt: Date.now() - index,
              updatedAt: Date.now() - index,
              createdAtServer: serverTimestamp(),
              updatedAtServer: serverTimestamp(),
            }
          })
          await update(ref(db), updates)
        }
      },
      (e) => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    )
  }, [highlightsPath])

  const updateHighlight = useCallback(async (highlightId, payload) => {
    if (!highlightsPath || !highlightId) return
    await update(ref(db, `${highlightsPath}/${highlightId}`), {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    })
  }, [highlightsPath])

  const removeHighlight = useCallback(async (highlightId) => {
    if (!highlightsPath || !highlightId) return
    await remove(ref(db, `${highlightsPath}/${highlightId}`))
  }, [highlightsPath])

  const addHighlight = useCallback(async () => {
    if (!highlightsPath) return null

    const highlightRef = push(ref(db, highlightsPath))
    const now = Date.now()
    const payload = {
      text: '새 하이라이트 문장을 입력하세요.',
      highlightedAt: new Date(now).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bookTitle: '책 제목',
      order: 0,
      createdAt: now,
      updatedAt: now,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    }

    await set(highlightRef, payload)
    return { id: highlightRef.key, ...payload }
  }, [highlightsPath])

  return {
    highlights,
    loading,
    error,
    addHighlight,
    updateHighlight,
    removeHighlight,
  }
}
