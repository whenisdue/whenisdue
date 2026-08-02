export type TypingCategory = 'va-email' | 'office'
export type TestDurationSeconds = 60 | 180 | 300

export type TypingResult = {
  id: string
  completedAt: string
  durationSeconds: TestDurationSeconds
  category: TypingCategory
  netWpm: number
  rawWpm: number
  accuracy: number
  correctCharacters: number
  incorrectCharacters: number
  correctedMistakes: number
  uncorrectedMistakes: number
}

export type CharacterStatus = 'untouched' | 'correct' | 'incorrect' | 'active'
