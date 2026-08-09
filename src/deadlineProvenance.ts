import {
  type DeadlineAnswer,
} from './deadlineRules.ts'
import {
  getWorkingSchedule,
} from './workingSchedules.ts'

function holidayRulesLabel(answer: DeadlineAnswer) {
  if (answer.holidayCalendar === 'none') {
    return 'No public-holiday exclusions'
  }

  if (answer.holidayCalendar === 'us') {
    return 'US federal holidays'
  }

  if (answer.holidayCalendar === 'uk') {
    return 'England & Wales bank holidays'
  }

  if (answer.holidayCalendar === 'ca') {
    return 'Canada federal holidays'
  }

  if (answer.holidayCalendar === 'au') {
    return 'Australia nationwide holidays'
  }

  return 'Philippines predictable regular holidays'
}

export type DeadlineProvenanceRow = {
  label: string
  value: string
}

export function buildDeadlineProvenanceRows(
  answer: DeadlineAnswer,
): DeadlineProvenanceRow[] {
  const rows: DeadlineProvenanceRow[] = [
    {
      label: 'Deadline rules',
      value: answer.ruleVersion,
    },
  ]

  if (answer.unit === 'business-days') {
    rows.push({
      label: 'Working schedule',
      value: getWorkingSchedule(answer.workingScheduleId).label,
    })

    rows.push({
      label: 'Holiday rules',
      value: `${holidayRulesLabel(answer)} · ${answer.holidayCalendarVersion}`,
    })
  } else if (answer.endDayAdjustment !== 'none') {
    rows.push({
      label: 'Holiday rules',
      value: `${holidayRulesLabel(answer)} · ${answer.holidayCalendarVersion}`,
    })
  }

  return rows
}

export function summarizeDeadlineProvenance(
  answer: DeadlineAnswer,
) {
  return {
    deadlineRuleVersion: answer.ruleVersion,
    workingScheduleId: answer.workingScheduleId,
    holidayCalendar: answer.holidayCalendar,
    holidayCalendarVersion: answer.holidayCalendarVersion,
  }
}
