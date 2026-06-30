# 개인 일정 관리 웹앱 개요

## 프로젝트 목표

모바일과 PC를 동시에 사용할 수 있는 반응형 개인 일정 관리 웹앱 개발.  
Firebase를 백엔드로 사용하여 실시간 동기화를 지원한다.

---

## 핵심 요구사항

- **모바일 우선 (Mobile-First)**: 스마트폰에서 편리하게 사용 가능한 UI/UX
- **크로스 플랫폼**: 모바일 ↔ PC 데이터 실시간 동기화
- **Firebase 백엔드**: Realtime Database + Firebase Auth + (선택) Firebase Hosting

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React (Vite) |
| 스타일링 | Tailwind CSS (반응형) |
| 백엔드/DB | Firebase Realtime Database |
| 인증 | Firebase Authentication (Google 로그인) |
| 호스팅 | Firebase Hosting |
| 상태 관리 | React Context API 또는 Zustand |

---

## 주요 기능

### 1. 인증
- Google 계정 로그인 / 로그아웃
- 사용자별 독립 데이터 관리

### 2. 일정 관리 (CRUD)
- 일정 추가: 제목, 날짜, 시간, 메모, 카테고리
- 일정 수정 및 삭제
- 일정 완료 체크

### 3. 캘린더 뷰
- 월간 달력 보기
- 일간 / 주간 보기 (선택)
- 날짜 클릭 시 해당 날 일정 목록 표시

### 4. 할 일(Todo) 리스트
- 날짜별 할 일 목록
- 완료/미완료 필터링
- 우선순위 설정 (높음 / 보통 / 낮음)

### 5. 반응형 UI
- 모바일: 하단 네비게이션 바
- PC: 사이드바 레이아웃
- 터치 친화적 버튼 크기 및 간격

---

## Firebase 데이터 구조 (Realtime Database)

```
users/
  {userId}/
    schedules/
      {scheduleId}/
        title: string
        date: timestamp
        startTime: string
        endTime: string
        memo: string
        category: string        // 업무 / 개인 / 건강 / 기타
        isCompleted: boolean
        priority: string        // high / medium / low
        createdAt: timestamp
        updatedAt: timestamp
```

---

## 화면 구성

```
[모바일]                        [PC]
┌───────────────┐              ┌──────────┬─────────────────┐
│   헤더 (월/년) │              │          │   헤더          │
├───────────────┤              │  사이드바  ├─────────────────┤
│               │              │  - 달력   │                 │
│   캘린더       │              │  - 메뉴   │  메인 콘텐츠     │
│               │              │          │  (캘린더/목록)   │
├───────────────┤              │          │                 │
│  일정 목록     │              │          │                 │
├───────────────┤              └──────────┴─────────────────┘
│ 하단 네비게이션 │
│ 홈|캘린더|추가|목록|설정 │
└───────────────┘
```

---

## 개발 단계

### Phase 1 — 기반 세팅
- [ ] Vite + React 프로젝트 초기화
- [ ] Tailwind CSS 설정
- [ ] Firebase 프로젝트 연결 (Realtime Database, Auth)
- [ ] 환경변수 (.env) 구성

### Phase 2 — 인증
- [ ] Firebase Google 로그인 구현
- [ ] 로그인/로그아웃 UI
- [ ] 사용자 세션 관리

### Phase 3 — 핵심 기능
- [ ] Realtime Database CRUD 함수 구현
- [ ] 일정 추가/수정/삭제 폼
- [ ] 월간 캘린더 컴포넌트
- [ ] 일정 목록 컴포넌트

### Phase 4 — UI/UX 완성
- [ ] 모바일 하단 네비게이션
- [ ] PC 사이드바 레이아웃
- [ ] 반응형 스타일 전체 적용
- [ ] 로딩 / 빈 상태 화면

### Phase 5 — 배포
- [ ] Firebase Hosting 배포
- [ ] PWA 설정 (홈 화면 추가 가능하도록)
- [ ] 최종 테스트 (모바일 + PC)

---

## 향후 확장 고려사항

- 알림 / 리마인더 (Firebase Cloud Messaging)
- 반복 일정 (매주, 매월)
- 일정 공유 기능
- 다크 모드
- 캘린더 외부 연동 (Google Calendar API)



캘린더 검색 기능 추가 , 캘린더뱃지에 시간도 노출 캘린더 화면 채워서 확대. 월 넘기기 버튼 가운데로. 
인코딩깨짐은 한글로 하는 한 계속 발생하니깐 무시해.
백엔드에서 OAuth refresh token 관리
제일 정석
Google OAuth authorization code flow 사용
refresh token을 서버/Firebase Functions 등에 저장
Calendar API 호출도 백엔드에서 수행
설정과 보안 작업이 확 늘어남


종합 페이지
Todo 현황판(간트차트)   + 캘린더에 바로 반영 버튼 
메모 > 완료
날씨(페이지따로 또 캘린더에 노출)  노출된 날씨가 어느 지역인지 안나옴 내가 준 이미지랑 많이다름 특히 이모지가 이상함 해가 까만색이고 또 지도도 이상함
명언
내가 좋아하는 글귀들 
---

## 보류 메모 - Google Calendar OAuth refresh token 백엔드 전환

### 현재 상태
- Google Calendar API를 프론트에서 access token으로 직접 호출하던 방식은 토큰 만료 때문에 장기 사용에 불안정함.
- 이를 해결하기 위해 Firebase Functions에서 Google OAuth authorization code flow를 처리하고, refresh token을 서버 DB에 저장한 뒤 Calendar API를 백엔드에서 호출하는 구조로 전환하는 작업을 시작함.
- `functions/`, `firebase.json`, `CALENDAR_OAUTH.md`, Functions 기반 `src/lib/googleCalendar.js` 변경까지는 코드상 준비됨.
- 단, 현재 Functions 초안은 Firestore 기반으로 작성되어 있으므로 재개 시 Realtime Database 저장 방식으로 변경해야 함.

### 왜 완료하지 못했는지
- 회사 네트워크/보안 정책 때문에 Firebase CLI 로그인이 차단됨.
- `npx firebase login --no-localhost --reauth` 실행 시 `https://auth.firebase.tools/attest` 요청 실패 발생.
- 따라서 수정한 Firebase Functions 코드를 실제 Cloud Functions에 배포하지 못함.
- 로컬 프론트는 이미 배포된 Cloud Functions를 호출하므로, Functions를 배포하기 전까지 CORS 수정 및 refresh token 구조가 실제로 적용되지 않음.

### 언제 다시 해야 하는지
- Google Calendar 연동을 장시간 안정적으로 유지해야 할 때.
- access token 만료로 인해 사용자가 자주 재연결해야 하는 문제가 다시 불편해질 때.
- 회사망이 아닌 네트워크, 휴대폰 핫스팟, 또는 Google Cloud Shell에서 Firebase CLI 배포가 가능한 상태가 되었을 때.

### 다음 작업
- Firebase CLI 로그인 가능 환경에서 아래 명령 실행:
```powershell
npx firebase-tools@13.35.1 login --no-localhost
npx firebase-tools@13.35.1 deploy --only functions --project psmine-ad9cc
```
- Google Cloud OAuth 클라이언트에 아래 redirect URI 등록 확인:
```txt
https://us-central1-psmine-ad9cc.cloudfunctions.net/calendarOAuthCallback
```
- `functions/.env`에 OAuth client id/secret/redirect URI/app URL 설정.
- 배포 후 프론트에서 Calendar 연결 버튼을 눌러 refresh token 저장 및 Calendar API 호출 확인.

### 지금 우선순위
- 이 백엔드 전환은 일단 보류.
- 당장은 앱 기능, Realtime Database 기반 메모/Todo/설정, 캘린더 UI 개선을 먼저 진행.

---

## 날씨 데이터 저장 정책

- 기상청 단기/중기/일출일몰 데이터는 Firebase Realtime Database에 계속 누적한다.
- 나중에 과거 특정 시점의 예보를 다시 돌려볼 수 있어야 하므로 원본 번들 성격의 데이터도 별도로 보관한다.
- 단기 데이터끼리는 같은 일자/시간 키를 덮어쓸 수 있다.
- 장기 데이터가 단기 데이터를 덮어쓰면 안 된다. 단기와 장기는 컬렉션을 분리한다.

### Realtime Database 구조
- `/users/{uid}/weather/latest`
  - 화면 표시용 최신 캐시
- `/users/{uid}/weatherSnapshots`
  - 갱신 호출마다 추가되는 전체 스냅샷 누적
- `/users/{uid}/weatherArchive/{location_baseDate_baseTime_midTmFc}`
  - 발표시각 기준 원본 번들 보관용 아카이브
- `/users/{uid}/weatherShortHourly/{date_time}`
  - 단기 시간별 예보. 같은 날짜/시간은 갱신 시 merge 가능
- `/users/{uid}/weatherShortDaily/{date}`
  - 단기 일별 요약. 같은 날짜는 갱신 시 merge 가능
- `/users/{uid}/weatherMidForecasts/{date}`
  - 중기/장기 예보. 단기 컬렉션과 절대 섞지 않음

어디서부터 파이어스토어 DB로 설계한건지 모르겠는데 파이어스토어DB는 없어
파이어베이스 리얼타임데이터베이스만 활성화해놧어. 여기다가해야해.

디자인 참조 팔레트 
https://webdesignrankings.com/resources/lolcolors/

---

## 날씨 페이지 작업 이력

### UI 수정 (WeatherPage.jsx)
- **전체 폭 반응형**: `max-w-[1120px]` → `max-w-[1600px]`, main 패딩 `px-4 sm:px-6 lg:px-10 xl:px-12`
- **MetricBox 텍스트 잘림**: 고정 높이 `h-[50px]` → `min-h-[60px]`, `py-2.5`로 3줄 텍스트 수용
- **시간별 예보 그리드**: `grid-cols-[42px_repeat(14,44px)]` → `grid-cols-[58px_repeat(14,minmax(44px,1fr))]` + `w-full` — 화면 너비에 맞게 확장, "강수량㎜" 라벨 공간 확보
- **전국날씨 요일 탭**: `flex-wrap gap-x-4` → `flex justify-between` — 7일 줄바꿈 없이 한 줄 배치

### 전국날씨 날짜 반응 (NationwideWeather)
- 날짜 탭 클릭 시 지도 날씨 아이콘이 해당 날의 `sky` 조건으로 변경
- 오늘: 기존 도시별 실황 데이터 그대로
- 미래 날짜: 선택한 날 예보의 날씨 조건을 모든 도시에 적용, 기온 표시 생략 (도시명만)
- 구현: `isToday` 판별 → `mapCities` 계산

### 일출일몰 SVG 수정 (SunTimeline)
- **근본 원인**: 기존 `r=95`, chord=190=2r → 두 반원 모두 86px viewBox 바깥 → 아크 미표시
- **수정**: viewBox `0 0 240 110`, `r=141`, center(120, 188.6) — 호 정점 y≈48으로 viewBox 내부에 완전히 수용
- **sweep 방향**: sweep=1 (시계방향, center가 chord 아래에 있으므로 호가 위로 솟음)
- **아이콘 교체**: 노란 원 `●` → 방향 텍스트 `일출 ↑` / `↓ 일몰`
- **내일/모레 줄바꿈 제거**: `text-sm` → `text-xs`, 원 아이콘 제거, `↑05:43 ↓19:50` 형식으로 한 줄

### DB 및 API 버그 수정 (useWeather.js / weatherApi.js)
- **일출/일몰 데이터 항상 빈 값 원인**: `http://apis.data.go.kr` URL → 브라우저 Mixed Content 차단
  - **수정**: `https://apis.data.go.kr`로 변경
- **Firebase array 역직렬화**: RTDB는 array를 `{0:…, 1:…}` object로 저장하고 돌려줌 → `.map()` 호출 시 오류 가능
  - **수정**: `normalizeWeather()` 함수 추가, `toArray()` 로 `hourly` / `daily` / `midTerm` 방어 변환
- **중복 DB 쓰기 제거**: 기존에는 `weather/latest` 외에 `weatherShortHourly`, `weatherShortDaily`, `weatherMidForecasts`, `weatherArchive`, `weatherSnapshots` 5개 경로에 중복 저장
  - 읽는 곳이 `weather/latest` 하나뿐이므로 나머지 경로 쓰기 전면 제거
  - `update(ref(db), updates)` + `set(push(...))` 2단계 → `set(latestRef, payload)` 1번으로 단순화

### 현재 날씨 DB 구조 (확정)
```
users/{uid}/
  weather/
    latest/    ← 전체 날씨 번들 (화면 표시 + 캐시 모두 여기서)
```
- `latest` 안에 `current`, `hourly[]`, `daily[]`, `midTerm[]`, `sunriseSunset`, `location`, `fetchedAt` 포함
- 갱신 주기: 8시간 (WEATHER_REFRESH_INTERVAL_MS)

### 월간/주간 기후전망 API
- 기상청 단기(`getVilageFcst`) + 중기(`getMidLandFcst`, `getMidTa`) 는 최대 10일
- 주간전망/월간전망(네이버 날씨의 "7월 1주차" 등)은 **기상청 기후전망정보 API** (별도 서비스) 사용
- 현재 API key로는 호출 불가 — 공공데이터포털에서 별도 신청 필요

# Mine 개발 필수 날짜/시간 UX 규칙

- 시간 입력/표시는 항상 24시간제 `HH:mm` 형식을 쓴다. `오전/오후`, AM/PM 표시는 쓰지 않는다.
- 시간 범위는 `00:00`부터 `23:59`까지 허용한다.
- 연월일 입력의 연도는 반드시 4자리로 제한한다. 예: `2026-06-30`. `100000-01-01`처럼 5자리 이상 연도 입력을 허용하지 않는다.
- 앱의 날짜 기준은 `Asia/Seoul`이다. “오늘” 계산은 서울 날짜 기준으로 한다.
- 사용자 입력값이나 화면 표시용 날짜 계산에 `T00:00:00` 같은 ISO datetime 문자열을 붙여 처리하지 않는다. 날짜 전용 값은 `yyyy-MM-dd` 문자열로 관리하고, 날짜 더하기/빼기는 공통 날짜 헬퍼를 쓴다.
- 외부 API가 요구하는 내부 전송 형식은 예외일 수 있지만, UI/UX와 앱 내부 날짜 키는 위 규칙을 우선한다.

---
