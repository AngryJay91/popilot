-- Spec-site content schema — rules, scenarios, areas, versions, wireframe meta

-- 1. Rules (flat, individually queryable)
CREATE TABLE IF NOT EXISTS spec_rules (
  id           TEXT NOT NULL,
  page_id      TEXT NOT NULL,
  rule_group   TEXT NOT NULL,
  category     TEXT NOT NULL,
  name         TEXT NOT NULL,
  condition    TEXT NOT NULL,
  severity     TEXT NOT NULL,
  home_message TEXT NOT NULL DEFAULT '',
  action       TEXT NOT NULL DEFAULT '',
  data_source  TEXT NOT NULL DEFAULT '',
  impl_status  TEXT NOT NULL DEFAULT 'logic-needed',
  impl_note    TEXT,
  action_route TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_id, id)
);
CREATE INDEX IF NOT EXISTS idx_spec_rules_page ON spec_rules(page_id);

-- 2. Scenarios
CREATE TABLE IF NOT EXISTS spec_scenarios (
  page_id      TEXT NOT NULL,
  scenario_id  TEXT NOT NULL,
  label        TEXT NOT NULL,
  data_json    TEXT NOT NULL,
  is_default   INTEGER DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_id, scenario_id)
);

-- 3. Spec areas
CREATE TABLE IF NOT EXISTS spec_areas (
  page_id     TEXT NOT NULL,
  area_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  short_label TEXT NOT NULL,
  rule_count  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, area_id)
);

-- 4. Page versions
CREATE TABLE IF NOT EXISTS spec_versions (
  page_id      TEXT PRIMARY KEY,
  version      TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  sprint       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  changelog    TEXT NOT NULL DEFAULT '[]',
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Wireframe metadata
CREATE TABLE IF NOT EXISTS spec_wireframe_meta (
  page_id             TEXT NOT NULL,
  sprint              TEXT NOT NULL,
  default_scenario_id TEXT NOT NULL,
  spec_title          TEXT NOT NULL,
  route_title         TEXT NOT NULL,
  PRIMARY KEY (page_id, sprint)
);
