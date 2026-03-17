/**
 * Industry presets — maps industry type to template variables
 * used in agent .hbs persona generation.
 *
 * Each preset provides 21 project.* variables that agent templates
 * reference via {{project.example_entity}}, {{project.key_metrics}}, etc.
 */

const PRESETS = {
  saas: {
    industry_label: 'SaaS',
    domain_expertise: 'SaaS product management, subscription lifecycle, activation & retention optimization',
    key_metrics: 'MRR, Churn Rate, LTV, CAC, Trial-to-Paid Conversion',
    example_entity: 'subscription plan',
    example_entity_plural: 'subscription plans',
    example_status_feature: 'plan health indicator',
    example_status_states: '🟢 active, 🟡 at-risk, 🔴 churning',
    example_metric_name: 'Trial-to-Paid Conversion Rate',
    example_metric_before: '12%',
    example_metric_target: '20%',
    example_persona_primary: 'trial users in first 14 days',
    example_icp: 'new SMB teams (5-20 seats)',
    example_icp_ko: '신규 SMB 팀(5-20석)',
    example_api_endpoint: '/api/subscriptions/{id}',
    example_event_name: 'plan_status_viewed',
    example_chart_name: 'MRR trend chart',
    example_data_path: 'domains/subscriptions/database.md',
    example_empty_state_msg: '구독 플랜을 등록해보세요',
    example_few_shot_problem: 'Users discover plan issues 72h late',
    example_few_shot_question: 'If we provide plan health indicators, will users take preventive action?',
    example_action: 'upgrade to premium',
  },

  ecommerce: {
    industry_label: 'E-commerce',
    domain_expertise: 'E-commerce operations, product catalog management, order fulfillment & conversion optimization',
    key_metrics: 'GMV, Conversion Rate, AOV, Cart Abandonment Rate, Repeat Purchase Rate',
    example_entity: 'product listing',
    example_entity_plural: 'product listings',
    example_status_feature: 'listing performance indicator',
    example_status_states: '🟢 top-seller, 🟡 underperforming, 🔴 stale',
    example_metric_name: 'Cart-to-Purchase Conversion Rate',
    example_metric_before: '18%',
    example_metric_target: '28%',
    example_persona_primary: 'first-time buyers within 7 days of signup',
    example_icp: 'online shoppers aged 25-40 in metro areas',
    example_icp_ko: '수도권 25-40세 온라인 쇼핑 고객',
    example_api_endpoint: '/api/products/{id}',
    example_event_name: 'product_detail_viewed',
    example_chart_name: 'GMV trend chart',
    example_data_path: 'domains/products/database.md',
    example_empty_state_msg: '첫 번째 상품을 등록해보세요',
    example_few_shot_problem: 'Sellers discover underperforming listings too late',
    example_few_shot_question: 'If we show listing performance indicators, will sellers optimize faster?',
    example_action: 'add to cart',
  },

  b2b_platform: {
    industry_label: 'B2B Platform',
    domain_expertise: 'B2B platform management, client onboarding, workflow automation & enterprise sales cycle',
    key_metrics: 'ARR, Net Revenue Retention, Onboarding Completion Rate, Feature Adoption, Expansion Revenue',
    example_entity: 'client workspace',
    example_entity_plural: 'client workspaces',
    example_status_feature: 'workspace health score',
    example_status_states: '🟢 healthy, 🟡 needs-attention, 🔴 at-risk',
    example_metric_name: 'Onboarding Completion Rate',
    example_metric_before: '55%',
    example_metric_target: '80%',
    example_persona_primary: 'new enterprise clients in first 30 days',
    example_icp: 'mid-market companies (50-500 employees)',
    example_icp_ko: '중견기업(50-500명 규모)',
    example_api_endpoint: '/api/workspaces/{id}',
    example_event_name: 'workspace_setup_completed',
    example_chart_name: 'ARR trend chart',
    example_data_path: 'domains/workspaces/database.md',
    example_empty_state_msg: '워크스페이스를 설정해보세요',
    example_few_shot_problem: 'Clients get stuck during onboarding and churn before activation',
    example_few_shot_question: 'If we provide guided onboarding with health scores, will completion rate improve?',
    example_action: 'complete onboarding',
  },

  generic: {
    industry_label: 'Digital Product',
    domain_expertise: 'Product management, user experience optimization, growth and retention strategy',
    key_metrics: 'DAU, Retention Rate, Activation Rate, NPS, Feature Adoption Rate',
    example_entity: 'feature module',
    example_entity_plural: 'feature modules',
    example_status_feature: 'usage health indicator',
    example_status_states: '🟢 active, 🟡 declining, 🔴 inactive',
    example_metric_name: 'Feature Activation Rate',
    example_metric_before: '25%',
    example_metric_target: '45%',
    example_persona_primary: 'new users in first 7 days',
    example_icp: 'early adopters who complete onboarding',
    example_icp_ko: '온보딩을 완료한 얼리어답터',
    example_api_endpoint: '/api/resources/{id}',
    example_event_name: 'feature_activated',
    example_chart_name: 'DAU trend chart',
    example_data_path: 'domains/core/database.md',
    example_empty_state_msg: '첫 번째 항목을 만들어보세요',
    example_few_shot_problem: 'Users sign up but never reach the activation moment',
    example_few_shot_question: 'If we redesign the first-run experience, will activation rate improve?',
    example_action: 'complete first task',
  },
};

/** All required keys every preset must have */
export const REQUIRED_KEYS = Object.keys(PRESETS.saas);

/** List available industry IDs */
export function listIndustries() {
  return Object.keys(PRESETS);
}

/**
 * Get a preset by industry ID.
 * @param {string} industry
 * @returns {Record<string, string>|null}
 */
export function getPreset(industry) {
  return PRESETS[industry] || null;
}

/**
 * Get a preset and allow overrides for specific fields.
 * @param {string} industry
 * @param {Record<string, string>} [overrides]
 * @returns {Record<string, string>}
 */
export function getPresetWithOverrides(industry, overrides = {}) {
  const base = PRESETS[industry] || PRESETS.generic;
  return { ...base, ...overrides };
}

export default PRESETS;
