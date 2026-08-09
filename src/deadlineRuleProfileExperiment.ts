import {
  recordDeadlineRuleProfileMetric,
} from './deadlineRuleProfileMetrics.ts'

type SavedRuleExperimentState = {
  savedSessionId: string
  savedTriggerFingerprint: string
  reuseCounted: boolean
}

type ExperimentState = Record<string, SavedRuleExperimentState>

const STORAGE_KEY = 'whenisdue:deadline-rule-profile-experiment'
const SALT_KEY = 'whenisdue:deadline-rule-profile-experiment-salt'
const SESSION_KEY = 'whenisdue:deadline-rule-profile-session'

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getSessionId() {
  if (typeof window === 'undefined') return 'server'

  const current = window.sessionStorage.getItem(SESSION_KEY)
  if (current) return current

  const created = randomId('session')
  window.sessionStorage.setItem(SESSION_KEY, created)
  return created
}

function getSalt() {
  if (typeof window === 'undefined') return 'server-salt'

  const current = window.localStorage.getItem(SALT_KEY)
  if (current) return current

  const created = randomId('salt')
  window.localStorage.setItem(SALT_KEY, created)
  return created
}

function fingerprint(value: string) {
  const input = `${getSalt()}|${value}`
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function readState(): ExperimentState {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    return parsed as ExperimentState
  } catch {
    return {}
  }
}

function writeState(state: ExperimentState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function markDeadlineSetupSaved(
  profileId: string,
  triggerDateKey: string,
) {
  const state = readState()

  state[profileId] = {
    savedSessionId: getSessionId(),
    savedTriggerFingerprint: fingerprint(triggerDateKey),
    reuseCounted: false,
  }

  writeState(state)
}

export function recordDeadlineSetupApplied(
  profileId: string,
  triggerDateKey: string,
) {
  recordDeadlineRuleProfileMetric('rule_applied')

  const state = readState()
  const profileState = state[profileId]

  if (!profileState || profileState.reuseCounted) return

  const isLaterSession =
    profileState.savedSessionId !== getSessionId()
  const isDifferentDate =
    profileState.savedTriggerFingerprint !== fingerprint(triggerDateKey)

  if (!isLaterSession || !isDifferentDate) return

  profileState.reuseCounted = true
  state[profileId] = profileState
  writeState(state)

  recordDeadlineRuleProfileMetric(
    'rule_reused_later_with_new_date',
  )
}

export function forgetDeadlineSetupExperiment(profileId: string) {
  const state = readState()
  if (!(profileId in state)) return

  delete state[profileId]
  writeState(state)
}
