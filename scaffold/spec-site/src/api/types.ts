/**
 * API response types for the spec-site backend contract.
 *
 * Any backend implementation (Turso+CF, Supabase, Lambda+RDS, etc.)
 * must conform to these response shapes.
 */

// ── Navigation ──

export interface NavApiResponse {
  sprints: SprintRow[]
  epics: EpicNavRow[]
}

export interface SprintRow {
  id: string
  label: string
  theme: string
  active: number
  start_date: string | null
  end_date: string | null
  sort_order: number
}

export interface EpicNavRow {
  sprint: string
  epic_id: string
  label: string
  badge: string | null
  category: string
  description: string | null
  sort_order: number
  uid: string | null
  origin_sprint: string | null
}

// ── Page Content ──

export interface PageContentApiResponse {
  rules: RuleRow[]
  scenarios: ScenarioRow[]
  areas: SpecAreaRow[]
  versions: VersionRow[]
  meta: WireframeMetaRow[]
}

export interface RuleRow {
  id: string
  page_id: string
  rule_group: string
  category: string
  name: string
  condition: string
  severity: string
  home_message: string
  action: string
  data_source: string
  impl_status: string
  impl_note: string | null
  action_route: string | null
  sort_order: number
}

export interface ScenarioRow {
  scenario_id: string
  label: string
  data_json: string
  is_default: number
  sort_order: number
}

export interface SpecAreaRow {
  area_id: string
  label: string
  short_label: string
  rule_count: number
  sort_order: number
}

export interface VersionRow {
  page_id: string
  version: string
  last_updated: string
  sprint: string
  status: string
  changelog: string
}

export interface WireframeMetaRow {
  default_scenario_id: string
  spec_title: string
  route_title: string
}

// ── PM (Project Management) ──

export interface PmDataApiResponse {
  stories: PmStoryRow[]
  tasks: PmTaskRow[]
}

export interface PmEpicRow {
  id: number
  title: string
  description: string | null
  status: string
  owner: string | null
  created_at: string
  updated_at: string
}

export interface PmStoryRow {
  id: number
  epic_id: number | null
  sprint: string
  epic_uid: string
  title: string
  description: string | null
  acceptance_criteria: string | null
  assignee: string | null
  status: string
  priority: string
  area: string
  story_points: number | null
  start_date: string | null
  due_date: string | null
  figma_url: string | null
  related_prs: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PmTaskRow {
  id: number
  story_id: number
  title: string
  assignee: string | null
  status: string
  description: string | null
  story_points: number | null
  due_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ── Auth ──

export interface AuthVerifyResponse {
  userName: string
}

// ── Retro ──

export interface RetroSessionRow {
  id: number
  sprint: string
  title: string | null
  phase: string
  created_at: string
  updated_at: string
}

export interface RetroItemRow {
  id: number
  session_id: number
  category: string
  content: string
  author: string
  created_at: string
  voteCount: number
  hasVoted: number
}

export interface RetroActionRow {
  id: number
  session_id: number
  content: string
  assignee: string | null
  status: string
  created_at: string
}
