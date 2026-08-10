import { type DeadlineAnswer } from './deadlineRules.ts'
import { getWorkingSchedule } from './workingSchedules.ts'
import { getHolidayCalendarDisplayLabel } from './deadlineDisplayLabels.ts'

export type DeadlineProvenanceRow = {
  label: string
  value: string
}

export function buildDeadlineProvenanceRows(
  answer: DeadlineAnswer,
): DeadlineProvenanceRow[] {
  const rows: DeadlineProvenanceRow[] = [
    {
      label: 'Calculation method',
      value: 'Deadline counting rules',
    },
  ]

  if (answer.unit === 'business-days') {
    rows.push({
      label: 'Working schedule',
      value: getWorkingSchedule(answer.workingScheduleId).label,
    })

    rows.push({
      label: 'Holiday calendar',
      value: getHolidayCalendarDisplayLabel(answer.holidayCalendar),
    })
  } else if (answer.endDayAdjustment !== 'none') {
    rows.push({
      label: 'Holiday calendar',
      value: getHolidayCalendarDisplayLabel(answer.holidayCalendar),
    })
  }

  return rows
}

export function summarizeDeadlineProvenance(answer: DeadlineAnswer) {
  return {
    deadlineRuleVersion: answer.ruleVersion,
    workingScheduleId: answer.workingScheduleId,
    holidayCalendar: answer.holidayCalendar,
    holidayCalendarVersion: answer.holidayCalendarVersion,
  }
}
