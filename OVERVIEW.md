# 개인 일정 관리 웹앱 개요

## 프로젝트 목표

모바일과 PC를 동시에 사용할 수 있는 반응형 개인 일정 관리 웹앱 개발.  
Firebase를 백엔드로 사용하여 실시간 동기화를 지원한다.

---

## 핵심 요구사항

- **모바일 우선 (Mobile-First)**: 스마트폰에서 편리하게 사용 가능한 UI/UX
- **크로스 플랫폼**: 모바일 ↔ PC 데이터 실시간 동기화
- **Firebase 백엔드**: Firestore DB + Firebase Auth + (선택) Firebase Hosting

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React (Vite) |
| 스타일링 | Tailwind CSS (반응형) |
| 백엔드/DB | Firebase Firestore |
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

## Firebase 데이터 구조 (Firestore)

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
- [ ] Firebase 프로젝트 연결 (Firestore, Auth)
- [ ] 환경변수 (.env) 구성

### Phase 2 — 인증
- [ ] Firebase Google 로그인 구현
- [ ] 로그인/로그아웃 UI
- [ ] 사용자 세션 관리

### Phase 3 — 핵심 기능
- [ ] Firestore CRUD 함수 구현
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
