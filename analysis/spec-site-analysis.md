# Popilot Spec-Site 코드 분석 리포트

> 분석 일자: 2026-03-31  
> 경로: `~/heavaa/dev/popilot/scaffold/spec-site/`  
> 분석 대상: Vue 3 + TypeScript 프론트엔드  

---

## 요약 (Executive Summary)

- **전체 완성도**: 약 70% — 핵심 기능(Board, Standup, Retro, Dashboard)은 실제 API 연동이 완성됨
- **API 연동**: `VITE_SPEC_MODE=static`(오프라인) vs `api` 모드를 모두 지원하는 이중 모드 설계
- **모바일 대응**: 주요 페이지 대부분이 `@media (max-width: 767px)` 반응형 스타일 보유
- **i18n**: 미구현 — UI 텍스트 전량 영어 하드코딩 (한국어 없음)
- **인증 가드**: 기능 플래그(feature flag) 방식으로 라우트 보호, 세션 인증(토큰 기반)

---

## 1. src/pages/ — 페이지별 기능 완성도

### 핵심 PM 기능

#### ✅ DashboardPage.vue
- **API 연동**: 완성. `useDashboard()` composable 경유 다수의 API 병렬 호출
  - `/api/v2/dashboard/unread-memos`, `/sprint-progress`, `/standup-status`, `/my-requests`, `/active-decisions`, `/nudge-log`, `/initiatives`
  - `/api/v2/kickoff/{sprint}/close-preview`, `/api/v2/activity`, `/api/v2/dashboard/my-summary`
- **모바일 대응**: ✅ `@media (max-width: 767px)` 완비 — grid 1열, padding 축소
- **문제점**:
  - Burndown Chart는 SVG 직접 그리기로 단순 표현 (라이브러리 없음) — 인터랙션 없음
  - `confirm()`, `alert()` 등 native dialog 사용 → UX 저하

#### ✅ board/BoardPage.vue
- **API 연동**: 완성. `usePmStore` 경유 에픽/스토리/태스크 CRUD 전부 가능
  - Epic, Kanban, Timeline, Roadmap 4가지 뷰 모드
  - 드래그앤드롭 칸반 + 낙관적 업데이트
  - 백로그 드로어, Sprint Roadmap
- **모바일 대응**: ✅ `@media (max-width: 767px)` 완비
- **문제점**:
  - Timeline 뷰에서 날짜 없는 스토리 제외 (`No stories with dates set`) — 날짜 미입력 시 기능 무용
  - `confirm()` 남용 (delete, sprint assign 등)

#### ✅ standup/StandupPage.vue
- **API 연동**: 완성. `useStandup` composable + 실시간 polling(30초)
  - 날짜 선택, 팀원별 입력 카드, 피드백(코멘트/승인) 기능
  - PM 데이터 연동 (스토리 피커, 태스크 생성)
- **모바일 대응**: ✅ `@media (max-width: 767px)` grid 1열
- **문제점**: 피드백 로드가 entries 수만큼 개별 API 호출 (N+1 패턴)

#### ✅ retro/RetroPage.vue
- **API 연동**: 완성. `useRetro` composable — API/localStorage 이중 지원
  - Write → Vote → Discuss → Done 4단계 위상 전환
  - 실시간 polling (4초)
  - 마크다운 Export
  - static 모드: localStorage 완전 오프라인 지원
- **모바일 대응**: ⚠️ 기본 flex/column 구조이나 RetroBoard.vue 미확인
- **완성도**: 높음

#### ✅ InboxPage.vue
- **API 연동**: 완성. `/api/v2/notifications` 조회, 읽음 처리, 전체 읽음
- **모바일 대응**: max-width 700px 고정, 기본 block 레이아웃으로 모바일 호환
- **문제점**: 알림 클릭 시 라우팅 로직이 `source_type` 기반 — 일부 케이스(`nudge`)는 단순 `/` 이동

#### ✅ MemosPage.vue
- **API 연동**: 완성. `useTurso` (= `@/api/client` re-export) 경유
  - 페이지네이션, 검색/필터, 메모 타입, 멘션, 리플라이, 리졸브/리오픈
  - Memo Template 기능 (API에서 불러옴)
- **모바일 대응**: 파악 필요 (파일 길이 초과로 일부 미확인)
- **문제점**: 858줄로 파일이 비대 — 분리 리팩토링 필요

#### ✅ board/board 서브페이지들 (SprintKickoff, SprintClose, BoardAdmin, MyTasksPage, StoryDetailPanel)
- **API 연동**: 완성. Sprint CRUD, Kickoff/Close preview, 스토리 상세 편집 등
- **모바일 대응**: 각 페이지 미디어쿼리 존재

---

### 보조/설정 기능

#### ✅ AdminPage.vue
- **API 연동**: 완성. 멤버 CRUD, 토큰 생성, LLM 설정(provider/model/api_key), 초대 토큰
- **모바일 대응**: 미확인 (기본 form 레이아웃)
- **특징**: MCP 서버 연결 설정 UI 포함 (Claude Code, Codex 연동 가이드)

#### ✅ MyPage.vue
- **API 연동**: 완성. 프로필, Webhook URL 설정, 토큰 표시
- **특징**: MCP 서버 설정 config JSON 생성기 (Claude Code, Codex)

#### ✅ MeetingsPage.vue
- **API 연동**: 완성. 회의 목록 CRUD, 참여자 관리, 회의록 AI 구조화
  - `rawTranscript` → AI 요약/의제/결정사항/액션아이템 자동 파싱
- **Static 모드**: 빈 상태 graceful degradation ✅

#### ✅ RewardsPage.vue
- **API 연동**: 완성. 리워드/패널티 CRUD, 멤버별 잔액 요약, 상태 관리
- **Static 모드**: 빈 상태 처리 ✅

#### ✅ DocsHub.vue
- **API 연동**: 완성. 문서 트리 구조 + 최근 편집 목록
- **Static 모드**: 빈 상태 처리 ✅

#### ⚠️ DocsPage.vue / DocsEditor.vue
- **API 연동**: 부분 완성. Tiptap 기반 리치 에디터, 실시간 협업 감지
- **문제점**:
  - 실시간 동시 편집 충돌 감지가 단순 polling 기반 (WebSocket 없음)
  - `⚡ Another user has modified this document. <button>Refresh</button>` — 텍스트 하드코딩

#### ⚠️ PolicyDetail.vue / PolicyIndex.vue
- **API 연동**: 부분 완성. `usePageContent` composable로 규칙/시나리오 로드
- **Static 모드**: `wireframeRegistry.ts` 정적 데이터 폴백 지원
- **문제점**: API 없을 때 빈 화면 위험 — wireframeRegistry에 충분한 데이터 있어야 함

#### ⚠️ SprintTimeline.vue / SprintAdmin.vue
- **API 연동**: 부분 완성
- **SprintAdmin**: URL 직접 접근 필요 (`admin-subtitle: "Admin page — accessible only with the URL"`)
- **문제점**: 인증 가드 없이 URL 알면 누구나 접근 가능

#### ❌ MockupEditorPage.vue (상세 아래 별도 섹션)

#### ⚠️ IndexPage.vue
- **기능**: `featurePages`에서 동적 카드 렌더링 — 데이터 없으면 "No feature pages yet" 빈 상태
- **문제점**: `<!-- TODO: Replace with your project name and description -->` 주석 미삭제

#### ❌ NotificationSettingsPage.vue
- **API 연동 여부**: 파악 필요 (간단한 설정 저장으로 추정)

---

## 2. src/components/ — 재사용 컴포넌트

| 컴포넌트 | 완성도 | 비고 |
|---------|--------|------|
| `AppHeader.vue` | ✅ | 네비게이션, 검색, 알림 드롭다운, 사용자 선택, 테마 토글 |
| `AuthGate.vue` | ✅ | 인증 필요 시 토큰 입력 게이트 래퍼 |
| `SearchModal.vue` | ✅ | 전체 검색 모달 (스토리/메모/문서) |
| `NotificationDropdown.vue` | ✅ | 헤더 알림 드롭다운, 실시간 polling |
| `DocEditor.vue` | ✅ | Tiptap 리치 에디터 (표, 이미지, 링크, 멘션) |
| `DocComments.vue` | ✅ | 문서 인라인 코멘트 |
| `DocsSidebar.vue` | ✅ | 문서 트리 네비게이션 |
| `MemoItem.vue` | ✅ | 메모 단일 아이템, 리졸브/리오픈 액션 |
| `MentionInput.vue` | ✅ | @멘션 자동완성 입력 |
| `MemoRelations.vue` | ✅ | 메모 간 관계 연결 |
| `MemoTimeline.vue` | ✅ | 메모 타임라인 뷰 |
| `MemoChecklist.vue` | ✅ | 메모 체크리스트 |
| `MemoGraph.vue` | ⚠️ | 관계 그래프 — 복잡도에 따라 미완성 가능성 |
| `MemoSidebar.vue` | ✅ | 메모 페이지 사이드바 |
| `MockupShell.vue` | ⚠️ | 목업 뷰어 프레임 — 단순 iframe 래퍼 수준 |
| `SpecSection.vue` | ✅ | 스펙 섹션 렌더링 |
| `SpecNav.vue` | ✅ | 스펙 내비게이션 |
| `RuleTable.vue` | ✅ | 비즈니스 룰 테이블 |
| `ScenarioSwitcher.vue` | ✅ | 시나리오 전환 UI |
| `BurndownChart.vue` | ⚠️ | SVG 직접 구현, 라이브러리 없음 |
| `VelocityChart.vue` | ⚠️ | 동일 — 단순 바 차트 |
| `SummaryGrid.vue` | ✅ | 통계 그리드 |
| `CoachingCard.vue` | ✅ | 넛지/코칭 메시지 카드 |
| `UserAvatar.vue` | ✅ | 사용자 아바타 |
| `MemberSelect.vue` | ✅ | 팀원 선택 드롭다운 |
| `EmptyState.vue` | ✅ | 빈 상태 플레이스홀더 |
| `ErrorBanner.vue` | ✅ | 에러 배너 |
| `StateDisplay.vue` | ✅ | loading/error/empty 3상태 래퍼 |
| `Badge.vue` | ✅ | 배지 컴포넌트 |
| `PriorityBadge.vue` | ✅ | 우선순위 배지 |
| `VersionBadge.vue` | ✅ | 버전 배지 |
| `Icon.vue` | ✅ | Lucide 아이콘 래퍼 |
| `Accordion.vue` | ✅ | 아코디언 |
| `TreeNode.vue` | ✅ | 트리 노드 재귀 컴포넌트 |
| `SlashCommand.ts` | ⚠️ | Tiptap 슬래시 커맨드 — TS only, Vue SFC 아님 |

**총평**: 컴포넌트 라이브러리 전반적으로 잘 갖춰짐. BurndownChart/VelocityChart는 외부 차트 라이브러리 없이 SVG 직접 구현이라 기능 한계 있음.

---

## 3. src/composables/ — 상태 관리 & API 호출 로직

### ✅ 잘 구현된 composables

| Composable | 완성도 | 특징 |
|-----------|--------|------|
| `useAuth.ts` | ✅ | URL 토큰 자동 추출, localStorage 캐싱, API 검증 + offline fallback |
| `useDashboard.ts` | ✅ | 6개 API 병렬 로드, nudge log, team initiatives |
| `usePmStore.ts` | ✅ | Singleton 패턴, 에픽/스토리/태스크 Full CRUD |
| `useNavStore.ts` | ✅ | Singleton, Sprint/Epic CRUD, carry-over 지원, fallback 데이터 |
| `useRetro.ts` | ✅ | API + localStorage dual mode, 4초 polling, Markdown export |
| `useStandup.ts` | ✅ | 날짜별 조회, 실시간 polling, 피드백 시스템 |
| `useNotification.ts` | ✅ | polling 기반 알림, 읽음 처리 |
| `useMemo.ts` | ✅ | 메모 CRUD, 타입별 분류 |
| `usePageContent.ts` | ✅ | 규칙/시나리오/스펙 영역 로드 + localStorage 캐시 |
| `useScenario.ts` | ✅ | 시나리오 provide/inject 패턴 |
| `useScenarioStore.ts` | ✅ | Turso 커스텀 시나리오 |
| `useUser.ts` | ✅ | 팀원 목록 동적 로드, 사용자 선택 |
| `useTheme.ts` | ✅ | light/dark/system 테마 |
| `useMediaQuery.ts` | ✅ | 반응형 미디어쿼리 |
| `useViewport.ts` | ✅ | 뷰포트 크기 추적 |
| `useActiveSection.ts` | ✅ | IntersectionObserver 기반 섹션 추적 |
| `useBottomSheet.ts` | ✅ | 모바일 바텀시트 |

### ⚠️ 주의 사항

- **정적 모드 제한**: `isStaticMode()` 반환 시 모든 CRUD 비활성화, 빈 데이터 반환
- **N+1 패턴**: `StandupPage`의 피드백 로드는 entries 수만큼 API 호출
- **polling 중복**: 여러 composable이 독립적으로 polling — 탭 전환 시 `stopPolling` 호출 필요

---

## 4. src/router.ts — 라우팅 구조

### 라우트 구조

```
/                     → IndexPage (특성 페이지 카드 목록)
/dashboard            → DashboardPage
/board                → redirect → /board/:activeSprint
/board/backlog        → BoardPage (백로그)
/board/:sprint        → BoardPage
/my-tasks/:sprint     → MyTasksPage
/kickoff/new          → SprintKickoff
/kickoff/:sprintId    → SprintKickoff
/close/:sprintId      → SprintClose
/admin/board          → BoardAdmin
/standup/:sprint      → StandupPage
/inbox                → InboxPage
/my                   → MyPage
/admin                → AdminPage
/rewards              → RewardsPage
/meetings             → MeetingsPage
/docs                 → DocsHub
/policy/:sprint       → PolicyIndex
/policy/:sprint/:epicId → PolicyDetail
/retro/:sprint        → RetroPage
/:pageId/:sprint      → WireframeShell (동적 스펙 페이지)
/**                   → redirect /
```

### ✅ 강점

- **Feature Guard**: 모든 비즈니스 라우트에 `featureGuard()` 적용
  - `VITE_FEATURES` env 변수로 기능 on/off 제어 가능
  - Static 모드에서는 `specs`, `retro`만 활성화
- **Dynamic Redirect**: `/board`, `/standup`, `/retro` → 활성 스프린트로 자동 리디렉션
- **Dynamic Title**: `router.afterEach`에서 문서 타이틀 자동 업데이트

### ❌ 문제점

1. **인증(Authentication) 가드 없음**
   - 현재 가드는 **feature flag** (기능 비활성화)만 처리
   - `isAuthenticated` 체크 라우트 가드 없음 → URL 직접 접근 시 모든 페이지 노출
   - `AuthGate.vue` 컴포넌트가 있지만 페이지 레벨 래퍼로만 사용, 라우터 레벨 가드 없음
   - SprintAdmin은 "accessible only with the URL" 주석 — 사실상 보안 없음

2. **Lazy loading만 사용** — 코드 스플리팅은 됨 (import())

---

## 5. src/mockup/ — 목업 에디터 기능 상태

### MockupEditorPage.vue — ❌ 부분 완성 (데스크톱 전용)

#### ✅ 구현된 기능
- 드래그앤드롭 컴포넌트 배치 (팔레트 → 캔버스)
- 마우스 드래그 이동, 8방향 리사이즈 핸들
- 스냅 가이드라인 (5px 임계값)
- 컴포넌트 선택, 다중 선택 (Shift/Ctrl+Click)
- Undo/Redo (최대 20단계)
- Ctrl+C/V 복사붙여넣기
- 레이어 패널 (z-index, lock, bring-to-front 등)
- Zoom (25~400%)
- 그리드 표시 토글
- 시나리오(Scenario) 탭 — 같은 캔버스에 여러 시나리오
- 자동 저장 (2초 디바운스)
- 커스텀 컴포넌트 정의 CRUD (API 기반)
- 계층 구조 (children, tree 드래그)
- 다중 선택 정렬 (left/right/top/bottom/centerH/centerV)
- Preview 모드 링크

#### ❌ 문제점 / 미구현
- **모바일 완전 비활성화**: `@media (max-width: 768px) { .editor-layout { display: none !important; } }`
- **컴포넌트 렌더링 단순**: `chart`, `trend-chart`가 아이콘+텍스트만 표시 (실제 차트 없음)
- **인라인 편집 제한**: `contenteditable`이 `page-title`, `text` 타입만 지원
- **tree-child 중첩 드래그**: 한 단계 자식만 UI에 표시 (깊은 중첩 미지원)
- **버그**: Layer 패널의 Lock 버튼이 `<Icon name="lock" :size="14" />` 문자열을 그대로 렌더링 (미처리 컴포넌트 태그)
- **협업 없음**: 단일 사용자만 편집 가능
- **저장 방식**: flat → tree → flat 변환 로직이 `sortOrder`만 의존 — 복잡한 중첩 구조에서 순서 버그 가능성

### MockupListPage.vue — ⚠️ 부분 완성
- 목업 목록, 생성, 삭제 기능 — API 연동 완성
- **문제점**: `m.viewport === 'mobile' ? '📱' : '<Icon name="monitor" :size="14" />'` — 데스크톱 아이콘이 문자열로 렌더링됨

### MockupViewerPage.vue — ✅ 완성
- 저장된 목업 뷰어 (read-only 모드)

---

## 6. i18n 지원 여부

### 결론: ❌ i18n 미구현

- **전체 UI 텍스트 영어 하드코딩**: "Loading...", "No data", "Team Flow Monitor", "Daily Standup", "Board Admin" 등
- **한국어 텍스트**: **0개** — 그리스어/CJK 문자 검색(`[가-힣]`) 185개 히트했으나 전부 주석의 `──` 구분선, 이모지, 화살표 특수문자임
- **영어 하드코딩 예시**:
  - `"Drag components from the palette on the left"`
  - `"Are you sure you want to delete this?"`
  - `"Epic created"`, `"Story created"`
  - `"Mark All Read"`, `"Pending Approvals"`, `"Recent Alerts (Nudge)"`
  - `"Retrospective completed"`, `"Next Sprint Kickoff →"`

### i18n 추가 시 작업 규모
- 추정 하드코딩 문자열 수: **500~1,000개** (페이지 30개 이상, 컴포넌트 30개 이상)
- vue-i18n 적용 시 전체 파일 리팩토링 필요

---

## 7. package.json — 의존성 상태

```json
"dependencies": {
  "vue": "^3.5.27",
  "vue-router": "^4.5.0",
  "dompurify": "^3.2.0",
  "marked": "^15.0.0",
  "lucide-vue-next": "^0.470.0",
  "@tiptap/vue-3": "^2.11.0",
  "@tiptap/*": 9개 extension 패키지
}
```

### ✅ 강점
- **경량 의존성**: Pinia(상태관리) 없이 composable + module-level singleton으로 처리
- **Vite 기반**: 빠른 빌드
- **Tiptap**: 프로덕션급 리치 에디터

### ⚠️ 문제점

| 항목 | 문제 | 권장 |
|-----|------|------|
| 차트 라이브러리 없음 | BurndownChart, VelocityChart가 SVG 직접 구현 | chart.js 또는 vue-chartjs 추가 |
| i18n 없음 | vue-i18n 미포함 | vue-i18n 추가 후 전체 리팩토링 |
| 테스트 없음 | Vitest, Jest 등 미포함 | 단위/통합 테스트 추가 필요 |
| TypeScript 컴파일 경고 가능성 | `as any` 캐스팅 다수 사용 | 타입 안전성 개선 필요 |
| Pinia 없음 | 대신 module-level ref 사용 — 동시성 이슈 주의 | 현재는 SPA라 문제 없지만 복잡도 증가 시 Pinia 도입 권장 |

---

## 8. 종합 이슈 목록 (우선순위순)

### 🔴 Critical

1. **라우터 인증 가드 없음** — URL 직접 접근 시 인증 없이 모든 페이지 접근 가능
2. **MockupEditor Layer 버튼 버그** — Lock 버튼에 Vue 컴포넌트 태그가 문자열로 렌더링됨
3. **MockupListPage 뷰포트 아이콘 버그** — 데스크톱 아이콘이 `<Icon ...>` HTML 문자로 표시

### 🟡 High

4. **N+1 API 패턴** — StandupPage에서 entries 수만큼 feedback API 개별 호출
5. **native dialog 남용** — `confirm()`, `alert()` → Vue 컴포넌트 모달 대체 필요
6. **DocsPage 실시간 충돌** — polling 기반이라 편집 충돌 발생 가능 (WebSocket 부재)
7. **IndexPage TODO 주석 미처리** — 프로젝트명/설명 하드코딩 필요

### 🟢 Medium

8. **MemosPage.vue 858줄** — 분리 리팩토링 필요
9. **BurndownChart SVG 직접 구현** — 기능 한계, 차트 라이브러리 도입 권장
10. **i18n 미구현** — 글로벌 배포 계획 시 vue-i18n 적용 필요
11. **테스트 전무** — Vitest 기반 최소 단위 테스트 추가 필요
12. **SprintAdmin 접근 통제** — feature guard 없이 URL 직접 접근 가능

---

## 9. 모바일 반응형 대응 현황

| 페이지 | 모바일 대응 | 비고 |
|--------|------------|------|
| DashboardPage | ✅ | 2열 → 1열, padding 축소 |
| BoardPage | ✅ | Kanban overflow-x auto |
| StandupPage | ✅ | entries-grid 1열 |
| RetroPage | ✅ (추정) | flex-column 구조 |
| InboxPage | ✅ | max-width 700px |
| **MockupEditorPage** | ❌ | 모바일 완전 숨김 |
| MockupListPage | ⚠️ | 미디어쿼리 미확인 |
| MeetingsPage | ⚠️ | 미확인 |
| RewardsPage | ⚠️ | 미확인 |

---

*분석 완료. 총 파일: 100개+, 분석된 주요 파일: 40개*
