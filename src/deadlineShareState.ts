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
import {
  type WorkingScheduleId,
} from './workingSchedules.ts'

export type DeadlineShareState = {
  date: string
  duration: number
  direction: DeadlineDirection
  unit: DeadlineUnit
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
  triggerKind: DeadlineTriggerKind | null
  workingScheduleId: WorkingScheduleId
  shareStateVersion: 1
}

const allowedHolidayCalendars: HolidayCalendarId[] = [
  'none',
  'us',
  'uk',
  'ca',
  'au',
  'ph',
]

function isHolidayCalendarId(
  value: string | null,
): value is HolidayCalendarId {
  return !!value && allowedHolidayCalendars.includes(
    value as HolidayCalendarId,
  )
}

function isTriggerKind(
  value: string | null,
): value is DeadlineTriggerKind {
  return (
    value === 'issued' ||
    value === 'sent' ||
    value === 'received' ||
    value === 'delivered' ||
    value === 'accepted' ||
    value === 'filed' ||
    value === 'served'
  )
}

function isPlainDateKey(value: string | null) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function serializeDeadlineShareState(
  state: Omit<DeadlineShareState, 'shareStateVersion'>,
) {
  const params = new URLSearchParams()

  params.set('sv', '1')
  params.set('date', state.date)
  params.set('days', String(state.duration))
  params.set('direction', state.direction)
  params.set('unit', state.unit)
  params.set('startday', state.startDayConvention)
  params.set('calendar', state.holidayCalendar)
  params.set('endrule', state.endDayAdjustment)
  params.set('schedule', state.workingScheduleId)

  if (state.triggerKind) {
    params.set('trigger', state.triggerKind)
  }

  return params
}

export function parseDeadlineShareState(
  input: string | URLSearchParams,
): DeadlineShareState | null {
  const params =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input

  if (params.get('sv') !== '1') return null

  const date = params.get('date')
  const duration = Number(params.get('days'))
  const direction = params.get('direction')
  const unit = params.get('unit')
  const startDayConvention = params.get('startday')
  const holidayCalendar = params.get('calendar')
  const endDayAdjustment = params.get('endrule')
  const triggerKind = params.get('trigger')
  const workingScheduleId = params.get('schedule')

  if (!isPlainDateKey(date)) return null
  if (!Number.isInteger(duration) || duration < 0) return null

  if (direction !== 'after' && direction !== 'before') {
    return null
  }

  if (unit !== 'business-days' && unit !== 'calendar-days') {
    return null
  }

  if (
    startDayConvention !== 'exclude-trigger' &&
    startDayConvention !== 'include-if-qualifying'
  ) {
    return null
  }

  if (!isHolidayCalendarId(holidayCalendar)) return null

  if (
    endDayAdjustment !== 'none' &&
    endDayAdjustment !== 'next-business-day' &&
    endDayAdjustment !== 'previous-business-day'
  ) {
    return null
  }

  if (triggerKind !== null && !isTriggerKind(triggerKind)) {
    return null
  }

  if (workingScheduleId !== 'standard_mon_fri') {
    return null
  }

  return {
    date: date!,
    duration,
    direction,
    unit,
    startDayConvention,
    holidayCalendar,
    endDayAdjustment,
    triggerKind,
    workingScheduleId,
    shareStateVersion: 1,
  }
}

export function buildDeadlineSharePath(
  state: Omit<DeadlineShareState, 'shareStateVersion'>,
) {
  const params = serializeDeadlineShareState(state)
  return `/deadline-calculator?${params.toString()}`
}
