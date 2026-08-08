import {
  type PlainDate,
  addCalendarDays,
  toDateKey,
} from './dateHelpers.ts'
import {
  type HolidayCalendarId,
  getHolidayOnDate,
} from './holidayCalendars.ts'

export type DeadlineDirection = 'after' | 'before'
export type DeadlineUnit = 'calendar-days' | 'business-days'
export type StartDayConvention = 'exclude-trigger' | 'include-if-qualifying'
export type EndDayAdjustment =
  | 'none'
  | 'next-business-day'
  | 'previous-business-day'

export type DeadlineRuleInput = {
  triggerDate: PlainDate
  duration: number
  direction: DeadlineDirection
  unit: DeadlineUnit
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
}

export type SkippedDeadlineDate = {
  date: string
  reason: 'weekend' | 'holiday'
  name?: string
}

export type DeadlineAnswer = {
  answerDate: PlainDate
  triggerDate: PlainDate
  duration: number
  direction: DeadlineDirection
  unit: DeadlineUnit
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
  skippedDates: SkippedDeadlineDate[]
  ruleVersion: 'deadline-rule-v1'
}

function isWeekend(date: PlainDate) {
  const weekday = new Date(`${toDateKey(date)}T12:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6
}

function isBusinessDate(
  date: PlainDate,
  holidayCalendar: HolidayCalendarId,
) {
  if (isWeekend(date)) return false
  return getHolidayOnDate(date, holidayCalendar) === null
}

function rememberSkippedDate(
  date: PlainDate,
  holidayCalendar: HolidayCalendarId,
  skippedDates: SkippedDeadlineDate[],
) {
  const key = toDateKey(date)

  if (skippedDates.some((item) => item.date === key)) return

  if (isWeekend(date)) {
    skippedDates.push({
      date: key,
      reason: 'weekend',
    })
    return
  }

  const holiday = getHolidayOnDate(date, holidayCalendar)
  if (holiday) {
    skippedDates.push({
      date: key,
      reason: 'holiday',
      name: holiday.name,
    })
  }
}

function stepDate(date: PlainDate, direction: DeadlineDirection) {
  return addCalendarDays(date, direction === 'after' ? 1 : -1)
}

function moveToBusinessDate(
  date: PlainDate,
  direction: 'forward' | 'backward',
  holidayCalendar: HolidayCalendarId,
  skippedDates: SkippedDeadlineDate[],
) {
  let cursor = date
  const amount = direction === 'forward' ? 1 : -1

  while (!isBusinessDate(cursor, holidayCalendar)) {
    rememberSkippedDate(cursor, holidayCalendar, skippedDates)
    cursor = addCalendarDays(cursor, amount)
  }

  return cursor
}

function applyEndDayAdjustment(
  date: PlainDate,
  adjustment: EndDayAdjustment,
  holidayCalendar: HolidayCalendarId,
  skippedDates: SkippedDeadlineDate[],
) {
  if (adjustment === 'none') return date
  if (isBusinessDate(date, holidayCalendar)) return date

  return moveToBusinessDate(
    date,
    adjustment === 'next-business-day' ? 'forward' : 'backward',
    holidayCalendar,
    skippedDates,
  )
}

export function calculateDeadlineByRule(
  input: DeadlineRuleInput,
): DeadlineAnswer | null {
  if (!Number.isInteger(input.duration) || input.duration < 0) {
    return null
  }

  const skippedDates: SkippedDeadlineDate[] = []
  let cursor = input.triggerDate
  let counted = 0

  const qualifies = (date: PlainDate) =>
    input.unit === 'calendar-days'
      ? true
      : isBusinessDate(date, input.holidayCalendar)

  if (
    input.duration > 0 &&
    input.startDayConvention === 'include-if-qualifying'
  ) {
    if (qualifies(cursor)) {
      counted = 1
    } else if (input.unit === 'business-days') {
      rememberSkippedDate(
        cursor,
        input.holidayCalendar,
        skippedDates,
      )
    }
  }

  while (counted < input.duration) {
    cursor = stepDate(cursor, input.direction)

    if (qualifies(cursor)) {
      counted += 1
    } else if (input.unit === 'business-days') {
      rememberSkippedDate(
        cursor,
        input.holidayCalendar,
        skippedDates,
      )
    }
  }

  const answerDate = applyEndDayAdjustment(
    cursor,
    input.endDayAdjustment,
    input.holidayCalendar,
    skippedDates,
  )

  return {
    answerDate,
    triggerDate: input.triggerDate,
    duration: input.duration,
    direction: input.direction,
    unit: input.unit,
    startDayConvention: input.startDayConvention,
    holidayCalendar: input.holidayCalendar,
    endDayAdjustment: input.endDayAdjustment,
    skippedDates,
    ruleVersion: 'deadline-rule-v1',
  }
}
