import {
  type PlainDate,
  addCalendarDays,
  parsePlainDate,
  toDateKey,
} from './dateHelpers.ts'

export type HolidayCalendarId = 'none' | 'us' | 'uk' | 'ca' | 'au' | 'ph'

export type HolidayOccurrence = {
  date: string
  name: string
}

export type HolidayCalendarOption = {
  id: HolidayCalendarId
  label: string
  shortLabel: string
  note: string
}

export const holidayCalendarOptions: HolidayCalendarOption[] = [
  {
    id: 'none',
    label: "Don't skip public holidays",
    shortLabel: 'Weekends only',
    note: 'Saturday and Sunday are skipped. Public holidays still count as weekdays.',
  },
  {
    id: 'us',
    label: 'United States — federal holidays',
    shortLabel: 'US federal',
    note: 'Uses the standard U.S. federal holiday calendar, including observed weekdays.',
  },
  {
    id: 'uk',
    label: 'United Kingdom — England & Wales bank holidays',
    shortLabel: 'UK (England & Wales)',
    note: 'Uses regular England and Wales bank holidays. One-off national holidays are not predicted.',
  },
  {
    id: 'ca',
    label: 'Canada — federal holidays',
    shortLabel: 'Canada federal',
    note: 'Uses common federal holidays. Provincial and employer-specific holidays can differ.',
  },
  {
    id: 'au',
    label: 'Australia — nationwide holidays',
    shortLabel: 'Australia nationwide',
    note: 'Uses nationwide holidays only. State and territory holidays can differ.',
  },
  {
    id: 'ph',
    label: 'Philippines — regular predictable holidays',
    shortLabel: 'Philippines',
    note: 'Uses predictable regular holidays. Eid dates and proclamation-based special non-working days are not predicted.',
  },
]

export function isHolidayCalendarId(value: string | null): value is HolidayCalendarId {
  return holidayCalendarOptions.some((option) => option.id === value)
}

export function getHolidayCalendarOption(id: HolidayCalendarId) {
  return holidayCalendarOptions.find((option) => option.id === id) ?? holidayCalendarOptions[0]
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`)
}

function weekdayOfKey(key: string) {
  return dateFromKey(key).getUTCDay()
}

function addDaysToKey(key: string, amount: number) {
  const date = dateFromKey(key)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
) {
  const first = dateFromKey(dateKey(year, month, 1))
  const delta = (weekday - first.getUTCDay() + 7) % 7
  return dateKey(year, month, 1 + delta + (occurrence - 1) * 7)
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number) {
  const nextMonth = new Date(Date.UTC(year, month, 1, 12))
  nextMonth.setUTCDate(0)
  const lastDay = nextMonth.getUTCDate()
  const lastKey = dateKey(year, month, lastDay)
  const delta = (weekdayOfKey(lastKey) - weekday + 7) % 7
  return dateKey(year, month, lastDay - delta)
}

function mondayBefore(year: number, month: number, day: number) {
  let key = dateKey(year, month, day)
  do {
    key = addDaysToKey(key, -1)
  } while (weekdayOfKey(key) !== 1)
  return key
}

function observedNearestWeekday(key: string) {
  const weekday = weekdayOfKey(key)
  if (weekday === 6) return addDaysToKey(key, -1)
  if (weekday === 0) return addDaysToKey(key, 1)
  return key
}

function observedNextMonday(key: string) {
  const weekday = weekdayOfKey(key)
  if (weekday === 6) return addDaysToKey(key, 2)
  if (weekday === 0) return addDaysToKey(key, 1)
  return key
}

function gregorianEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return dateKey(year, month, day)
}

function addHoliday(
  map: Map<string, HolidayOccurrence>,
  date: string,
  name: string,
) {
  map.set(date, { date, name })
}

function addObservedHoliday(
  map: Map<string, HolidayOccurrence>,
  actualDate: string,
  name: string,
  mode: 'nearest-weekday' | 'next-monday' = 'nearest-weekday',
) {
  const observed =
    mode === 'next-monday'
      ? observedNextMonday(actualDate)
      : observedNearestWeekday(actualDate)

  addHoliday(map, observed, name)
}

function addChristmasAndBoxingSubstitutes(
  map: Map<string, HolidayOccurrence>,
  year: number,
  christmasName = 'Christmas Day',
  boxingName = 'Boxing Day',
) {
  const christmas = dateKey(year, 12, 25)
  const boxing = dateKey(year, 12, 26)

  if (weekdayOfKey(christmas) >= 1 && weekdayOfKey(christmas) <= 5) {
    addHoliday(map, christmas, christmasName)
  }
  if (weekdayOfKey(boxing) >= 1 && weekdayOfKey(boxing) <= 5) {
    addHoliday(map, boxing, boxingName)
  }

  const used = new Set(map.keys())
  const addSubstitute = (actual: string, name: string) => {
    const weekday = weekdayOfKey(actual)
    if (weekday !== 0 && weekday !== 6) return

    let candidate = addDaysToKey(actual, 1)
    while (
      weekdayOfKey(candidate) === 0 ||
      weekdayOfKey(candidate) === 6 ||
      used.has(candidate)
    ) {
      candidate = addDaysToKey(candidate, 1)
    }
    addHoliday(map, candidate, `${name} (substitute)`)
    used.add(candidate)
  }

  addSubstitute(christmas, christmasName)
  addSubstitute(boxing, boxingName)
}

function buildUsFederal(year: number) {
  const map = new Map<string, HolidayOccurrence>()

  addObservedHoliday(map, dateKey(year, 1, 1), "New Year's Day")
  addHoliday(map, nthWeekdayOfMonth(year, 1, 1, 3), 'Martin Luther King Jr. Day')
  addHoliday(map, nthWeekdayOfMonth(year, 2, 1, 3), "Washington's Birthday")
  addHoliday(map, lastWeekdayOfMonth(year, 5, 1), 'Memorial Day')
  addObservedHoliday(map, dateKey(year, 6, 19), 'Juneteenth National Independence Day')
  addObservedHoliday(map, dateKey(year, 7, 4), 'Independence Day')
  addHoliday(map, nthWeekdayOfMonth(year, 9, 1, 1), 'Labor Day')
  addHoliday(map, nthWeekdayOfMonth(year, 10, 1, 2), 'Columbus Day')
  addObservedHoliday(map, dateKey(year, 11, 11), 'Veterans Day')
  addHoliday(map, nthWeekdayOfMonth(year, 11, 4, 4), 'Thanksgiving Day')
  addObservedHoliday(map, dateKey(year, 12, 25), 'Christmas Day')

  return map
}

function buildUkEnglandWales(year: number) {
  const map = new Map<string, HolidayOccurrence>()
  const easter = gregorianEasterSunday(year)

  addObservedHoliday(map, dateKey(year, 1, 1), "New Year's Day", 'next-monday')
  addHoliday(map, addDaysToKey(easter, -2), 'Good Friday')
  addHoliday(map, addDaysToKey(easter, 1), 'Easter Monday')
  addHoliday(map, nthWeekdayOfMonth(year, 5, 1, 1), 'Early May bank holiday')
  addHoliday(map, lastWeekdayOfMonth(year, 5, 1), 'Spring bank holiday')
  addHoliday(map, lastWeekdayOfMonth(year, 8, 1), 'Summer bank holiday')
  addChristmasAndBoxingSubstitutes(map, year)

  return map
}

function buildCanadaFederal(year: number) {
  const map = new Map<string, HolidayOccurrence>()
  const easter = gregorianEasterSunday(year)

  addObservedHoliday(map, dateKey(year, 1, 1), "New Year's Day", 'next-monday')
  addHoliday(map, addDaysToKey(easter, -2), 'Good Friday')
  addHoliday(map, mondayBefore(year, 5, 25), 'Victoria Day')
  addObservedHoliday(map, dateKey(year, 7, 1), 'Canada Day', 'next-monday')
  addHoliday(map, nthWeekdayOfMonth(year, 9, 1, 1), 'Labour Day')
  addObservedHoliday(
    map,
    dateKey(year, 9, 30),
    'National Day for Truth and Reconciliation',
    'next-monday',
  )
  addHoliday(map, nthWeekdayOfMonth(year, 10, 1, 2), 'Thanksgiving')
  addObservedHoliday(map, dateKey(year, 11, 11), 'Remembrance Day', 'next-monday')
  addChristmasAndBoxingSubstitutes(map, year)

  return map
}

function buildAustraliaNationwide(year: number) {
  const map = new Map<string, HolidayOccurrence>()
  const easter = gregorianEasterSunday(year)

  addObservedHoliday(map, dateKey(year, 1, 1), "New Year's Day", 'next-monday')
  addObservedHoliday(map, dateKey(year, 1, 26), 'Australia Day', 'next-monday')
  addHoliday(map, addDaysToKey(easter, -2), 'Good Friday')
  addHoliday(map, addDaysToKey(easter, 1), 'Easter Monday')

  const anzac = dateKey(year, 4, 25)
  if (weekdayOfKey(anzac) >= 1 && weekdayOfKey(anzac) <= 5) {
    addHoliday(map, anzac, 'ANZAC Day')
  }

  addChristmasAndBoxingSubstitutes(map, year)

  return map
}

function buildPhilippinesPredictable(year: number) {
  const map = new Map<string, HolidayOccurrence>()
  const easter = gregorianEasterSunday(year)

  const fixed: Array<[number, number, string]> = [
    [1, 1, "New Year's Day"],
    [4, 9, 'Araw ng Kagitingan'],
    [5, 1, 'Labor Day'],
    [6, 12, 'Independence Day'],
    [11, 30, 'Bonifacio Day'],
    [12, 25, 'Christmas Day'],
    [12, 30, 'Rizal Day'],
  ]

  for (const [month, day, name] of fixed) {
    const key = dateKey(year, month, day)
    if (weekdayOfKey(key) >= 1 && weekdayOfKey(key) <= 5) {
      addHoliday(map, key, name)
    }
  }

  addHoliday(map, addDaysToKey(easter, -3), 'Maundy Thursday')
  addHoliday(map, addDaysToKey(easter, -2), 'Good Friday')
  addHoliday(map, lastWeekdayOfMonth(year, 8, 1), 'National Heroes Day')

  return map
}

const holidayCache = new Map<string, Map<string, HolidayOccurrence>>()

function holidaysForYear(calendar: Exclude<HolidayCalendarId, 'none'>, year: number) {
  const cacheKey = `${calendar}:${year}`
  const cached = holidayCache.get(cacheKey)
  if (cached) return cached

  const built =
    calendar === 'us'
      ? buildUsFederal(year)
      : calendar === 'uk'
        ? buildUkEnglandWales(year)
        : calendar === 'ca'
          ? buildCanadaFederal(year)
          : calendar === 'au'
            ? buildAustraliaNationwide(year)
            : buildPhilippinesPredictable(year)

  holidayCache.set(cacheKey, built)
  return built
}

export function getHolidayOnDate(
  date: PlainDate,
  calendar: HolidayCalendarId,
): HolidayOccurrence | null {
  if (calendar === 'none') return null

  const key = toDateKey(date)
  const year = Number(key.slice(0, 4))

  return holidaysForYear(calendar, year).get(key) ?? null
}

function isWeekend(date: PlainDate) {
  const weekday = weekdayOfKey(toDateKey(date))
  return weekday === 0 || weekday === 6
}

export function calculateBusinessDaysWithCalendar(
  start: PlainDate,
  amount: number,
  calendar: HolidayCalendarId,
) {
  let cursor = start
  let counted = 0
  const skippedHolidays: HolidayOccurrence[] = []

  while (counted < amount) {
    cursor = addCalendarDays(cursor, 1)

    if (isWeekend(cursor)) {
      continue
    }

    const holiday = getHolidayOnDate(cursor, calendar)
    if (holiday) {
      skippedHolidays.push(holiday)
      continue
    }

    counted += 1
  }

  return {
    date: cursor,
    skippedHolidays,
  }
}

export function countBusinessDaysBetweenWithCalendar(
  start: PlainDate,
  end: PlainDate,
  calendar: HolidayCalendarId,
) {
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  if (startKey === endKey) {
    return {
      count: 0,
      skippedHolidays: [] as HolidayOccurrence[],
    }
  }

  const earlier = startKey < endKey ? start : end
  const later = startKey < endKey ? end : start

  let cursor = addCalendarDays(earlier, 1)
  let count = 0
  const skippedHolidays: HolidayOccurrence[] = []

  while (toDateKey(cursor) <= toDateKey(later)) {
    if (!isWeekend(cursor)) {
      const holiday = getHolidayOnDate(cursor, calendar)
      if (holiday) {
        skippedHolidays.push(holiday)
      } else {
        count += 1
      }
    }

    cursor = addCalendarDays(cursor, 1)
  }

  return {
    count,
    skippedHolidays,
  }
}

export function parseHolidayDate(date: string) {
  return parsePlainDate(date)
}
