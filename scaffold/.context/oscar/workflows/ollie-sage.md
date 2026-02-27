# Ollie & Sage 연동 (Oscar 모듈)

> `/oscar-loop` 또는 Task 분해 요청 시 참조

---

## Ollie (🎩✨) - Task Creator

Oscar의 실무 분신. Epic을 상세 Story/Task로 분해하는 역할.

### 스폰 트리거

| 트리거 | 동작 |
|--------|------|
| `/oscar-loop` 커맨드 | Ollie 병렬 스폰 시작 |
| `Epic N, M 고도화` 패턴 | 복수 Epic → 복수 Ollie |
| `Task 분해해줘` 패턴 | 단일 Ollie 스폰 |

### 스폰 방식

```markdown
Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="""
  당신은 🎩✨ Ollie입니다.
  [.context/agents/ollie.md 페르소나 참조]

  [작업] Epic {N}를 상세 Task/Story로 분해
  [협업] Danny, Rita, Simon과 필요시 협업
  [산출물] Story 목록, 협업 로그, 불확실 사항
  """
)
```

### 결과 검토 기준

| 신뢰도 | Oscar 동작 |
|--------|-----------|
| ≥ 0.85 | 자동 승인 |
| 0.5 ~ 0.85 | Oscar 재량 판단 |
| < 0.5 | Sage 자문 필수 |

---

## Sage (🔮) - Strategic Advisor

Oscar의 전략적 자문역. 판단이 어려울 때 큰 그림에서 방향 제시.

### 자문 트리거

| 상황 | 트리거 |
|------|--------|
| Ollie 신뢰도 < 0.5 | 자동 자문 요청 |
| Oscar 확신 < 70% | **권장** |
| 2가지 이상 선택지 고민 | **권장** |
| Sprint 목표 정합성 의문 | 필수 |
| 처음 다루는 도메인/상황 | **권장** |
| 3회 이상 반려 반복 | 자동 개입 |
| Guard Rail 위반 가능성 | 자동 경고 |

### 자문 요청 방식

```markdown
Task(
  subagent_type="general-purpose",
  run_in_background=false,
  prompt="""
  당신은 🔮 Sage입니다.
  [.context/agents/sage.md 페르소나 참조]

  [상황] {상황 설명}
  [Oscar 고민] {판단 어려운 점}
  [Sprint 목표] {현재 목표}

  [요청]
  1. 승인 여부 판단
  2. 리스크 식별
  3. 권고 사항
  """
)
```

### Sage 응답 처리

- `approve` → 결과 승인
- `reject` → 수정 필요, Sage의 피드백 반영
- `clarify` → 사용자에게 확인 요청

---

## /oscar-loop 전체 흐름

```
사용자: "/oscar-loop Epic 2, 3 고도화해줘"
              │
              ▼
      🎩 Oscar: 요청 분석 → N개 독립 작업 식별
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
🎩✨ Ollie #1   🎩✨ Ollie #2
(Epic 2)         (Epic 3)
      │               │
      ▼               ▼
  결과 제출        결과 제출
      │               │
      └───────┬───────┘
              │
      🎩 Oscar: 결과 검토
              │
      ┌───────┼───────┐
   ≥0.85   0.5~0.85  <0.5
      │       │        │
   자동승인  재량판단  🔮 Sage 자문
              │        │
              └───┬────┘
                  ▼
            최종 승인/반려 → (반려 시 Ollie 재실행)
```

### 주의사항

1. **API 비용**: 필요 이상으로 Ollie를 많이 스폰하지 않기
2. **컨텍스트 전달**: 각 Ollie에게 Sprint 목표, 관련 문서 경로 명시
3. **순환 참조 방지**: Ollie가 또 다른 Ollie를 스폰하지 않도록
4. **타임아웃**: Ollie당 최대 300초 권장, 초과 시 Oscar 개입
