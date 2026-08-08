import {
  type PlainDate,
  addCalendarDays,
  parsePlainDate,
  toDateKey,
} from './dateHelpers.ts'

export type PaySchedule =
  | 'weekly'
  | 'biweekly'
  | 'semimonthly-1-15'
  | 'semimonthly-15-last'
  | 'monthly'

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
}

function compareDateKeys(a: PlainDate, b: PlainDate) {
  return toDateKey(a).localeCompare(toDateKey(b))
}

function dateParts(date: PlainDate) {
  const key = toDateKey(date)
  return {
    year: Number(key.slice(0, 4)),
    month: Number(key.slice(5, 7)),
    day: Number(key.slice(8, 10)),
  }
}

function makePlainDate(year: number, month: number, day: number) {
  return parsePlainDate(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  )
}

function nextSemimonthlyDate(
  afterDate: PlainDate,
  firstDay: number | 'last',
  secondDay: number | 'last',
) {
  const { year, month } = dateParts(afterDate)

  for (let monthOffset = 0; monthOffset < 18; monthOffset += 1) {
    const monthIndex = month - 1 + monthOffset
    const candidateYear = year + Math.floor(monthIndex / 12)
    const candidateMonth = (monthIndex % 12) + 1
    const lastDay = daysInMonth(candidateYear, candidateMonth)

    const resolveDay = (day: number | 'last') =>
      day === 'last' ? lastDay : Math.min(day, lastDay)

    const days = [resolveDay(firstDay), resolveDay(secondDay)]
      .sort((a, b) => a - b)
      .filter((day, index, list) => index === 0 || day !== list[index - 1])

    for (const day of days) {
      const candidate = makePlainDate(candidateYear, candidateMonth, day)
      if (candidate && compareDateKeys(candidate, afterDate) > 0) {
        return candidate
      }
    }
  }

  return null
}

export function calculateNextPayday(
  knownPayday: PlainDate,
  schedule: PaySchedule,
) {
  if (schedule === 'weekly') return addCalendarDays(knownPayday, 7)
  if (schedule === 'biweekly') return addCalendarDays(knownPayday, 14)
  if (schedule === 'semimonthly-1-15') {
    return nextSemimonthlyDate(knownPayday, 1, 15)
  }
  if (schedule === 'semimonthly-15-last') {
    return nextSemimonthlyDate(knownPayday, 15, 'last')
  }

  const { year, month, day } = dateParts(knownPayday)
  const nextMonthIndex = month
  const nextYear = year + Math.floor(nextMonthIndex / 12)
  const nextMonth = (nextMonthIndex % 12) + 1
  const nextDay = Math.min(day, daysInMonth(nextYear, nextMonth))
  return makePlainDate(nextYear, nextMonth, nextDay)
}

export function payScheduleLabel(schedule: PaySchedule) {
  if (schedule === 'weekly') return 'Weekly · every 7 days'
  if (schedule === 'biweekly') return 'Biweekly · every 14 days'
  if (schedule === 'semimonthly-1-15') return 'Semimonthly · 1st and 15th'
  if (schedule === 'semimonthly-15-last') {
    return 'Semimonthly · 15th and last day'
  }
  return 'Monthly · same calendar day when possible'
}
