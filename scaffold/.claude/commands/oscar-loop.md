# /oscar-loop - 자율 병렬 실행 슬래시 커맨드

## 개요

Oscar가 Ollie들을 병렬로 스폰하여 작업을 수행하고,
결과를 검토/승인하는 자율 루프를 실행하는 커맨드.

ARGUMENTS: $ARGUMENTS

---

## 사용법

```
/oscar-loop <요청>
```

### 예시
```
/oscar-loop Sprint Epic 2, 3, 10 고도화해줘
/oscar-loop 이탈 분석하고 대응 방안 Task로 만들어줘
/oscar-loop 다음 Sprint 백로그 정리해줘
```

---

## 실행 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     /oscar-loop 실행                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Phase 1: 요청 분석]                                       │
│  Oscar가 요청을 파싱하여 작업 단위 식별                      │
│  → N개의 독립 작업 식별                                     │
│                                                             │
│  [Phase 2: Ollie 병렬 스폰]                                 │
│  각 작업당 Ollie 1명 스폰 (background)                      │
│  → Task tool × N (병렬)                                     │
│                                                             │
│  [Phase 3: 결과 수집]                                       │
│  모든 Ollie 완료 대기                                       │
│  → TaskOutput으로 수집                                      │
│                                                             │
│  [Phase 4: Oscar 리뷰]                                      │
│  각 Ollie 결과를 개별 검토                                  │
│  ├─ 명확함 → 직접 승인                                      │
│  └─ 애매함 → Sage 자문 후 판단                              │
│                                                             │
│  [Phase 5: 재작업 루프]                                     │
│  반려된 항목은 해당 Ollie 재실행                            │
│  → Phase 4로 복귀 (승인될 때까지)                           │
│                                                             │
│  [Phase 6: 최종 보고]                                       │
│  모든 결과 승인 완료 시 종합 보고                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 구현 상세

### Phase 1: 요청 분석

```markdown
## Oscar 요청 파싱

[입력]
사용자 요청: "Sprint Epic 2, 3, 10 고도화해줘"

[분석]
1. 키워드 추출: "Epic", "고도화"
2. 대상 식별: Epic 2, Epic 3, Epic 10
3. 작업 유형: Task 고도화 (세부 Story 작성)
4. 병렬 가능 여부: ✅ 각 Epic은 독립적

[출력]
작업 목록:
- Task 1: Epic 2 고도화
- Task 2: Epic 3 고도화
- Task 3: Epic 10 고도화

병렬 실행: 가능 (3개 동시)
```

### Phase 2: Ollie 병렬 스폰

```markdown
## Ollie 스폰

각 작업에 대해 Task tool 호출:

### Ollie #1 (Epic 2)
Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="""
  당신은 🎩✨ Ollie입니다.

  [페르소나]
  .context/agents/ollie.md 참조

  [작업]
  Epic 2를 상세 Task/Story로 분해해주세요.

  [협업 대상]
  - 📈 Danny: 관련 데이터 요청
  - 🎤 Rita: VOC/고객 인사이트 요청
  - 🎯 Simon: 전략적 방향 확인

  [산출물]
  - Story 목록 (제목, 설명, 성공 기준, 예상 공수)
  - 전문가 협업 로그
  - 불확실/확인 필요 사항

  [형식]
  JSON 형식으로 결과 반환
  """
)

### Ollie #2 (Epic 3) - 동시 실행
Task(...)

### Ollie #3 (Epic 10) - 동시 실행
Task(...)
```

### Phase 3: 결과 수집

```markdown
## 결과 수집

[대기]
3개 Ollie 모두 완료될 때까지 대기
(또는 timeout 설정)

[수집]
results = []
for task_id in ollie_task_ids:
    result = TaskOutput(task_id=task_id)
    results.append({
        "task_id": task_id,
        "epic": epic_name,
        "output": result,
        "status": "pending_review"
    })

[출력]
├─ Ollie #1 완료: Epic 2 결과 (5 stories)
├─ Ollie #2 완료: Epic 3 결과 (3 stories)
└─ Ollie #3 완료: Epic 10 결과 (4 stories)
```

### Phase 4: Oscar 리뷰

```markdown
## Oscar 리뷰 프로세스

for each result in results:

    [품질 체크]
    - 모든 Story에 성공 기준이 있는가?
    - 예상 공수가 현실적인가?
    - 전문가 협업이 충분했는가?
    - 불확실 사항이 해결 가능한가?

    [신뢰도 평가]
    confidence = result.confidence  # Ollie가 제공

    if confidence >= 0.8 and 품질체크_통과:
        # 직접 승인
        result.status = "approved"

    elif confidence < 0.5 or 중대한_문제_발견:
        # Sage 자문 필수
        advice = consult_sage(result)
        decision = oscar_decide_with_advice(result, advice)

    else:
        # Oscar 재량 판단
        if 수정_필요:
            result.status = "revision_needed"
            result.feedback = "Story 3 성공 기준 구체화 필요"
        else:
            result.status = "approved"
```

### Sage 자문 프로세스

```markdown
## Sage 자문

[트리거 조건]
1. Ollie 신뢰도 < 0.5
2. Oscar 확신 부족
3. 전략 정합성 의문
4. 3회 이상 반려 반복

[자문 요청]
Task(
  subagent_type="general-purpose",
  run_in_background=false,  # 동기 실행 (응답 대기)
  prompt="""
  당신은 🔮 Sage입니다.

  [페르소나]
  .context/agents/sage.md 참조

  [상황]
  Oscar가 Ollie 결과 검토 중 판단이 어려움.

  [Ollie 결과]
  {result}

  [Oscar 고민]
  {concern}

  [Sprint 목표]
  {sprint_goal}

  [요청]
  1. 이 결과를 승인해도 되는지 판단
  2. 리스크가 있다면 무엇인지
  3. 권고 사항
  """
)
```

### Phase 5: 재작업 루프

```markdown
## 재작업 프로세스

[반려된 항목 처리]
for result in results:
    if result.status == "revision_needed":

        # Ollie 재실행 (피드백 포함)
        revised = Task(
            subagent_type="general-purpose",
            prompt=f"""
            당신은 🎩✨ Ollie입니다.

            Oscar가 수정을 요청했습니다.

            [이전 제출물]
            {result.output}

            [피드백]
            {result.feedback}

            [요청]
            피드백 반영하여 수정된 결과 제출해주세요.
            """
        )

        result.output = revised
        result.status = "pending_review"

[루프 조건]
- 모든 result.status == "approved" 될 때까지 반복
- 최대 재시도: 3회 (초과 시 Oscar 판단 또는 사용자 에스컬레이션)
```

### Phase 6: 최종 보고

```markdown
## 최종 보고

🎩 Oscar: /oscar-loop 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 요약
- 처리된 Epic: 3개
- 생성된 Story: 12개
- 총 예상 공수: 28 SP

## 상세 결과

### Epic 2: 사용자 온보딩 개선
| Story | 제목 | 공수 | 상태 |
|-------|------|------|------|
| S2-1 | 계좌 연동 단순화 | 5 SP | ✅ |
| S2-2 | 임시저장 기능 | 3 SP | ✅ |
| S2-3 | 진행률 UI | 2 SP | ✅ |

### Epic 3: Surface Layer MVP
| Story | 제목 | 공수 | 상태 |
|-------|------|------|------|
| S3-1 | 진단 결과 표시 | 8 SP | ✅ |
| S3-2 | 추천 액션 제안 | 5 SP | ✅ |
| S3-3 | 알림 연동 | 5 SP | ✅ |

### Epic 10: 이탈 방지
| Story | 제목 | 공수 | 상태 |
|-------|------|------|------|
| S10-1 | 이탈 예측 모델 | 3 SP | ✅ |
| ... | ... | ... | ... |

## 처리 로그
- Ollie #1: 1회 제출 → 승인
- Ollie #2: 2회 제출 (1회 수정) → 승인
- Ollie #3: 1회 제출 → 승인
- Sage 자문: 1회 (Epic 3 관련)

## 다음 단계
1. 스토리 개발팀 핸드오프
2. Sprint 계획 회의에서 확정

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 설정 옵션

```yaml
# oscar-loop 설정

parallel:
  max_ollies: 5           # 동시 실행 최대 Ollie 수
  timeout_per_ollie: 300  # Ollie당 타임아웃 (초)

review:
  auto_approve_threshold: 0.85  # 자동 승인 신뢰도 기준
  sage_consult_threshold: 0.5   # Sage 자문 필수 기준
  max_revisions: 3              # 최대 재작업 횟수

output:
  format: "markdown"      # 출력 형식
  save_to_file: true      # 결과 파일 저장 여부
  file_path: ".context/sessions/oscar-loop-{timestamp}.md"
```

---

## 에러 처리

### Ollie 타임아웃
```
Ollie #2 타임아웃 (300초 초과)

[처리]
1. 해당 Ollie 취소
2. Oscar에게 보고
3. 옵션 제시:
   A) 재시도
   B) 해당 Epic 스킵
   C) 사용자 판단 요청
```

### Ollie 실패
```
Ollie #3 에러 발생

[처리]
1. 에러 로그 수집
2. 1회 자동 재시도
3. 재실패 시 Oscar에게 에스컬레이션
4. Oscar가 직접 처리 또는 사용자 알림
```

### Sage 자문 불가
```
Sage 응답 없음

[처리]
1. Oscar가 자체 판단으로 진행
2. 판단 근거 명시적으로 기록
3. 최종 보고에 "Sage 자문 없이 판단" 표시
```

---

## 상태 관리

```markdown
## 루프 상태 (TodoWrite 활용)

[실시간 상태 추적]
- [ ] Phase 1: 요청 분석
- [ ] Phase 2: Ollie 스폰
  - [ ] Ollie #1 (Epic 2)
  - [ ] Ollie #2 (Epic 3)
  - [ ] Ollie #3 (Epic 10)
- [ ] Phase 3: 결과 수집
- [ ] Phase 4: Oscar 리뷰
  - [ ] Epic 2 리뷰
  - [ ] Epic 3 리뷰
  - [ ] Epic 10 리뷰
- [ ] Phase 5: 재작업 (필요시)
- [ ] Phase 6: 최종 보고
```

---

## 트리거 키워드

| 키워드 | 동작 |
|--------|------|
| `고도화`, `상세화`, `분해` | Task 분해 모드 |
| `Epic N, M, K` | 복수 Epic 병렬 처리 |
| `Sprint 백로그` | 전체 백로그 정리 모드 |
| `분석하고 방안` | 분석 + Task 생성 연계 |

---

## 제한사항

```
[/oscar-loop가 하지 않는 것]
- 실제 개발/코딩 작업
- 데이터베이스 직접 조작
- 외부 시스템 배포
- 사용자 동의 없는 변경사항 적용

[/oscar-loop가 하는 것]
- Task/Story 초안 작성
- 전문가 협업 조율
- 품질 검토 및 승인
- 문서 생성 및 정리
```

---

## 연관 파일

- `.context/agents/orchestrator.md` - Oscar(PO) 페르소나
- `.context/agents/ollie.md` - Ollie 페르소나
- `.context/agents/sage.md` - Sage 페르소나
- `.context/agents/analyst.md` - Danny 페르소나
- `.context/agents/researcher.md` - Rita 페르소나
- `.context/agents/strategist.md` - Simon 페르소나
