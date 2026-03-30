-- Migration 006: Schema fixes for P0 blockers
-- 2026-03-31

-- ──────────────────────────────────────────────
-- Fix 1: nav_sprints label 컬럼 추가
-- 문제: schema-core.sql에 'title' 컬럼이 있지만
--       v2-nav.ts, v2-kickoff.ts는 'label' 컬럼으로 INSERT/SELECT
-- 전략: 'label' 컬럼 추가 후 기존 'title' 데이터 복사 (데이터 보존)
-- ──────────────────────────────────────────────
ALTER TABLE nav_sprints ADD COLUMN label TEXT;
UPDATE nav_sprints SET label = title WHERE label IS NULL;

-- ──────────────────────────────────────────────
-- Fix 2: members 테이블에 email 컬럼 추가
-- 문제: v2-admin.ts가 members.email을 SELECT/PATCH하지만 컬럼 없음
-- ──────────────────────────────────────────────
ALTER TABLE members ADD COLUMN email TEXT;

-- ──────────────────────────────────────────────
-- Fix 3: meetings 테이블 컬럼 추가
-- 문제: schema-meetings.sql은 meeting_date, attendees, notes
--       v2-meetings.ts는 date, participants, summary, raw_transcript, decisions 사용
-- 전략: 라우트가 사용하는 컬럼들을 테이블에 추가 (기존 컬럼 유지)
-- ──────────────────────────────────────────────
ALTER TABLE meetings ADD COLUMN date TEXT;
ALTER TABLE meetings ADD COLUMN participants TEXT;
ALTER TABLE meetings ADD COLUMN summary TEXT;
ALTER TABLE meetings ADD COLUMN raw_transcript TEXT;
ALTER TABLE meetings ADD COLUMN decisions TEXT;

-- 기존 데이터 마이그레이션 (meeting_date → date, attendees → participants, notes → summary)
UPDATE meetings SET
  date = meeting_date,
  participants = attendees,
  summary = notes
WHERE date IS NULL;

-- ──────────────────────────────────────────────
-- Fix 4: policy_documents 테이블 생성
-- 문제: v2-policy.ts가 사용하지만 SQL 파일 어디에도 없음
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT NOT NULL,
  epic_id TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(sprint, epic_id)
);

-- ──────────────────────────────────────────────
-- Fix 5: scenario_data 테이블 생성
-- 문제: v2-scenarios.ts가 사용하지만 SQL 파일 어디에도 없음
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenario_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  label TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  author TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(page_id, sprint, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_data_page_sprint
  ON scenario_data(page_id, sprint);
