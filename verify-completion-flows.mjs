import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'
import { completionQaCorpus } from './completionQaCorpus.mjs'

const helperPath = path.resolve('src/askWhenCompletion.ts')
const source = fs.readFileSync(helperPath, 'utf8')
const js = stripTypeScriptTypes(source, { mode: 'transform' })

const tempPath = path.resolve('.verify-askWhenCompletion.mjs')
fs.writeFileSync(tempPath, js)

let mod
try {
  mod = await import(pathToFileURL(tempPath).href + `?t=${Date.now()}`)
} finally {
  fs.unlinkSync(tempPath)
}

const { resolveAskWhenCompletion } = mod
const todayKey = '2026-08-26'

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

console.log('')
console.log('WHENISDUE COMPLETION FLOW REPORT')
console.log('================================')
console.log(`Flows tested:          ${total}`)
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
