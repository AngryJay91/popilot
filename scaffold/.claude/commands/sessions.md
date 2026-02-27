# /sessions - 세션 대시보드

전체 세션 현황을 확인하거나 관리 작업을 수행합니다.

## 사용법

```bash
/sessions                 # 전체 세션 현황 대시보드
/sessions clean           # stale lock 정리, 오래된 archive 삭제
```

ARGUMENTS: $ARGUMENTS

---

## 실행 단계

### /sessions (대시보드)

`index.yaml`을 읽어 전체 세션 현황 표시:

```markdown
🎩 Oscar: 세션 현황입니다.

## 활성 세션 (2개)
┌────┬─────────────────┬────────┬───────────┬─────────────────────────────┐
│ #  │ ID              │ 상태   │ 마지막    │ 주제                         │
├────┼─────────────────┼────────┼───────────┼─────────────────────────────┤
│ 1  │ notion-tasks    │ 🟢 idle│ 10분 전   │ 스프린트 52 노션 태스크       │
│ 2  │ surface-cvr     │ 🔒 사용중│ 방금     │ Surface Layer CVR 최적화    │
└────┴─────────────────┴────────┴───────────┴─────────────────────────────┘

## 최근 종료 (3개)
┌────┬─────────────────┬───────────┬─────────────────────────────┐
│ #  │ ID              │ 종료일    │ 주제                         │
├────┼─────────────────┼───────────┼─────────────────────────────┤
│ 1  │ ir-prep         │ 01/25     │ IR 자료 준비                 │
│ 2  │ story-review    │ 01/24     │ 스토리 리뷰                  │
│ 3  │ deep-layer      │ 01/23     │ Deep Layer 개선              │
└────┴─────────────────┴───────────┴─────────────────────────────┘

## 공유 산출물 (1개)
┌────┬──────────────────────┬───────────┬─────────────────┐
│ #  │ 제목                  │ 생성일    │ 생성 세션        │
├────┼──────────────────────┼───────────┼─────────────────┤
│ 1  │ S52 Story 목록        │ 01/26     │ notion-tasks    │
└────┴──────────────────────┴───────────┴─────────────────┘

---

**커맨드**:
- `/start {id}` - 세션 시작/복원
- `/start new "{주제}"` - 새 세션 생성
- `/start recent` - 종료 세션 복원
- `/save` - 현재 세션 저장
- `/sessions clean` - 정리 작업
```

---

### /sessions clean

관리 작업 수행:

1. **Stale Lock 정리**: `lock.expires < now`인 세션들의 Lock 해제
2. **오래된 archive 삭제**: 30일 이상 지난 archive 파일 삭제 (선택적)
3. **orphan 파일 정리**: `index.yaml`에 없는 `active/` 파일 감지

```markdown
🎩 Oscar: 정리 작업을 수행합니다.

## Stale Lock 정리
- notion-tasks: Lock 해제 (만료: 2시간 전)

## 오래된 archive
- archive/2025-12/old-session-1225.md (32일 전)
  → 삭제하시겠습니까? [y/n]

## Orphan 파일
- active/unknown-session.md (index.yaml에 없음)
  → 삭제하시겠습니까? [y/n]

---

정리 완료.
```

---

## 상태 표시 규칙

### 세션 상태

| 상태 | 아이콘 | 조건 |
|------|--------|------|
| 사용 중 | 🔒 | `status: active` AND `lock.active: true` AND `lock.expires >= now` |
| idle | 🟢 | `status: idle` OR `lock.active: false` |
| stale | ⚠️ | `lock.active: true` AND `lock.expires < now` |

### 마지막 활동 시간

- 1분 미만: "방금"
- 1시간 미만: "N분 전"
- 24시간 미만: "N시간 전"
- 그 외: "MM/DD"

---

## 대시보드 정보 수집

### 활성 세션

`index.yaml`의 `active` 배열에서:
- id, topic, status, lock 상태
- `auto_save.last_turn`으로 마지막 활동 시간 계산

### 최근 종료

`index.yaml`의 `recent_closed` 배열에서:
- id, topic, archived_at
- 최대 5개 표시

### 공유 산출물

`index.yaml`의 `shared_outputs` 배열에서:
- title, created_at, created_by
- 전체 표시

---

## 관련 커맨드

- `/start` - 세션 시작/복원
- `/save` - 세션 저장

---

*파일 위치*:
- 세션 인덱스: `.context/sessions/index.yaml`
