import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'
import { intentQaCorpus } from './intentQaCorpus.mjs'

const root = process.cwd()
const libraryPath = path.join(root, 'src', 'askWhenIntentLibrary.ts')

async function loadTypeScriptModule(filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  const js = stripTypeScriptTypes(source, { mode: 'transform' })
  const dataUrl =
    'data:text/javascript;base64,' + Buffer.from(js, 'utf8').toString('base64')
  return import(dataUrl)
}

function includesAny(text, needles) {
  const haystack = text.toLowerCase()
  return needles.some((needle) => haystack.includes(needle.toLowerCase()))
}

function suggestionIsUseful(suggestion, expectedAny) {
  return includesAny(suggestion, expectedAny)
}

const library = await loadTypeScriptModule(libraryPath)
const analyze = library.analyzeAskWhenSuggestions

if (typeof analyze !== 'function') {
  throw new Error(
    'askWhenIntentLibrary.ts must export analyzeAskWhenSuggestions(query).',
  )
}

let top1Useful = 0
let top3Useful = 0
let deadEnds = 0
let modeCorrect = 0
let modeChecks = 0
let negativeViolations = 0

const failures = []
const byCategory = new Map()

for (const test of intentQaCorpus) {
  const result = analyze(test.query)
  const suggestions = result.suggestions ?? []
  const top3 = suggestions.slice(0, 3)

  const top1 = suggestions[0] ?? ''
  const top1Pass = Boolean(top1) && suggestionIsUseful(top1, test.expectedAny)
  const top3Pass = top3.some((suggestion) =>
    suggestionIsUseful(suggestion, test.expectedAny),
  )
  const deadEnd = suggestions.length === 0

  if (top1Pass) top1Useful += 1
  if (top3Pass) top3Useful += 1
  if (deadEnd) deadEnds += 1

  let modePass = true
  if (test.expectedMode) {
    modeChecks += 1
    modePass = result.mode === test.expectedMode
    if (modePass) modeCorrect += 1
  }

  let negativePass = true
  if (test.shouldNot?.length) {
    negativePass = !suggestions.some((suggestion) =>
      includesAny(suggestion, test.shouldNot),
    )
    if (!negativePass) negativeViolations += 1
  }

  const category = byCategory.get(test.category) ?? {
    total: 0,
    top3: 0,
    deadEnds: 0,
  }
  category.total += 1
  if (top3Pass) category.top3 += 1
  if (deadEnd) category.deadEnds += 1
  byCategory.set(test.category, category)

  if (!top3Pass || !modePass || !negativePass) {
    failures.push({
      category: test.category,
      query: test.query,
      expectedAny: test.expectedAny,
      expectedMode: test.expectedMode,
      actualMode: result.mode,
      actualLabel: result.label,
      suggestions,
      top3Pass,
      modePass,
      negativePass,
    })
  }
}

const total = intentQaCorpus.length
const pct = (value, denominator = total) =>
  denominator ? ((value / denominator) * 100).toFixed(1) : 'n/a'

console.log('')
console.log('WHENISDUE INTENT COVERAGE REPORT')
console.log('================================')
console.log(`Queries tested:        ${total}`)
console.log(`Top-1 useful:          ${pct(top1Useful)}%`)
console.log(`Top-3 useful:          ${pct(top3Useful)}%`)
console.log(`Dead-end rate:         ${pct(deadEnds)}%`)
console.log(
  `Mode accuracy:         ${modeChecks ? pct(modeCorrect, modeChecks) + '%' : 'n/a'}`,
)
console.log(`Negative violations:   ${negativeViolations}`)
console.log('')

console.log('BY CATEGORY')
console.log('-----------')
for (const [name, stats] of [...byCategory.entries()].sort()) {
  console.log(
    `${name.padEnd(22)} ${pct(stats.top3, stats.total).padStart(6)}% top-3  ` +
      `${String(stats.deadEnds).padStart(3)} dead ends / ${stats.total}`,
  )
}

console.log('')
console.log('TARGETS')
console.log('-------')
console.log('Ship target:       Top-3 useful >= 95%, dead ends < 1%')
console.log('World-class goal:  Top-3 useful >= 98%, dead ends ~= 0%')
console.log('')

if (failures.length) {
  console.log(`FAILURES / REVIEW NEEDED (${failures.length})`)
  console.log('-------------------------')
  for (const failure of failures.slice(0, 60)) {
    console.log(`• [${failure.category}] ${failure.query}`)
    console.log(
      `  expected: ${failure.expectedAny.join(' OR ')}${
        failure.expectedMode ? ` | mode ${failure.expectedMode}` : ''
      }`,
    )
    console.log(
      `  actual:   ${failure.actualMode} / ${failure.actualLabel || '(no label)'}`,
    )
    console.log(
      `  shown:    ${
        failure.suggestions.length
          ? failure.suggestions.join(' | ')
          : '(no suggestions)'
      }`,
    )
  }

  if (failures.length > 60) {
    console.log(`...and ${failures.length - 60} more.`)
  }
}

const strict = process.argv.includes('--strict')
const top3Rate = top3Useful / total
const deadEndRate = deadEnds / total

if (strict && (top3Rate < 0.95 || deadEndRate >= 0.01)) {
  process.exitCode = 1
}
