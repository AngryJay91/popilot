# /task - Story/Task 상태 관리

VitePress 칸반 보드와 연동하여 Story 상태와 Task 체크박스를 관리합니다.

## 사용법

```bash
# Story 상태 변경
/task status E-10-S-01 done        # draft → done
/task status E-10-S-01 in-progress # draft → in-progress

# Task 완료 체크
/task done E-10-S-01 1.1           # Task 1.1 완료 처리
/task done E-10-S-01 1.1 1.2 2.1   # 여러 Task 한번에 완료

# Task 완료 취소
/task undo E-10-S-01 1.1           # Task 1.1 미완료로 되돌림

# Story 정보 조회
/task E-10-S-01                    # Story 상세 정보
/task list                         # 현재 스프린트 전체 Story 목록
```

## 상태 값

| 상태 | 설명 |
|------|------|
| `draft` | 초안 |
| `ready` | 개발 준비 완료 |
| `in-progress` | 개발 중 |
| `review` | 리뷰 중 |
| `done` | 완료 |
| `blocked` | 차단됨 |

---

## 실행 로직

### 1. Story 상태 변경 (`/task status`)

**파일 위치 찾기**:
```
CLAUDE.md에서 "현재 스프린트: **{N}**" 추출 → s{N}
.context/sprints/s{N}/stories/{STORY_ID}.md
```

**수정할 패턴**:
```markdown
| **상태** | `{OLD_STATUS}` |
→
| **상태** | `{NEW_STATUS}` |
```

**실행 예시**:
```bash
/task status E-10-S-01 done
```

1. `.context/sprints/s52/stories/E-10-S-01.md` 파일 읽기
2. `| **상태** | \`draft\` |` 찾기
3. `| **상태** | \`done\` |` 으로 변경
4. 파일 저장
5. 결과 출력

**출력**:
```
✅ E-10-S-01 상태 변경: draft → done

📋 Story: WorkNote 테이블 설계 및 API
📁 파일: .context/sprints/s52/stories/E-10-S-01.md
```

---

### 2. Task 완료 체크 (`/task done`)

**수정할 패턴**:
```markdown
- [ ] **{TASK_ID}**: {description}
→
- [x] **{TASK_ID}**: {description}
```

**실행 예시**:
```bash
/task done E-10-S-01 1.1 1.2
```

1. `.context/sprints/s52/stories/E-10-S-01.md` 파일 읽기
2. `- [ ] **1.1**:` 패턴 찾기
3. `- [x] **1.1**:` 으로 변경
4. `- [ ] **1.2**:` 패턴 찾기
5. `- [x] **1.2**:` 으로 변경
6. 파일 저장
7. 진행률 계산 및 출력

**출력**:
```
✅ E-10-S-01 Task 완료 처리

완료된 Task:
- [x] 1.1: WorkNote 테이블 스키마 정의
- [x] 1.2: 마이그레이션 파일 생성

📊 진행률: 2/14 tasks (14%)
```

---

### 3. Task 완료 취소 (`/task undo`)

**수정할 패턴**:
```markdown
- [x] **{TASK_ID}**: {description}
→
- [ ] **{TASK_ID}**: {description}
```

---

### 4. Story 정보 조회 (`/task {STORY_ID}`)

**실행 예시**:
```bash
/task E-10-S-01
```

**출력**:
```
📋 E-10-S-01: WorkNote 테이블 설계 및 API

| 항목 | 값 |
|------|-----|
| 상태 | draft |
| 우선순위 | P0 |
| 규모 | M (2 SP) |
| 담당자 | TBD (BE) |

## Tasks (0/14 완료)

### Task 1: 테이블 설계
- [ ] 1.1: WorkNote 테이블 스키마 정의
- [ ] 1.2: 마이그레이션 파일 생성
- [ ] 1.3: 인덱스 추가

### Task 2: 노트 생성 API
- [ ] 2.1: POST 엔드포인트 생성
...
```

---

### 5. 전체 Story 목록 (`/task list`)

**실행 예시**:
```bash
/task list
/task list in-progress    # 특정 상태만
/task list 수민           # 특정 담당자만
```

**출력**:
```
📋 Sprint 52 Stories (63개)

| Status | 상태별 개수 |
|--------|------------|
| draft | 45 |
| in-progress | 5 |
| done | 13 |

## In Progress (5)
- E-03-S-02: 캠페인 카드 컴포넌트 (수민, M)
- E-04-S-01: 순이익 번역 UI (수민, L)
...
```

---

## 스프린트 자동 감지

현재 스프린트 번호는 `CLAUDE.md`에서 자동 추출:

```markdown
## 현재 스프린트: **52**
```

→ `.context/sprints/s52/stories/` 경로 사용

---

## VitePress 자동 반영

Story 파일 수정 시 VitePress 칸반 보드에 자동 반영:
- 개발 서버 실행 중: Hot Reload로 즉시 반영
- 빌드 시: 다음 빌드에 반영

---

## 예시 워크플로우

```bash
# 1. 작업 시작
/task status E-10-S-01 in-progress

# 2. Task 완료할 때마다 체크
/task done E-10-S-01 1.1
/task done E-10-S-01 1.2 1.3

# 3. Story 완료
/task status E-10-S-01 done

# 4. 진행상황 확인
/task list in-progress
```

---

*관련 기능*: VitePress 칸반 보드 (`docs/kanban.md`)
*데이터 소스*: `.context/sprints/s{N}/stories/*.md`
