# PR #12 Verification — issue-6-get-by-id

## Verdict
**APPROVE** ✅

요구사항 기준으로 핵심 범위는 충족되었습니다.

---

## 1) Diff stat
```bash
git diff main...feat/issue-6-get-by-id --stat
```

결과:
- `scaffold/mcp-pm/src/index.ts` | 60 insertions
- `scaffold/pm-api/src/mcp.ts` | 48 insertions
- `scaffold/pm-api/src/routes/v2-nav.ts` | 11 insertions
- `scaffold/pm-api/src/routes/v2-pm.ts` | 24 insertions
- **총 4 files changed, 143 insertions**

## 2) GET /:id 라우트 검증 (epics/stories/tasks/sprints + 404)
확인 파일:
- `scaffold/pm-api/src/routes/v2-pm.ts`
  - `GET /epics/:id`
  - `GET /stories/:id`
  - `GET /tasks/:id`
  - 모두 `if (!result.rows.length) return c.json({ error: 'Not found' }, 404)` 처리 있음
- `scaffold/pm-api/src/routes/v2-nav.ts`
  - `GET /sprints/:id`
  - 동일하게 not found 시 404 처리 있음

✅ 요구사항 충족

## 3) TOOLS 배열의 4개 MCP 도구 검증
확인 파일: `scaffold/pm-api/src/mcp.ts`
- `name: 'get_sprint'` (추가됨)
- `name: 'get_epic'` (추가됨)
- `name: 'get_story'` (추가됨)
- `name: 'get_task'` (기존 존재)

✅ 최종 TOOLS 배열에는 4개(`get_epic/get_story/get_task/get_sprint`) 모두 존재

## 4) mcp-pm의 server.tool() 4개 검증
확인 파일: `scaffold/mcp-pm/src/index.ts`
- `server.tool('get_task', ...)` (기존)
- `server.tool('get_sprint', ...)` (추가)
- `server.tool('get_epic', ...)` (추가)
- `server.tool('get_story', ...)` (추가)

✅ 요구사항 충족

참고: 추가로 `server.tool('get_task_raw', ...)`도 새로 존재합니다.

## 5) Build 검증
실행:
```bash
cd scaffold/mcp-pm && npm run build
```
결과:
- `tsc` 성공 (에러 없음)

✅ 빌드 통과

---

## 6) Potential issues (최소 3개)
아래는 **잠재 이슈/정합성 리스크**이며, 이번 PR의 머지 블로커는 아닙니다.

1. **도구 네이밍 정합성 혼재 (`get_task` vs `get_task_raw`)**
   - `get_task`는 기존 상세/컨텍스트 포맷(`/api/tasks/:id`)을 사용하고,
   - 이번 PR에서 `get_task_raw`가 `/api/v2/pm/tasks/:id`를 직접 노출합니다.
   - 동일 도메인에서 결과 형식이 이원화되어 클라이언트 혼란 가능성이 있습니다.

2. **MCP 구현 경로 이원화로 인한 드리프트 위험 (`mcp.ts` DB 직접 조회 vs `mcp-pm` API 호출)**
   - `scaffold/pm-api/src/mcp.ts`는 DB query를 직접 수행하고,
   - `scaffold/mcp-pm/src/index.ts`는 HTTP API를 호출합니다.
   - 스키마/필드/에러 포맷 변경 시 두 경로의 동작 불일치 가능성이 큽니다.

3. **에러 메시지 포맷 비일관성 (`Not found` vs `Epic/Story/Sprint not found`)**
   - REST 라우트는 `{ error: 'Not found' }` 형태,
   - MCP switch는 `'Epic not found'`, `'Story not found'`, `'Sprint not found'` 문자열.
   - 클라이언트가 에러를 규격화 처리할 때 분기 복잡도가 증가합니다.

4. **GET /:id 응답 스키마 명시 부족 (raw `SELECT *`)**
   - epics/stories/tasks는 `SELECT *` 반환이라 스키마 변경이 곧 API contract 변경으로 이어질 수 있습니다.
   - 장기적으로 명시 필드 선택(Projection) 또는 response DTO 고정이 필요합니다.

---

## 최종 판단
- 기능 요구사항(라우트 4종, MCP 도구 4종 존재, mcp-pm tool 등록, 빌드 통과)은 충족되었습니다.
- 잠재 리스크는 있으나 즉시 치명 결함은 확인되지 않아 **APPROVE**합니다.
