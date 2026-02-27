# /metrics - 지표 확인 및 업데이트

비즈니스 지표를 확인하고 필요시 업데이트합니다.

## 사용법

```bash
/metrics              # 현재 지표 요약 표시
/metrics update       # 전체 지표 파일 업데이트
/metrics update ads   # 광고 지표만 업데이트
```

ARGUMENTS: $ARGUMENTS

---

## 실행 단계

### 1. 지표 파일 로드

`.context/metrics/` 폴더의 YAML 파일들을 읽습니다:
- `business.yaml` - 핵심 KPI, 퍼널, 목표
- `ads.yaml` - 광고 분석 지표
- `segments.yaml` - 세그먼트별 지표
- `team.yaml` - 팀/담당자 정보

### 2. 인자에 따른 분기

#### Case A: `/metrics` (인자 없음)

현재 지표 요약 표시:

```markdown
📈 **비즈니스 지표 현황** (업데이트: 2026-01-26)

## 핵심 KPI
| 지표 | 값 | 목표 대비 |
|------|-----|----------|
| 유료 사용자 | 81명 | 54% (목표 150명) |
| MRR | ₩5,163,480 | - |
| ARPU | ₩63,747 | - |
| 월간 이탈률 | 12% | ⚠️ 목표 10% 초과 |

## 퍼널 (2025년 누적)
가입 3,645 → 연동 476 (13%) → 유료 132 (3.6%)

## 광고 분석 (2026-01-19)
- 순이익 달성률: 89%
- 평균 ROAS: 481%
- 활성 셀러: 64명

📊 대시보드: https://sellerking-sprint-planner.vercel.app/dashboard
```

#### Case B: `/metrics update`

전체 지표 업데이트:

1. **business.yaml**:
   - MCP `prod-db`에서 유료 사용자, MRR 조회
   - 날짜별 집계 쿼리 실행

2. **ads.yaml**:
   - MCP `prod-db`의 광고 관련 테이블 조회
   - ROAS, 순이익률 계산

3. **segments.yaml**:
   - 세그먼트별 리텐션, 전환율 계산

4. 각 파일의 `_meta.updated_at` 갱신

5. 변경 사항 요약 출력

#### Case C: `/metrics update ads`

광고 지표만 업데이트:

1. `ads.yaml`만 갱신
2. 변경 전/후 비교 표시

---

## 지표 파일 구조

```
.context/metrics/
├── README.md         # 구조 설명
├── business.yaml     # MRR, ARPU, 퍼널, 목표
├── ads.yaml          # 광고 분석 지표
├── segments.yaml     # 세그먼트별 지표
└── team.yaml         # 팀/담당자 정보
```

---

## 데이터 소스

| 지표 | 소스 | 쿼리 주의사항 |
|------|------|--------------|
| MRR/ARPU | prod-db | Settlement 테이블 주의 (무거움) |
| 퍼널 | GA4 MCP | - |
| 광고 지표 | prod-db | snapshot 테이블 권장 |
| 세그먼트 | prod-db | 인덱스 컬럼 필수 |

---

## VitePress 대시보드 연동

지표 업데이트 후:
1. `npm run build` (VitePress 빌드)
2. `git push` (Vercel 자동 배포)
3. 대시보드 반영: https://sellerking-sprint-planner.vercel.app/dashboard

---

## 관련 커맨드

- `/analytics` - 📈 Danny 활성화 (심층 분석)
- `/validate` - 📊 Vicky 활성화 (가설 검증)

---

*파일 위치*: `.context/metrics/`
*대시보드*: `/dashboard`
