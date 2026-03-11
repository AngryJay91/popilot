# PoC Scope

## Problem
팀에서 누가 무슨 일을 하고 있는지 한눈에 파악하기 어렵고, 태스크 상태 추적이 구두나 메신저에 흩어져 있다.

## Target User
5~15명 규모 스타트업 팀의 PM 또는 팀 리드

## Core Features
1. **칸반 보드** — Todo / In Progress / Done 3컬럼 드래그앤드롭 보드. 카드에는 제목, 담당자, 우선순위 뱃지 표시.
2. **태스크 생성/편집** — 모달 폼으로 태스크 생성. 제목, 설명, 담당자 선택, 우선순위(low/medium/high/critical) 지정.
3. **필터 & 요약** — 담당자별 필터링 + 상단에 컬럼별 태스크 수 요약 카운터.

## Mock Data Strategy
localStorage 기반. 키: `poc-taskboard`. 초기 진입 시 5개의 샘플 태스크 자동 생성.

## Out of Scope
- 실시간 멀티유저 동기화 (싱글유저 로컬 전용)
- 백엔드 API 연동
- 스프린트/에픽 계층 구조
- 파일 첨부, 코멘트
