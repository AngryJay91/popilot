export type Severity = 'danger' | 'warning' | 'info' | 'good' | 'opportunity'

export type ImplStatus = 'done' | 'data-ready' | 'logic-needed' | 'new-data'

export type RuleCategory =
  | 'AD' | 'PROD' | 'REV' | 'SET' | 'MALL'
  | 'TAC' | 'SETUP' | 'OPP' | 'KW' | 'ACT'

export interface Rule {
  id: string
  category: RuleCategory
  name: string
  condition: string
  severity: Severity
  homeMessage: string
  action: string
  dataSource: string
  implStatus: ImplStatus
  implNote?: string
}

export interface RuleGroup {
  category: RuleCategory
  label: string
  icon: string
  ruleCount: number
  dataSource: string
  rules: Rule[]
}

export interface ScenarioMockData {
  greeting: string
  healthStatus: 'good' | 'caution' | 'critical'
  healthLabel: string
  summary: {
    revenue: string
    revenueDelta: string
    revenueDeltaDir: 'up' | 'down' | 'flat'
    netProfit: string
    netProfitDelta: string
    netProfitDeltaDir: 'up' | 'down' | 'flat'
    marginRate: string
    marginRateDelta: string
    marginRateDeltaDir: 'up' | 'down' | 'flat'
    adCost: string
    adCostDelta: string
    adCostDeltaDir: 'up' | 'down' | 'flat'
  }
  coachingCards: CoachingCardData[]
  showMallSection: boolean
  showAdsSection: boolean
  showGrowthCard: boolean
  showCoupangCta: boolean
}

export interface CoachingCardData {
  severity: 'red' | 'yellow' | 'green'
  severityLabel: string
  title: string
  action: string
  effect: string
  buttons: { label: string; variant: 'primary' | 'outline' }[]
}

export interface Scenario<T = ScenarioMockData> {
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
