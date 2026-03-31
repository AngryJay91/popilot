# Popilot P0 블로커 해결 계획 (plan-p0.md)

> 작성: 2026-03-31 | 작성자: Penny (계획 에이전트)
> 목표: "외부 사용자가 npx popilot init → MCP 연결 → 실제 사용" 가능한 상태

---

## 목차

1. [변경 파일 목록 + 이유](#1-변경-파일-목록--이유)
2. [인터페이스 변경 여부](#2-인터페이스-변경-여부)
3. [테스트 커버리지 계획](#3-테스트-커버리지-계획)
4. [리스크 + 대응 전략](#4-리스크--대응-전략)
5. [P0별 구체적 코드 변경 사항](#5-p0별-구체적-코드-변경-사항)

---

## 1. 변경 파일 목록 + 이유

### P0-A: mcp-pm 누락 도구 31개 추가 등록

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| `scaffold/mcp-pm/src/index.ts` | **추가** | pm-api 49개 → mcp-pm 18개 → 31개 누락. 에픽/스토리/스프린트 관리가 없어 에이전트가 PM 핵심 기능을 사용 불가 |

### P0-B: CLI init에 mcp-pm 빌드 단계 추가

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| `bin/cli.mjs` | **수정** | `npm install` 후 `npm run build` 미실행 → `dist/` 없음 → MCP 연결 자체 불가. node가 실행할 JS 파일이 생성되지 않음 |

### P0-C: .mcp.json.example + README 연결 가이드

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| `scaffold/.mcp.json.example` | **신규 생성** | 외부 사용자가 Claude Code/Codex에 연결하는 방법 전혀 없음. `.mcp.json` 예시 없이는 연결 불가 |
| `README.md` | **추가** | MCP-PM 연결 섹션 없음. `PM_TOKEN` 발급 방법, `.mcp.json` 설정, 첫 시작 명령 안내 필요 |

### P0-D: DB 스키마/API 컬럼 불일치 수정

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| `scaffold/pm-api/sql/migrations/006-schema-fixes.sql` | **신규 생성** | 마이그레이션 SQL로 분리. meetings 컬럼 추가/수정, members.email 추가, policy_documents/scenario_data 테이블 생성, nav_sprints label 컬럼 추가 |
| `scaffold/pm-api/src/routes/v2-meetings.ts` | **수정** | 스키마(`meeting_date`, `attendees`, `notes`)와 라우트(`date`, `participants`, `summary` 등) 완전 불일치. 런타임 오류 확정 |
| `scaffold/pm-api/src/routes/v2-nav.ts` | **수정** | `nav_sprints` 스키마는 `title` 컬럼인데 라우트에서 `label` 컬럼으로 INSERT/SELECT → 런타임 오류 |
| `scaffold/pm-api/src/routes/v2-kickoff.ts` | **수정** | 동일 `label` vs `title` 불일치 수정 |
| `scaffold/pm-api/src/routes/v2-admin.ts` | **수정** | `members` 테이블에 `email` 컬럼 없는데 SELECT/PATCH에서 참조 → 런타임 오류 |
| `scaffold/pm-api/src/routes/v2-search.ts` | **수정** | meetings 컬럼 참조 불일치 (동일 문제 파급) |

**총 변경 파일 수: 8개** (신규 3개, 수정 5개)

---

## 2. 인터페이스 변경 여부

### ✅ 인터페이스 변경 없음 (하위 호환 유지)

| 항목 | 판단 | 근거 |
|------|------|------|
| pm-api REST API | **변경 없음** | 라우트 구조 그대로. 컬럼명 불일치를 SQL/라우트 내부에서 정렬 |
| MCP 도구 시그니처 | **변경 없음** | pm-api `mcp.ts`의 TOOLS 정의를 그대로 참조하여 mcp-pm에 추가 |
| `sellerking-sprint-planner` 호환 | **유지** | nav_sprints `title` 컬럼 보존. `label`은 alias로 추가 처리 |
| CLI 파이프라인 흐름 | **변경 없음** | `init` 단계 내부에 빌드 단계 추가. 사용자 경험 동일 (자동화 강화) |
| `.mcp.json.example` | **신규 파일** | 기존 파일 없음. 깨뜨릴 인터페이스 없음 |

**⚠️ nav_sprints 컬럼 처리 전략:**
- 스키마에는 `title`이 존재하고 라우트는 `label`을 사용 중
- 마이그레이션으로 `label` 컬럼을 추가하고, 기존 `title` 데이터를 `label`로 복사
- 라우트 코드는 `label` 기준으로 통일 (스키마 현행화)
- sellerking-sprint-planner가 `title`을 직접 참조하는 경우를 위해 `title` 컬럼도 유지 (NULL 허용)

---

## 3. 테스트 커버리지 계획

### 수동 검증 체크리스트 (자동화 이전 단계)

#### P0-A: mcp-pm 도구 추가

```bash
# 1. TypeScript 컴파일 에러 없음 확인
cd scaffold/mcp-pm && npm run build

# 2. MCP 서버 실행 + tools/list 응답 확인 (49개 반환 여부)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  PM_API_URL=http://localhost:8787 PM_TOKEN=test node dist/index.js

# 3. 핵심 도구별 smoke test (적어도 list_epics, list_sprints, add_story)
```

#### P0-B: CLI 빌드 자동화

```bash
# CLI init 실행 후 dist/ 존재 확인
npx popilot init test-project
ls test-project/mcp-pm/dist/index.js  # 파일 존재해야 함
```

#### P0-C: .mcp.json.example + README

```bash
# 스캐폴드 후 파일 존재 확인
ls test-project/.mcp.json.example

# README에서 MCP 섹션 검색
grep -n "MCP\|mcp-pm\|PM_TOKEN" test-project/README.md
```

#### P0-D: 스키마/API 불일치 수정

```bash
# meetings API 통합 테스트
curl -X POST http://localhost:8787/api/v2/meetings \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 회의","date":"2026-03-31"}'
# 예상: 201 Created (이전: 500 Error)

# nav_sprints INSERT 테스트
curl -X POST http://localhost:8787/api/v2/nav/sprints \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"id":"s-01","label":"Sprint 1","theme":"기반","sortOrder":1}'
# 예상: 200 OK (이전: 500 Error)

# members email 업데이트 테스트
curl -X PATCH http://localhost:8787/api/v2/admin/members/1 \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# 예상: 200 OK (이전: 500 Error)

# policy_documents upsert 테스트
curl -X PUT http://localhost:8787/api/v2/policy/s-01/E-01 \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"content":"정책 내용"}'
# 예상: 200 OK (이전: 500 Error)

# scenario_data upsert 테스트
curl -X PUT http://localhost:8787/api/v2/scenarios/home/s-01/sc-01 \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"label":"시나리오 1","dataJson":"{}","author":"jay"}'
# 예상: 200 OK (이전: 500 Error)
```

### 전체 Done-when 체크리스트

- [ ] `scaffold/mcp-pm && npm run build` → 에러 없이 완료
- [ ] mcp tools/list → 49개 도구 반환
- [ ] `npx popilot init` 후 `mcp-pm/dist/index.js` 존재
- [ ] `.mcp.json.example` 파일이 스캐폴드 루트에 존재
- [ ] README에 "## MCP-PM 연결" 섹션 존재
- [ ] `POST /api/v2/meetings` → 201 (에러 없음)
- [ ] `POST /api/v2/nav/sprints` → 200 (에러 없음)
- [ ] `PATCH /api/v2/admin/members/:id` email 포함 → 200
- [ ] `PUT /api/v2/policy/:sprint/:epicId` → 200
- [ ] `PUT /api/v2/scenarios/:pageId/:sprint/:scenarioId` → 200

---

## 4. 리스크 + 대응 전략

| 리스크 | 가능성 | 영향 | 대응 전략 |
|--------|--------|------|----------|
| mcp-pm `npm run build` 실패 (CF Workers 환경 불일치) | 낮음 | 높음 | `stdio: 'inherit'`로 에러 출력 노출. 실패 시 수동 빌드 안내 메시지 개선 |
| nav_sprints `label` + `title` 양립 시 기존 데이터 손실 | 낮음 | 높음 | 마이그레이션에서 `UPDATE nav_sprints SET label = title WHERE label IS NULL` 실행. 데이터 보존 우선 |
| meetings 스키마 마이그레이션 후 기존 데이터 컬럼 손실 | 중간 | 중간 | `ADD COLUMN`으로만 추가 (기존 컬럼 삭제 없음). 라우트에서 old/new 컬럼 모두 지원하는 호환 레이어 작성 |
| mcp-pm 49개 도구 추가 시 TypeScript 타입 오류 | 중간 | 낮음 | pm-api의 API 응답 타입을 interface로 정의 후 재사용. 빌드 통과 확인 필수 |
| `.mcp.json.example`이 실제 프로젝트 루트에 복사 안 됨 | 낮음 | 높음 | `scaffold.mjs` 복사 로직 확인. `.example` 확장자 처리 여부 검증 |
| sellerking-sprint-planner가 `label` 컬럼명에 의존 | 알 수 없음 | 높음 | `label` 컬럼 추가 후 기존 코드 대상 `grep -r "nav_sprints" sellerking*` 검색. `title` alias VIEW 생성 검토 |

---

## 5. P0별 구체적 코드 변경 사항

---

### P0-A: mcp-pm 누락 도구 31개 추가

**파일:** `scaffold/mcp-pm/src/index.ts`

현재 18개 → 목표 49개 (31개 추가)

#### 추가할 도구 목록 (pm-api TOOLS 기준 미노출 도구)

| # | 도구명 | 카테고리 | pm-api 엔드포인트 |
|---|--------|---------|-----------------|
| 19 | `list_sprints` | Sprint | GET /api/sprint/list |
| 20 | `activate_sprint` | Sprint | POST /api/sprint/activate |
| 21 | `kickoff_sprint` | Sprint | POST /api/sprint/kickoff |
| 22 | `close_sprint` | Sprint | POST /api/sprint/close |
| 23 | `get_velocity` | Sprint | GET /api/sprint/velocity |
| 24 | `list_standup_entries` | Standup | GET /api/standup/entries |
| 25 | `review_standup` | Standup | POST /api/standup/review |
| 26 | `get_standup_feedback` | Standup | GET /api/standup/feedback |
| 27 | `list_epics` | Epic | GET /api/epics |
| 28 | `add_epic` | Epic | POST /api/epics |
| 29 | `update_epic` | Epic | PATCH /api/epics/:id |
| 30 | `delete_epic` | Epic | DELETE /api/epics/:id |
| 31 | `list_stories` | Story | GET /api/stories/list |
| 32 | `list_backlog` | Story | GET /api/stories/backlog |
| 33 | `add_story` | Story | POST /api/stories |
| 34 | `update_story` | Story | PATCH /api/stories/:id |
| 35 | `delete_story` | Story | DELETE /api/stories/:id |
| 36 | `update_task` | Task | PATCH /api/tasks/:id |
| 37 | `delete_task` | Task | DELETE /api/tasks/:id |
| 38 | `list_team_members` | Dashboard | GET /api/members |
| 39 | `create_initiative` | Initiative | POST /api/initiatives |
| 40 | `list_initiatives` | Initiative | GET /api/initiatives |
| 41 | `update_initiative_status` | Initiative | PATCH /api/initiatives/:id/status |
| 42 | `get_retro_session` | Retro | GET /api/retro |
| 43 | `add_retro_item` | Retro | POST /api/retro/items |
| 44 | `vote_retro_item` | Retro | POST /api/retro/items/:id/vote |
| 45 | `change_retro_phase` | Retro | PATCH /api/retro/phase |
| 46 | `add_retro_action` | Retro | POST /api/retro/actions |
| 47 | `update_retro_action_status` | Retro | PATCH /api/retro/actions/:id |
| 48 | `export_retro` | Retro | GET /api/retro/export |
| 49 | `mark_all_notifications_read` | Notification | PATCH /api/notifications/read-all |

#### 코드 변경 패턴 (예시: list_sprints)

```typescript
// scaffold/mcp-pm/src/index.ts에 추가 (Tool 19 이후 순서로)

// ── Tool 19: list_sprints ──
server.tool(
  'list_sprints',
  'List all sprints with status and dates',
  {
    status: z.enum(['planning', 'active', 'closed']).optional().describe('Filter by status'),
  },
  async ({ status }) => {
    const params: Record<string, string> = {}
    if (status) params.status = status
    const { data, error } = await apiGet<{
      sprints: Array<{ id: string; label: string; status: string; start_date: string | null; end_date: string | null; velocity: number | null }>
    }>('/api/sprint/list', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (data.sprints.length === 0) return text('No sprints found.')

    const lines = ['Sprints', '─────────────']
    for (const s of data.sprints) {
      const dates = s.start_date ? `${s.start_date} ~ ${s.end_date ?? '?'}` : 'dates not set'
      const velocity = s.velocity ? ` | velocity ${s.velocity}` : ''
      lines.push(`[${s.status.toUpperCase()}] ${s.id}: ${s.label} (${dates}${velocity})`)
    }
    return text(lines.join('\n'))
  },
)
```

**pm-api 기존 handler 시그니처 그대로 사용 원칙:**
- 모든 도구는 `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`를 통해 HTTP 호출
- pm-api의 `/api/*` 엔드포인트 경로는 pm-api `src/index.ts`의 라우팅 확인 후 매핑
- Zod 스키마는 pm-api `TOOLS` 배열의 `inputSchema` 정의를 그대로 따름

---

### P0-B: CLI init에 mcp-pm 빌드 단계 추가

**파일:** `bin/cli.mjs`

**변경 위치:** 약 165번 라인 (npm install mcpPm 블록 직후)

#### 현재 코드 (165~168번 라인)
```javascript
try {
  execSync('npm install', { cwd: mcpPmDir, stdio: 'pipe' });
  console.log('     ✅ Done');
} catch {
  console.log('     ⚠️  npm install failed. Run manually: cd mcp-pm && npm install');
}
```

#### 변경 후 코드
```javascript
try {
  execSync('npm install', { cwd: mcpPmDir, stdio: 'pipe' });
  console.log('     ✅ npm install done');
} catch {
  console.log('     ⚠️  npm install failed. Run manually: cd mcp-pm && npm install');
}

// mcp-pm 빌드 — dist/index.js 생성 (MCP 연결 필수)
console.log('  🔨 Building mcp-pm (TypeScript compile)...');
try {
  execSync('npm run build', { cwd: mcpPmDir, stdio: 'pipe' });
  console.log('     ✅ Done (dist/index.js ready)');
} catch {
  console.log('     ⚠️  Build failed. Run manually: cd mcp-pm && npm run build');
  console.log('     ℹ️  MCP connection requires dist/index.js to exist.');
}
```

**doctor.mjs 체크 추가** (`bin/doctor.mjs` 또는 해당 doctor 파일):
```javascript
// mcp-pm/dist/index.js 존재 여부 체크 추가
{
  label: 'mcp-pm dist built',
  check: async () => {
    try {
      await fsAccess(resolve(dir, 'mcp-pm/dist/index.js'));
      return { ok: true };
    } catch {
      return { ok: false, hint: 'Run: cd mcp-pm && npm run build' };
    }
  }
}
```

---

### P0-C: .mcp.json.example + README 연결 가이드

#### 1. `scaffold/.mcp.json.example` 신규 생성

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

**사용법 주석 (파일 상단에 JSON5 형식으로 안내 또는 별도 README):**
- `PM_API_URL`: `npx popilot deploy` 후 Cloudflare Workers URL
- `PM_TOKEN`: `popilot admin token create` 또는 `POST /api/v2/admin/members`로 발급
- 파일을 `.mcp.json`으로 복사 후 값 교체: `cp .mcp.json.example .mcp.json`

#### 2. `README.md` — "MCP-PM 연결" 섹션 추가

**추가 위치:** "Quick Start" 섹션 바로 다음, 또는 "Architecture" 이전

```markdown
## 🔌 MCP-PM 연결 (Claude Code / Codex)

Popilot의 PM 기능을 Claude Code나 Codex에 연결하는 방법입니다.

### 1. PM API 배포

\`\`\`bash
cd your-project
npx popilot deploy   # Cloudflare Workers에 pm-api 배포
# → https://your-project-pm-api.YOUR_ACCOUNT.workers.dev
\`\`\`

### 2. API 토큰 발급

\`\`\`bash
# pm-api가 배포된 후 토큰 생성
curl -X POST https://YOUR_PM_API_URL/api/v2/admin/members \
  -H "Content-Type: application/json" \
  -d '{"token":"my-secret-token","userName":"your-name"}'
\`\`\`

### 3. .mcp.json 설정

\`\`\`bash
cp .mcp.json.example .mcp.json
# .mcp.json 편집: PM_API_URL과 PM_TOKEN 값 교체
\`\`\`

```json
{
  "mcpServers": {
    "pm": {
      "command": "node",
      "args": ["./mcp-pm/dist/index.js"],
      "env": {
        "PM_API_URL": "https://your-project-pm-api.workers.dev",
        "PM_TOKEN": "my-secret-token"
      }
    }
  }
}
```

### 4. Claude Code에서 확인

\`\`\`
claude
> /mcp
# pm 서버와 49개 도구 목록이 표시되면 성공
\`\`\`

> ⚠️ **주의:** `.mcp.json`을 `.gitignore`에 추가하세요. 토큰이 포함됩니다.
```

---

### P0-D: DB 스키마/API 컬럼 불일치 수정

#### D-1. 마이그레이션 파일 신규 생성

**파일:** `scaffold/pm-api/sql/006-schema-fixes.sql`

```sql
-- Migration 006: Schema fixes for P0 blockers
-- 2026-03-31

-- ──────────────────────────────────────────────
-- Fix 1: nav_sprints label 컬럼 추가
-- 문제: schema-core.sql에 'title' 컬럼이 있지만
--       v2-nav.ts, v2-kickoff.ts는 'label' 컬럼으로 INSERT/SELECT
-- 전략: 'label' 컬럼 추가 후 기존 'title' 데이터 복사 (데이터 보존)
-- ──────────────────────────────────────────────
ALTER TABLE nav_sprints ADD COLUMN label TEXT;
UPDATE nav_sprints SET label = title WHERE label IS NULL;
-- 이후 라우트는 label 컬럼 기준으로 통일

-- ──────────────────────────────────────────────
-- Fix 2: members 테이블에 email 컬럼 추가
-- 문제: v2-admin.ts가 members.email을 SELECT/PATCH하지만 컬럼 없음
-- ──────────────────────────────────────────────
ALTER TABLE members ADD COLUMN email TEXT;

-- ──────────────────────────────────────────────
-- Fix 3: meetings 테이블 컬럼 추가
-- 문제: schema-meetings.sql은 meeting_date, attendees, notes
--       v2-meetings.ts는 date, participants, summary, raw_transcript, decisions 사용
-- 전략: 라우트가 사용하는 컬럼들을 테이블에 추가 (기존 컬럼 유지)
-- ──────────────────────────────────────────────
ALTER TABLE meetings ADD COLUMN date TEXT;
ALTER TABLE meetings ADD COLUMN participants TEXT;
ALTER TABLE meetings ADD COLUMN summary TEXT;
ALTER TABLE meetings ADD COLUMN raw_transcript TEXT;
ALTER TABLE meetings ADD COLUMN decisions TEXT;
ALTER TABLE meetings ADD COLUMN action_items TEXT;

-- 기존 데이터 마이그레이션 (meeting_date → date, attendees → participants, notes → summary)
UPDATE meetings SET
  date = meeting_date,
  participants = attendees,
  summary = notes
WHERE date IS NULL;

-- ──────────────────────────────────────────────
-- Fix 4: policy_documents 테이블 생성
-- 문제: v2-policy.ts가 사용하지만 SQL 파일 어디에도 없음
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT NOT NULL,
  epic_id TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(sprint, epic_id)
);

-- ──────────────────────────────────────────────
-- Fix 5: scenario_data 테이블 생성
-- 문제: v2-scenarios.ts가 사용하지만 SQL 파일 어디에도 없음
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenario_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  label TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  author TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(page_id, sprint, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_data_page_sprint
  ON scenario_data(page_id, sprint);
```

#### D-2. v2-meetings.ts 수정

**파일:** `scaffold/pm-api/src/routes/v2-meetings.ts`

**변경 1: GET / (약 11번 라인)**
```typescript
// 현재 (런타임 오류)
'SELECT id, title, date, participants, created_by, created_at FROM meetings ORDER BY date DESC LIMIT 50'

// 변경 후 (양쪽 컬럼 지원 + NULL 폴백)
`SELECT id, title,
  COALESCE(date, meeting_date) AS date,
  COALESCE(participants, attendees) AS participants,
  created_by, created_at
FROM meetings ORDER BY COALESCE(date, meeting_date) DESC LIMIT 50`
```

**변경 2: POST / (약 34~38번 라인)**
```typescript
// 현재 (런타임 오류 — 컬럼 없음)
`INSERT INTO meetings (title, date, raw_transcript, summary, agenda, decisions, action_items, participants, created_by)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

// 변경 후 (마이그레이션 후 신규 컬럼 사용)
`INSERT INTO meetings (title, meeting_date, date, raw_transcript, summary, agenda, decisions, action_items, attendees, participants, created_by)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

// args 수정
[body.title,
 body.date ?? null,   // meeting_date (legacy)
 body.date ?? null,   // date (new)
 body.rawTranscript ?? null,
 body.summary ?? null,
 body.agenda ?? null,
 body.decisions ?? null,
 body.actionItems ?? null,
 body.participants ?? null,  // attendees (legacy)
 body.participants ?? null,  // participants (new)
 createdBy]
```

**변경 3: fieldMap (약 48~50번 라인)**
```typescript
// 현재
const fieldMap: Record<string, string> = {
  title: 'title', date: 'date', rawTranscript: 'raw_transcript',
  summary: 'summary', agenda: 'agenda', decisions: 'decisions',
  actionItems: 'action_items', participants: 'participants',
}

// 변경 후 (신규 컬럼 매핑 + 레거시 동기화)
const fieldMap: Record<string, string> = {
  title: 'title',
  date: 'date',
  rawTranscript: 'raw_transcript',
  summary: 'summary',
  agenda: 'agenda',
  decisions: 'decisions',
  actionItems: 'action_items',
  participants: 'participants',
}
// PATCH 실행 후 레거시 컬럼 동기화
// meeting_date = date, attendees = participants (후처리 추가)
```

**변경 4: v2-search.ts meetings 쿼리 (약 참조 라인)**
```typescript
// 현재 (런타임 오류)
WHERE meetings.summary LIKE ? ...
ORDER BY meetings.date DESC

// 변경 후
WHERE COALESCE(meetings.summary, meetings.notes) LIKE ? ...
ORDER BY COALESCE(meetings.date, meetings.meeting_date) DESC
```

#### D-3. v2-nav.ts + v2-kickoff.ts 수정

**파일:** `scaffold/pm-api/src/routes/v2-nav.ts`

**변경 위치: POST /sprints (약 28~29번 라인)**
```typescript
// 현재 (런타임 오류 — label 컬럼 없음)
'INSERT INTO nav_sprints (id, label, theme, start_date, end_date, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',

// 변경 후 (마이그레이션 후 label 컬럼 존재 → 그대로 사용)
// 코드 변경 불필요. 단, GET에서 label 폴백 추가:
```

**변경 위치: GET / (약 65번 라인)**
```typescript
// 현재
'SELECT id, label, theme, status, start_date, end_date, velocity, team_size FROM nav_sprints ORDER BY sort_order'

// 변경 후 (label 없는 레거시 데이터 폴백)
'SELECT id, COALESCE(label, title) AS label, theme, status, start_date, end_date, velocity, team_size FROM nav_sprints ORDER BY sort_order'
```

**변경 위치: PATCH /sprints/:id (약 110번 라인)**
```typescript
// 현재
if (body.label !== undefined) { sets.push('label = ?'); args.push(body.label) }

// 변경 후 (label 업데이트 시 title도 동기화)
if (body.label !== undefined) {
  sets.push('label = ?'); args.push(body.label)
  sets.push('title = ?'); args.push(body.label)  // 레거시 컬럼 동기화
}
```

**파일:** `scaffold/pm-api/src/routes/v2-kickoff.ts`

동일 패턴으로 `label` → `COALESCE(label, title)` 폴백 처리.

#### D-4. v2-admin.ts 수정

**파일:** `scaffold/pm-api/src/routes/v2-admin.ts`

**변경 위치: GET /members (약 12번 라인)**
```typescript
// 현재 (email 컬럼 없음 → 런타임 오류)
`SELECT m.id, m.display_name, m.email, m.role, m.is_active, m.webhook_url, m.wallet_address, m.created_at, m.updated_at

// 변경 후 (마이그레이션 후 email 컬럼 존재 → 그대로 사용)
// 코드 변경 불필요. 단, 마이그레이션(006) 실행 전에는 오류 발생.
// doctor.mjs에 마이그레이션 적용 여부 체크 추가 권장.
```

**변경 위치: POST /members (약 63번 라인)**
```typescript
// 현재
"INSERT INTO members (display_name, email, role, is_active) VALUES (?, ?, 'member', 1)",

// 변경 후 (email 컬럼 존재 확인 후 그대로 사용 — 마이그레이션 의존)
// 코드 변경 불필요. 마이그레이션 006 실행이 전제 조건.
```

---

## 실행 순서 요약

```
1. scaffold/pm-api/sql/006-schema-fixes.sql 생성
2. scaffold/pm-api/src/routes/v2-meetings.ts 수정 (컬럼 폴백 처리)
3. scaffold/pm-api/src/routes/v2-nav.ts 수정 (label/title COALESCE)
4. scaffold/pm-api/src/routes/v2-kickoff.ts 수정 (동일)
5. scaffold/pm-api/src/routes/v2-search.ts 수정 (meetings 컬럼 폴백)
6. scaffold/mcp-pm/src/index.ts 수정 (31개 도구 추가)
7. bin/cli.mjs 수정 (npm run build 단계 추가)
8. scaffold/.mcp.json.example 신규 생성
9. README.md MCP 연결 섹션 추가
```

**예상 구현 시간:** 4-6시간 (Derek 기준)

**의존 관계:**
- P0-D (스키마 수정) → P0-A (mcp-pm 도구 추가)와 병렬 가능
- P0-B (CLI 빌드) → P0-A 완료 후 (dist/ 생성 가능한 상태)
- P0-C (가이드) → P0-A, P0-B와 병렬 가능 (문서 작업)

---

*plan-p0.md 작성 완료 — Derek에게 전달 준비 완료*
