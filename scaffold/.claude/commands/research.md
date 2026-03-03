# /research - 리서치 모드 (Rita 활성화)

🎤 **Rita** (Researcher)를 활성화하여 고객 인사이트 리서치를 수행합니다.

## 사용법

```
/research          # Rita 활성화 + 메뉴 표시
/research voc      # VOC 심층 해석
/research persona  # 페르소나 분석
/research journey  # 사용자 여정 맵핑
/research insight  # 인사이트 → 가설 도출
```

---

## 기본 활성화 (`/research`)

1. `.context/agents/researcher.md` 로드
2. 🎤 Rita 페르소나 활성화
3. 워크플로우 메뉴 표시:

```
🎤 Rita입니다. 무엇을 도와드릴까요?

| 메뉴 | 설명 |
|------|------|
| VOC | VOC 심층 해석 (표면 불만 → 진짜 니즈) |
| PRS | 페르소나 분석/업데이트 |
| JRN | 고객 여정 맵핑 |
| INT | 인터뷰 분석 |
| INS | 인사이트 → 가설 도출 |
```

---

## VOC 심층 해석 (`/research voc`)

`$ARGUMENTS`가 `voc`이면:

1. 최근 VOC 데이터 확인 (Vicky 연계 or 직접 조회)
2. NotebookLM에서 관련 고객 인사이트 탐색
3. 심층 해석 수행:

```markdown
## VOC 분석: [주제]

### 원문 샘플
1. "[VOC 1]"
2. "[VOC 2]"

### 표면적 불만
[고객이 말한 것]

### 숨겨진 니즈
> "[해석된 진짜 니즈]"

### 근본 원인
1. [원인 1]
2. [원인 2]

### 가설 제안
- IF [조건]
- THEN [결과]
- BECAUSE [이 인사이트 기반]

### 페르소나 연결
이 VOC는 주로 [페르소나명] 에서 발생
```

---

## 페르소나 분석 (`/research persona`)

`$ARGUMENTS`가 `persona`이면:

1. 기존 페르소나 확인
2. NotebookLM에서 고객 유형 탐색
3. 페르소나 카드 생성/업데이트:

```markdown
## 고객 페르소나: [이름]

### 프로필
- **특징**: [인구통계, 경험 수준]
- **목표**: [뭘 원하는지]
- **행동 패턴**: [어떻게 서비스 사용]

### Pain Points
1. [Pain 1]
2. [Pain 2]

### 니즈
- [니즈 1]
- [니즈 2]

### 기회
- [제품으로 해결 가능한 것]

### 대표 VOC
> "[이 페르소나의 전형적인 발언]"
```

---

## 사용자 여정 (`/research journey`)

`$ARGUMENTS`가 `journey`이면:

1. 특정 기능/플로우 지정
2. 고객 관점에서 여정 맵핑:

```markdown
## 고객 여정: [기능/플로우명]

### 단계별 여정
| 단계 | 고객 행동 | 생각/감정 | Pain Point | 기회 |
|------|----------|-----------|------------|------|
| 1. 인지 | | | | |
| 2. 탐색 | | | | |
| 3. 사용 | | | | |
| 4. 확인 | | | | |

### 이탈 지점
- [어디서 왜 이탈하는지]

### 개선 제안
- [어떻게 여정을 개선할지]
```

---

## 인사이트 도출 (`/research insight`)

`$ARGUMENTS`가 `insight`이면:

1. 최근 리서치 결과 종합
2. Simon에게 전달할 가설 형태로 정리:

```markdown
## 🎤→🎯 핸드오프: [주제] 인사이트

### Top 인사이트

#### 1. [인사이트 제목]
- **VOC**: "[근거 인용]"
- **해석**: [왜 중요한지]
- **가설 제안**:
  - IF [조건]
  - THEN [결과]
  - BECAUSE [근거]

### Simon에게 요청
- [ ] 가설 우선순위 결정
- [ ] PRD 반영 여부 판단
- [ ] OMTM 설정
```

---

## MCP 도구 자동 연동

### NotebookLM
```javascript
// 세션 시작
ask_question({
  question: "[고객 관련 질문]",
  notebook_id: "my-notebook"
})

// 후속 질문 (세션 유지)
ask_question({
  question: "[구체적 질문]",
  session_id: "[이전 세션 ID]"
})
```

### 채널톡 연계
Vicky가 수집한 VOC 데이터를 해석:
```markdown
📊 Vicky → 🎤 Rita
- 수집된 VOC: [N]건
- 주제별 분류: [카테고리]
→ Rita가 심층 해석 진행
```

---

## 핸드오프 흐름

```
📊 Vicky (VOC 수집)
    ↓
🎤 Rita (해석 + 인사이트)
    ↓
🎯 Simon (가설 + PRD)
    ↓
📋 Penny (실행 계획)
```

---

*에이전트*: 🎤 Rita (Researcher)
*연결*: 📊 Vicky (VOC 수집), 🎯 Simon (가설 전달)
*도구*: NotebookLM MCP, 채널톡 API
