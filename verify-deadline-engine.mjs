import {
  calculateDeadlineByRule,
} from './src/deadlineRules.ts'
import {
  interpretDeadlinePhrase,
  summarizeDeadlineInterpretation,
} from './src/deadlinePhrase.ts'
import {
  parsePlainDate,
  toDateKey,
} from './src/dateHelpers.ts'
import { deadlineEngineQaCorpus } from './deadlineEngineQaCorpus.mjs'

function fail(message) {
  throw new Error(message)
}

function parseDateKey(value, label) {
  const parsed = parsePlainDate(value)
  if (!parsed) fail(`${label}: invalid QA date key "${value}"`)
  return parsed
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function assertArrayIncludes(actual, expected, label) {
  for (const item of expected) {
    if (!actual.includes(item)) {
      fail(`${label}: expected array to include ${JSON.stringify(item)}, got ${JSON.stringify(actual)}`)
    }
  }
}

function assertExactArray(actual, expected, label) {
  if (
    actual.length !== expected.length ||
    actual.some((item, index) => item !== expected[index])
  ) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function buildRuleInput(test) {
  return {
    ...test.input,
    triggerDate: parseDateKey(test.input.triggerDate, test.id),
  }
}

function buildPhraseOptions(test) {
  const source = test.options ?? {}
  const options = { ...source }

  if (source.today) {
    options.today = parseDateKey(source.today, `${test.id} today`)
  }

  return options
}

function verifyRuleTest(test) {
  const answer = calculateDeadlineByRule(buildRuleInput(test))

  if (test.expectNull) {
    assertEqual(answer, null, `${test.id} null result`)
    return
  }

  if (!answer) fail(`${test.id}: expected a DeadlineAnswer, got null`)

  const expected = test.expect ?? {}

  if (expected.answerDate !== undefined) {
    assertEqual(toDateKey(answer.answerDate), expected.answerDate, `${test.id} answerDate`)
  }

  if (expected.ruleVersion !== undefined) {
    assertEqual(answer.ruleVersion, expected.ruleVersion, `${test.id} ruleVersion`)
  }

  if (expected.workingScheduleId !== undefined) {
    assertEqual(
      answer.workingScheduleId,
      expected.workingScheduleId,
      `${test.id} workingScheduleId`,
    )
  }

  if (expected.holidayCalendar !== undefined) {
    assertEqual(
      answer.holidayCalendar,
      expected.holidayCalendar,
      `${test.id} holidayCalendar`,
    )
  }

  if (expected.holidayCalendarVersionPresent) {
    if (
      typeof answer.holidayCalendarVersion !== 'string' ||
      answer.holidayCalendarVersion.trim().length === 0
    ) {
      fail(
        `${test.id} holidayCalendarVersion: expected a non-empty version string, got ${JSON.stringify(
          answer.holidayCalendarVersion,
        )}`,
      )
    }
  }

  const skippedDates = answer.skippedDates.map((item) => item.date)
  const skippedReasons = [...new Set(answer.skippedDates.map((item) => item.reason))]

  if (expected.skippedDates) {
    assertArrayIncludes(skippedDates, expected.skippedDates, `${test.id} skippedDates`)
  }

  if (expected.skippedReasons) {
    assertArrayIncludes(skippedReasons, expected.skippedReasons, `${test.id} skippedReasons`)
  }

  if (expected.skippedHolidayNameIncludes) {
    const names = answer.skippedDates
      .map((item) => item.name ?? '')
      .filter(Boolean)

    if (!names.some((name) => name.includes(expected.skippedHolidayNameIncludes))) {
      fail(
        `${test.id} skipped holiday name: expected one to include ${JSON.stringify(
          expected.skippedHolidayNameIncludes,
        )}, got ${JSON.stringify(names)}`,
      )
    }
  }

  if (expected.finalCandidateDate !== undefined) {
    assertEqual(
      toDateKey(answer.finalDayAdjustment.candidateDate),
      expected.finalCandidateDate,
      `${test.id} final candidate`,
    )
  }

  if (expected.finalAdjustedDate !== undefined) {
    assertEqual(
      toDateKey(answer.finalDayAdjustment.adjustedDate),
      expected.finalAdjustedDate,
      `${test.id} final adjusted`,
    )
  }

  if (expected.finalAdjustmentApplied !== undefined) {
    assertEqual(
      answer.finalDayAdjustment.applied,
      expected.finalAdjustmentApplied,
      `${test.id} final adjustment applied`,
    )
  }

  if (expected.finalBlockedDates) {
    assertArrayIncludes(
      answer.finalDayAdjustment.blockedDates.map((item) => item.date),
      expected.finalBlockedDates,
      `${test.id} final blocked dates`,
    )
  }
}

function verifyPhraseTest(test) {
  const interpretation = interpretDeadlinePhrase(
    test.phrase,
    buildPhraseOptions(test),
  )

  if (test.expectNull) {
    assertEqual(interpretation, null, `${test.id} null interpretation`)
    return
  }

  if (!interpretation) {
    fail(`${test.id}: expected a DeadlinePhraseInterpretation, got null`)
  }

  const summary = summarizeDeadlineInterpretation(interpretation)
  const expected = test.expect ?? {}

  if (expected.classification !== undefined) {
    assertEqual(
      summary.classification,
      expected.classification,
      `${test.id} classification`,
    )
  }

  if ('trigger' in expected) {
    assertEqual(summary.trigger, expected.trigger, `${test.id} trigger`)
  }

  if (expected.triggerEvent !== undefined) {
    assertEqual(
      summary.triggerEvent,
      expected.triggerEvent,
      `${test.id} triggerEvent`,
    )
  }

  if (expected.triggerEventText !== undefined) {
    assertEqual(
      summary.triggerEventText,
      expected.triggerEventText,
      `${test.id} triggerEventText`,
    )
  }

  if (expected.direction !== undefined) {
    assertEqual(summary.direction, expected.direction, `${test.id} direction`)
  }

  if (expected.duration !== undefined) {
    assertEqual(summary.duration, expected.duration, `${test.id} duration`)
  }

  if (expected.unit !== undefined) {
    assertEqual(summary.unit, expected.unit, `${test.id} unit`)
  }

  if ('result' in expected) {
    assertEqual(summary.result, expected.result, `${test.id} result`)
  }

  if (expected.ambiguityIncludes) {
    assertArrayIncludes(
      summary.ambiguities,
      expected.ambiguityIncludes,
      `${test.id} ambiguities`,
    )
  }

  if (expected.exactAmbiguities) {
    assertExactArray(
      summary.ambiguities,
      expected.exactAmbiguities,
      `${test.id} exact ambiguities`,
    )
  }

  if (expected.missingIncludes) {
    assertArrayIncludes(
      summary.missing,
      expected.missingIncludes,
      `${test.id} missing`,
    )
  }
}

let passed = 0
const failures = []
const byLayer = new Map()

for (const test of deadlineEngineQaCorpus) {
  const stats = byLayer.get(test.layer) ?? { total: 0, passed: 0 }
  stats.total += 1

  try {
    if (test.layer === 'rules') {
      verifyRuleTest(test)
    } else if (test.layer === 'phrase') {
      verifyPhraseTest(test)
    } else {
      fail(`${test.id}: unknown QA layer ${JSON.stringify(test.layer)}`)
    }

    passed += 1
    stats.passed += 1
  } catch (error) {
    failures.push({
      id: test.id,
      layer: test.layer,
      description: test.description,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  byLayer.set(test.layer, stats)
}

const total = deadlineEngineQaCorpus.length
const rate = total ? (passed / total) * 100 : 0

console.log('')
console.log('WHENISDUE DEADLINE ENGINE REGRESSION REPORT')
console.log('============================================')
console.log(`Tests:                 ${total}`)
console.log(`Passed:                ${passed}`)
console.log(`Pass rate:             ${rate.toFixed(1)}%`)
console.log(`Failures:              ${failures.length}`)
console.log('')
console.log('BY LAYER')
console.log('--------')

for (const [layer, stats] of [...byLayer.entries()].sort()) {
  const pct = stats.total ? (stats.passed / stats.total) * 100 : 0
  console.log(
    `${layer.padEnd(20)} ${pct.toFixed(1).padStart(5)}%   ${stats.passed}/${stats.total}`,
  )
}

if (failures.length) {
  console.log('')
  console.log('FAILURES')
  console.log('--------')

  for (const failure of failures) {
    console.log(`• [${failure.layer}] ${failure.id}`)
    console.log(`  ${failure.description}`)
    console.log(`  ${failure.message}`)
  }
}

if (process.argv.includes('--strict') && failures.length) {
  process.exitCode = 1
}
