# Popilot CLI + MCP-PM + 외부 사용자 경험 분석

> 분석일: 2026-03-31  
> 분석 범위: CLI 파이프라인, MCP-PM 도구 등록, .context/ 디렉토리, 외부 사용자 경험

---

## 목차

1. [CLI 파이프라인 완성도](#1-cli-파이프라인-완성도)
2. [MCP-PM 도구 등록 상태](#2-mcp-pm-도구-등록-상태)
3. [.context/ 디렉토리 상태](#3-context-디렉토리-상태)
4. [외부 사용자 관점](#4-외부-사용자-관점)
5. [종합 평가 및 우선 개선 과제](#5-종합-평가-및-우선-개선-과제)

---

## 1. CLI 파이프라인 완성도

### 1-1. 전체 파이프라인 단계별 평가

| 단계 | 상태 | 비고 |
|------|------|------|
| `init` 진입점 | ✅ 완성 | 인수 파싱, 플랫폼 선택, 중복 감지 모두 구현 |
| `setup-wizard` | ✅ 완성 | 대화형 인터뷰 + project.yaml 생성 완료 |
| `hydrate` | ✅ 완성 | .hbs → .md 렌더링, 통합 마커 주입, 도메인 커맨드 생성 |
| `doctor` | ✅ 완성 | 7가지 체크, 어댑터 기반 확장 구조 |
| `deploy` | ✅ 완성 | wrangler deploy 래핑, 에러 처리 |
| `migrate` | ✅ 완성 | feature flag 기반 스키마 선택적 적용 |

**파이프라인 흐름 정리:**

```
npx popilot init
  ↓
copyScaffold()        → 스캐폴드 파일 복사 (core + adapter 2-pass)
  ↓
runSetupWizard()      → 대화형 인터뷰 → project.yaml, user-context.yaml 생성
  ↓
hydrate()             → .hbs 렌더링 → CLAUDE.md, agents/*.md, commands/*.md
  ↓
npm install           → pm-api, mcp-pm, spec-site 의존성 설치
  ↓
완료 메시지 출력
```

---

### 1-2. `doctor.mjs` 체크 항목

✅ **구현 완성도: 높음**

| # | 체크 항목 | 구현 방식 |
|---|----------|----------|
| 1 | `project.yaml` 존재 여부 | `access()` 직접 확인 |
| 2 | 플랫폼별 시스템 프롬프트 존재 (hydrated) | 어댑터 `manifest.yaml`의 `doctor_checks` 읽음 |
| 3 | `.hbs` 잔존 파일 없음 | 재귀 walk로 전체 탐색 |
| 4 | `agents/*.md` 파일 존재 | readdir 확인 |
| 5 | `sessions/index.yaml` 존재 | access 확인 |
| 6 | `spec-site/node_modules` 존재 | ⚠️ warning 처리 (fail 아님) |
| 7 | Tier 2 전용: `pm-api/package.json`, `wrangler.toml`, `schema-core.sql`, `mcp-pm/package.json` | pm-api 디렉토리 있을 때만 실행 |
| 8 | `.gitignore`에 `user-context.yaml`, `.secrets.yaml` 포함 | ⚠️ warning 처리 |

**미비점:**
- ⚠️ `pm-api`가 있을 때 `wrangler.toml.hbs`의 hydration 여부를 체크하지만, `.secrets.yaml` 존재 여부는 미확인
- ⚠️ `mcp-pm/dist/` (빌드 아티팩트) 존재 여부 미체크 → 빌드 안 된 채로 연결 시도 가능

---

### 1-3. `setup-wizard.mjs` UX 분석

✅ **전체 흐름: 완성**

#### 질문 단계 및 항목

**Phase 0: 사용자 설정**
- 이름 (기본값: "there")
- 역할/직함 (선택)
- 응답 언어: Korean/English/Japanese 선택
- 커뮤니케이션 스타일: Concise/Detailed/Casual 선택

**Phase 1: 기본 프로젝트 정보**
- 프로젝트명 (기본값: 디렉토리명)
- 태그라인 (선택)
- 프로젝트 타입: brownfield / greenfield

**Phase 1.5: 산업군** ✅ 2024년 이후 추가
- SaaS / E-commerce / B2B Platform / Generic 선택
- key_metrics, domain_expertise, example_entity 커스터마이징 가능

**Phase 2: 도메인**
- 도메인 여부 (Y/N)
- `id:name, ...` 형식 입력

**Phase 3: 개발 스코프**
- 별도 dev repo 여부
- dashboard repo명, service repo명

**Phase 4: Spec Site 모드**
- None / Static / Full interactive (백엔드 필요)

**Phase 5 (Interactive 선택 시): 백엔드 설정**
- PM API URL
- Feature flags: rewards, meetings, docs, initiatives
- 블록체인 통합 (TRON)

**Phase 6: 통합 설정**
- 카테고리별 provider 선택 (registry 기반 동적 로딩)
- provider별 `setup_questions` 순서대로 질문

#### UX 강점
- ✅ 선택지 있는 항목은 숫자 선택 UI (`select()`) 활용
- ✅ 기본값이 명확히 표시됨 (`[거기]`, `[my-project]`)
- ✅ 산업군 프리셋이 있어 빈 값 최소화
- ✅ `collectObjectList`로 복잡한 DB caution 목록도 수집 가능

#### UX 약점
- ⚠️ 총 질문 수가 많을 수 있음 (최대 20+ 질문) — 피로감 유발 가능
- ⚠️ "Do you have work domains?" 이후 `id:name, ...` 포맷을 모르면 막힘 — 예시 부족
- ⚠️ spec-site 모드 선택 설명이 단순 ("no backend" / "backend required") — 비전문가에게 불명확
- ❌ Ctrl+C 중단 시 복구 방법 없음 (재실행 필요)
- ❌ 선택 실수 시 되돌아가는 옵션 없음 (전체 재실행)

---

### 1-4. `scaffold.mjs` 파일 복사 로직

✅ **완성도: 높음**

**2-pass 복사 구조:**
1. Pass 1: `scaffold/` (core scaffold)
2. Pass 2: `adapters/{platform}/` (플랫폼 overlay)

**처리 방식별 파일 분류:**
- `.hbs` 파일 → 그대로 복사 (hydration은 별도 단계)
- `.append` 파일 → `.gitignore` 등에 append (중복 방지 로직 포함)
- `manifest.yaml` → 복사 제외 (어댑터 메타데이터)
- `spec-site/` → `--skip-spec-site` 플래그로 생략 가능
- `pm-api/`, `mcp-pm/` → `skipPmApi` 옵션으로 생략 가능

**충돌 처리:**
- 기존 파일 → `--force` 없으면 스킵 (카운트 기록)
- `--force` → 덮어쓰기 (카운트 기록)
- 새 파일 → 정상 복사

**미비점:**
- ⚠️ `skipPmApi` 옵션이 `copyScaffold()` 함수에는 있지만, `cli.mjs`에서 이 옵션을 전달하는 로직이 없음 → Tier 0/1 설정에서도 항상 pm-api/mcp-pm이 복사됨 (의도적일 수 있음)
- ⚠️ adapter overlay 2-pass 시, core에서 복사된 파일을 adapter가 덮어써야 할 경우, `overwriteExisting` 플래그가 false면 스킵됨 — adapter overlay가 제대로 적용 안 될 수 있음

---

## 2. MCP-PM 도구 등록 상태

### 2-1. pm-api (서버측) 도구 현황

✅ **pm-api**: `src/mcp.ts`에 **49개** TOOLS 정의 + 54개 handler 함수

| 카테고리 | 도구 수 | 주요 도구 |
|---------|---------|---------|
| Dashboard / Sprint | 10 | my_dashboard, list_sprints, activate_sprint, kickoff_sprint, close_sprint, get_velocity, sprint_summary, list_team_members, checkin_sprint, add_absence |
| Initiative | 3 | create_initiative, list_initiatives, update_initiative_status |
| Epic | 4 | list_epics, add_epic, update_epic, delete_epic |
| Story | 7 | list_stories, list_backlog, add_story, update_story, delete_story, assign_story, unassign_story |
| Task | 6 | list_my_tasks, get_task, update_task_status, update_task, add_task, delete_task |
| Standup | 5 | get_standup, save_standup, list_standup_entries, review_standup, get_standup_feedback |
| Memo | 6 | send_memo, list_my_memos, read_memo, reply_memo, resolve_memo, reject_memo |
| Retro | 7 | get_retro_session, add_retro_item, vote_retro_item, change_retro_phase, add_retro_action, update_retro_action_status, export_retro |
| Notification | 3 | check_notifications, mark_notification_read, mark_all_notifications_read |
| Event | 3 | emit_event, poll_events, ack_event |

**총 49개 도구** (TOOLS 배열 기준, 실제 handler 54개 — 차이는 utility 함수 포함)

---

### 2-2. mcp-pm (클라이언트측 MCP 서버) 도구 현황

⚠️ **mcp-pm** (`scaffold/mcp-pm/src/index.ts`): **18개** 도구만 노출

| # | 도구명 | 설명 |
|---|--------|------|
| 1 | `my_dashboard` | 대시보드 (tasks, memos, standup 상태) |
| 2 | `list_my_tasks` | 내 태스크 목록 |
| 3 | `get_task` | 태스크 상세 + 부모 스토리 + 형제 태스크 |
| 4 | `update_task_status` | 태스크 상태 변경 |
| 5 | `add_task` | 스토리에 태스크 추가 |
| 6 | `list_my_stories` | 내 스토리 목록 |
| 7 | `get_standup` | 스탠드업 조회 |
| 8 | `save_standup` | 스탠드업 저장 (upsert) |
| 9 | `send_memo` | 팀원에게 메모 전송 |
| 10 | `list_my_memos` | 내 메모 목록 |
| 11 | `read_memo` | 메모 읽기 + 읽음 처리 |
| 12 | `reply_memo` | 메모 답장 |
| 13 | `sprint_summary` | 스프린트 요약 (에픽별, 담당자별, 블로커) |
| 14 | `check_notifications` | 미읽은 알림 확인 |
| 15 | `mark_notification_read` | 알림 읽음 처리 |
| 16 | `check_open_memos` | 담당 메모 전체 확인 |
| 17 | `create_notification` | 알림 생성 |
| 18 | `resolve_memo` | 메모 해결 처리 |

**pm-api (49개) vs mcp-pm (18개) 격차 = 31개 미노출**

#### 미노출 주요 도구 (pm-api에 있지만 mcp-pm에 없음)

| 미노출 도구 | 중요도 | 이유 |
|------------|--------|------|
| `list_sprints`, `activate_sprint`, `kickoff_sprint`, `close_sprint` | 높음 | 스프린트 관리 핵심 |
| `list_epics`, `add_epic`, `update_epic`, `delete_epic` | 높음 | 에픽 CRUD 전무 |
| `list_stories`, `list_backlog`, `add_story`, `update_story`, `delete_story` | 높음 | 스토리 관리 대부분 미노출 |
| `create_initiative`, `list_initiatives` | 중간 | 이니셔티브 기능 없음 |
| `get_retro_session`, `add_retro_item`, `vote_retro_item`, `export_retro` | 중간 | 회고 기능 전무 |
| `get_standup_feedback`, `review_standup` | 낮음 | 스탠드업 고급 기능 |
| `mark_all_notifications_read` | 낮음 | 편의 기능 |

**결론:** mcp-pm은 개인 작업자 관점의 "조회 + 일일 업무"에 집중된 경량 MCP. 프로젝트 관리(에픽/스토리/스프린트 제어) 도구는 pm-api를 직접 HTTP로 호출하거나 별도 MCP 확장 필요.

---

### 2-3. Claude Code / Codex 연결 설정

⚠️ **공식 연결 가이드 없음** — 다음은 코드 분석 기반 추론:

**필요한 환경 변수:**
```bash
PM_API_URL=https://{your-worker}.workers.dev
PM_TOKEN={bearer-token}
```

**빌드 필수 (런타임 이전에 실행):**
```bash
cd mcp-pm && npm install && npm run build
# → dist/index.js 생성
```

**Claude Code 연결 방법 (`.mcp.json` 파일 — 생성 안내 없음):**
```json
{
  "mcpServers": {
    "pm": {
      "command": "node",
      "args": ["mcp-pm/dist/index.js"],
      "env": {
        "PM_API_URL": "https://your-worker.workers.dev",
        "PM_TOKEN": "your-token"
      }
    }
  }
}
```

**문제점:**
- ❌ 프로젝트 루트에 `.mcp.json` 예시 파일이 생성되지 않음
- ❌ `npm run build`를 언제 실행해야 하는지 안내 없음 (init에서 자동화 안 됨)
- ❌ `PM_TOKEN` 발급 방법 문서 없음 (pm-api auth.ts 로직 존재하지만 키 생성 방법 미설명)
- ⚠️ `mcp-notification-server`도 별도 존재하지만 통합 방법 미설명

---

### 2-4. `api-client.ts` 에러 핸들링

✅ **완성도: 양호**

| 처리 케이스 | 구현 상태 |
|------------|----------|
| `PM_API_URL` 또는 `PM_TOKEN` 미설정 | ✅ 즉시 에러 반환 (`Missing PM_API_URL or PM_TOKEN`) |
| HTTP 비성공 응답 | ✅ `data.error ?? HTTP ${resp.status}` 반환 |
| 네트워크 타임아웃 | ✅ `AbortSignal.timeout(15000)` |
| fetch 예외 (네트워크 오류) | ✅ `try/catch` + `err instanceof Error` 처리 |
| JSON 파싱 에러 | ⚠️ `resp.json()` 실패 시 catch 없음 → unhandled exception |

**미비점:**
- ⚠️ `resp.json()` 후 파싱 실패 시(HTML error page 등) catch 없음
- ⚠️ 재시도(retry) 로직 없음 — CF Workers 콜드 스타트 시 503 가능
- ⚠️ 요청/응답 로깅 없음 — 디버깅 어려움

---

## 3. .context/ 디렉토리 상태

### 3-1. 에이전트 페르소나 파일

✅ **완성도: 높음**

| 에이전트 | 파일 | 상태 |
|---------|------|------|
| 🎩 Oscar (Orchestrator) | `orchestrator.md.hbs` | ✅ 전체 템플릿 구조 완성 |
| 🎯 Simon (Strategist) | `strategist.md.hbs` | ✅ |
| 🗺️ Marco (Market Researcher) | `market-researcher.md.hbs` | ✅ |
| 📣 Mia (GTM Strategist) | `gtm-strategist.md.hbs` | ✅ |
| 📋 Penny (Planner) | `planner.md.hbs` | ✅ |
| 📐 Hank (Handoff Specialist) | `handoff-specialist.md.hbs` | ✅ |
| 📊 Vicky (Validator) | `validator.md.hbs` | ✅ |
| 📈 Danny (Analyst) | `analyst.md.hbs` | ✅ |
| 🎤 Rita (Researcher) | `researcher.md.hbs` | ✅ |
| 📡 Tara (Tracking Governor) | `tracking-governor.md.hbs` | ✅ |
| 🗓️ Nora (Operations) | `operations.md.hbs` | ✅ |
| 🔨 Derek (Developer) | `developer.md.hbs` | ✅ |
| 🧪 Quinn (QA) | `qa.md.hbs` | ✅ |
| 🎩✨ Ollie (Internal) | `ollie.md` | ✅ (정적, hydration 없음) |
| 🔮 Sage (Internal) | `sage.md` | ✅ (정적, hydration 없음) |

**TEMPLATE.md** — 에이전트 작성 표준 15개 섹션 명세서 완비 ✅

**미비점:**
- ⚠️ `ollie.md`, `sage.md`는 `.hbs`가 아닌 정적 파일 → 프로젝트별 커스터마이징 불가
- ⚠️ hydrate.mjs의 `agentMap`에 ollie, sage 없음 → 통합 마커 주입 대상 제외

---

### 3-2. 워크플로우 파일

✅ **완성도: 높음**

| 파일 | 내용 |
|------|------|
| `WORKFLOW.md.hbs` | 코드베이스 분석, 스프린트 운영, 통합 규칙 (Handlebars 기반) |
| `oscar/workflows/setup.md` | 6단계 Setup 워크플로우 상세 명세 |
| `oscar/workflows/multi-agent.md` | 멀티 에이전트 패턴 |
| `oscar/workflows/ollie-sage.md` | Ollie-Sage 협업 패턴 |
| `oscar/workflows/tracking.md` | 트래킹 이벤트 워크플로우 |
| `oscar/workflows/session-git.md` | 세션-Git 연동 워크플로우 |

**미비점:**
- ⚠️ `setup.md` 워크플로우는 Claude Code 기반으로 상세 작성되었으나, Codex/Gemini 플랫폼용 워크플로우 차이점 없음

---

### 3-3. 템플릿 파일

✅ **완성도: 높음 (12개 모두 존재)**

| 템플릿 | 소유자 | 상태 |
|--------|--------|------|
| `prd.md` | Simon | ✅ |
| `gtm-plan.md` | Mia | ✅ |
| `epic-spec.md` | PO | ✅ |
| `story-v2.md` | Penny | ✅ (Given-When-Then AC 구조) |
| `screen-spec.md` | Hank | ✅ |
| `sprint-plan.md` | Penny | ✅ |
| `sprint-status.yaml` | Penny | ✅ |
| `validation-report.md` | Vicky | ✅ |
| `guardrail.md` | Vicky | ✅ |
| `retrospective.md` | Nora | ✅ |
| `handoff-checklist.md` | Hank | ✅ |
| `dev-guide.md` | Derek | ✅ |

---

### 3-4. `project.yaml.example` 완성도

⚠️ **부분 완성**

**있는 것:**
- 전체 YAML 구조 (project, problem, solution, current_state, validation, operations, _meta)
- 각 키에 `{{handlebars}}` 형식의 인라인 주석
- `integrations` 섹션 (ga4, mixpanel, notion, linear, channel_io, intercom, prod_db, notebooklm, corti)
- `_meta.ambiguity_score`, `needs_deep_interview` 필드

**없는 것:**
- ⚠️ `spec_site.mode` 필드 미표시 (interactive/static/none 구분 없음)
- ⚠️ `pm_api` 섹션 없음 (Tier 2 백엔드 설정 미포함)
- ⚠️ 산업군 프리셋 관련 필드 (`domain_expertise`, `key_metrics`, `example_entity`) 없음
- ⚠️ `turso_cf`, `supabase`, `sqlite_lambda` integration 없음 (setup-wizard에는 있음)
- ❌ 실제 채워진 예시값 없음 — `""` 빈 문자열만 있어 이해 어려움

---

## 4. 외부 사용자 관점

### 4-1. README.md 품질

✅ **완성도: 높음**

**강점:**
- 핵심 가치 제안 명확 ("Developers have Copilot. Product Owners have Popilot.")
- 에이전트 팀 구조 도식화 잘 됨
- Quick Start (npx 2줄) 명확
- Setup Flow 스크린샷 수준의 예시 터미널 출력 있음
- 슬래시 커맨드 전체 목록 표 제공
- 아키텍처 디렉토리 구조 명확
- spec-site 설명 충실 (SplitPaneLayout, 추가 방법)
- 템플릿 목록 완전

**약점:**
- ⚠️ `deploy` / `migrate` 커맨드가 CLI Reference에 없음 (코드엔 있지만 README에서 제외)
- ⚠️ MCP-PM 연결 방법 전혀 없음 — Tier 2 사용자는 스스로 설정해야 함
- ⚠️ 플랫폼 선택 (`--platform=codex`, `--platform=gemini`) 옵션 설명 없음
- ⚠️ Prerequisites에 Cloudflare 계정 / wrangler CLI 필요성 미언급 (Tier 2)
- ❌ 한국어 사용자 대상 주 타겟이지만 README는 영어만

---

### 4-2. `npx popilot init` 첫 경험 예상

**전체 소요 시간 예상: 15-25분**

#### 긍정적 경험 포인트 ✅

```
1. npx popilot init my-project  → 즉시 시작 (설치 불필요)
2. 터미널 UI가 깔끔하고 단계 구분 명확
3. 산업군 프리셋 덕에 빈 값 최소화
4. 인터뷰 후 바로 CLAUDE.md + 에이전트 파일 생성 → 성취감
5. /start 타이핑 하나로 Oscar 활성화
```

#### 마찰 포인트 ⚠️❌

```
Phase 0: 언어/스타일 질문
  → 3개 연속 선택 → OK

Phase 1: 기본 정보
  → 태그라인 없으면 빈 채 넘어가도 됨 → OK

Phase 1.5: 산업군
  → Generic이 기본값 아님, 마지막에 있어서 헷갈림
  → 프리셋 내용 미리보기 없이 선택 → ⚠️

Phase 2: 도메인
  → "id:name, comma-separated" 포맷 예시 없음
  → "growth:Growth, marketing:Marketing" 형식 모르면 막힘 → ⚠️

Phase 4: Spec Site
  → "Full interactive — backend required" 의미 불명확
  → Cloudflare 계정 필요한지 모르고 선택 → ❌

Phase 5 (interactive): 백엔드
  → PM API URL을 지금 모른다면 빈 채 진행
  → 나중에 어떻게 설정하는지 안내 없음 → ❌

의존성 설치:
  → npm install 3회 (pm-api, mcp-pm, spec-site) → 느림
  → 각각 실패할 경우 경고만 표시, 복구 방법 없음 → ⚠️
```

---

### 4-3. 설치부터 "첫 스프린트 생성"까지 마찰 포인트

#### 전체 여정

```
[1] npx popilot init my-project       ✅ 쉬움
[2] 인터뷰 완료 (15-25분)              ⚠️ 길고 포맷 모호
[3] cd my-project                     ✅
[4] claude (Claude Code 열기)         ✅ (설치돼 있다면)
[5] /start                            ✅ 
[6] Oscar 활성화, 딥 인터뷰 진행       ⚠️ 추가 15-20분
[7] /sprint new                       ⚠️ 커맨드 존재 확인 필요
[8] /plan → Penny 활성화              ✅
[9] 첫 스프린트 생성 완료              ✅
```

#### 주요 마찰 포인트 정리

| # | 마찰 포인트 | 심각도 | 현재 상태 |
|---|------------|--------|----------|
| 1 | MCP-PM 연결 방법 없음 — Tier 2 기능 접근 불가 | 높음 | ❌ 문서 없음 |
| 2 | `mcp-pm/npm run build` 자동화 없음 — dist/ 없이 연결 불가 | 높음 | ❌ |
| 3 | setup 인터뷰 후 Oscar 딥 인터뷰 2중 | 중간 | ⚠️ 설계 의도지만 피로감 |
| 4 | 도메인 입력 포맷 불명확 | 중간 | ⚠️ |
| 5 | Spec Site interactive 선택 시 CF 계정 필요 안내 없음 | 중간 | ⚠️ |
| 6 | `deploy`/`migrate` 커맨드 README 미기재 | 낮음 | ⚠️ |
| 7 | `--platform` 옵션 문서화 없음 | 낮음 | ⚠️ |
| 8 | CLI 중단(Ctrl+C) 후 재시작 시 기존 파일 처리 불명확 | 낮음 | ⚠️ |

---

## 5. 종합 평가 및 우선 개선 과제

### 전체 완성도 요약

| 영역 | 평가 | 점수 |
|------|------|------|
| CLI 파이프라인 (init/hydrate/doctor/deploy/migrate) | ✅ 완성 | 9/10 |
| setup-wizard UX | ⚠️ 부분 완성 | 7/10 |
| scaffold 복사 로직 | ✅ 완성 | 8/10 |
| MCP-PM 도구 등록 (pm-api 기준) | ✅ 완성 | 8/10 |
| MCP-PM 도구 노출 (mcp-pm 기준) | ⚠️ 부분 완성 (18/49) | 5/10 |
| MCP 연결 설정 가이드 | ❌ 미구현 | 1/10 |
| api-client 에러 핸들링 | ⚠️ 부분 완성 | 7/10 |
| 에이전트 페르소나 | ✅ 완성 | 9/10 |
| 워크플로우 파일 | ✅ 완성 | 8/10 |
| 템플릿 파일 | ✅ 완성 | 10/10 |
| project.yaml.example | ⚠️ 부분 완성 | 6/10 |
| README.md | ⚠️ 부분 완성 | 7/10 |
| 첫 경험 (DX) | ⚠️ 부분 완성 | 6/10 |

---

### 우선 개선 과제 (P0 → P2)

#### P0: 배포 차단 이슈

1. **MCP-PM 연결 가이드 작성** — `.mcp.json` 예시 파일 자동 생성 + README 섹션 추가
2. **mcp-pm 빌드 자동화** — `init` 시 `npm run build` 추가 (현재 `npm install`만 함)

#### P1: UX 개선

3. **setup-wizard 도메인 입력 예시** — `id:name` 형식 인라인 예시 추가
4. **spec-site 모드 설명 보강** — "interactive 선택 = Cloudflare 계정 필요" 명시
5. **project.yaml.example 업데이트** — `pm_api`, `spec_site.mode`, 산업군 필드 추가 + 실제 예시값
6. **README deploy/migrate 섹션 추가** — Tier 2 사용자 가이드

#### P2: 기능 완성

7. **mcp-pm 도구 확장** — 에픽/스토리/스프린트 관리 도구 추가 (현재 18 → 30+)
8. **api-client.ts JSON 파싱 에러 처리** — `resp.json()` try/catch 추가
9. **adapter overlay 충돌 처리** — Pass 2에서 기존 파일 덮어쓰기 허용 옵션

---

*분석 완료: ~/heavaa/dev/popilot/analysis/cli-ux-analysis.md*
