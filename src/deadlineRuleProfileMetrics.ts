export type DeadlineRuleProfileMetric =
  | 'rule_saved'
  | 'rule_save_deduped'
  | 'rule_applied'
  | 'rule_deleted'

export type DeadlineRuleProfileMetrics = {
  rule_saved: number
  rule_save_deduped: number
  rule_applied: number
  rule_deleted: number
  updatedAt: string | null
  metricsVersion: 'deadline-rule-profile-metrics-v1'
}

const STORAGE_KEY = 'whenisdue:deadline-rule-profile-metrics'

function emptyMetrics(): DeadlineRuleProfileMetrics {
  return {
    rule_saved: 0,
    rule_save_deduped: 0,
    rule_applied: 0,
    rule_deleted: 0,
    updatedAt: null,
    metricsVersion: 'deadline-rule-profile-metrics-v1',
  }
}

function isMetrics(value: unknown): value is DeadlineRuleProfileMetrics {
  if (!value || typeof value !== 'object') return false

  const metrics = value as Partial<DeadlineRuleProfileMetrics>

  return (
    Number.isInteger(metrics.rule_saved) &&
    Number.isInteger(metrics.rule_save_deduped) &&
    Number.isInteger(metrics.rule_applied) &&
    Number.isInteger(metrics.rule_deleted) &&
    (metrics.updatedAt === null || typeof metrics.updatedAt === 'string') &&
    metrics.metricsVersion === 'deadline-rule-profile-metrics-v1'
  )
}

export function getDeadlineRuleProfileMetrics(): DeadlineRuleProfileMetrics {
  if (typeof window === 'undefined') return emptyMetrics()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyMetrics()

    const parsed: unknown = JSON.parse(raw)
    return isMetrics(parsed) ? parsed : emptyMetrics()
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
