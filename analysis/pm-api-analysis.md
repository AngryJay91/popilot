# pm-api 코드 분석 리포트

> 분석일: 2026-03-31  
> 경로: `~/heavaa/dev/popilot/scaffold/pm-api/`

---

## 1. MCP 도구 구현 상태 (src/mcp.ts)

### 전체 현황

| 구분 | 수량 |
|------|------|
| TOOLS 배열 등록 도구 수 | 49개 |
| handleTool switch case 수 (도메인 도구만) | 54개 |
| 실제 도구로 제공되는 건 (TOOLS 등록 기준) | 49개 |
| handleTool에만 있고 TOOLS 미등록 (숨겨진 도구) | 5개 |

### ✅ 완전 구현된 도구 (49개 — TOOLS 배열 기준)

모든 49개 도구는 `handleTool()`에 case가 있고, 각 도메인 파일에 실제 구현 함수가 있음.

```
Dashboard/Nav: my_dashboard, list_sprints, activate_sprint, kickoff_sprint, close_sprint,
               get_velocity, sprint_summary, list_team_members, create_initiative,
               list_initiatives, update_initiative_status

Epics:  list_epics, add_epic, update_epic, delete_epic

Stories: list_stories, list_backlog, add_story, update_story, delete_story

Tasks:  list_my_tasks, get_task, update_task_status, update_task, add_task, delete_task

Standup: get_standup, save_standup, list_standup_entries, review_standup, get_standup_feedback

Memos:  send_memo, list_my_memos, read_memo, reply_memo, resolve_memo

Retro:  get_retro_session, add_retro_item, vote_retro_item, change_retro_phase,
        add_retro_action, update_retro_action_status, export_retro

Notifications: check_notifications, mark_notification_read, mark_all_notifications_read

Agent Events: emit_event, poll_events, ack_event
```

### ⚠️ handleTool에 있지만 TOOLS 배열 미등록 (숨겨진 도구 — MCP 클라이언트에 노출 안 됨)

| 도구 이름 | 담당 함수 | 문제 |
|-----------|----------|------|
| `assign_story_to_sprint` | `toolAssignStory` | TOOLS 배열 없음 → 클라이언트 미노출 |
| `unassign_story_from_sprint` | `toolUnassignStory` | TOOLS 배열 없음 → 클라이언트 미노출 |
| `checkin_sprint` | `toolCheckinSprint` | TOOLS 배열 없음 → 클라이언트 미노출 |
| `add_absence` | `toolAddAbsence` | TOOLS 배열 없음 → 클라이언트 미노출 |
| `reject_memo` | `toolRejectMemo` | TOOLS 배열 없음 → 클라이언트 미노출 |

> **문제:** MCP 프로토콜에서 `tools/list` 응답에 포함되지 않아 AI 에이전트가 이 도구들을 사용할 수 없음. 의도적인 숨김인지 누락인지 불명확.

---

## 2. src/mcp-tools/ 파일별 구현 완성도

### ✅ sprint.ts

- `toolListSprints`, `toolActivateSprint`, `toolCloseSprint`, `toolCheckinSprint`, `toolAddAbsence`, `toolGetVelocity`, `toolKickoffSprint`, `toolSprintSummary` 전부 구현
- sprint close 시 retro 세션 자동 생성 ✅
- velocity 저장 ✅
- 불완전 스토리 backlog 반환 ✅
- **부분 이슈**: `toolCheckinSprint`가 `member_ids`(숫자배열)를 받는데, 실제 `members` 테이블 id와 정합성 검증 없음

### ✅ epic.ts

- `toolListEpics`, `toolAddEpic`, `toolUpdateEpic`, `toolDeleteEpic` 전부 구현
- 에픽 삭제 시 stories epic_id NULL 처리 ✅
- `last_insert_rowid()` 방식으로 신규 ID 조회 ✅

### ✅ story.ts

- `toolListStories`, `toolListBacklog`, `toolAddStory`, `toolUpdateStory`, `toolDeleteStory`, `toolAssignStory`, `toolUnassignStory` 전부 구현
- 다중 assignee 지원 (콤마 구분) ✅
- assignee 변경 시 알림 발송 ✅
- status 변경 시 agent webhook 호출 ✅
- **부분 이슈**: `toolUpdateStory`에서 `epic_id` 업데이트 시 `epic_uid`는 업데이트 안 됨 (비정합)

### ✅ task.ts

- `toolListTasks`, `toolGetTask`, `toolUpdateTaskStatus`, `toolUpdateTask`, `toolAddTask`, `toolDeleteTask` 전부 구현
- task SP 변경 시 story SP 자동 합산 ✅
- 형제 태스크 표시 ✅

### ✅ memo.ts

- `toolSendMemo`, `toolListMemos`, `toolReadMemo`, `toolReplyMemo`, `toolResolveMemo`, `toolRejectMemo` 전부 구현
- `[D-XX]` 태그 파싱 ✅
- supersedes 체인 ✅
- 멀티 수신자 지원 ✅
- agent event 자동 발행 ✅
- **부분 이슈**: `toolReadMemo`가 읽음 처리(read mark)를 하지 않음 — 설명에는 "mark as read"라고 했지만 실제 DB update 없음

### ✅ standup.ts

- `toolGetStandup`, `toolSaveStandup`, `toolListStandupEntries`, `toolReviewStandup`, `toolGetStandupFeedback` 전부 구현
- UPSERT 패턴 ✅
- 스프린트/날짜 이중 검증 ✅

### ✅ retro.ts

- `toolGetRetroSession`, `toolAddRetroItem`, `toolVoteRetroItem`, `toolChangeRetroPhase`, `toolAddRetroAction`, `toolUpdateRetroActionStatus`, `toolExportRetro` 전부 구현
- 투표/취소 토글 ✅
- 단계별 phase 전환 ✅

### ✅ dashboard.ts

- `toolDashboard`, `toolListTeamMembers` 구현 완료
- 4개 지표 병렬 쿼리 (tasks/memos/standup/notifications) ✅

### ✅ initiative.ts

- `toolCreateInitiative`, `toolListInitiatives`, `toolUpdateInitiativeStatus` 구현 완료
- 상태 전이 유효성 검증 (`canTransition` 함수 위임) ✅

### ✅ notification.ts

- `toolCheckNotifications`, `toolMarkNotificationRead`, `toolMarkAllNotificationsRead` 구현 완료

### ✅ event.ts

- `toolEmitEvent`, `toolPollEvents`, `toolAckEvent` 구현 완료
- 분당 30건 rate limit (in-memory Map 방식) ✅
- memo 관련 이벤트 직접 emit 차단 ✅
- **주의**: rate limit이 in-memory이므로 CF Workers 재시작/스케일아웃 시 초기화됨

### ✅ utils.ts

- `resolveSprint`, `notify`, `checkRateLimit`, `emitAgentEvent`, `progressBar` 전부 구현 완료

---

## 3. src/routes/ v2 API 라우트 완성도

### ✅ v2-pm.ts (Epics/Stories/Tasks)

| 엔드포인트 | 상태 |
|-----------|------|
| GET /epics | ✅ |
| POST /epics | ✅ |
| PATCH /epics/:id | ✅ |
| DELETE /epics/:id | ✅ |
| GET /data | ✅ (sprint/backlog 필터) |
| POST /stories | ✅ |
| PATCH /stories/:id | ✅ |
| DELETE /stories/:id | ✅ |
| POST /tasks | ✅ |
| PATCH /tasks/:id | ✅ |
| DELETE /tasks/:id | ✅ |
| POST /stories/:id/link-pr | ✅ |
| GET /stories/:id/prs | ✅ |
| POST /link-pr-by-title | ✅ |
| GET /stories/:id/comments | ✅ |
| POST /stories/:id/comments | ✅ |
| DELETE /stories/:id/comments/:commentId | ✅ |
| **GET /epics/:id** | ❌ **미구현** (단건 조회 없음) |
| **GET /stories/:id** | ❌ **미구현** (단건 조회 없음) |
| **GET /tasks/:id** | ❌ **미구현** (단건 조회 없음) |

### ✅ v2-nav.ts (Sprints)

| 엔드포인트 | 상태 |
|-----------|------|
| GET / | ✅ |
| POST /sprints | ✅ |
| PATCH /sprints/:id | ✅ |
| DELETE /sprints/:id | ✅ |
| POST /sprints/:id/status | ✅ |
| POST /sprints/:id/kickoff | ✅ |
| POST /sprints/:id/activate | ✅ |
| GET /sprints/velocity | ✅ |
| GET /sprints/timeline | ✅ |
| POST /stories/carry-over | ✅ |
| **GET /sprints/:id** | ❌ **미구현** (단건 조회 없음) |

**⚠️ 컬럼명 불일치**: `schema-core.sql`의 `nav_sprints`는 `title` 컬럼이지만, `v2-nav.ts`와 `v2-kickoff.ts`는 `label` 컬럼으로 INSERT/SELECT함. 런타임 오류 발생 가능.

### ✅ v2-memos.ts

| 엔드포인트 | 상태 |
|-----------|------|
| GET /all | ✅ (페이지네이션, 다중 필터) |
| GET /unread-count | ✅ |
| GET /replies | ✅ |
| POST /replies | ✅ |
| DELETE /replies/:id | ✅ |
| GET /by-id/:id | ✅ |
| GET /:pageId | ✅ |
| POST / | ✅ |
| PATCH /:id/resolve | ✅ |
| PATCH /:id/reopen | ✅ |
| DELETE /:id | ✅ |
| **PATCH /:id** | ❌ **미구현** (일반 내용 수정 불가) |

### ✅ v2-standup.ts

- GET /, POST /, GET /feedback, POST /feedback 등 구현. 규모는 작지만 완성도 높음.

### ✅ v2-retro.ts

- GET /, POST /items, POST /items/:id/vote, PATCH /phase, POST /actions, PATCH /actions/:id 등 구현 완료.

### ✅ v2-notifications.ts

- GET /, PATCH /:id/read, PATCH /read-all 구현 완료.

### ✅ v2-initiatives.ts

- GET /, POST /, PATCH /:id/status 구현 완료.

### ✅ v2-dashboard.ts

- GET /unread-memos, GET /sprint-progress 등 구현. 대시보드 집계 쿼리 완성도 높음.

### ✅ v2-kickoff.ts

- POST /create, POST /:id/checkin, POST /:id/absence, GET /:id/absences, GET /:id/capacity 구현.
- **⚠️ 컬럼명 불일치**: `label` 컬럼으로 INSERT (스키마는 `title`)

### ✅ v2-admin.ts

- GET /members, PATCH /members/:id, POST /members (token 생성), POST /members/:token/regenerate 등 구현.
- **⚠️ 스키마 불일치**: `members` 테이블에 `email` 컬럼이 없는데 PATCH에서 `email` 업데이트 시도.

### ✅ v2-docs.ts

- GET /, GET /:id, PUT /:id 구현. **❌ DELETE 미구현, PATCH 미구현** (버전 관리 미연동)

### ✅ v2-meetings.ts

- GET /, GET /:id, POST /, PATCH /:id 구현.
- **⚠️ 스키마 불일치**: `schema-meetings.sql`은 `meeting_date`, `attendees`, `notes` 컬럼인데, 라우트는 `date`, `participants`, `summary`, `raw_transcript`, `decisions` 컬럼 사용. 런타임 오류 확정.
- **❌ DELETE 미구현**

### ✅ v2-rewards.ts

- GET /, POST /, PATCH /:id, GET /summary 구현. 대체로 완성.

### ✅ v2-activity.ts

- GET / (활동 피드) 구현. Read-only.

### ✅ v2-search.ts

- GET / (통합 검색) 구현.
- **⚠️ 스키마 불일치**: `meetings` 테이블에서 `summary`, `date` 컬럼 참조하지만 실제 스키마는 `notes`, `meeting_date`.

### ⚠️ v2-policy.ts

- GET /:sprint/:epicId, PUT /:sprint/:epicId 구현.
- **❌ 스키마 없음**: `policy_documents` 테이블이 SQL 파일 어디에도 없음 (런타임 오류).

### ⚠️ v2-scenarios.ts

- GET /:pageId/:sprint, PUT /:pageId/:sprint/:scenarioId, DELETE /:pageId/:sprint/:scenarioId 구현.
- **❌ 스키마 없음**: `scenario_data` 테이블이 SQL 파일 어디에도 없음 (런타임 오류).

### ✅ v2-page-content.ts

- GET /:pageId/:sprint 구현 (spec_rules, spec_scenarios, spec_areas, spec_versions, spec_wireframe_meta 조회).
- 쓰기(PUT/PATCH) 엔드포인트 없음 — 읽기 전용으로 설계된 것으로 보임.

### ✅ v2-user.ts

- GET /members, POST /activity, POST /memo-seen 구현.

### ✅ routes/auth.ts

- POST /verify 구현.

---

## 4. SQL 스키마 분석

### ✅ FK 관계 정합성

`schema-core.sql` 기준 주요 FK 관계:

```
sprint_members.sprint_id    → nav_sprints.id
sprint_members.member_id    → members.id
member_absences.sprint_id   → nav_sprints.id
member_absences.member_id   → members.id
pm_stories.epic_id          → pm_epics.id
pm_stories.sprint           → nav_sprints.id
pm_stories.assignee_id      → members.id
pm_tasks.story_id           → pm_stories.id
pm_tasks.assignee_id        → members.id
pm_standup_feedback.standup_entry_id → pm_standup_entries.id
memo_replies.memo_id        → memos_v2.id
retro_items.session_id      → retro_sessions.id
retro_votes.item_id         → retro_items.id
retro_actions.session_id    → retro_sessions.id
page_content.page_id        → nav_pages.id
scenarios.page_id           → nav_pages.id
story_comments.story_id     → pm_stories.id
```

**⚠️ 누락된 FK**:
- `pm_standup_entries.sprint` → `nav_sprints.id` FK 없음 (TEXT 필드만 있음)
- `memos_v2.supersedes_id` → `memos_v2.id` FK 없음

### ⚠️ 인덱스 현황

`schema-core.sql`에 인덱스가 **전혀 없음**. `001-memo-v2.sql`에만 memos_v2/memo_replies/notifications 인덱스 있음.

| 파일 | 인덱스 |
|------|--------|
| schema-core.sql | ❌ 없음 |
| 001-memo-v2.sql | ✅ memos_v2(3개), memo_replies(1개) |
| 002-notifications.sql | ✅ notifications(2개) |
| 003-content.sql | ✅ spec_rules(1개) |
| 004-agent-events.sql | ✅ agent_events(2개) |

**누락된 중요 인덱스** (쿼리 분석 기준):
- `pm_tasks(assignee)` — 내 태스크 조회 빈번
- `pm_tasks(story_id)` — story 하위 task 조회
- `pm_stories(sprint)` — sprint별 스토리 조회 빈번
- `pm_stories(assignee_id)` — 담당자별 조회
- `pm_standup_entries(sprint, entry_date)` — 날짜별 조회

### ⚠️ 마이그레이션 순서 정합성

| 파일 | 내용 | 문제 |
|------|------|------|
| `schema-core.sql` | 전체 초기 스키마 | 기준 스키마 |
| `001-memo-v2.sql` | auth_tokens, user_activity, memos_v2, memo_replies | **auth_tokens 구조가 schema-core와 다름** (id 컬럼 없음, user_email 컬럼 있음) |
| `002-notifications.sql` | notifications 테이블 | schema-core와 중복 (IF NOT EXISTS로 충돌 방지) |
| `003-content.sql` | spec_rules, spec_scenarios, spec_areas, spec_versions, spec_wireframe_meta | 정상 |
| `004-agent-events.sql` | agent_events 테이블 | schema-core와 중복 |
| `005-epic-sprint-decoupling.sql` | pm_epics에 sort_order, origin_sprint 추가 | schema-core에는 해당 컬럼 없음 → **ALTER TABLE 필요** |

**핵심 문제**: `schema-core.sql`과 `001-004` 마이그레이션이 병렬 트랙으로 존재. 어느 것을 먼저/단독으로 실행해야 하는지 불명확. `schema-core.sql`이 최신 통합본이라면 `001-004`는 레거시.

### ❌ 누락된 테이블

| 테이블 | 참조 위치 | 상태 |
|--------|----------|------|
| `policy_documents` | v2-policy.ts | ❌ SQL 파일 없음 |
| `scenario_data` | v2-scenarios.ts | ❌ SQL 파일 없음 |
| `members.email` | v2-admin.ts PATCH | ❌ schema-core members에 email 컬럼 없음 |

---

## 5. nudge.ts 분석

### ✅ 룰 6개 구현

| 룰 ID | 설명 | 트리거 조건 |
|-------|------|------------|
| `review_overdue` | 리뷰 요청 24시간 미답변 | review_required=1, status=open, 24h 초과 |
| `sprint_deadline` | 스프린트 마감 3일 이내 + 50% 미만 | 활성 스프린트 end_date 기준 |
| `standup_missing` | 오늘 스탠덥 미제출 | UTC 08:00 이후 조건 |
| `task_stagnant` | 태스크 3일 이상 in-progress 정체 | pm_tasks.updated_at 기준 |
| `blocker_open` | 미해결 blocker 메모 | memo_type='blocker', status='open' |
| `sprint_daily_report` | 데일리 진행률 보고 | UTC 08:00 이후 조건 |

### SQL 쿼리 정확성

**✅ 정확한 쿼리**:
- `review_overdue`: `review_required = 1 AND status = 'open' AND created_at <= datetime('now', '-24 hours')` — 정확
- `sprint_deadline`: active sprint 조회 후 stories 완료율 계산 — 정확
- `task_stagnant`: JOIN으로 active sprint 스토리에 속한 태스크만 필터 — 정확
- `blockerOpen`: `memo_type = 'blocker' AND status = 'open'` — 정확

**⚠️ 주의할 쿼리**:
- `standup_missing`: `auth_tokens WHERE is_active = 1`로 팀원을 정의 — `members` 테이블이 아닌 auth_tokens 기준. 토큰 없는 멤버 누락 가능. `members WHERE is_active = 1` 사용이 더 적절.
- `sprint_daily_report`: UTC 시간 기반 조건 (`hour < 8` 이전 skip) — KST 17:00 이전이면 발송 안 됨. 한국 팀 기준으로는 적절하지만 타임존 주석 부재.

**⚠️ nudge_log INSERT**: `logNudges` 함수에서 `nudge_log` 테이블에 insert하지만, `nudge_log`가 `schema-core.sql`에만 존재하고 마이그레이션 파일에는 없음. schema-core를 실행하지 않으면 오류 발생.

---

## 6. auth.ts 분석

### ✅ 인증 방식

- **Bearer Token** 방식 (`Authorization: Bearer <token>`)
- DB 조회 기반 (stateless DB lookup)
- 토큰 만료 지원 (`expires_at IS NULL OR expires_at > datetime('now')`)
- `is_active` 플래그로 비활성화 지원

### ⚠️ 보안 이슈

| 이슈 | 심각도 | 설명 |
|------|--------|------|
| **평문 토큰 저장** | 🔴 High | DB에 토큰이 평문으로 저장됨. 해시(bcrypt/sha256) 처리 없음. DB 유출 시 모든 토큰 노출. |
| **토큰 생성 로직 없음** | 🟡 Medium | `routes/auth.ts`에는 verify만 있고 토큰 발급 엔드포인트 없음. admin이 직접 토큰 문자열을 DB에 넣는 방식 (`v2-admin.ts POST /members`). 강도 검증 없음. |
| **Rate limiting 없음** | 🟡 Medium | auth verify 엔드포인트에 brute-force 방어 없음. |
| **CORS 설정 환경변수 의존** | 🟢 Low | `ALLOWED_ORIGINS` 미설정 시 localhost만 허용 — 프로덕션에서 설정 필요. 설정 실수 시 전체 차단 또는 전체 허용 위험. |
| **auth_tokens 스키마 이중 정의** | 🟡 Medium | `schema-core.sql`(id PK 포함)과 `001-memo-v2.sql`(token PK)이 다름. 어느 스키마 기준으로 실행하느냐에 따라 인증 동작이 달라질 수 있음. |
| **토큰 재발급 시 이전 토큰 무효화 없음** | 🟡 Medium | `POST /members/:token/regenerate`가 기존 토큰을 새 토큰으로 교체하지만, 트랜잭션 없이 단순 UPDATE. 중간 실패 시 두 토큰 모두 유효할 수 있음. |

---

## 7. wrangler.toml.hbs 분석

```toml
name = "{{project.name}}-pm-api"
main = "src/index.ts"
compatibility_date = "2025-03-10"

[triggers]
crons = ["0 1 * * *", "0 8 * * *"]
```

### ✅ 구성된 항목

- CF Workers 진입점 (`src/index.ts`) ✅
- compatibility_date 설정 ✅
- Cron 트리거 2개 (nudge용: UTC 01:00, 08:00) ✅
- 시크릿 주입 방법 주석 안내 (`wrangler secret put`) ✅

### ⚠️ 부분 완성

| 항목 | 상태 | 설명 |
|------|------|------|
| 프로젝트 이름 | ⚠️ | `{{project.name}}` 핸들바 미치환 — scaffold 템플릿 단계 |
| DB 바인딩 | ❌ | `[vars]` 또는 `[[d1_databases]]` 섹션 없음. Turso 연결은 환경변수(`TURSO_URL`, `TURSO_AUTH_TOKEN`)만으로 처리 — CF Workers secrets으로 주입 필요 |
| 환경별 설정 분리 | ❌ | `[env.production]` / `[env.staging]` 구분 없음 |
| `ALLOWED_ORIGINS` | ❌ | 프로덕션 CORS origin 설정 미포함 |
| `NUDGE_WEBHOOK_URL` | ❌ | webhook 설정 미포함 |

---

## 요약 표

| 항목 | 상태 | 핵심 문제 |
|------|------|-----------|
| MCP 도구 구현 | ✅ 49/49 구현 완료 | 숨겨진 도구 5개 TOOLS 배열 미등록 |
| mcp-tools 파일 | ✅ 전체 구현 완료 | toolReadMemo 읽음처리 누락, epic_uid 비동기화 |
| v2 API 라우트 | ⚠️ 부분 완성 | 단건 GET 다수 누락, meetings/policy/scenarios 스키마-코드 불일치 |
| SQL 스키마 | ⚠️ 부분 완성 | policy_documents/scenario_data 테이블 없음, nav_sprints label/title 불일치, 인덱스 대부분 누락 |
| nudge.ts | ✅ 6개 룰 구현 | standup_missing이 members 아닌 auth_tokens 기준 |
| auth.ts | ⚠️ 부분 완성 | 토큰 평문 저장 (보안 위험), 토큰 발급 로직 미흡 |
| wrangler.toml.hbs | ⚠️ 부분 완성 | 핸들바 미치환, 환경별 설정 없음 |

---

## 즉시 수정 권장 (Critical)

1. **`nav_sprints` 컬럼명 불일치** — `schema-core.sql`의 `title` vs 라우트의 `label` → 런타임 INSERT 오류
2. **`meetings` 테이블 컬럼 불일치** — `schema-meetings.sql`과 `v2-meetings.ts` 완전 불일치 → 모든 meetings API 오류
3. **`policy_documents`, `scenario_data` 테이블 없음** — 해당 라우트 전체 오류
4. **MCP 숨겨진 도구 5개** — TOOLS 배열에 추가하거나 의도적 제거인지 결정
5. **토큰 평문 저장** — 최소 SHA-256 해시 처리 필요
