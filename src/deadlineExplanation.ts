import {
  type DeadlineAnswer,
} from './deadlineRules.ts'
import {
  type DeadlineTriggerKind,
} from './deadlineTrigger.ts'
import {
  getHolidayCalendarDisplayLabel,
  getTriggerDisplayLabel,
} from './deadlineDisplayLabels.ts'

function durationLabel(answer: DeadlineAnswer) {
  const unit =
    answer.unit === 'business-days'
      ? answer.duration === 1
        ? 'business day'
        : 'business days'
      : answer.duration === 1
        ? 'calendar day'
        : 'calendar days'

  return `${answer.duration} ${unit}`
}

function startDayLabel(answer: DeadlineAnswer) {
  if (answer.startDayConvention === 'exclude-trigger') {
    return 'The start date is not counted.'
  }

  if (answer.unit === 'business-days') {
    return 'The start date counts as day 1 only if it is a working day.'
  }

  return 'The start date counts as day 1.'
}

function businessDayLabel(answer: DeadlineAnswer) {
  if (answer.unit !== 'business-days') return null

  if (answer.holidayCalendar === 'none') {
    return 'Business days are Monday–Friday; public holidays are not excluded.'
  }

  return `Business days are Monday–Friday, excluding ${getHolidayCalendarDisplayLabel(
    answer.holidayCalendar,
  )}.`
}

function finalAdjustmentLabel(answer: DeadlineAnswer) {
  if (answer.endDayAdjustment === 'none') return null

  if (answer.endDayAdjustment === 'next-business-day') {
    return 'If the calculated final date is not a business day, it moves to the next business day.'
  }

  return 'If the calculated final date is not a business day, it moves to the previous business day.'
}

export function buildDeadlineExplanation(
  answer: DeadlineAnswer,
  triggerKind: DeadlineTriggerKind | null,
) {
  const trigger = getTriggerDisplayLabel(triggerKind)

  const firstSentence =
    triggerKind === null
      ? `Count ${durationLabel(answer)} ${answer.direction} the start date.`
      : `Count ${durationLabel(answer)} ${answer.direction} ${trigger.toLowerCase()}.`

  return [
    firstSentence,
    startDayLabel(answer),
    businessDayLabel(answer),
    finalAdjustmentLabel(answer),
  ]
    .filter((item): item is string => Boolean(item))
    .join(' ')
}
