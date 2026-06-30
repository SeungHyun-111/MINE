# Character Motion Analysis

## 분석 대상

- `src/components/game/CharacterSprite.jsx`
- `src/pages/GamePage.jsx`
- `src/pages/SummaryPage.jsx`
- `src/hooks/usePet.js`
- `src/assets/charcters/`

현재 캐릭터 모션은 스프라이트 시트 방식이 아니라, 여러 PNG 파일을 배열로 묶고 일정 fps로 `img src`를 교체하는 방식이다.

## 에셋 구성

`src/assets/charcters/` 아래에 동작별 단일 이미지가 들어 있다.

| 용도 | 파일 |
| --- | --- |
| 서있음 | `서있음1.png` |
| 걷기 | `걷기1.png`, `걷기2.png` |
| 놀기 | `놀기1.png`, `놀기2.png` |
| 식사 | `식사1.png`, `식사2.png`, `식사3.png` |
| 씻기 | `씻기1.png`, `씻기2.png` |
| 앉음 | `앉음.png` |
| 울기 | `울기.png` |
| 웃기 | `웃기.png` |
| 자기 | `자기1.png`, `자기2.png` |
| 짜증 | `짜증.png` |

주의: 폴더명이 `characters`가 아니라 `charcters`로 되어 있다. 코드도 이 경로를 기준으로 import하고 있으므로 폴더명을 바꾸면 import도 같이 수정해야 한다.

## 전체 구조

`CharacterSprite`는 두 종류의 애니메이션 경로를 가진다.

- idle 상태머신: 아무 액션이 없을 때 걷기/앉기를 랜덤으로 선택하는 기본 모션
- `SPRITE_ACTION`: 먹이주기, 놀기, 재우기, 씻기, 칭찬처럼 버튼 액션을 눌렀을 때 잠깐 재생되는 모션

우선순위는 액션 모션이 더 높다.

```jsx
const actionAnim = activeAction && SPRITE_ACTION[activeAction]
const restAnim = IDLE_REST[emotionLabel] ?? IDLE_REST['보통']
const idleAnim = idle.mode === 'walk' ? IDLE_WALK : restAnim
const anim = actionAnim || idleAnim
```

즉 `activeAction`이 있으면 감정과 관계없이 액션 모션을 보여주고, 액션 시간이 끝나면 다시 랜덤 idle 모션으로 돌아간다. 감정 라벨은 더 이상 idle 프레임을 고르는 key로 쓰이지 않고, `filter`를 통해 색감만 바꾼다.

## 랜덤 idle 모션

아무 액션을 하지 않을 때는 `createIdleSegment()`가 다음 idle 구간을 만든다.

| idle mode | 확률 | 모션 | 유지/이동 |
| --- | --- | --- | --- |
| `walk` | 90% | 걷기1 -> 걷기2, 4fps | 현재 위치에서 왼쪽/오른쪽 목표 지점까지 선형 이동 |
| `rest` | 10% | 현재 감정에 맞는 표정/휴식 프레임 | 현재 위치에서 6.5초-10초 정도 오래 표현 |

걷기와 감정 표현은 같은 프레임 배열에 섞지 않는다. 걷는 구간은 걷기 프레임만 반복하고, 쉬는 구간은 현재 감정에 맞는 표정 프레임을 오래 유지한다. 그래서 걷다가 갑자기 한 프레임만 표정이 끼어드는 식의 통통 튀는 느낌을 줄인다.

감정별 `rest` 모션은 다음과 같다.

| 감정 | rest 모션 |
| --- | --- |
| 신남 | 웃기 -> 서있음1 -> 웃기 |
| 행복 | 웃기 -> 앉음 |
| 보통 | 앉음 -> 서있음1 |
| 슬픔 | 울기 -> 앉음 -> 울기 |
| 위기 | 짜증 -> 울기 -> 짜증 |

좌우 이동 범위는 `CharacterSprite`의 `walkLimit` prop으로 조절한다. 게임 화면은 기본값인 중앙 기준 약 `-92px`에서 `+92px` 사이를 쓰고, 종합 페이지의 작은 위젯은 `walkLimit={46}`으로 줄여서 카드 밖으로 과하게 잘리지 않게 한다. 캐릭터가 오른쪽에 있으면 다음 걷기 목표는 왼쪽 쪽으로, 왼쪽에 있으면 오른쪽 쪽으로 잡아 화면 안에서 왕복하게 만든다.

감정은 `usePet.js`의 `deriveEmotion(stats)`에서 계속 계산된다. 네 가지 스탯 평균값을 `base`로 만들고, 감정 라벨과 필터 색감을 정한다. 걷는 빈도는 감정과 상관없이 높게 유지하고, 쉬는/rest 구간에서 감정 라벨이 실제 스프라이트 선택에 쓰인다.

## 액션별 모션

액션은 `GamePage`의 버튼 클릭 흐름과 `CharacterSprite`의 `SPRITE_ACTION`이 연결되어 있다.

| 액션 key | 모션 프레임 | fps | 유지 시간 |
| --- | --- | --- | --- |
| `feed` | 식사1 -> 식사2 -> 식사3 | 4fps | 2400ms |
| `play` | 놀기1 -> 놀기2 | 4fps | 2000ms |
| `sleep` | 자기1 -> 자기2 | 1.5fps | 3000ms |
| `clean` | 씻기1 -> 씻기2 | 4fps | 2500ms |
| `praise` | 웃기 -> 서있음1 | 4fps | 1500ms |

버튼을 누르면 `handleAction`이 실행되고, 먼저 `activeAction`을 즉시 설정해서 캐릭터 모션을 바로 시작한다. 이후 `doAction(key)`가 실패하면 방금 시작한 모션만 취소한다.

```jsx
const actionRun = { key, id: Date.now() }
setActiveAction(actionRun)
actionTimerRef.current = setTimeout(
  () => setActiveAction((current) => current?.id === actionRun.id ? null : current),
  SPRITE_ACTION[key]?.duration ?? 2000,
)
```

`activeAction`은 문자열이 아니라 `{ key, id }` 형태로 들고 있고, `CharacterSprite`에는 `activeAction?.key`만 넘긴다. `key` prop에는 `id`를 넣어서 같은 액션을 다시 실행해도 프레임이 0번부터 다시 시작되게 했다.

## 프레임 재생 방식

`CharacterSprite` 내부에서 현재 프레임 번호를 `frameIdx`로 들고 있다.

- 애니메이션이 바뀌면 `frameIdx`를 0으로 초기화한다.
- 이전 interval을 지운다.
- 프레임이 2개 이상이면 `1000 / fps` 간격으로 다음 프레임으로 넘긴다.
- 마지막 프레임 다음에는 다시 0번 프레임으로 돌아간다.

따라서 액션 모션도 duration 동안 계속 루프된다. 예를 들어 `feed`는 2.4초 동안 식사 3프레임을 4fps로 반복한다.

## 이미지 정렬 기준

각 모션에는 `align` 값이 있다.

| align | CSS object-position | 적용 의도 |
| --- | --- | --- |
| `foot` | `bottom center` | 서있음, 걷기, 웃기, 울기, 앉음처럼 발 위치를 맞춰야 하는 모션 |
| `center` | `center center` | 식사, 씻기, 자기, 놀기처럼 이미지 중심 기준이 자연스러운 모션 |

렌더링 스타일은 공통으로 다음이 적용된다.

- `width`, `height`: `size` prop 기준, 현재 GamePage에서는 120
- `objectFit: contain`
- `imageRendering: pixelated`
- 감정 필터는 `filter` prop으로 전달

## 감정 필터

`GamePage.jsx`의 `EMOTION_FILTER`가 감정별 색감을 조정한다.

- 신남: 밝기와 채도 증가
- 행복: 밝기와 채도 약간 증가
- 보통: 필터 없음
- 낮은 상태: 어둡게, 채도 감소, hue-rotate 적용

이 필터는 액션 중에도 그대로 유지된다. 예를 들어 슬픈 상태에서 밥을 먹이면 식사 모션이 나오지만 색감은 슬픈 필터를 탄다.

## 파티클 효과

액션 성공 시 캐릭터 모션과 별개로 `ACTION_PARTICLES`의 이모지가 위로 떠오른다.

- 생성 위치: 캐릭터 영역 중앙 근처
- 애니메이션 시간: 1.2초
- 이동: 위로 80px, 크기 1.3배, opacity 0

파티클은 스프라이트 모션과 독립적이며, 액션 duration보다 짧게 끝난다.

## 현재 리스크 / 개선 포인트

1. 콘솔/일부 에디터에서 한글 import 경로나 라벨이 깨져 보일 수 있다.
   - 실제 파일은 한글 파일명이고, 코드도 한글 라벨을 key로 쓰고 있다.
   - 환경 인코딩이 어긋나면 `보통`, `행복` 같은 key 매칭이 깨져 보일 수 있으니 UTF-8 기준으로 관리하는 게 좋다.

2. 감정 key를 한글 문자열로 직접 매칭한다.
   - `deriveEmotion()`의 label과 `IDLE`의 key가 정확히 같아야 한다.
   - 추후 안정성을 높이려면 내부 key는 `excited`, `happy`, `normal`, `sad`, `bad` 같은 영문 enum으로 두고, 화면 표시용 label만 한글로 분리하는 편이 안전하다.

3. 액션 모션은 "한 번 재생"이 아니라 "duration 동안 반복 재생"이다.
   - 현재 구조에서는 duration 안에서 프레임 배열이 계속 루프된다.
   - 정말 한 사이클만 재생하고 멈춰야 한다면 interval 로직에 `loop: false` 옵션을 추가해야 한다.

4. 프레임별 이미지 크기와 여백이 다르면 캐릭터가 흔들려 보일 수 있다.
   - `align: foot`/`center`로 어느 정도 보정하고 있지만, PNG 캔버스 크기와 캐릭터 기준점이 통일되어야 가장 안정적이다.

5. idle 이동은 CSS `translateX`로 처리한다.
   - 부모 캐릭터 영역이 지금보다 좁아지면 `walkLimit` prop을 줄여야 한다.

6. 액션 모션은 이제 DB 저장 완료 전에도 먼저 보인다.
   - 버튼 클릭 직후 반응은 빨라졌지만, `doAction()`이 실패하면 모션이 바로 취소된다.

## 요약

현재 캐릭터 모션은 `CharacterSprite.jsx` 한 곳에서 프레임 배열, fps, 정렬, 액션 duration, idle 랜덤 상태를 관리한다. `usePet.js`가 스탯으로 감정을 만들고, `GamePage.jsx`가 버튼 클릭 직후 `activeAction`을 잠깐 켜서 액션 모션을 우선 재생한다. `SummaryPage.jsx`의 작은 종합 위젯도 같은 `CharacterSprite`를 사용하되 크기와 `walkLimit`만 줄인다. 기본 idle은 90% 확률로 좌우 걷기, 10% 확률로 감정별 rest 표현을 선택한다. 구조는 단순하고 확장하기 쉬운 편이지만, 액션 duration 동안 반복 재생되는 정책은 나중에 의도와 다를 수 있어 정리해두면 좋다.
