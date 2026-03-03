# /start - 세션 시작

새로운 작업 세션을 시작하거나 기존 세션을 복원합니다.

## 사용법

```bash
/start                    # 활성 세션 목록 표시 → 선택
/start {id}               # 특정 세션 복원 (부분 매칭 OK)
/start new "{주제}"       # 새 세션 생성 (slug 자동 생성)
/start new {id} "{주제}"  # 새 세션 생성 (slug 지정)
/start recent             # 최근 종료된 세션 목록에서 복원
/start parallel           # 병렬 세션 빠른 시작 (Lock 경고 무시)
```

ARGUMENTS: $ARGUMENTS

---

## 실행 단계

### -1. Setup 체크 (최초 실행 감지) ⭐

**가장 먼저** `.context/project.yaml` 파일 존재 여부를 확인합니다.

```
project.yaml 존재?
├── 있음 → 정상 플로우 (0단계로)
└── 없음 → Setup Wizard 시작
```

#### Setup Wizard 시작

`.context/project.yaml`이 없으면 최초 실행으로 간주하고 Setup Wizard를 시작합니다.

```markdown
🎩 Oscar: 안녕하세요! Oscar입니다.
         이 프로젝트에서 처음 만나네요. Setup을 진행할게요.
```

**Setup 워크플로우** (상세: `.context/oscar/workflows/setup.md`)

1. **Phase 0: 프로젝트 타입 감지**
   - 소스 코드/설정 파일 존재 여부 확인
   - Brownfield (코드 있음) vs Greenfield (코드 없음) 분기

2. **Phase 0.5: Brownfield Full Scan** (코드가 있는 경우)
   - `node_modules/`, `venv/` 등 제외하고 소스 스캔
   - 기술 스택, 프로젝트 구조, README 분석
   - 결과 제시 후 확인 요청

3. **Phase 1: 사용자 인터뷰** (🎩 Oscar)
   - "뭐라고 불러드릴까요?" (호칭)
   - 커뮤니케이션 스타일, 작업 방식 선호도
   - → `user-context.yaml` 생성

4. **Phase 2: 프로젝트 심층 인터뷰** (🎯 Simon 투입)
   - 핵심 문제, 타겟 고객, 시장
   - 솔루션, 차별점, 기대 효과
   - 현재 단계, 불확실성, 마일스톤
   - 검증된 것 / 검증 필요한 것
   - 모르는 부분은 WebSearch로 함께 조사
   - → `project.yaml` 생성

5. **Phase 3: 민감 정보 안내** (🎩 Oscar)
   - `.secrets.yaml` 템플릿 생성 제안

```markdown
🎩 Oscar: Setup이 완료되었습니다!

생성된 파일:
- .context/user-context.yaml (gitignore)
- .context/project.yaml
- .context/.secrets.yaml (gitignore) - 선택

어떤 작업부터 시작하실까요?
```

---

### 0. 비밀 변수 로드 (필수)

**반드시 가장 먼저** `.context/.secrets.yaml` 파일을 읽습니다.
(파일이 없으면 경고 없이 진행 - 선택적 파일임)

### 0.5. User Context 로드 (신규) ⭐

`.context/user-context.yaml` 파일을 읽어서 사용자 선호도 파악.
(파일이 없으면 기본값 사용)

### 0.7. Project Context 로드 (신규) ⭐

`.context/project.yaml` 파일을 읽어서 프로젝트 컨텍스트 파악.

### 1. index.yaml 로드

`.context/sessions/index.yaml`을 읽어서 현재 세션 상태 파악.

### 2. 인자에 따른 분기

#### Case A: `/start` (인자 없음)

활성 세션 목록과 최근 종료 세션을 표시:

```markdown
🎩 Oscar: 세션 목록입니다.

## 활성 세션
┌────┬─────────────────┬────────┬─────────────────────────────┐
│ #  │ ID              │ 상태   │ 주제                         │
├────┼─────────────────┼────────┼─────────────────────────────┤
│ 1  │ notion-tasks    │ 🟢 idle│ 스프린트 52 노션 태스크       │
│ 2  │ surface-cvr     │ 🔒 사용중│ Surface Layer CVR 최적화   │
└────┴─────────────────┴────────┴─────────────────────────────┘

## 최근 종료
  • ir-prep (01/25) - IR 자료 준비

---
선택: 번호, ID, 또는 "new {주제}"
```

#### Case B: `/start {id}`

특정 세션 복원 (부분 매칭 지원):

1. `index.yaml`에서 해당 세션 찾기
2. Lock 상태 확인 (아래 Lock 확인 섹션 참조)
3. `active/{id}.md` 로드
4. Lock 획득 후 세션 시작

#### Case C: `/start new "{주제}"` 또는 `/start new {id} "{주제}"`

새 세션 생성:

1. slug 생성 (자동 또는 지정)
   - 자동: 주제에서 키워드 추출 → 영문 slug
   - 예: "스프린트 52 노션 태스크" → `sprint-notion-tasks`
2. `active/{slug}.md` 생성 (세션 파일 템플릿 사용)
3. `index.yaml`에 등록
4. Lock 획득
5. 작업 유형 질문

#### Case D: `/start recent`

최근 종료된 세션 목록 표시 → 선택 시 archive에서 active로 복원.

#### Case E: `/start parallel`

**병렬 세션 빠른 시작** (다른 터미널에서 작업 중일 때 유용):

1. `.context/.secrets.yaml` 로드
2. `.context/WORKFLOW.md` 로드
3. `index.yaml`에서 현재 활성 세션 확인
4. **Lock 경고 무시** - 다른 세션이 사용 중이어도 경고 없이 진행
5. 현재 스프린트 컨텍스트 로드
6. 작업 유형 질문

```markdown
🎩 Oscar: 병렬 세션으로 빠르게 시작합니다.

## 📋 현재 스프린트: 52 (D-5)
- 목표: [스프린트 목표]
- D-Day: 2026-02-01

## 활성 세션 참고
- parallel-session (idle): 병렬 세션 관리 시스템 설계

---
오늘은 어떤 작업을 하실 건가요?
```

**특징**:
- Lock 체크 생략 → 충돌 가능성 인지하고 사용
- 기존 세션에 자동 진입하지 않음 (새 작업 가정)
- 스프린트 컨텍스트만 로드

---

## Lock 확인 로직

```
Lock 상태 확인
├── lock.active == false → 정상 진행
├── lock.active == true
│   ├── lock.expires < now → Stale Lock, 정상 진행
│   └── lock.expires >= now → 경고 표시
│       ├── 사용자 "계속" 선택 → Lock 강제 획득
│       └── 사용자 "취소" 선택 → 세션 선택으로 돌아감
```

**경고 메시지 예시**:
```markdown
⚠️ 이 세션은 다른 터미널에서 **5분 전**에 사용 중이었습니다.
   계속하면 충돌이 발생할 수 있습니다.

   [1] 계속 (충돌 감수)
   [2] 취소 (다른 세션 선택)
```

---

## 비정상 종료 복구

세션 복원 시 `dirty: true`이고 `manual_saved_at < auto_saved_at`이면:

```markdown
⚠️ 이 세션은 비정상 종료된 것 같습니다.

   마지막 수동 저장: 10:30 (45분 전)
   마지막 자동 저장: 11:10 (5분 전)

   자동 저장 시점 상태:
   - 진행 중: E-03 시리즈 생성
   - 마지막 완료: E-03-S-05

   [1] 자동 저장 시점에서 계속 (권장)
   [2] 수동 저장 시점으로 롤백
```

---

## Lock 획득

세션 시작 시 Lock 획득:

```yaml
# index.yaml 갱신
- id: "notion-tasks"
  status: active
  lock:
    active: true
    since: "2026-01-26T12:00:00"    # 현재 시각
    expires: "2026-01-26T12:30:00"  # +30분
```

---

## 세션 시작 후 컨텍스트 로드

### 워크플로우 로드

`.context/WORKFLOW.md` 읽기

### 작업 유형 질문 (새 세션인 경우)

```markdown
오늘은 어떤 작업을 하실 건가요?

1. 🏃 스프린트 작업 (Sprint 52)
2. 📊 [도메인 1]
3. 📣 [도메인 2]
4. 💬 [도메인 3]
5. 🎯 전략 논의
6. 📈 지표 확인
```

### 컨텍스트 로드

| 작업 | 로드할 파일 |
|------|------------|
| 스프린트 | `.context/sprints/s{N}/context.md` |
| [도메인 1] | `.context/domains/[domain1]/*.md` |
| [도메인 2] | `.context/domains/[domain2]/*.md` |
| [도메인 3] | `.context/domains/[domain3]/*.md` |
| 전략 | `.context/global/strategy.md` |
| 지표 | `.context/global/metrics.md` |

---

## 세션 파일 템플릿

새 세션 생성 시 사용:

```markdown
---
id: {slug}
topic: "{주제}"
created_at: "{ISO8601}"
updated_at: "{ISO8601}"
auto_saved_at: null
manual_saved_at: null
turn_count: 0
tags: []
---

# Session: {slug}

> 마지막 업데이트: {날짜}

## 현재 상태
<!-- 자동 저장 시 갱신 -->

**진행 중**: 없음
**마지막 작업**: 세션 시작
**다음 작업**: 미정

---

## 작업 히스토리
<!-- /save 시 정리 -->

---

## 산출물
<!-- 생성된 파일, 결정사항 등 -->

---

## 참고 자료
<!-- 관련 파일, 공유 산출물 등 -->

---

## 📔 세션 일기
<!-- /save 시 자동 생성 - 참여 에이전트별 회고 -->

### 🎩 Oscar (Orchestrator)

**오늘의 핵심 (Highlights)**:
- (저장 시 작성)

**느낀 점 (Feelings)**:
- (저장 시 작성)

**배운 것 (Learnings)**:
- (저장 시 작성)

**User Context 업데이트**:
- (저장 시 작성)

<!-- 참여한 에이전트별 섹션이 /save 시 추가됨 -->

---

*세션 종료: `/save` 또는 `/save --close`*
```

---

## 자동 저장 (Oscar 내부 동작)

세션 시작 후 Oscar는 매 턴마다:

1. **Lightweight 저장**: `index.yaml`의 `last_turn`, `lock.expires` 갱신
2. **조건부 Full 저장**: 아래 조건 시 세션 파일 전체 저장
   - 10턴마다
   - 에이전트 핸드오프 완료
   - TodoWrite 호출
   - 파일 생성/수정
   - MCP 도구 호출

---

## 관련 커맨드

- `/save` - 세션 저장
- `/save --close` - 세션 저장 + 종료 (archive)
- `/save --share "{제목}"` - 세션 저장 + 산출물 공유
- `/sessions` - 전체 세션 현황

---

*파일 위치*:
- 세션 인덱스: `.context/sessions/index.yaml`
- 활성 세션: `.context/sessions/active/{id}.md`
- 종료 세션: `.context/sessions/archive/{YYYY-MM}/{id}-{MMDD}.md`
- 공유 산출물: `.context/sessions/shared/{date}-{title}.md`
