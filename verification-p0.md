# Verification Report — PR #2 (`feat/p0-external-usability` → `main`)

작성자: Quinn (🧪)  
일시: 2026-03-31

## Scope 확인

```bash
git diff main...feat/p0-external-usability --stat
```

결과: **22 files changed, 3738 insertions, 17 deletions**

핵심 변경은 P0-A/B/C/D 대상 파일에 포함되어 있습니다.

---

## Checklist 검증 결과

### 1) Diff stat 확인
- ✅ 완료

### 2) `mcp-pm` 49개 도구 확인 (`scaffold/mcp-pm/src/index.ts`)
- ⚠️ **불일치**
- 정규식 기준 `server.tool('...')` 개수: **52개**
- 즉, “18→49” 목표 대비 현재 구현/문서 수치가 맞지 않습니다.
- 다만 P0-A에서 요구한 주요 누락 도구군(스프린트/에픽/스토리/레트로 등)은 실제로 추가되어 있습니다.

### 3) `bin/cli.mjs` 빌드 단계 확인
- ✅ 완료
- `npm install` 후 `npm run build` 실행 로직 추가됨
- 실패 시 수동 안내 메시지 포함됨

### 4) `.mcp.json.example` 존재 및 내용 확인
- ✅ 파일 존재: `scaffold/.mcp.json.example`
- ✅ `command: node`, `args: ["./mcp-pm/dist/index.js"]`, `PM_API_URL`/`PM_TOKEN` placeholder 정상

### 5) `006-schema-fixes.sql` 5개 수정 반영 확인
파일: `scaffold/pm-api/sql/006-schema-fixes.sql`
- ✅ nav_sprints `label` 추가 + `title` 데이터 이관
- ✅ members `email` 추가
- ✅ meetings 컬럼 확장 (`date`, `participants`, `summary`, `raw_transcript`, `decisions`) + 기존 데이터 이관
- ✅ `policy_documents` 생성
- ✅ `scenario_data` 생성

### 6) route의 COALESCE backward compat 확인
- ✅ `v2-meetings.ts`: `COALESCE(date, meeting_date)`, `COALESCE(participants, attendees)`
- ✅ `v2-nav.ts`: `COALESCE(label, title)`
- ⚠️ `v2-kickoff.ts`: **COALESCE 사용 없음** (대신 create 시 `title`,`label` 동시 기록)
- ✅ `v2-search.ts`: `COALESCE(summary, notes)`, `COALESCE(date, meeting_date)`

### 7) 빌드 실행 (`cd scaffold/mcp-pm && npm run build`)
- ✅ 통과
- 출력: `tsc` 성공

### 8) 잠재 이슈 3개 이상
아래에 4개 기재

---

## 잠재 이슈 (Potential Issues)

### Issue 1 — Tool 개수 스펙 불일치 (49 vs 52)
- **증상:** README/계획은 49개라고 명시하지만 실제 `mcp-pm`/`pm-api mcp`는 52개 수준입니다.
- **영향:** QA 기준/운영 문서/연결 검증 자동화에서 혼선 발생 가능
- **권장:** 단일 SSOT(예: `pm-api/src/mcp.ts`) 기준으로 문서와 테스트를 동기화하고, CI에서 tool count assertion 추가

### Issue 2 — `006-schema-fixes.sql` 비멱등(idempotency) 문제
- **증상:** 파일 주석은 안전성 언급하지만 실제 `ALTER TABLE ... ADD COLUMN`이 존재 체크 없이 실행됩니다.
- **영향:** migration 재실행 시 `duplicate column` 에러로 실패 가능
- **권장:** migration runner에서 applied-tracking 강제 또는 컬럼 존재 체크 기반 분기(재실행 안전성 확보)

### Issue 3 — `v2-kickoff.ts`에서 COALESCE 기반 backward-compat 패턴 미적용
- **증상:** 요청 체크리스트는 4개 라우트 모두 COALESCE를 요구했으나 `v2-kickoff.ts`는 COALESCE가 없습니다.
- **영향:** 현재 코드는 create 시 `title/label` 동시 기록으로 동작하지만, 조회/호환 규칙 일관성 측면에서 다른 라우트와 패턴이 다릅니다.
- **권장:** 최소한 조회 경로/응답 매핑에서 `COALESCE(label, title)` 일관 적용 검토

### Issue 4 — CLI 빌드 실패 시 원인 가시성 낮음
- **증상:** `execSync(..., stdio: 'pipe')`로 실패 로그가 사용자에게 거의 보이지 않습니다.
- **영향:** 외부 사용자 트러블슈팅 시간이 증가
- **권장:** 실패 시 stderr 출력 일부를 노출하거나 `stdio: 'inherit'` 옵션 검토

---

## 최종 판정

## ❌ REQUEST_CHANGES

### 판단 근거
1. 요구사항 문서/계획과 실제 tool 개수(49 vs 52) 불일치가 남아 있음  
2. migration 006의 재실행 안정성(멱등성) 문제가 명확함  
3. `v2-kickoff.ts`가 체크리스트의 COALESCE 호환 패턴을 충족하지 못함(패턴 일관성 미흡)

빌드는 통과하고 핵심 P0 해결 방향은 맞지만, 위 3건은 외부 사용성/운영 안정성 관점에서 merge 전 정리 필요합니다.
