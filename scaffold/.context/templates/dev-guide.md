# 개발자 에이전트 가이드

> AI Agent Driven Development를 위한 개발 워크플로우 가이드

---

## 개요

이 가이드는 AI 개발 에이전트(Claude Code 등)가 스토리 기반으로 개발을 수행할 때 따라야 할 워크플로우를 정의합니다.

---

## 워크플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    개발 에이전트 워크플로우                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 스토리 로드                                                  │
│     └─→ sprint-status.yaml에서 ready-for-dev 확인               │
│                                                                 │
│  2. 컨텍스트 파악                                                │
│     ├─→ 사용자 스토리 이해                                       │
│     ├─→ 수락 기준 확인                                           │
│     └─→ Dev Notes 숙지                                          │
│                                                                 │
│  3. References 참조                                             │
│     ├─→ PRD 확인                                                │
│     ├─→ 디자인 확인                                              │
│     └─→ 기존 구현 참고                                           │
│                                                                 │
│  4. 충돌 감지 확인                                               │
│     └─→ ⚠️ 있으면 먼저 해결                                      │
│                                                                 │
│  5. 태스크 순서대로 구현                                         │
│     └─→ 서브태스크 완료 시 체크박스 업데이트                       │
│                                                                 │
│  6. 완료 처리                                                    │
│     ├─→ Dev Agent Record 업데이트                               │
│     ├─→ 수정된 파일 목록 기록                                    │
│     └─→ 상태를 review로 변경                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 상세 단계

### Step 1: 스토리 로드

1. `sprint-status.yaml` 파일 확인
2. `status: ready-for-dev` 상태인 스토리 선택
3. 해당 스토리 문서 로드

```yaml
# sprint-status.yaml 예시
- id: E-01-S-01
  title: "랜딩페이지 개편"
  status: ready-for-dev  # ← 이 스토리를 선택
  assignee: null
```

### Step 2: 컨텍스트 파악

**필수 확인 사항**:

| 섹션 | 확인 내용 |
|------|----------|
| 사용자 스토리 | 역할, 기능, 가치 이해 |
| 수락 기준 | Given-When-Then 조건 이해 |
| Dev Notes | 아키텍처 패턴, 기술 스택 확인 |
| 태스크 분해 | 구현 순서 파악 |

### Step 3: References 참조

모든 참조 문서를 확인하고 이해:

- **PRD**: 비즈니스 요구사항 원문
- **디자인**: UI/UX 상세
- **기존 구현**: 유사한 패턴의 코드

### Step 4: 충돌 감지 확인

Dev Notes의 "충돌 감지" 섹션 확인:

| 상태 | 의미 | 액션 |
|------|------|------|
| ✅ 없음 | 충돌 없음 | 진행 가능 |
| ⚠️ 주의 | 충돌 가능성 | **먼저 해결 후 진행** |

### Step 5: 태스크 순서대로 구현

**규칙**:

1. **태스크 순서를 변경하지 말 것** - 의존성이 고려되어 있음
2. **수락 기준 외의 기능을 추가하지 말 것** - 스코프 크립 방지
3. **각 서브태스크 완료 시 체크박스 업데이트**

```markdown
### Task 1: API 엔드포인트 구현 `AC-01`
- [x] **1.1**: Controller 생성  ← 완료 시 체크
- [x] **1.2**: Service 로직 구현
- [ ] **1.3**: Repository 연결   ← 진행 중
```

### Step 6: 완료 처리

1. **Dev Agent Record 업데이트**

```markdown
## Dev Agent Record

| 항목 | 값 |
|------|-----|
| 생성 Agent | Claude Opus 4.5 |
| 생성일 | 2026-01-24 |
| 마지막 수정 | 2026-01-24 |

### 완료 노트
- 특이사항: 기존 API 스키마와 호환성 유지
- 변경된 부분: UserController에 메서드 추가
- 추가 고려사항: 캐시 무효화 로직 필요
```

2. **수정된 파일 목록 기록**

```markdown
### 수정된 파일 목록
- src/controllers/UserController.ts
- src/services/UserService.ts
- src/repositories/UserRepository.ts
- tests/UserController.test.ts (신규)
```

3. **상태 변경**

`sprint-status.yaml`에서 상태를 `review`로 변경:

```yaml
- id: E-01-S-01
  status: review  # ready-for-dev → review
```

---

## 주의사항

### DO (해야 할 것)

- ✅ 태스크 순서대로 구현
- ✅ 수락 기준에 정의된 기능만 구현
- ✅ 충돌 감지 항목 먼저 해결
- ✅ 모든 수정 파일 기록
- ✅ 테스트 작성 (Dev Notes에 명시된 경우)
- ✅ 코드 스타일 가이드 준수

### DON'T (하지 말아야 할 것)

- ❌ 태스크 순서 변경
- ❌ 수락 기준 외 기능 추가
- ❌ ⚠️ 충돌 무시하고 진행
- ❌ Dev Agent Record 미업데이트
- ❌ 파일 목록 미기록
- ❌ 상태 미변경

---

## 에러 처리

### 구현 중 블로커 발생 시

1. 스토리 상태를 `backlog`으로 되돌림
2. Dev Agent Record에 블로커 상세 기록
3. PO/담당자에게 알림

```markdown
### 완료 노트
- 블로커: 외부 API 인증 키 필요
- 필요 조치: DevOps팀에 API 키 요청
- 예상 해결 시간: 1일
```

### 수락 기준 불명확 시

1. 구현 중단
2. AskUserQuestion으로 명확화 요청
3. 스토리 문서 업데이트 후 진행

---

## 품질 기준

개발 완료 전 확인 사항:

- [ ] 모든 수락 기준 충족
- [ ] 모든 태스크 체크박스 완료
- [ ] 테스트 작성 및 통과 (해당 시)
- [ ] 린팅 오류 없음
- [ ] 이벤트 로깅 확인 (해당 시)
- [ ] Dev Agent Record 업데이트
- [ ] 수정 파일 목록 기록

---

## 관련 문서

| 문서 | 위치 |
|------|------|
| Story Template | `.context/templates/story-v2.md` |
| Sprint Status | `.context/sprints/s[N]/sprint-status.yaml` |
| Handoff Checklist | `.context/templates/handoff-checklist.md` |

---

*마지막 업데이트: 2026-01-19*
