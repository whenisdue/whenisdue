import {
  calculateDeadlineByRule,
  type DeadlineAnswer,
  type DeadlineRuleInput,
} from './deadlineRules.ts'

export type DeadlineStartDayChoice =
  | 'exclude-trigger'
  | 'include-if-qualifying'
  | 'unspecified'

export type DeadlineStartDayComparison = {
  excluded: DeadlineAnswer
  included: DeadlineAnswer
  sameResult: boolean
}

export function compareDeadlineStartDayChoices(
  input: Omit<DeadlineRuleInput, 'startDayConvention'>,
): DeadlineStartDayComparison {
  const excluded = calculateDeadlineByRule({
    ...input,
    startDayConvention: 'exclude-trigger',
  })

  const included = calculateDeadlineByRule({
    ...input,
    startDayConvention: 'include-if-qualifying',
  })

  if (!excluded || !included) {
    throw new Error('Unable to compare start-day conventions.')
  }

  const excludedKey = [
    excluded.answerDate.year,
    excluded.answerDate.month,
    excluded.answerDate.day,
  ].join('-')

  const includedKey = [
    included.answerDate.year,
    included.answerDate.month,
    included.answerDate.day,
  ].join('-')

  return {
    excluded,
    included,
    sameResult: excludedKey === includedKey,
  }
}

export function resolveStartDayConvention(
  choice: DeadlineStartDayChoice,
) {
  return choice === 'unspecified' ? null : choice
}
