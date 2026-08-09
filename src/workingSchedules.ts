import {
  type PlainDate,
  toDateKey,
} from './dateHelpers.ts'

export type WorkingScheduleId = 'standard_mon_fri'

export type WorkingSchedule = {
  id: WorkingScheduleId
  label: string
  workingWeekdays: readonly number[]
  scheduleVersion: 'working-schedule-v1'
}

const schedules: Record<WorkingScheduleId, WorkingSchedule> = {
  standard_mon_fri: {
    id: 'standard_mon_fri',
    label: 'Monday–Friday',
    // JavaScript weekday convention: Sunday = 0 ... Saturday = 6.
    workingWeekdays: [1, 2, 3, 4, 5],
    scheduleVersion: 'working-schedule-v1',
  },
}

export function getWorkingSchedule(
  id: WorkingScheduleId,
): WorkingSchedule {
  return schedules[id]
}

export function isWorkingWeekday(
  date: PlainDate,
  scheduleId: WorkingScheduleId = 'standard_mon_fri',
) {
  const schedule = getWorkingSchedule(scheduleId)
  const jsDate = new Date(`${toDateKey(date)}T12:00:00`)

  return schedule.workingWeekdays.includes(jsDate.getDay())
}

export function getDefaultWorkingScheduleId(): WorkingScheduleId {
  return 'standard_mon_fri'
}
