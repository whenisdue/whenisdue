import {
  type DeadlineRuleProfile,
  createDeadlineRuleProfile,
} from './deadlineRuleProfile.ts'
import {
  forgetDeadlineSetupExperiment,
} from './deadlineRuleProfileExperiment.ts'
import {
  recordDeadlineRuleProfileMetric,
} from './deadlineRuleProfileMetrics.ts'

const STORAGE_KEY = 'whenisdue:deadline-rule-profiles'
const CHANGE_EVENT = 'whenisdue:deadline-rule-profiles-changed'
const MAX_PROFILES = 50

function readRawProfiles(): unknown {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function normalizeStoredProfile(
  value: unknown,
): DeadlineRuleProfile | null {
  if (!value || typeof value !== 'object') return null

  const profile = value as Partial<DeadlineRuleProfile>

  if (
    typeof profile.id !== 'string' ||
    typeof profile.name !== 'string' ||
    !Number.isInteger(profile.duration) ||
    (profile.triggerKind !== null &&
      profile.triggerKind !== 'issued' &&
      profile.triggerKind !== 'sent' &&
      profile.triggerKind !== 'received' &&
      profile.triggerKind !== 'delivered' &&
      profile.triggerKind !== 'accepted' &&
      profile.triggerKind !== 'filed' &&
      profile.triggerKind !== 'served') ||
    (profile.direction !== 'after' && profile.direction !== 'before') ||
    (profile.unit !== 'calendar-days' &&
      profile.unit !== 'business-days') ||
    (profile.startDayConvention !== 'exclude-trigger' &&
      profile.startDayConvention !== 'include-if-qualifying') ||
    (profile.holidayCalendar !== 'none' &&
      profile.holidayCalendar !== 'us' &&
      profile.holidayCalendar !== 'uk' &&
      profile.holidayCalendar !== 'ca' &&
      profile.holidayCalendar !== 'au' &&
      profile.holidayCalendar !== 'ph') ||
    (profile.endDayAdjustment !== 'none' &&
      profile.endDayAdjustment !== 'next-business-day' &&
      profile.endDayAdjustment !== 'previous-business-day')
  ) {
    return null
  }

  return createDeadlineRuleProfile({
    id: profile.id,
    name: profile.name,
    triggerKind: profile.triggerKind,
    duration: profile.duration as number,
    direction: profile.direction,
    unit: profile.unit,
    startDayConvention: profile.startDayConvention,
    holidayCalendar: profile.holidayCalendar,
    endDayAdjustment: profile.endDayAdjustment,
    workingScheduleId: 'standard_mon_fri',
  })
}

function writeProfiles(profiles: DeadlineRuleProfile[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(profiles.slice(0, MAX_PROFILES)),
  )
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getDeadlineRuleProfiles(): DeadlineRuleProfile[] {
  const raw = readRawProfiles()
  if (!Array.isArray(raw)) return []

  return raw
    .map(normalizeStoredProfile)
    .filter(
      (profile): profile is DeadlineRuleProfile => profile !== null,
    )
    .slice(0, MAX_PROFILES)
}

export function saveDeadlineRuleProfile(
  input: Parameters<typeof createDeadlineRuleProfile>[0],
): DeadlineRuleProfile {
  const profile = createDeadlineRuleProfile(input)
  const current = getDeadlineRuleProfiles()

  const duplicateIndex = current.findIndex(
    (item) =>
      item.name.toLowerCase() === profile.name.toLowerCase() &&
      item.triggerKind === profile.triggerKind &&
      item.duration === profile.duration &&
      item.direction === profile.direction &&
      item.unit === profile.unit &&
      item.startDayConvention === profile.startDayConvention &&
      item.holidayCalendar === profile.holidayCalendar &&
      item.endDayAdjustment === profile.endDayAdjustment &&
      item.workingScheduleId === profile.workingScheduleId,
  )

  if (duplicateIndex >= 0) {
    recordDeadlineRuleProfileMetric('rule_save_deduped')
    return current[duplicateIndex]
  }

  writeProfiles([profile, ...current])
  recordDeadlineRuleProfileMetric('rule_saved')
  return profile
}

export function deleteDeadlineRuleProfile(id: string) {
  const current = getDeadlineRuleProfiles()
  const next = current.filter((profile) => profile.id !== id)

  if (next.length === current.length) return

  writeProfiles(next)
  forgetDeadlineSetupExperiment(id)
  recordDeadlineRuleProfileMetric('rule_deleted')
}

export function clearDeadlineRuleProfiles() {
  const current = getDeadlineRuleProfiles()

  for (const profile of current) {
    forgetDeadlineSetupExperiment(profile.id)
  }

  writeProfiles([])
}

export function getDeadlineRuleProfileStorageKey() {
  return STORAGE_KEY
}

export function getDeadlineRuleProfileChangeEvent() {
  return CHANGE_EVENT
}
