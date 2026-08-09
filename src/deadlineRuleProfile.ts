import {
  type DeadlineDirection,
  type DeadlineUnit,
  type EndDayAdjustment,
  type StartDayConvention,
} from './deadlineRules.ts'
import {
  type DeadlineTriggerKind,
} from './deadlineTrigger.ts'
import {
  type HolidayCalendarId,
} from './holidayCalendars.ts'

export type DeadlineWorkingScheduleId = 'standard_mon_fri'

export type DeadlineRuleProfile = {
  id: string
  name: string
  triggerKind: DeadlineTriggerKind | null
  duration: number
  direction: DeadlineDirection
  unit: DeadlineUnit
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
  workingScheduleId: DeadlineWorkingScheduleId
  schemaVersion: 2
  ruleVersion: 'deadline-rule-profile-v1'
}

export type DeadlineRuleProfileInput = Omit<
  DeadlineRuleProfile,
  'id' | 'workingScheduleId' | 'schemaVersion' | 'ruleVersion'
> & {
  id?: string
  workingScheduleId?: DeadlineWorkingScheduleId
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function createProfileId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `deadline-profile-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function createDeadlineRuleProfile(
  input: DeadlineRuleProfileInput,
): DeadlineRuleProfile {
  const name = normalizeName(input.name)

  if (!name) {
    throw new Error('Deadline rule profile name is required.')
  }

  if (!Number.isInteger(input.duration) || input.duration < 0) {
    throw new Error(
      'Deadline rule profile duration must be a non-negative integer.',
    )
  }

  return {
    id: input.id?.trim() || createProfileId(),
    name,
    triggerKind: input.triggerKind,
    duration: input.duration,
    direction: input.direction,
    unit: input.unit,
    startDayConvention: input.startDayConvention,
    holidayCalendar: input.holidayCalendar,
    endDayAdjustment: input.endDayAdjustment,
    workingScheduleId: input.workingScheduleId ?? 'standard_mon_fri',
    schemaVersion: 2,
    ruleVersion: 'deadline-rule-profile-v1',
  }
}

export function summarizeDeadlineRuleProfile(
  profile: DeadlineRuleProfile,
) {
  return {
    id: profile.id,
    name: profile.name,
    triggerKind: profile.triggerKind,
    duration: profile.duration,
    direction: profile.direction,
    unit: profile.unit,
    startDayConvention: profile.startDayConvention,
    holidayCalendar: profile.holidayCalendar,
    endDayAdjustment: profile.endDayAdjustment,
    workingScheduleId: profile.workingScheduleId,
    schemaVersion: profile.schemaVersion,
    ruleVersion: profile.ruleVersion,
  }
}

export function describeDeadlineRuleProfile(
  profile: DeadlineRuleProfile,
) {
  const unitLabel =
    profile.unit === 'business-days'
      ? profile.duration === 1
        ? 'business day'
        : 'business days'
      : profile.duration === 1
        ? 'calendar day'
        : 'calendar days'

  const triggerLabel = profile.triggerKind
    ? profile.triggerKind
    : 'start date'

  return `${profile.duration} ${unitLabel} ${profile.direction} ${triggerLabel}`
}
