# Oscar Setup Workflow

프로젝트 최초 실행 시 Oscar가 진행하는 Setup 워크플로우입니다.

## 트리거 조건

`/start` 실행 시 `.context/project.yaml` 파일이 없으면 Setup Wizard 시작.

---

## Phase 0: 프로젝트 타입 감지

```
🎩 Oscar: 프로젝트를 분석하고 있습니다...
```

### 감지 로직

프로젝트 루트에서 다음 파일/폴더 존재 여부 확인:

| 파일/폴더 | 의미 |
|----------|------|
| `package.json` | Node.js 프로젝트 |
| `requirements.txt` / `pyproject.toml` | Python 프로젝트 |
| `go.mod` | Go 프로젝트 |
| `Cargo.toml` | Rust 프로젝트 |
| `src/` / `app/` / `lib/` | 소스 코드 존재 |
| `README.md` | 프로젝트 문서 |

### 분기

```
├── 코드/설정 파일 존재 → Brownfield 모드 (Phase 0.5)
└── 아무것도 없음 → Greenfield 모드 (Phase 1로 직행)
```

---

## Phase 0.5: Brownfield Full Scan (코드가 있는 경우)

```
🎩 Oscar: 기존 코드가 있네요. 먼저 분석해볼게요.
```

### 스캔 대상

**포함:**
- 소스 폴더: `src/`, `app/`, `lib/`, `components/`, `pages/`
- 설정 파일: `package.json`, `requirements.txt`, `*.config.js`, `*.yaml`
- 문서: `README.md`, `docs/`
- 환경변수 예시: `.env.example`, `.env.sample`
- 스키마: `prisma/schema.prisma`, `*.sql`

**제외:**
- `node_modules/`, `venv/`, `.venv/`, `__pycache__/`
- `dist/`, `build/`, `.next/`, `out/`
- `.git/`
- `*.lock`, `package-lock.json`, `yarn.lock`
- 바이너리 파일, 이미지 등

### 분석 항목

1. **기술 스택**
   - 프레임워크 (Next.js, Django, etc.)
   - 언어 버전
   - 주요 의존성

2. **프로젝트 구조**
   - 폴더 구조 매핑
   - 아키텍처 패턴 추론

3. **README 파싱**
   - 프로젝트 설명
   - 설치 방법
   - 기능 목록

4. **환경변수**
   - 필요한 외부 연동 추론

### 결과 제시

```markdown
🎩 Oscar: 코드를 분석해서 이렇게 파악했어요.

## 기술 스택
- Frontend: {파악한 스택}
- Backend: {파악한 스택}
- Infra: {파악한 인프라}

## 프로젝트 구조
{폴더 구조}

## README에서 파악한 내용
{핵심 내용}

───────────────────────────────────────
이 분석이 맞나요? 수정하거나 추가할 부분이 있으면 말씀해주세요.
```

### 사용자 확인 후

- 수정사항 반영
- Phase 2로 이동 (보완 인터뷰)

---

## Phase 1: 사용자 인터뷰 (🎩 Oscar)

```
🎩 Oscar: 안녕하세요! Oscar입니다. 처음 뵙겠습니다.
         앞으로 함께 일하게 될 텐데, 먼저 몇 가지 여쭤봐도 될까요?
```

### 질문 목록

1. **호칭**
   ```
   "뭐라고 불러드릴까요?"
   ```

2. **커뮤니케이션 스타일**
   ```
   "선호하시는 커뮤니케이션 스타일이 있으신가요?"
   예: 간결한 답변 / 상세한 설명 / 옵션 제시 등
   ```

3. **작업 방식**
   ```
   "작업하실 때 어떤 방식을 선호하세요?"
   예: 단계별 확인 / 자율적 진행 / 빠른 실행 등
   ```

### 결과

→ `.context/user-context.yaml` 생성

```yaml
identity:
  name: "{입력값}"
  preferred_name: "{입력값}님"

communication:
  - "{파악한 스타일}"

work_style:
  - "{파악한 방식}"

_meta:
  created_at: "{현재시각}"
  updated_at: "{현재시각}"
  sources: ["setup"]
```

---

## Phase 2: 프로젝트 심층 인터뷰 (🎯 Simon 투입)

```
🎩 Oscar: 프로젝트를 깊이 이해하기 위해 Simon을 투입합니다.

🎯 Simon: 안녕하세요, {호칭}. 프로젝트에 대해 깊이 이야기해볼게요.
         천천히 대화하면 됩니다. 15~20분 정도 걸릴 거예요.
```

### 인터뷰 구조

#### 1. 문제 & 시장 (Problem & Market)

```
"이 프로젝트가 해결하고자 하는 핵심 문제는 무엇인가요?"
"이 문제를 겪는 사람들은 누구인가요?"
"그들은 지금 이 문제를 어떻게 해결하고 있나요?"
"왜 지금 이 문제를 풀어야 한다고 생각하셨나요?"
```

**모르겠다면:**
```
🎯 Simon: "제가 관련 시장을 좀 찾아볼게요..."
→ WebSearch 도구로 시장 조사
→ 결과 공유 및 함께 논의
```

#### 2. 솔루션 & 차별점 (Solution & Differentiation)

```
"어떤 방식으로 이 문제를 해결하려고 하나요?"
"기존 대안들과 비교했을 때 핵심 차별점은 무엇인가요?"
"고객이 이 서비스를 쓰면 어떤 변화가 생기나요?"
"한 문장으로 이 서비스를 설명한다면?"
```

**경쟁사가 불명확하면:**
```
🎯 Simon: "비슷한 서비스들을 찾아서 비교해볼게요..."
→ WebSearch로 경쟁사 분석
→ 차별점 함께 도출
```

#### 3. 현재 상태 & 불확실성 (Current State & Uncertainty)

```
"지금 어디까지 진행되었나요?"
  → 아이디어 / 프로토타입 / MVP / 런칭 / PMF / 성장
"현재 가장 큰 불확실성은 무엇인가요?"
"다음에 검증하고 싶은 것은?"
"가장 가까운 마일스톤은 무엇인가요?"
```

#### 3.5. 작업 영역 (Domains) - 선택적

```
"주요 작업 영역이 나뉘어 있나요?"
  예: 광고, 마케팅, CS / 프론트엔드, 백엔드, 인프라 / 없음 (단일 영역)
```

**있다고 하면:**
```
"각 영역을 간단히 설명해주실 수 있나요?"
```

→ `project.yaml`의 `operations.domains` 섹션에 반영

**없다고 하면:**
→ domains 섹션 생략 (나중에 필요시 추가)

#### 4. 검증 & 학습 (Validation & Learning)

```
"지금까지 확인된 것과 아직 모르는 것은?"
"고객과 대화해본 적 있나요? 가장 인상적이었던 피드백은?"
"실패했거나 피벗한 경험이 있다면?"
"이 프로젝트에서 가장 자신 있는 부분은?"
```

### 정리 & 확인

```
🎯 Simon: 제가 이해한 내용을 정리해볼게요.

## 프로젝트 요약
- **핵심 문제**: ...
- **타겟 고객**: ...
- **솔루션**: ...
- **차별점**: ...
- **현재 단계**: ...
- **핵심 불확실성**: ...

이 정리가 맞나요? 수정하거나 추가할 부분이 있으면 말씀해주세요.
```

### 결과

→ `.context/project.yaml` 생성

---

## Phase 3: 통합 설정 (Integration Configuration)

```
🎩 Oscar: 외부 도구 연동을 설정할게요. 필요한 것만 선택해주세요.
```

### 연동 옵션 안내

```
🎩 Oscar: 다음 도구들을 연동할 수 있어요.

[분석]
□ GA4 (Google Analytics 4) — 이벤트/행동 데이터 분석
□ Mixpanel — 프로덕트 분석
□ 없음

[PM 도구]
□ Notion — 칸반 보드, 문서 관리
□ Linear — 이슈 트래커
□ Jira — 프로젝트 관리
□ 없음

[고객 소통]
□ Channel.io (채널톡) — CS, VOC 분석
□ Intercom — 고객 지원
□ 없음

[DB]
□ MySQL — 서비스 DB 직접 조회
□ PostgreSQL — 서비스 DB 직접 조회
□ 없음

[AI 리서치]
□ NotebookLM — 셀러/사용자 인사이트
□ 없음

어떤 것들을 사용하고 계세요?
```

### DB 선택 시 추가 질문

```
🎩 Oscar: DB를 사용하시는군요. 몇 가지 더 여쭤볼게요.

1. "MCP 서버 이름은 어떻게 설정하셨나요?" (예: prod_service_db)
2. "스냅샷 DB도 따로 있나요?"
3. "접속 시 포트포워딩이나 터널 스크립트가 필요한가요?"
4. "무거운 테이블 경고가 필요한 테이블이 있나요?"
   (DELETE-INSERT ETL, Full scan 금지 등)
```

### NotebookLM 선택 시

```
🎩 Oscar: "어떤 노트북을 주로 사용하시나요?" (노트북 이름)
```

### 연동 설정 결과

→ `project.yaml`의 `operations.integrations` 섹션에 반영

### 민감 정보 안내

```
🎩 Oscar: 외부 연동에 필요한 민감 정보는 .secrets.yaml에 설정해주세요.
         예시 템플릿을 생성해드릴까요?
```

→ `.context/.secrets.yaml` 템플릿 생성 (선택)

### Dev Scope 설정 (개발 대시보드가 있는 경우)

```
🎩 Oscar: 별도의 개발용 레포지토리가 있나요?
         있다면 Derek(개발)과 Quinn(QA)이 해당 레포에서 작업합니다.
```

→ `project.yaml`의 `dev_scope` 섹션에 반영

---

## Phase 4: 템플릿 하이드레이션 (NEW)

```
🎩 Oscar: 설정을 기반으로 에이전트와 커맨드를 프로젝트에 맞게 조정합니다.
```

### 하이드레이션 절차

1. **`.hbs` 파일 목록 수집**
   ```
   .context/agents/*.md.hbs
   .context/WORKFLOW.md.hbs
   .claude/commands/*.md.hbs
   CLAUDE.md.hbs
   ```

2. **변수 컨텍스트 구성**
   - `project.yaml`에서 project, integrations, domains, dev_scope, spec_site 추출
   - 플랫 네임스페이스로 변환

3. **각 `.hbs` → `.md`로 렌더링**
   - `{{var}}` → 값 대입
   - `{{#if path}}...{{/if}}` → 조건부 포함/제거
   - `{{#each path}}...{{/each}}` → 반복 생성

4. **`.hbs` 원본 삭제**

5. **도메인 커맨드 자동 생성**
   - `_domain.md.hbs` 템플릿을 각 도메인별로 렌더링
   - 결과: `.claude/commands/{domain_id}.md` (예: ads.md, marketing.md)
   - `_domain.md.hbs` 원본 삭제

### 하이드레이션 검증

```
🎩 Oscar: 하이드레이션이 완료되었습니다.

[변환된 파일]
• agents/orchestrator.md ✅
• agents/strategist.md ✅
• agents/planner.md ✅
• agents/validator.md ✅
• agents/analyst.md ✅
• agents/researcher.md ✅
• agents/developer.md ✅
• agents/qa.md ✅
• WORKFLOW.md ✅
• CLAUDE.md ✅
• commands/analytics.md ✅
• commands/daily.md ✅

[생성된 도메인 커맨드]
• commands/{각 도메인 id}.md

[남은 .hbs 파일]
없음 ✅
```

---

## Phase 5: spec-site 초기화 (NEW)

```
🎩 Oscar: spec-site를 초기화합니다.
```

### 초기화 단계

1. **index.html 제목 설정**
   ```html
   <title>{project.name} 스펙</title>
   ```

2. **첫 스프린트 폴더 생성**
   ```
   .context/sprints/s1/
   └── context.md (빈 템플릿)
   ```

3. **배포 설정 (선택)**
   ```
   🎩 Oscar: spec-site를 어디에 배포하시겠어요?

   □ Vercel — GitHub 연동 자동 배포
   □ AWS Amplify — AWS 기반 배포
   □ 나중에 설정
   ```

4. **`project.yaml`에 spec_site 정보 반영**
   ```yaml
   spec_site:
     title: "{project.name} 스펙"
     deploy_url: ""  # 배포 후 설정
   ```

---

## Phase 6: 도메인 구조 생성 (NEW)

Phase 2에서 도메인이 정의된 경우 실행됩니다.

```
🎩 Oscar: 도메인 폴더를 생성합니다.
```

### 생성 절차

각 도메인에 대해:

1. **도메인 폴더 생성**
   ```
   .context/domains/{domain_id}/
   └── index.md (기본 구조)
   ```

2. **도메인 인덱스 파일 초기화**
   ```markdown
   # {domain_name} 도메인

   ## 개요
   {도메인 설명 - Setup 인터뷰에서 수집}

   ## 주요 컨텍스트
   - (작업하면서 추가)

   ## 관련 파일
   - `global/product/{domain_id}.md` — 제품 분석
   ```

3. **추가 기본 폴더 생성**
   ```
   .context/global/product/     (비어있음 — 분석 시 채워짐)
   .context/global/database/    (비어있음 — 필요 시 채워짐)
   .context/global/tracking/    (비어있음 — 이벤트 정의 시)
   .context/metrics/            (비어있음)
   .context/daily/              (비어있음)
   .context/sessions/
   ├── index.yaml               (빈 세션 인덱스)
   ├── active/                  (비어있음)
   └── archive/                 (비어있음)
   ```

---

## Setup 완료

```
🎩 Oscar: {호칭}, Oscar 시스템 설정이 완료되었습니다!

## 생성된 파일
- .context/user-context.yaml (gitignore)
- .context/project.yaml
- .context/.secrets.yaml (gitignore) - 선택
- CLAUDE.md (하이드레이션 완료)
- 에이전트 10개 (하이드레이션 완료)
- WORKFLOW.md (하이드레이션 완료)

## 프로젝트 요약
{project.yaml의 핵심 내용 요약}

## 연동 현황
{활성화된 integrations 목록}

## 도메인
{생성된 도메인 목록}

───────────────────────────────────────
어떤 작업부터 시작하실까요?
```

---

## Brownfield vs Greenfield 비교

| 항목 | Brownfield | Greenfield |
|------|------------|------------|
| Phase 0 | 코드 스캔 | 스킵 |
| Phase 0.5 | 분석 결과 확인 | 없음 |
| Phase 1 | 동일 (사용자 인터뷰) | 동일 |
| Phase 2 | 보완 질문만 (10~15분) | 전체 인터뷰 (15~20분) |
| Phase 3 | 동일 (통합 설정) | 동일 |
| Phase 4 | 동일 (하이드레이션) | 동일 |
| Phase 5 | 동일 (spec-site) | 동일 |
| Phase 6 | 동일 (도메인 구조) | 동일 |
| **총 소요 시간** | **20~25분** | **25~30분** |

---

## 프로젝트 확장 시 Setup 초기화

새로운 프로덕트 라인이나 독립적인 서비스를 추가할 때, 별도의 Oscar 컨텍스트로 Setup을 초기화할 수 있습니다.

### 초기화 대상 파일

```bash
# 새 프로덕트용 컨텍스트 초기화 시 삭제
rm .context/project.yaml          # 프로젝트 설정 (Setup에서 새로 생성)
rm -f .context/user-context.yaml  # 사용자 설정 (Setup에서 새로 생성)
rm -f .context/.secrets.yaml      # 민감 정보 (Setup에서 새로 생성)

# 기존 데이터 정리 (필요시)
rm -rf .context/sprints/          # 스프린트 데이터
rm -rf .context/domains/          # 도메인 데이터
rm -rf .context/sessions/         # 세션 기록
rm -rf .context/metrics/          # 지표 데이터
rm -rf .context/global/           # 전략/제품 문서
```

### 유지되는 파일 (Oscar 코어)

| 파일/폴더 | 설명 |
|----------|------|
| `oscar/` | Oscar 워크플로우 |
| `agents/` | 에이전트 페르소나 (.hbs가 있으면 재하이드레이션 가능) |
| `templates/` | 문서 템플릿 |
| `WORKFLOW.md` | 워크플로우 가이드 |
| `.claude/commands/` | 슬래시 커맨드 |
| `CLAUDE.md` | Oscar 시스템 설명 |

### 초기화 후

```bash
# /start 실행 시 project.yaml이 없으면 Setup Wizard 자동 시작
/start
```

---

## 관련 파일

- `/start` 커맨드: `.claude/commands/start.md`
- user-context 구조: `.context/user-context.yaml`
- project 구조: `.context/project.yaml.example`
- 에이전트 페르소나: `.context/agents/strategist.md` (Simon)
