import {
  type DeadlineRuleProfile,
  createDeadlineRuleProfile,
} from './deadlineRuleProfile.ts'

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

function isDeadlineRuleProfile(value: unknown): value is DeadlineRuleProfile {
  if (!value || typeof value !== 'object') return false

  const profile = value as Partial<DeadlineRuleProfile>

  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    (profile.triggerKind === null ||
      profile.triggerKind === 'issued' ||
      profile.triggerKind === 'sent' ||
      profile.triggerKind === 'received' ||
      profile.triggerKind === 'delivered' ||
      profile.triggerKind === 'accepted' ||
      profile.triggerKind === 'filed' ||
      profile.triggerKind === 'served') &&
    Number.isInteger(profile.duration) &&
    (profile.direction === 'after' || profile.direction === 'before') &&
    (profile.unit === 'calendar-days' || profile.unit === 'business-days') &&
    (profile.startDayConvention === 'exclude-trigger' ||
      profile.startDayConvention === 'include-if-qualifying') &&
    (profile.holidayCalendar === 'none' ||
      profile.holidayCalendar === 'us' ||
      profile.holidayCalendar === 'uk' ||
      profile.holidayCalendar === 'ca' ||
      profile.holidayCalendar === 'au' ||
      profile.holidayCalendar === 'ph') &&
    (profile.endDayAdjustment === 'none' ||
      profile.endDayAdjustment === 'next-business-day' ||
      profile.endDayAdjustment === 'previous-business-day') &&
    profile.ruleVersion === 'deadline-rule-profile-v1'
  )
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

  return raw.filter(isDeadlineRuleProfile).slice(0, MAX_PROFILES)
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
      item.endDayAdjustment === profile.endDayAdjustment,
  )

  if (duplicateIndex >= 0) {
    return current[duplicateIndex]
  }

  writeProfiles([profile, ...current])
  return profile
}

export function deleteDeadlineRuleProfile(id: string) {
  const current = getDeadlineRuleProfiles()
  writeProfiles(current.filter((profile) => profile.id !== id))
}

export function clearDeadlineRuleProfiles() {
  writeProfiles([])
}

export function getDeadlineRuleProfileStorageKey() {
  return STORAGE_KEY
}

export function getDeadlineRuleProfileChangeEvent() {
  return CHANGE_EVENT
}
