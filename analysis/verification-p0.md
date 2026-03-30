# P0 블로커 검증 결과 (verification-p0.md)

> 작성: 2026-03-31 | 검증자: Quinn (QA 에이전트)
> 대상 브랜치: `feat/p0-external-usability` vs `main`
> 커밋 범위: 4개 (P0-A ~ P0-D)

---

## 최종 판정: ⚠️ REQUEST_CHANGES

> 핵심 이슈: mcp-pm 도구 목록이 pm-api TOOLS 배열과 완전 일치하지 않음 (6개 불일치). 나머지 P0 수정은 올바르게 적용됨.

---

## 1. 변경 파일 vs 계획 일치 ⚠️ WARNING

### 커밋 확인 (4개 ✅)
```
b418ed3 P0-D: DB 스키마/API 불일치 수정
ab750e7 P0-C: MCP 연결 가이드 추가
caf597c P0-B: CLI init에 mcp-pm 빌드 단계 추가
0868957 P0-A: mcp-pm 누락 도구 31개 추가 (18 → 49개 도구)
```

### 실제 변경 파일 (9개)
```
README.md                                 | +57
bin/cli.mjs                               | +12
scaffold/.mcp.json.example                | +12 (신규)
scaffold/mcp-pm/src/index.ts              | +791
scaffold/pm-api/sql/006-schema-fixes.sql  | +69 (신규)
scaffold/pm-api/src/routes/v2-kickoff.ts  | ±6
scaffold/pm-api/src/routes/v2-meetings.ts | ±24
scaffold/pm-api/src/routes/v2-nav.ts      | ±9
scaffold/pm-api/src/routes/v2-search.ts   | ±2
```

### 계획 vs 실제 불일치
| 계획 파일 | 실제 변경 | 판단 |
|----------|----------|------|
| scaffold/mcp-pm/src/index.ts | ✅ 변경됨 | OK |
| bin/cli.mjs | ✅ 변경됨 | OK |
| scaffold/.mcp.json.example | ✅ 신규 생성 | OK |
| README.md | ✅ 변경됨 | OK |
| scaffold/pm-api/sql/006-schema-fixes.sql | ✅ 신규 생성 | OK |
| scaffold/pm-api/src/routes/v2-meetings.ts | ✅ 변경됨 | OK |
| scaffold/pm-api/src/routes/v2-nav.ts | ✅ 변경됨 | OK |
| scaffold/pm-api/src/routes/v2-kickoff.ts | ✅ 변경됨 | OK |
| scaffold/pm-api/src/routes/v2-admin.ts | ❌ 미변경 | 계획에서는 변경 예정이었으나 main에서도 이미 email 참조 → 코드 변경 불필요 (올바른 판단) |
| scaffold/pm-api/src/routes/v2-search.ts | ✅ 변경됨 | OK (계획에 명시 없었으나 추가 수정됨) |

**판정:** ⚠️ WARNING — v2-admin.ts 미변경은 의도적이며 올바름. 계획 문서에 "코드 변경 불필요. 마이그레이션 006 실행이 전제 조건"으로 명시됨.

---

## 2. P0-A: mcp-pm 도구 완전성 ❌ FAIL

### 도구 수 카운트
- `scaffold/mcp-pm/src/index.ts`: **49개** `server.tool()` 등록
- `scaffold/pm-api/src/mcp.ts` TOOLS 배열: **49개** (단, `pm-api`는 serverInfo 이름이므로 실제 도구는 **49개**)

### 1:1 대조 결과

**pm-api에 있지만 mcp-pm에 없는 도구 (3개):**
| 도구명 | pm-api TOOLS | mcp-pm index.ts |
|--------|------------|----------------|
| `emit_event` | ✅ 573번 라인 | ❌ 없음 |
| `poll_events` | ✅ 593번 라인 | ❌ 없음 |
| `ack_event` | ✅ 604번 라인 | ❌ 없음 |

**mcp-pm에 있지만 pm-api TOOLS에 없는 도구 (3개):**
| 도구명 | mcp-pm index.ts | pm-api TOOLS |
|--------|----------------|-------------|
| `check_open_memos` | ✅ 575번 라인 | ❌ 없음 |
| `create_notification` | ✅ 607번 라인 | ❌ 없음 |
| `list_my_stories` | ✅ 273번 라인 | ❌ 없음 |

**불일치 요약:**
- 총 6개 도구가 불일치
- `emit_event`, `poll_events`, `ack_event`는 실시간 이벤트 시스템 도구로 누락 시 에이전트 이벤트 구독 불가
- `check_open_memos`, `create_notification`, `list_my_stories`는 mcp-pm에 구현됐지만 pm-api TOOLS에는 미등록 (역방향 누락)

### api-client.ts 함수 import ✅
```typescript
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from './api-client.js'
```
모든 HTTP 메서드 함수 정상 import됨.

**판정:** ❌ FAIL — 6개 도구 불일치. plan-p0.md의 목표인 "pm-api 49개 ↔ mcp-pm 49개 1:1 대응"을 달성하지 못함.

---

## 3. P0-B: CLI 빌드 자동화 ✅ PASS

### bin/cli.mjs 변경 확인
```javascript
// npm install 직후 빌드 단계 추가됨 (165~180번 라인)
console.log('  🔨 Building mcp-pm (TypeScript compile)...');
try {
  execSync('npm run build', { cwd: mcpPmDir, stdio: 'pipe' });
  console.log('     ✅ Done (dist/index.js ready)');
} catch {
  console.log('     ⚠️  Build failed. Run manually: cd mcp-pm && npm run build');
  console.log('     ℹ️  MCP connection requires dist/index.js to exist.');
}
```

- ✅ `npm install` 블록 바로 다음에 `npm run build` 단계 위치함
- ✅ 빌드 실패 시 graceful 처리 (catch → 사용자 안내 메시지)
- ✅ 빌드 성공 시 "dist/index.js ready" 확인 메시지
- ✅ 실제 빌드 검증: `cd scaffold/mcp-pm && npm run build` → 에러 없이 완료, `dist/index.js` 생성됨
- ⚠️ doctor.mjs에 dist 체크 항목 추가는 계획에 명시됐으나 미구현 (P1 수준)

**판정:** ✅ PASS — 핵심 요구사항 충족. doctor.mjs 체크는 미구현이나 P0 블로커 수준은 아님.

---

## 4. P0-C: 연결 가이드 ✅ PASS

### scaffold/.mcp.json.example ✅
파일 존재 확인. 내용 정합성 검증:
```json
{
  "mcpServers": {
    "pm": {
      "command": "node",
      "args": ["./mcp-pm/dist/index.js"],
      "env": {
        "PM_API_URL": "https://YOUR_PROJECT_NAME-pm-api.YOUR_CF_ACCOUNT.workers.dev",
        "PM_TOKEN": "YOUR_BEARER_TOKEN"
      }
    }
  }
}
```
- ✅ command: `node` (dist/index.js 빌드 결과물 실행)
- ✅ args: `./mcp-pm/dist/index.js` (P0-B 빌드 결과물 경로와 일치)
- ✅ env 변수: PM_API_URL, PM_TOKEN (api-client.ts에서 사용하는 변수명과 일치)
- ⚠️ JSON에 주석 없음 — 실제 JSON이므로 주석 불가, 별도 README 안내로 커버됨

### README.md MCP 연결 섹션 ✅
- ✅ `## 🔌 MCP-PM 연결 (Claude Code / Codex)` 섹션 존재 (178번 라인)
- ✅ 1. PM API 배포 방법
- ✅ 2. API 토큰 발급 (curl 예시 포함)
- ✅ 3. .mcp.json 설정 (.mcp.json.example 복사 방법 + JSON 예시)
- ✅ 4. Claude Code 확인 방법 (`/mcp` 명령)
- ✅ `.gitignore` 주의사항 포함
- ⚠️ "49개 도구"로 안내하나, 실제 불일치 6개 있음 (P0-A 이슈 연계)

**판정:** ✅ PASS — 연결 가이드 자체는 완성도 높음.

---

## 5. P0-D: 스키마/API 동기화 ✅ PASS

### sql/006-schema-fixes.sql 검증

#### SQLite 호환성 ✅
- `ALTER TABLE ... ADD COLUMN` → SQLite에서 지원됨 ✅
- `CREATE TABLE IF NOT EXISTS` → 안전한 생성 ✅
- `CREATE INDEX IF NOT EXISTS` → 안전한 생성 ✅
- `UPDATE ... WHERE ... IS NULL` → NULL 안전 업데이트 ✅

#### 하위 호환 (기존 컬럼 유지) ✅
- Fix 1 (nav_sprints): `title` 컬럼 유지, `label` 컬럼 ADD + title 데이터 복사
- Fix 2 (members): `email` 컬럼 ADD (기존 컬럼 미삭제)
- Fix 3 (meetings): 기존 `meeting_date`, `attendees`, `notes`, `action_items`, `agenda` 유지, 신규 컬럼 ADD
- Fix 4, 5: 신규 테이블 생성 (`IF NOT EXISTS`)

#### ⚠️ 주의: action_items 컬럼 누락 없음
`action_items`는 006.sql에서 ADD되지 않았으나, 원본 `schema-meetings.sql`에 이미 존재함. 정상.

### v2-meetings.ts COALESCE 폴백 ✅
```sql
-- GET /: COALESCE(date, meeting_date), COALESCE(participants, attendees)
-- INSERT: meeting_date, date 양쪽에 동시 삽입 (레거시 + 신규)
-- PATCH: fieldMap으로 신규 컬럼 매핑
```
- ✅ GET에서 COALESCE 폴백 올바르게 적용
- ✅ INSERT에서 레거시 + 신규 컬럼 동시 기록 (하위 호환)
- ⚠️ PATCH에서 `meeting_date`, `attendees` 레거시 컬럼 동기화 없음 → PATCH 후 레거시 참조 시 불일치 가능

### v2-nav.ts label/title 동기화 ✅
- GET /: `COALESCE(label, title)` 폴백 ✅
- GET /sprints/timeline: `COALESCE(label, title)` 폴백 ✅
- POST /sprints: label 컬럼으로 INSERT ✅ (마이그레이션 후 존재)
- PATCH /sprints/:id: `label = ?` 업데이트 시 `title = ?` 동기화 ✅

### v2-kickoff.ts title 포함 ✅
```sql
INSERT INTO nav_sprints (id, title, label, theme, start_date, end_date, status, sort_order)
VALUES (?, ?, ?, ?, ?, ?, 'planning', 0)
```
- ✅ INSERT 시 `title`과 `label` 둘 다 포함
- ✅ sellerking-sprint-planner가 `title` 직접 참조해도 안전

### v2-search.ts meetings 쿼리 ✅
```sql
SUBSTR(COALESCE(summary, notes), 1, 50) as preview,
COALESCE(date, meeting_date) as created_at
WHERE ... OR COALESCE(summary, notes) LIKE ?
ORDER BY COALESCE(date, meeting_date) DESC
```
- ✅ COALESCE 폴백 올바르게 적용

**판정:** ✅ PASS — 스키마/API 동기화 정상. PATCH 레거시 동기화 미흡은 ⚠️ WARNING.

---

## 6. 기존 코드 파손 여부

### sellerking-sprint-planner API 호환성 ✅ PASS
- `useNavStore.ts`: `r.label`, `r.title` 양쪽 참조 → 마이그레이션 후 양 컬럼 존재 → 안전
- `seed-nav.ts`, `seed-s55.ts`: `label` 컬럼으로 INSERT → 마이그레이션 후 존재 → 안전
- `pm-api` REST API: 라우트 구조 미변경, 하위 호환 유지 ✅

### TypeScript 컴파일 오류 ✅ (기존 오류와 구분)

**mcp-pm 빌드:** 에러 없음 ✅ (dist/ 정상 생성)

**pm-api tsc --noEmit 결과:**
```
src/index.ts(36,46): error TS7006: Parameter 's' implicitly has an 'any' type.
src/index.ts(105,25): error TS2345: ...missing DB_URL, DB_AUTH_TOKEN
src/index.ts(112,27): error TS2345: ...missing DB_URL, DB_AUTH_TOKEN
src/routes/v2-meetings.ts(301,55): error TS2307: Cannot find module '../utils/gemini-auth.js'
src/routes/v2-rewards.ts(108,29): error TS18047: 'blockchain' is possibly 'null'
src/routes/v2-rewards.ts(125,27): error TS18047: 'blockchain' is possibly 'null'
```

- `src/index.ts` 에러 3개: main 브랜치에도 동일 존재 → **기존 오류**
- `v2-meetings.ts(301)` gemini-auth 에러: main 브랜치에도 동일 존재 → **기존 오류**
- `v2-rewards.ts` 에러 2개: main 브랜치에도 동일 존재 → **기존 오류**

**P0 수정 파일에서 새로운 TypeScript 에러: 없음 ✅**

**판정:** ✅ PASS — 기존 코드 파손 없음, 신규 TS 에러 없음.

---

## 7. 잠재 문제 식별 (5개)

### 🔴 문제 1: emit_event / poll_events / ack_event 누락 (중요도: HIGH)

**위치:** `scaffold/mcp-pm/src/index.ts`

**설명:**
pm-api의 에이전트 이벤트 시스템(`emit_event`, `poll_events`, `ack_event`)이 mcp-pm에 등록되지 않음. 에이전트가 실시간 협업 이벤트(nudge, 알림)를 구독하거나 발행하는 기능이 MCP를 통해 사용 불가.

**영향:** nudge 시스템이 MCP 에이전트 레이어에서 동작 불가

**수정 방안:** mcp-pm에 3개 도구 추가 등록

---

### 🔴 문제 2: check_open_memos / create_notification / list_my_stories 역방향 불일치 (중요도: HIGH)

**위치:** `scaffold/mcp-pm/src/index.ts`

**설명:**
mcp-pm에서 구현한 `check_open_memos`, `create_notification`, `list_my_stories`가 pm-api TOOLS 배열에는 등록되지 않음. pm-api 직접 MCP 엔드포인트(/api/mcp)를 통해 이 도구들을 호출할 수 없음.

**영향:** pm-api의 MCP 엔드포인트와 mcp-pm 서버가 서로 다른 도구셋 노출 → 프로덕션 일관성 문제

**수정 방안:** pm-api src/mcp.ts TOOLS 배열에 3개 도구 추가 OR mcp-pm의 해당 도구들을 pm-api 도구로 대체

---

### 🟡 문제 3: PATCH /meetings/:id 레거시 컬럼 미동기화 (중요도: MEDIUM)

**위치:** `scaffold/pm-api/src/routes/v2-meetings.ts` (PATCH 핸들러)

**설명:**
PATCH로 `date`를 업데이트해도 `meeting_date`(레거시)는 동기화되지 않음. `participants` 업데이트 시 `attendees`(레거시)도 동기화되지 않음. 레거시 컬럼을 직접 참조하는 외부 코드가 있다면 stale data 발생.

```typescript
// 현재: date만 업데이트
fieldMap: { date: 'date', participants: 'participants', ... }

// 필요: 레거시 컬럼도 동기화
// date 업데이트 시 meeting_date = ? 도 함께 실행
// participants 업데이트 시 attendees = ? 도 함께 실행
```

**영향:** meeting_date/attendees 직접 쿼리하는 레거시 코드에서 잘못된 데이터 반환 가능성

---

### 🟡 문제 4: 마이그레이션 자동 실행 메커니즘 미확인 (중요도: MEDIUM)

**위치:** `scaffold/pm-api/sql/006-schema-fixes.sql`

**설명:**
006-schema-fixes.sql이 신규 생성됐으나, 기존 배포된 인스턴스에 이 마이그레이션이 자동으로 적용되는지 불명확함. popilot의 마이그레이션 실행 메커니즘(어떤 파일에서 순서대로 SQL을 실행하는지) 검증 필요.

특히 `ALTER TABLE nav_sprints ADD COLUMN label TEXT`를 이미 label 컬럼이 있는 DB에 실행 시 SQLite에서 **에러 발생** (SQLite는 IF NOT EXISTS 없는 ADD COLUMN을 지원하지 않음).

**영향:** 재실행 시 오류 → `ALTER TABLE nav_sprints ADD COLUMN IF NOT EXISTS label TEXT` 형식이나 트랜잭션 분리 필요. SQLite는 `ADD COLUMN IF NOT EXISTS` 미지원 (MySQL/PostgreSQL만 지원).

**수정 방안:** 마이그레이션 실행 전 컬럼 존재 여부 체크 또는 `BEGIN`/`COMMIT` + 오류 무시 처리

---

### 🟡 문제 5: README에서 "49개 도구" 안내 vs 실제 불일치 (중요도: LOW)

**위치:** `README.md` (180번, 229번 라인)

**설명:**
README에서 "49개 도구"를 두 번 언급하지만, pm-api TOOLS와 mcp-pm 사이에 6개 불일치가 존재함. 사용자가 `/mcp`로 확인 시 `emit_event` 등 3개가 표시되지 않아 "49개 도구 목록" 기대와 다름.

**영향:** 사용자 혼란, 지원 요청 증가

**수정 방안:** P0-A 도구 불일치 해결 후 자연히 해결됨.

---

## 검증 요약

| 항목 | 결과 | 비고 |
|------|------|------|
| 1. 변경 파일 vs 계획 일치 | ⚠️ WARNING | v2-admin.ts 미변경은 의도적 (올바름) |
| 2. P0-A: mcp-pm 도구 완전성 | ❌ FAIL | 6개 도구 불일치 (emit/poll/ack + check_open/create_notif/list_my_stories) |
| 3. P0-B: CLI 빌드 자동화 | ✅ PASS | 빌드 단계 추가, graceful 처리 |
| 4. P0-C: 연결 가이드 | ✅ PASS | .mcp.json.example + README 섹션 완성 |
| 5. P0-D: 스키마/API 동기화 | ✅ PASS | COALESCE 폴백, 레거시 호환 유지 |
| 6. 기존 코드 파손 | ✅ PASS | 신규 TS 에러 없음, sellerking 호환 |
| 7. 잠재 문제 | ⚠️ 5개 | 2개 HIGH, 3개 MEDIUM/LOW |

---

## 권고 사항

### 필수 수정 (REQUEST_CHANGES 이유)

1. **mcp-pm에 누락 도구 추가:**
   ```typescript
   // scaffold/mcp-pm/src/index.ts에 추가
   server.tool('emit_event', ...)
   server.tool('poll_events', ...)
   server.tool('ack_event', ...)
   ```

2. **pm-api TOOLS 배열에 역방향 누락 도구 추가 또는 정리:**
   ```typescript
   // scaffold/pm-api/src/mcp.ts TOOLS 배열에 추가
   { name: 'check_open_memos', ... }
   { name: 'create_notification', ... }
   { name: 'list_my_stories', ... }
   ```
   또는 mcp-pm의 해당 도구들을 pm-api 기존 도구로 대체.

### 선택 수정 (권장)

3. **PATCH /meetings 레거시 컬럼 동기화** 추가
4. **마이그레이션 재실행 안전성** 검토 (ADD COLUMN 중복 방지)
5. **README "49개 도구"** 표현은 P0-A 수정 후 자연히 일치됨

---

*verification-p0.md 작성 완료 — Sage 또는 Oscar에게 전달 준비 완료*
