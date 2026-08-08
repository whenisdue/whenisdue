import {
  type PlainDate,
  addCalendarDays,
  toDateKey,
} from './dateHelpers.ts'
import {
  type HolidayCalendarId,
  getHolidayOnDate,
} from './holidayCalendars.ts'

export function timeToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * 60 + minutes
}

function minutesToTime(value: number) {
  const safe = Math.max(0, Math.min(1439, value))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatTime12Hour(value: string) {
  const total = timeToMinutes(value)
  if (total === null) return value

  const hour24 = Math.floor(total / 60)
  const minute = total % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12

  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function isBusinessDateForCalendar(
  date: PlainDate,
  holidayCalendar: HolidayCalendarId,
) {
  const weekday = new Date(`${toDateKey(date)}T12:00:00Z`).getUTCDay()
  if (weekday === 0 || weekday === 6) return false
  return getHolidayOnDate(date, holidayCalendar) === null
}

function nextBusinessDate(
  date: PlainDate,
  holidayCalendar: HolidayCalendarId,
) {
  let cursor = addCalendarDays(date, 1)

  while (!isBusinessDateForCalendar(cursor, holidayCalendar)) {
    cursor = addCalendarDays(cursor, 1)
  }

  return cursor
}

export function calculateBusinessHoursDeadline(
  startDate: PlainDate,
  startTime: string,
  hoursToAdd: number,
  workdayStartTime: string,
  workdayEndTime: string,
  holidayCalendar: HolidayCalendarId,
) {
  const startMinutes = timeToMinutes(startTime)
  const workdayStart = timeToMinutes(workdayStartTime)
  const workdayEnd = timeToMinutes(workdayEndTime)

  if (
    startMinutes === null ||
    workdayStart === null ||
    workdayEnd === null ||
    workdayEnd <= workdayStart ||
    hoursToAdd <= 0
  ) {
    return null
  }

  let cursorDate = startDate
  let cursorMinutes = startMinutes

  if (!isBusinessDateForCalendar(cursorDate, holidayCalendar)) {
    cursorDate = nextBusinessDate(cursorDate, holidayCalendar)
    cursorMinutes = workdayStart
  } else if (cursorMinutes < workdayStart) {
    cursorMinutes = workdayStart
  } else if (cursorMinutes >= workdayEnd) {
    cursorDate = nextBusinessDate(cursorDate, holidayCalendar)
    cursorMinutes = workdayStart
  }

  let remainingMinutes = Math.round(hoursToAdd * 60)

  while (remainingMinutes > 0) {
    const availableToday = workdayEnd - cursorMinutes

    if (remainingMinutes <= availableToday) {
      cursorMinutes += remainingMinutes
      remainingMinutes = 0
    } else {
      remainingMinutes -= availableToday
      cursorDate = nextBusinessDate(cursorDate, holidayCalendar)
      cursorMinutes = workdayStart
    }
  }

  return {
    date: cursorDate,
    time: minutesToTime(cursorMinutes),
  }
}
