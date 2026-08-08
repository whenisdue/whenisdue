import {
  type PlainDate,
  parsePlainDate,
  toDateKey,
} from './dateHelpers.ts'
import {
  type HolidayCalendarId,
} from './holidayCalendars.ts'
import {
  type DeadlineAnswer,
  type DeadlineDirection,
  type DeadlineUnit,
  type EndDayAdjustment,
  type StartDayConvention,
  calculateDeadlineByRule,
} from './deadlineRules.ts'

export type DeadlinePhraseAmbiguity =
  | 'within-wording'
  | 'today-reference'
  | 'holiday-calendar-defaulted'
  | 'start-day-rule-defaulted'
  | 'end-day-adjustment-defaulted'

export type DeadlinePhraseOptions = {
  today?: PlainDate
  holidayCalendar?: HolidayCalendarId
  startDayConvention?: StartDayConvention
  endDayAdjustment?: EndDayAdjustment
}

export type DeadlinePhraseInterpretation = {
  original: string
  normalized: string
  duration: number
  unit: DeadlineUnit
  direction: DeadlineDirection
  triggerDate: PlainDate
  triggerSource: 'explicit-date' | 'today'
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
  ambiguities: DeadlinePhraseAmbiguity[]
  answer: DeadlineAnswer
}

function normalizePhrase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[?,.]+$/g, '')
    .replace(/\s+/g, ' ')
}

function parseUnit(value: string): DeadlineUnit | null {
  if (
    value === 'business day' ||
    value === 'business days' ||
    value === 'working day' ||
    value === 'working days'
  ) {
    return 'business-days'
  }

  if (
    value === 'calendar day' ||
    value === 'calendar days' ||
    value === 'day' ||
    value === 'days'
  ) {
    return 'calendar-days'
  }

  return null
}

function parseTriggerDate(
  value: string,
  today?: PlainDate,
): { date: PlainDate; source: 'explicit-date' | 'today' } | null {
  if (value === 'today') {
    if (!today) return null

    return {
      date: today,
      source: 'today',
    }
  }

  const parsed = parsePlainDate(value)
  if (!parsed) return null

  return {
    date: parsed,
    source: 'explicit-date',
  }
}

function directionFromConnector(value: string): DeadlineDirection {
  return value === 'before' ? 'before' : 'after'
}

export function interpretDeadlinePhrase(
  phrase: string,
  options: DeadlinePhraseOptions = {},
): DeadlinePhraseInterpretation | null {
  const normalized = normalizePhrase(phrase)

  const match = /^(within\s+)?(\d+)\s+(business days?|working days?|calendar days?|days?)\s+(after|before|from)\s+(today|\d{4}-\d{2}-\d{2})$/.exec(
    normalized,
  )

  if (!match) return null

  const [, withinPrefix, durationText, unitText, connector, triggerText] = match
  const duration = Number(durationText)

  if (!Number.isInteger(duration) || duration < 0) return null

  const unit = parseUnit(unitText)
  if (!unit) return null

  const trigger = parseTriggerDate(triggerText, options.today)
  if (!trigger) return null

  const direction = directionFromConnector(connector)
  const startDayConvention =
    options.startDayConvention ?? 'exclude-trigger'
  const holidayCalendar = options.holidayCalendar ?? 'none'
  const endDayAdjustment = options.endDayAdjustment ?? 'none'

  const ambiguities: DeadlinePhraseAmbiguity[] = []

  if (withinPrefix) {
    ambiguities.push('within-wording')
  }

  if (trigger.source === 'today') {
    ambiguities.push('today-reference')
  }

  if (options.holidayCalendar === undefined) {
    ambiguities.push('holiday-calendar-defaulted')
  }

  if (options.startDayConvention === undefined) {
    ambiguities.push('start-day-rule-defaulted')
  }

  if (options.endDayAdjustment === undefined) {
    ambiguities.push('end-day-adjustment-defaulted')
  }

  const answer = calculateDeadlineByRule({
    triggerDate: trigger.date,
    duration,
    direction,
    unit,
    startDayConvention,
    holidayCalendar,
    endDayAdjustment,
  })

  if (!answer) return null

  return {
    original: phrase,
    normalized,
    duration,
    unit,
    direction,
    triggerDate: trigger.date,
    triggerSource: trigger.source,
    startDayConvention,
    holidayCalendar,
    endDayAdjustment,
    ambiguities,
    answer,
  }
}

export function summarizeDeadlineInterpretation(
  interpretation: DeadlinePhraseInterpretation,
) {
  const unitLabel =
    interpretation.unit === 'business-days'
      ? 'business days'
      : 'calendar days'

  return {
    trigger: toDateKey(interpretation.triggerDate),
    direction: interpretation.direction,
    duration: interpretation.duration,
    unit: unitLabel,
    result: toDateKey(interpretation.answer.answerDate),
    assumptions: {
      startDayConvention: interpretation.startDayConvention,
      holidayCalendar: interpretation.holidayCalendar,
      endDayAdjustment: interpretation.endDayAdjustment,
    },
    ambiguities: interpretation.ambiguities,
  }
}
