import { isDeepStrictEqual } from 'node:util'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { completionQaCorpus, completionQaReference } from './completionQaCorpus.mjs'
import { resolveAskWhenCompletion } from './src/askWhenCompletion.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'
import { getDueDateForMode, parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { calculateBusinessDaysWithCalendar } from './src/holidayCalendars.ts'

const todayKey = completionQaReference.date

// Guard the production URL sync contract, not only the ASK-generated URL.
// A missing `calendar=none` can otherwise reopen with a saved US preference.
function verifyCalendarUrlReproducibility() {
  const source = readFileSync(new URL('./src/App.tsx', import.meta.url), 'utf8')
  const file = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const functionNamed = (name) => file.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  )
  const calendarSyncPages = [
    'DeadlineCalculatorPage',
    'ShippingDeliveryRangePage',
    'NoticePeriodCalculatorPage',
    'DeadlineWeekendExtensionGuidePage',
    'BusinessDaysPage',
    'BusinessDaysFromTodayPage',
    'BusinessDaysBetweenPage',
    'BusinessHoursDeadlinePage',
  ]

  for (const pageName of calendarSyncPages) {
    const page = functionNamed(pageName)
    if (!page) throw new Error(`Calendar URL contract: missing ${pageName}`)
    const calendarValues = []
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'syncShareableQueryParams' &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        for (const property of node.arguments[0].properties) {
          if (ts.isPropertyAssignment(property) && property.name.getText(file) === 'calendar') {
            calendarValues.push(property.initializer.getText(file).replace(/\s+/g, ' '))
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    ts.forEachChild(page, visit)
    const expected = pageName === 'ShippingDeliveryRangePage'
      ? "countMode === 'business' ? holidayCalendar : null"
      : pageName === 'NoticePeriodCalculatorPage'
        ? "noticeUnit === 'business-days' ? holidayCalendar : null"
        : 'holidayCalendar'
    if (calendarValues.length !== 1 || calendarValues[0] !== expected) {
      throw new Error(`Calendar URL contract: ${pageName} must sync its active calendar; got ${calendarValues.join(', ') || '(none)'}`)
    }
  }

  const syncFunction = functionNamed('syncShareableQueryParams')
  if (!syncFunction) throw new Error('Calendar URL contract: missing URL sync function')
  const javascript = ts.transpileModule(syncFunction.getText(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  let currentUrl = new URL('https://whenisdue.test/business-days-calculator?start=2026-08-24&days=10&calendar=us')
  const browser = {
    location: { get href() { return currentUrl.href } },
    history: { replaceState(_state, _unused, path) { currentUrl = new URL(path, currentUrl) } },
  }
  const sync = new Function('window', `${javascript}; return syncShareableQueryParams`)(browser)

  sync({ start: '2026-08-24', days: '10', calendar: 'none' })
  if (currentUrl.searchParams.get('calendar') !== 'none' || coldLoadDestination(currentUrl.href).answer !== '2026-09-07') {
    throw new Error('Calendar URL contract: switching to none must retain calendar=none and September 7')
  }
  const copiedNoneUrl = currentUrl.href
  if (coldLoadDestination(copiedNoneUrl).answer !== '2026-09-07') {
    throw new Error('Calendar URL contract: copied no-holiday URL changed its answer')
  }

  sync({ calendar: 'us' })
  if (currentUrl.searchParams.get('calendar') !== 'us' || coldLoadDestination(currentUrl.href).answer !== '2026-09-08') {
    throw new Error('Calendar URL contract: switching to US must retain calendar=us and September 8')
  }
}

function requireDate(key) {
  const date = parsePlainDate(key)
  if (!date) throw new Error(`Invalid cold-loaded date: ${key}`)
  return date
}

function weekday(key) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${key}T12:00:00Z`))
}

// Read only the URL inputs that each existing App.tsx calculator cold-loads.
// Calculate with the same exported deterministic engines used by those pages.
function coldLoadDestination(path) {
  const url = new URL(path, 'https://whenisdue.test')
  const params = url.searchParams
  const calendar = params.get('calendar') ?? 'none'

  if (url.pathname === '/deadline-calculator') {
    const state = {
      date: params.get('date'),
      days: Number(params.get('days')),
      unit: params.get('unit') ?? 'business-days',
      direction: params.get('direction') ?? 'after',
      startday: params.get('startday') ?? 'exclude-trigger',
      calendar,
      endrule: params.get('endrule') ?? 'none',
    }
    const calculate = (startDayConvention) => calculateDeadlineByRule({
      triggerDate: requireDate(state.date),
      duration: state.days,
      unit: state.unit,
      direction: state.direction,
      startDayConvention,
      holidayCalendar: state.calendar,
      endDayAdjustment: state.endrule,
    })

    if (state.startday === 'unspecified') {
      const excluded = calculate('exclude-trigger')
      const included = calculate('include-if-qualifying')
      if (!excluded || !included) throw new Error('Unresolved start-day calculation failed')
      return {
        state,
        answer: null,
        alternatives: {
          excluded: toDateKey(excluded.answerDate),
          included: toDateKey(included.answerDate),
        },
        skippedHolidays: [],
      }
    }

    const result = calculate(state.startday)
    if (!result) throw new Error('Deadline calculation failed')
    return {
      state,
      answer: toDateKey(result.answerDate),
      alternatives: null,
      skippedHolidays: result.skippedDates
        .filter((item) => item.reason === 'holiday')
        .map((item) => item.date),
    }
  }

  if (url.pathname === '/business-days-calculator') {
    const state = {
      start: params.get('start'),
      days: Number(params.get('days')),
      calendar,
      direction: 'after',
      startday: 'exclude-trigger',
    }
    const result = calculateBusinessDaysWithCalendar(
      requireDate(state.start), state.days, state.calendar,
    )
    return {
      state,
      answer: toDateKey(result.date),
      alternatives: null,
      skippedHolidays: result.skippedHolidays.map((item) => item.date),
    }
  }

  if (url.pathname === '/invoice-due-date-calculator') {
    const state = {
      date: params.get('date'),
      term: params.get('term') ?? 'net30',
    }
    return {
      state,
      answer: toDateKey(getDueDateForMode('invoice', requireDate(state.date), 0, state.term)),
      alternatives: null,
      skippedHolidays: [],
    }
  }

  if (url.pathname === '/shipping-delivery-range-calculator') {
    const state = {
      start: params.get('start'),
      min: Number(params.get('min')),
      max: Number(params.get('max')),
      mode: params.get('mode') ?? 'business',
      calendar,
    }
    const start = requireDate(state.start)
    const arrival = (days) => calculateBusinessDaysWithCalendar(start, days, state.calendar).date
    if (state.mode !== 'business') throw new Error(`Unsupported QA shipping mode: ${state.mode}`)
    return {
      state,
      answer: null,
      alternatives: {
        earliest: toDateKey(arrival(state.min)),
        latest: toDateKey(arrival(state.max)),
      },
      skippedHolidays: [],
    }
  }

  throw new Error(`Unsupported QA destination: ${url.pathname}`)
}

let passed = 0
const failures = []
const byCategory = new Map()

for (const test of completionQaCorpus) {
  const result = resolveAskWhenCompletion(
    test.query,
    todayKey,
    test.suggestion,
  )

  let ok = result.kind === test.expectedKind
  const reasons = []

  if (!ok) {
    reasons.push(`kind expected ${test.expectedKind}, got ${result.kind}`)
  }

  if (
    test.expectedPathContains &&
    (result.kind !== 'navigate' ||
      !result.path.includes(test.expectedPathContains))
  ) {
    ok = false
    reasons.push(
      `path expected to include ${test.expectedPathContains}, got ${
        result.kind === 'navigate' ? result.path : '(none)'
      }`,
    )
  }

  if (
    test.expectedPathEquals &&
    (result.kind !== 'navigate' || result.path !== test.expectedPathEquals)
  ) {
    ok = false
    reasons.push(
      `path expected exactly ${test.expectedPathEquals}, got ${
        result.kind === 'navigate' ? result.path : '(none)'
      }`,
    )
  }

  if (
    test.expectedPromptContains &&
    (result.kind !== 'missing' ||
      !result.prompt.toLowerCase().includes(
        test.expectedPromptContains.toLowerCase(),
      ))
  ) {
    ok = false
    reasons.push(
      `prompt expected to include "${test.expectedPromptContains}", got ${
        result.kind === 'missing' ? `"${result.prompt}"` : '(none)'
      }`,
    )
  }

  if (result.kind === 'navigate' && test.expectedDestinationState) {
    try {
      const destination = coldLoadDestination(result.path)

      if (!isDeepStrictEqual(destination.state, test.expectedDestinationState)) {
        ok = false
        reasons.push(`cold-loaded state expected ${JSON.stringify(test.expectedDestinationState)}, got ${JSON.stringify(destination.state)}`)
      }

      if (test.expectedAnswer && destination.answer !== test.expectedAnswer) {
        ok = false
        reasons.push(`answer expected ${test.expectedAnswer}, got ${destination.answer}`)
      }

      if (test.expectedWeekday && weekday(destination.answer) !== test.expectedWeekday) {
        ok = false
        reasons.push(`answer weekday expected ${test.expectedWeekday}, got ${weekday(destination.answer)}`)
      }

      if (test.expectedAlternatives) {
        if (destination.answer !== null || !isDeepStrictEqual(destination.alternatives, test.expectedAlternatives)) {
          ok = false
          reasons.push(`alternatives expected ${JSON.stringify(test.expectedAlternatives)} with no single answer, got ${JSON.stringify(destination.alternatives)} / ${destination.answer}`)
        }
      }

      if (test.expectedAlternativeWeekdays) {
        for (const [label, expected] of Object.entries(test.expectedAlternativeWeekdays)) {
          const actual = weekday(destination.alternatives?.[label])
          if (actual !== expected) {
            ok = false
            reasons.push(`${label} weekday expected ${expected}, got ${actual}`)
          }
        }
      }

      if (test.expectedSkippedHoliday && !destination.skippedHolidays.includes(test.expectedSkippedHoliday)) {
        ok = false
        reasons.push(`holiday ${test.expectedSkippedHoliday} was not skipped`)
      }

      if (test.forbiddenPathPrefix && result.path.startsWith(test.forbiddenPathPrefix)) {
        ok = false
        reasons.push(`must not route to ${test.forbiddenPathPrefix}`)
      }

      for (const [field, forbidden] of [
        ['direction', test.forbiddenDirection],
        ['startday', test.forbiddenStartday],
        ['calendar', test.forbiddenCalendar],
      ]) {
        if (forbidden && destination.state[field] === forbidden) {
          ok = false
          reasons.push(`${field} must not silently become ${forbidden}`)
        }
      }
    } catch (error) {
      ok = false
      reasons.push(`cold-load verification failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const stats = byCategory.get(test.category) ?? { total: 0, passed: 0 }
  stats.total += 1

  if (ok) {
    passed += 1
    stats.passed += 1
  } else {
    failures.push({ test, result, reasons })
  }

  byCategory.set(test.category, stats)
}

const total = completionQaCorpus.length
const rate = total ? (passed / total) * 100 : 0

try {
  verifyCalendarUrlReproducibility()
  console.log('Calendar URL reproducibility: PASS')
} catch (error) {
  failures.push({
    test: { category: 'calendar-url-reproducibility', query: 'active calendar URL state' },
    result: { kind: 'verification' },
    reasons: [error instanceof Error ? error.message : String(error)],
  })
  console.log('Calendar URL reproducibility: FAIL')
}

console.log('')
console.log('WHENISDUE COMPLETION FLOW REPORT')
console.log('================================')
console.log(`Flows tested:          ${total}`)
console.log(`Reference:             ${todayKey} (${completionQaReference.timeZone})`)
console.log(`Passed:                ${passed}`)
console.log(`Pass rate:             ${rate.toFixed(1)}%`)
console.log(`Failures:              ${failures.length}`)
console.log('')
console.log('BY CATEGORY')
console.log('-----------')

for (const [category, stats] of [...byCategory.entries()].sort()) {
  const pct = (stats.passed / stats.total) * 100
  console.log(
    `${category.padEnd(24)} ${pct.toFixed(1).padStart(5)}%   ${stats.passed}/${stats.total}`,
  )
}

if (failures.length) {
  console.log('')
  console.log('FAILURES')
  console.log('--------')

  for (const failure of failures) {
    console.log(`• [${failure.test.category}] ${failure.test.query}`)
    if (failure.test.suggestion) {
      console.log(`  suggestion: ${failure.test.suggestion}`)
    }
    for (const reason of failure.reasons) {
      console.log(`  ${reason}`)
    }
    console.log(`  actual: ${JSON.stringify(failure.result)}`)
  }
}

if (process.argv.includes('--strict') && failures.length) {
  process.exitCode = 1
}
