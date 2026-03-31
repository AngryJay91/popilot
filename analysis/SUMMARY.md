# Popilot 코드베이스 종합 분석 리포트

> 2026-03-31 | 분석 대상: popilot 0.8.0
> 상세: pm-api-analysis.md, spec-site-analysis.md, cli-ux-analysis.md

## 전체 요약

| 모듈 | 완성도 | 코드량 | 핵심 이슈 |
|------|--------|--------|----------|
| pm-api | ~65% | 6,233줄 | DB 스키마/API 불일치 4건, 토큰 평문 저장 |
| spec-site | ~70% | 19,831줄 | 인증 가드 없음, 목업 에디터 버그 |
| mcp-pm | ~40% | 729줄 | 49개 중 18개만 노출, 빌드 자동화 없음 |
| CLI | ~80% | 2,666줄 | README 미비, 연결 가이드 없음 |
| .context | ~85% | - | 페르소나 15개 + 템플릿 12개 완성 |

## 🔴 P0: 외부 사용자가 쓸 수 없는 블로커

이것들이 해결 안 되면 "npx popilot init → 실제 사용"이 불가능함.

### 1. mcp-pm이 핵심 도구를 노출하지 않음
- 49개 중 18개만 MCP 서버에 등록
- **에픽, 스토리, 스프린트 관리** 도구가 빠져있음 → 에이전트가 PM 핵심 기능을 못 씀
- 수정: mcp-pm/src/index.ts에 누락 도구 추가

### 2. mcp-pm 빌드 자동화 없음
- CLI init에서 npm install만 하고 build 안 함 → dist/ 없어서 MCP 연결 자체 불가
- 수정: CLI init에 `npm run build` 단계 추가

### 3. MCP 연결 가이드 전무
- .mcp.json 예시 없음, PM_TOKEN 발급 방법 없음
- 외부 사용자가 CC/Codex에 연결하는 방법을 전혀 모름
- 수정: README + .mcp.json.example 추가

### 4. DB 스키마/API 컬럼 불일치 (런타임 오류)
- meetings: 스키마 vs 라우트 컬럼명 완전 다름
- nav_sprints: title vs label
- members: email 컬럼 없는데 사용
- policy_documents, scenario_data: 테이블 자체 없음
- 수정: 스키마와 라우트 동기화 필요

## 🟡 P1: 품질/보안 이슈

### 5. 인증/보안
- 토큰 평문 저장 (해싱 필요)
- spec-site 라우터 인증 가드 없음 (URL만 알면 접근 가능)

### 6. 숨겨진 도구 5개
- handler는 있는데 TOOLS 배열 미등록: assign_story_to_sprint, unassign_story_from_sprint, checkin_sprint, add_absence, reject_memo
- 수정: TOOLS 배열에 추가

### 7. 단건 GET 미구현
- GET /epics/:id, /stories/:id, /tasks/:id, /sprints/:id 없음
- 상세 페이지나 에이전트 참조 시 불편

### 8. DB 인덱스 없음
- pm_tasks, pm_stories 등 핵심 테이블에 인덱스 0개
- 데이터 늘어나면 성능 저하

## 🟢 P2: 개선 사항

### 9. i18n 미구현
- spec-site UI 전체 영어 하드코딩
- 다국어 전환 구조 없음 (500~1,000개 문자열)
- 외부 공개 시에는 영어가 기본이라 당장은 OK

### 10. UX 개선
- confirm()/alert() → 커스텀 모달로 교체
- Standup 피드백 N+1 API 패턴
- Docs 실시간 편집 충돌 방어 없음

### 11. README/문서
- deploy/migrate 커맨드 미기재
- --platform 옵션 미기재
- project.yaml.example에 누락 필드

### 12. spec-site 버그
- MockupEditor Layer Lock 아이콘 렌더링 버그
- MockupListPage 뷰포트 아이콘 동일 버그

## 권장 실행 순서

```
Phase 1 (외부 사용 가능하게 만들기) — P0 해결
├── mcp-pm 도구 49개 전부 노출
├── CLI에 mcp-pm 빌드 자동화 추가
├── .mcp.json.example + 연결 가이드 작성
├── DB 스키마/API 컬럼 불일치 수정
└── README 정비

Phase 2 (품질/보안) — P1 해결
├── 토큰 해싱
├── 라우터 인증 가드
├── 숨겨진 도구 5개 등록
├── 단건 GET 추가
└── DB 인덱스 추가

Phase 3 (외부 공개 준비) — P2 해결
├── 영문 데모 데이터 세팅
├── UX 개선 (모달, N+1 등)
├── 목업 에디터 버그 수정
└── 문서 보강
```

## 긍정적 평가

- **아키텍처는 건전함.** MCP 49개 + REST API + Vue UI가 같은 DB를 공유하는 구조는 올바름
- **에이전트 페르소나/워크플로우/템플릿 품질이 높음** (.context/ 완성도 85%)
- **CLI 파이프라인이 깔끔함.** init → wizard → hydrate → deploy 흐름이 잘 설계됨
- **nudge 시스템은 차별화 포인트.** proactive 알림은 다른 PM 도구에 없는 기능
- **반응형 대응 잘 되어있음.** 주요 페이지 모바일 지원

핵심은 P0 4개만 해결하면 "외부 사용자가 설치해서 돌려볼 수 있는 상태"가 된다는 것.
