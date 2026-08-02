import type { TypingResult } from './typingTypes'

const storageKey = 'whenisdue.typingHistory.v1'
const maximumResults = 30

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isTypingResult(value: unknown): value is TypingResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const result = value as Partial<TypingResult>

  return (
    typeof result.id === 'string' &&
    typeof result.completedAt === 'string' &&
    (result.durationSeconds === 60 || result.durationSeconds === 180 || result.durationSeconds === 300) &&
    (result.category === 'va-email' || result.category === 'office') &&
    isFiniteNonNegative(result.netWpm) &&
    isFiniteNonNegative(result.rawWpm) &&
    isFiniteNonNegative(result.accuracy) &&
    isFiniteNonNegative(result.correctCharacters) &&
    isFiniteNonNegative(result.incorrectCharacters) &&
    isFiniteNonNegative(result.correctedMistakes) &&
    isFiniteNonNegative(result.uncorrectedMistakes)
  )
}

export function loadTypingHistory(): TypingResult[] {
  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isTypingResult).slice(0, maximumResults)
  } catch {
    return []
  }
}

export function saveTypingResult(result: TypingResult): TypingResult[] {
  const nextHistory = [result, ...loadTypingHistory()].slice(0, maximumResults)

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory))
  } catch {
    return loadTypingHistory()
  }

  return nextHistory
}

export function clearTypingHistory(): void {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Local storage can be unavailable in privacy-restricted browser modes.
  }
}
