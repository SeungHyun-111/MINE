# Weather Call Structure

## 2026-06-30 추가 판단: 16건만으로 막힌다는 설명은 부족함

전국 날씨 16개 도시를 한 번 불러온다는 사실만으로 `429 Too Many Requests`가 난다고 보는 것은 설득력이 낮다. 정상 갱신 1회 기준 전체 요청은 21건이고, 전국 단기예보만 보면 16건이다. 이 정도 숫자만으로 항상 막힌다면 공공데이터 API를 정상적으로 쓰기 어렵기 때문에, 실제 문제는 "16건 자체"보다 아래 조건들이 겹치는지 확인해야 한다.

1. 개발 모드 `React.StrictMode`
   - `src/main.jsx`에서 `<StrictMode>`를 사용한다.
   - 개발 환경에서는 effect가 한 번 더 실행되는 것처럼 보일 수 있어, 자동 갱신 타이밍의 중복 여부를 의심해야 한다.
   - 운영 빌드에서는 이 동작이 다르므로 개발 콘솔의 요청 수와 실제 배포 요청 수가 다를 수 있다.

2. 앱 전체 기준 in-flight lock 부재
   - `useWeather()` 안의 `refreshInFlight`와 `autoRefreshStarted`는 훅 인스턴스 내부 `useRef`다.
   - 즉 앱 전체에서 "지금 날씨 갱신 중"이라는 전역 잠금은 없다.
   - 현재 `HomePage`는 페이지 하나만 렌더하므로 종합/날씨 페이지가 동시에 살아 있는 구조는 아니지만, 페이지 전환/개발모드/재마운트 상황에서는 중복 갱신 가능성을 막는 장치가 약하다.

3. 실패한 전국 데이터가 다시 stale 조건이 됨
   - `isWeatherStale()`는 `nationwide.cities`가 비어 있으면 `fetchedAt`이 최근이어도 stale로 판단한다.
   - 전국 호출이 한 번 실패해서 빈 배열로 저장되면, 다음 마운트에서 다시 자동 갱신을 시도할 수 있다.

4. 429 재시도가 도시별로 독립 실행됨
   - `fetchJson()`은 429를 받으면 최대 3회까지 시도한다.
   - 전국 16건이 모두 429를 맞으면 전국 호출만 16건이 아니라 최대 48건처럼 보일 수 있다.
   - 여기에 상암동 단기/초단기, 중기예보 2건도 각각 재시도될 수 있다.

5. 같은 API key를 공유하는 다른 실행 환경
   - 로컬 개발 서버를 여러 탭에서 켰거나, 배포 사이트와 로컬이 같은 key를 쓰거나, 이전 실패 요청의 재시도가 남아 있으면 "내가 누른 이번 16건"보다 실제 같은 key의 순간 요청량이 많아질 수 있다.

따라서 현재 가설은 "전국 16건이라서 막힌다"가 아니라, "갱신 1회가 21건이고, 실패/재시도/재마운트/StrictMode/stale 조건 때문에 이 묶음이 짧은 시간에 반복되거나 증폭될 때 막힌다"이다.

먼저 고쳐야 할 방향은 전국 데이터를 없애는 것이 아니라 다음 순서다.

1. `useWeather.js`에 모듈 전역 in-flight promise를 둬서 자동/수동/페이지전환이 겹쳐도 실제 API 묶음은 한 번만 실행한다.
2. `nationwide.cities`가 비어 있다는 이유만으로 즉시 stale 처리하지 않고, 실패 시에도 짧은 cooldown을 둔다.
3. 429를 만났을 때 모든 도시가 각자 재시도하지 않게, 전국 큐 전체에 backoff/circuit breaker를 둔다.
4. 수동 갱신 버튼은 클릭 직후 일정 시간 disabled 처리하고, 이미 갱신 중이면 기존 promise를 재사용한다.

## 2026-06-30 기상청 API 호출 코드만 좁혀 본 결론

### 실제 호출 파일

기상청/공공데이터 API를 직접 호출하는 코드는 현재 `src/lib/weatherApi.js` 하나다.

검색 기준:

- `apis.data.go.kr`
- `VilageFcst`
- `MidFcst`
- `RiseSet`
- `SERVICE_KEY`
- `fetch(`

확인 결과:

| 파일 | 역할 |
| --- | --- |
| `src/lib/weatherApi.js` | 실제 공공데이터 API URL, serviceKey, fetch 실행 |
| `src/hooks/useWeather.js` | `fetchWeatherBundle()` 호출, RTDB 캐시 저장/구독 |
| `src/pages/WeatherPage.jsx` | 훅에서 받은 데이터를 표시, 직접 API 호출 없음 |
| `src/pages/SummaryPage.jsx` | 훅에서 받은 데이터를 표시, 직접 API 호출 없음 |

즉 기상청 API 호출 구조를 고치려면 우선 `src/lib/weatherApi.js`와 `src/hooks/useWeather.js`만 보면 된다.

### 현재 API key 상태

현재 공공데이터 service key는 `src/lib/weatherApi.js` 상단에 1개만 하드코딩되어 있다.

```js
const SERVICE_KEY = '...'
```

`.env` 계열 파일은 현재 루트에서 발견되지 않았다. `netlify.toml`에도 weather 관련 환경변수나 프록시 설정은 없다.

정리 판단:

1. 중복 key가 여러 군데 흩어진 상태는 아니다.
2. 대신 key가 프론트엔드 소스에 직접 들어가서 브라우저 번들에 노출된다.
3. 단기예보, 중기예보, 출몰시각 API가 모두 같은 `SERVICE_KEY`를 쓴다.
4. key를 여러 개로 쪼개는 것보다 먼저 호출 구조를 안정화하는 게 우선이다.
5. 이후에는 Firebase Functions 또는 Netlify Functions 같은 서버 프록시로 옮기면 key 노출과 호출 제어를 같이 해결할 수 있다.

### 현재 병렬 호출 구조

`fetchWeatherBundle()`은 아래 6개 작업을 `Promise.allSettled()`로 동시에 시작한다.

| 작업 | 엔드포인트 | 요청 수 |
| --- | --- | ---: |
| 현재 초단기 실황 | `getUltraSrtNcst` | 1 |
| 상암동 단기예보 | `getVilageFcst` | 1 |
| 중기 육상예보 | `getMidLandFcst` | 1 |
| 중기 기온예보 | `getMidTa` | 1 |
| 일출/일몰 | `getAreaRiseSetInfo` | 1 |
| 전국 도시별 예보 | 내부에서 `getVilageFcst` 16개 | 16 |

중요한 점은 전국 호출도 최상위 `Promise.allSettled()` 안에서 같이 시작된다는 것이다.

그리고 `fetchNationwideWeather()`는 전국 16개를 완전 직렬이 아니라 `5개씩 병렬 + batch 사이 350ms 대기`로 처리한다.

```js
const NATIONWIDE_FETCH_CONCURRENCY = 2
const NATIONWIDE_BATCH_DELAY_MS = 700
```

따라서 갱신 시작 직후에는 다음 요청이 거의 동시에 나갈 수 있다.

| 묶음 | 동시 요청 |
| --- | ---: |
| 초단기, 상암 단기, 중기 2개, 출몰시각 | 5 |
| 전국 1차 배치 | 5 |
| 시작 순간 최대치 | 약 10 |

즉 "전국 16건"보다 더 정확한 표현은 "갱신 시작 순간 같은 serviceKey로 공공데이터 요청을 약 10개까지 동시에 던지고, 이후 전국 배치가 350ms 간격으로 이어진다"이다.

### 병렬이 유리한지, 직렬이 유리한지

현재 목적이 "가장 빠른 화면 갱신"이면 병렬이 유리하다. 하지만 지금 문제는 속도가 아니라 `429 Too Many Requests`와 실패 안정성이다. 이 경우에는 완전 병렬보다 제한된 직렬/큐 방식이 유리하다.

권장 구조:

1. 현재 위치 데이터 우선
   - `getUltraSrtNcst`
   - 상암동 `getVilageFcst`
   - 이 둘은 화면 핵심이므로 먼저 처리한다.

2. 중기/출몰시각은 낮은 빈도 캐시
   - `getMidLandFcst`, `getMidTa`는 하루 2회 발표라 8시간마다 같이 부를 필요가 상대적으로 낮다.
   - `getAreaRiseSetInfo`는 날짜 기준 데이터라 하루 1회 캐시로 충분하다.

3. 전국 16개는 별도 큐
   - 동시 5개보다 `1~2개 직렬/저병렬`이 안정적이다.
   - 도시 사이에 300~800ms 정도 간격을 둔다.
   - 429가 한 번 나오면 남은 도시를 즉시 계속 밀어붙이지 말고 전체 큐를 잠깐 멈춘다.

4. 전국 데이터는 부분 성공 저장
   - 16개 중 일부 실패해도 성공한 도시는 저장한다.
   - 실패했다고 `nationwide.cities` 전체를 비워 다음 자동 갱신을 유발하지 않게 한다.

결론:

- 상암동 현재/단기처럼 사용자 첫 화면에 바로 필요한 데이터는 병렬 유지 가능
- 전국 16개 `getVilageFcst`는 직렬 또는 concurrency 2 이하가 더 유리
- 중기/출몰시각은 매번 같은 묶음으로 부르지 말고 별도 TTL 캐시가 더 유리

### 2026-06-30 적용한 수정

이번 수정으로 실제 코드에는 아래 변경을 반영했다.

| 파일 | 변경 |
| --- | --- |
| `src/lib/weatherApi.js` | 전국 호출 동시성을 5개에서 2개로 축소 |
| `src/lib/weatherApi.js` | 전국 배치 간격을 350ms에서 700ms로 증가 |
| `src/lib/weatherApi.js` | 429 감지 시 전국 큐가 5초 backoff |
| `src/lib/weatherApi.js` | 기본 5개 API 요청을 먼저 처리한 뒤 전국 16개 큐를 시작하도록 순서 변경 |
| `src/lib/weatherApi.js` | 중기예보는 6시간, 출몰시각은 20시간 런타임 TTL 캐시 적용 |
| `src/hooks/useWeather.js` | 앱 전역 `sharedRefreshPromise`로 중복 갱신 묶음 방지 |
| `src/hooks/useWeather.js` | `nationwide.cities`가 비었다는 이유만으로 즉시 stale 처리하지 않도록 변경 |
| `src/hooks/useWeather.js` | 갱신 실패 후 10분 자동 재시도 cooldown 추가 |

변경 후 갱신 시작 순간 동시 요청은 기존의 약 10개에서 기본 API 요청 5개로 줄고, 이후 전국 요청은 2개씩 천천히 진행된다.

현재 코드 기준으로 다시 읽을 때 주의할 점:

- 아래쪽 기존 분석 중 "전국 호출도 최상위 `Promise.allSettled()` 안에서 같이 시작"된다는 설명은 수정 전 구조다.
- 현재는 `fetchWeatherBundle()`에서 기본 API 묶음을 먼저 기다린 뒤 `fetchNationwideWeather()`를 따로 실행한다.
- 아래쪽 기존 분석 중 "전국 5개 병렬, 350ms 간격"이라는 설명도 수정 전 구조다.
- 현재는 전국 2개 병렬, 700ms 간격, 429 감지 시 5초 backoff 구조다.
- 내일 재확인할 때는 `src/lib/weatherApi.js`의 `NATIONWIDE_FETCH_CONCURRENCY`, `NATIONWIDE_BATCH_DELAY_MS`, `NATIONWIDE_429_BACKOFF_MS` 값을 기준으로 보면 된다.

## 분석 대상

- `src/hooks/useWeather.js`
- `src/lib/weatherApi.js`
- `src/pages/WeatherPage.jsx`
- `src/pages/SummaryPage.jsx`

이 문서는 현재 날씨 데이터 호출 구조, 자동/수동 갱신의 차이, 요청 수가 왜 크게 늘어나는지, 그리고 `429 Too Many Requests`가 어떤 경우에 발생하기 쉬운지를 정리한다.

## 현재 진입점

날씨 데이터는 `useWeather()` 훅에서 관리한다.

사용 위치는 현재 기준으로 다음과 같다.

| 위치 | 용도 |
| --- | --- |
| `WeatherPage.jsx` | 날씨 전체 페이지 |
| `SummaryPage.jsx`의 `CompactWeatherSummary` | 종합 페이지의 날씨 요약 |
| `SummaryPage.jsx`의 `WeatherSummary` | 현재 직접 렌더되지는 않고 `void WeatherSummary` 처리 |
| `SummaryPage.jsx`의 `LegacyWeatherSummary` | 현재 직접 렌더되지는 않고 `void LegacyWeatherSummary` 처리 |

실제로 화면에 동시에 의미 있게 쓰이는 것은 보통 `WeatherPage` 또는 `CompactWeatherSummary` 쪽이다. 다만 `useWeather()` 자체는 훅 인스턴스별로 `refreshInFlight`, `autoRefreshStarted` ref를 따로 가진다. 즉 여러 인스턴스가 동시에 마운트되면 앱 전체 기준의 단일 락은 없다.

## 공식 요청 한도 확인

공공데이터포털의 공식 OpenAPI 상세 페이지 기준으로 확인한 요청 한도는 다음과 같다.

| 사용 API | 공식 페이지의 신청가능 트래픽 |
| --- | --- |
| 기상청_단기예보 조회서비스 | 개발계정: 10,000 / 운영계정: 활용사례 등록시 신청하면 트래픽 증가 가능 |
| 기상청_중기예보 조회서비스 | 개발계정: 10,000 / 운영계정: 활용사례 등록시 신청하면 트래픽 증가 가능 |
| 한국천문연구원_출몰시각 정보 | 개발계정: 10,000 / 운영계정: 활용사례 등록시 신청하면 트래픽 증가 가능 |

공식 상세 페이지에는 위처럼 일 단위로 보이는 신청가능 트래픽은 적혀 있지만, 초당/분당 burst 제한이나 브라우저에서 보이는 HTTP `429 Too Many Requests`의 정확한 임계값은 공개 숫자로 확인되지 않았다.

따라서 현재 콘솔의 `429`는 총량 10,000을 이미 소진했다기보다, 같은 서비스키로 짧은 시간에 같은 API를 많이 호출했을 때 공공데이터포털 또는 프록시 계층에서 순간 제한을 건 것으로 보는 편이 더 합리적이다. 특히 현재 구조는 갱신 1회에 `getVilageFcst`를 상암동 1회 + 전국 16회 호출하고, 429면 각 호출이 최대 3회 재시도하므로 순간 요청 밀도가 높아질 수 있다.

## 자동 갱신과 수동 갱신

### 자동 갱신

`useWeather()`는 Firebase RTDB의 `weather/global/latest`를 먼저 읽는다.

그 후 다음 조건이면 자동으로 `refresh()`를 실행한다.

```js
cacheChecked && !loading && !error && !autoRefreshStarted.current && isWeatherStale(weather)
```

`isWeatherStale(weather)` 조건은 현재 다음과 같다.

```js
return !latestTime ||
  Date.now() - latestTime >= WEATHER_REFRESH_INTERVAL_MS
```

여기서 `WEATHER_REFRESH_INTERVAL_MS`는 8시간이다.

중요한 점은 `nationwide.cities`가 비어 있으면 `fetchedAt`이 최신이어도 stale로 본다는 것이다. 그래서 전국 데이터만 실패해서 비어 있는 캐시가 저장되면, 다음 마운트 때 다시 자동 갱신을 시도할 수 있다.

### 수동 갱신

날씨 페이지의 갱신 버튼은 다음을 호출한다.

```js
forceRefresh: () => refresh({ force: true })
```

`force: true`면 8시간 캐시 조건을 건너뛰고 바로 API 호출을 한다.

### 자동/수동 호출 내용의 차이

현재 구조에서는 자동 갱신과 수동 갱신 모두 결국 같은 함수로 들어간다.

```js
fetchWeatherBundle(DEFAULT_WEATHER_LOCATION)
```

즉 수동 버튼을 누르든, 자동 stale 갱신이 돌든, 실제로 호출하는 API 묶음은 같다.

## 갱신 1회당 요청 수

`fetchWeatherBundle()` 한 번은 다음 API들을 동시에 시작한다.

| 구분 | API | 요청 수 |
| --- | --- | ---: |
| 현재 날씨 | `getUltraSrtNcst` | 1 |
| 단기 예보 | `getVilageFcst` | 1 |
| 중기 육상 | `getMidLandFcst` | 1 |
| 중기 기온 | `getMidTa` | 1 |
| 일출일몰 | `getAreaRiseSetInfo` | 1 |
| 전국 도시별 예보 | `getVilageFcst` | 16 |

따라서 실패가 전혀 없고 재시도도 없으면 갱신 1회는 총 21개 요청이다.

## 전국 호출 방식

전국 도시는 16개다.

```js
const NATIONWIDE_FETCH_CONCURRENCY = 2
const NATIONWIDE_BATCH_DELAY_MS = 700
```

현재는 5개씩 병렬 호출하고, 배치 사이에 350ms를 쉰다.

배치 구성은 대략 다음처럼 돈다.

| 배치 | 도시 수 | 동시 요청 |
| --- | ---: | ---: |
| 1 | 5 | 5 |
| 2 | 5 | 5 |
| 3 | 5 | 5 |
| 4 | 1 | 1 |

단일 갱신 안에서 전국 호출만 최소 16개이며, 모두 `getVilageFcst` 같은 엔드포인트를 사용한다.

## 재시도로 인한 요청 증폭

`fetchJson()`은 `429 Too Many Requests`를 받으면 최대 3번까지 요청한다.

```js
for (let attempt = 0; attempt < 3; attempt += 1) {
  ...
  if (response.status === 429 && attempt < 2) {
    await wait(1200 * (attempt + 1))
    continue
  }
}
```

그래서 요청 수는 다음처럼 커질 수 있다.

| 상황 | 요청 수 |
| --- | ---: |
| 정상 갱신 | 21 |
| 전국 16개만 모두 429, 각 3회 시도 | 48 |
| 상암동 현재/단기까지 429 | +6 |
| 중기 2개까지 429라면 | +6 |

최악에 가깝게 터지면 갱신 한 번이 50개 이상 요청으로 보일 수 있다.

브라우저 콘솔에서는 같은 URL이 여러 번 찍히는데, 이 중 일부는 실제로 `fetchJson()`의 429 재시도다.

## 왜 어떤 때는 되고 어떤 때는 Too Many Requests가 나는가

현재 구조에서는 호출 성공 여부가 다음 조건에 크게 흔들린다.

1. 공공데이터포털/기상청 쪽 순간 rate limit 상태
   - 같은 API key를 쓰는 이전 요청이 최근에 많았으면 다음 요청이 바로 429를 맞을 수 있다.
   - 다른 탭, 다른 사용자, 배포된 앱, 개발 서버가 같은 key를 쓰면 합산될 가능성이 있다.

2. 갱신 직전 캐시 상태
   - `weather/global/latest`에 정상 캐시가 있고 8시간 이내면 자동 갱신은 안 돈다.
   - 캐시가 없거나, 전국 도시 배열이 비어 있거나, 8시간이 지났으면 자동 갱신이 돈다.

3. 수동 갱신 버튼
   - 수동 갱신은 8시간 조건을 무시한다.
   - 이미 방금 실패했더라도 다시 누르면 같은 21개 묶음이 다시 출발한다.

4. React 개발 모드와 훅 인스턴스
   - 개발 모드에서는 마운트/이펙트 실행이 실제보다 더 시끄럽게 보일 수 있다.
   - 현재 `refreshInFlight`는 훅 인스턴스 내부 ref라서 앱 전체 전역 락이 아니다.
   - 여러 `useWeather()` 인스턴스가 거의 동시에 stale로 판단하면 중복 갱신 여지가 있다.

5. 429 재시도 정책
   - 429는 “잠깐 기다렸다 다시 시도하면 성공할 수도 있는” 에러지만, 현재는 모든 도시가 각자 재시도한다.
   - rate limit 상태에서 다수 요청이 동시에 재시도하면 오히려 더 오래 429가 이어질 수 있다.

6. 전국 배치 속도
   - 5개 동시, 350ms 간격은 브라우저 단일 세션 기준으로는 작아 보여도 공공 API rate limit 기준에서는 공격적으로 보일 수 있다.

즉 “항상 무조건 많이 요청한다”라기보다는, 캐시가 유효할 때는 조용하고, 캐시가 stale이거나 수동 갱신을 누른 순간 21개 요청 묶음이 출발한다. 그때 API 서버가 여유 있으면 성공하고, 이미 limit 근처면 429가 터지며 재시도 때문에 콘솔이 크게 부풀어 보인다.

## 현재 구조의 핵심 문제

1. 캐시 단위가 너무 크다.
   - 현재/단기/중기/일출/전국을 한 번에 `weather/global/latest`로 저장한다.
   - 전국만 실패해도 전체 갱신 결과에 에러가 많이 붙는다.

2. stale 판단에 `nationwide.cities`가 포함된다.
   - 전국 데이터 실패가 다음 자동 갱신을 다시 부르는 조건이 된다.

3. 수동 갱신이 전체 묶음을 강제 갱신한다.
   - 사용자는 현재 날씨만 새로고침하려고 눌러도 전국 16개 도시까지 같이 호출된다.

4. 429 재시도가 도시별로 독립 실행된다.
   - 한 도시가 429를 맞으면 그 도시만 재시도하지만, 동시에 여러 도시가 429를 맞으면 전체 요청 수가 급격히 늘어난다.

5. 앱 전체 기준 in-flight 락이 없다.
   - 한 훅 인스턴스 안에서는 중복 방지하지만, 앱 전체에서 하나만 실행된다는 보장은 약하다.

6. 에러 표시가 원문 리스트 그대로 길게 나온다.
   - 사용자 화면에는 “전국 일부 실패” 정도면 충분한데, 현재는 도시별 오류가 전부 이어져 보인다.

## 개선 제안

### 1단계: 호출 중복 방지

`useWeather.js`에 모듈 전역 promise 락을 둔다.

목표:

- 자동 갱신과 수동 갱신이 거의 동시에 들어와도 실제 API 묶음은 1회만 실행
- Summary와 WeatherPage가 각각 `useWeather()`를 써도 동시에 중복 fetch하지 않음

예상 효과:

- React 개발 모드나 페이지 전환에서 중복 호출 감소
- 21개 요청 묶음이 2배, 3배로 복제되는 위험 감소

### 2단계: 캐시를 도메인별로 분리

현재:

- `weather/global/latest`

제안:

- `weather/global/current`
- `weather/global/forecast`
- `weather/global/midTerm`
- `weather/global/sun`
- `weather/global/nationwide`

이렇게 나누면 전국 데이터가 실패해도 현재 날씨 캐시는 정상 갱신할 수 있다.

### 3단계: 수동 갱신 범위 분리

현재 갱신 버튼:

- 현재/단기/중기/일출/전국 모두 호출

제안:

- 기본 갱신 버튼: 현재/단기 중심
- 전국 지도 섹션 별도 갱신 버튼: 전국 16개 도시만 호출
- 관리자/디버그용 전체 갱신: 필요할 때만 사용

전국 데이터가 필요하다는 조건은 유지하되, 사용자의 일반 갱신이 항상 전국 16개까지 때리지 않게 한다.

### 4단계: 전국 요청 큐 정리

현재:

- 5개 동시
- 350ms 간격
- 429면 각 요청이 최대 3회 재시도

제안:

- 1-2개 동시
- 800-1500ms 간격
- 429는 즉시 재시도하지 않고 해당 도시를 실패 처리
- 실패 도시는 이전 캐시 유지
- 다음 전국 갱신 주기에 다시 시도

이렇게 하면 총 데이터는 유지하면서 순간 요청 밀도를 낮출 수 있다.

### 5단계: 부분 성공 저장

전국 16개 중 일부만 성공했을 때:

- 성공한 도시는 새 데이터 저장
- 실패한 도시는 기존 캐시 유지
- `apiErrors`에는 요약 정보만 저장

예:

```js
{
  cities: mergedCities,
  fetchedAt,
  partial: true,
  failedCities: ['춘천', '강릉']
}
```

화면에는 “전국 일부 지점은 이전 데이터” 정도로 표시한다.

### 6단계: 에러 메시지 요약

현재:

- `shortCurrent: 429 ... / 서울.forecast: 429 ... / 춘천.forecast: 502 ...` 식으로 길게 표시

제안:

- 사용자 화면: `기상청 요청 제한으로 일부 데이터 갱신 실패: 전국 12개 지점`
- 개발 상세: 콘솔 또는 접힌 디버그 패널

## 결론

전국 데이터를 없애면 안 된다. 문제는 전국 데이터 자체가 아니라, 모든 데이터를 한 번의 갱신 묶음으로 호출하고, 429를 각 요청이 독립적으로 재시도하며, 전국 실패가 다시 stale 조건이 되는 구조다.

가장 먼저 고칠 순서는 다음이 좋아 보인다.

1. 앱 전체 전역 in-flight 락 추가
2. `nationwide.cities` 없음만으로 stale 처리하지 않도록 변경
3. 에러 메시지 요약
4. 전국 갱신을 별도 캐시/별도 주기로 분리
5. 전국 요청 큐를 1-2개 동시 + 실패 도시 캐시 유지 방식으로 변경

이 순서면 기능을 줄이지 않고, 호출 폭주와 콘솔 에러 폭발을 줄일 수 있다.
