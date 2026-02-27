# /save - 세션 저장

현재 세션을 저장합니다. 옵션에 따라 세션 종료 또는 산출물 공유도 가능합니다.

## 사용법

```bash
/save                     # 세션 저장, Lock 해제, status: idle
/save --close             # 세션 저장 + archive로 이동 (세션 종료)
/save --share "{제목}"    # 세션 저장 + shared/에 산출물 등록
```

ARGUMENTS: $ARGUMENTS

---

## 실행 단계

### 1. 현재 세션 확인

`index.yaml`에서 현재 활성 세션 (`status: active`) 찾기.

활성 세션이 없으면:
```markdown
⚠️ 저장할 활성 세션이 없습니다.
   `/start`로 세션을 시작하세요.
```

### 2. 세션 파일 저장

`active/{id}.md` 파일 갱신:

```yaml
# frontmatter 갱신
updated_at: "{현재 시각}"
manual_saved_at: "{현재 시각}"
turn_count: {현재 턴 수}
```

**저장할 내용**:
- 현재 상태 (진행 중, 마지막 작업, 다음 작업)
- 작업 히스토리 (오늘 수행한 작업 요약)
- 산출물 목록 (생성/수정한 파일)
- 참고 자료 (사용한 공유 산출물 등)

### 3. index.yaml 갱신

```yaml
- id: "{세션 ID}"
  updated_at: "{현재 시각}"
  status: idle                    # active → idle
  lock:
    active: false                 # Lock 해제
    since: null
    expires: null
  auto_save:
    dirty: false                  # 저장 완료
```

### 4. 저장 완료 메시지

```markdown
🎩 Oscar: 세션이 저장되었습니다.

**세션**: {id}
**주제**: {topic}
**저장 시각**: {시각}

다음에 `/start {id}`로 이어서 작업할 수 있습니다.
```

---

## --close 옵션

세션을 저장하고 archive로 이동합니다.

### 추가 단계

1. **세션 파일 이동**:
   ```
   active/{id}.md → archive/{YYYY-MM}/{id}-{MMDD}.md
   ```

2. **index.yaml 갱신**:
   - `active` 배열에서 제거
   - `recent_closed` 배열 앞에 추가 (최대 5개 유지)

   ```yaml
   recent_closed:
     - id: "{세션 ID}"
       topic: "{주제}"
       archived_at: "{현재 시각}"
       path: "archive/{YYYY-MM}/{id}-{MMDD}.md"
   ```

3. **완료 메시지**:
   ```markdown
   🎩 Oscar: 세션이 종료되었습니다.

   **세션**: {id}
   **주제**: {topic}
   **archive 위치**: archive/{YYYY-MM}/{id}-{MMDD}.md

   복원하려면 `/start recent`를 사용하세요.
   ```

---

## --share 옵션

세션을 저장하고 산출물을 공유 디렉토리에 등록합니다.

### 사용법

```bash
/save --share "S52 Story 목록"
```

### 추가 단계

1. **공유 산출물 파일 생성**:
   ```
   shared/{MMDD}-{slug}.md
   ```

   파일 내용:
   ```markdown
   ---
   id: "{slug}"
   title: "{제목}"
   created_by: "{세션 ID}"
   created_at: "{현재 시각}"
   ---

   # {제목}

   > 생성 세션: {세션 ID}
   > 생성 시각: {현재 시각}

   ## 내용

   {사용자가 지정하거나 세션의 주요 산출물 요약}

   ---

   ## 원본 참조

   - 세션 파일: `active/{세션 ID}.md`
   - 관련 파일: (세션에서 생성/수정한 파일 목록)
   ```

2. **index.yaml 갱신**:
   ```yaml
   shared_outputs:
     - id: "{slug}"
       title: "{제목}"
       created_by: "{세션 ID}"
       created_at: "{현재 시각}"
       path: "shared/{MMDD}-{slug}.md"
   ```

3. **완료 메시지**:
   ```markdown
   🎩 Oscar: 세션이 저장되고 산출물이 공유되었습니다.

   **세션**: {id}
   **공유 산출물**: {제목}
   **위치**: shared/{MMDD}-{slug}.md

   다른 세션에서 이 산출물을 참조할 수 있습니다:
   `[[shared/{MMDD}-{slug}.md]]`
   ```

---

## 세션 일기 (Session Diary) 자동 생성

세션 저장 시 Oscar가 **세션 일기**를 자동으로 작성합니다.

### 세션 일기 구조

```markdown
## 📔 세션 일기

> 세션 ID: {id}
> 저장 시각: {timestamp}
> 참여 에이전트: 🎩 Oscar, 📈 Danny, ...

---

### 🎩 Oscar (Orchestrator)

**오늘의 핵심 (Highlights)**:
- {세션에서 가장 중요했던 결정/발견 1-3개}

**느낀 점 (Feelings)**:
- {협업 과정에서의 감정, 인상 깊었던 순간}
- {어려웠던 점, 보람 있었던 점}

**배운 것 (Learnings)**:
- {다음 세션에 적용할 인사이트}
- {개선할 점, 새로 알게 된 것}

**User Context 업데이트**:
- {PO의 선호도, 작업 스타일에 대한 새로운 발견}
- {기억해둘 맥락 정보}

---

### 📈 Danny (참여 시)

**분석 요약**: {수행한 분석의 핵심}
**데이터 인사이트**: {발견한 패턴, 수치}
**다음 분석 제안**: {후속 분석이 필요한 영역}

---

### 🎤 Rita (참여 시)

**VOC 핵심**: {수집한 고객 목소리 요약}
**고객 심리**: {파악한 고객 니즈/페인포인트}
**리서치 제안**: {더 깊이 알아볼 것}

---

### 🎯 Simon (참여 시)

**전략 결정**: {내린 전략적 결정}
**가설 상태**: {수립/검증된 가설}
**다음 전략 과제**: {후속 전략 작업}

---

### 📋 Penny (참여 시)

**실행 정리**: {정리한 태스크/스토리}
**핸드오프 상태**: {개발팀 전달 현황}
**일정 리스크**: {발견한 일정 이슈}

---

### 📊 Vicky (참여 시)

**검증 결과**: {Before/After 비교}
**Guard Rail 상태**: {부작용 지표 점검}
**다음 검증 계획**: {예정된 검증}

---

### 🔮 Sage (자문 시)

**자문 요약**: {제공한 전략적 조언}
**리스크 경고**: {지적한 위험 요소}
**권고 사항**: {Oscar에게 제안한 방향}
```

### 일기 작성 원칙

1. **솔직하게**: 잘된 것뿐 아니라 어려웠던 것도 기록
2. **구체적으로**: 추상적 표현보다 구체적 사례 중심
3. **미래 지향적으로**: 다음 세션에 도움될 인사이트 강조
4. **User Context 축적**: PO의 선호도/스타일 지속 학습

### 참여 에이전트 판별

Oscar가 세션 중 다음 기준으로 참여 에이전트를 판별:

| 기준 | 참여로 판정 |
|------|------------|
| Task tool로 스폰됨 | ✅ |
| `/strategy`, `/analytics` 등 직접 호출 | ✅ |
| 키워드 트리거로 자동 투입 | ✅ |
| Oscar가 역할 언급만 함 | ❌ |

---

## User Context 글로벌 병합 ⭐

세션 일기의 **User Context 업데이트** 항목이 있으면, `.context/user-context.yaml`에 병합합니다.

### 병합 로직

1. **세션 일기에서 User Context 항목 추출**
   ```markdown
   **User Context 업데이트**:
   - 윤재님은 자연어 프롬프트를 선호 ("커밋하고 푸시해" 스타일)
   - 형식보다 실제 동작 결과를 중시
   ```

2. **user-context.yaml 읽기**

3. **중복 체크 후 병합**
   - 이미 있는 내용은 스킵
   - 새로운 내용만 적절한 섹션에 추가

4. **메타데이터 갱신**
   ```yaml
   _meta:
     updated_at: "{현재 날짜}"
     sources:
       - "{이전 소스들}"
       - "{현재 세션 ID}"  # 추가
   ```

### 병합 대상 섹션

| 세션 일기 내용 | user-context.yaml 섹션 |
|--------------|----------------------|
| 커뮤니케이션 관련 | `communication:` |
| 작업 방식 관련 | `work_style:` |
| 선호도 관련 | `preferences:` |

### 병합 예시

**세션 일기:**
```markdown
**User Context 업데이트**:
- 병렬 세션으로 여러 작업을 동시 진행하는 워크플로우 사용
```

**병합 후 user-context.yaml:**
```yaml
work_style:
  - "WHY를 집요하게 추구하는 탐정 스타일"
  - "가설/검증 기반 의사결정"
  - "병렬 세션으로 여러 작업을 동시 진행"  # 추가됨

_meta:
  updated_at: "2026-01-28"
  sources:
    - "oscar-system-improvement"
    - "current-session-id"  # 추가됨
```

### 병합 완료 메시지

```markdown
🎩 Oscar: User Context가 업데이트되었습니다.

추가된 항목:
- work_style: "병렬 세션으로 여러 작업을 동시 진행"
```

---

## 저장 내용 자동 수집

Oscar가 세션 저장 시 자동으로 수집하는 정보:

### 현재 상태

```markdown
## 현재 상태

**진행 중**: {마지막 작업 중이던 것}
**마지막 작업**: {완료된 마지막 작업}
**다음 작업**: {예정된 다음 작업}
```

### 작업 히스토리

세션 중 수행한 작업을 시간순으로 기록:

```markdown
## 작업 히스토리

### {날짜}
- {작업 1}
- {작업 2}
- ...
```

### 산출물

세션 중 생성/수정한 파일:

```markdown
## 산출물

| 파일 | 변경 | 설명 |
|------|------|------|
| `path/to/file.md` | 생성 | 설명 |
| `path/to/other.md` | 수정 | 설명 |
```

---

## 컨텍스트 자동 업데이트

데이터 분석 결과 중 **영구 보존이 필요한 정보**가 있으면 자동 반영:

| 유형 | 대상 파일 | 예시 |
|------|----------|------|
| 지표 데이터 | `.context/.secrets.yaml` | AD_METRICS, METRICS 섹션 |
| 지표 문서화 | `.context/global/metrics.md` | 새로운 지표 섹션 추가 |
| 도메인 인사이트 | `.context/domains/{domain}/` | 분석 결과, 패턴 발견 |
| 전략 변경 | `.context/global/strategy.md` | 방향성 변경 시 |

**자동 업데이트 기준**:
- DB 분석으로 얻은 **정량적 지표** (숫자)
- 파티 모드 토론에서 **확정된 결정사항**
- 향후 세션에서 **재사용할 데이터**

**업데이트 하지 않는 것**:
- 일회성 탐색 쿼리 결과
- 아직 검증되지 않은 가설
- 사용자가 명시적으로 거부한 내용

---

## 에러 처리

### 활성 세션 없음

```markdown
⚠️ 저장할 활성 세션이 없습니다.
```

### 파일 쓰기 실패

```markdown
❌ 세션 저장 실패: {에러 메시지}
   수동으로 저장을 시도하거나, 세션 내용을 복사해두세요.
```

---

## 관련 커맨드

- `/start` - 세션 시작/복원
- `/sessions` - 전체 세션 현황

---

*파일 위치*:
- 세션 인덱스: `.context/sessions/index.yaml`
- 활성 세션: `.context/sessions/active/{id}.md`
- 종료 세션: `.context/sessions/archive/{YYYY-MM}/{id}-{MMDD}.md`
- 공유 산출물: `.context/sessions/shared/{date}-{title}.md`
