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

export type DeadlinePhraseClassification =
  | 'resolved'
  | 'ambiguous'
  | 'underspecified'

export type DeadlinePhraseAmbiguity =
  | 'start-day-rule'
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
  classification: DeadlinePhraseClassification
  duration: number
  unit: DeadlineUnit
  direction: DeadlineDirection
  triggerDate: PlainDate | null
  triggerSource: 'explicit-date' | 'today' | 'missing'
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
  ambiguities: DeadlinePhraseAmbiguity[]
  missing: Array<'trigger-date'>
  answer: DeadlineAnswer | null
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
  value: string | undefined,
  today?: PlainDate,
): {
  date: PlainDate | null
  source: 'explicit-date' | 'today' | 'missing'
} | null {
  if (!value) {
    return { date: null, source: 'missing' }
  }

  if (value === 'today') {
    if (!today) return { date: null, source: 'missing' }
    return { date: today, source: 'today' }
  }

  const parsed = parsePlainDate(value)
  if (!parsed) return null

  return { date: parsed, source: 'explicit-date' }
}

export function interpretDeadlinePhrase(
  phrase: string,
  options: DeadlinePhraseOptions = {},
): DeadlinePhraseInterpretation | null {
  const normalized = normalizePhrase(phrase)

  const explicitPattern =
    /^(within\s+)?(\d+)\s+(business days?|working days?|calendar days?|days?)\s+(after|before)\s+(today|\d{4}-\d{2}-\d{2})$/
  const fromPattern =
    /^(within\s+)?(\d+)\s+(business days?|working days?|calendar days?|days?)\s+from\s+(today|\d{4}-\d{2}-\d{2})$/
  const ofPattern =
    /^(within\s+)(\d+)\s+(business days?|working days?|calendar days?|days?)\s+of\s+(today|\d{4}-\d{2}-\d{2})$/
  const missingTriggerPattern =
    /^(within\s+)?(\d+)\s+(business days?|working days?|calendar days?|days?)$/

  const explicitMatch = explicitPattern.exec(normalized)
  const fromMatch = fromPattern.exec(normalized)
  const ofMatch = ofPattern.exec(normalized)
  const missingMatch = missingTriggerPattern.exec(normalized)

  let durationText: string
  let unitText: string
  let connector: 'after' | 'before' | 'from' | 'of'
  let triggerText: string | undefined

  if (explicitMatch) {
    [, , durationText, unitText, , triggerText] = explicitMatch
    connector = explicitMatch[4] === 'before' ? 'before' : 'after'
  } else if (fromMatch) {
    [, , durationText, unitText, triggerText] = fromMatch
    connector = 'from'
  } else if (ofMatch) {
    [, , durationText, unitText, triggerText] = ofMatch
    connector = 'of'
  } else if (missingMatch) {
    [, , durationText, unitText] = missingMatch
    connector = 'from'
    triggerText = undefined
  } else {
    return null
  }

  const duration = Number(durationText)
  if (!Number.isInteger(duration) || duration < 0) return null

  const unit = parseUnit(unitText)
  if (!unit) return null

  const trigger = parseTriggerDate(triggerText, options.today)
  if (!trigger) return null

  const direction: DeadlineDirection =
    connector === 'before' ? 'before' : 'after'
  const startDayConvention =
    options.startDayConvention ?? 'exclude-trigger'
  const holidayCalendar = options.holidayCalendar ?? 'none'
  const endDayAdjustment = options.endDayAdjustment ?? 'none'

  const ambiguities: DeadlinePhraseAmbiguity[] = []
  const missing: Array<'trigger-date'> = []
  let classification: DeadlinePhraseClassification = 'resolved'

  if (connector === 'from' || connector === 'of') {
    classification = 'ambiguous'
    ambiguities.push('start-day-rule')
  }

  if (trigger.source === 'missing') {
    classification = 'underspecified'
    missing.push('trigger-date')
  }

  if (trigger.source === 'today') ambiguities.push('today-reference')
  if (options.holidayCalendar === undefined) ambiguities.push('holiday-calendar-defaulted')
  if (options.startDayConvention === undefined) ambiguities.push('start-day-rule-defaulted')
  if (options.endDayAdjustment === undefined) ambiguities.push('end-day-adjustment-defaulted')

  const answer =
    trigger.date === null
      ? null
      : calculateDeadlineByRule({
          triggerDate: trigger.date,
          duration,
          direction,
          unit,
          startDayConvention,
          holidayCalendar,
          endDayAdjustment,
        })

  if (trigger.date !== null && !answer) return null

  return {
    original: phrase,
    normalized,
    classification,
    duration,
    unit,
    direction,
    triggerDate: trigger.date,
    triggerSource: trigger.source,
    startDayConvention,
    holidayCalendar,
    endDayAdjustment,
    ambiguities,
    missing,
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
    classification: interpretation.classification,
    trigger: interpretation.triggerDate
      ? toDateKey(interpretation.triggerDate)
      : null,
    direction: interpretation.direction,
    duration: interpretation.duration,
    unit: unitLabel,
    result: interpretation.answer
      ? toDateKey(interpretation.answer.answerDate)
      : null,
    assumptions: {
      startDayConvention: interpretation.startDayConvention,
      holidayCalendar: interpretation.holidayCalendar,
      endDayAdjustment: interpretation.endDayAdjustment,
    },
    ambiguities: interpretation.ambiguities,
    missing: interpretation.missing,
  }
}
