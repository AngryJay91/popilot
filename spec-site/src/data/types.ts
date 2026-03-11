/**
 * Shared domain types for spec-site.
 *
 * These types are project-agnostic. Categories and severity levels
 * are strings to support any project's domain vocabulary.
 */

export type Severity = 'danger' | 'warning' | 'info' | 'good' | 'opportunity'

export type ImplStatus = 'done' | 'data-ready' | 'logic-needed' | 'new-data'

export interface Rule {
  id: string
  category: string
  name: string
  condition: string
  severity: string
  homeMessage: string
  action: string
  dataSource: string
  implStatus: string
  implNote?: string
  actionRoute?: string
}

export interface RuleGroup {
  category: string
  label: string
  icon: string
  ruleCount: number
  dataSource: string
  rules: Rule[]
}

export interface Scenario<T = Record<string, unknown>> {
  id: string
  label: string
  data: T
}

export interface SpecArea {
  id: string
  label: string
  shortLabel: string
  ruleCount: number
}

export interface VersionChange {
  date: string
  description: string
}

export interface PageVersion {
  page: string
  version: string
  lastUpdated: string
  sprint: string
  status: 'draft' | 'review' | 'approved' | 'dev'
  changelog: VersionChange[]
}
