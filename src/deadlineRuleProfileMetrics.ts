export type DeadlineRuleProfileMetric =
  | 'eligible_calculation_completed'
  | 'rule_saved'
  | 'rule_save_deduped'
  | 'rule_applied'
  | 'rule_reused_later_with_new_date'
  | 'rule_deleted'

export type DeadlineRuleProfileMetrics = {
  eligible_calculation_completed: number
  rule_saved: number
  rule_save_deduped: number
  rule_applied: number
  rule_reused_later_with_new_date: number
  rule_deleted: number
  updatedAt: string | null
  metricsVersion: 'deadline-rule-profile-metrics-v2'
}

const STORAGE_KEY = 'whenisdue:deadline-rule-profile-metrics'

function emptyMetrics(): DeadlineRuleProfileMetrics {
  return {
    eligible_calculation_completed: 0,
    rule_saved: 0,
    rule_save_deduped: 0,
    rule_applied: 0,
    rule_reused_later_with_new_date: 0,
    rule_deleted: 0,
    updatedAt: null,
    metricsVersion: 'deadline-rule-profile-metrics-v2',
  }
}

function readLegacyMetric(
  value: Record<string, unknown>,
  key: DeadlineRuleProfileMetric,
) {
  const candidate = value[key]
  return Number.isInteger(candidate) ? Number(candidate) : 0
}

export function getDeadlineRuleProfileMetrics(): DeadlineRuleProfileMetrics {
  if (typeof window === 'undefined') return emptyMetrics()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyMetrics()

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyMetrics()

    const value = parsed as Record<string, unknown>

    return {
      eligible_calculation_completed: readLegacyMetric(
        value,
        'eligible_calculation_completed',
      ),
      rule_saved: readLegacyMetric(value, 'rule_saved'),
      rule_save_deduped: readLegacyMetric(value, 'rule_save_deduped'),
      rule_applied: readLegacyMetric(value, 'rule_applied'),
      rule_reused_later_with_new_date: readLegacyMetric(
        value,
        'rule_reused_later_with_new_date',
      ),
      rule_deleted: readLegacyMetric(value, 'rule_deleted'),
      updatedAt:
        typeof value.updatedAt === 'string' ? value.updatedAt : null,
      metricsVersion: 'deadline-rule-profile-metrics-v2',
    }
  } catch {
    return emptyMetrics()
  }
}

export function recordDeadlineRuleProfileMetric(
  metric: DeadlineRuleProfileMetric,
): DeadlineRuleProfileMetrics {
  const current = getDeadlineRuleProfileMetrics()

  const next: DeadlineRuleProfileMetrics = {
    ...current,
    [metric]: current[metric] + 1,
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return next
}

export function clearDeadlineRuleProfileMetrics() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function getDeadlineRuleProfileMetricsStorageKey() {
  return STORAGE_KEY
}
