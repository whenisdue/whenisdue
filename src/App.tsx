import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeAskWhenSuggestions } from './askWhenIntentLibrary'
import { resolveAskWhenCompletion } from './askWhenCompletion'
import './App.css'
import VaWorkspacePage from './va/VaWorkspacePage'
import { DeadlineFinalAdjustmentNotice } from './DeadlineFinalAdjustmentNotice.tsx'
import { buildDeadlineExplanation } from './deadlineExplanation.ts'
import VaTypingTrainerPage from './typing/VaTypingTrainerPage'
import {
  type CalculatorMode,
  type InvoiceTerm,
  type PlainDate,
  addCalendarDays,
  daysBetween,
  formatPlainDate,
  formatWeekday,
  getDueDateForMode,
  getStatusText,
  getTodayPlainDate,
  invoiceTermLabels,
  isDateInSupportedRange,
  modeLabels,
  parseInteger,
  parsePlainDate,
  todayInputValue,
  toDateKey,
} from './dateHelpers'
import {
  type HolidayCalendarId,
  calculateBusinessDaysWithCalendar,
  countBusinessDaysBetweenWithCalendar,
  getHolidayCalendarOption,
  holidayCalendarOptions,
  isHolidayCalendarId,
} from './holidayCalendars'
import {
  calculateBusinessHoursDeadline,
  formatTime12Hour,
  timeToMinutes,
} from './businessHours'
import {
  type PaySchedule,
  calculateNextPayday,
  payScheduleLabel,
} from './payday'
import {
  interpretDeadlinePhrase,
} from './deadlinePhrase'
import {
  calculateDeadlineByRule,
  type EndDayAdjustment,
  type StartDayConvention,
} from './deadlineRules'
import {
  type DeadlineTriggerKind,
  getDeadlineTriggerEvent,
} from './deadlineTrigger.ts'
import { SaveDeadlineRuleButton } from './SaveDeadlineRuleButton.tsx'
import { SavedDeadlineRulesView } from './SavedDeadlineRulesView.tsx'
import {
  type DeadlineRuleProfile,
} from './deadlineRuleProfile.ts'
import {
  recordDeadlineSetupApplied,
} from './deadlineRuleProfileExperiment.ts'
import { getWorkingSchedule } from './workingSchedules.ts'
import { DeadlineProvenanceDetails } from './DeadlineProvenanceDetails.tsx'

type SavedDeadline = {
  id: string
  title: string
  category: CalculatorMode
  dueDate: string
  startDate?: string
  done: boolean
  createdAt: string
}

const storageKey = 'whenisdue.savedDeadlines.v1'
const modes: CalculatorMode[] = ['calendar', 'business', 'invoice', 'trial', 'return']
const invoiceTerms: InvoiceTerm[] = ['net7', 'net15', 'net30', 'net45', 'net60', 'net90', 'eom']
const trialLengthQuickPicks = [7, 14, 30]
const returnWindowQuickPicks = [7, 14, 30, 60, 90]
const titleMaxLength = 80
const positiveWholeNumberMessage = 'Enter a whole number greater than 0.'

type RouteName =
  | 'home'
  | 'calculators'
  | 'business-days'
  | 'business-days-between'
  | 'business-hours-deadline'
  | 'saved-calculations'
  | 'next-payday'
  | 'deadline-calculator'
  | 'start-date-count-guide'
  | 'weekends-business-days-guide'
  | 'public-holidays-business-days-guide'
  | 'shipping-delivery-range'
  | 'two-ten-net-30'
  | 'notice-period'
  | 'subscription-renewal'
  | 'within-days-guide'
  | 'net-30-vs-30-days-guide'
  | 'deadline-weekend-extension-guide'
  | 'three-business-days'
  | 'four-business-days'
  | 'five-business-days'
  | 'seven-business-days'
  | 'eight-business-days'
  | 'ten-business-days'
  | 'twenty-business-days'
  | 'thirty-business-days'
  | 'free-trial'
  | 'return-window'
  | 'invoice-due-date'
  | 'net-7'
  | 'net-15'
  | 'net-30'
  | 'net-45'
  | 'net-60'
  | 'net-90'
  | 'workspace'
  | 'typing'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'not-found'

type NavigationProps = {
  onNavigate: (path: string) => void
}

type BusinessDaysFromTodayPageProps = NavigationProps & {
  dayCount: number
}

function App() {
  const [route, setRoute] = useState<RouteName>(() => getRouteFromPath(window.location.pathname))

  useEffect(() => {
    function handlePopState() {
      setRoute(getRouteFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    applyRouteMetadata(route)
  }, [route])

  function navigate(path: string) {
    window.history.pushState(null, '', path)
    setRoute(getRouteFromPath(new URL(path, window.location.origin).pathname))
    window.scrollTo({ top: 0 })
  }

  if (route === 'calculators') {
    return <CalculatorHubPage onNavigate={navigate} />
  }

  if (route === 'business-days') {
    return <BusinessDaysPage onNavigate={navigate} />
  }

  if (route === 'business-days-between') {
    return <BusinessDaysBetweenPage onNavigate={navigate} />
  }

  if (route === 'business-hours-deadline') {
    return <BusinessHoursDeadlinePage onNavigate={navigate} />
  }

  if (route === 'saved-calculations') {
    return <SavedCalculationsPage onNavigate={navigate} />
  }

  if (route === 'deadline-calculator') {
    return <DeadlineCalculatorPage onNavigate={navigate} />
  }

  if (route === 'start-date-count-guide') {
    return <StartDateCountGuidePage onNavigate={navigate} />
  }

  if (route === 'weekends-business-days-guide') {
    return <WeekendsBusinessDaysGuidePage onNavigate={navigate} />
  }

  if (route === 'public-holidays-business-days-guide') {
    return <PublicHolidaysBusinessDaysGuidePage onNavigate={navigate} />
  }

  if (route === 'shipping-delivery-range') {
    return <ShippingDeliveryRangePage onNavigate={navigate} />
  }

  if (route === 'two-ten-net-30') {
    return <TwoTenNetThirtyPage onNavigate={navigate} />
  }

  if (route === 'notice-period') {
    return <NoticePeriodCalculatorPage onNavigate={navigate} />
  }

  if (route === 'subscription-renewal') {
    return <SubscriptionRenewalCalculatorPage onNavigate={navigate} />
  }

  if (route === 'within-days-guide') {
    return <WithinDaysGuidePage onNavigate={navigate} />
  }

  if (route === 'net-30-vs-30-days-guide') {
    return <NetThirtyVsThirtyDaysGuidePage onNavigate={navigate} />
  }

  if (route === 'deadline-weekend-extension-guide') {
    return <DeadlineWeekendExtensionGuidePage onNavigate={navigate} />
  }

  if (route === 'next-payday') {
    return <NextPaydayPage onNavigate={navigate} />
  }

  if (route === 'three-business-days') {
    return <BusinessDaysFromTodayPage dayCount={3} onNavigate={navigate} />
  }

  if (route === 'four-business-days') {
    return <BusinessDaysFromTodayPage dayCount={4} onNavigate={navigate} />
  }

  if (route === 'five-business-days') {
    return <BusinessDaysFromTodayPage dayCount={5} onNavigate={navigate} />
  }

  if (route === 'seven-business-days') {
    return <BusinessDaysFromTodayPage dayCount={7} onNavigate={navigate} />
  }

  if (route === 'eight-business-days') {
    return <BusinessDaysFromTodayPage dayCount={8} onNavigate={navigate} />
  }

  if (route === 'ten-business-days') {
    return <BusinessDaysFromTodayPage dayCount={10} onNavigate={navigate} />
  }

  if (route === 'twenty-business-days') {
    return <BusinessDaysFromTodayPage dayCount={20} onNavigate={navigate} />
  }

  if (route === 'thirty-business-days') {
    return <BusinessDaysFromTodayPage dayCount={30} onNavigate={navigate} />
  }

  if (route === 'free-trial') {
    return <FreeTrialPage onNavigate={navigate} />
  }

  if (route === 'return-window') {
    return <ReturnWindowPage onNavigate={navigate} />
  }

  if (route === 'invoice-due-date') {
    return <InvoiceDueDatePage onNavigate={navigate} />
  }

  if (route === 'net-7') {
    return <InvoiceTermPage dayCount={7} term="net7" onNavigate={navigate} />
  }

  if (route === 'net-15') {
    return <InvoiceTermPage dayCount={15} term="net15" onNavigate={navigate} />
  }

  if (route === 'net-30') {
    return <InvoiceTermPage dayCount={30} term="net30" onNavigate={navigate} />
  }

  if (route === 'net-45') {
    return <InvoiceTermPage dayCount={45} term="net45" onNavigate={navigate} />
  }

  if (route === 'net-60') {
    return <InvoiceTermPage dayCount={60} term="net60" onNavigate={navigate} />
  }

  if (route === 'net-90') {
    return <InvoiceTermPage dayCount={90} term="net90" onNavigate={navigate} />
  }

  if (route === 'workspace') {
    return <VaWorkspacePage onNavigate={navigate} />
  }

  if (route === 'typing') {
    return <VaTypingTrainerPage onNavigate={navigate} />
  }

  if (route === 'about' || route === 'privacy' || route === 'terms' || route === 'contact') {
    return <StaticPage route={route} onNavigate={navigate} />
  }

  if (route === 'not-found') {
    return <NotFoundPage onNavigate={navigate} />
  }

  return <HomePage onNavigate={navigate} />
}




function getInitialPaySchedule(): PaySchedule {
  const value = new URLSearchParams(window.location.search).get('schedule')
  const allowed: PaySchedule[] = [
    'weekly',
    'biweekly',
    'semimonthly-1-15',
    'semimonthly-15-last',
    'monthly',
  ]
  return allowed.includes(value as PaySchedule)
    ? (value as PaySchedule)
    : 'biweekly'
}



function addCalendarMonthsClamped(date: PlainDate, months: number) {
  const monthIndex = date.month - 1 + months
  const targetYear = date.year + Math.floor(monthIndex / 12)
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonthIndex + 1, 0),
  ).getUTCDate()
  const targetDay = Math.min(date.day, daysInTargetMonth)

  return parsePlainDate(
    `${targetYear}-${String(normalizedMonthIndex + 1).padStart(2, '0')}-${String(
      targetDay,
    ).padStart(2, '0')}`,
  )!
}


function subtractCalendarMonthsClamped(date: PlainDate, months: number) {
  const monthIndex = date.month - 1 - months
  const targetYear = date.year + Math.floor(monthIndex / 12)
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonthIndex + 1, 0),
  ).getUTCDate()
  const targetDay = Math.min(date.day, daysInTargetMonth)

  return parsePlainDate(
    `${targetYear}-${String(normalizedMonthIndex + 1).padStart(2, '0')}-${String(
      targetDay,
    ).padStart(2, '0')}`,
  )!
}


function getLocalUtcOffsetLabel(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60

  return minutes === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`
}


function getDeadlineCalculatorQueryParam(name: string) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function getInitialDeadlineTriggerKind(): DeadlineTriggerKind | null {
  const value = getDeadlineCalculatorQueryParam('trigger')

  if (
    value === 'issued' ||
    value === 'sent' ||
    value === 'received' ||
    value === 'delivered' ||
    value === 'accepted' ||
    value === 'filed' ||
    value === 'served'
  ) {
    return value
  }

  return null
}

function getInitialDeadlineUnit() {
  const value = getDeadlineCalculatorQueryParam('unit')
  return value === 'calendar-days' ? 'calendar-days' : 'business-days'
}

function getInitialDeadlineDirection(): 'after' | 'before' {
  return getDeadlineCalculatorQueryParam('direction') === 'before'
    ? 'before'
    : 'after'
}

function getInitialStartDayConvention(): StartDayConvention {
  return getDeadlineCalculatorQueryParam('startday') === 'include-if-qualifying'
    ? 'include-if-qualifying'
    : 'exclude-trigger'
}

function getInitialStartDayWordingUnspecified() {
  return getDeadlineCalculatorQueryParam('startday') === 'unspecified'
}

function getInitialEndDayAdjustment(): EndDayAdjustment {
  const value = getDeadlineCalculatorQueryParam('endrule')

  if (value === 'next-business-day' || value === 'previous-business-day') {
    return value
  }

  return 'none'
}


function DeadlineCalculatorPage({ onNavigate }: NavigationProps) {
  const [triggerDate, setTriggerDate] = useState(
    () => getDeadlineCalculatorQueryParam('date') ?? todayInputValue(),
  )
  const [duration, setDuration] = useState(
    () => getDeadlineCalculatorQueryParam('days') ?? '5',
  )
  const [unit, setUnit] = useState<'business-days' | 'calendar-days'>(
    getInitialDeadlineUnit,
  )
  const [direction, setDirection] = useState<'after' | 'before'>(
    getInitialDeadlineDirection,
  )
  const [triggerKind, setTriggerKind] =
    useState<DeadlineTriggerKind | null>(
      getInitialDeadlineTriggerKind,
    )
  const [startDayConvention, setStartDayConvention] =
    useState<StartDayConvention>(getInitialStartDayConvention)
  const [startDayWordingUnspecified, setStartDayWordingUnspecified] =
    useState(getInitialStartDayWordingUnspecified)
  const [endDayAdjustment, setEndDayAdjustment] =
    useState<EndDayAdjustment>(getInitialEndDayAdjustment)
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  const parsedTriggerDate = parsePlainDate(triggerDate)
  const parsedDuration = parseInteger(duration)

  const result = useMemo(() => {
    if (!parsedTriggerDate || parsedDuration === null || parsedDuration < 0) {
      return null
    }

    return calculateDeadlineByRule({
      triggerDate: parsedTriggerDate,
      duration: parsedDuration,
      direction,
      unit,
      startDayConvention,
      holidayCalendar,
      endDayAdjustment,
    })
  }, [
    parsedTriggerDate,
    parsedDuration,
    direction,
    unit,
    startDayConvention,
    holidayCalendar,
    endDayAdjustment,
  ])

  const startRuleComparison = useMemo(() => {
    if (!parsedTriggerDate || parsedDuration === null || parsedDuration < 0) {
      return null
    }

    const excluded = calculateDeadlineByRule({
      triggerDate: parsedTriggerDate,
      duration: parsedDuration,
      direction,
      unit,
      startDayConvention: 'exclude-trigger',
      holidayCalendar,
      endDayAdjustment,
    })

    const included = calculateDeadlineByRule({
      triggerDate: parsedTriggerDate,
      duration: parsedDuration,
      direction,
      unit,
      startDayConvention: 'include-if-qualifying',
      holidayCalendar,
      endDayAdjustment,
    })

    if (!excluded || !included) return null

    return {
      excluded: excluded.answerDate,
      included: included.answerDate,
      sameResult:
        toDateKey(excluded.answerDate) === toDateKey(included.answerDate),
    }
  }, [
    parsedTriggerDate,
    parsedDuration,
    direction,
    unit,
    holidayCalendar,
    endDayAdjustment,
  ])

  const holidayOption = getHolidayCalendarOption(holidayCalendar)
  const workingSchedule = result
    ? getWorkingSchedule(result.workingScheduleId)
    : null
  const triggerEvent = triggerKind
    ? getDeadlineTriggerEvent(triggerKind)
    : null
  const cameFromWithinPhrase =
    getDeadlineCalculatorQueryParam('source') === 'within'

  useEffect(() => {
    syncShareableQueryParams({
      date: triggerDate,
      days: duration,
      unit,
      direction,
      startday: startDayWordingUnspecified
        ? 'unspecified'
        : startDayConvention,
      endrule: endDayAdjustment,
      calendar: holidayCalendarQueryValue(holidayCalendar),
      trigger: triggerKind,
      source: cameFromWithinPhrase ? 'within' : null,
    })
  }, [
    triggerDate,
    duration,
    unit,
    direction,
    startDayConvention,
    startDayWordingUnspecified,
    endDayAdjustment,
    holidayCalendar,
    triggerKind,
    cameFromWithinPhrase,
  ])

  function applySavedRule(profile: DeadlineRuleProfile) {
    recordDeadlineSetupApplied(profile.id, triggerDate)
    setDuration(String(profile.duration))
    setDirection(profile.direction)
    setUnit(profile.unit)
    setStartDayConvention(profile.startDayConvention)
    setStartDayWordingUnspecified(false)
    setHolidayCalendar(profile.holidayCalendar)
    setEndDayAdjustment(profile.endDayAdjustment)
    setTriggerKind(profile.triggerKind)
  }

  return (
    <main className="page-shell deadline-rule-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="deadline-answer-hero" aria-label="Deadline calculator answer">
        <p className="deadline-answer-eyebrow">Deadline calculator</p>

        {startDayWordingUnspecified &&
        startRuleComparison &&
        parsedTriggerDate &&
        parsedDuration !== null ? (
          <>
            <h1>The start-day rule changes the answer.</h1>
            <div className="deadline-answer-ambiguity" aria-live="polite">
              <div>
                <span>If the start date does not count</span>
                <strong>{formatWeekday(startRuleComparison.excluded)},</strong>
                <b>{formatPlainDate(startRuleComparison.excluded)}</b>
              </div>
              <div>
                <span>If the start date counts</span>
                <strong>{formatWeekday(startRuleComparison.included)},</strong>
                <b>{formatPlainDate(startRuleComparison.included)}</b>
              </div>
            </div>
            <p className="deadline-answer-context">
              Choose the rule that matches the contract, policy, message, or law that created the deadline.
            </p>
          </>
        ) : result && parsedTriggerDate && parsedDuration !== null ? (
          <>
            <h1>Your deadline is</h1>
            <strong
              className="deadline-answer-date"
              aria-label={`${formatWeekday(result.answerDate)}, ${formatPlainDate(result.answerDate)}`}
            >
              <span className="deadline-answer-weekday">
                {formatWeekday(result.answerDate)},
              </span>
              <span className="deadline-answer-date-main" aria-hidden="true">
                <span className="deadline-answer-month">
                  {
                    [
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ][result.answerDate.month - 1]
                  }
                </span>
                <span className="deadline-answer-day">
                  {result.answerDate.day}
                </span>
                <span className="deadline-answer-comma">,</span>
                <span className="deadline-answer-year">
                  {result.answerDate.year}
                </span>
              </span>
            </strong>
            <p className="deadline-answer-context">
              {parsedDuration} {unit === 'business-days' ? 'business days' : 'calendar days'}{' '}
              {direction === 'after' ? 'after' : 'before'} {formatPlainDate(parsedTriggerDate)}
              {unit === 'business-days' && holidayCalendar !== 'none'
                ? ` · ${holidayOption.shortLabel} holidays skipped`
                : ''}
            </p>
          </>
        ) : (
          <>
            <h1>When is it due?</h1>
            <p className="deadline-answer-context">
              Enter a valid start date and number of days below.
            </p>
          </>
        )}
      </section>

      <section className="deadline-rule-shell">
        {cameFromWithinPhrase ? (
          <div className="deadline-rule-source-note">
            <strong>“Within” needs a counting rule.</strong>
            <span>
              I brought over the date and number for you. Check whether the
              start date counts, then use the rule from the message, policy,
              contract, or law that created the deadline.
            </span>
          </div>
        ) : null}

        <div className="deadline-rule-essential">
          <label>
            <span>Start date</span>
            <input
              type="date"
              value={triggerDate}
              onChange={(event) => setTriggerDate(event.target.value)}
            />
          </label>

          <label>
            <span>How many days?</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>

          <label>
            <span>Direction</span>
            <select
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as 'after' | 'before')
              }
            >
              <option value="after">After the start date</option>
              <option value="before">Before the start date</option>
            </select>
          </label>

          <label>
            <span>Count as</span>
            <select
              value={unit}
              onChange={(event) =>
                setUnit(event.target.value as 'business-days' | 'calendar-days')
              }
            >
              <option value="business-days">Business days</option>
              <option value="calendar-days">Calendar days</option>
            </select>
          </label>
        </div>

        {startDayWordingUnspecified &&
        startRuleComparison &&
        parsedTriggerDate &&
        parsedDuration !== null ? (
          <section
            className="deadline-rule-compare deadline-rule-ambiguity"
            aria-labelledby="deadline-rule-ambiguity-title"
            aria-live="polite"
          >
            <div className="deadline-rule-compare-heading">
              <span>Start-day rule is unclear</span>
              <h2 id="deadline-rule-ambiguity-title">
                The wording doesn’t say whether the start date counts.
              </h2>
            </div>

            <div className="deadline-rule-compare-grid">
              <button
                type="button"
                onClick={() => {
                  setStartDayConvention('exclude-trigger')
                  setStartDayWordingUnspecified(false)
                }}
              >
                <span>If the start date is not counted</span>
                <strong>{formatPlainDate(startRuleComparison.excluded)}</strong>
                <small>Start counting on the next qualifying day.</small>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStartDayConvention('include-if-qualifying')
                  setStartDayWordingUnspecified(false)
                }}
              >
                <span>If the start date counts as day 1</span>
                <strong>{formatPlainDate(startRuleComparison.included)}</strong>
                <small>
                  Count the start date only when it qualifies under the selected
                  rules.
                </small>
              </button>
            </div>

            {startRuleComparison.sameResult ? (
              <p>
                Both interpretations happen to produce the same date here, but
                the original rule should still decide how the start date is
                treated.
              </p>
            ) : (
              <p>
                Check the original policy, contract, or instruction before
                choosing one.
              </p>
            )}
          </section>
        ) : result && parsedTriggerDate && parsedDuration !== null ? (
          <details className="deadline-answer-details">
            <summary>Why this date?</summary>
            <div className="deadline-answer-detail-body">
              <p>{buildDeadlineExplanation(result, triggerKind)}</p>

              <DeadlineFinalAdjustmentNotice answer={result} />

              <CalculationReceipt
                analyticsContext="deadline_rule_calculator"
                rows={[
                  {
                    label: direction === 'before' ? 'Reference event' : 'Clock starts',
                    value: triggerEvent
                      ? `${triggerEvent.label} — ${formatPlainDate(parsedTriggerDate)}`
                      : formatPlainDate(parsedTriggerDate),
                  },
                  {
                    label: 'Direction',
                    value:
                      direction === 'after'
                        ? 'Count forward from the start date'
                        : 'Count backward from the start date',
                  },
                  {
                    label: 'Duration',
                    value: `${parsedDuration} ${
                      unit === 'business-days' ? 'business days' : 'calendar days'
                    }`,
                  },
                  ...(unit === 'business-days' && workingSchedule
                    ? [{ label: 'Working days', value: workingSchedule.label }]
                    : []),
                  {
                    label: 'Start-day rule',
                    value:
                      startDayConvention === 'exclude-trigger'
                        ? 'Start date excluded'
                        : 'Start date included if qualifying',
                  },
                  {
                    label: 'Holiday calendar',
                    value:
                      unit === 'business-days' || endDayAdjustment !== 'none'
                        ? holidayOption.label
                        : 'Not used',
                  },
                  {
                    label: 'Final-day rule',
                    value:
                      endDayAdjustment === 'none'
                        ? 'No adjustment'
                        : endDayAdjustment === 'next-business-day'
                          ? 'Move to next business day'
                          : 'Move to previous business day',
                  },
                  ...(result.skippedDates.length > 0
                    ? [{
                        label: 'Skipped dates',
                        value:
                          result.skippedDates.length === 1
                            ? '1 non-working day skipped'
                            : `${result.skippedDates.length} non-working days skipped`,
                      }]
                    : []),
                ]}
              />
              <DeadlineProvenanceDetails answer={result} />
            </div>
          </details>
        ) : (
          <p className="deadline-rule-error" role="status">
            Enter a valid start date and a whole number of days.
          </p>
        )}

        {cameFromWithinPhrase &&
        startRuleComparison &&
        !startDayWordingUnspecified ? (
          <section className="deadline-rule-compare" aria-labelledby="deadline-rule-compare-title">
            <div className="deadline-rule-compare-heading">
              <span>Compare the start-day rule</span>
              <h2 id="deadline-rule-compare-title">
                Which interpretation matches what you were told?
              </h2>
            </div>

            <div className="deadline-rule-compare-grid">
              <button
                type="button"
                className={
                  startDayConvention === 'exclude-trigger'
                    ? 'is-selected'
                    : undefined
                }
                onClick={() => {
                  setStartDayConvention('exclude-trigger')
                  setStartDayWordingUnspecified(false)
                }}
              >
                <span>Start date does not count</span>
                <strong>{formatPlainDate(startRuleComparison.excluded)}</strong>
                <small>Start counting on the next qualifying day.</small>
              </button>

              <button
                type="button"
                className={
                  startDayConvention === 'include-if-qualifying'
                    ? 'is-selected'
                    : undefined
                }
                onClick={() => {
                  setStartDayConvention('include-if-qualifying')
                  setStartDayWordingUnspecified(false)
                }}
              >
                <span>Start date counts if it qualifies</span>
                <strong>{formatPlainDate(startRuleComparison.included)}</strong>
                <small>
                  Treat the start date as day one when it is a qualifying day.
                </small>
              </button>
            </div>

            {startRuleComparison.sameResult ? (
              <p>
                Both rules happen to produce the same date for this example.
              </p>
            ) : (
              <p>
                Different wording can produce different answers. Use the rule
                from the message, contract, policy, or law that created the
                deadline.
              </p>
            )}
          </section>
        ) : null}

        <details className="deadline-rule-saved">
          <summary>Save or reuse this setup</summary>
          <div className="deadline-rule-saved-body">
            {result &&
            parsedDuration !== null &&
            !startDayWordingUnspecified ? (
              <SaveDeadlineRuleButton
                triggerDateKey={triggerDate}
                triggerKind={triggerKind}
                duration={parsedDuration}
                direction={direction}
                unit={unit}
                startDayConvention={startDayConvention}
                holidayCalendar={holidayCalendar}
                endDayAdjustment={endDayAdjustment}
              />
            ) : null}

            <SavedDeadlineRulesView onUseRule={applySavedRule} />
          </div>
        </details>

        <details className="deadline-rule-advanced">
          <summary>Adjust the counting rules</summary>

          <div className="deadline-rule-advanced-grid">
            <label>
              <span>What starts the clock?</span>
              <select
                value={triggerKind ?? ''}
                onChange={(event) =>
                  setTriggerKind(
                    event.target.value
                      ? (event.target.value as DeadlineTriggerKind)
                      : null,
                  )
                }
              >
                <option value="">Just use the start date</option>
                <option value="issued">Issued</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="delivered">Delivered</option>
                <option value="accepted">Accepted</option>
                <option value="filed">Filed</option>
                <option value="served">Served</option>
              </select>
            </label>

            <label>
              <span>Does the start date count?</span>
              <select
                value={
                  startDayWordingUnspecified
                    ? 'unspecified'
                    : startDayConvention
                }
                onChange={(event) => {
                  if (event.target.value === 'unspecified') {
                    setStartDayWordingUnspecified(true)
                    return
                  }

                  setStartDayConvention(
                    event.target.value as StartDayConvention,
                  )
                  setStartDayWordingUnspecified(false)
                }}
              >
                <option value="exclude-trigger">
                  No — start counting after it
                </option>
                <option value="include-if-qualifying">
                  Yes — if that day qualifies
                </option>
                <option value="unspecified">
                  The wording doesn’t say
                </option>
              </select>
            </label>

            {unit === 'business-days' || endDayAdjustment !== 'none' ? (
              <label>
                <span>Public holidays</span>
                <select
                  value={holidayCalendar}
                  onChange={(event) => {
                    const nextCalendar = event.target.value as HolidayCalendarId
                    setHolidayCalendar(nextCalendar)
                    saveHolidayCalendar(nextCalendar)
                  }}
                >
                  {holidayCalendarOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label>
              <span>If the final date is not a business day</span>
              <select
                value={endDayAdjustment}
                onChange={(event) =>
                  setEndDayAdjustment(
                    event.target.value as EndDayAdjustment,
                  )
                }
              >
                <option value="none">Do not adjust it</option>
                <option value="next-business-day">
                  Move to the next business day
                </option>
                <option value="previous-business-day">
                  Move to the previous business day
                </option>
              </select>
            </label>
          </div>
        </details>

        <p className="deadline-rule-caveat">
          Use the rule in the contract, policy, law, or message that created the
          deadline. WhenIsDue shows the result for the rules you select.{' '}
          <a
            href="/does-the-start-date-count"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/does-the-start-date-count')
            }}
          >
            Does the start date count?
          </a>
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .deadline-rule-page {
          --deadline-ink: #153557;
          --deadline-muted: #64798d;
          --deadline-accent: #2d7b64;
          --deadline-field: #eadfd8;
          --deadline-field-soft: #f3ebe6;
          min-height: 100vh;
          background: #fffaf2;
        }

        .deadline-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 53, 87, 0.12);
        }

        .deadline-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .deadline-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .deadline-answer-hero,
        .deadline-rule-shell {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .deadline-answer-hero {
          margin-top: 22px;
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 38px;
          border: 1px solid rgba(91, 61, 48, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--deadline-field);
          text-align: center;
        }

        .deadline-answer-eyebrow {
          margin: 0;
          color: var(--deadline-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .deadline-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--deadline-ink);
          font-size: clamp(2.7rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .deadline-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 26px;
          color: var(--deadline-ink);
          font-weight: 900;
        }

        .deadline-answer-weekday {
          color: #355f77;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .deadline-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .deadline-answer-month,
        .deadline-answer-day,
        .deadline-answer-comma,
        .deadline-answer-year {
          display: inline;
        }

        .deadline-answer-comma {
          margin-left: -0.08em;
        }

        .deadline-answer-context {
          max-width: 720px;
          margin: 18px auto 0;
          color: var(--deadline-muted);
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .deadline-answer-ambiguity {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          max-width: 820px;
          margin: 26px auto 0;
        }

        .deadline-answer-ambiguity > div {
          padding: 18px;
          border: 1px solid rgba(21, 53, 87, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
        }

        .deadline-answer-ambiguity span,
        .deadline-answer-ambiguity strong,
        .deadline-answer-ambiguity b {
          display: block;
        }

        .deadline-answer-ambiguity span {
          color: #61768a;
          font-size: 0.84rem;
          font-weight: 900;
        }

        .deadline-answer-ambiguity strong {
          margin-top: 10px;
          color: #355f77;
          font-size: 1.25rem;
        }

        .deadline-answer-ambiguity b {
          margin-top: 3px;
          color: var(--deadline-ink);
          font-size: clamp(1.6rem, 3vw, 2.45rem);
          letter-spacing: -0.035em;
        }

        .deadline-rule-shell {
          margin-top: 0;
          padding: 22px 24px 42px;
          border: 1px solid rgba(91, 61, 48, 0.12);
          border-top: 1px solid rgba(91, 61, 48, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--deadline-field-soft);
        }

        .deadline-rule-source-note {
          display: grid;
          gap: 4px;
          margin: 0 0 16px;
          padding: 13px 14px;
          border: 1px solid rgba(183, 121, 31, 0.2);
          border-radius: 12px;
          background: #fffaf0;
          color: #6f5220;
          text-align: left;
        }

        .deadline-rule-source-note strong {
          font-size: 1rem;
        }

        .deadline-rule-source-note span {
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .deadline-rule-essential {
          display: grid;
          grid-template-columns: 1.25fr 0.8fr 1fr 1fr;
          gap: 12px;
          padding: 18px;
          border: 1px solid rgba(21, 53, 87, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.58);
        }

        .deadline-rule-essential label,
        .deadline-rule-advanced-grid label {
          display: grid;
          gap: 7px;
        }

        .deadline-rule-essential label > span,
        .deadline-rule-advanced-grid label > span {
          color: #526a82;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .deadline-rule-essential input,
        .deadline-rule-essential select,
        .deadline-rule-advanced-grid select {
          min-height: 50px;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(21, 53, 87, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .deadline-answer-details,
        .deadline-rule-saved,
        .deadline-rule-advanced {
          margin-top: 12px;
          border: 1px solid rgba(21, 53, 87, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.7);
        }

        .deadline-answer-details summary,
        .deadline-rule-saved summary,
        .deadline-rule-advanced summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .deadline-answer-detail-body {
          padding: 0 14px 16px;
        }

        .deadline-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .deadline-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .deadline-rule-saved-body {
          padding: 0 14px 14px;
        }

        .deadline-rule-saved-body .saved-deadline-rules,
        .deadline-rule-saved-body .saved-deadline-rules-view {
          margin-top: 12px;
        }

        .deadline-rule-compare {
          margin-top: 14px;
          padding: 18px;
          border: 1px solid rgba(183, 121, 31, 0.16);
          border-radius: 16px;
          background: #fffdf8;
        }

        .deadline-rule-compare-heading {
          text-align: center;
        }

        .deadline-rule-compare-heading > span {
          color: #8a6a2c;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .deadline-rule-compare-heading h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.12rem;
        }

        .deadline-rule-compare-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .deadline-rule-compare-grid button {
          display: grid;
          gap: 5px;
          min-height: 122px;
          padding: 14px;
          border: 1px solid rgba(21, 53, 87, 0.1);
          border-radius: 13px;
          background: #fff;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .deadline-rule-compare-grid button.is-selected {
          border-color: rgba(29, 79, 130, 0.32);
          box-shadow: 0 0 0 2px rgba(29, 79, 130, 0.08);
        }

        .deadline-rule-compare-grid button > span {
          color: #526a82;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .deadline-rule-compare-grid button > strong {
          color: #17304d;
          font-size: 1.2rem;
        }

        .deadline-rule-compare-grid button > small {
          color: #6d8196;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .deadline-rule-compare > p {
          max-width: 680px;
          margin: 12px auto 0;
          color: #6f5220;
          font-size: 0.94rem;
          line-height: 1.5;
          text-align: center;
        }

        .deadline-rule-advanced-grid {
          display: grid;
          gap: 12px;
          padding: 0 14px 16px;
        }

        .deadline-rule-caveat,
        .deadline-rule-error {
          max-width: 700px;
          margin: 15px auto 0;
          color: #657b91;
          font-size: 0.92rem;
          line-height: 1.5;
          text-align: center;
        }

        @media (max-width: 900px) and (min-width: 721px) {
          .deadline-rule-essential {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .business-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(3rem, 13.5vw, 4.45rem);
            line-height: 0.9;
            white-space: normal;
          }

          .business-answer-month,
          .business-answer-day,
          .business-answer-year {
            display: block;
          }

          .business-answer-comma {
            display: none;
          }

          .deadline-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .deadline-answer-brand img {
            width: 154px;
          }

          .deadline-answer-hero,
          .deadline-rule-shell {
            width: min(100% - 24px, 680px);
          }

          .deadline-answer-hero {
            margin-top: 14px;
            padding: 28px 20px 26px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .deadline-answer-hero h1 {
            font-size: clamp(2.65rem, 12vw, 4rem);
          }

          .deadline-answer-date {
            justify-items: start;
            margin-top: 22px;
          }

          .deadline-answer-weekday {
            font-size: clamp(2.3rem, 10vw, 3.2rem);
          }

          .deadline-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(3.05rem, 14vw, 4.6rem);
            line-height: 0.9;
            white-space: normal;
          }

          .deadline-answer-month,
          .deadline-answer-day,
          .deadline-answer-year {
            display: block;
          }

          .deadline-answer-comma {
            display: none;
          }

          .deadline-answer-context {
            margin-left: 0;
            margin-right: 0;
          }

          .deadline-answer-ambiguity {
            grid-template-columns: 1fr;
          }

          .deadline-rule-shell {
            padding: 16px 16px 34px;
            border-radius: 0 0 24px 24px;
          }

          .deadline-rule-essential {
            grid-template-columns: minmax(0, 1.35fr) minmax(100px, 0.65fr);
            gap: 10px;
            padding: 14px;
          }

          .deadline-rule-essential label {
            min-width: 0;
          }

          .deadline-rule-essential label:first-child,
          .deadline-rule-essential label:nth-child(2),
          .deadline-rule-essential label:nth-child(3),
          .deadline-rule-essential label:nth-child(4) {
            grid-column: auto;
          }

          .deadline-rule-essential label:nth-child(3),
          .deadline-rule-essential label:nth-child(4) {
            grid-column: span 1;
          }

          .deadline-rule-essential label > span {
            font-size: 0.78rem;
          }

          .deadline-rule-essential input,
          .deadline-rule-essential select {
            min-height: 46px;
            padding: 8px 9px;
            font-size: 0.88rem;
          }

          .deadline-rule-compare-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 430px) {
          .deadline-rule-essential {
            grid-template-columns: minmax(0, 1.25fr) minmax(92px, 0.75fr);
            gap: 8px;
            padding: 12px;
          }

          .deadline-rule-essential label:nth-child(3),
          .deadline-rule-essential label:nth-child(4) {
            grid-column: 1 / -1;
          }

          .deadline-rule-essential input,
          .deadline-rule-essential select {
            min-height: 44px;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </main>
  )
}


function StartDateCountGuidePage({ onNavigate }: NavigationProps) {
  const exampleStart = parsePlainDate('2026-08-10')!
  const excluded = calculateDeadlineByRule({
    triggerDate: exampleStart,
    duration: 5,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })
  const included = calculateDeadlineByRule({
    triggerDate: exampleStart,
    duration: 5,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'include-if-qualifying',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const calculatorPath =
    '/deadline-calculator?date=2026-08-10&days=5&unit=business-days&direction=after&startday=unspecified'

  return (
    <main className="page-shell start-date-answer-page">
      <header className="start-date-answer-header" aria-label="WhenIsDue navigation">
        <a
          className="start-date-answer-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <article className="start-date-answer-shell">
        <section className="start-date-answer-hero" aria-labelledby="start-date-count-title">
          <p className="start-date-answer-eyebrow">Deadline counting guide</p>
          <h1 id="start-date-count-title">Does the start date count?</h1>

          <div className="start-date-answer-primary">
            <strong>Usually no — unless the rule says to count it.</strong>
            <p>
              If the wording says <b>“5 business days after August 10”</b>,
              August 10 is the reference date and counting normally begins
              with the next qualifying day.
            </p>
          </div>

          <p className="start-date-answer-context">
            If the rule says August 10 is day one, count it instead. If the
            wording is unclear, check the original rule.
          </p>
        </section>

        <section
          className="start-date-answer-example"
          aria-labelledby="start-date-answer-example-title"
        >
          <div className="start-date-answer-example-heading">
            <span>Same start date. Two rules.</span>
            <h2 id="start-date-answer-example-title">
              August 10, 2026 + 5 business days
            </h2>
            <p>Monday–Friday only. Public holidays are not excluded.</p>
          </div>

          <div className="start-date-answer-results">
            <article>
              <span>Start date does not count</span>
              <strong>
                {excluded ? formatPlainDate(excluded.answerDate) : '—'}
              </strong>
              <small>{excluded ? formatWeekday(excluded.answerDate) : ''}</small>
              <p>Counting begins with the next qualifying business day.</p>
            </article>

            <article>
              <span>Start date counts as day 1</span>
              <strong>
                {included ? formatPlainDate(included.answerDate) : '—'}
              </strong>
              <small>{included ? formatWeekday(included.answerDate) : ''}</small>
              <p>August 10 is day 1 because it is a Monday.</p>
            </article>
          </div>

          <a
            className="start-date-answer-cta"
            href={calculatorPath}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'start_date_count',
              })
              onNavigate(calculatorPath)
            }}
          >
            Check your exact deadline
          </a>
        </section>

        <details className="start-date-answer-details">
          <summary>When does the start date count?</summary>
          <div className="start-date-answer-detail-body">
            <p>
              It counts when the governing wording explicitly says the
              triggering date is day one, or otherwise tells you to include it.
              If the wording says a number of days <b>after</b> an event or
              date, the triggering date is normally treated as the reference
              point rather than the first counted day.
            </p>
          </div>
        </details>

        <details className="start-date-answer-details">
          <summary>What if the wording is unclear?</summary>
          <div className="start-date-answer-detail-body">
            <p>
              Phrases such as “within 5 business days of” or “5 business days
              from” can leave the start-day convention unstated. In that case,
              do not silently assume one interpretation. Check the contract,
              policy, notice, law, court rule, or instruction that created the
              deadline.
            </p>
          </div>
        </details>

        <details className="start-date-answer-details">
          <summary>Why can one day change the result?</summary>
          <div className="start-date-answer-detail-body">
            <p>
              Including the start date can shift a calendar-day result by one
              day. With business days, weekends and selected holidays can make
              the difference look larger on the calendar.
            </p>
          </div>
        </details>

        <section className="start-date-answer-related" aria-label="Related tools">
          <div>
            <span>Related answers</span>
            <h2>Make the counting rule explicit</h2>
          </div>

          <nav>
            <a
              href="/deadline-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/deadline-calculator')
              }}
            >
              Deadline calculator
            </a>
            <a
              href="/do-weekends-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-weekends-count-as-business-days')
              }}
            >
              Do weekends count as business days?
            </a>
            <a
              href="/do-public-holidays-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-public-holidays-count-as-business-days')
              }}
            >
              Do public holidays count as business days?
            </a>
            <a
              href="/business-days-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/business-days-calculator')
              }}
            >
              Business days calculator
            </a>
          </nav>
        </section>
      </article>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The original rule controls how a deadline should be counted."
      />

      <style>{`
        .start-date-answer-page {
          --start-ink: #173353;
          --start-muted: #65778d;
          --start-accent: #2f7862;
          --start-field: #ece7f1;
          --start-field-soft: #f4f0f6;
          min-height: 100vh;
          background: #fffaf2;
        }

        .start-date-answer-header {
          width: min(100% - 32px, 1080px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(23, 51, 83, 0.12);
        }

        .start-date-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .start-date-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .start-date-answer-shell {
          width: min(100% - 32px, 1080px);
          margin: 22px auto 0;
          padding-bottom: 64px;
        }

        .start-date-answer-hero {
          padding: clamp(40px, 6vw, 66px) clamp(24px, 5vw, 58px) 38px;
          border: 1px solid rgba(77, 58, 95, 0.12);
          border-radius: 28px;
          background: var(--start-field);
          text-align: center;
        }

        .start-date-answer-eyebrow {
          margin: 0;
          color: var(--start-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .start-date-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--start-ink);
          font-size: clamp(2.8rem, 6vw, 5.25rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .start-date-answer-primary {
          max-width: 820px;
          margin: 28px auto 0;
        }

        .start-date-answer-primary strong {
          display: block;
          color: var(--start-ink);
          font-size: clamp(2rem, 4.1vw, 3.6rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
          text-wrap: balance;
        }

        .start-date-answer-primary p {
          max-width: 760px;
          margin: 16px auto 0;
          color: #50687f;
          font-size: clamp(1rem, 1.7vw, 1.12rem);
          line-height: 1.62;
        }

        .start-date-answer-primary b {
          color: #2c4864;
        }

        .start-date-answer-context {
          max-width: 700px;
          margin: 18px auto 0;
          color: var(--start-muted);
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .start-date-answer-example {
          margin-top: 18px;
          padding: 24px;
          border: 1px solid rgba(77, 58, 95, 0.11);
          border-radius: 22px;
          background: var(--start-field-soft);
        }

        .start-date-answer-example-heading {
          text-align: center;
        }

        .start-date-answer-example-heading > span,
        .start-date-answer-related > div > span {
          color: #6f5f85;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .start-date-answer-example-heading h2,
        .start-date-answer-related h2 {
          margin: 6px 0 0;
          color: var(--start-ink);
          font-size: clamp(1.35rem, 2.8vw, 2rem);
          letter-spacing: -0.025em;
        }

        .start-date-answer-example-heading p {
          margin: 7px 0 0;
          color: var(--start-muted);
          font-size: 0.93rem;
        }

        .start-date-answer-results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .start-date-answer-results article {
          min-width: 0;
          padding: 20px;
          border: 1px solid rgba(23, 51, 83, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.82);
          text-align: center;
        }

        .start-date-answer-results span {
          display: block;
          color: #5a7087;
          font-size: 0.86rem;
          font-weight: 900;
        }

        .start-date-answer-results strong {
          display: block;
          margin-top: 9px;
          color: var(--start-ink);
          font-size: clamp(2rem, 4vw, 3.35rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .start-date-answer-results small {
          display: block;
          margin-top: 6px;
          color: #64798f;
          font-size: 0.96rem;
          font-weight: 800;
        }

        .start-date-answer-results p {
          margin: 11px 0 0;
          color: #687b90;
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .start-date-answer-cta {
          width: fit-content;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 18px auto 0;
          padding: 10px 18px;
          border-radius: 11px;
          background: #1f7159;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
        }

        .start-date-answer-example > .start-date-answer-cta {
          display: flex;
        }

        .start-date-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(23, 51, 83, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
        }

        .start-date-answer-details summary {
          min-height: 52px;
          display: flex;
          align-items: center;
          padding: 11px 15px;
          color: #294863;
          font-size: 1rem;
          font-weight: 900;
          cursor: pointer;
        }

        .start-date-answer-detail-body {
          padding: 0 15px 16px;
        }

        .start-date-answer-detail-body p {
          max-width: 800px;
          margin: 0;
          color: #62778c;
          font-size: 0.96rem;
          line-height: 1.62;
        }

        .start-date-answer-related {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid rgba(23, 51, 83, 0.1);
        }

        .start-date-answer-related nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .start-date-answer-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(23, 51, 83, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4e6880;
          font-size: 0.87rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 720px) {
          .start-date-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .start-date-answer-brand img {
            width: 154px;
          }

          .start-date-answer-shell {
            width: min(100% - 24px, 680px);
            margin-top: 14px;
          }

          .start-date-answer-hero {
            padding: 26px 20px 24px;
            border-radius: 24px;
            text-align: left;
          }

          .start-date-answer-hero h1 {
            font-size: clamp(2.7rem, 12vw, 4rem);
          }

          .start-date-answer-primary {
            margin-top: 24px;
          }

          .start-date-answer-primary strong {
            font-size: clamp(2.15rem, 10vw, 3.25rem);
            line-height: 1.02;
          }

          .start-date-answer-primary p,
          .start-date-answer-context {
            margin-left: 0;
            margin-right: 0;
          }

          .start-date-answer-example {
            padding: 18px;
            border-radius: 20px;
          }

          .start-date-answer-example-heading {
            text-align: left;
          }

          .start-date-answer-results {
            grid-template-columns: 1fr;
          }

          .start-date-answer-results article {
            text-align: left;
          }

          .start-date-answer-results strong {
            font-size: clamp(2.35rem, 11vw, 3.4rem);
          }

          .start-date-answer-example > .start-date-answer-cta {
            width: 100%;
          }

          .start-date-answer-related nav {
            display: grid;
            grid-template-columns: 1fr;
          }

          .start-date-answer-related a {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  )
}

function WeekendsBusinessDaysGuidePage({ onNavigate }: NavigationProps) {
  const friday = parsePlainDate('2026-08-14')!

  const oneBusinessDay = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const oneCalendarDay = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const calculatorPath =
    '/deadline-calculator?date=2026-08-14&days=1&unit=business-days&direction=after&startday=exclude-trigger'

  return (
    <main className="page-shell weekends-zero-page">
      <header className="weekends-zero-header" aria-label="WhenIsDue navigation">
        <a
          className="weekends-zero-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <article className="weekends-zero-shell">
        <header className="weekends-zero-hero">
          <p className="weekends-zero-eyebrow">Business-day guide</p>

          <h1>Do weekends count as business days?</h1>

          <strong className="weekends-zero-answer">Usually no.</strong>

          <p className="weekends-zero-summary">
            Saturday and Sunday are normally skipped when a deadline is stated
            in business days.
          </p>

          <p className="weekends-zero-caveat">
            If a contract, policy, law, employer, or other source defines
            “business day” differently, use that definition.
          </p>
        </header>

        <section
          className="weekends-zero-example"
          aria-labelledby="weekends-zero-example-title"
        >
          <div className="weekends-zero-example-heading">
            <p className="weekends-zero-section-eyebrow">Quick example</p>
            <h2 id="weekends-zero-example-title">
              Start on Friday, August 14, 2026
            </h2>
          </div>

          <div className="weekends-zero-example-grid">
            <article className="is-business">
              <span>+ 1 business day</span>
              <strong>
                {oneBusinessDay
                  ? `${formatWeekday(oneBusinessDay.answerDate)}, ${formatPlainDate(
                      oneBusinessDay.answerDate,
                    )}`
                  : '—'}
              </strong>
              <p>Saturday and Sunday are skipped.</p>
            </article>

            <article>
              <span>+ 1 calendar day</span>
              <strong>
                {oneCalendarDay
                  ? `${formatWeekday(oneCalendarDay.answerDate)}, ${formatPlainDate(
                      oneCalendarDay.answerDate,
                    )}`
                  : '—'}
              </strong>
              <p>Calendar-day counting includes Saturday.</p>
            </article>
          </div>

          <a
            className="weekends-zero-cta"
            href={calculatorPath}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'weekends_business_days',
              })
              onNavigate(calculatorPath)
            }}
          >
            Check your exact deadline
          </a>
        </section>

        <section className="weekends-zero-details">
          <details>
            <summary>What counts as a business day?</summary>
            <div>
              <p>
                In WhenIsDue’s standard business-day schedule, Monday through
                Friday are working days and Saturday and Sunday are not.
              </p>
              <p>
                A selected public-holiday calendar can exclude supported
                holidays as well.
              </p>
            </div>
          </details>

          <details>
            <summary>Do public holidays count?</summary>
            <div>
              <p>
                Weekends and public holidays are separate rules. A calculator
                can skip weekends while still counting a weekday public holiday
                unless a holiday calendar or governing rule says to exclude it.
              </p>
            </div>
          </details>

          <details>
            <summary>What if the deadline itself lands on a weekend?</summary>
            <div>
              <p>
                Do not automatically move it unless the rule that created the
                deadline says to do so. Some rules move the date forward, some
                move it backward, and some leave the calendar date unchanged.
              </p>
            </div>
          </details>

          <details>
            <summary>Business days vs calendar days</summary>
            <div>
              <p>
                <strong>Business days</strong> count only qualifying working
                days under the applicable schedule and holiday rules.
              </p>
              <p>
                <strong>Calendar days</strong> count every date, including
                Saturdays and Sundays, unless another rule changes the final
                date.
              </p>
            </div>
          </details>
        </section>

        <section
          className="weekends-zero-related"
          aria-label="Related deadline guides and tools"
        >
          <div>
            <p className="weekends-zero-section-eyebrow">Related answers</p>
            <h2>Need a different counting rule?</h2>
          </div>

          <nav>
            <a
              href="/do-public-holidays-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-public-holidays-count-as-business-days')
              }}
            >
              Do public holidays count?
            </a>

            <a
              href="/does-the-start-date-count"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/does-the-start-date-count')
              }}
            >
              Does the start date count?
            </a>

            <a
              href="/business-days-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/business-days-calculator')
              }}
            >
              Business days calculator
            </a>

            <a
              href="/deadline-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/deadline-calculator')
              }}
            >
              Deadline calculator
            </a>
          </nav>
        </section>
      </article>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Check the definition and adjustment rules that apply to your deadline."
      />

      <style>{`
        .weekends-zero-page {
          --weekends-ink: #153654;
          --weekends-muted: #667b8e;
          --weekends-accent: #2d7b64;
          --weekends-field: #edf0df;
          min-height: 100vh;
          background: #fffaf2;
        }

        .weekends-zero-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .weekends-zero-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .weekends-zero-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .weekends-zero-shell {
          width: min(100% - 32px, 1100px);
          margin: 22px auto 0;
        }

        .weekends-zero-hero {
          padding: clamp(38px, 5vw, 60px) clamp(24px, 6vw, 70px) 36px;
          border: 1px solid rgba(79, 95, 48, 0.12);
          border-radius: 28px;
          background: var(--weekends-field);
          text-align: center;
        }

        .weekends-zero-eyebrow,
        .weekends-zero-section-eyebrow {
          margin: 0;
          color: var(--weekends-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .weekends-zero-hero h1 {
          max-width: 900px;
          margin: 10px auto 0;
          color: var(--weekends-ink);
          font-size: clamp(3rem, 6vw, 5.4rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .weekends-zero-answer {
          display: block;
          margin-top: 28px;
          color: var(--weekends-ink);
          font-size: clamp(4rem, 10vw, 8.2rem);
          font-weight: 950;
          line-height: 0.88;
          letter-spacing: -0.06em;
        }

        .weekends-zero-summary {
          max-width: 760px;
          margin: 22px auto 0;
          color: #3f657b;
          font-size: clamp(1.35rem, 2.6vw, 2rem);
          font-weight: 850;
          line-height: 1.25;
        }

        .weekends-zero-caveat {
          max-width: 720px;
          margin: 15px auto 0;
          color: var(--weekends-muted);
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .weekends-zero-example {
          margin-top: 16px;
          padding: 20px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 20px;
          background: #f8f8f3;
        }

        .weekends-zero-example-heading {
          text-align: center;
        }

        .weekends-zero-example-heading h2,
        .weekends-zero-related h2 {
          margin: 5px 0 0;
          color: var(--weekends-ink);
          font-size: clamp(1.45rem, 2.6vw, 2.1rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .weekends-zero-example-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 840px;
          margin: 16px auto 0;
        }

        .weekends-zero-example-grid article {
          padding: 17px 18px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 15px;
          background: #fff;
        }

        .weekends-zero-example-grid article.is-business {
          border-color: rgba(45, 123, 100, 0.26);
          background: #e7f2ec;
        }

        .weekends-zero-example-grid span {
          display: block;
          color: #5d7287;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .weekends-zero-example-grid strong {
          display: block;
          margin-top: 7px;
          color: var(--weekends-ink);
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          line-height: 1.16;
        }

        .weekends-zero-example-grid p {
          margin: 8px 0 0;
          color: #667b8e;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .weekends-zero-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px auto 0;
          padding: 9px 16px;
          border-radius: 11px;
          background: #267357;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
        }

        .weekends-zero-details {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .weekends-zero-details details {
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .weekends-zero-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .weekends-zero-details details > div {
          padding: 0 14px 16px;
        }

        .weekends-zero-details p {
          max-width: 780px;
          margin: 0;
          color: #61768a;
          line-height: 1.58;
        }

        .weekends-zero-details p + p {
          margin-top: 10px;
        }

        .weekends-zero-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #eff2e6;
        }

        .weekends-zero-related nav {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .weekends-zero-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.86rem;
          font-weight: 850;
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .ask-when-suggestion-grid {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(3, 44px);
            min-height: 148px;
          }

          .ask-when-suggestion-grid button:nth-child(4) {
            display: none;
          }

          .weekends-zero-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .weekends-zero-brand img {
            width: 154px;
          }

          .weekends-zero-shell {
            width: min(100% - 24px, 680px);
            margin-top: 12px;
          }

          .weekends-zero-hero {
            padding: 22px 20px 20px;
            border-radius: 24px;
            text-align: left;
          }

          .weekends-zero-hero h1 {
            margin-top: 8px;
            font-size: clamp(2.2rem, 10vw, 3.25rem);
            line-height: 0.98;
          }

          .weekends-zero-answer {
            margin-top: 20px;
            font-size: clamp(4rem, 20vw, 6.3rem);
          }

          .weekends-zero-summary {
            margin-top: 16px;
            font-size: clamp(1.25rem, 5.8vw, 1.7rem);
            line-height: 1.22;
          }

          .weekends-zero-caveat {
            margin-top: 12px;
            font-size: 0.86rem;
            line-height: 1.45;
          }

          .weekends-zero-example {
            padding: 16px;
          }

          .weekends-zero-example-heading {
            text-align: left;
          }

          .weekends-zero-example-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .weekends-zero-cta {
            width: 100%;
          }

          .weekends-zero-related {
            padding: 18px;
          }

          .weekends-zero-related nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
function PublicHolidaysBusinessDaysGuidePage({ onNavigate }: NavigationProps) {
  const friday = parsePlainDate('2026-09-04')!
  const noHolidayCalendar = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })
  const usHolidayCalendar = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'us',
    endDayAdjustment: 'none',
  })

  return (
    <main className="page-shell holidays-zero-page">
      <header className="holidays-zero-header" aria-label="WhenIsDue navigation">
        <a
          className="holidays-zero-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <article className="holidays-zero-shell">
        <header className="holidays-zero-hero">
          <p className="holidays-zero-eyebrow">Business-day guide</p>
          <h1>Do public holidays count as business days?</h1>
          <strong className="holidays-zero-answer">It depends.</strong>
          <p className="holidays-zero-summary">
            A weekday public holiday counts unless the rule or calendar you are
            using says to exclude it.
          </p>
        </header>

        <section className="holidays-zero-example" aria-labelledby="holidays-example-title">
          <div className="holidays-zero-example-heading">
            <p className="holidays-zero-section-eyebrow">Quick example</p>
            <h2 id="holidays-example-title">
              Start Friday, September 4 + 1 business day
            </h2>
          </div>

          <div className="holidays-zero-example-grid">
            <article>
              <span>No holiday calendar</span>
              <strong>
                {noHolidayCalendar
                  ? `${formatWeekday(noHolidayCalendar.answerDate)}, ${formatPlainDate(noHolidayCalendar.answerDate)}`
                  : '—'}
              </strong>
              <p>The holiday itself is treated like an ordinary weekday.</p>
            </article>

            <article className="is-holiday-aware">
              <span>US federal holidays excluded</span>
              <strong>
                {usHolidayCalendar
                  ? `${formatWeekday(usHolidayCalendar.answerDate)}, ${formatPlainDate(usHolidayCalendar.answerDate)}`
                  : '—'}
              </strong>
              <p>The holiday is skipped under the selected calendar.</p>
            </article>
          </div>

          <a
            className="holidays-zero-cta"
            href="/business-days-calculator?calendar=us"
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'public_holidays_business_days',
              })
              onNavigate('/business-days-calculator?calendar=us')
            }}
          >
            Check your exact date
          </a>
        </section>

        <section className="holidays-zero-details">
          <details>
            <summary>When should a holiday be excluded?</summary>
            <div>
              <p>
                Exclude it when the contract, policy, law, employer, carrier,
                court, or other governing source defines that holiday as a
                non-business day.
              </p>
            </div>
          </details>

          <details>
            <summary>What if the rule only says “business days”?</summary>
            <div>
              <p>
                The safest approach is to use the business-day definition that
                applies to that rule. Different organizations and jurisdictions
                can recognize different holidays.
              </p>
            </div>
          </details>

          <details>
            <summary>Are weekends and holidays the same rule?</summary>
            <div>
              <p>
                No. Weekends are normally excluded under a Monday–Friday
                business schedule. Holidays require a separate holiday rule or
                calendar.
              </p>
            </div>
          </details>
        </section>

        <section className="holidays-zero-related" aria-label="Related business-day answers">
          <div>
            <p className="holidays-zero-section-eyebrow">Related answers</p>
            <h2>Need another counting rule?</h2>
          </div>

          <nav>
            <a
              href="/do-weekends-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-weekends-count-as-business-days')
              }}
            >
              Do weekends count?
            </a>
            <a
              href="/does-the-start-date-count"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/does-the-start-date-count')
              }}
            >
              Does the start date count?
            </a>
            <a
              href="/business-days-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/business-days-calculator')
              }}
            >
              Business days calculator
            </a>
          </nav>
        </section>
      </article>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Use the holiday definition and calendar that actually govern your deadline."
      />

      <style>{`
        .holidays-zero-page {
          --holidays-ink: #153654;
          --holidays-muted: #667b8e;
          --holidays-accent: #2d7b64;
          --holidays-field: #f2ead8;
          min-height: 100vh;
          background: #fffaf2;
        }

        .holidays-zero-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .holidays-zero-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .holidays-zero-shell {
          width: min(100% - 32px, 1100px);
          margin: 22px auto 0;
        }

        .holidays-zero-hero {
          padding: clamp(38px, 5vw, 60px) clamp(24px, 6vw, 70px) 36px;
          border: 1px solid rgba(120, 92, 44, 0.12);
          border-radius: 28px;
          background: var(--holidays-field);
          text-align: center;
        }

        .holidays-zero-eyebrow,
        .holidays-zero-section-eyebrow {
          margin: 0;
          color: var(--holidays-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .holidays-zero-hero h1 {
          max-width: 900px;
          margin: 10px auto 0;
          color: var(--holidays-ink);
          font-size: clamp(3rem, 6vw, 5.3rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .holidays-zero-answer {
          display: block;
          margin-top: 28px;
          color: var(--holidays-ink);
          font-size: clamp(4rem, 9vw, 7.6rem);
          font-weight: 950;
          line-height: 0.88;
          letter-spacing: -0.06em;
        }

        .holidays-zero-summary {
          max-width: 760px;
          margin: 22px auto 0;
          color: #3f657b;
          font-size: clamp(1.35rem, 2.5vw, 1.95rem);
          font-weight: 850;
          line-height: 1.25;
        }

        .holidays-zero-example {
          margin-top: 16px;
          padding: 20px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 20px;
          background: #faf8f1;
        }

        .holidays-zero-example-heading {
          text-align: center;
        }

        .holidays-zero-example-heading h2,
        .holidays-zero-related h2 {
          margin: 5px 0 0;
          color: var(--holidays-ink);
          font-size: clamp(1.45rem, 2.6vw, 2.1rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .holidays-zero-example-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 840px;
          margin: 16px auto 0;
        }

        .holidays-zero-example-grid article {
          padding: 17px 18px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 15px;
          background: #fff;
        }

        .holidays-zero-example-grid article.is-holiday-aware {
          border-color: rgba(45, 123, 100, 0.26);
          background: #e7f2ec;
        }

        .holidays-zero-example-grid span {
          display: block;
          color: #5d7287;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .holidays-zero-example-grid strong {
          display: block;
          margin-top: 7px;
          color: var(--holidays-ink);
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          line-height: 1.16;
        }

        .holidays-zero-example-grid p {
          margin: 8px 0 0;
          color: #667b8e;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .holidays-zero-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px auto 0;
          padding: 9px 16px;
          border-radius: 11px;
          background: #267357;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
        }

        .holidays-zero-details {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .holidays-zero-details details {
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .holidays-zero-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .holidays-zero-details details > div {
          padding: 0 14px 16px;
        }

        .holidays-zero-details p {
          max-width: 780px;
          margin: 0;
          color: #61768a;
          line-height: 1.58;
        }

        .holidays-zero-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #f4efe3;
        }

        .holidays-zero-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .holidays-zero-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.86rem;
          font-weight: 850;
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .holidays-zero-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .holidays-zero-brand img {
            width: 154px;
          }

          .holidays-zero-shell {
            width: min(100% - 24px, 680px);
            margin-top: 12px;
          }

          .holidays-zero-hero {
            padding: 22px 20px 20px;
            border-radius: 24px;
            text-align: left;
          }

          .holidays-zero-hero h1 {
            margin-top: 8px;
            font-size: clamp(2.2rem, 10vw, 3.2rem);
            line-height: 0.98;
          }

          .holidays-zero-answer {
            margin-top: 20px;
            font-size: clamp(3.7rem, 18vw, 5.8rem);
          }

          .holidays-zero-summary {
            margin-top: 16px;
            font-size: clamp(1.2rem, 5.5vw, 1.62rem);
            line-height: 1.22;
          }

          .holidays-zero-example {
            padding: 16px;
          }

          .holidays-zero-example-heading {
            text-align: left;
          }

          .holidays-zero-example-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .holidays-zero-cta {
            width: 100%;
          }

          .holidays-zero-related {
            padding: 18px;
          }

          .holidays-zero-related nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
function ShippingDeliveryRangePage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(() =>
    getInitialDateQueryParam('start', todayInputValue()),
  )
  const [minimumDays, setMinimumDays] = useState(() =>
    getInitialPositiveIntegerQueryParam('min', '3', 365),
  )
  const [maximumDays, setMaximumDays] = useState(() =>
    getInitialPositiveIntegerQueryParam('max', '5', 365),
  )
  const [countMode, setCountMode] = useState<'business' | 'calendar'>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'calendar'
      ? 'calendar'
      : 'business',
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  const parsedStart = parsePlainDate(startDate)
  const parsedMin = parseInteger(minimumDays)
  const parsedMax = parseInteger(maximumDays)

  const validationMessage =
    !parsedStart
      ? 'Choose a valid order or ship date.'
      : parsedMin === null || parsedMin < 0
        ? 'Enter a valid earliest number of days.'
        : parsedMax === null || parsedMax < 0
          ? 'Enter a valid latest number of days.'
          : parsedMin > parsedMax
            ? 'The earliest estimate cannot be greater than the latest estimate.'
            : null

  const earliest =
    !validationMessage && parsedStart && parsedMin !== null
      ? countMode === 'business'
        ? calculateBusinessDaysWithCalendar(
            parsedStart,
            parsedMin,
            holidayCalendar,
          ).date
        : addCalendarDays(parsedStart, parsedMin)
      : null

  const latest =
    !validationMessage && parsedStart && parsedMax !== null
      ? countMode === 'business'
        ? calculateBusinessDaysWithCalendar(
            parsedStart,
            parsedMax,
            holidayCalendar,
          ).date
        : addCalendarDays(parsedStart, parsedMax)
      : null

  useEffect(() => {
    syncShareableQueryParams({
      start: startDate,
      min: minimumDays,
      max: maximumDays,
      mode: countMode,
      calendar:
        countMode === 'business'
          ? holidayCalendarQueryValue(holidayCalendar)
          : null,
    })
  }, [startDate, minimumDays, maximumDays, countMode, holidayCalendar])

  const rangeSummary =
    earliest && latest && parsedMin !== null && parsedMax !== null
      ? parsedMin === parsedMax
        ? `${parsedMin} ${countMode === 'business' ? 'business' : 'calendar'} ${
            parsedMin === 1 ? 'day' : 'days'
          }`
        : `${parsedMin}–${parsedMax} ${
            countMode === 'business' ? 'business' : 'calendar'
          } days`
      : ''

  const formatShippingDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  return (
    <main className="page-shell shipping-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="shipping-answer-shell" aria-labelledby="shipping-answer-title">
        <div className="shipping-answer-hero">
          <p className="shipping-answer-eyebrow">Delivery range calculator</p>

          {earliest && latest && parsedStart && parsedMin !== null && parsedMax !== null ? (
            <>
              <h1 id="shipping-answer-title">Estimated delivery</h1>

              <div className="shipping-answer-range" aria-live="polite">
                <div className="shipping-answer-range-card is-earliest">
                  <span>Earliest</span>
                  <strong>{formatWeekday(earliest)},</strong>
                  <b>{formatShippingDate(earliest)}</b>
                </div>

                {toDateKey(earliest) !== toDateKey(latest) ? (
                  <>
                    <i aria-hidden="true">to</i>
                    <div className="shipping-answer-range-card is-latest">
                      <span>Latest</span>
                      <strong>{formatWeekday(latest)},</strong>
                      <b>{formatShippingDate(latest)}</b>
                    </div>
                  </>
                ) : null}
              </div>

              <p className="shipping-answer-context">
                {rangeSummary} after {formatShippingDate(parsedStart)}
              </p>

              <p className="shipping-answer-rule">
                {countMode === 'business'
                  ? holidayCalendar === 'none'
                    ? 'Weekends skipped · Public holidays still count'
                    : `Weekends + ${
                        getHolidayCalendarOption(holidayCalendar).shortLabel
                      } holidays skipped`
                  : 'Calendar days counted · Weekends included'}
              </p>
            </>
          ) : (
            <>
              <h1 id="shipping-answer-title">When should it arrive?</h1>
              <p className="shipping-answer-context">
                Enter a valid ship date and delivery window below.
              </p>
            </>
          )}
        </div>

        <form
          className="shipping-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Order or ship date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            <span>Earliest</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={minimumDays}
              onChange={(event) => setMinimumDays(event.target.value)}
            />
          </label>

          <label>
            <span>Latest</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={maximumDays}
              onChange={(event) => setMaximumDays(event.target.value)}
            />
          </label>

          <label>
            <span>Count as</span>
            <select
              value={countMode}
              onChange={(event) =>
                setCountMode(event.target.value as 'business' | 'calendar')
              }
            >
              <option value="business">Business days</option>
              <option value="calendar">Calendar days</option>
            </select>
          </label>

          <div
            className="shipping-answer-quick-picks"
            aria-label="Common delivery windows"
          >
            {[
              ['3–5 days', '3', '5'],
              ['5–7 days', '5', '7'],
              ['7–10 days', '7', '10'],
            ].map(([label, min, max]) => {
              const active = minimumDays === min && maximumDays === max
              return (
                <button
                  className={active ? 'is-active' : ''}
                  type="button"
                  key={label}
                  aria-pressed={active}
                  onClick={() => {
                    setMinimumDays(min)
                    setMaximumDays(max)
                    trackWhenIsDueEvent('quick_pick', {
                      context: 'shipping_delivery_range',
                      value: label,
                    })
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {validationMessage ? (
            <p className="shipping-answer-error" role="status">
              {validationMessage}
            </p>
          ) : null}
        </form>
      </section>

      {earliest && latest && parsedStart && parsedMin !== null && parsedMax !== null ? (
        <section className="shipping-answer-actions">
          <ResultActions
            title="Estimated delivery window"
            date={latest}
            details={`${formatShippingDate(earliest)} to ${formatShippingDate(latest)}`}
            variant="return-window"
          />

          <details className="shipping-answer-details">
            <summary>Why these dates?</summary>
            <div className="shipping-answer-detail-body">
              <p>
                WhenIsDue counted {rangeSummary} forward from{' '}
                {formatShippingDate(parsedStart)}.
                {' '}
                {countMode === 'business'
                  ? holidayCalendar === 'none'
                    ? 'Weekends were skipped and public holidays were treated like ordinary weekdays.'
                    : `Weekends and ${
                        getHolidayCalendarOption(holidayCalendar).shortLabel
                      } holidays were skipped.`
                  : 'Calendar days were counted, including weekends.'}
              </p>

              <CalculationReceipt
                analyticsContext="shipping_delivery_range"
                rows={[
                  {
                    label: 'Order / ship date',
                    value: `${formatWeekday(parsedStart)}, ${formatPlainDate(parsedStart)}`,
                  },
                  {
                    label: 'Delivery estimate',
                    value: rangeSummary,
                  },
                  {
                    label: 'Counting method',
                    value: countMode === 'business' ? 'Business days' : 'Calendar days',
                  },
                  ...(countMode === 'business'
                    ? [
                        {
                          label: 'Holiday calendar',
                          value: getHolidayCalendarOption(holidayCalendar).label,
                        },
                      ]
                    : []),
                  {
                    label: 'Earliest date',
                    value: `${formatWeekday(earliest)}, ${formatPlainDate(earliest)}`,
                  },
                  {
                    label: 'Latest date',
                    value: `${formatWeekday(latest)}, ${formatPlainDate(latest)}`,
                  },
                ]}
              />
            </div>
          </details>

          {countMode === 'business' ? (
            <details className="shipping-answer-details">
              <summary>Holiday settings</summary>
              <div className="shipping-answer-detail-body">
                <HolidayCalendarSelect
                  value={holidayCalendar}
                  onChange={(nextCalendar) => {
                    setHolidayCalendar(nextCalendar)
                    trackWhenIsDueEvent('holiday_calendar_changed', {
                      context: 'shipping_delivery_range',
                      value: nextCalendar,
                    })
                  }}
                  compact
                />
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="shipping-answer-related" aria-label="Related date tools">
        <div>
          <p className="shipping-answer-section-eyebrow">Related answers</p>
          <h2>Need another delivery or business-day date?</h2>
        </div>

        <nav>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator
          </a>
          <a
            href="/do-weekends-count-as-business-days"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/do-weekends-count-as-business-days')
            }}
          >
            Do weekends count?
          </a>
          <a
            href="/do-public-holidays-count-as-business-days"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/do-public-holidays-count-as-business-days')
            }}
          >
            Do public holidays count?
          </a>
        </nav>
      </section>

      <section className="shipping-answer-content" aria-label="Shipping delivery range help">
        <div className="shipping-answer-content-heading">
          <p className="shipping-answer-section-eyebrow">Delivery-window rules</p>
          <h2>Ship date, delivery window, arrival range</h2>
        </div>

        <article>
          <h2>What does 3–5 business days mean?</h2>
          <p>
            It means the delivery estimate is a range, not one exact date.
            The earliest date is three qualifying business days after the order
            or ship date, and the latest date is five qualifying business days
            after it.
          </p>
        </article>

        <article>
          <h2>Do weekends count?</h2>
          <p>
            Not when the estimate is stated in business days. Saturday and
            Sunday are skipped under the standard Monday–Friday schedule.
            Calendar-day estimates count weekends.
          </p>
        </article>

        <article>
          <h2>Do holidays count?</h2>
          <p>
            That depends on the shipping promise. Use a supported holiday
            calendar when the carrier or seller excludes those holidays.
            Otherwise, leave the calculator on weekends-only counting.
          </p>
        </article>

        <article>
          <h2>Is this a carrier tracking estimate?</h2>
          <p>
            No. This calculator only translates a stated delivery window such as
            “3–5 business days” into dates. Carrier delays, cut-off times,
            handling time, weather, and local delivery rules can change the real
            arrival date.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Shipping promises, cut-off times, handling time, carrier delays, and local delivery rules can change the actual arrival date."
      />

      <style>{`
        .shipping-answer-page {
          --shipping-ink: #153654;
          --shipping-muted: #667b8e;
          --shipping-accent: #2d7b64;
          --shipping-field: #dfecef;
          --shipping-field-soft: #edf4f5;
          min-height: 100vh;
          background: #fffaf2;
        }

        .shipping-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .shipping-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .shipping-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .shipping-answer-shell,
        .shipping-answer-actions,
        .shipping-answer-related,
        .shipping-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .shipping-answer-shell {
          margin-top: 22px;
        }

        .shipping-answer-hero {
          padding: clamp(34px, 4.5vw, 50px) clamp(24px, 5vw, 58px) 26px;
          border: 1px solid rgba(46, 88, 102, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--shipping-field);
          text-align: center;
        }

        .shipping-answer-eyebrow,
        .shipping-answer-section-eyebrow {
          margin: 0;
          color: var(--shipping-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .shipping-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--shipping-ink);
          font-size: clamp(2.8rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .shipping-answer-range {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          gap: 16px;
          align-items: center;
          max-width: 860px;
          margin: 22px auto 0;
        }

        .shipping-answer-range-card {
          min-width: 0;
          padding: 15px 18px;
          border: 1px solid rgba(21, 54, 84, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.62);
        }

        .shipping-answer-range-card.is-earliest {
          background: rgba(255, 255, 255, 0.68);
        }

        .shipping-answer-range-card.is-latest {
          border-color: rgba(45, 123, 100, 0.22);
          background: rgba(226, 241, 238, 0.78);
          box-shadow: inset 0 0 0 1px rgba(45, 123, 100, 0.06);
        }

        .shipping-answer-range span,
        .shipping-answer-range strong,
        .shipping-answer-range b {
          display: block;
        }

        .shipping-answer-range span {
          color: #607789;
          font-size: 0.82rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .shipping-answer-range strong {
          margin-top: 8px;
          color: #3e687c;
          font-size: clamp(1.6rem, 3vw, 2.5rem);
          line-height: 1;
        }

        .shipping-answer-range b {
          margin-top: 4px;
          color: var(--shipping-ink);
          font-size: clamp(2.1rem, 4.6vw, 4rem);
          line-height: 0.95;
          letter-spacing: -0.045em;
        }

        .shipping-answer-range i {
          color: #758b99;
          font-size: 0.88rem;
          font-style: normal;
          font-weight: 850;
          text-transform: uppercase;
        }

        .shipping-answer-context,
        .shipping-answer-rule {
          margin: 13px 0 0;
          color: var(--shipping-muted);
          font-size: 0.96rem;
          line-height: 1.5;
        }

        .shipping-answer-rule {
          margin-top: 7px;
          font-size: 0.86rem;
        }

        .shipping-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(100px, 0.45fr) minmax(100px, 0.45fr) minmax(170px, 0.72fr);
          gap: 10px;
          align-items: end;
          padding: 14px 18px 15px;
          border: 1px solid rgba(46, 88, 102, 0.12);
          border-top: 1px solid rgba(46, 88, 102, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--shipping-field-soft);
        }

        .shipping-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .shipping-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .shipping-answer-controls input,
        .shipping-answer-controls select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .shipping-answer-quick-picks {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .shipping-answer-quick-picks button {
          min-height: 46px;
          padding: 8px 10px;
          border: 1px solid rgba(21, 54, 84, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f6780;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .shipping-answer-quick-picks button.is-active {
          border-color: rgba(45, 123, 100, 0.58);
          background: #e7f3ee;
          color: #1f6655;
        }

        .shipping-answer-error {
          grid-column: 1 / -1;
          margin: 0;
          color: #934a42;
          font-size: 0.84rem;
          font-weight: 750;
        }

        .shipping-answer-actions {
          margin-top: 10px;
        }

        .shipping-answer-actions > .result-actions {
          justify-content: center;
        }

        .shipping-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .shipping-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .shipping-answer-detail-body {
          padding: 0 14px 16px;
        }

        .shipping-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .shipping-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .shipping-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #edf4f5;
        }

        .shipping-answer-related h2,
        .shipping-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--shipping-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .shipping-answer-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .shipping-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(21, 54, 84, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .shipping-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .shipping-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .shipping-answer-content article {
          padding: 21px;
          border: 1px solid rgba(21, 54, 84, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .shipping-answer-content h2 {
          margin: 0;
          color: var(--shipping-ink);
          font-size: 1.08rem;
        }

        .shipping-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .shipping-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .shipping-answer-brand img {
            width: 154px;
          }

          .shipping-answer-shell,
          .shipping-answer-actions,
          .shipping-answer-related,
          .shipping-answer-content {
            width: min(100% - 24px, 680px);
          }

          .shipping-answer-shell {
            margin-top: 14px;
          }

          .shipping-answer-hero {
            padding: 26px 20px 24px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .shipping-answer-hero h1 {
            font-size: clamp(2.5rem, 11vw, 3.7rem);
          }

          .shipping-answer-range {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 20px;
          }

          .shipping-answer-range-card {
            position: relative;
            padding: 16px 16px 16px 20px;
          }

          .shipping-answer-range-card::before {
            content: '';
            position: absolute;
            top: 16px;
            bottom: 16px;
            left: 10px;
            width: 3px;
            border-radius: 999px;
            background: rgba(61, 104, 124, 0.28);
          }

          .shipping-answer-range-card.is-latest::before {
            background: rgba(45, 123, 100, 0.72);
          }

          .shipping-answer-range-card.is-latest {
            border-color: rgba(45, 123, 100, 0.26);
            background: #e3f0ee;
          }

          .shipping-answer-range i {
            display: none;
          }

          .shipping-answer-range strong {
            font-size: clamp(1.8rem, 8.5vw, 2.7rem);
          }

          .shipping-answer-range b {
            font-size: clamp(2.25rem, 10.8vw, 3.45rem);
          }

          .shipping-answer-context {
            margin-top: 14px;
            font-size: 0.9rem;
          }

          .shipping-answer-controls {
            grid-template-columns: minmax(0, 1.15fr) minmax(88px, 0.45fr) minmax(88px, 0.45fr);
            gap: 9px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .shipping-answer-controls > label:first-child,
          .shipping-answer-controls > label:nth-child(4) {
            grid-column: 1 / -1;
          }

          .shipping-answer-quick-picks {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .shipping-answer-controls input,
          .shipping-answer-controls select,
          .shipping-answer-quick-picks button {
            min-height: 46px;
          }

          .shipping-answer-related {
            padding: 20px 18px;
          }

          .shipping-answer-related nav {
            grid-template-columns: 1fr;
          }

          .shipping-answer-content {
            display: block;
            margin-top: 28px;
          }

          .shipping-answer-content-heading {
            margin-bottom: 8px;
          }

          .shipping-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(21, 54, 84, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .shipping-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
type NoticePeriodUnit = 'calendar-days' | 'business-days' | 'weeks' | 'months'

function NoticePeriodCalculatorPage({ onNavigate }: NavigationProps) {
  const [eventDate, setEventDate] = useState(() =>
    getInitialDateQueryParam(
      'date',
      toDateKey(addCalendarDays(getTodayPlainDate(new Date()), 30)),
    ),
  )
  const [noticeAmount, setNoticeAmount] = useState(() =>
    getInitialPositiveIntegerQueryParam('amount', '30', 365),
  )
  const [noticeUnit, setNoticeUnit] = useState<NoticePeriodUnit>(() => {
    const value = new URLSearchParams(window.location.search).get('unit')
    return value === 'business-days' ||
      value === 'weeks' ||
      value === 'months'
      ? value
      : 'calendar-days'
  })
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  const parsedEventDate = parsePlainDate(eventDate)
  const parsedAmount = parseInteger(noticeAmount)

  const noticeDeadline =
    parsedEventDate && parsedAmount !== null && parsedAmount >= 0
      ? noticeUnit === 'business-days'
        ? calculateBusinessDaysWithCalendar(
            parsedEventDate,
            -parsedAmount,
            holidayCalendar,
          ).date
        : noticeUnit === 'weeks'
          ? addCalendarDays(parsedEventDate, -(parsedAmount * 7))
          : noticeUnit === 'months'
            ? subtractCalendarMonthsClamped(parsedEventDate, parsedAmount)
            : addCalendarDays(parsedEventDate, -parsedAmount)
      : null

  useEffect(() => {
    syncShareableQueryParams({
      date: eventDate,
      amount: noticeAmount,
      unit: noticeUnit,
      calendar:
        noticeUnit === 'business-days'
          ? holidayCalendarQueryValue(holidayCalendar)
          : null,
    })
  }, [eventDate, noticeAmount, noticeUnit, holidayCalendar])

  const unitLabel =
    noticeUnit === 'business-days'
      ? 'business days'
      : noticeUnit === 'weeks'
        ? noticeAmount === '1'
          ? 'week'
          : 'weeks'
        : noticeUnit === 'months'
          ? noticeAmount === '1'
            ? 'month'
            : 'months'
          : 'calendar days'

  const noticeRuleLabel =
    parsedAmount !== null
      ? `${parsedAmount} ${unitLabel}`
      : `${noticeAmount} ${unitLabel}`

  const formatNoticeDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  return (
    <main className="page-shell notice-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section
        className="notice-answer-shell"
        aria-labelledby="notice-period-title"
      >
        <div className="notice-answer-hero">
          <p className="notice-answer-eyebrow">Notice period calculator</p>

          {noticeDeadline && parsedEventDate && parsedAmount !== null ? (
            <>
              <h1 id="notice-period-title">Give notice by</h1>

              <strong
                className="notice-answer-date"
                aria-label={`${formatWeekday(noticeDeadline)}, ${formatPlainDate(noticeDeadline)}`}
              >
                <span className="notice-answer-weekday">
                  {formatWeekday(noticeDeadline)},
                </span>
                <span className="notice-answer-date-main" aria-hidden="true">
                  <span className="notice-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][noticeDeadline.month - 1]
                    }
                  </span>
                  <span className="notice-answer-day">
                    {noticeDeadline.day}
                  </span>
                  <span className="notice-answer-comma">,</span>
                  <span className="notice-answer-year">
                    {noticeDeadline.year}
                  </span>
                </span>
              </strong>

              <p className="notice-answer-context">
                {noticeRuleLabel} before {formatNoticeDate(parsedEventDate)}
              </p>

              {noticeUnit === 'business-days' ? (
                <p className="notice-answer-rule">
                  {holidayCalendar === 'none'
                    ? 'Weekends skipped · Public holidays still count'
                    : `Weekends + ${getHolidayCalendarOption(
                        holidayCalendar,
                      ).shortLabel} holidays skipped`}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h1 id="notice-period-title">When should I give notice?</h1>
              <p className="notice-answer-context">
                Enter a valid event date and notice period below.
              </p>
            </>
          )}
        </div>

        <form
          className="notice-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Event or renewal date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            />
          </label>

          <label>
            <span>Notice period</span>
            <input
              type="number"
              min="0"
              max="365"
              step="1"
              inputMode="numeric"
              value={noticeAmount}
              onChange={(event) => setNoticeAmount(event.target.value)}
            />
          </label>

          <label>
            <span>Count as</span>
            <select
              value={noticeUnit}
              onChange={(event) =>
                setNoticeUnit(event.target.value as NoticePeriodUnit)
              }
            >
              <option value="calendar-days">Calendar days</option>
              <option value="business-days">Business days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>

          <div
            className="notice-answer-quick-picks"
            aria-label="Common notice periods"
          >
            {[
              ['14 days', '14', 'calendar-days'],
              ['30 days', '30', 'calendar-days'],
              ['60 days', '60', 'calendar-days'],
              ['3 months', '3', 'months'],
            ].map(([label, amount, unit]) => {
              const active = noticeAmount === amount && noticeUnit === unit
              return (
                <button
                  className={active ? 'is-active' : ''}
                  type="button"
                  aria-pressed={active}
                  key={label}
                  onClick={() => {
                    setNoticeAmount(amount)
                    setNoticeUnit(unit as NoticePeriodUnit)
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {noticeUnit === 'business-days' ? (
            <div className="notice-answer-calendar">
              <HolidayCalendarSelect
                value={holidayCalendar}
                onChange={(nextCalendar) => {
                  setHolidayCalendar(nextCalendar)
                  trackWhenIsDueEvent('holiday_calendar_changed', {
                    context: 'notice_period',
                    value: nextCalendar,
                  })
                }}
                compact
              />
            </div>
          ) : null}
        </form>
      </section>

      {noticeDeadline && parsedEventDate && parsedAmount !== null ? (
        <section className="notice-answer-actions">
          <ResultActions
            title="Notice deadline"
            date={noticeDeadline}
            details={`${noticeRuleLabel} before ${formatNoticeDate(parsedEventDate)}`}
            variant="return-window"
          />

          <details className="notice-answer-details">
            <summary>Why this date?</summary>
            <div className="notice-answer-detail-body">
              <p>
                {noticeUnit === 'business-days'
                  ? holidayCalendar === 'none'
                    ? `WhenIsDue counted backward ${parsedAmount} business days from ${formatNoticeDate(
                        parsedEventDate,
                      )}. Weekends were skipped and public holidays were treated like ordinary weekdays.`
                    : `WhenIsDue counted backward ${parsedAmount} business days from ${formatNoticeDate(
                        parsedEventDate,
                      )}, skipping weekends and ${
                        getHolidayCalendarOption(holidayCalendar).shortLabel
                      } holidays.`
                  : noticeUnit === 'months'
                    ? `WhenIsDue moved backward ${parsedAmount} ${
                        parsedAmount === 1 ? 'calendar month' : 'calendar months'
                      } from ${formatNoticeDate(
                        parsedEventDate,
                      )}. If the target month does not contain the same day number, the calculation uses that month's last day.`
                    : `WhenIsDue counted backward ${noticeRuleLabel} from ${formatNoticeDate(
                        parsedEventDate,
                      )}.`}
              </p>

              <CalculationReceipt
                analyticsContext="notice_period"
                rows={[
                  {
                    label: 'Event / renewal date',
                    value: `${formatWeekday(
                      parsedEventDate,
                    )}, ${formatPlainDate(parsedEventDate)}`,
                  },
                  {
                    label: 'Notice period',
                    value: noticeRuleLabel,
                  },
                  ...(noticeUnit === 'business-days'
                    ? [
                        {
                          label: 'Holiday calendar',
                          value:
                            getHolidayCalendarOption(holidayCalendar).label,
                        },
                      ]
                    : []),
                  {
                    label: 'Latest notice date',
                    value: `${formatWeekday(
                      noticeDeadline,
                    )}, ${formatPlainDate(noticeDeadline)}`,
                  },
                ]}
              />
            </div>
          </details>
        </section>
      ) : null}

      <section
        className="notice-answer-related"
        aria-label="Related deadline tools"
      >
        <div>
          <p className="notice-answer-section-eyebrow">Related deadline tools</p>
          <h2>Need a more specific counting rule?</h2>
        </div>

        <nav>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator
          </a>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator
          </a>
          <a
            href="/does-the-start-date-count"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/does-the-start-date-count')
            }}
          >
            Does the start date count?
          </a>
        </nav>
      </section>

      <section
        className="notice-answer-content"
        aria-label="Notice period help"
      >
        <div className="notice-answer-content-heading">
          <p className="notice-answer-section-eyebrow">Notice-period rules</p>
          <h2>Event, notice, deadline</h2>
        </div>

        <article>
          <h2>What does a notice period calculator do?</h2>
          <p>
            It counts backward from an event such as a contract renewal,
            cancellation date, lease date, resignation date, or another fixed
            event to find the latest date to give the required notice.
          </p>
        </article>

        <article>
          <h2>Example: 30 days before renewal</h2>
          <p>
            If a contract renews on September 30 and requires 30 calendar days'
            notice, this calculator counts backward 30 days and shows the
            corresponding notice deadline.
          </p>
        </article>

        <article>
          <h2>Calendar days or business days?</h2>
          <p>
            Use the wording in the contract, policy, law, or instruction.
            Calendar days count every date. Business days use the selected
            working-day and holiday rules.
          </p>
        </article>

        <article>
          <h2>Months can behave differently</h2>
          <p>
            Month-based notice is calculated by moving back the stated number
            of calendar months. If the target month does not contain the same
            day number, WhenIsDue uses that month's last day.
          </p>
        </article>

        <article>
          <h2>Important</h2>
          <p>
            This is a date-planning tool, not legal advice. Some notice rules
            define service, receipt, mailing, working days, or the final day
            differently. The source that created the notice requirement
            controls.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Contracts, laws, policies, and notices can define counting, service, receipt, weekends, holidays, and final-day rules differently."
      />

      <style>{`
        .notice-answer-page {
          --notice-ink: #153655;
          --notice-muted: #667a8d;
          --notice-accent: #2d7b64;
          --notice-field: #e8efe4;
          --notice-field-soft: #f1f5ee;
          min-height: 100vh;
          background: #fffaf2;
        }

        .notice-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 85, 0.12);
        }

        .notice-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .notice-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .notice-answer-shell,
        .notice-answer-actions,
        .notice-answer-related,
        .notice-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .notice-answer-shell {
          margin-top: 22px;
        }

        .notice-answer-hero {
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(52, 87, 60, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--notice-field);
          text-align: center;
        }

        .notice-answer-eyebrow,
        .notice-answer-section-eyebrow {
          margin: 0;
          color: var(--notice-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .notice-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--notice-ink);
          font-size: clamp(2.8rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .notice-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 26px;
          color: var(--notice-ink);
          font-weight: 900;
        }

        .notice-answer-weekday {
          color: #3b6579;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .notice-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .notice-answer-month,
        .notice-answer-day,
        .notice-answer-comma,
        .notice-answer-year {
          display: inline;
        }

        .notice-answer-comma {
          margin-left: -0.08em;
        }

        .notice-answer-context,
        .notice-answer-rule {
          margin: 18px 0 0;
          color: var(--notice-muted);
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .notice-answer-rule {
          margin-top: 7px;
          font-size: 0.88rem;
        }

        .notice-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(120px, 0.55fr) minmax(180px, 0.8fr) minmax(360px, 1.5fr);
          gap: 12px;
          align-items: end;
          padding: 18px;
          border: 1px solid rgba(52, 87, 60, 0.12);
          border-top: 1px solid rgba(52, 87, 60, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--notice-field-soft);
        }

        .notice-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .notice-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .notice-answer-controls input,
        .notice-answer-controls select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 85, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .notice-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .notice-answer-quick-picks button {
          min-height: 50px;
          padding: 8px 9px;
          border: 1px solid rgba(21, 54, 85, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f6780;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .notice-answer-quick-picks button.is-active {
          border-color: rgba(45, 123, 100, 0.58);
          background: #e7f3ee;
          color: #1f6655;
        }

        .notice-answer-calendar {
          grid-column: 1 / -1;
        }

        .notice-answer-actions {
          margin-top: 16px;
        }

        .notice-answer-actions > .result-actions {
          justify-content: center;
        }

        .notice-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(21, 54, 85, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .notice-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .notice-answer-detail-body {
          padding: 0 14px 16px;
        }

        .notice-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .notice-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .notice-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 85, 0.1);
          border-radius: 22px;
          background: #eef4ec;
        }

        .notice-answer-related h2,
        .notice-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--notice-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .notice-answer-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .notice-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(21, 54, 85, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .notice-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .notice-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .notice-answer-content article {
          padding: 21px;
          border: 1px solid rgba(21, 54, 85, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .notice-answer-content article:last-child {
          grid-column: 1 / -1;
        }

        .notice-answer-content h2 {
          margin: 0;
          color: var(--notice-ink);
          font-size: 1.08rem;
        }

        .notice-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .notice-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .notice-answer-brand img {
            width: 154px;
          }

          .notice-answer-shell,
          .notice-answer-actions,
          .notice-answer-related,
          .notice-answer-content {
            width: min(100% - 24px, 680px);
          }

          .notice-answer-shell {
            margin-top: 14px;
          }

          .notice-answer-hero {
            padding: 28px 20px 26px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .notice-answer-hero h1 {
            font-size: clamp(2.65rem, 12vw, 4rem);
          }

          .notice-answer-date {
            justify-items: start;
            margin-top: 22px;
          }

          .notice-answer-weekday {
            font-size: clamp(2.3rem, 10vw, 3.2rem);
          }

          .notice-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(3.05rem, 14vw, 4.6rem);
            line-height: 0.9;
            white-space: normal;
          }

          .notice-answer-month,
          .notice-answer-day,
          .notice-answer-year {
            display: block;
          }

          .notice-answer-comma {
            display: none;
          }

          .notice-answer-controls {
            grid-template-columns: minmax(0, 1.15fr) minmax(105px, 0.65fr);
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .notice-answer-controls > label:nth-child(3) {
            grid-column: 1 / -1;
          }

          .notice-answer-quick-picks {
            grid-column: 1 / -1;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .notice-answer-controls input,
          .notice-answer-controls select,
          .notice-answer-quick-picks button {
            min-height: 46px;
          }

          .notice-answer-related {
            padding: 20px 18px;
          }

          .notice-answer-related nav {
            grid-template-columns: 1fr;
          }

          .notice-answer-content {
            display: block;
            margin-top: 28px;
          }

          .notice-answer-content-heading {
            margin-bottom: 8px;
          }

          .notice-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(21, 54, 85, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .notice-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
type SubscriptionIntervalUnit = 'days' | 'weeks' | 'months' | 'years'

function SubscriptionRenewalCalculatorPage({
  onNavigate,
}: NavigationProps) {
  const [startDate, setStartDate] = useState(() =>
    getInitialDateQueryParam('date', todayInputValue()),
  )
  const [intervalAmount, setIntervalAmount] = useState(() =>
    getInitialPositiveIntegerQueryParam('amount', '1', 365),
  )
  const [intervalUnit, setIntervalUnit] = useState<SubscriptionIntervalUnit>(
    () => {
      const value = new URLSearchParams(window.location.search).get('unit')
      return value === 'days' || value === 'weeks' || value === 'years'
        ? value
        : 'months'
    },
  )
  const [noticeDays, setNoticeDays] = useState(() =>
    getInitialPositiveIntegerQueryParam('notice', '0', 365),
  )

  const parsedStart = parsePlainDate(startDate)
  const parsedIntervalAmount = parseInteger(intervalAmount)
  const parsedNoticeDays = parseInteger(noticeDays)

  const nextRenewal =
    parsedStart &&
    parsedIntervalAmount !== null &&
    parsedIntervalAmount >= 1
      ? intervalUnit === 'days'
        ? addCalendarDays(parsedStart, parsedIntervalAmount)
        : intervalUnit === 'weeks'
          ? addCalendarDays(parsedStart, parsedIntervalAmount * 7)
          : intervalUnit === 'years'
            ? addCalendarMonthsClamped(parsedStart, parsedIntervalAmount * 12)
            : addCalendarMonthsClamped(parsedStart, parsedIntervalAmount)
      : null

  const cancellationDeadline =
    nextRenewal && parsedNoticeDays !== null && parsedNoticeDays > 0
      ? addCalendarDays(nextRenewal, -parsedNoticeDays)
      : null

  useEffect(() => {
    syncShareableQueryParams({
      date: startDate,
      amount: intervalAmount,
      unit: intervalUnit,
      notice: noticeDays,
    })
  }, [startDate, intervalAmount, intervalUnit, noticeDays])

  const subscriptionIntervalLabel =
    parsedIntervalAmount !== null
      ? `${parsedIntervalAmount} ${
          intervalUnit === 'days'
            ? parsedIntervalAmount === 1
              ? 'day'
              : 'days'
            : intervalUnit === 'weeks'
              ? parsedIntervalAmount === 1
                ? 'week'
                : 'weeks'
              : intervalUnit === 'years'
                ? parsedIntervalAmount === 1
                  ? 'year'
                  : 'years'
                : parsedIntervalAmount === 1
                  ? 'month'
                  : 'months'
        }`
      : 'renewal interval'

  const formatSubscriptionDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  return (
    <main className="page-shell subscription-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section
        className="subscription-answer-shell"
        aria-labelledby="subscription-renewal-title"
      >
        <div className="subscription-answer-hero">
          <p className="subscription-answer-eyebrow">
            Subscription renewal calculator
          </p>

          {nextRenewal && parsedStart && parsedIntervalAmount !== null ? (
            <>
              <h1 id="subscription-renewal-title">
                Your subscription renews
              </h1>

              <strong
                className="subscription-answer-date"
                aria-label={`${formatWeekday(nextRenewal)}, ${formatPlainDate(nextRenewal)}`}
              >
                <span className="subscription-answer-weekday">
                  {formatWeekday(nextRenewal)},
                </span>
                <span
                  className="subscription-answer-date-main"
                  aria-hidden="true"
                >
                  <span className="subscription-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][nextRenewal.month - 1]
                    }
                  </span>
                  <span className="subscription-answer-day">
                    {nextRenewal.day}
                  </span>
                  <span className="subscription-answer-comma">,</span>
                  <span className="subscription-answer-year">
                    {nextRenewal.year}
                  </span>
                </span>
              </strong>

              <p className="subscription-answer-context">
                Every {subscriptionIntervalLabel} · Starting from{' '}
                {formatSubscriptionDate(parsedStart)}
              </p>

              {cancellationDeadline ? (
                <p className="subscription-answer-reminder">
                  Cancel by{' '}
                  <strong>
                    {formatWeekday(cancellationDeadline)},{' '}
                    {formatSubscriptionDate(cancellationDeadline)}
                  </strong>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h1 id="subscription-renewal-title">
                When does my subscription renew?
              </h1>
              <p className="subscription-answer-context">
                Enter a valid date and renewal interval below.
              </p>
            </>
          )}
        </div>

        <form
          className="subscription-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Start or last renewal</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            <span>Renews every</span>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              inputMode="numeric"
              value={intervalAmount}
              onChange={(event) => setIntervalAmount(event.target.value)}
            />
          </label>

          <label>
            <span>Interval</span>
            <select
              value={intervalUnit}
              onChange={(event) =>
                setIntervalUnit(
                  event.target.value as SubscriptionIntervalUnit,
                )
              }
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </label>

          <div
            className="subscription-answer-quick-picks"
            aria-label="Common renewal intervals"
          >
            {[
              ['Monthly', '1', 'months'],
              ['Quarterly', '3', 'months'],
              ['6 months', '6', 'months'],
              ['Yearly', '1', 'years'],
            ].map(([label, amount, unit]) => {
              const active =
                intervalAmount === amount && intervalUnit === unit
              return (
                <button
                  className={active ? 'is-active' : ''}
                  type="button"
                  aria-pressed={active}
                  key={label}
                  onClick={() => {
                    setIntervalAmount(amount)
                    setIntervalUnit(unit as SubscriptionIntervalUnit)
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <label className="subscription-answer-notice">
            <span>Cancel this many days before</span>
            <input
              type="number"
              min="0"
              max="365"
              step="1"
              inputMode="numeric"
              value={noticeDays}
              onChange={(event) => setNoticeDays(event.target.value)}
            />
          </label>
        </form>
      </section>

      {nextRenewal && parsedStart && parsedIntervalAmount !== null ? (
        <section className="subscription-answer-actions">
          <ResultActions
            title="Subscription renewal"
            date={nextRenewal}
            details={
              cancellationDeadline
                ? `Cancel by ${formatSubscriptionDate(cancellationDeadline)}`
                : `Renews every ${subscriptionIntervalLabel}`
            }
            variant="return-window"
          />

          <details className="subscription-answer-details">
            <summary>Why this date?</summary>
            <div className="subscription-answer-detail-body">
              <p>
                WhenIsDue moved forward {subscriptionIntervalLabel} from{' '}
                {formatSubscriptionDate(parsedStart)}. Month and year intervals
                are calendar-based. If the target month does not contain the
                same day number, the calculation uses that month's last day.
              </p>

              <CalculationReceipt
                analyticsContext="subscription_renewal"
                rows={[
                  {
                    label: 'Start / last renewal',
                    value: `${formatWeekday(parsedStart)}, ${formatPlainDate(parsedStart)}`,
                  },
                  {
                    label: 'Renewal interval',
                    value: subscriptionIntervalLabel,
                  },
                  {
                    label: 'Next renewal',
                    value: `${formatWeekday(nextRenewal)}, ${formatPlainDate(nextRenewal)}`,
                  },
                  ...(cancellationDeadline
                    ? [
                        {
                          label: 'Advance notice',
                          value: `${parsedNoticeDays} ${
                            parsedNoticeDays === 1 ? 'day' : 'days'
                          }`,
                        },
                        {
                          label: 'Cancel by',
                          value: `${formatWeekday(cancellationDeadline)}, ${formatPlainDate(cancellationDeadline)}`,
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </details>
        </section>
      ) : null}

      <section
        className="subscription-answer-related"
        aria-label="Related subscription timing tools"
      >
        <div>
          <p className="subscription-answer-section-eyebrow">Related tools</p>
          <h2>Need another renewal or cancellation date?</h2>
        </div>

        <nav>
          <a
            href="/free-trial-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/free-trial-calculator')
            }}
          >
            Free trial calculator
          </a>
          <a
            href="/notice-period-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/notice-period-calculator')
            }}
          >
            Notice period calculator
          </a>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator
          </a>
        </nav>
      </section>

      <section
        className="subscription-answer-content"
        aria-label="Subscription renewal help"
      >
        <div className="subscription-answer-content-heading">
          <p className="subscription-answer-section-eyebrow">
            Renewal timing rules
          </p>
          <h2>Start, interval, renewal</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the subscription start date or most recent renewal date, then
            choose how often the plan renews. WhenIsDue shows the next renewal
            date immediately.
          </p>
        </article>

        <article>
          <h2>Monthly and yearly renewals</h2>
          <p>
            Month and year intervals are calendar-based. If a renewal started on
            a date that does not exist in the target month, the calculator uses
            the last day of that month.
          </p>
        </article>

        <article>
          <h2>Advance cancellation notice</h2>
          <p>
            If the provider requires cancellation a certain number of days
            before renewal, enter that number to show a separate cancel-by date.
            Use zero when there is no known advance-notice requirement.
          </p>
        </article>

        <article>
          <h2>Check the provider's actual terms</h2>
          <p>
            Some subscriptions renew at a specific time, in a specific time
            zone, or under billing rules that differ from simple calendar
            counting. The provider's displayed renewal date and cancellation
            terms should take priority.
          </p>
        </article>

        <article>
          <h2>Important</h2>
          <p>
            This is a planning calculator. It does not determine whether a
            cancellation request has been received, accepted, or processed by a
            provider.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always confirm the provider's renewal date, cancellation deadline, billing time, and time zone."
      />

      <style>{`
        .subscription-answer-page {
          --subscription-ink: #153553;
          --subscription-muted: #667a8d;
          --subscription-accent: #2d7b64;
          --subscription-field: #eee5f2;
          --subscription-field-soft: #f6f0f7;
          min-height: 100vh;
          background: #fffaf2;
        }

        .subscription-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 53, 83, 0.12);
        }

        .subscription-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .subscription-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .subscription-answer-shell,
        .subscription-answer-actions,
        .subscription-answer-related,
        .subscription-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .subscription-answer-shell {
          margin-top: 22px;
        }

        .subscription-answer-hero {
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(88, 66, 105, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--subscription-field);
          text-align: center;
        }

        .subscription-answer-eyebrow,
        .subscription-answer-section-eyebrow {
          margin: 0;
          color: var(--subscription-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .subscription-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--subscription-ink);
          font-size: clamp(2.8rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .subscription-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 26px;
          color: var(--subscription-ink);
          font-weight: 900;
        }

        .subscription-answer-weekday {
          color: #3e647c;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .subscription-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .subscription-answer-month,
        .subscription-answer-day,
        .subscription-answer-comma,
        .subscription-answer-year {
          display: inline;
        }

        .subscription-answer-comma {
          margin-left: -0.08em;
        }

        .subscription-answer-context {
          margin: 18px 0 0;
          color: var(--subscription-muted);
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .subscription-answer-reminder {
          width: fit-content;
          margin: 16px auto 0;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.64);
          color: #607286;
          font-size: 0.9rem;
        }

        .subscription-answer-reminder strong {
          color: #294c66;
        }

        .subscription-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(110px, 0.5fr) minmax(170px, 0.72fr) minmax(360px, 1.5fr);
          gap: 12px;
          align-items: end;
          padding: 18px;
          border: 1px solid rgba(88, 66, 105, 0.12);
          border-top: 1px solid rgba(88, 66, 105, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--subscription-field-soft);
        }

        .subscription-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .subscription-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .subscription-answer-controls input,
        .subscription-answer-controls select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 53, 83, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .subscription-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .subscription-answer-quick-picks button {
          min-height: 50px;
          padding: 8px 9px;
          border: 1px solid rgba(21, 53, 83, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f6780;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .subscription-answer-quick-picks button.is-active {
          border-color: rgba(45, 123, 100, 0.58);
          background: #e7f3ee;
          color: #1f6655;
        }

        .subscription-answer-notice {
          grid-column: 1 / 2;
          margin-top: 2px;
        }

        .subscription-answer-actions {
          margin-top: 16px;
        }

        .subscription-answer-actions > .result-actions {
          justify-content: center;
        }

        .subscription-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(21, 53, 83, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .subscription-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .subscription-answer-detail-body {
          padding: 0 14px 16px;
        }

        .subscription-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .subscription-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .subscription-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 53, 83, 0.1);
          border-radius: 22px;
          background: #f2edf4;
        }

        .subscription-answer-related h2,
        .subscription-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--subscription-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .subscription-answer-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .subscription-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(21, 53, 83, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .subscription-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .subscription-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .subscription-answer-content article {
          padding: 21px;
          border: 1px solid rgba(21, 53, 83, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .subscription-answer-content article:last-child {
          grid-column: 1 / -1;
        }

        .subscription-answer-content h2 {
          margin: 0;
          color: var(--subscription-ink);
          font-size: 1.08rem;
        }

        .subscription-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .subscription-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .subscription-answer-brand img {
            width: 154px;
          }

          .subscription-answer-shell,
          .subscription-answer-actions,
          .subscription-answer-related,
          .subscription-answer-content {
            width: min(100% - 24px, 680px);
          }

          .subscription-answer-shell {
            margin-top: 14px;
          }

          .subscription-answer-hero {
            padding: 24px 20px 22px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .subscription-answer-hero h1 {
            font-size: clamp(2.4rem, 10.8vw, 3.55rem);
            line-height: 0.97;
          }

          .subscription-answer-date {
            justify-items: start;
            margin-top: 18px;
          }

          .subscription-answer-weekday {
            font-size: clamp(2.05rem, 9vw, 2.85rem);
          }

          .subscription-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(2.75rem, 12.7vw, 4.15rem);
            line-height: 0.9;
            white-space: normal;
          }

          .subscription-answer-month,
          .subscription-answer-day,
          .subscription-answer-year {
            display: block;
          }

          .subscription-answer-comma {
            display: none;
          }

          .subscription-answer-context,
          .subscription-answer-reminder {
            margin-left: 0;
            margin-right: 0;
          }

          .subscription-answer-context {
            margin-top: 14px;
            font-size: 0.9rem;
          }

          .subscription-answer-reminder {
            border-radius: 12px;
          }

          .subscription-answer-controls {
            grid-template-columns: minmax(0, 1.15fr) minmax(95px, 0.55fr);
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .subscription-answer-controls > label:nth-child(3) {
            grid-column: 1 / -1;
          }

          .subscription-answer-quick-picks {
            grid-column: 1 / -1;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .subscription-answer-notice {
            grid-column: 1 / -1;
          }

          .subscription-answer-controls input,
          .subscription-answer-controls select,
          .subscription-answer-quick-picks button {
            min-height: 46px;
          }

          .subscription-answer-related {
            padding: 20px 18px;
          }

          .subscription-answer-related nav {
            grid-template-columns: 1fr;
          }

          .subscription-answer-content {
            display: block;
            margin-top: 28px;
          }

          .subscription-answer-content-heading {
            margin-bottom: 8px;
          }

          .subscription-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(21, 53, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .subscription-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
function WithinDaysGuidePage({ onNavigate }: NavigationProps) {
  const startDate = parsePlainDate('2026-08-10')!

  const fiveCalendarDays = calculateDeadlineByRule({
    triggerDate: startDate,
    duration: 5,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const fiveCalendarDaysIncludingStart = calculateDeadlineByRule({
    triggerDate: startDate,
    duration: 5,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'include-if-qualifying',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  return (
    <main className="page-shell within-zero-page">
      <header className="within-zero-header" aria-label="WhenIsDue navigation">
        <a
          className="within-zero-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <article className="within-zero-shell">
        <header className="within-zero-hero">
          <p className="within-zero-eyebrow">Deadline wording guide</p>
          <h1>What does “within 5 days” mean?</h1>
          <strong className="within-zero-answer">It depends.</strong>
          <p className="within-zero-summary">
            Does the start date count as day one? That changes the answer.
          </p>
          <p className="within-zero-caveat">
            Use the wording in the contract, policy, law, or message that created
            the deadline.
          </p>
        </header>

        <section className="within-zero-example" aria-labelledby="within-zero-example-title">
          <div className="within-zero-example-heading">
            <p className="within-zero-section-eyebrow">Same wording, two results</p>
            <h2 id="within-zero-example-title">
              “Within 5 days of August 10, 2026”
            </h2>
          </div>

          <div className="within-zero-example-grid">
            <article>
              <span>Start date does not count</span>
              <strong>
                {fiveCalendarDays
                  ? `${formatWeekday(fiveCalendarDays.answerDate)}, ${formatPlainDate(
                      fiveCalendarDays.answerDate,
                    )}`
                  : '—'}
              </strong>
              <p>Counting starts on August 11.</p>
            </article>

            <article className="is-including-start">
              <span>Start date counts as day 1</span>
              <strong>
                {fiveCalendarDaysIncludingStart
                  ? `${formatWeekday(
                      fiveCalendarDaysIncludingStart.answerDate,
                    )}, ${formatPlainDate(
                      fiveCalendarDaysIncludingStart.answerDate,
                    )}`
                  : '—'}
              </strong>
              <p>August 10 is day one.</p>
            </article>
          </div>

          <a
            className="within-zero-cta"
            href="/deadline-calculator?date=2026-08-10&days=5&unit=calendar-days&direction=after"
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'within_days',
              })
              onNavigate(
                '/deadline-calculator?date=2026-08-10&days=5&unit=calendar-days&direction=after',
              )
            }}
          >
            Check your exact deadline
          </a>
        </section>

        <section className="within-zero-details">
          <details>
            <summary>Does “within” include the start date?</summary>
            <div>
              <p>
                Not always. Some rules treat the triggering date as day zero;
                others count it as day one. The original wording controls.
              </p>
            </div>
          </details>

          <details>
            <summary>Does “within 5 days” mean calendar or business days?</summary>
            <div>
              <p>
                If the wording only says “days,” it may mean calendar days, but
                that is not universal. If it says “business days,” weekends are
                normally skipped.
              </p>
            </div>
          </details>

          <details>
            <summary>What if the last day falls on a weekend?</summary>
            <div>
              <p>
                Do not move the date automatically unless the rule says to.
                Some deadlines roll forward, some roll backward, and some stay
                on the stated calendar date.
              </p>
            </div>
          </details>

          <details>
            <summary>Why can one day change the answer?</summary>
            <div>
              <p>
                Because counting the start date as day one shifts every later
                day in the sequence. On short deadlines, that one-day difference
                can materially change the result.
              </p>
            </div>
          </details>
        </section>

        <section className="within-zero-related" aria-label="Related deadline wording guides">
          <div>
            <p className="within-zero-section-eyebrow">Related answers</p>
            <h2>Need another counting rule?</h2>
          </div>

          <nav>
            <a
              href="/does-the-start-date-count"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/does-the-start-date-count')
              }}
            >
              Does the start date count?
            </a>

            <a
              href="/what-if-a-deadline-falls-on-a-weekend"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/what-if-a-deadline-falls-on-a-weekend')
              }}
            >
              What if a deadline lands on a weekend?
            </a>

            <a
              href="/deadline-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/deadline-calculator')
              }}
            >
              Deadline calculator
            </a>
          </nav>
        </section>
      </article>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The wording that created the deadline controls whether the start date, weekends, holidays, or end-date adjustments apply."
      />

      <style>{`
        .within-zero-page {
          --within-ink: #153654;
          --within-muted: #667b8e;
          --within-accent: #2d7b64;
          --within-field: #ece5f0;
          min-height: 100vh;
          background: #fffaf2;
        }

        .within-zero-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .within-zero-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .within-zero-shell {
          width: min(100% - 32px, 1100px);
          margin: 22px auto 0;
        }

        .within-zero-hero {
          padding: clamp(38px, 5vw, 60px) clamp(24px, 6vw, 70px) 36px;
          border: 1px solid rgba(89, 65, 105, 0.12);
          border-radius: 28px;
          background: var(--within-field);
          text-align: center;
        }

        .within-zero-eyebrow,
        .within-zero-section-eyebrow {
          margin: 0;
          color: var(--within-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .within-zero-hero h1 {
          max-width: 900px;
          margin: 10px auto 0;
          color: var(--within-ink);
          font-size: clamp(3rem, 6vw, 5.3rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .within-zero-answer {
          display: block;
          margin-top: 28px;
          color: var(--within-ink);
          font-size: clamp(3.7rem, 8vw, 7rem);
          font-weight: 950;
          line-height: 0.9;
          letter-spacing: -0.055em;
        }

        .within-zero-summary {
          max-width: 760px;
          margin: 22px auto 0;
          color: #3f657b;
          font-size: clamp(1.35rem, 2.5vw, 1.95rem);
          font-weight: 850;
          line-height: 1.25;
        }

        .within-zero-caveat {
          max-width: 720px;
          margin: 14px auto 0;
          color: var(--within-muted);
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .within-zero-example {
          margin-top: 16px;
          padding: 20px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 20px;
          background: #faf8fb;
        }

        .within-zero-example-heading {
          text-align: center;
        }

        .within-zero-example-heading h2,
        .within-zero-related h2 {
          margin: 5px 0 0;
          color: var(--within-ink);
          font-size: clamp(1.45rem, 2.6vw, 2.1rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .within-zero-example-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 840px;
          margin: 16px auto 0;
        }

        .within-zero-example-grid article {
          padding: 17px 18px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 15px;
          background: #fff;
        }

        .within-zero-example-grid article.is-including-start {
          border-color: rgba(45, 123, 100, 0.26);
          background: #e7f2ec;
        }

        .within-zero-example-grid span {
          display: block;
          color: #5d7287;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .within-zero-example-grid strong {
          display: block;
          margin-top: 7px;
          color: var(--within-ink);
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          line-height: 1.16;
        }

        .within-zero-example-grid p {
          margin: 8px 0 0;
          color: #667b8e;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .within-zero-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px auto 0;
          padding: 9px 16px;
          border-radius: 11px;
          background: #267357;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
        }

        .within-zero-details {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .within-zero-details details {
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .within-zero-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .within-zero-details details > div {
          padding: 0 14px 16px;
        }

        .within-zero-details p {
          max-width: 780px;
          margin: 0;
          color: #61768a;
          line-height: 1.58;
        }

        .within-zero-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #f2edf5;
        }

        .within-zero-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .within-zero-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.86rem;
          font-weight: 850;
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .within-zero-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .within-zero-brand img {
            width: 154px;
          }

          .within-zero-shell {
            width: min(100% - 24px, 680px);
            margin-top: 12px;
          }

          .within-zero-hero {
            padding: 22px 20px 20px;
            border-radius: 24px;
            text-align: left;
          }

          .within-zero-hero h1 {
            margin-top: 8px;
            font-size: clamp(2.2rem, 10vw, 3.2rem);
            line-height: 0.98;
          }

          .within-zero-answer {
            margin-top: 20px;
            font-size: clamp(3.4rem, 16vw, 5.4rem);
            line-height: 0.92;
          }

          .within-zero-summary {
            margin-top: 16px;
            font-size: clamp(1.2rem, 5.5vw, 1.62rem);
            line-height: 1.22;
          }

          .within-zero-caveat {
            margin-top: 12px;
            font-size: 0.86rem;
            line-height: 1.45;
          }

          .within-zero-example {
            padding: 16px;
          }

          .within-zero-example-heading {
            text-align: left;
          }

          .within-zero-example-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .within-zero-cta {
            width: 100%;
          }

          .within-zero-related {
            padding: 18px;
          }

          .within-zero-related nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
function NetThirtyVsThirtyDaysGuidePage({ onNavigate }: NavigationProps) {
  const [invoiceDate, setInvoiceDate] = useState(() =>
    getInitialDateQueryParam('date', todayInputValue()),
  )

  const parsedInvoiceDate = parsePlainDate(invoiceDate)
  const netThirtyDate = parsedInvoiceDate
    ? getDueDateForMode('invoice', parsedInvoiceDate, 0, 'net30')
    : null
  const thirtyCalendarDaysDate = parsedInvoiceDate
    ? addCalendarDays(parsedInvoiceDate, 30)
    : null

  useEffect(() => {
    syncShareableQueryParams({ date: invoiceDate })
  }, [invoiceDate])

  const monthName = (date: PlainDate) =>
    [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]

  const formatAnswerDate = (date: PlainDate) =>
    `${monthName(date)} ${date.day}, ${date.year}`

  const datesMatch =
    netThirtyDate &&
    thirtyCalendarDaysDate &&
    toDateKey(netThirtyDate) === toDateKey(thirtyCalendarDaysDate)

  return (
    <main className="page-shell net30-zero-page">
      <header className="net30-zero-header" aria-label="WhenIsDue navigation">
        <a
          className="net30-zero-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <article className="net30-zero-shell">
        <header className="net30-zero-hero">
          <p className="net30-zero-eyebrow">Invoice wording guide</p>
          <h1>Net 30 vs 30 days</h1>

          <strong className="net30-zero-answer">
            Usually the same date.
          </strong>

          <p className="net30-zero-summary">
            But they do not mean the same thing.
          </p>

          <p className="net30-zero-explainer">
            <strong>Net 30</strong> is a payment term.{' '}
            <strong>30 days</strong> is just a length of time unless the source
            tells you what it applies to.
          </p>
        </header>

        <section className="net30-zero-compare" aria-labelledby="net30-zero-compare-title">
          <div className="net30-zero-compare-heading">
            <p className="net30-zero-section-eyebrow">Quick check</p>
            <h2 id="net30-zero-compare-title">For this invoice date</h2>
          </div>

          <form
            className="net30-zero-date-control"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              <span>Invoice date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={invoiceDate}
                onChange={(event) => {
                  setInvoiceDate(event.target.value)
                  trackWhenIsDueEvent('date_changed', {
                    context: 'net30_vs_30_days',
                    value: event.target.value,
                  })
                }}
              />
            </label>
          </form>

          {parsedInvoiceDate && netThirtyDate && thirtyCalendarDaysDate ? (
            <div className="net30-zero-result-grid" aria-live="polite">
              <article className="is-net30">
                <span>Net 30</span>
                <strong>{formatWeekday(netThirtyDate)},</strong>
                <b>{formatAnswerDate(netThirtyDate)}</b>
                <small>Payment term</small>
              </article>

              <article>
                <span>30 calendar days</span>
                <strong>{formatWeekday(thirtyCalendarDaysDate)},</strong>
                <b>{formatAnswerDate(thirtyCalendarDaysDate)}</b>
                <small>Length of time</small>
              </article>
            </div>
          ) : (
            <p className="net30-zero-invalid">Enter a valid invoice date.</p>
          )}

          {datesMatch ? (
            <p className="net30-zero-match">
              Same date here. Different meaning.
            </p>
          ) : null}
        </section>

        <section className="net30-zero-details">
          <details>
            <summary>When are they the same?</summary>
            <div>
              <p>
                They match when Net 30 means 30 calendar days after the invoice
                date and no other rule moves the final date.
              </p>
            </div>
          </details>

          <details>
            <summary>Why can they be different?</summary>
            <div>
              <p>
                A payment term can start from a different event, such as receipt
                of the invoice, acceptance of goods, or completion of work. It
                can also include weekend, holiday, or contract-specific rules.
              </p>
            </div>
          </details>

          <details>
            <summary>Does the invoice date count as day one?</summary>
            <div>
              <p>
                In WhenIsDue’s standard Net 30 calculation, the invoice date is
                day zero and the due date is 30 calendar days later.
              </p>
            </div>
          </details>
        </section>

        <section className="net30-zero-related" aria-label="Related invoice tools and guides">
          <div>
            <p className="net30-zero-section-eyebrow">Related</p>
            <h2>Need the actual due date?</h2>
          </div>

          <nav>
            <a
              href="/invoice-due-date-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/invoice-due-date-calculator')
              }}
            >
              Invoice due date calculator
            </a>

            <a
              href="/net-30-due-date"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/net-30-due-date')
              }}
            >
              Net 30 due date
            </a>

            <a
              href="/2-10-net-30-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/2-10-net-30-calculator')
              }}
            >
              2/10 Net 30 calculator
            </a>
          </nav>
        </section>
      </article>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The invoice, contract, or policy controls the actual payment term."
      />

      <style>{`
        .net30-zero-page {
          --net30-ink: #153654;
          --net30-muted: #667b8e;
          --net30-accent: #2d7b64;
          --net30-field: #f1e4d7;
          min-height: 100vh;
          background: #fffaf2;
        }

        .net30-zero-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .net30-zero-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .net30-zero-shell {
          width: min(100% - 32px, 1100px);
          margin: 22px auto 0;
        }

        .net30-zero-hero {
          padding: clamp(38px, 5vw, 60px) clamp(24px, 6vw, 70px) 36px;
          border: 1px solid rgba(118, 82, 50, 0.12);
          border-radius: 28px;
          background: var(--net30-field);
          text-align: center;
        }

        .net30-zero-eyebrow,
        .net30-zero-section-eyebrow {
          margin: 0;
          color: var(--net30-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .net30-zero-hero h1 {
          margin: 10px 0 0;
          color: var(--net30-ink);
          font-size: clamp(3.2rem, 6vw, 5.4rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
        }

        .net30-zero-answer {
          display: block;
          margin-top: 28px;
          color: var(--net30-ink);
          font-size: clamp(3.6rem, 7.5vw, 6.7rem);
          font-weight: 950;
          line-height: 0.9;
          letter-spacing: -0.055em;
        }

        .net30-zero-summary {
          margin: 17px 0 0;
          color: #3f657b;
          font-size: clamp(1.4rem, 2.8vw, 2.1rem);
          font-weight: 900;
        }

        .net30-zero-explainer {
          max-width: 760px;
          margin: 16px auto 0;
          color: var(--net30-muted);
          font-size: 0.98rem;
          line-height: 1.55;
        }

        .net30-zero-explainer strong {
          color: #35536e;
        }

        .net30-zero-compare {
          margin-top: 16px;
          padding: 20px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 20px;
          background: #faf7f3;
        }

        .net30-zero-compare-heading {
          text-align: center;
        }

        .net30-zero-compare-heading h2,
        .net30-zero-related h2 {
          margin: 5px 0 0;
          color: var(--net30-ink);
          font-size: clamp(1.45rem, 2.6vw, 2.1rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .net30-zero-date-control {
          width: min(100%, 420px);
          margin: 16px auto 0;
        }

        .net30-zero-date-control label {
          display: grid;
          gap: 7px;
        }

        .net30-zero-date-control label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .net30-zero-date-control input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .net30-zero-result-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 840px;
          margin: 16px auto 0;
        }

        .net30-zero-result-grid article {
          padding: 17px 18px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 15px;
          background: #fff;
        }

        .net30-zero-result-grid article.is-net30 {
          border-color: rgba(45, 123, 100, 0.26);
          background: #e7f2ec;
        }

        .net30-zero-result-grid span,
        .net30-zero-result-grid strong,
        .net30-zero-result-grid b,
        .net30-zero-result-grid small {
          display: block;
        }

        .net30-zero-result-grid span {
          color: #5d7287;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .net30-zero-result-grid strong {
          margin-top: 8px;
          color: #3f657b;
          font-size: clamp(1.45rem, 2.5vw, 2rem);
          line-height: 1;
        }

        .net30-zero-result-grid b {
          margin-top: 4px;
          color: var(--net30-ink);
          font-size: clamp(1.9rem, 3.8vw, 3rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .net30-zero-result-grid small {
          margin-top: 8px;
          color: #748596;
          font-size: 0.82rem;
        }

        .net30-zero-match {
          margin: 14px 0 0;
          color: #35536e;
          font-weight: 900;
          text-align: center;
        }

        .net30-zero-invalid {
          margin: 16px 0 0;
          color: var(--net30-muted);
          text-align: center;
        }

        .net30-zero-details {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .net30-zero-details details {
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .net30-zero-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .net30-zero-details details > div {
          padding: 0 14px 16px;
        }

        .net30-zero-details p {
          max-width: 780px;
          margin: 0;
          color: #61768a;
          line-height: 1.58;
        }

        .net30-zero-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #f5ede6;
        }

        .net30-zero-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .net30-zero-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.86rem;
          font-weight: 850;
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .net30-zero-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .net30-zero-brand img {
            width: 154px;
          }

          .net30-zero-shell {
            width: min(100% - 24px, 680px);
            margin-top: 12px;
          }

          .net30-zero-hero {
            padding: 22px 20px 20px;
            border-radius: 24px;
            text-align: left;
          }

          .net30-zero-hero h1 {
            margin-top: 8px;
            font-size: clamp(2.5rem, 11vw, 3.5rem);
          }

          .net30-zero-answer {
            margin-top: 20px;
            font-size: clamp(3rem, 14vw, 4.8rem);
            line-height: 0.92;
          }

          .net30-zero-summary {
            margin-top: 14px;
            font-size: clamp(1.25rem, 5.6vw, 1.7rem);
          }

          .net30-zero-explainer {
            margin-top: 12px;
            font-size: 0.88rem;
          }

          .net30-zero-compare {
            padding: 16px;
          }

          .net30-zero-compare-heading {
            text-align: left;
          }

          .net30-zero-date-control {
            margin-top: 14px;
          }

          .net30-zero-result-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .net30-zero-result-grid b {
            font-size: clamp(2rem, 9vw, 2.85rem);
          }

          .net30-zero-related {
            padding: 18px;
          }

          .net30-zero-related nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
function DeadlineWeekendExtensionGuidePage({ onNavigate }: NavigationProps) {
  const [deadlineDate, setDeadlineDate] = useState(() =>
    getInitialDateQueryParam('date', '2026-08-15'),
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  const parsedDeadlineDate = parsePlainDate(deadlineDate)
  const nextBusinessDay = parsedDeadlineDate
    ? calculateBusinessDaysWithCalendar(
        parsedDeadlineDate,
        1,
        holidayCalendar,
      ).date
    : null

  const nextBusinessDayMonth = nextBusinessDay
    ? [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ][nextBusinessDay.month - 1]
    : ''

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  useEffect(() => {
    syncShareableQueryParams({
      date: deadlineDate,
      calendar: holidayCalendarQueryValue(holidayCalendar),
    })
  }, [deadlineDate, holidayCalendar])

  return (
    <main className="page-shell weekend-zero-page">
      <header className="weekend-zero-header" aria-label="WhenIsDue navigation">
        <a
          className="weekend-zero-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <section className="weekend-zero-shell">
        <section className="weekend-zero-hero">
          <p className="weekend-zero-eyebrow">WEEKEND DEADLINE GUIDE</p>
          <h1>What if a deadline falls on a weekend?</h1>

          <strong className="weekend-zero-answer">
            Often, it moves to the next business day.
          </strong>

          <p className="weekend-zero-caveat">
            But only if the rule that created the deadline says it should.
          </p>
        </section>

        <section className="weekend-zero-check" aria-label="Check a weekend deadline">
          <div className="weekend-zero-result" aria-live="polite">
            {parsedDeadlineDate && nextBusinessDay ? (
              <>
                <span>If your rule says “next business day”</span>
                <strong>{formatWeekday(nextBusinessDay)},</strong>
                <b>
                  {nextBusinessDayMonth} {nextBusinessDay.day}, {nextBusinessDay.year}
                </b>
              </>
            ) : (
              <strong>Enter a valid deadline date.</strong>
            )}
          </div>

          <form onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Deadline date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
              />
            </label>

            <HolidayCalendarSelect
              value={holidayCalendar}
              onChange={(nextCalendar) => {
                setHolidayCalendar(nextCalendar)
                trackWhenIsDueEvent('holiday_calendar_changed', {
                  context: 'deadline_weekend_extension_guide',
                  value: nextCalendar,
                })
              }}
              compact
            />
          </form>
        </section>

        <details className="weekend-zero-details">
          <summary>When does it move?</summary>
          <div>
            <p>
              A weekend deadline usually moves when the governing rule says the
              final day must be a business day, working day, or non-holiday, or
              when it specifically provides a next-business-day adjustment.
            </p>
          </div>
        </details>

        <details className="weekend-zero-details">
          <summary>When might it stay on Saturday or Sunday?</summary>
          <div>
            <p>
              If the source gives a fixed date or simply says a number of
              calendar days without a weekend-extension rule, do not assume
              Monday automatically replaces the stated date.
            </p>
          </div>
        </details>

        <details className="weekend-zero-details">
          <summary>What about public holidays?</summary>
          <div>
            <p>
              The same principle applies. Some rules move a deadline that lands
              on a recognized holiday and some do not. The applicable holiday
              calendar can also change the next qualifying business day.
            </p>
          </div>
        </details>

        <nav className="weekend-zero-related" aria-label="Related deadline guides">
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Check your exact deadline
          </a>

          <a
            href="/do-weekends-count-as-business-days"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/do-weekends-count-as-business-days')
            }}
          >
            Do weekends count as business days?
          </a>
        </nav>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The contract, policy, law, court rule, or other source controls whether a weekend or holiday deadline moves."
      />

      <style>{`
        .weekend-zero-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .weekend-zero-header {
          width: min(100% - 32px, 980px);
          margin: 0 auto;
          padding: 28px 0 18px;
          border-bottom: 1px solid rgba(21, 54, 84, 0.10);
        }

        .weekend-zero-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .weekend-zero-brand img {
          display: block;
          width: auto;
          height: 40px;
          max-width: 190px;
          object-fit: contain;
        }

        .weekend-zero-shell {
          width: min(100% - 32px, 980px);
          margin: 0 auto;
          padding: 22px 0 64px;
        }

        .weekend-zero-hero {
          padding: clamp(34px, 6vw, 66px);
          border: 1px solid rgba(21, 54, 84, 0.10);
          border-radius: 26px;
          background: #f3ecdc;
          text-align: center;
        }

        .weekend-zero-eyebrow {
          margin: 0;
          color: #26806b;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        .weekend-zero-hero h1 {
          max-width: 820px;
          margin: 14px auto 0;
          color: #153654;
          font-size: clamp(2.35rem, 6.2vw, 4.7rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .weekend-zero-answer {
          display: block;
          max-width: 760px;
          margin: 34px auto 0;
          color: #153654;
          font-size: clamp(2.5rem, 7vw, 5.35rem);
          line-height: 0.94;
          letter-spacing: -0.055em;
        }

        .weekend-zero-caveat {
          max-width: 680px;
          margin: 22px auto 0;
          color: #4f6d7e;
          font-size: clamp(1.05rem, 2vw, 1.3rem);
          font-weight: 750;
          line-height: 1.35;
        }

        .weekend-zero-check {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 12px;
          margin-top: 14px;
        }

        .weekend-zero-result,
        .weekend-zero-check form {
          min-width: 0;
          padding: 22px;
          border: 1px solid rgba(21, 54, 84, 0.10);
          border-radius: 20px;
          background: #fff;
        }

        .weekend-zero-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .weekend-zero-result > span {
          color: #60778b;
          font-size: 0.82rem;
          font-weight: 850;
          letter-spacing: 0.03em;
        }

        .weekend-zero-result > strong {
          margin-top: 8px;
          color: #3f7289;
          font-size: clamp(1.7rem, 4vw, 2.75rem);
          line-height: 1;
        }

        .weekend-zero-result > b {
          margin-top: 3px;
          color: #153654;
          font-size: clamp(2rem, 5vw, 3.25rem);
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .weekend-zero-check form {
          display: grid;
          gap: 12px;
          align-content: center;
        }

        .weekend-zero-check label {
          display: grid;
          gap: 6px;
        }

        .weekend-zero-check label > span {
          color: #4f6880;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .weekend-zero-check input,
        .weekend-zero-check select {
          width: 100%;
          min-height: 48px;
        }

        .weekend-zero-details {
          margin-top: 10px;
          border: 1px solid rgba(21, 54, 84, 0.09);
          border-radius: 16px;
          background: #fff;
        }

        .weekend-zero-details summary {
          cursor: pointer;
          padding: 17px 18px;
          color: #153654;
          font-size: 1rem;
          font-weight: 850;
        }

        .weekend-zero-details div {
          padding: 0 18px 18px;
        }

        .weekend-zero-details p {
          max-width: 760px;
          margin: 0;
          color: #62788d;
          font-size: 0.96rem;
          line-height: 1.55;
        }

        .weekend-zero-related {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }

        .weekend-zero-related a {
          display: grid;
          place-items: center;
          min-height: 52px;
          padding: 12px 16px;
          border: 1px solid rgba(21, 54, 84, 0.12);
          border-radius: 14px;
          background: #fff;
          color: #153654;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
        }

        .weekend-zero-related a:first-child {
          border-color: #277e65;
          background: #277e65;
          color: #fff;
        }

        @media (max-width: 720px) {
          .weekend-zero-header {
            width: min(100% - 24px, 980px);
            padding: 26px 0 18px;
          }

          .weekend-zero-brand img {
            height: 44px;
            max-width: 210px;
          }

          .weekend-zero-shell {
            width: min(100% - 24px, 980px);
            padding-top: 14px;
          }

          .weekend-zero-hero {
            padding: 28px 24px 32px;
            border-radius: 24px;
            text-align: left;
          }

          .weekend-zero-eyebrow {
            font-size: 0.72rem;
          }

          .weekend-zero-hero h1 {
            margin-top: 12px;
            font-size: clamp(2.15rem, 9.4vw, 3rem);
            line-height: 0.98;
          }

          .weekend-zero-answer {
            margin-top: 26px;
            font-size: clamp(2.65rem, 12.2vw, 3.85rem);
            line-height: 0.94;
          }

          .weekend-zero-caveat {
            margin-top: 18px;
            font-size: 1.02rem;
            line-height: 1.32;
          }

          .weekend-zero-check {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .weekend-zero-result {
            order: 1;
          }

          .weekend-zero-check form {
            order: 2;
          }

          .weekend-zero-result > strong {
            font-size: 2rem;
          }

          .weekend-zero-result > b {
            font-size: clamp(2.2rem, 10vw, 3rem);
          }

          .weekend-zero-related {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}

function NextPaydayPage({ onNavigate }: NavigationProps) {
  const [knownPayday, setKnownPayday] = useState(() =>
    getInitialDateQueryParam('payday', todayInputValue()),
  )
  const [schedule, setSchedule] = useState<PaySchedule>(getInitialPaySchedule)

  const parsedKnownPayday = parsePlainDate(knownPayday)
  const nextPayday = parsedKnownPayday
    ? calculateNextPayday(parsedKnownPayday, schedule)
    : null

  useEffect(() => {
    syncShareableQueryParams({
      payday: knownPayday,
      schedule,
    })
  }, [knownPayday, schedule])

  const scheduleShortLabel =
    schedule === 'weekly'
      ? 'Weekly'
      : schedule === 'biweekly'
        ? 'Every 2 weeks'
        : schedule === 'semimonthly-1-15'
          ? '1st & 15th'
          : schedule === 'semimonthly-15-last'
            ? '15th & last day'
            : 'Monthly'

  const formatPaydayDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  return (
    <main className="page-shell payday-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="payday-answer-shell" aria-labelledby="payday-answer-title">
        <div className="payday-answer-hero">
          <p className="payday-answer-eyebrow">Next payday calculator</p>

          {nextPayday && parsedKnownPayday ? (
            <>
              <h1 id="payday-answer-title">Your next payday is</h1>

              <strong
                className="payday-answer-date"
                aria-label={`${formatWeekday(nextPayday)}, ${formatPlainDate(nextPayday)}`}
              >
                <span className="payday-answer-weekday">
                  {formatWeekday(nextPayday)},
                </span>
                <span className="payday-answer-date-main" aria-hidden="true">
                  <span className="payday-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][nextPayday.month - 1]
                    }
                  </span>
                  <span className="payday-answer-day">{nextPayday.day}</span>
                  <span className="payday-answer-comma">,</span>
                  <span className="payday-answer-year">{nextPayday.year}</span>
                </span>
              </strong>

              <p className="payday-answer-context">
                {scheduleShortLabel} · Known payday {formatPaydayDate(parsedKnownPayday)}
              </p>

              <p className="payday-answer-caveat">
                Schedule date only · Employer or bank adjustments may change it
              </p>
            </>
          ) : (
            <>
              <h1 id="payday-answer-title">When is my next payday?</h1>
              <p className="payday-answer-context">
                Choose a valid known payday and pay schedule below.
              </p>
            </>
          )}
        </div>

        <form
          className="payday-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Known payday</span>
            <input
              type="date"
              value={knownPayday}
              onChange={(event) => {
                setKnownPayday(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'next_payday',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <div className="payday-answer-quick-picks" aria-label="Common pay schedules">
            {[
              ['Weekly', 'weekly'],
              ['Every 2 weeks', 'biweekly'],
              ['1st & 15th', 'semimonthly-1-15'],
              ['15th & last', 'semimonthly-15-last'],
              ['Monthly', 'monthly'],
            ].map(([label, value]) => (
              <button
                type="button"
                key={value}
                className={schedule === value ? 'is-active' : ''}
                aria-pressed={schedule === value}
                onClick={() => {
                  setSchedule(value as PaySchedule)
                  trackWhenIsDueEvent('quick_pick', {
                    context: 'next_payday',
                    value,
                  })
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </form>
      </section>

      {nextPayday && parsedKnownPayday ? (
        <section className="payday-answer-actions">
          <ResultActions
            title="Next payday"
            date={nextPayday}
            details={payScheduleLabel(schedule)}
            variant="return-window"
          />

          <details className="payday-answer-details">
            <summary>Why this date?</summary>
            <div className="payday-answer-detail-body">
              <p>
                {formatPaydayExplanation(
                  parsedKnownPayday,
                  schedule,
                  nextPayday,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="next_payday"
                rows={[
                  {
                    label: 'Known payday',
                    value: `${formatWeekday(parsedKnownPayday)}, ${formatPlainDate(parsedKnownPayday)}`,
                  },
                  {
                    label: 'Pay schedule',
                    value: payScheduleLabel(schedule),
                  },
                  {
                    label: 'Weekend / holiday adjustment',
                    value: 'Not automatically applied',
                  },
                  {
                    label: 'Next payday',
                    value: `${formatWeekday(nextPayday)}, ${formatPlainDate(nextPayday)}`,
                  },
                ]}
              />
            </div>
          </details>
        </section>
      ) : null}

      <section className="payday-answer-related" aria-label="Related timing tools">
        <div>
          <p className="payday-answer-section-eyebrow">Related timing tools</p>
          <h2>Plan around the payment date</h2>
        </div>

        <nav>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator
          </a>
          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            Invoice due date calculator
          </a>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator
          </a>
        </nav>
      </section>

      <section className="payday-answer-content" aria-label="Pay schedule help">
        <div className="payday-answer-content-heading">
          <p className="payday-answer-section-eyebrow">Pay schedule rules</p>
          <h2>Known payday, schedule, next payday</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Weekly and biweekly schedules add 7 or 14 calendar days. Semimonthly
            schedules use the selected dates each month. Monthly schedules use
            the same calendar day when that day exists, or the last day of a
            shorter month.
          </p>
        </article>

        <article>
          <h2>Biweekly is not twice a month</h2>
          <p>
            Biweekly means every 14 days. Semimonthly means two scheduled pay
            dates each month, so the spacing between checks can vary.
          </p>
        </article>

        <article>
          <h2>Weekend and holiday changes</h2>
          <p>
            This calculator shows the scheduled date before employer or bank
            adjustments. Your payroll policy may move a payment earlier or
            later.
          </p>
        </article>

        <article>
          <h2>If your schedule is different</h2>
          <p>
            Use the closest matching schedule here, then confirm the actual
            payroll policy with your employer or payroll provider.
          </p>
        </article>

        <article>
          <h2>Next payday FAQ</h2>
          <dl>
            <dt>Is biweekly the same as twice a month?</dt>
            <dd>
              No. Biweekly means every 14 days. Semimonthly means two scheduled
              pay dates each month.
            </dd>
            <dt>Does this move payday for a weekend or holiday?</dt>
            <dd>
              No. Payroll policies differ, so the displayed date is the schedule
              date before employer or bank adjustments.
            </dd>
            <dt>What if my employer uses a different schedule?</dt>
            <dd>
              Use the closest matching schedule here and confirm the actual
              payroll policy with your employer.
            </dd>
          </dl>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Employers, payroll providers, and banks may adjust scheduled pay dates for weekends, holidays, or processing rules."
      />

      <style>{`
        .payday-answer-page {
          --payday-ink: #173651;
          --payday-muted: #687b8e;
          --payday-accent: #2d7b64;
          --payday-field: #e8ebd8;
          --payday-field-soft: #f2f3e7;
          min-height: 100vh;
          background: #fffaf2;
        }

        .payday-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(23, 54, 81, 0.12);
        }

        .payday-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .payday-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .payday-answer-shell,
        .payday-answer-actions,
        .payday-answer-related,
        .payday-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .payday-answer-shell {
          margin-top: 22px;
        }

        .payday-answer-hero {
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(82, 91, 48, 0.13);
          border-radius: 28px 28px 0 0;
          background: var(--payday-field);
          text-align: center;
        }

        .payday-answer-eyebrow,
        .payday-answer-section-eyebrow {
          margin: 0;
          color: var(--payday-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .payday-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--payday-ink);
          font-size: clamp(2.8rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .payday-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 26px;
          color: var(--payday-ink);
          font-weight: 900;
        }

        .payday-answer-weekday {
          color: #466b74;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .payday-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .payday-answer-month,
        .payday-answer-day,
        .payday-answer-comma,
        .payday-answer-year {
          display: inline;
        }

        .payday-answer-comma {
          margin-left: -0.08em;
        }

        .payday-answer-context {
          margin: 18px 0 0;
          color: var(--payday-muted);
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .payday-answer-caveat {
          margin: 10px 0 0;
          color: #73848f;
          font-size: 0.82rem;
          line-height: 1.45;
        }

        .payday-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(220px, 0.95fr) minmax(420px, 1.7fr);
          gap: 12px;
          align-items: end;
          padding: 18px;
          border: 1px solid rgba(82, 91, 48, 0.13);
          border-top: 1px solid rgba(82, 91, 48, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--payday-field-soft);
        }

        .payday-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .payday-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .payday-answer-controls input,
        .payday-answer-controls select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(23, 54, 81, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .payday-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .payday-answer-quick-picks button {
          min-height: 50px;
          padding: 8px 9px;
          border: 1px solid rgba(23, 54, 81, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f6780;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .payday-answer-quick-picks button.is-active {
          border-color: rgba(45, 123, 100, 0.58);
          background: #e7f3ee;
          color: #1f6655;
        }

        .payday-answer-actions {
          margin-top: 16px;
        }

        .payday-answer-actions > .result-actions {
          justify-content: center;
        }

        .payday-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(23, 54, 81, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .payday-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .payday-answer-detail-body {
          padding: 0 14px 16px;
        }

        .payday-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .payday-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .payday-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(23, 54, 81, 0.1);
          border-radius: 22px;
          background: #eff1e6;
        }

        .payday-answer-related h2,
        .payday-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--payday-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .payday-answer-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .payday-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(23, 54, 81, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .payday-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .payday-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .payday-answer-content article {
          padding: 21px;
          border: 1px solid rgba(23, 54, 81, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .payday-answer-content article:last-child {
          grid-column: 1 / -1;
        }

        .payday-answer-content h2,
        .payday-answer-content h3 {
          margin: 0;
          color: var(--payday-ink);
          font-size: 1.08rem;
        }

        .payday-answer-content p,
        .payday-answer-content dd {
          color: #65798d;
          line-height: 1.55;
        }

        .payday-answer-content dl {
          margin: 14px 0 0;
        }

        .payday-answer-content dt {
          margin: 16px 0 0;
          color: var(--payday-ink);
          font-weight: 850;
        }

        .payday-answer-content dd {
          margin: 4px 0 0;
        }

        @media (max-width: 760px) {
          .payday-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .payday-answer-brand img {
            width: 154px;
          }

          .payday-answer-shell,
          .payday-answer-actions,
          .payday-answer-related,
          .payday-answer-content {
            width: min(100% - 24px, 680px);
          }

          .payday-answer-shell {
            margin-top: 14px;
          }

          .payday-answer-hero {
            padding: 26px 20px 24px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .payday-answer-hero h1 {
            font-size: clamp(2.5rem, 11vw, 3.7rem);
          }

          .payday-answer-date {
            justify-items: start;
            margin-top: 20px;
          }

          .payday-answer-weekday {
            font-size: clamp(2.15rem, 9.4vw, 3rem);
          }

          .payday-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(2.9rem, 13.2vw, 4.3rem);
            line-height: 0.9;
            white-space: normal;
          }

          .payday-answer-month,
          .payday-answer-day,
          .payday-answer-year {
            display: block;
          }

          .payday-answer-comma {
            display: none;
          }

          .payday-answer-context,
          .payday-answer-caveat {
            margin-left: 0;
            margin-right: 0;
          }

          .payday-answer-controls {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .payday-answer-quick-picks {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .payday-answer-controls input,
          .payday-answer-controls select,
          .payday-answer-quick-picks button {
            min-height: 46px;
          }

          .payday-answer-related {
            padding: 20px 18px;
          }

          .payday-answer-related nav {
            grid-template-columns: 1fr;
          }

          .payday-answer-content {
            display: block;
            margin-top: 28px;
          }

          .payday-answer-content-heading {
            margin-bottom: 8px;
          }

          .payday-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(23, 54, 81, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .payday-answer-content p,
          .payday-answer-content dd {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}

async function copySavedCalculationLink(item: SavedCalculation) {
  const absoluteUrl = new URL(item.url, window.location.origin).toString()

  try {
    await navigator.clipboard.writeText(absoluteUrl)
    trackWhenIsDueEvent('saved_calculation_link_copied', {
      title: item.title,
      status: 'success',
    })
    return true
  } catch {
    trackWhenIsDueEvent('saved_calculation_link_copied', {
      title: item.title,
      status: 'failed',
    })
    return false
  }
}

function SavedCalculationsPage({ onNavigate }: NavigationProps) {
  const [favorites, setFavorites] = useState<SavedCalculation[]>(() =>
    readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY),
  )
  const [recents, setRecents] = useState<SavedCalculation[]>(() =>
    readSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY),
  )
  const [message, setMessage] = useState<string | null>(null)

  const recentOnly = useMemo(
    () => {
      const favoriteIds = new Set(favorites.map((item) => item.id))
      return recents.filter((item) => !favoriteIds.has(item.id))
    },
    [favorites, recents],
  )

  useEffect(() => {
    const refresh = () => {
      setFavorites(readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY))
      setRecents(readSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY))
    }

    window.addEventListener(SAVED_CALCULATIONS_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(SAVED_CALCULATIONS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  function openItem(item: SavedCalculation, type: 'favorite' | 'recent') {
    trackWhenIsDueEvent('saved_calculation_opened', {
      type,
      title: item.title,
    })
    onNavigate(item.url)
  }

  async function copyItemLink(item: SavedCalculation) {
    const copied = await copySavedCalculationLink(item)
    setMessage(copied ? 'Exact calculation link copied.' : 'Link copy is not available in this browser.')
  }

  const hasItems = favorites.length > 0 || recentOnly.length > 0

  return (
    <main className="page-shell saved-calculations-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="saved-calculations-hero">
        <p className="friendly-eyebrow">
          <span aria-hidden="true">★</span>
          Local history
        </p>
        <h1>Saved calculations</h1>
        <p>
          Reopen the exact calculator state you used before. Favorites and recent
          calculations are stored only on this device.
        </p>
        {message ? <div className="saved-calculations-message" aria-live="polite">{message}</div> : null}
      </section>

      {!hasItems ? (
        <section className="saved-calculations-empty">
          <h2>Nothing saved yet</h2>
          <p>
            Favorite a result or use Copy, Share, or Add to calendar on a calculator.
            It will appear here automatically.
          </p>
          <a
            href="/calculators"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/calculators')
            }}
          >
            Browse calculators
          </a>
        </section>
      ) : (
        <section className="saved-calculations-groups">
          {favorites.length > 0 ? (
            <div className="saved-calculations-group">
              <div className="saved-calculations-group-heading">
                <div>
                  <span>Favorites</span>
                  <h2>Your pinned calculations</h2>
                </div>
              </div>

              <div className="saved-calculations-list">
                {favorites.map((item) => (
                  <article className="saved-calculation-row" key={item.id}>
                    <button
                      type="button"
                      className="saved-calculation-main"
                      onClick={() => openItem(item, 'favorite')}
                    >
                      <span>Favorite</span>
                      <strong>{item.title}</strong>
                      <b>{item.dateText}</b>
                      {item.details ? <small>{item.details}</small> : null}
                    </button>

                    <div className="saved-calculation-actions">
                      <button type="button" onClick={() => copyItemLink(item)}>
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeSavedCalculation(FAVORITE_CALCULATIONS_STORAGE_KEY, item.id)
                          trackWhenIsDueEvent('favorite_removed', { title: item.title })
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {recentOnly.length > 0 ? (
            <div className="saved-calculations-group">
              <div className="saved-calculations-group-heading">
                <div>
                  <span>Recent</span>
                  <h2>Calculations you used recently</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    writeSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY, [])
                    trackWhenIsDueEvent('recent_calculations_cleared')
                  }}
                >
                  Clear recent
                </button>
              </div>

              <div className="saved-calculations-list">
                {recentOnly.map((item) => (
                  <article className="saved-calculation-row" key={item.id}>
                    <button
                      type="button"
                      className="saved-calculation-main"
                      onClick={() => openItem(item, 'recent')}
                    >
                      <span>Recent</span>
                      <strong>{item.title}</strong>
                      <b>{item.dateText}</b>
                      {item.details ? <small>{item.details}</small> : null}
                    </button>

                    <div className="saved-calculation-actions">
                      <button type="button" onClick={() => copyItemLink(item)}>
                        Copy link
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .saved-calculations-page {
          min-height: 100vh;
        }

        .saved-calculations-hero {
          width: min(900px, calc(100% - 36px));
          margin: 42px auto 0;
          text-align: center;
        }

        .saved-calculations-hero h1 {
          margin: 6px 0 0;
          color: #10213b;
          font-size: clamp(2.3rem, 5vw, 4.6rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .saved-calculations-hero > p:last-of-type {
          max-width: 650px;
          margin: 12px auto 0;
          color: #6d8094;
          line-height: 1.55;
        }

        .saved-calculations-message {
          margin: 10px auto 0;
          color: #536f8b;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .saved-calculations-empty,
        .saved-calculations-groups {
          width: min(980px, calc(100% - 36px));
          margin: 24px auto 48px;
        }

        .saved-calculations-empty {
          padding: 28px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 18px;
          background: #fff;
          text-align: center;
        }

        .saved-calculations-empty h2 {
          margin: 0;
          color: #263f5d;
        }

        .saved-calculations-empty p {
          max-width: 560px;
          margin: 8px auto 16px;
          color: #728398;
          line-height: 1.5;
        }

        .saved-calculations-empty a {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          padding: 8px 14px;
          border-radius: 10px;
          background: #173a63;
          color: #fff;
          font-weight: 850;
          text-decoration: none;
        }

        .saved-calculations-groups {
          display: grid;
          gap: 20px;
        }

        .saved-calculations-group {
          padding: 18px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.75);
        }

        .saved-calculations-group-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .saved-calculations-group-heading span {
          color: #7d8fa2;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .saved-calculations-group-heading h2 {
          margin: 2px 0 0;
          color: #2b435f;
          font-size: 1.05rem;
        }

        .saved-calculations-group-heading > button {
          min-height: 44px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 9px;
          background: #fff;
          color: #6b7f94;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
        }

        .saved-calculations-list {
          display: grid;
          gap: 8px;
        }

        .saved-calculation-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: stretch;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 13px;
          background: #fff;
          overflow: hidden;
        }

        .saved-calculation-main {
          display: grid;
          gap: 3px;
          min-width: 0;
          padding: 13px;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .saved-calculation-main > span {
          color: #8292a3;
          font-size: 0.75rem;
          font-weight: 850;
          text-transform: uppercase;
        }

        .saved-calculation-main > strong {
          overflow: hidden;
          color: #304a66;
          font-size: 0.84rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .saved-calculation-main > b {
          color: #0c1931;
          font-size: 1.02rem;
        }

        .saved-calculation-main > small {
          overflow: hidden;
          color: #667c92;
          font-size: 0.84rem;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .saved-calculation-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px;
        }

        .saved-calculation-actions button {
          min-height: 44px;
          padding: 7px 9px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 8px;
          background: #f7f9fb;
          color: #60758c;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .saved-calculations-hero,
          .saved-calculations-empty,
          .saved-calculations-groups {
            width: calc(100% - 20px);
          }

          .saved-calculations-hero {
            margin-top: 28px;
          }

          .saved-calculations-group {
            padding: 12px;
          }

          .saved-calculation-row {
            grid-template-columns: 1fr;
          }

          .saved-calculation-actions {
            border-top: 1px solid rgba(19, 38, 70, 0.06);
          }

          .saved-calculation-actions button {
            flex: 1;
          }
        }
      `}</style>
    </main>
  )
}

type AskWhenMatch = {
  label: string
  description: string
  path: string | null
  kind?: 'navigation' | 'deadline-answer' | 'clarification'
}

function normalizeAskWhenQuery(rawQuery: string) {
  return rawQuery
    .trim()
    .toLowerCase()
    .replace(/[?.!,]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(?:what\s+is|what's|when\s+is|when's)\s+/i, '')
    .replace(/^how\s+long\s+is\s+/i, '')
    .replace(/^how\s+many\s+days\s+is\s+/i, '')
    .replace(/^show\s+me\s+/i, '')
    .trim()
}

function resolveAskWhenQuery(
  rawQuery: string,
  holidayCalendar: HolidayCalendarId,
  today: PlainDate,
): AskWhenMatch | null {
  const query = normalizeAskWhenQuery(rawQuery)

  if (!query) return null

  const shippingRangePatterns = [
    /^(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s+(business|working|calendar)\s+days?\s+(?:shipping|delivery|arrival)$/,
    /^(?:shipping|delivery|arrival)\s+(?:in\s+)?(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s+(business|working|calendar)\s+days?$/,
    /^(?:arrives?|delivery|shipping)\s+in\s+(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s+(business|working|calendar)\s+days?$/,
    /^when\s+will\s+(?:it|my\s+(?:order|package|delivery))\s+arrive\s+in\s+(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})\s+(business|working|calendar)\s+days?$/,
  ]

  for (const pattern of shippingRangePatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const minimumDays = Number(match[1])
    const maximumDays = Number(match[2])
    const unit = match[3]

    if (
      !Number.isFinite(minimumDays) ||
      !Number.isFinite(maximumDays) ||
      minimumDays < 0 ||
      maximumDays < 0 ||
      minimumDays > 365 ||
      maximumDays > 365 ||
      minimumDays > maximumDays
    ) {
      return null
    }

    const mode = unit === 'calendar' ? 'calendar' : 'business'
    const params = new URLSearchParams({
      min: String(minimumDays),
      max: String(maximumDays),
      mode,
    })

    if (mode === 'business') {
      const calendarValue = holidayCalendarQueryValue(holidayCalendar)

      if (calendarValue) {
        params.set('calendar', calendarValue)
      }
    }

    return {
      label: `${minimumDays}–${maximumDays} ${
        mode === 'business' ? 'business' : 'calendar'
      } day delivery range`,
      description:
        mode === 'business'
          ? holidayCalendar === 'none'
            ? 'See the earliest and latest dates with weekends skipped.'
            : `See the earliest and latest dates with weekends and ${
                getHolidayCalendarOption(holidayCalendar).shortLabel
              } holidays skipped.`
          : 'See the earliest and latest dates with weekends included.',
      path: `/shipping-delivery-range-calculator?${params.toString()}`,
    }
  }

  const noticePeriodPatterns = [
    /^(\d{1,3})\s+(calendar\s+days?|business\s+days?|working\s+days?|weeks?|months?)\s+(?:notice|notice period)\s+before\s+(\d{4}-\d{2}-\d{2})$/,
    /^(?:notice|notice period)\s+(\d{1,3})\s+(calendar\s+days?|business\s+days?|working\s+days?|weeks?|months?)\s+before\s+(\d{4}-\d{2}-\d{2})$/,
  ]

  for (const pattern of noticePeriodPatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const amount = Number(match[1])
    const rawUnit = match[2]
    const eventDate = match[3]

    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 365 ||
      !parsePlainDate(eventDate)
    ) {
      return null
    }

    const unit =
      rawUnit.startsWith('business') || rawUnit.startsWith('working')
        ? 'business-days'
        : rawUnit.startsWith('week')
          ? 'weeks'
          : rawUnit.startsWith('month')
            ? 'months'
            : 'calendar-days'

    const params = new URLSearchParams({
      date: eventDate,
      amount: String(amount),
      unit,
    })

    if (unit === 'business-days') {
      const calendarValue = holidayCalendarQueryValue(holidayCalendar)
      if (calendarValue) params.set('calendar', calendarValue)
    }

    return {
      label: `${amount} ${rawUnit} notice before ${eventDate}`,
      description: 'Find the latest date to give notice.',
      path: `/notice-period-calculator?${params.toString()}`,
    }
  }

  if (
    query === 'notice period calculator' ||
    query === 'contract notice calculator' ||
    query === 'cancellation notice calculator' ||
    query === 'renewal notice calculator'
  ) {
    return {
      label: 'Notice period calculator',
      description: 'Find the last date to act before a renewal or event.',
      path: '/notice-period-calculator',
    }
  }

  const subscriptionPatterns = [
    /^(?:subscription|membership|plan)\s+(?:renews?|renewal)\s+every\s+(\d{1,3})\s+(days?|weeks?|months?|years?)\s+(?:from|after)\s+(\d{4}-\d{2}-\d{2})$/,
    /^next\s+(?:subscription|membership|plan)\s+renewal\s+(\d{1,3})\s+(days?|weeks?|months?|years?)\s+(?:from|after)\s+(\d{4}-\d{2}-\d{2})$/,
  ]

  for (const pattern of subscriptionPatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const amount = Number(match[1])
    const rawUnit = match[2]
    const startDate = match[3]

    if (
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 365 ||
      !parsePlainDate(startDate)
    ) {
      return null
    }

    const unit =
      rawUnit.startsWith('day')
        ? 'days'
        : rawUnit.startsWith('week')
          ? 'weeks'
          : rawUnit.startsWith('year')
            ? 'years'
            : 'months'

    const params = new URLSearchParams({
      date: startDate,
      amount: String(amount),
      unit,
    })

    return {
      label: `Next renewal every ${amount} ${rawUnit}`,
      description:
        'Calculate the next renewal date and, if needed, the last day to cancel.',
      path: `/subscription-renewal-calculator?${params.toString()}`,
    }
  }

  if (
    query === 'subscription renewal calculator' ||
    query === 'renewal date calculator' ||
    query === 'subscription cancellation calculator' ||
    query === 'membership renewal calculator' ||
    query === 'billing renewal calculator'
  ) {
    return {
      label: 'Subscription renewal calculator',
      description:
        'Find the next renewal date and optional cancellation deadline.',
      path: '/subscription-renewal-calculator',
    }
  }

  const withinMatch = query.match(
    /^(?:what\s+does\s+)?within\s+(\d{1,3})\s+(business|working|calendar)?\s*days?(?:\s+(?:of|from)\s+(\d{4}-\d{2}-\d{2}))?(?:\s+mean)?$/,
  )

  if (withinMatch) {
    const amount = Number(withinMatch[1])
    const rawUnit = withinMatch[2]
    const date = withinMatch[3]

    if (Number.isFinite(amount) && amount >= 0 && amount <= 365) {
      const params = new URLSearchParams({
        amount: String(amount),
        unit:
          rawUnit === 'business' || rawUnit === 'working'
            ? 'business'
            : 'calendar',
      })
      if (date && parsePlainDate(date)) params.set('date', date)

      return {
        label: `What does “within ${amount} days” mean?`,
        description:
          'Compare the possible before-versus-after interpretations.',
        path: `/what-does-within-days-mean?${params.toString()}`,
      }
    }
  }

  if (
    query === 'within x days meaning' ||
    query === 'within days meaning' ||
    query === 'what does within days mean'
  ) {
    return {
      label: 'What does “within X days” mean?',
      description:
        'See why the wording can be ambiguous and compare both directions.',
      path: '/what-does-within-days-mean',
    }
  }

  if (
    query === 'net 30 vs 30 days' ||
    query === 'net 30 versus 30 days' ||
    query === 'is net 30 the same as 30 days' ||
    query === 'does net 30 mean 30 days' ||
    query === 'what is the difference between net 30 and 30 days'
  ) {
    return {
      label: 'Net 30 vs 30 days',
      description:
        'See why the arithmetic can match while the payment-term meaning can still differ.',
      path: '/net-30-vs-30-days',
    }
  }

  if (
    query === 'what if a deadline falls on a weekend' ||
    query === 'if a deadline falls on saturday is it due monday' ||
    query === 'if a deadline falls on sunday is it due monday' ||
    query === 'deadline falls on weekend' ||
    query === 'deadline on weekend' ||
    query === 'does a weekend deadline move to monday'
  ) {
    return {
      label: 'What if a deadline falls on a weekend?',
      description:
        'See when a weekend deadline may move to the next business day and when it may not.',
      path: '/what-if-a-deadline-falls-on-a-weekend',
    }
  }

  const deadlineInterpretation = interpretDeadlinePhrase(query, {
    today,
    holidayCalendar,
  })

  if (deadlineInterpretation) {
    if (deadlineInterpretation.classification === 'underspecified') {
      return {
        kind: 'clarification',
        label: 'What date should I start from?',
        description:
          'I know how many days you want to count, but I still need the date that starts the deadline.',
        path: null,
      }
    }

    const explicitlyUsesWithin = /\bwithin\b/.test(query)

    if (
      deadlineInterpretation.classification === 'ambiguous' &&
      deadlineInterpretation.triggerDate &&
      explicitlyUsesWithin
    ) {
      const query = new URLSearchParams({
        date: toDateKey(deadlineInterpretation.triggerDate),
        days: String(deadlineInterpretation.duration),
        unit: deadlineInterpretation.unit,
        direction: deadlineInterpretation.direction,
        startday: deadlineInterpretation.startDayConvention,
        endrule: deadlineInterpretation.endDayAdjustment,
        source: 'within',
      })

      const calendarValue = holidayCalendarQueryValue(holidayCalendar)

      if (calendarValue) {
        query.set('calendar', calendarValue)
      }

      return {
        kind: 'clarification',
        label: 'This wording can be counted two ways',
        description:
          'See both possible dates and choose whether the start date should count.',
        path: `/deadline-calculator?${query.toString()}`,
      }
    }

    if (
      (
        deadlineInterpretation.classification === 'resolved' ||
        (
          deadlineInterpretation.classification === 'ambiguous' &&
          !explicitlyUsesWithin
        )
      ) &&
      deadlineInterpretation.answer &&
      deadlineInterpretation.triggerDate
    ) {
      const answerDate = deadlineInterpretation.answer.answerDate

      const triggerEventLabel = deadlineInterpretation.triggerEvent
        ? deadlineInterpretation.triggerEventText
          ? deadlineInterpretation.triggerEventText
              .replace(/\b\w/g, (character) => character.toUpperCase())
          : deadlineInterpretation.triggerEvent.label
        : null

      const directionLabel =
        deadlineInterpretation.direction === 'before' ? 'before' : 'after'

      const unitLabel =
        deadlineInterpretation.unit === 'business-days'
          ? `business ${
              deadlineInterpretation.duration === 1 ? 'day' : 'days'
            }`
          : `calendar ${
              deadlineInterpretation.duration === 1 ? 'day' : 'days'
            }`

      let ruleText = 'Calendar days counted, including weekends.'

      if (deadlineInterpretation.unit === 'business-days') {
        ruleText =
          holidayCalendar === 'none'
            ? 'Start day not counted. Weekends skipped; public holidays still count as weekdays.'
            : `Start day not counted. Weekends and ${
                getHolidayCalendarOption(holidayCalendar).shortLabel
              } holidays skipped.`
      }

      return {
        kind: 'deadline-answer',
        label: formatPlainDate(answerDate),
        description: triggerEventLabel
          ? `Clock starts: ${triggerEventLabel} — ${formatPlainDate(
              deadlineInterpretation.triggerDate,
            )}. ${deadlineInterpretation.duration} ${unitLabel} ${directionLabel} that event. ${ruleText}`
          : `${deadlineInterpretation.duration} ${unitLabel} ${directionLabel} ${formatPlainDate(
              deadlineInterpretation.triggerDate,
            )}. ${ruleText}`,
        path: null,
      }
    }
  }

  const calendarSuffix =
    holidayCalendar === 'none' ? '' : `&calendar=${holidayCalendar}`
  const calendarOnlySuffix =
    holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`

  const businessPatterns = [
    /^(\d{1,3})\s+(?:business|working)\s+days?(?:\s+from\s+today)?$/,
    /^in\s+(\d{1,3})\s+(?:business|working)\s+days?$/,
    /^(\d{1,3})\s+(?:business|working)\s+days?\s+after\s+today$/,
    /^what\s+day\s+is\s+(\d{1,3})\s+(?:business|working)\s+days?\s+from\s+today$/,
  ]

  let businessDays: number | null = null

  for (const pattern of businessPatterns) {
    const match = query.match(pattern)
    if (match) {
      businessDays = Number(match[1])
      break
    }
  }

  if (businessDays !== null) {
    if (businessDays < 1 || businessDays > 365) return null

    const exactPages = new Set([3, 4, 5, 7, 8, 10, 20, 30])

    return {
      label: `${businessDays} business ${businessDays === 1 ? 'day' : 'days'} from today`,
      description:
        holidayCalendar === 'none'
          ? 'Skip weekends and show the exact date.'
          : `Skip weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays.`,
      path: exactPages.has(businessDays)
        ? `/${businessDays}-business-days-from-today${calendarOnlySuffix}`
        : `/business-days-calculator?days=${businessDays}${calendarSuffix}`,
    }
  }

  const twoTenNetThirtyPatterns = [
    /^2\s*\/\s*10\s*,?\s*net\s*30(?:\s+(?:due\s+date|terms?|calculator))?$/,
    /^2\s*%?\s*10\s+net\s*30(?:\s+(?:due\s+date|terms?|calculator))?$/,
    /^(?:what\s+does\s+)?2\s*\/\s*10\s*,?\s*net\s*30\s+mean$/,
  ]

  if (twoTenNetThirtyPatterns.some((pattern) => pattern.test(query))) {
    return {
      label: '2/10 Net 30',
      description:
        'See the early-payment discount deadline and the final Net 30 due date.',
      path: '/2-10-net-30-calculator',
    }
  }

  const netPatterns = [
    /^net\s*(7|15|30|45|60|90)(?:\s+(?:due\s+date|invoice|terms?))?$/,
    /^(?:invoice\s+)?net\s*(7|15|30|45|60|90)$/,
    /^(?:invoice\s+)?due\s+(?:in\s+)?(7|15|30|45|60|90)\s+days?$/,
    /^when\s+is\s+net\s*(7|15|30|45|60|90)\s+due$/,
  ]

  for (const pattern of netPatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const days = Number(match[1])
    return {
      label: `Net ${days} due date`,
      description: `Enter the invoice date and add ${days} calendar days.`,
      path: `/net-${days}-due-date`,
    }
  }

  const returnPatterns = [
    /^(\d{1,3})[\s-]*(?:day|days)\s+(?:return|return\s+window|return\s+deadline)$/,
    /^(?:return|return\s+window|return\s+deadline)\s+(\d{1,3})[\s-]*(?:day|days)$/,
    /^(\d{1,3})[\s-]*(?:day|days)\s+return\s+policy$/,
    /^return\s+deadline\s+in\s+(\d{1,3})\s+days?$/,
  ]

  for (const pattern of returnPatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const days = Number(match[1])
    if (days < 1 || days > 365) return null

    return {
      label: `${days}-day return deadline`,
      description: 'Enter the purchase or delivery date.',
      path: `/return-window-calculator?days=${days}`,
    }
  }

  const trialPatterns = [
    /^(\d{1,3})[\s-]*(?:day|days)\s+(?:free\s+)?trial$/,
    /^(?:free\s+)?trial\s+(\d{1,3})[\s-]*(?:day|days)$/,
    /^when\s+does\s+(?:a\s+)?(\d{1,3})[\s-]*(?:day|days)\s+(?:free\s+)?trial\s+end$/,
    /^(?:free\s+)?trial\s+ends\s+in\s+(\d{1,3})\s+days?$/,
  ]

  for (const pattern of trialPatterns) {
    const match = query.match(pattern)
    if (!match) continue

    const days = Number(match[1])
    if (days < 1 || days > 365) return null

    return {
      label: `${days}-day free trial`,
      description: 'Enter the trial start date.',
      path: `/free-trial-calculator?days=${days}`,
    }
  }

  if (
    query === 'shipping calculator' ||
    query === 'shipping date calculator' ||
    query === 'delivery calculator' ||
    query === 'delivery date calculator' ||
    query === 'delivery range calculator' ||
    query === 'shipping delivery calculator'
  ) {
    return {
      label: 'Shipping delivery date range',
      description:
        'Turn a shipping estimate into earliest and latest delivery dates.',
      path: '/shipping-delivery-range-calculator',
    }
  }

  if (
    query === 'next payday' ||
    query === 'next pay day' ||
    query === 'my next payday' ||
    query === 'my next pay day' ||
    query === 'payday calculator' ||
    query === 'pay day calculator' ||
    query === 'when is my next payday' ||
    query === 'when is my next pay day'
  ) {
    return {
      label: 'Next payday',
      description: 'Enter a known payday and your pay schedule.',
      path: '/next-payday-calculator',
    }
  }

  if (
    query === 'sla deadline' ||
    query === 'business hours deadline' ||
    query === 'business hour deadline' ||
    query === 'response deadline' ||
    query === 'business hours calculator'
  ) {
    return {
      label: 'Business-hours deadline',
      description: 'Add working hours inside a workday schedule.',
      path: `/business-hours-deadline-calculator${calendarOnlySuffix}`,
    }
  }

  if (
    query === 'business days between dates' ||
    query === 'business days between' ||
    query === 'working days between dates' ||
    query === 'working days between'
  ) {
    return {
      label: 'Business days between dates',
      description: 'Enter two dates and count the weekdays between them.',
      path: `/business-days-between-dates${calendarOnlySuffix}`,
    }
  }

  if (
    query === 'business days' ||
    query === 'business day calculator' ||
    query === 'working days' ||
    query === 'working day calculator'
  ) {
    return {
      label: 'Business days calculator',
      description: 'Add business days to today or another start date.',
      path: `/business-days-calculator${calendarOnlySuffix}`,
    }
  }

  if (
    query === 'invoice due date' ||
    query === 'invoice calculator' ||
    query === 'payment due date' ||
    query === 'invoice due date calculator'
  ) {
    return {
      label: 'Invoice due date',
      description: 'Calculate common Net terms or end-of-month terms.',
      path: '/invoice-due-date-calculator',
    }
  }

  if (
    query === 'return deadline' ||
    query === 'return window' ||
    query === 'return calculator' ||
    query === 'return window calculator'
  ) {
    return {
      label: 'Return deadline',
      description: 'Calculate the last day of a return window.',
      path: '/return-window-calculator',
    }
  }

  if (
    query === 'free trial' ||
    query === 'trial end date' ||
    query === 'trial calculator' ||
    query === 'free trial calculator'
  ) {
    return {
      label: 'Free trial end date',
      description: 'Estimate the trial end and a one-day-before reminder.',
      path: '/free-trial-calculator',
    }
  }

  return null
}

type AskWhenAssistState = {
  query: string
  suggestions: string[]
  suggestionMode: 'recognized' | 'typo' | 'ambiguous' | 'fallback'
  suggestionLabel: string
  committedLabel: string | null
  committedDescription: string | null
}

type AskWhenSuggestionRequest = {
  id: number
  text: string
  originalQuery: string
}

type AskWhenBoxProps = NavigationProps & {
  holidayCalendar: HolidayCalendarId
  today: PlainDate
  onAssistChange?: (state: AskWhenAssistState) => void
  suggestionRequest?: AskWhenSuggestionRequest | null
  onSuggestionApplied?: () => void
}

function AskWhenBox({
  onNavigate,
  holidayCalendar,
  today,
  onAssistChange,
  suggestionRequest,
  onSuggestionApplied,
}: AskWhenBoxProps) {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') ?? '',
  )
  const [submittedWithoutMatch, setSubmittedWithoutMatch] = useState(false)
  const [hasCommittedQuery, setHasCommittedQuery] = useState(false)
  const [completionPrompt, setCompletionPrompt] = useState<{
    label: string
    description: string
  } | null>(null)
  const [completionSuggestion, setCompletionSuggestion] = useState<string | undefined>(undefined)
  const [pendingCompletionContext, setPendingCompletionContext] = useState<{
    originalQuery: string
    suggestion?: string
  } | null>(null)
  const [isAskInputFocused, setIsAskInputFocused] = useState(false)
  const askInputRef = useRef<HTMLInputElement | null>(null)
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoText, setDemoText] = useState('')
  const [demoPhase, setDemoPhase] = useState<'typing' | 'pause' | 'erasing'>('typing')

  const demoQueries = useMemo(
    () => [
      '5 business days after August 10',
      'Net 30 from August 16',
      '30 day return from today',
      'shipping says 3–5 business days',
      'when does my free trial end',
    ],
    [],
  )

  useEffect(() => {
    if (query || isAskInputFocused) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      setDemoText(demoQueries[demoIndex])
      return
    }

    const currentDemo = demoQueries[demoIndex]
    let delay = 46

    if (demoPhase === 'typing') {
      if (demoText.length < currentDemo.length) {
        delay = 46
      } else {
        delay = 1500
      }
    } else if (demoPhase === 'pause') {
      delay = 1500
    } else {
      delay = demoText.length > 0 ? 24 : 320
    }

    const timer = window.setTimeout(() => {
      if (demoPhase === 'typing') {
        if (demoText.length < currentDemo.length) {
          setDemoText(currentDemo.slice(0, demoText.length + 1))
        } else {
          setDemoPhase('pause')
        }
        return
      }

      if (demoPhase === 'pause') {
        setDemoPhase('erasing')
        return
      }

      if (demoText.length > 0) {
        setDemoText(demoText.slice(0, -1))
        return
      }

      setDemoIndex((current) => (current + 1) % demoQueries.length)
      setDemoPhase('typing')
    }, delay)

    return () => window.clearTimeout(timer)
  }, [
    demoIndex,
    demoPhase,
    demoQueries,
    demoText,
    isAskInputFocused,
    query,
  ])

  const missingFactPlaceholder = useMemo(() => {
    const prompt = completionPrompt?.label.toLowerCase() ?? ''

    if (!prompt) return ''

    if (prompt.includes('invoice date')) return 'Type the invoice date'
    if (prompt.includes('purchase date')) return 'Type the purchase date'
    if (prompt.includes('trial start')) return 'Type the trial start date'
    if (prompt.includes('date was it shipped')) return 'Type the ship date'
    if (prompt.includes('date should i start')) return 'Type the start date'
    if (prompt.includes('payment terms')) return 'e.g. Net 30'
    if (prompt.includes('how many business days')) return 'e.g. 5 business days'
    if (prompt.includes('return window')) return 'e.g. 30 days'
    if (prompt.includes('how long is the trial')) return 'e.g. 14 days'
    if (prompt.includes('delivery range')) return 'e.g. 3–5 business days'
    if (prompt.includes('type the date with the month name')) {
      return 'e.g. August 5'
    }

    return 'Type the missing information'
  }, [completionPrompt])

  useEffect(() => {
    if (!completionPrompt || !pendingCompletionContext) return

    const frame = window.requestAnimationFrame(() => {
      askInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [completionPrompt, pendingCompletionContext])

  const match = useMemo(
    () => resolveAskWhenQuery(query, holidayCalendar, today),
    [query, holidayCalendar, today],
  )

  useEffect(() => {
    if (!suggestionRequest) return

    const originalQuery = suggestionRequest.originalQuery.trim()
    const completion = resolveAskWhenCompletion(
      originalQuery,
      toDateKey(today),
      suggestionRequest.text,
    )

    setSubmittedWithoutMatch(false)

    if (completion.kind === 'navigate') {
      trackWhenIsDueEvent('ask_when_completion_navigated', {
        query: originalQuery,
        suggestion: suggestionRequest.text,
        destination: completion.path,
        surface: 'intent_panel',
      })
      setPendingCompletionContext(null)
      onSuggestionApplied?.()
      setPendingCompletionContext(null)
      onNavigate(completion.path)
      return
    }

    if (completion.kind === 'missing') {
      setQuery('')
      setCompletionSuggestion(suggestionRequest.text)
      setPendingCompletionContext({
        originalQuery,
        suggestion: suggestionRequest.text,
      })
      setCompletionPrompt({
        label: completion.prompt,
        description: completion.description,
      })
      setHasCommittedQuery(true)
      trackWhenIsDueEvent('ask_when_completion_missing_fact', {
        query: originalQuery,
        suggestion: suggestionRequest.text,
        prompt: completion.prompt,
      })
      onSuggestionApplied?.()
      return
    }

    // Fallback for suggestion families that are not completion-enabled yet.
    setQuery(suggestionRequest.text)
    setCompletionSuggestion(undefined)
    setCompletionPrompt(null)
    setHasCommittedQuery(false)
    onSuggestionApplied?.()
  }, [suggestionRequest, onSuggestionApplied, onNavigate, today])

  const examples = [
    'what is 3 business days from today',
    '5 business days after August 10',
    '3-5 business days shipping',
    'Net 30 due date',
    '30 day return',
  ]

  const suggestionAnalysis = useMemo(
    () => analyzeAskWhenSuggestions(query),
    [query],
  )

  const contextualSuggestions = suggestionAnalysis.suggestions

  const suggestionItems =
    query.trim().length > 0 ? contextualSuggestions : examples

  const stableSuggestionItems = Array.from({ length: 4 }, (_, index) =>
    suggestionItems[index] ?? '',
  )

  useEffect(() => {
    onAssistChange?.({
      query,
      suggestions: contextualSuggestions,
      suggestionMode: suggestionAnalysis.mode,
      suggestionLabel: suggestionAnalysis.label,
      committedLabel:
        hasCommittedQuery
          ? completionPrompt?.label ?? match?.label ?? null
          : null,
      committedDescription:
        hasCommittedQuery
          ? completionPrompt?.description ?? match?.description ?? null
          : null,
    })
  }, [
    completionPrompt,
    contextualSuggestions,
    hasCommittedQuery,
    match,
    onAssistChange,
    query,
    suggestionAnalysis.label,
    suggestionAnalysis.mode,
  ])

  function submitQuery() {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const normalizedCurrent = normalizeAskWhenQuery(trimmedQuery)
    const normalizedOriginal = pendingCompletionContext
      ? normalizeAskWhenQuery(pendingCompletionContext.originalQuery)
      : ''

    const completionQuery =
      pendingCompletionContext &&
      normalizedCurrent !== normalizedOriginal &&
      !normalizedCurrent.includes(normalizedOriginal)
        ? `${pendingCompletionContext.originalQuery} ${trimmedQuery}`.trim()
        : trimmedQuery

    const activeSuggestion =
      pendingCompletionContext?.suggestion ?? completionSuggestion

    const completion = resolveAskWhenCompletion(
      completionQuery,
      toDateKey(today),
      activeSuggestion,
    )

    if (completion.kind === 'navigate') {
      setSubmittedWithoutMatch(false)
      setCompletionPrompt(null)
      setHasCommittedQuery(false)
      trackWhenIsDueEvent('ask_when_completion_navigated', {
        query: completionQuery,
        normalized_query: normalizeAskWhenQuery(completionQuery),
        destination: completion.path,
        surface: 'enter',
      })
      onNavigate(completion.path)
      return
    }

    if (completion.kind === 'missing') {
      setSubmittedWithoutMatch(false)
      setCompletionPrompt({
        label: completion.prompt,
        description: completion.description,
      })
      setPendingCompletionContext({
        originalQuery: completionQuery,
        suggestion: activeSuggestion,
      })
      setQuery('')
      setHasCommittedQuery(true)
      trackWhenIsDueEvent('ask_when_completion_missing_fact', {
        query: completionQuery,
        prompt: completion.prompt,
        surface: 'enter',
      })
      return
    }

    // Do not turn a genuinely ambiguous phrase into a false confident answer.
    // The live choices already visible in the intent panel are the next step.
    if (suggestionAnalysis.mode === 'ambiguous') {
      setSubmittedWithoutMatch(false)
      setCompletionPrompt(null)
      setHasCommittedQuery(false)
      trackWhenIsDueEvent('ask_when_ambiguous_enter', {
        query: trimmedQuery,
      })
      return
    }

    setHasCommittedQuery(true)
    setCompletionPrompt(null)

    if (!match) {
      setSubmittedWithoutMatch(true)
      trackWhenIsDueEvent('ask_when_unrecognized', {
        query: trimmedQuery,
      })
      return
    }

    setSubmittedWithoutMatch(false)

    if (!match.path) {
      trackWhenIsDueEvent(
        match.kind === 'clarification'
          ? 'ask_when_rule_clarification'
          : 'ask_when_direct_answer',
        {
          query: trimmedQuery,
          normalized_query: normalizeAskWhenQuery(trimmedQuery),
          answer: match.label,
        },
      )
      return
    }

    trackWhenIsDueEvent('ask_when_submitted', {
      query: trimmedQuery,
      normalized_query: normalizeAskWhenQuery(trimmedQuery),
      destination: match.path,
    })
    onNavigate(match.path)
  }

  return (
    <section className="ask-when-box" aria-labelledby="ask-when-title">
      <div className={`ask-when-heading ${completionPrompt ? 'is-missing-fact' : ''}`}>
        <span>{completionPrompt ? 'One more thing' : 'Ask WhenIsDue'}</span>
        <h2 id="ask-when-title">
          {completionPrompt ? completionPrompt.label : 'What do you need to know?'}
        </h2>
        <p>
          {completionPrompt
            ? completionPrompt.description
            : "Type it however you'd say it."}
        </p>
      </div>

      <form
        className="ask-when-form"
        onSubmit={(event) => {
          event.preventDefault()
          submitQuery()
        }}
      >
        <input
          ref={askInputRef}
          type="text"
          value={query}
          onFocus={() => setIsAskInputFocused(true)}
          onBlur={() => setIsAskInputFocused(false)}
          onChange={(event) => {
            setQuery(event.target.value)
            setSubmittedWithoutMatch(false)

            if (!pendingCompletionContext) {
              setCompletionPrompt(null)
              setHasCommittedQuery(false)
            }

            if (!event.target.value.trim() && !pendingCompletionContext) {
              setCompletionSuggestion(undefined)
            }
          }}
          placeholder={
            completionPrompt && pendingCompletionContext
              ? missingFactPlaceholder
              : isAskInputFocused && !query
                ? 'e.g. 5 business days after August 10'
                : demoText
          }
          aria-label="Ask WhenIsDue what you need to know"
          autoComplete="off"
        />
      </form>

      {!completionPrompt &&
      hasCommittedQuery &&
      query.trim() &&
      (match || submittedWithoutMatch) ? (
        match?.path ? (
          <a
            className="ask-when-preview has-match is-link"
            href={match.path}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('ask_when_realtime_open', {
                query: query.trim(),
                normalized_query: normalizeAskWhenQuery(query),
                destination: match.path,
              })
              onNavigate(match.path!)
            }}
            aria-live="polite"
          >
            <strong>{match.label}</strong>
            <span>{match.description}</span>
            <em>Open this answer →</em>
          </a>
        ) : (
          <div
            className={`ask-when-preview ${
              match?.kind === 'clarification'
                ? 'needs-clarification'
                : match
                  ? 'has-match'
                  : 'no-match'
            }`}
            aria-live="polite"
          >
            {match ? (
              <>
                <strong>{match.label}</strong>
                <span>{match.description}</span>
              </>
            ) : (
              <>
                <strong>I don't recognize that one yet.</strong>
                <span>Try one of the examples below or choose a calculator.</span>
              </>
            )}
          </div>
        )
      ) : null}

      {!completionPrompt ? (
        <div
          className={`ask-when-examples ask-when-suggestion-grid ${
            query.trim() ? 'is-reserved' : ''
          }`}
          aria-label={query.trim() ? undefined : 'Ask WhenIsDue examples'}
          aria-hidden={query.trim() ? true : undefined}
        >
          {stableSuggestionItems.map((suggestion, index) => (
            <button
              type="button"
              key={`ask-when-suggestion-${index}`}
              className={suggestion ? '' : 'is-empty'}
              aria-hidden={query.trim() || !suggestion ? true : undefined}
              tabIndex={query.trim() || !suggestion ? -1 : 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!suggestion || query.trim()) return
                setQuery(suggestion)
                setSubmittedWithoutMatch(false)
                setHasCommittedQuery(false)
                trackWhenIsDueEvent('ask_when_example_clicked', {
                  query: suggestion,
                })
              }}
            >
              {suggestion || 'Suggestion'}
            </button>
          ))}
        </div>
      ) : null}

      <style>{`
        .ask-when-box {
          width: min(980px, calc(100% - 36px));
          margin: 12px auto 0;
          padding: 28px;
          border: 1px solid rgba(36, 107, 82, 0.18);
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
          box-shadow: 0 18px 48px rgba(19, 38, 70, 0.07);
          text-align: center;
        }

        .ask-when-heading > span {
          display: block;
          margin-bottom: 5px;
          color: #246b52;
          font-size: 0.78rem;
          line-height: 1.35;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .ask-when-heading h2 {
          margin: 0;
          color: #10213b;
          font-size: clamp(2rem, 4.2vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .ask-when-heading p {
          margin: 7px auto 0;
          max-width: 620px;
          color: #6d8094;
          font-size: 1rem;
          line-height: 1.55;
        }

        .ask-when-heading.is-missing-fact {
          text-align: left;
        }

        .ask-when-heading.is-missing-fact > span {
          margin-bottom: 7px;
        }

        .ask-when-heading.is-missing-fact h2 {
          max-width: 680px;
          font-size: clamp(2rem, 3.8vw, 3rem);
          line-height: 0.98;
        }

        .ask-when-heading.is-missing-fact p {
          margin: 8px 0 0;
          max-width: 620px;
          line-height: 1.42;
        }

        .ask-when-heading.is-missing-fact + .ask-when-form {
          margin-top: 13px;
        }

        .ask-when-form {
          display: block;
          margin: 18px auto 0;
          max-width: 720px;
        }

        .ask-when-form input {
          min-width: 0;
          min-height: 60px;
          padding: 13px 17px;
          border: 2px solid rgba(36, 107, 82, 0.34);
          border-radius: 12px;
          background: #fff;
          color: #18314e;
          font: inherit;
          font-size: 1.08rem;
          box-shadow: 0 0 0 4px rgba(36, 107, 82, 0.05);
        }

        .ask-when-form input:focus {
          outline: 3px solid rgba(36, 107, 82, 0.18);
          outline-offset: 2px;
          border-color: #246b52;
        }

        .ask-when-preview {
          display: grid;
          gap: 4px;
          max-width: 720px;
          margin: 10px auto 0;
          padding: 16px 16px;
          border-radius: 10px;
          text-align: left;
        }

        .ask-when-preview.has-match {
          background: #f2f7f4;
        }

        .ask-when-preview.needs-clarification {
          border-color: rgba(183, 121, 31, 0.2);
          background: #fffaf0;
        }

        .ask-when-preview.needs-clarification strong {
          color: #7a5314;
        }

        .ask-when-preview.no-match {
          background: #f7f5f2;
        }

        .ask-when-preview.is-link {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
        }

        .ask-when-preview.is-link:hover {
          background: #eaf3ee;
        }

        .ask-when-preview.is-link em {
          margin-top: 2px;
          color: #1d4f82;
          font-size: 0.9rem;
          font-style: normal;
          font-weight: 850;
        }

        .ask-when-preview strong {
          display: block;
          margin-bottom: 5px;
          color: #17304d;
          font-size: clamp(1.35rem, 2.4vw, 1.75rem);
          line-height: 1.15;
          font-weight: 900;
          letter-spacing: -0.015em;
        }

        .ask-when-preview span {
          color: #738599;
          font-size: 0.96rem;
          line-height: 1.55;
        }

        .ask-when-examples {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 7px;
          margin-top: 12px;
        }

        .ask-when-examples.is-contextual button {
          border-color: rgba(130, 179, 158, 0.38);
          background: rgba(255, 255, 255, 0.1);
        }

        .ask-when-suggestion-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, 44px);
          gap: 8px;
          min-height: 96px;
          align-content: start;
        }

        .ask-when-suggestion-grid button {
          width: 100%;
          min-width: 0;
          height: 44px;
          justify-content: flex-start;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ask-when-suggestion-grid button.is-empty {
          visibility: hidden;
          pointer-events: none;
        }

        .ask-when-suggestion-grid.is-reserved {
          visibility: hidden;
          pointer-events: none;
        }

        .ask-when-examples button {
          min-height: 40px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #f7f9fb;
          color: #60758c;
          font: inherit;
          font-size: 0.86rem;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 620px) {
          .ask-when-box {
            width: calc(100% - 20px);
            padding: 16px;
          }

          .ask-when-form {
            grid-template-columns: 1fr;
          }

          .ask-when-examples button {
            min-height: 44px;
          }

          .ask-when-examples {
            justify-content: flex-start;
          }
        }
      `}</style>
    </section>
  )
}


function HomepageQuestionMap({ onNavigate }: NavigationProps) {
  const [isMobileQuestionMapExpanded, setIsMobileQuestionMapExpanded] =
    useState(false)

  const questions = [
    { label: '3 business days from today', path: '/3-business-days-from-today', weight: 'xl' },
    { label: 'When is Net 30 due?', path: '/net-30-due-date', weight: 'lg' },
    { label: '3–5 business days shipping', path: '/shipping-delivery-range-calculator', weight: 'lg' },
    { label: 'What does “within 5 days” mean?', path: '/what-does-within-days-mean', weight: 'md' },
    { label: 'Does the start date count?', path: '/does-the-start-date-count', weight: 'md' },
    { label: 'When should I cancel before renewal?', path: '/subscription-renewal-calculator', weight: 'lg' },
    { label: '30 days notice before renewal', path: '/notice-period-calculator', weight: 'md' },
    { label: 'Do holidays count as business days?', path: '/do-public-holidays-count-as-business-days', weight: 'md' },
    { label: '2/10 Net 30', path: '/2-10-net-30-calculator', weight: 'sm' },
    { label: '5 business days from today', path: '/5-business-days-from-today', weight: 'sm' },
    { label: 'Business days between two dates', path: '/business-days-between-dates', weight: 'sm' },
    { label: 'When does my free trial end?', path: '/free-trial-calculator', weight: 'md' },
    { label: 'Do weekends count as business days?', path: '/do-weekends-count-as-business-days', weight: 'sm' },
    { label: 'When is my next payday?', path: '/next-payday-calculator', weight: 'md' },
    { label: 'When is this SLA due?', path: '/business-hours-deadline-calculator', weight: 'sm' },
    { label: '30 business days from today', path: '/30-business-days-from-today', weight: 'sm' },
    { label: '7 business days from today', path: '/7-business-days-from-today', weight: 'sm' },
    { label: '10 business days from today', path: '/10-business-days-from-today', weight: 'sm' },
    { label: 'Net 15 due date', path: '/net-15-due-date', weight: 'sm' },
    { label: 'Net 30 vs 30 days', path: '/net-30-vs-30-days', weight: 'sm' },
    { label: 'Deadline falls on a weekend', path: '/what-if-a-deadline-falls-on-a-weekend', weight: 'sm' },
    { label: 'Net 45 due date', path: '/net-45-due-date', weight: 'sm' },
    { label: 'Net 60 due date', path: '/net-60-due-date', weight: 'sm' },
    { label: 'Return window deadline', path: '/return-window-calculator', weight: 'sm' },
    { label: 'Invoice due date', path: '/invoice-due-date-calculator', weight: 'sm' },
    { label: '20 business days from today', path: '/20-business-days-from-today', weight: 'sm' },
  ] as const

  return (
    <section className="homepage-question-map" aria-labelledby="homepage-question-map-title">
      <div className="homepage-question-map-head">
        <div>
          <p className="friendly-eyebrow">Explore answers</p>
          <h2 id="homepage-question-map-title">What can WhenIsDue answer?</h2>
        </div>

        <a
          href="/calculators"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/calculators')
          }}
        >
          View all calculators
        </a>
      </div>

      <div className="homepage-question-cloud homepage-question-cloud-desktop">
        {questions.map((question, index) => (
          <a
            key={question.label}
            className={`question-map-link question-map-${question.weight} question-map-pos-${index + 1}`}
            href={question.path}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('homepage_question_map_opened', {
                path: question.path,
                label: question.label,
              })
              onNavigate(question.path)
            }}
          >
            {question.label}
          </a>
        ))}
      </div>

      <div className="homepage-question-cloud-mobile">
        {(isMobileQuestionMapExpanded ? questions : questions.slice(0, 3)).map(
          (question) => (
            <a
              key={question.label}
              className={`question-map-link question-map-${question.weight}`}
              href={question.path}
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('homepage_question_map_opened', {
                  path: question.path,
                  label: question.label,
                })
                onNavigate(question.path)
              }}
            >
              {question.label}
            </a>
          ),
        )}

        <button
          type="button"
          className="homepage-question-map-toggle"
          aria-expanded={isMobileQuestionMapExpanded}
          onClick={() => {
            const nextExpanded = !isMobileQuestionMapExpanded
            setIsMobileQuestionMapExpanded(nextExpanded)
            trackWhenIsDueEvent('homepage_question_map_toggled', {
              expanded: nextExpanded,
            })
          }}
        >
          {isMobileQuestionMapExpanded
            ? 'Show fewer ↑'
            : 'Explore more answers ↓'}
        </button>
      </div>

      <p className="homepage-question-map-note">
        Pick a question and jump straight to the answer or calculator.
      </p>
    </section>
  )
}


function DeadlineCountingGuideLinks({
  onNavigate,
  compact = false,
}: NavigationProps & { compact?: boolean }) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const guides = [
    {
      path: '/does-the-start-date-count',
      label: 'Does the start date count?',
      description: 'Compare day-zero and day-one deadline counting.',
    },
    {
      path: '/do-weekends-count-as-business-days',
      label: 'Do weekends count as business days?',
      description: 'See how Saturdays and Sundays affect business-day deadlines.',
    },
    {
      path: '/do-public-holidays-count-as-business-days',
      label: 'Do public holidays count as business days?',
      description: 'See when a weekday holiday is counted or skipped.',
    },
    {
      path: '/what-does-within-days-mean',
      label: 'What does “within X days” mean?',
      description: 'Compare the possible before-versus-after interpretations.',
    },
    {
      path: '/what-if-a-deadline-falls-on-a-weekend',
      label: 'What if a deadline falls on a weekend?',
      description: 'See when the final date may move to the next business day.',
    },
  ]

  return (
    <section
      className={`deadline-guide-links ${compact ? 'is-compact' : ''}`}
      aria-labelledby={`deadline-guide-links-title-${compact ? 'compact' : 'full'}`}
    >
      <div className="deadline-guide-links-heading">
        <span>Deadline counting answers</span>
        <h2 id={`deadline-guide-links-title-${compact ? 'compact' : 'full'}`}>
          Small wording changes can change the due date.
        </h2>
        {!compact ? (
          <p>
            Check the counting rule before relying on a deadline.
          </p>
        ) : null}
      </div>

      <div className="deadline-guide-links-grid">
        {guides.map((guide, index) => (
          <a
            key={guide.path}
            className={
              !compact && index >= 3
                ? `deadline-guide-mobile-extra ${isMobileExpanded ? 'is-expanded' : ''}`
                : undefined
            }
            href={guide.path}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('deadline_guide_opened', {
                path: guide.path,
                context: compact ? 'calculator_hub' : 'homepage',
              })
              onNavigate(guide.path)
            }}
          >
            <strong>{guide.label}</strong>
            <span>{guide.description}</span>
            <b aria-hidden="true">→</b>
          </a>
        ))}
      </div>

      {!compact ? (
        <button
          type="button"
          className="deadline-guide-mobile-toggle"
          aria-expanded={isMobileExpanded}
          onClick={() => {
            const nextExpanded = !isMobileExpanded
            setIsMobileExpanded(nextExpanded)
            trackWhenIsDueEvent('homepage_deadline_guides_toggled', {
              expanded: nextExpanded,
            })
          }}
        >
          {isMobileExpanded ? 'Show fewer ↑' : 'More counting questions ↓'}
        </button>
      ) : null}

      <style>{`
        .deadline-guide-mobile-toggle {
          display: none;
        }

        .deadline-guide-links {
          width: min(1080px, calc(100% - 32px));
          margin: 24px auto 0;
          padding: 20px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
        }

        .deadline-guide-links.is-compact {
          width: min(1080px, calc(100% - 36px));
          margin-top: 18px;
        }

        .deadline-guide-links-heading {
          text-align: left;
        }

        .deadline-guide-links-heading > span {
          color: #7a8da1;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .deadline-guide-links-heading h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.2rem;
        }

        .deadline-guide-links-heading p {
          margin: 6px 0 0;
          color: #6c8095;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .deadline-guide-links-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 14px;
        }

        .deadline-guide-links-grid a {
          position: relative;
          min-height: 102px;
          display: grid;
          align-content: center;
          gap: 5px;
          padding: 15px 54px 15px 15px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.9);
          color: inherit;
          text-decoration: none;
          transition:
            transform 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        .deadline-guide-links-grid a:hover {
          transform: translateY(-1px);
        }

        .deadline-guide-links-grid a:active {
          transform: translateY(0);
        }

        .deadline-guide-links-grid strong {
          color: #25425f;
          font-size: 0.98rem;
          line-height: 1.3;
        }

        .deadline-guide-links-grid span {
          color: #6b8095;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .deadline-guide-links-grid b {
          position: absolute;
          right: 14px;
          top: 50%;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(138, 98, 24, 0.08);
          color: #607a95;
          font-size: 1rem;
          transform: translateY(-50%);
          transition:
            background 140ms ease,
            color 140ms ease;
        }

        @media (max-width: 760px) {
          .deadline-guide-links,
          .deadline-guide-links.is-compact {
            width: calc(100% - 20px);
            padding: 14px;
          }

          .deadline-guide-links-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .deadline-guide-links-grid a {
            min-height: 88px;
          }

          .deadline-guide-mobile-extra {
            display: none !important;
          }

          .deadline-guide-mobile-extra.is-expanded {
            display: grid !important;
          }

          .deadline-guide-mobile-toggle {
            min-height: 46px;
            width: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 10px;
            padding: 9px 14px;
            border: 1px solid rgba(138, 98, 24, 0.18);
            border-radius: 999px;
            background: rgba(255, 253, 248, 0.78);
            color: #72511a;
            font: inherit;
            font-size: 0.88rem;
            font-weight: 900;
            cursor: pointer;
          }
        }
      `}</style>
    </section>
  )
}


function HomePage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )
  const [recentCalculations, setRecentCalculations] = useState<SavedCalculation[]>(() =>
    readSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY),
  )
  const [favoriteCalculations, setFavoriteCalculations] = useState<SavedCalculation[]>(() =>
    readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY),
  )
  const [askAssist, setAskAssist] = useState<AskWhenAssistState>({
    query: '',
    suggestions: [],
    suggestionMode: 'fallback',
    suggestionLabel: '',
    committedLabel: null,
    committedDescription: null,
  })
  const [askSuggestionRequest, setAskSuggestionRequest] =
    useState<AskWhenSuggestionRequest | null>(null)
  const [askSuggestionRequestId, setAskSuggestionRequestId] = useState(0)

  function applyAskSuggestion(text: string) {
    const nextId = askSuggestionRequestId + 1
    setAskSuggestionRequestId(nextId)
    setAskSuggestionRequest({
      id: nextId,
      text,
      originalQuery: askAssist.query,
    })
  }

  const recentOnlyCalculations = useMemo(
    () => {
      const favoriteIds = new Set(favoriteCalculations.map((item) => item.id))
      return recentCalculations.filter((item) => !favoriteIds.has(item.id))
    },
    [favoriteCalculations, recentCalculations],
  )

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  useEffect(() => {
    const refreshSavedCalculations = () => {
      setRecentCalculations(readSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY))
      setFavoriteCalculations(readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY))
    }

    window.addEventListener(SAVED_CALCULATIONS_EVENT, refreshSavedCalculations)
    window.addEventListener('storage', refreshSavedCalculations)

    return () => {
      window.removeEventListener(SAVED_CALCULATIONS_EVENT, refreshSavedCalculations)
      window.removeEventListener('storage', refreshSavedCalculations)
    }
  }, [])

  const commonBusinessDays = useMemo(
    () =>
      [3, 5, 7, 10].map((dayCount) => ({
        dayCount,
        date: calculateBusinessDaysWithCalendar(
          today,
          dayCount,
          holidayCalendar,
        ).date,
      })),
    [today, holidayCalendar],
  )

  return (
    <main className="page-shell date-home-page">
      <section className="date-home-hero date-home-editorial-shell" aria-labelledby="ask-when-title">
        <header className="date-home-header">
          <a
            className="date-home-brand"
            href="/"
            aria-label="WhenIsDue home"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            <img src="/whenisdue-logo.png" alt="WhenIsDue" />
          </a>

          <nav className="date-home-nav" aria-label="Main navigation">
            <a
              href="/calculators"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/calculators')
              }}
            >
              Calculators
            </a>
          </nav>
        </header>

        <div className="date-home-editorial-hero">
          <div className="date-home-editorial-copy">
            <p className="date-home-editorial-today">
              <span>Today</span>
              <b aria-hidden="true">·</b>
              <span>{formatWeekday(today)}</span>
              <b aria-hidden="true">·</b>
              <span>{getLocalTimeZoneName()}</span>
              <b aria-hidden="true">·</b>
              <span>{getLocalUtcOffsetLabel(currentTime)}</span>
            </p>

            <AskWhenBox
              onNavigate={onNavigate}
              holidayCalendar={holidayCalendar}
              today={today}
              onAssistChange={setAskAssist}
              suggestionRequest={askSuggestionRequest}
              onSuggestionApplied={() => setAskSuggestionRequest(null)}
            />
          </div>

          <aside
            className={`date-home-intent-panel ${
              askAssist.committedLabel || askAssist.query.trim()
                ? 'is-listening'
                : 'is-idle'
            }`}
            aria-live="polite"
            aria-label="WhenIsDue suggestions"
          >
            {askAssist.committedLabel ? (
              <div className="date-home-intent-committed is-missing-fact">
                <span>WhenIsDue remembers</span>
                <strong>Your earlier details are saved</strong>
                {askAssist.committedDescription ? (
                  <p>{askAssist.committedDescription}</p>
                ) : null}
              </div>
            ) : !askAssist.query.trim() ? (
              <div className="date-home-intent-idle">
                <span>Today</span>
                <strong>{formatPlainDate(today)}</strong>
                <small>{formatWeekday(today)}</small>
              </div>
            ) : (
              <div className="date-home-intent-listening">
                <span>
                  {askAssist.suggestionMode === 'typo' ||
                  askAssist.suggestionMode === 'ambiguous'
                    ? 'You might mean'
                    : askAssist.suggestionMode === 'fallback'
                      ? 'Try one of these'
                      : 'WhenIsDue understands'}
                </span>
                <strong className="date-home-intent-query">
                  {askAssist.suggestionMode === 'typo'
                    ? askAssist.suggestionLabel
                    : askAssist.suggestionMode === 'recognized'
                      ? askAssist.suggestionLabel
                      : askAssist.query}
                </strong>

                <div className="date-home-intent-options">
                  {Array.from({ length: 4 }, (_, index) => {
                    const suggestion = askAssist.suggestions[index] ?? ''
                    return (
                      <button
                        type="button"
                        key={`intent-panel-option-${index}`}
                        className={suggestion ? '' : 'is-empty'}
                        aria-hidden={suggestion ? undefined : true}
                        tabIndex={suggestion ? 0 : -1}
                        onClick={() => {
                          if (!suggestion) return
                          applyAskSuggestion(suggestion)
                          trackWhenIsDueEvent('ask_when_suggestion_clicked', {
                            query: suggestion,
                            surface: 'intent_panel',
                          })
                        }}
                      >
                        {suggestion || 'Suggestion'}
                      </button>
                    )
                  })}
                </div>

                {askAssist.suggestions.length === 0 ? (
                  <p className="date-home-intent-quiet">
                    Keep typing — I won't interrupt.
                  </p>
                ) : (
                  <p className="date-home-intent-quiet">
                    Keep typing, or choose one.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <style>{`
        .date-home-editorial-shell {
          width: min(100% - 32px, 1240px);
          margin: 0 auto;
        }

        .date-home-editorial-shell .date-home-header {
          width: 100%;
        }

        .date-home-editorial-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
          min-height: 590px;
          margin-top: 22px;
          overflow: hidden;
          overflow-anchor: none;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 26px;
          background: #17304d;
          box-shadow: 0 24px 64px rgba(19, 38, 70, 0.1);
        }

        .date-home-editorial-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          justify-content: center;
          padding: clamp(34px, 4.4vw, 58px);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0)),
            #17304d;
        }

        .date-home-editorial-today {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin: 0 0 18px;
          color: rgba(255, 250, 242, 0.72);
          font-size: 0.82rem;
          font-weight: 750;
        }

        .date-home-editorial-today > span:first-child {
          color: #9bc8b2;
          font-size: 0.7rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .date-home-editorial-today strong {
          color: #fffaf2;
          font-weight: 900;
        }

        .date-home-editorial-today b {
          color: rgba(255, 250, 242, 0.3);
        }

        .date-home-editorial-hero .ask-when-box {
          width: 100%;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          text-align: left;
        }

        .date-home-editorial-hero .ask-when-heading > span {
          margin-bottom: 8px;
          color: #9bc8b2;
        }

        .date-home-editorial-hero .ask-when-heading h2 {
          max-width: 520px;
          color: #fffaf2;
          font-size: clamp(3.25rem, 5vw, 5rem);
          line-height: 0.93;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .date-home-editorial-hero .ask-when-heading p {
          max-width: 520px;
          margin: 12px 0 0;
          color: rgba(255, 250, 242, 0.7);
          font-size: 1rem;
        }

        .date-home-editorial-hero .ask-when-form {
          max-width: none;
          margin: 22px 0 0;
        }

        .date-home-editorial-hero .ask-when-form input {
          min-height: 60px;
          scroll-margin-top: 12px;
          border: 0;
          background: #fffdf8;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
        }

        .date-home-editorial-hero .ask-when-form input:focus {
          outline: 3px solid rgba(155, 200, 178, 0.42);
          outline-offset: 3px;
          border-color: transparent;
        }

        .date-home-editorial-hero .ask-when-preview {
          max-width: none;
          margin-left: 0;
          margin-right: 0;
          background: rgba(255, 250, 242, 0.96);
        }

        .date-home-editorial-hero .ask-when-preview.has-match {
          background: rgba(234, 245, 239, 0.98);
        }

        .date-home-editorial-hero .ask-when-examples {
          justify-content: flex-start;
          margin-top: 14px;
        }

        .date-home-editorial-hero .ask-when-examples button {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 250, 242, 0.82);
        }

        .date-home-editorial-hero .ask-when-examples button:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #fffaf2;
        }

        .date-home-intent-panel {
          min-width: 0;
          min-height: 590px;
          height: 590px;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: clamp(34px, 5vw, 62px);
          background: #e5ddd0;
          color: #102f52;
        }

        .date-home-intent-idle,
        .date-home-intent-listening,
        .date-home-intent-committed {
          width: min(100%, 520px);
        }

        .date-home-intent-idle {
          text-align: center;
        }

        .date-home-intent-idle span,
        .date-home-intent-listening > span,
        .date-home-intent-committed > span {
          display: block;
          color: #267158;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .date-home-intent-idle strong {
          display: block;
          margin-top: 12px;
          color: #102f52;
          font-size: clamp(3rem, 5vw, 5rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .date-home-intent-idle small {
          display: block;
          margin-top: 10px;
          color: #61778d;
          font-size: 1rem;
          font-weight: 850;
        }

        .date-home-intent-listening > span,
        .date-home-intent-committed > span {
          text-align: left;
        }

        .date-home-intent-query {
          display: -webkit-box;
          height: 76px;
          min-height: 76px;
          margin-top: 12px;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          color: #102f52;
          font-size: clamp(2.2rem, 3.8vw, 3.7rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
          text-wrap: balance;
        }

        .date-home-intent-options {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: repeat(4, 58px);
          gap: 9px;
          min-height: 259px;
          margin-top: 24px;
        }

        .date-home-intent-options button {
          width: 100%;
          min-width: 0;
          min-height: 58px;
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border: 1px solid rgba(16, 47, 82, 0.11);
          border-radius: 14px;
          background: rgba(255, 250, 242, 0.72);
          color: #284866;
          font: inherit;
          font-size: 0.97rem;
          font-weight: 850;
          line-height: 1.22;
          text-align: left;
          cursor: pointer;
        }

        .date-home-intent-options button:hover {
          border-color: rgba(38, 113, 88, 0.34);
          background: rgba(255, 250, 242, 0.96);
          color: #173d5f;
        }

        .date-home-intent-options button.is-empty {
          visibility: hidden;
          pointer-events: none;
        }

        .date-home-intent-quiet {
          min-height: 22px;
          margin: 14px 0 0;
          color: #728398;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .date-home-intent-committed strong {
          display: block;
          margin-top: 12px;
          color: #102f52;
          font-size: clamp(2.6rem, 4.4vw, 4.4rem);
          line-height: 0.95;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .date-home-intent-committed p {
          max-width: 460px;
          margin: 16px 0 0;
          color: #60758a;
          font-size: 1rem;
          line-height: 1.55;
        }

        .date-home-intent-committed.is-missing-fact strong {
          max-width: 430px;
          font-size: clamp(2rem, 3.8vw, 3.2rem);
          line-height: 0.98;
        }

        .date-home-intent-committed.is-missing-fact p {
          margin-top: 12px;
        }

        @media (max-width: 760px) {
          .date-home-editorial-shell {
            width: calc(100% - 18px);
          }

          .date-home-editorial-shell .date-home-header {
            min-height: 52px;
          }

          .date-home-editorial-shell .date-home-brand img {
            width: 118px;
            max-height: 30px;
          }

          .date-home-editorial-shell .date-home-nav {
            gap: 8px;
          }

          .date-home-editorial-shell .date-home-nav a {
            min-height: 38px;
            font-size: 0.75rem;
          }

          .date-home-editorial-hero {
            display: block;
            min-height: 0;
            height: auto;
            margin-top: 10px;
            border-radius: 20px;
          }

          .date-home-editorial-copy {
            display: block;
            height: auto;
            min-height: 0;
            padding: 16px 15px 10px;
          }

          .date-home-editorial-today {
            margin-bottom: 9px;
            font-size: 0.72rem;
          }

          .date-home-editorial-hero .ask-when-heading > span {
            margin-bottom: 5px;
            font-size: 0.68rem;
          }

          .date-home-editorial-hero .ask-when-heading h2 {
            max-width: 330px;
            font-size: clamp(2.18rem, 10vw, 2.9rem);
            line-height: 0.94;
          }

          .date-home-editorial-hero .ask-when-heading p {
            margin-top: 6px;
            font-size: 0.88rem;
            line-height: 1.38;
          }

          .date-home-editorial-hero .ask-when-form {
            margin-top: 11px;
          }

          .date-home-editorial-hero .ask-when-form input {
            min-height: 48px;
            font-size: 0.96rem;
          }

          .date-home-editorial-hero .ask-when-examples {
            gap: 5px;
            margin-top: 8px;
          }

          .date-home-editorial-hero .ask-when-examples button {
            min-height: 36px;
            padding: 5px 9px;
            font-size: 0.74rem;
          }

          .date-home-editorial-hero .ask-when-examples button:nth-child(n + 4) {
            display: none;
          }

          /* Mobile keyboard mode: keep the input anchored and let the
             intent choices peek into the visual viewport immediately below it. */
          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .date-home-editorial-copy {
            padding-top: 10px;
            padding-bottom: 8px;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .date-home-editorial-today {
            display: none;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .ask-when-heading > span {
            display: none;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .ask-when-heading h2 {
            max-width: 310px;
            font-size: clamp(1.9rem, 8.8vw, 2.45rem);
            line-height: 0.94;
          }

          .ask-when-heading.is-missing-fact h2 {
            max-width: 100%;
            font-size: clamp(1.8rem, 8.2vw, 2.35rem);
            line-height: 0.98;
          }

          .ask-when-heading.is-missing-fact p {
            margin-top: 6px;
            font-size: 0.88rem;
            line-height: 1.35;
          }

          .ask-when-heading.is-missing-fact + .ask-when-form {
            margin-top: 10px;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .ask-when-heading p {
            margin-top: 5px;
            font-size: 0.82rem;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .ask-when-form {
            margin-top: 9px;
          }

          .date-home-editorial-hero:has(.ask-when-form input:focus)
            .date-home-intent-panel {
            padding-top: 10px;
          }

          .date-home-intent-panel {
            min-height: 272px;
            height: 272px;
            place-items: start stretch;
            padding: 12px 15px 14px;
            overflow: hidden;
          }

          .date-home-intent-idle,
          .date-home-intent-listening,
          .date-home-intent-committed {
            width: 100%;
          }

          .date-home-intent-listening {
            min-height: 245px;
          }

          .date-home-intent-idle strong {
            margin-top: 6px;
            font-size: clamp(2rem, 10vw, 2.75rem);
          }

          .date-home-intent-idle small {
            margin-top: 6px;
            font-size: 0.82rem;
          }

          .date-home-intent-query {
            height: 50px;
            min-height: 50px;
            margin-top: 7px;
            font-size: clamp(1.6rem, 7.5vw, 2.2rem);
            line-height: 1;
            -webkit-line-clamp: 2;
          }

          .date-home-intent-options {
            grid-template-rows: repeat(3, 46px);
            gap: 7px;
            min-height: 152px;
            height: 152px;
            margin-top: 10px;
          }

          .date-home-intent-options button {
            min-height: 46px;
            padding: 7px 11px;
            font-size: 0.84rem;
            line-height: 1.18;
          }

          .date-home-intent-options button:nth-child(4) {
            display: none;
          }

          .date-home-intent-quiet {
            min-height: 18px;
            margin-top: 7px;
            font-size: 0.78rem;
            line-height: 1.3;
          }

          .date-home-intent-committed strong {
            font-size: clamp(2rem, 10vw, 2.8rem);
          }

          .date-home-intent-committed p {
            margin-top: 10px;
            font-size: 0.9rem;
            line-height: 1.4;
          }
        }
      `}</style>

      <section className="date-home-business" aria-labelledby="date-home-business-title">
        <div className="date-home-section-heading">
          <div className="date-home-chapter-title">
            <span className="date-home-chapter-label">Quick answers</span>
            <h2 id="date-home-business-title">Business days from today</h2>
          </div>
          <a
            href={`/business-days-calculator${
              holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
            }`}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(
                `/business-days-calculator${
                  holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
                }`,
              )
            }}
          >
            Use a different date or number
          </a>
        </div>

        <div className="date-home-business-grid">
          {commonBusinessDays.map(({ dayCount, date }) => (
            <a
              key={dayCount}
              className="date-home-business-answer"
              href={`/${dayCount}-business-days-from-today${
                holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
              }`}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(
                  `/${dayCount}-business-days-from-today${
                    holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
                  }`,
                )
              }}
            >
              <span>{dayCount} business days</span>
              <strong>{formatPlainDate(date)}</strong>
              <small>{formatWeekday(date)}</small>
            </a>
          ))}
        </div>

        <p className="date-home-rule">
          {holidayCalendar === 'none'
            ? 'Weekends skipped. Public holidays still count as weekdays.'
            : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped.`}
        </p>

        <div className="date-home-calendar-preference date-home-calendar-preference-desktop">
          <HolidayCalendarSelect
            value={holidayCalendar}
            onChange={(nextCalendar) => {
              setHolidayCalendar(nextCalendar)
              trackWhenIsDueEvent('holiday_calendar_changed', {
                context: 'homepage',
                value: nextCalendar,
              })
            }}
            compact
          />
          <p>
            {holidayCalendar === 'none'
              ? 'Choose a holiday calendar if your deadline excludes public holidays.'
              : 'Saved on this device.'}
          </p>
        </div>

        <details className="date-home-calendar-details">
          <summary>Counting settings</summary>
          <div className="date-home-calendar-preference">
            <HolidayCalendarSelect
              value={holidayCalendar}
              onChange={(nextCalendar) => {
                setHolidayCalendar(nextCalendar)
                trackWhenIsDueEvent('holiday_calendar_changed', {
                  context: 'homepage_mobile_settings',
                  value: nextCalendar,
                })
              }}
              compact
            />
            <p>
              {holidayCalendar === 'none'
                ? 'Weekends are skipped. Choose a calendar only when public holidays should also be skipped.'
                : 'This holiday calendar is saved on this device.'}
            </p>
          </div>
        </details>

        <style>{`
          .date-home-calendar-preference {
            width: min(100%, 560px);
            margin: 12px auto 0;
          }

          .date-home-calendar-details {
            display: none;
          }

          .date-home-calendar-preference > p {
            margin: 7px 0 0;
            color: #687c91;
            font-size: 0.84rem;
            line-height: 1.45;
            text-align: center;
          }

          @media (max-width: 560px) {
            .date-home-calendar-preference-desktop {
              display: none;
            }

            .date-home-calendar-details {
              display: block;
              margin-top: 12px;
              border-top: 1px solid rgba(29, 79, 130, 0.08);
            }

            .date-home-calendar-details summary {
              min-height: 46px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #536f8b;
              font-size: 0.86rem;
              font-weight: 900;
              cursor: pointer;
              list-style: none;
            }

            .date-home-calendar-details summary::-webkit-details-marker {
              display: none;
            }

            .date-home-calendar-details summary::after {
              content: '↓';
              margin-left: 7px;
            }

            .date-home-calendar-details[open] summary::after {
              content: '↑';
            }

            .date-home-calendar-details .date-home-calendar-preference {
              margin-top: 0;
              padding: 4px 0 2px;
            }

            .date-home-calendar-preference > p {
              text-align: left;
            }
          }
        `}</style>
      </section>

      <HomepageQuestionMap onNavigate={onNavigate} />

      {(favoriteCalculations.length > 0 || recentOnlyCalculations.length > 0) ? (
        <section className="date-home-saved" aria-labelledby="date-home-saved-title">
          <div className="date-home-section-heading">
            <div>
              <h2 id="date-home-saved-title">Your saved calculations</h2>
              <span>Stored only on this device</span>
            </div>
            <a
              href="/saved-calculations"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/saved-calculations')
              }}
            >
              View all
            </a>
          </div>

          {favoriteCalculations.length > 0 ? (
            <div className="date-home-saved-group">
              <h3>Favorites</h3>
              <div className="date-home-saved-grid">
                {favoriteCalculations.slice(0, 6).map((item) => (
                  <article className="date-home-saved-card" key={item.id}>
                    <a
                      href={item.url}
                      onClick={(event) => {
                        event.preventDefault()
                        trackWhenIsDueEvent('saved_calculation_opened', {
                          type: 'favorite',
                          title: item.title,
                        })
                        onNavigate(item.url)
                      }}
                    >
                      <span>Favorite</span>
                      <strong>{item.title}</strong>
                      <b>{item.dateText}</b>
                      {item.details ? <small>{item.details}</small> : null}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        removeSavedCalculation(FAVORITE_CALCULATIONS_STORAGE_KEY, item.id)
                        trackWhenIsDueEvent('favorite_removed', { title: item.title })
                      }}
                      aria-label={`Remove ${item.title} from favorites`}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {recentOnlyCalculations.length > 0 ? (
            <div className="date-home-saved-group">
              <div className="date-home-saved-group-heading">
                <h3>Recent</h3>
                <button
                  type="button"
                  onClick={() => {
                    writeSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY, [])
                    trackWhenIsDueEvent('recent_calculations_cleared')
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="date-home-saved-grid">
                {recentOnlyCalculations.slice(0, 6).map((item) => (
                  <article className="date-home-saved-card" key={item.id}>
                    <a
                      href={item.url}
                      onClick={(event) => {
                        event.preventDefault()
                        trackWhenIsDueEvent('saved_calculation_opened', {
                          type: 'recent',
                          title: item.title,
                        })
                        onNavigate(item.url)
                      }}
                    >
                      <span>Recent</span>
                      <strong>{item.title}</strong>
                      <b>{item.dateText}</b>
                      {item.details ? <small>{item.details}</small> : null}
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <style>{`
            .date-home-saved {
              width: min(1180px, calc(100% - 36px));
              margin: 22px auto 0;
              padding: 20px;
              border: 1px solid rgba(19, 38, 70, 0.08);
              border-radius: 20px;
              background: rgba(255, 255, 255, 0.72);
            }

            .date-home-saved .date-home-section-heading > div > span {
              color: #7a8999;
              font-size: 0.74rem;
            }

            .date-home-saved .date-home-section-heading {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }

            .date-home-saved .date-home-section-heading a {
              min-height: 40px;
              display: inline-flex;
              align-items: center;
              padding: 6px 10px;
              border: 1px solid rgba(19, 38, 70, 0.1);
              border-radius: 9px;
              color: #536f8b;
              font-size: 0.74rem;
              font-weight: 850;
              text-decoration: none;
            }

            .date-home-saved-group + .date-home-saved-group {
              margin-top: 18px;
            }

            .date-home-saved-group h3,
            .date-home-saved-group-heading h3 {
              margin: 0 0 9px;
              color: #526a85;
              font-size: 0.76rem;
              font-weight: 900;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }

            .date-home-saved-group-heading {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }

            .date-home-saved-group-heading button,
            .date-home-saved-card > button {
              min-height: 36px;
              padding: 6px 9px;
              border: 0;
              background: transparent;
              color: #74869a;
              font: inherit;
              font-size: 0.72rem;
              font-weight: 800;
              cursor: pointer;
            }

            .date-home-saved-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }

            .date-home-saved-card {
              min-width: 0;
              overflow: hidden;
              border: 1px solid rgba(19, 38, 70, 0.09);
              border-radius: 13px;
              background: #fff;
            }

            .date-home-saved-card > a {
              display: grid;
              gap: 4px;
              padding: 13px;
              color: inherit;
              text-decoration: none;
            }

            .date-home-saved-card > a > span {
              color: #7c8fa4;
              font-size: 0.68rem;
              font-weight: 850;
              text-transform: uppercase;
            }

            .date-home-saved-card > a > strong {
              overflow: hidden;
              color: #2b435e;
              font-size: 0.85rem;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .date-home-saved-card > a > b {
              color: #0c1931;
              font-size: 1rem;
            }

            .date-home-saved-card > a > small {
              overflow: hidden;
              color: #77899c;
              font-size: 0.7rem;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .date-home-saved-card > button {
              width: 100%;
              border-top: 1px solid rgba(19, 38, 70, 0.06);
            }

            @media (max-width: 760px) {
              .date-home-saved {
                width: min(100% - 20px, 1180px);
                padding: 14px;
              }

              .date-home-saved-grid {
                grid-template-columns: 1fr;
              }

              .date-home-saved-group-heading button,
              .date-home-saved-card > button {
                min-height: 44px;
              }
            }
          `}</style>
        </section>
      ) : null}

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .date-home-page {
          min-height: 100vh;
        }

        .date-home-hero {
          width: min(100% - 32px, 1240px);
          min-height: 0;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .date-home-header {
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .date-home-brand {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          text-decoration: none;
        }

        .date-home-brand img {
          display: block;
          width: clamp(138px, 12vw, 168px);
          height: auto;
          max-height: 38px;
          object-fit: contain;
        }

        .date-home-nav {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .date-home-nav a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          color: #617992;
          font-size: 0.9rem;
          font-weight: 800;
          text-decoration: none;
        }

        .date-home-answer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 22px 12px 18px;
        }

        .date-home-kicker {
          margin: 0 0 4px;
          color: #246b52;
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .date-home-date {
          margin: 0;
          max-width: 100%;
          color: #17304d;
          font-size: clamp(2rem, 4.1vw, 3.15rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.045em;
          text-wrap: balance;
        }

        .date-home-context {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 7px 0 0;
          color: #60758a;
          font-size: 0.84rem;
          line-height: 1.3;
          font-weight: 800;
        }

        .date-home-context b {
          color: #9aa8b5;
          font-weight: 700;
        }

        .date-home-context strong {
          color: #425e7b;
          font-weight: 900;
        }

        .homepage-question-map {
          width: min(100% - 32px, 1120px);
          margin: 28px auto 0;
          padding: 24px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.66);
        }

        .date-home-business {
          width: min(100% - 32px, 1120px);
          margin-left: auto;
          margin-right: auto;
        }

        .homepage-question-map-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .homepage-question-map-head h2 {
          margin: 4px 0 0;
          color: #17304d;
          font-size: clamp(1.55rem, 3vw, 2.2rem);
          line-height: 1.05;
          letter-spacing: -0.025em;
        }

        .homepage-question-map-head > a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          color: #5e748b;
          font-size: 0.86rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .homepage-question-cloud {
          margin-top: 20px;
          padding: 20px 20px 18px;
          border-radius: 14px;
          background: #17304d;
          overflow: hidden;
        }

        .homepage-question-cloud-mobile {
          display: none;
        }

        .question-map-link {
          position: static;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          max-width: 100%;
          min-height: 30px;
          padding: 4px 6px;
          border-radius: 7px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.02;
          text-align: center;
          text-decoration: none;
          text-wrap: balance;
          transition:
            transform 120ms ease,
            background 120ms ease,
            color 120ms ease;
        }

        .question-map-link:hover {
          transform: translateY(-1px) scale(1.015);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .question-map-link:focus-visible {
          outline: 3px solid rgba(255, 255, 255, 0.34);
          outline-offset: 2px;
        }

        .question-map-xl {
          padding: 7px 13px;
          background: #fff;
          color: #12223a;
          font-size: clamp(1.6rem, 2.55vw, 2.15rem);
          font-weight: 950;
          letter-spacing: -0.045em;
          line-height: 1;
          z-index: 3;
        }

        .question-map-xl:hover {
          background: #fff;
          color: #12223a;
        }

        .question-map-lg {
          font-size: clamp(1.2rem, 1.9vw, 1.58rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          z-index: 2;
        }

        .question-map-md {
          font-size: clamp(0.98rem, 1.4vw, 1.14rem);
          font-weight: 820;
          z-index: 2;
        }

        .question-map-sm {
          font-size: 0.82rem;
          font-weight: 740;
          color: rgba(255, 255, 255, 0.7);
          z-index: 1;
        }

        /* Desktop organized-chaos grid:
           dense center-weighted typography with smaller questions around it. */
        .homepage-question-cloud-desktop {
          display: grid;
          grid-template-columns: repeat(14, minmax(0, 1fr));
          grid-template-rows: repeat(8, minmax(34px, auto));
          column-gap: 6px;
          row-gap: 2px;
          align-items: center;
        }

        .homepage-question-cloud-desktop .question-map-link:hover {
          transform: translateY(-1px) scale(1.018);
        }

        .question-map-pos-1  { grid-column: 5 / 11; grid-row: 4; justify-self: center; }
        .question-map-pos-2  { grid-column: 9 / 13; grid-row: 2; justify-self: center; }
        .question-map-pos-3  { grid-column: 3 / 8; grid-row: 2; justify-self: center; }
        .question-map-pos-4  { grid-column: 6 / 10; grid-row: 1; justify-self: center; }
        .question-map-pos-5  { grid-column: 2 / 5; grid-row: 4; justify-self: center; }
        .question-map-pos-6  { grid-column: 6 / 10; grid-row: 6; justify-self: center; }
        .question-map-pos-7  { grid-column: 11 / 14; grid-row: 4; justify-self: center; }
        .question-map-pos-8  { grid-column: 3 / 6; grid-row: 6; justify-self: center; }
        .question-map-pos-9  { grid-column: 12 / 14; grid-row: 7; justify-self: center; }
        .question-map-pos-10 { grid-column: 1 / 4; grid-row: 1; justify-self: center; }
        .question-map-pos-11 { grid-column: 2 / 5; grid-row: 8; justify-self: center; }
        .question-map-pos-12 { grid-column: 10 / 13; grid-row: 8; justify-self: center; }
        .question-map-pos-13 { grid-column: 12 / 15; grid-row: 1; justify-self: center; }
        .question-map-pos-14 { grid-column: 6 / 9; grid-row: 8; justify-self: center; }
        .question-map-pos-15 { grid-column: 12 / 15; grid-row: 3; justify-self: center; }
        .question-map-pos-16 { grid-column: 1 / 4; grid-row: 7; justify-self: center; }
        .question-map-pos-17 { grid-column: 1 / 3; grid-row: 2; justify-self: center; }
        .question-map-pos-18 { grid-column: 1 / 3; grid-row: 5; justify-self: center; }
        .question-map-pos-19 { grid-column: 4 / 6; grid-row: 3; justify-self: center; }
        .question-map-pos-20 { grid-column: 10 / 12; grid-row: 3; justify-self: center; }
        .question-map-pos-21 { grid-column: 13 / 15; grid-row: 5; justify-self: center; }
        .question-map-pos-22 { grid-column: 4 / 6; grid-row: 7; justify-self: center; }
        .question-map-pos-23 { grid-column: 9 / 11; grid-row: 7; justify-self: center; }
        .question-map-pos-24 { grid-column: 2 / 4; grid-row: 3; justify-self: center; }

        .question-map-pos-1 { max-width: 520px; }
        .question-map-pos-2,
        .question-map-pos-3,
        .question-map-pos-6 { max-width: 390px; }
        .question-map-pos-4,
        .question-map-pos-5,
        .question-map-pos-7,
        .question-map-pos-8,
        .question-map-pos-12,
        .question-map-pos-14 { max-width: 300px; }
        .question-map-pos-9,
        .question-map-pos-10,
        .question-map-pos-11,
        .question-map-pos-13,
        .question-map-pos-15,
        .question-map-pos-16,
        .question-map-pos-17,
        .question-map-pos-18,
        .question-map-pos-19,
        .question-map-pos-20,
        .question-map-pos-21,
        .question-map-pos-22,
        .question-map-pos-23,
        .question-map-pos-24 { max-width: 190px; }

        @media (max-width: 900px) {
          .homepage-question-cloud {
            padding: 18px 14px 16px;
          }

          .homepage-question-cloud-desktop {
            grid-template-columns: repeat(10, minmax(0, 1fr));
            grid-template-rows: repeat(8, minmax(40px, auto));
            column-gap: 6px;
            row-gap: 4px;
          }

          .question-map-xl {
            font-size: 1.58rem;
          }

          .question-map-lg {
            font-size: 1.12rem;
          }

          .question-map-md {
            font-size: 0.95rem;
          }

          .question-map-sm {
            font-size: 0.78rem;
          }

          .question-map-pos-1  { grid-column: 3 / 9; grid-row: 4; }
          .question-map-pos-2  { grid-column: 7 / 11; grid-row: 2; }
          .question-map-pos-3  { grid-column: 1 / 6; grid-row: 2; }
          .question-map-pos-4  { grid-column: 4 / 8; grid-row: 1; }
          .question-map-pos-5  { grid-column: 1 / 4; grid-row: 4; }
          .question-map-pos-6  { grid-column: 4 / 8; grid-row: 6; }
          .question-map-pos-7  { grid-column: 8 / 11; grid-row: 4; }
          .question-map-pos-8  { grid-column: 1 / 4; grid-row: 6; }
          .question-map-pos-9  { grid-column: 8 / 11; grid-row: 7; }
          .question-map-pos-10 { grid-column: 1 / 4; grid-row: 1; }
          .question-map-pos-11 { grid-column: 1 / 4; grid-row: 8; }
          .question-map-pos-12 { grid-column: 7 / 11; grid-row: 8; }
          .question-map-pos-13 { grid-column: 8 / 11; grid-row: 1; }
          .question-map-pos-14 { grid-column: 4 / 7; grid-row: 8; }
          .question-map-pos-15 { grid-column: 8 / 11; grid-row: 3; }
          .question-map-pos-16 { grid-column: 1 / 4; grid-row: 7; }
          .question-map-pos-17 { grid-column: 1 / 3; grid-row: 3; }
          .question-map-pos-18 { grid-column: 1 / 3; grid-row: 5; }
          .question-map-pos-19 { grid-column: 3 / 5; grid-row: 3; }
          .question-map-pos-20 { grid-column: 7 / 9; grid-row: 3; }
          .question-map-pos-21 { grid-column: 9 / 11; grid-row: 5; }
          .question-map-pos-22 { grid-column: 3 / 5; grid-row: 7; }
          .question-map-pos-23 { grid-column: 6 / 8; grid-row: 7; }
          .question-map-pos-24 { grid-column: 2 / 4; grid-row: 5; }
        }

        @media (max-width: 760px) {
          .homepage-question-cloud-desktop {
            display: none;
          }

          .homepage-question-cloud-mobile {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
            margin-top: 15px;
            padding: 10px 0;
            border-radius: 14px;
            background: #17304d;
          }

          .homepage-question-cloud-mobile .question-map-link {
            position: static;
            justify-content: flex-start;
            min-height: 52px;
            padding: 9px 16px;
            border-radius: 0;
            text-align: left;
            transform: none;
          }

          .homepage-question-cloud-mobile .question-map-link:hover {
            transform: none;
            background: rgba(255, 255, 255, 0.08);
          }

          .homepage-question-cloud-mobile .question-map-xl {
            margin: 6px 10px;
            border-radius: 12px;
            font-size: 1.45rem;
          }

          .homepage-question-cloud-mobile .question-map-lg {
            font-size: 1.15rem;
          }

          .homepage-question-cloud-mobile .question-map-md {
            font-size: 1rem;
          }

          .homepage-question-cloud-mobile .question-map-sm {
            font-size: 0.9rem;
          }

          .homepage-question-map-toggle {
            min-height: 46px;
            margin: 8px 10px 6px;
            padding: 9px 14px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            font: inherit;
            font-size: 0.9rem;
            font-weight: 850;
            cursor: pointer;
          }

          .homepage-question-map-toggle:hover {
            background: rgba(255, 255, 255, 0.13);
          }

          .homepage-question-map-toggle:focus-visible {
            outline: 3px solid rgba(255, 255, 255, 0.34);
            outline-offset: 2px;
          }
        }

        .homepage-question-map-note {
          margin: 12px 0 0;
          color: #6c8094;
          font-size: 0.88rem;
          line-height: 1.45;
          text-align: center;
        }

        @media (max-width: 760px) {
          .homepage-question-map {
            width: min(100% - 20px, 1120px);
            padding: 18px 14px;
          }

          .homepage-question-map-head {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .homepage-question-map-note {
            display: none;
          }
        }

        .date-home-secondary {
          width: min(100% - 32px, 1080px);
          margin: 0 auto;
        }

        .date-home-page .deadline-guide-links:not(.is-compact) {
          position: relative;
          width: min(100% - 32px, 1120px);
          margin-top: 42px;
          padding: 32px 28px 30px;
          overflow: hidden;
          border-color: rgba(217, 164, 65, 0.34);
          border-radius: 22px;
          background: #fff4dc;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }

        .date-home-page .deadline-guide-links:not(.is-compact)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 28px;
          width: 74px;
          height: 4px;
          border-radius: 0 0 999px 999px;
          background: #d9a441;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-heading {
          max-width: 720px;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-heading > span {
          color: #8a6218;
          letter-spacing: 0.09em;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-heading h2 {
          margin-top: 7px;
          color: #3f3118;
          font-size: clamp(1.35rem, 2.4vw, 1.7rem);
          letter-spacing: -0.025em;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-heading p {
          max-width: 560px;
          margin-top: 7px;
          color: #75654a;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-grid {
          gap: 10px;
          margin-top: 20px;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-grid a {
          min-height: 96px;
          border-color: rgba(138, 98, 24, 0.12);
          background: rgba(255, 253, 248, 0.9);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-grid a:hover {
          border-color: rgba(138, 98, 24, 0.24);
          background: rgba(255, 255, 255, 0.97);
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-grid b {
          background: #fff0c8;
          color: #8a6218;
        }

        .date-home-page .deadline-guide-links:not(.is-compact)
          .deadline-guide-links-grid a:hover b {
          background: #f6dfaa;
          color: #6d490f;
        }

        .date-home-business {
          margin-top: 30px;
          padding: 30px 28px 32px;
          border: 1px solid rgba(29, 79, 130, 0.1);
          border-radius: 22px;
          background: #f3f7fb;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .date-home-section-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 16px;
        }

        .date-home-chapter-title,
        .date-home-tools-heading {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .date-home-chapter-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 6px;
          color: #246b52;
          font-size: 0.73rem;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .date-home-chapter-label::before {
          content: '';
          width: 18px;
          height: 3px;
          border-radius: 999px;
          background: #246b52;
        }

        .date-home-section-heading h2,
        .date-home-tools h2 {
          margin: 0;
          color: #18304c;
          font-size: clamp(1.45rem, 2.5vw, 1.9rem);
          line-height: 1.1;
          letter-spacing: -0.025em;
        }

        .date-home-section-heading a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 7px 11px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #536f8b;
          font-size: 0.84rem;
          font-weight: 850;
          text-decoration: none;
        }

        .date-home-business-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .date-home-business-answer {
          position: relative;
          min-height: 112px;
          padding: 14px 42px 14px 14px;
          border: 1px solid rgba(29, 79, 130, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
          transition:
            transform 120ms ease,
            border-color 120ms ease,
            background 120ms ease,
            box-shadow 120ms ease;
        }

        .date-home-business-answer::after {
          content: '→';
          position: absolute;
          right: 15px;
          top: 50%;
          color: #246b52;
          font-size: 1.05rem;
          font-weight: 950;
          transform: translateY(-50%);
        }

        .date-home-business-answer:hover {
          transform: translateY(-1px);
          border-color: rgba(36, 107, 82, 0.24);
          background: #f9fcfa;
          box-shadow: 0 8px 22px rgba(19, 38, 70, 0.05);
        }

        .date-home-business-answer:focus-visible {
          outline: 3px solid rgba(29, 79, 130, 0.2);
          outline-offset: 2px;
        }

        .date-home-business-answer span {
          color: #637a94;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .date-home-business-answer strong {
          margin-top: 5px;
          color: #10213f;
          font-size: 1.35rem;
          line-height: 1.08;
        }

        .date-home-business-answer small {
          margin-top: 3px;
          color: #7a899b;
        }

        .date-home-rule {
          margin: 9px 2px 0;
          color: #667b91;
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .date-home-tools {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          margin-top: 42px;
          padding: 34px 28px 36px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 24px;
          background: #f4ecdf;
        }

        .date-home-tools::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -2;
          background-image: url('/choose-by-task-background.webp');
          background-position: center center;
          background-size: cover;
          background-repeat: no-repeat;
          opacity: 0.48;
          pointer-events: none;
        }

        .date-home-tools::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: rgba(255, 250, 242, 0.28);
          pointer-events: none;
        }

        .date-home-tools-heading,
        .date-home-tool-grid {
          position: relative;
          z-index: 1;
        }

        .date-home-tools-heading {
          margin-bottom: 18px;
        }

        .date-home-tools-heading p {
          max-width: 600px;
          margin: 7px 0 0;
          color: #667b91;
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .date-home-tool-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .date-home-tool-toggle {
          display: none;
        }

        .date-home-tool-grid a {
          position: relative;
          min-height: 132px;
          padding: 18px 48px 18px 18px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 14px;
          background: rgba(255, 253, 249, 0.90);
          backdrop-filter: blur(1px);
          -webkit-backdrop-filter: blur(1px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
          transition:
            transform 120ms ease,
            border-color 120ms ease,
            background 120ms ease,
            box-shadow 120ms ease;
        }

        .date-home-tool-grid a::after {
          content: '→';
          position: absolute;
          right: 16px;
          top: 50%;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: #eaf5ef;
          color: #246b52;
          font-size: 1rem;
          font-weight: 950;
          transform: translateY(-50%);
          transition:
            background 120ms ease,
            color 120ms ease,
            transform 120ms ease;
        }

        .date-home-tool-grid a:hover {
          transform: translateY(-1px);
          border-color: rgba(36, 107, 82, 0.28);
          background: #fff;
          box-shadow: 0 10px 24px rgba(19, 38, 70, 0.06);
        }

        .date-home-tool-grid a:hover::after {
          background: #246b52;
          color: #fff;
          transform: translateY(-50%) translateX(2px);
        }

        .date-home-tool-grid a:focus-visible {
          outline: 3px solid rgba(29, 79, 130, 0.2);
          outline-offset: 2px;
        }

        .date-home-tool-grid span {
          color: #74869a;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-home-tool-grid strong {
          margin-top: 5px;
          color: #17304c;
          font-size: 1.18rem;
        }

        .date-home-tool-grid small {
          margin-top: 5px;
          color: #6d7f93;
          line-height: 1.4;
        }

        .date-home-secondary {
          margin-bottom: 34px;
          padding: 18px 20px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .date-home-secondary div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .date-home-secondary span {
          color: #7b899a;
          font-size: 0.76rem;
        }

        .date-home-secondary strong {
          color: #2e4662;
          font-size: 0.95rem;
        }

        .date-home-secondary a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.74);
          color: #536b87;
          font-size: 0.84rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .date-home-secondary a::after {
          content: '→';
          margin-left: 7px;
          font-weight: 900;
        }

        .date-home-secondary a:hover {
          border-color: rgba(23, 58, 99, 0.2);
          background: #fff;
        }

        .date-home-secondary a:focus-visible {
          outline: 3px solid rgba(29, 79, 130, 0.2);
          outline-offset: 2px;
        }

        @media (max-width: 760px) {
          .date-home-hero {
            width: min(100% - 24px, 1240px);
            min-height: 0;
          }

          .date-home-header {
            min-height: 56px;
          }

          .date-home-brand img {
            width: 122px;
            max-height: 32px;
          }

          .date-home-nav {
            gap: 10px;
          }

          .date-home-nav a {
            min-height: 40px;
            font-size: 0.78rem;
          }

          .date-home-answer {
            padding: 14px 0 12px;
          }

          .date-home-kicker {
            margin-bottom: 3px;
            font-size: 0.66rem;
          }

          .date-home-date {
            font-size: clamp(1.75rem, 8.2vw, 2.25rem);
            line-height: 1;
          }

          .date-home-context {
            gap: 5px;
            margin-top: 6px;
            font-size: 0.76rem;
          }

          .date-home-business,
          .date-home-tools,
          .date-home-secondary {
            width: min(100% - 24px, 1080px);
          }

          .date-home-business {
            margin-top: 20px;
            padding: 16px 12px 18px;
            border-radius: 18px;
          }

          .date-home-tools {
            margin-top: 26px;
            padding: 18px 10px 20px;
            border-radius: 18px;
          }

          .date-home-tools::before {
            background-position: center center;
            background-size: cover;
            opacity: 0.42;
          }

          .date-home-tools::after {
            background: rgba(255, 250, 242, 0.34);
          }

          .date-home-page .deadline-guide-links:not(.is-compact) {
            width: calc(100% - 24px);
            margin-top: 30px;
            padding: 24px 14px 18px;
            border-radius: 18px;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)::before {
            left: 14px;
            width: 58px;
            height: 3px;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)
            .deadline-guide-links-heading h2 {
            font-size: 1.28rem;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)
            .deadline-guide-links-grid {
            gap: 7px;
            margin-top: 16px;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)
            .deadline-guide-links-grid a {
            min-height: 82px;
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)
            .deadline-guide-links-grid span {
            display: none;
          }

          .date-home-page .deadline-guide-links:not(.is-compact)
            .deadline-guide-links-grid a {
            min-height: 70px;
          }

          .date-home-section-heading {
            align-items: flex-start;
          }

          .date-home-business-grid {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .date-home-business-answer {
            min-height: 52px;
            padding: 6px 38px 6px 10px;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "label date"
              "label weekday";
            align-items: center;
          }

          .date-home-business-answer::after {
            right: 12px;
          }

          .date-home-business-answer span {
            grid-area: label;
          }

          .date-home-business-answer strong {
            grid-area: date;
            margin: 0;
            text-align: right;
            font-size: 1.08rem;
            line-height: 1.02;
          }

          .date-home-business-answer small {
            grid-area: weekday;
            margin: 1px 0 0;
            text-align: right;
            line-height: 1.1;
          }

          .date-home-rule {
            margin-top: 7px;
            font-size: 0.8rem;
            line-height: 1.35;
          }

          .date-home-tool-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .date-home-tool-grid a {
            min-height: 86px;
            padding: 12px 46px 12px 14px;
            border-radius: 12px;
          }

          .date-home-tool-grid span {
            font-size: 0.68rem;
          }

          .date-home-tool-grid strong {
            margin-top: 3px;
            font-size: 1.05rem;
            line-height: 1.12;
          }

          .date-home-tool-grid p {
            margin-top: 2px;
            font-size: 0.82rem;
            line-height: 1.18;
          }

          .date-home-tool-grid a::after {
            right: 12px;
            width: 30px;
            height: 30px;
          }

          .date-home-tool-grid .date-home-tool-secondary {
            display: none;
          }

          .date-home-tool-grid .date-home-tool-secondary.is-expanded {
            display: flex;
          }

          .date-home-tool-toggle {
            min-height: 46px;
            width: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
            padding: 8px 14px;
            border: 1px solid rgba(36, 107, 82, 0.16);
            border-radius: 999px;
            background: rgba(255, 253, 249, 0.84);
            color: #246b52;
            font: inherit;
            font-size: 0.88rem;
            font-weight: 900;
            cursor: pointer;
          }

          .date-home-secondary {
            min-height: 58px;
            align-items: center;
            flex-direction: row;
            margin-bottom: 24px;
            padding: 12px 14px;
          }

          .date-home-secondary span {
            display: none;
          }

          .date-home-secondary strong {
            font-size: 0.88rem;
          }

          .date-home-secondary a {
            min-height: 42px;
            margin-left: auto;
          }

          .date-home-page .site-footer > p:first-of-type {
            display: none;
          }

          .date-home-page .site-footer > p:last-of-type {
            max-width: 34rem;
            margin-top: 12px;
          }
        }
      `}</style>
    </main>
  )
}

function CalculatorHubPage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const [startDate, setStartDate] = useState(todayInputValue)
  const [mode, setMode] = useState<CalculatorMode>('calendar')
  const [dayAmount, setDayAmount] = useState('30')
  const [invoiceTerm, setInvoiceTerm] = useState<InvoiceTerm>('net30')
  const [title, setTitle] = useState(getDefaultTitle('calendar'))
  const [isCustomTitle, setIsCustomTitle] = useState(false)
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const parsedStartDate = parsePlainDate(startDate)
  const amount = parseInteger(dayAmount)
  const validationMessage = getValidationMessage(mode, parsedStartDate, amount, title)
  const amountValidationMessage = mode !== 'invoice' && validationMessage === positiveWholeNumberMessage
    ? validationMessage
    : null
  const canCalculate = parsedStartDate !== null && (mode === 'invoice' || amount !== null) && !validationMessage
  const safeAmount = amount ?? 0
  const dueDate = canCalculate && parsedStartDate
    ? getDueDateForMode(mode, parsedStartDate, safeAmount, invoiceTerm)
    : null
  const cancelByDate = mode === 'trial' && dueDate
    ? getDueDateForMode('calendar', dueDate, -1, invoiceTerm)
    : null
  const daysRemaining = dueDate ? daysBetween(today, dueDate) : 0
  const statusText = dueDate ? getStatusText(daysRemaining) : 'Enter a valid date'

  useEffect(() => {
    function restoreHomeLocation() {
      window.requestAnimationFrame(() => {
        if (window.location.hash === '#calculator') {
          const calculator = document.getElementById('calculator')
          const calculatorHeading = document.getElementById('calculator-heading')

          if (!calculator || !calculatorHeading) {
            return
          }

          if (calculator instanceof HTMLDetailsElement) {
            calculator.open = true
          }

          const calculatorTop =
            calculator.getBoundingClientRect().top +
            window.scrollY -
            80

          window.scrollTo({
            top: Math.max(calculatorTop, 0),
            left: 0,
            behavior: 'auto',
          })

          calculatorHeading.focus({
            preventScroll: true,
          })

          return
        }

        if (window.location.pathname === '/calculators' && !window.location.hash) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto',
          })

          document.getElementById('homepage-title')?.focus({
            preventScroll: true,
          })
        }
      })
    }

    window.addEventListener('popstate', restoreHomeLocation)
    window.addEventListener('hashchange', restoreHomeLocation)

    return () => {
      window.removeEventListener('popstate', restoreHomeLocation)
      window.removeEventListener('hashchange', restoreHomeLocation)
    }
  }, [])

  useEffect(() => {
    if (!isCustomTitle) {
      setTitle(getDefaultTitle(mode))
    }
  }, [isCustomTitle, mode])

  useEffect(() => {
    setStorageMessage(null)
    setCopyMessage(null)
  }, [mode, startDate, dayAmount, invoiceTerm])

  const canSave = Boolean(dueDate && title.trim() && !validationMessage)
  const sortedSavedDeadlines = useMemo(
    () => [...savedDeadlines].sort(compareSavedDeadlines),
    [savedDeadlines],
  )
  const nextDueDeadline = useMemo(
    () => getNextDueDeadline(savedDeadlines, today),
    [savedDeadlines, today],
  )
  const savedDeadlineGroups = useMemo(
    () => groupSavedDeadlines(sortedSavedDeadlines, today, nextDueDeadline?.id),
    [nextDueDeadline?.id, sortedSavedDeadlines, today],
  )
  const completedDeadlineCount = savedDeadlineGroups.completed.length

  const modeDetails: Record<CalculatorMode, {
    title: string
    helper: string
  }> = {
    calendar: { title: 'Add days', helper: 'Find a future date' },
    business: { title: 'Business days', helper: 'Skip weekends' },
    invoice: { title: 'Invoice', helper: 'Calculate payment terms' },
    trial: { title: 'Free trial', helper: 'Estimate trial end' },
    return: { title: 'Return', helper: 'Find the last return day' },
  }

  function focusHomeSection(sectionId: string, headingId: string) {
    const section = document.getElementById(sectionId)
    const heading = document.getElementById(headingId)

    if (!section || !heading) {
      return
    }

    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, '', `/calculators#${sectionId}`)
    }

    const sectionTop =
      section.getBoundingClientRect().top +
      window.scrollY -
      80

    window.scrollTo({
      top: Math.max(sectionTop, 0),
      left: 0,
      behavior: 'smooth',
    })

    window.setTimeout(() => {
      heading.focus({
        preventScroll: true,
      })
    }, 450)
  }

  function saveDeadline() {
    if (!dueDate || !title.trim()) {
      return
    }

    const normalizedTitle = title.trim()
    const nextDeadline: SavedDeadline = {
      id: crypto.randomUUID(),
      title: normalizedTitle,
      category: mode,
      dueDate: toDateKey(dueDate),
      startDate: parsedStartDate ? toDateKey(parsedStartDate) : undefined,
      done: false,
      createdAt: new Date().toISOString(),
    }

    if (isDuplicateSavedDeadline(savedDeadlines, nextDeadline)) {
      setStorageMessage('This date is already saved.')
      return
    }

    const nextDeadlines = [nextDeadline, ...savedDeadlines]
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage('Saved to My due dates.')
    setTitle(getDefaultTitle(mode))
    setIsCustomTitle(false)
  }

  async function copyAnswer() {
    if (!dueDate) {
      return
    }

    const answer = getCopyAnswer(mode, dueDate, cancelByDate)

    try {
      await navigator.clipboard.writeText(answer)
      setCopyMessage('Copied.')
    } catch {
      setCopyMessage('Copy was not available in this browser.')
    }
  }

  function toggleDone(id: string) {
    const nextDeadlines = savedDeadlines.map((deadline) =>
      deadline.id === id ? { ...deadline, done: !deadline.done } : deadline,
    )
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage(null)
  }

  function deleteDeadline(id: string) {
    const nextDeadlines = savedDeadlines.filter((deadline) => deadline.id !== id)
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage(null)
  }

  function clearCompletedDeadlines() {
    const nextDeadlines = savedDeadlines.filter((deadline) => !deadline.done)
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage(null)
  }

  return (
    <main className="page-shell home-page friendly-home calculator-hub-page">
      <a className="skip-to-calculator" href="#calculator" onClick={(event) => { event.preventDefault(); focusHomeSection('calculator', 'calculator-heading') }}>Skip to calculator</a>
      <section className="dual-intent-hero" aria-labelledby="homepage-title">
        <header className="calculator-directory-header" aria-label="WhenIsDue navigation">
          <a
            className="calculator-directory-brand"
            href="/"
            aria-label="WhenIsDue home"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            <img src="/whenisdue-logo.png" alt="WhenIsDue" />
          </a>
        </header>

        <div className="dual-intent-grid utility-hub-hero">
          <div className="dual-intent-copy">
            <p className="friendly-eyebrow">
              <span aria-hidden="true">◷</span>
              Date and deadline tools
            </p>
            <h1 id="homepage-title" tabIndex={-1}>What do you need to find?</h1>
            <p className="friendly-subtitle">
              Pick the question closest to yours.
            </p>
          </div>

          <div className="dual-intent-proof utility-directory-cards" aria-label="WhenIsDue calculators">
            <a
              className="intent-proof-card proof-calculator"
              href="/business-days-calculator"
              data-description="Add business days to a date while skipping weekends and optional holidays."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-days-calculator' })
                onNavigate('/business-days-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">◷</span>
              <div>
                <h2>What date is it after business days?</h2>
                <p className="calculator-card-description">Add working days while skipping weekends and optional holidays.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/business-days-between-dates"
              data-description="Count the business days between two dates."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-days-between-dates' })
                onNavigate('/business-days-between-dates')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↔</span>
              <div>
                <h2>How many business days are between two dates?</h2>
                <p className="calculator-card-description">Count working days between two dates.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/invoice-due-date-calculator"
              data-description="Use the invoice date and payment terms such as Net 30 or EOM."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/invoice-due-date-calculator' })
                onNavigate('/invoice-due-date-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">#</span>
              <div>
                <h2>When is an invoice due?</h2>
                <p className="calculator-card-description">Find an invoice due date from Net terms or EOM.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/return-window-calculator"
              data-description="Use the purchase or delivery date and the return window."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/return-window-calculator' })
                onNavigate('/return-window-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↩</span>
              <div>
                <h2>What is the last day to return it?</h2>
                <p className="calculator-card-description">Find the last day of a return window.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/free-trial-calculator"
              data-description="Use the start date and trial length."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/free-trial-calculator' })
                onNavigate('/free-trial-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">◇</span>
              <div>
                <h2>When does a free trial end?</h2>
                <p className="calculator-card-description">Find when a free trial ends.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/deadline-calculator"
              data-description="Use this when you need custom counting rules."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/deadline-calculator' })
                onNavigate('/deadline-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">±</span>
              <div>
                <h2>Add or subtract days from a date</h2>
                <p className="calculator-card-description">Count forward or backward using custom deadline rules.</p>
              </div>
            </a>

            <a
              className="intent-proof-card proof-calculator"
              href="/business-hours-deadline-calculator"
              data-description="Add working hours inside a business-day schedule."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-hours-deadline-calculator' })
                onNavigate('/business-hours-deadline-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">⏱</span>
              <div>
                <h2>When is a deadline after work hours?</h2>
                <p className="calculator-card-description">Add working hours inside a business-day schedule.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/next-payday-calculator"
              data-description="Weekly, every two weeks, twice a month, or monthly."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/next-payday-calculator' })
                onNavigate('/next-payday-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">$</span>
              <div>
                <h2>When is my next payday?</h2>
                <p className="calculator-card-description">Find the next date in a pay schedule.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/net-30-due-date"
              data-description="Add 30 calendar days to the invoice date."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/net-30-due-date' })
                onNavigate('/net-30-due-date')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">30</span>
              <div>
                <h2>When is a Net 30 invoice due?</h2>
                <p className="calculator-card-description">Get the due date for a Net 30 invoice.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/2-10-net-30-calculator"
              data-description="For invoices using 2/10 Net 30 terms."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/2-10-net-30-calculator' })
                onNavigate('/2-10-net-30-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">2%</span>
              <div>
                <h2>When are the discount and payment due?</h2>
                <p className="calculator-card-description">See the discount deadline and full-payment due date.</p>
              </div>
            </a>

            <a
              className="intent-proof-card proof-calculator"
              href="/shipping-delivery-range-calculator"
              data-description="Turn a 3–5 day estimate into earliest and latest dates."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/shipping-delivery-range-calculator' })
                onNavigate('/shipping-delivery-range-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">⇢</span>
              <div>
                <h2>When should a delivery arrive?</h2>
                <p className="calculator-card-description">Turn a delivery estimate into earliest and latest dates.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/notice-period-calculator"
              data-description="Use the required notice period to find the date."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/notice-period-calculator' })
                onNavigate('/notice-period-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">←</span>
              <div>
                <h2>When should I give notice?</h2>
                <p className="calculator-card-description">Count backward to find when notice is due.</p>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/subscription-renewal-calculator"
              data-description="Find the next renewal and, if needed, when to cancel."
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/subscription-renewal-calculator' })
                onNavigate('/subscription-renewal-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↻</span>
              <div>
                <h2>When does a subscription renew?</h2>
                <p className="calculator-card-description">Find the next renewal and optional cancellation deadline.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <details id="calculator" className="calculator-secondary-section">
        <summary className="friendly-section-heading">
          <span className="step-number">+</span>
          <div>
            <h2>Need one flexible calculator?</h2>
            <p>Use one calculator when you need custom counting rules.</p>
          </div>
        </summary>

        <section className="friendly-calculator" aria-label="Quick deadline calculators">
        <div className="scenario-section">
          <div className="friendly-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2 id="calculator-heading" tabIndex={-1}>Quick deadline calculators</h2>
              <p>Use these free tools when you only need to calculate a date.</p>
            </div>
          </div>

          <div className="scenario-grid" role="radiogroup" aria-label="Calculation type">
            {modes.map((modeOption) => {
              const details = modeDetails[modeOption]

              return (
                <label
                  className={`scenario-card scenario-${modeOption}`}
                  key={modeOption}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={modeOption}
                    checked={mode === modeOption}
                    onChange={() => setMode(modeOption)}
                  />
                  <span className="scenario-icon" aria-hidden="true"><ScenarioIcon mode={modeOption} /></span>
                  <span className="scenario-copy">
                    <strong>{details.title}</strong>
                    <span>{details.helper}</span>
                  </span>
                  <span className="scenario-check" aria-hidden="true">✓</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="friendly-workspace">
          <form className="friendly-form-card" onSubmit={(event) => event.preventDefault()}>
            <div className="friendly-section-heading compact-heading">
              <span className="step-number">2</span>
              <div>
                <h2>Tell us the details</h2>
                <p>{getFriendlyModeInstruction(mode)}</p>
              </div>
            </div>

            <div className="friendly-fields">
              <label className="field">
                <span>{getFriendlyStartDateLabel(mode)}</span>
                <input
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              {mode === 'invoice' ? (
                <label className="field">
                  <span>What are the payment terms?</span>
                  <select
                    value={invoiceTerm}
                    onChange={(event) => setInvoiceTerm(event.target.value as InvoiceTerm)}
                  >
                    {invoiceTerms.map((term) => (
                      <option value={term} key={term}>
                        {invoiceTermLabels[term]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  <span>{getFriendlyAmountLabel(mode)}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={getAmountLimit(mode)}
                    value={dayAmount}
                    onChange={(event) => setDayAmount(event.target.value)}
                  />
                  {amountValidationMessage ? (
                    <span className="field-error">{amountValidationMessage}</span>
                  ) : null}
                </label>
              )}
            </div>

            <p className="friendly-counting-note">
              <span aria-hidden="true">i</span>
              {getFriendlyCountingNote(mode)}
            </p>
          </form>

          <section
            className={`calendar-result-card result-${mode} ${daysRemaining < 0 ? 'is-overdue' : ''}`}
            aria-live="polite"
          >
            <div className="calendar-result-top">
              <p className="calendar-result-kicker">{getFriendlyResultLabel(mode)}</p>
              <span className="result-spark" aria-hidden="true">✦</span>
            </div>

            {dueDate ? (
              <>
                <div className="calendar-answer">
                  <div className="date-tile" aria-hidden="true">
                    <span>{formatMonthShort(dueDate)}</span>
                    <strong>{dueDate.day}</strong>
                    <small>{formatWeekday(dueDate)}</small>
                  </div>
                  <div className="calendar-answer-copy">
                    <p className="calendar-weekday">{formatWeekday(dueDate)}</p>
                    <p className="calendar-full-date">{formatPlainDate(dueDate)}</p>
                    <span className={`status-badge ${getUrgencyClass(daysRemaining)}`}>
                      {mode === 'business' ? formatBusinessDistance(safeAmount) : statusText}
                    </span>
                  </div>
                </div>

                {cancelByDate ? (
                  <p className="friendly-extra-result">
                    Suggested cancellation reminder:
                    <strong>{formatPlainDate(cancelByDate)}</strong>
                  </p>
                ) : null}

                {mode === 'business' ? (
                  <p className="friendly-extra-result">
                    Weekends are skipped. Public holidays are not removed.
                  </p>
                ) : null}

                <div className="result-actions single-action">
                  <button className="secondary-button" type="button" onClick={copyAnswer}>
                    Copy answer
                  </button>
                </div>
                {copyMessage ? <p className="action-message">{copyMessage}</p> : null}
              </>
            ) : (
              <div className="result-placeholder">
                <span aria-hidden="true">◷</span>
                <p>{validationMessage ?? 'Enter a valid local calendar date.'}</p>
              </div>
            )}
          </section>
        </div>

        <section className="friendly-save-card" aria-labelledby="save-calculation-title">
          <div className="save-card-copy">
            <span className="save-icon" aria-hidden="true">⌑</span>
            <div>
              <h2 id="save-calculation-title">Save for later</h2>
              <p>Saved privately on this device.</p>
            </div>
          </div>

          <label className="field save-name-field">
            <span>Give this date a name</span>
            <input
              id="save-date-title"
              maxLength={titleMaxLength}
              placeholder="Example: Return headphones"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setIsCustomTitle(true)
              }}
            />
          </label>

          <button className="primary-button save-date-button" type="button" disabled={!canSave} onClick={saveDeadline}>
            Save to My due dates
          </button>
          {storageMessage ? <p className="form-message save-message">{storageMessage}</p> : null}
        </section>
        </section>
      </details>

      <DeadlineCountingGuideLinks onNavigate={onNavigate} compact />

      <section id="saved-dates" className="saved-dates-section" aria-labelledby="saved-title">
        <div className="saved-dates-heading">
          <div>
            <p className="friendly-eyebrow muted-eyebrow">Your personal deadline list</p>
            <h2 id="saved-title" tabIndex={-1}>Your saved dates</h2>
            <p>See what needs attention without digging through a long list.</p>
          </div>
          <div className="saved-heading-actions">
            <span className="saved-count">
              {savedDeadlines.length} {savedDeadlines.length === 1 ? 'date' : 'dates'}
            </span>
            {completedDeadlineCount > 0 ? (
              <button
                className="clear-completed-button"
                type="button"
                onClick={clearCompletedDeadlines}
              >
                Clear completed
              </button>
            ) : null}
          </div>
        </div>

        {nextDueDeadline ? (
          <NextDueSpotlight
            deadline={nextDueDeadline}
            onToggleDone={toggleDone}
          />
        ) : null}

        {savedDeadlines.length > 0 ? (
          <div className="saved-groups">
            <SavedDeadlineGroup
              title="Overdue"
              description="These dates have already passed."
              deadlines={savedDeadlineGroups.overdue}
              emptyMessage="Nothing overdue."
              groupClass="group-overdue"
              today={today}
              onDelete={deleteDeadline}
              onToggleDone={toggleDone}
            />
            <SavedDeadlineGroup
              title="Due soon"
              description="Due today or within the next seven days."
              deadlines={savedDeadlineGroups.dueSoon}
              emptyMessage="Nothing due soon."
              groupClass="group-soon"
              today={today}
              onDelete={deleteDeadline}
              onToggleDone={toggleDone}
            />
            <SavedDeadlineGroup
              title="Later"
              description="Upcoming dates more than a week away."
              deadlines={savedDeadlineGroups.later}
              emptyMessage="No later dates saved."
              groupClass="group-later"
              today={today}
              onDelete={deleteDeadline}
              onToggleDone={toggleDone}
            />
            {completedDeadlineCount > 0 ? (
              <SavedDeadlineGroup
                title="Completed"
                description="Finished dates kept for reference."
                deadlines={savedDeadlineGroups.completed}
                emptyMessage="No completed dates."
                groupClass="group-completed"
                today={today}
                onDelete={deleteDeadline}
                onToggleDone={toggleDone}
              />
            ) : null}
          </div>
        ) : (
          <div className="friendly-empty-state">
            <div className="empty-calendar" aria-hidden="true">
              <span>—</span>
              <strong>✓</strong>
            </div>
            <div>
              <h3>Your saved dates will appear here.</h3>
              <p>Calculate a date above, give it a name, and save it for next time.</p>
            </div>
          </div>
        )}
      </section>

      <section id="workspace-preview" className="workspace-showcase" aria-labelledby="workspace-showcase-title">
        <div className="workspace-showcase-copy">
          <p className="friendly-eyebrow muted-eyebrow">For virtual assistants</p>
          <h2 id="workspace-showcase-title">Start every morning knowing what needs attention.</h2>
          <p>
            Separate the day you should act, the real deadline, and the day you need to
            follow up. Then work from one clear Today view.
          </p>
          <a
            className="workspace-primary-cta"
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            Create your workspace
          </a>
        </div>

        <div
          className="workspace-product-preview"
          aria-label="Preview of the WhenIsDue Today workspace"
        >
          <div className="preview-window-bar">
            <span className="preview-brand-dot" aria-hidden="true">✓</span>
            <strong>Today</strong>
            <span>Saved and synced</span>
          </div>

          <div className="preview-summary-row">
            <div><span>Needs attention</span><strong>3</strong></div>
            <div><span>Follow-ups due</span><strong>2</strong></div>
            <div><span>Overdue</span><strong>1</strong></div>
          </div>

          <div className="preview-task-list">
            <article className="preview-task preview-task-action">
              <div><span>RICHARD</span><strong>Confirm Friday’s appointment</strong></div>
              <b>Needs action</b>
              <p><span>Action today</span><span>Due Aug 1</span></p>
            </article>
            <article className="preview-task preview-task-waiting">
              <div><span>ACME STUDIO</span><strong>Approval for revised content calendar</strong></div>
              <b>Waiting</b>
              <p><span>Follow up today</span><span>Waiting on client</span></p>
            </article>
            <article className="preview-task preview-task-overdue">
              <div><span>JAN</span><strong>Send updated appointment summary</strong></div>
              <b>Overdue</b>
              <p><span>Action Jul 29</span><span>Follow up today</span></p>
            </article>
          </div>
        </div>

        <div className="workspace-story-steps">
          <article><span>1</span><h3>Add your clients</h3><p>Keep each client’s active work and follow-ups together.</p></article>
          <article><span>2</span><h3>Capture the next action</h3><p>Separate the action date, actual due date, and follow-up date.</p></article>
          <article><span>3</span><h3>Work from Today</h3><p>Open one view and see what needs attention first.</p></article>
        </div>
      </section>

      <section className="trust-strip" aria-label="Privacy and ease of use">
        <span><b aria-hidden="true">✓</b> Free to use</span>
        <span><b aria-hidden="true">⌁</b> Calculator dates stay on this device</span>
        <span><b aria-hidden="true">○</b> No account is required for calculations</span>
      </section>

      <style>{`
        .calculator-hub-page .calculator-directory-header {
          width: min(100% - 32px, 1240px);
          min-height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .calculator-hub-page .calculator-directory-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .calculator-hub-page .calculator-directory-brand img {
          display: block;
          width: 166px;
          height: auto;
        }

        .calculator-hub-page .dual-intent-hero {
          padding-bottom: 18px;
        }

        .calculator-hub-page .utility-hub-hero {
          width: min(100% - 32px, 1240px);
          margin: 0 auto;
          display: block !important;
        }

        .calculator-hub-page .dual-intent-copy {
          max-width: none;
          margin: 24px 0 16px;
        }

        .calculator-hub-page .dual-intent-copy h1 {
          margin: 6px 0 0;
          font-size: clamp(3.1rem, 5vw, 5rem);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }

        .calculator-hub-page .dual-intent-copy .friendly-subtitle {
          margin-top: 10px;
          font-size: 1.08rem;
        }

        .calculator-hub-page .utility-directory-cards {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px !important;
          visibility: visible !important;
          opacity: 1 !important;
          height: auto !important;
          overflow: visible !important;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator {
          min-width: 0;
          min-height: 104px !important;
          display: flex !important;
          align-items: center;
          gap: 11px;
          padding: 14px !important;
          border: 1px solid rgba(21, 54, 84, 0.12);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
          color: #153654;
          text-decoration: none;
          visibility: visible !important;
          opacity: 1 !important;
          box-shadow: none;
          transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator:hover {
          transform: translateY(-1px);
          border-color: rgba(45, 123, 100, 0.34);
          background: #fff;
        }

        .calculator-hub-page .utility-directory-cards .intent-proof-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f4f2e9;
          color: #315a6d;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator > div {
          min-width: 0;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator h2 {
          margin: 0;
          color: #153654;
          font-size: 0.98rem;
          line-height: 1.18;
          letter-spacing: -0.015em;
          text-decoration: none;
        }

        .calculator-hub-page .utility-directory-cards .calculator-card-description {
          display: none;
          margin: 0;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator:focus-visible {
          outline: 3px solid rgba(45, 123, 100, 0.28);
          outline-offset: 2px;
        }

        /* Desktop: explain a calculator only when the user asks by hovering/focusing. */
        .calculator-hub-page .utility-directory-cards .proof-calculator[data-description] {
          position: relative;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator[data-description]::after {
          content: attr(data-description);
          position: absolute;
          left: 50%;
          bottom: calc(100% + 8px);
          z-index: 30;
          width: max-content;
          max-width: 250px;
          padding: 9px 11px;
          border-radius: 10px;
          background: #153654;
          color: #fff;
          font-size: 0.76rem;
          font-weight: 750;
          line-height: 1.35;
          text-align: left;
          box-shadow: 0 8px 22px rgba(21, 54, 84, 0.16);
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 4px);
          transition: opacity 120ms ease, transform 120ms ease;
        }

        .calculator-hub-page .utility-directory-cards .proof-calculator[data-description]:hover::after,
        .calculator-hub-page .utility-directory-cards .proof-calculator[data-description]:focus-visible::after {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        /* The public calculator directory should not advertise VA Workspace. */
        .calculator-hub-page .workspace-showcase {
          display: none !important;
        }

        @media (max-width: 1100px) {
          .calculator-hub-page .utility-directory-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .calculator-hub-page .calculator-directory-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .calculator-hub-page .calculator-directory-brand img {
            width: 154px;
          }

          .calculator-hub-page .utility-hub-hero {
            width: min(100% - 24px, 680px);
          }

          .calculator-hub-page .dual-intent-copy {
            margin: 18px 0 12px;
          }

          .calculator-hub-page .dual-intent-copy h1 {
            font-size: clamp(2.7rem, 13vw, 4rem);
          }

          .calculator-hub-page .dual-intent-copy .friendly-subtitle {
            margin-top: 8px;
            font-size: 1rem;
          }

          .calculator-hub-page .utility-directory-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator {
            min-height: 88px !important;
            padding: 11px !important;
            gap: 9px;
            border-radius: 14px;
          }

          .calculator-hub-page .utility-directory-cards .intent-proof-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
            font-size: 1rem;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator h2 {
            font-size: 0.86rem;
            line-height: 1.16;
          }

          /* Touch: every calculator stays visible, and the explanation sits below the name. */
          .calculator-hub-page .dual-intent-proof.utility-directory-cards > a.intent-proof-card.proof-calculator {
            display: grid !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator,
          .calculator-hub-page .utility-directory-cards .proof-calculator[data-description] {
            display: grid !important;
            grid-template-columns: 36px minmax(0, 1fr);
            grid-template-rows: auto auto;
            column-gap: 10px;
            row-gap: 4px;
            align-items: start;
            position: relative !important;
            inset: auto !important;
            width: auto !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            visibility: visible !important;
            opacity: 1 !important;
            clip: auto !important;
            clip-path: none !important;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator .intent-proof-icon {
            grid-column: 1;
            grid-row: 1 / span 2;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator > div {
            grid-column: 2;
            grid-row: 1;
            min-width: 0;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator[data-description]::after {
            display: none !important;
            content: none !important;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator h2 {
            color: #163a5f;
            font-weight: 800;
          }

          .calculator-hub-page .utility-directory-cards .calculator-card-description {
            display: block;
            grid-column: 2;
            grid-row: 2;
            margin: 0;
            color: #6f8192;
            font-size: 0.74rem;
            font-weight: 650;
            line-height: 1.32;
            text-transform: none;
            letter-spacing: 0;
          }
        }

        @media (max-width: 430px) {
          .calculator-hub-page .utility-directory-cards {
            grid-template-columns: 1fr !important;
          }

          .calculator-hub-page .utility-directory-cards .proof-calculator {
            min-height: 82px !important;
          }
        }
      `}</style>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}


function BusinessDaysPage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const [startDate, setStartDate] = useState(() => getInitialDateQueryParam('start', todayInputValue()))
  const [businessDays, setBusinessDays] = useState(() =>
    getInitialPositiveIntegerQueryParam('days', '3', getAmountLimit('business')),
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  const [title, setTitle] = useState(getDefaultTitle('business'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedStartDate = parsePlainDate(startDate)
  const parsedBusinessDays = parseInteger(businessDays)
  const validationMessage = getBusinessDaysValidationMessage(parsedStartDate, parsedBusinessDays, title)
  const businessCalculation =
    parsedStartDate && parsedBusinessDays !== null && !validationMessage
      ? calculateBusinessDaysWithCalendar(parsedStartDate, parsedBusinessDays, holidayCalendar)
      : null
  const dueDate = businessCalculation?.date ?? null
  const canSave = Boolean(dueDate && title.trim() && !validationMessage)

  const formatBusinessAnswerDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  useEffect(() => {
    syncShareableQueryParams({
      start: startDate,
      days: businessDays,
      calendar: holidayCalendarQueryValue(holidayCalendar),
    })
  }, [startDate, businessDays, holidayCalendar])

  function saveBusinessDeadline() {
    if (!dueDate || !parsedStartDate || !title.trim()) {
      return
    }

    const nextDeadline: SavedDeadline = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: 'business',
      dueDate: toDateKey(dueDate),
      startDate: toDateKey(parsedStartDate),
      done: false,
      createdAt: new Date().toISOString(),
    }

    if (isDuplicateSavedDeadline(savedDeadlines, nextDeadline)) {
      setStorageMessage('This due date is already saved.')
      return
    }

    const nextDeadlines = [nextDeadline, ...savedDeadlines]
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage('Saved to My due dates.')
  }

  return (
    <main className="page-shell business-page business-answer-first-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="business-answer-shell" aria-labelledby="business-days-title">
        <div className="business-answer-hero">
          <p className="business-answer-eyebrow">Business days calculator</p>

          {dueDate && parsedStartDate && parsedBusinessDays !== null ? (
            <>
              <h1 id="business-days-title">
                {parsedBusinessDays} {parsedBusinessDays === 1 ? 'business day' : 'business days'} from{' '}
                {toDateKey(parsedStartDate) === toDateKey(today) ? 'today' : formatBusinessAnswerDate(parsedStartDate)} is
              </h1>

              <strong
                className="business-answer-date"
                aria-label={`${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}`}
              >
                <span className="business-answer-weekday">
                  {formatWeekday(dueDate)},
                </span>
                <span className="business-answer-date-main" aria-hidden="true">
                  <span className="business-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][dueDate.month - 1]
                    }
                  </span>
                  <span className="business-answer-day">{dueDate.day}</span>
                  <span className="business-answer-comma">,</span>
                  <span className="business-answer-year">{dueDate.year}</span>
                </span>
              </strong>

              <p className="business-answer-rule">
                {holidayCalendar === 'none'
                  ? 'Weekends skipped · Public holidays still count'
                  : `Weekends + ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped`}
              </p>
            </>
          ) : (
            <>
              <h1 id="business-days-title">When is it in business days?</h1>
              <p className="business-answer-rule">
                Enter a valid start date and number of business days below.
              </p>
            </>
          )}
        </div>

        <form
          className="business-answer-controls"
          id="custom-business-days"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="business-answer-field business-answer-start">
            <span>Start date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'business_days',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <label className="business-answer-field business-answer-days">
            <span>Business days</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="2600"
              value={businessDays}
              onChange={(event) => {
                setBusinessDays(event.target.value)
                trackWhenIsDueEvent('number_changed', {
                  context: 'business_days',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <div className="business-answer-picks" aria-label="Common business day counts">
            {[3, 5, 7, 10].map((quickPick) => (
              <button
                className={businessDays === String(quickPick) ? 'is-selected' : ''}
                key={quickPick}
                type="button"
                aria-pressed={businessDays === String(quickPick)}
                onClick={() => {
                  setBusinessDays(String(quickPick))
                  trackWhenIsDueEvent('quick_pick', {
                    context: 'business_days',
                    value: quickPick,
                  })
                }}
              >
                {quickPick} days
              </button>
            ))}
          </div>

          <p
            className={`business-answer-form-message ${
              validationMessage ? 'is-visible' : 'is-reserved'
            }`}
            aria-live="polite"
          >
            {validationMessage ?? ' '}
          </p>
        </form>
      </section>

      {dueDate && parsedBusinessDays !== null && parsedStartDate ? (
        <section className="business-answer-actions" aria-label="Business day result actions">
          <ResultActions
            title={`${parsedBusinessDays} business days from ${toDateKey(parsedStartDate) === toDateKey(today) ? 'today' : formatPlainDate(parsedStartDate)}`}
            date={dueDate}
            details={`${formatWeekday(dueDate)} · ${holidayCalendar === 'none' ? 'weekends skipped' : `${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped`}`}
            variant="return-window"
          />
        </section>
      ) : null}

      <section className="business-answer-details" aria-label="Business day calculation details">
        <details>
          <summary>Why this date?</summary>
          {parsedStartDate && businessCalculation && dueDate && parsedBusinessDays !== null ? (
            <div className="business-answer-detail-body">
              <p>
                {formatBusinessDayExplanation(
                  parsedStartDate,
                  parsedBusinessDays,
                  dueDate,
                  holidayCalendar,
                )}
              </p>
              <CalculationReceipt
                analyticsContext="business_days"
                rows={[
                  {
                    label: 'Start date',
                    value: `${formatWeekday(parsedStartDate)}, ${formatPlainDate(parsedStartDate)}`,
                  },
                  {
                    label: 'Business days added',
                    value: String(parsedBusinessDays),
                  },
                  {
                    label: 'Holiday calendar',
                    value: getHolidayCalendarOption(holidayCalendar).label,
                  },
                  {
                    label: 'Skipped holidays',
                    value: formatSkippedHolidaySummary(businessCalculation.skippedHolidays),
                  },
                  {
                    label: 'Result',
                    value: `${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}`,
                  },
                ]}
              />
            </div>
          ) : (
            <p>Enter a valid start date and number of business days.</p>
          )}
        </details>

        <details>
          <summary>Holiday settings</summary>
          <div className="business-answer-detail-body">
            <HolidayCalendarSelect
              value={holidayCalendar}
              onChange={(nextCalendar) => {
                setHolidayCalendar(nextCalendar)
                trackWhenIsDueEvent('holiday_calendar_changed', {
                  context: 'business_days',
                  value: nextCalendar,
                })
              }}
              compact
            />
            <p className="business-answer-holiday-note">
              {holidayCalendar === 'none'
                ? 'Weekends are skipped. Public holidays still count as weekdays.'
                : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays are skipped.`}
            </p>
          </div>
        </details>

        <details>
          <summary>Save this date</summary>
          <div className="business-answer-save">
            <label className="field title-field">
              <span>Title</span>
              <input
                maxLength={titleMaxLength}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <button
              className="primary-button"
              type="button"
              disabled={!canSave}
              onClick={saveBusinessDeadline}
            >
              Save to My due dates
            </button>
            {storageMessage ? <p className="form-message">{storageMessage}</p> : null}
          </div>
        </details>
      </section>

      <section className="business-answer-quick" aria-labelledby="business-answer-quick-title">
        <div className="business-answer-quick-heading">
          <p>Quick answers</p>
          <h2 id="business-answer-quick-title">Common business-day counts from today</h2>
        </div>
        <div className="business-answer-quick-grid">
          {[3, 5, 7, 10].map((dayCount) => {
            const answerDate = calculateBusinessDaysWithCalendar(today, dayCount, holidayCalendar).date
            const exactPath = `/${dayCount}-business-days-from-today`
            const calendarQuery = holidayCalendarQueryValue(holidayCalendar)
            const exactHref = calendarQuery ? `${exactPath}?calendar=${calendarQuery}` : exactPath

            return (
              <a
                key={dayCount}
                href={exactHref}
                onClick={(event) => {
                  event.preventDefault()
                  trackWhenIsDueEvent('related_bam_click', {
                    context: 'business_days_calculator',
                    day_count: dayCount,
                  })
                  onNavigate(exactHref)
                }}
              >
                <span>{dayCount} business days</span>
                <strong>{formatPlainDate(answerDate)}</strong>
                <small>{formatWeekday(answerDate)}</small>
                <b aria-hidden="true">→</b>
              </a>
            )
          })}
        </div>
      </section>

      <section className="business-content business-editorial-content" aria-label="Business days help">
        <div className="business-content-heading">
          <p className="business-section-eyebrow">Business-day rules</p>
          <h2>What counts — and what gets skipped</h2>
        </div>

        <article>
          <h2>How long is 3 business days?</h2>
          <p>
            Three business days means three Monday-through-Friday working days. Weekends do not count, so 3 business days can span more than 3 calendar days when a weekend falls in between.
          </p>
        </article>

        <article>
          <h2>How long is 5 business days?</h2>
          <p>
            Five business days means five Monday-through-Friday working days. If you start on a Monday, 5 business days later is the following Monday because the starting date is treated as day zero and the weekend is skipped.
          </p>
        </article>

        <article>
          <h2>How business days are counted</h2>
          <p>
            This calculator counts Monday through Friday. Saturdays and Sundays are skipped. The starting date is treated as day zero, so adding 1 business day moves to the next weekday.
          </p>
          <p>
            By default, public holidays still count as weekdays. You can optionally choose a supported holiday calendar above. Local, provincial, state, proclamation-based, and company-specific closures can still differ, so check the original terms when a deadline matters.
          </p>
        </article>

        <article>
          <h2>Business day examples</h2>
          <ul>
            <li>Start Friday + 1 business day = Monday</li>
            <li>Start Thursday + 2 business days = Monday</li>
            <li>Start Monday + 3 business days = Thursday</li>
            <li>Start Monday + 5 business days = next Monday</li>
            <li>Start Monday + 10 business days = Monday two weeks later</li>
          </ul>
        </article>

        <article>
          <h2>Business days FAQ</h2>
          <dl>
            <dt>What is 3 business days?</dt>
            <dd>It means three weekdays, usually Monday through Friday. Saturdays and Sundays are not counted by this calculator.</dd>

            <dt>What counts as a business day?</dt>
            <dd>In this calculator, Monday through Friday count as business days. Saturdays and Sundays are skipped.</dd>

            <dt>Does today count as business day one?</dt>
            <dd>No. When you add business days here, the start date is day zero. One business day from today means the next weekday.</dd>

            <dt>Are public holidays removed?</dt>
            <dd>Not by default. Choose a supported public-holiday calendar to skip known holidays as well as weekends.</dd>

            <dt>Why does one business day after Friday land on Monday?</dt>
            <dd>Saturday and Sunday are skipped, so Monday is the next business day.</dd>

            <dt>What is the difference between business days and calendar days?</dt>
            <dd>Calendar days count every day. Business days in this calculator count Monday through Friday and skip weekends.</dd>
          </dl>
        </article>

        <article>
          <h2>When to use this calculator</h2>
          <p>
            Use it when a deadline is measured in business days instead of calendar days. Common examples include work tasks, invoice follow-ups, shipping estimates, application timelines, school forms, and administrative deadlines.
          </p>
        </article>

        <article>
          <h2>Business days vs calendar days</h2>
          <p>
            Calendar days include every day of the week. Business days usually mean Monday through Friday, so a deadline that is 7 or 10 business days away will often be farther away on the calendar because weekends are skipped.
          </p>
        </article>

        <article>
          <h2>Does the start date count?</h2>
          <p>
            That depends on the wording of the rule. See the{' '}
            <a
              href="/does-the-start-date-count"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/does-the-start-date-count')
              }}
            >
              start-date counting guide
            </a>{' '}
            to compare day-zero and day-one interpretations.
          </p>
        </article>

        <article>
          <h2>Do weekends count as business days?</h2>
          <p>
            Under the standard Monday–Friday rule, no. See the{' '}
            <a
              href="/do-weekends-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-weekends-count-as-business-days')
              }}
            >
              weekends and business days guide
            </a>{' '}
            for examples and the difference between weekends and public holidays.
          </p>
        </article>

        <article>
          <h2>Do public holidays count as business days?</h2>
          <p>
            It depends on the rule and holiday calendar being used. See the{' '}
            <a
              href="/do-public-holidays-count-as-business-days"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/do-public-holidays-count-as-business-days')
              }}
            >
              public holidays and business days guide
            </a>{' '}
            for a worked example showing how one holiday can change the due date.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always check the original terms or official calendar when a deadline matters."
      />

      <style>{`
        .business-answer-first-page {
          --business-paper: #e8f0f4;
          --business-paper-soft: #f2f6f8;
          --business-navy: #12365d;
          --business-muted: #637b92;
          --business-green: #23785d;
          min-height: 100vh;
          background: #fffaf2;
        }

        .business-answer-header {
          width: min(100% - 32px, 1130px);
          margin: 0 auto;
          padding: 26px 0 18px;
          border-bottom: 1px solid rgba(18, 54, 93, 0.12);
        }

        .business-answer-brand {
          display: inline-flex;
          width: min(190px, 46vw);
        }

        .business-answer-brand img {
          display: block;
          width: 100%;
          height: auto;
        }

        .business-answer-shell,
        .business-answer-live-result,
        .business-answer-quick {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .business-answer-shell {
          margin-top: 22px;
          overflow: hidden;
          border: 1px solid rgba(18, 54, 93, 0.1);
          border-radius: 28px;
          background: var(--business-paper);
        }

        .business-answer-hero {
          min-height: 438px;
          box-sizing: border-box;
          padding: clamp(34px, 5vw, 68px) clamp(32px, 5vw, 68px) clamp(28px, 4vw, 48px);
        }

        .business-answer-eyebrow,
        .business-answer-quick-heading p,
        .business-content-heading .business-section-eyebrow,
        .business-answer-live-label {
          margin: 0;
          color: var(--business-green);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.17em;
          text-transform: uppercase;
        }

        .business-answer-hero h1 {
          max-width: 900px;
          margin: 14px 0 0;
          color: var(--business-navy);
          font-size: clamp(2rem, 4.4vw, 4.4rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .business-answer-date {
          display: grid;
          justify-items: start;
          margin: 22px 0 0;
          color: var(--business-navy);
          font-weight: 900;
        }

        .business-answer-weekday {
          color: #3e667d;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .business-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          gap: 0.09em;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .business-answer-month,
        .business-answer-day,
        .business-answer-comma,
        .business-answer-year {
          display: inline;
        }

        .business-answer-comma {
          margin-left: -0.08em;
        }

        .business-answer-rule {
          margin: 24px 0 0;
          color: var(--business-muted);
          font-size: clamp(0.98rem, 1.25vw, 1.12rem);
          font-weight: 700;
        }

        .business-answer-controls {
          display: grid;
          grid-template-columns: minmax(240px, 1.2fr) minmax(150px, 0.7fr) auto;
          align-items: end;
          gap: 14px;
          padding: 18px clamp(24px, 5vw, 68px);
          border-top: 1px solid rgba(18, 54, 93, 0.08);
          background: rgba(255, 255, 255, 0.32);
        }

        .business-answer-field {
          display: grid;
          gap: 7px;
        }

        .business-answer-field > span {
          color: #4e6780;
          font-size: 0.82rem;
          font-weight: 850;
        }

        .business-answer-field input {
          width: 100%;
          min-height: 50px;
          box-sizing: border-box;
          padding: 0 14px;
          border: 1px solid rgba(18, 54, 93, 0.16);
          border-radius: 12px;
          background: #fff;
          color: #173451;
          font: inherit;
          font-size: 1rem;
        }

        .business-answer-picks {
          display: flex;
          gap: 8px;
        }

        .business-answer-picks button {
          min-height: 50px;
          padding: 0 14px;
          border: 1px solid rgba(18, 54, 93, 0.14);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          color: #49637e;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 850;
          cursor: pointer;
        }

        .business-answer-picks button.is-selected {
          border-color: rgba(35, 120, 93, 0.6);
          background: #e4f1eb;
          color: #1e6b54;
        }

        .business-answer-counting-status {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          padding-top: 2px;
          color: var(--business-muted);
          font-size: 0.88rem;
        }

        .business-answer-counting-status span {
          font-weight: 700;
        }

        .business-answer-counting-status strong {
          color: #34536e;
        }

        .business-answer-controls .holiday-calendar-select {
          grid-column: 1 / -1;
          max-width: 520px;
        }

        .business-answer-form-message {
          grid-column: 1 / -1;
          min-height: 1.25em;
          margin: 0;
          color: #9c4e35;
          font-weight: 700;
        }

        .business-answer-form-message.is-reserved {
          visibility: hidden;
        }

        .business-answer-live-result {
          margin-top: 18px;
          padding: clamp(28px, 4vw, 48px);
          box-sizing: border-box;
          border-radius: 24px;
          background: var(--business-navy);
          color: #fffaf2;
        }

        .business-answer-live-label {
          color: #a8cfb5;
        }

        .business-answer-live-sentence {
          margin: 12px 0 0;
          color: rgba(255, 250, 242, 0.78);
          font-size: clamp(1rem, 1.5vw, 1.28rem);
          font-weight: 650;
        }

        .business-answer-live-date {
          display: flex;
          flex-wrap: wrap;
          gap: 0 0.18em;
          margin: 10px 0 0;
          color: #fff7ea;
          font-size: clamp(3rem, 6.5vw, 6.8rem);
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -0.06em;
        }

        .business-answer-live-date strong,
        .business-answer-live-date span {
          font: inherit;
        }

        .business-answer-live-note {
          margin: 18px 0 0;
          color: rgba(255, 250, 242, 0.72);
          font-size: 0.95rem;
        }

        .business-answer-actions {
          width: min(100% - 32px, 720px);
          margin: 16px auto 0;
        }

        .business-answer-details {
          width: min(100% - 32px, 910px);
          margin: 28px auto 0;
          border-top: 1px solid rgba(18, 54, 93, 0.1);
        }

        .business-answer-details details {
          border-bottom: 1px solid rgba(18, 54, 93, 0.1);
        }

        .business-answer-details summary {
          padding: 18px 0;
          cursor: pointer;
          color: #284b6a;
          font-weight: 850;
        }

        .business-answer-detail-body,
        .business-answer-save {
          padding: 0 0 20px;
        }

        .business-answer-detail-body > p {
          margin-top: 0;
          color: var(--business-muted);
          line-height: 1.6;
        }

        .business-answer-holiday-note {
          margin: 10px 0 0;
          color: var(--business-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .business-answer-save {
          display: grid;
          gap: 12px;
          max-width: 520px;
        }

        .business-answer-quick {
          margin-top: 42px;
          padding: clamp(26px, 4vw, 42px);
          box-sizing: border-box;
          border: 1px solid rgba(18, 54, 93, 0.09);
          border-radius: 24px;
          background: #eef5f7;
        }

        .business-answer-quick-heading h2 {
          margin: 8px 0 0;
          color: var(--business-navy);
          font-size: clamp(1.9rem, 3.4vw, 3.4rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .business-answer-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .business-answer-quick-grid a {
          position: relative;
          display: flex;
          min-height: 128px;
          flex-direction: column;
          justify-content: center;
          padding: 18px;
          border: 1px solid rgba(18, 54, 93, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.86);
          color: var(--business-navy);
          text-decoration: none;
        }

        .business-answer-quick-grid span {
          color: #58718a;
          font-size: 0.82rem;
          font-weight: 850;
        }

        .business-answer-quick-grid strong {
          margin-top: 7px;
          font-size: clamp(1.45rem, 2.3vw, 2.35rem);
          line-height: 1;
        }

        .business-answer-quick-grid small {
          margin-top: 6px;
          color: #6f8192;
          font-size: 0.85rem;
        }

        .business-answer-quick-grid b {
          position: absolute;
          right: 16px;
          bottom: 14px;
          color: var(--business-green);
          font-size: 1.3rem;
        }

        .business-editorial-content {
          width: min(100% - 32px, 1130px);
          margin: 48px auto 0;
        }

        .business-content-heading {
          margin-bottom: 18px;
        }

        .business-content-heading h2 {
          margin: 8px 0 0;
          color: var(--business-navy);
          font-size: clamp(2rem, 4vw, 4rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        @media (max-width: 760px) {
          .business-answer-header {
            width: calc(100% - 40px);
            padding: 20px 0 14px;
          }

          .business-answer-brand {
            width: 176px;
            max-width: 58vw;
          }

          .business-answer-shell,
          .business-answer-live-result,
          .business-answer-quick {
            width: calc(100% - 40px);
          }

          .business-answer-shell {
            margin-top: 12px;
            border-radius: 24px;
          }

          .business-answer-hero {
            min-width: 0;
            min-height: 388px;
            overflow: hidden;
            padding: 22px 20px 18px;
          }

          .business-answer-hero h1 {
            max-width: 100%;
            margin-top: 8px;
            font-size: clamp(1.7rem, 7.8vw, 2.45rem);
            line-height: 0.99;
            overflow-wrap: anywhere;
          }

          .business-answer-date {
            display: grid;
            justify-items: start;
            max-width: 100%;
            margin-top: 15px;
          }

          .business-answer-weekday {
            display: block;
            max-width: 100%;
            font-size: clamp(1.95rem, 8.7vw, 2.7rem);
            line-height: 0.98;
          }

          .business-answer-date-main {
            display: grid;
            justify-items: start;
            max-width: 100%;
            gap: 0;
            margin-top: 4px;
            font-size: clamp(2.55rem, 11.7vw, 3.8rem);
            line-height: 0.9;
            letter-spacing: -0.052em;
            white-space: normal;
          }

          .business-answer-month,
          .business-answer-day,
          .business-answer-year {
            display: block;
            max-width: 100%;
          }

          .business-answer-comma {
            display: none;
          }

          .business-answer-rule {
            margin-top: 15px;
            font-size: 0.86rem;
            line-height: 1.35;
          }

          .business-answer-controls {
            grid-template-columns: 1fr 0.48fr;
            gap: 10px;
            padding: 16px 20px 18px;
          }

          .business-answer-start {
            grid-column: 1 / -1;
          }

          .business-answer-days {
            grid-column: 1;
          }

          .business-answer-field input {
            min-height: 48px;
          }

          .business-answer-picks {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 7px;
          }

          .business-answer-picks button {
            min-height: 44px;
            padding: 0 6px;
            font-size: 0.78rem;
          }

          .business-answer-counting-status {
            grid-column: 1 / -1;
            align-items: flex-start;
            flex-direction: column;
            gap: 3px;
            padding-top: 3px;
          }

          .business-answer-live-result {
            margin-top: 14px;
            padding: 28px 24px;
            border-radius: 22px;
          }

          .business-answer-live-date {
            display: block;
            font-size: clamp(3rem, 14.5vw, 5rem);
          }

          .business-answer-live-date strong,
          .business-answer-live-date span {
            display: block;
          }

          .business-answer-live-date span {
            margin-top: 4px;
          }

          .business-answer-actions {
            width: calc(100% - 40px);
          }

          .business-answer-details {
            width: calc(100% - 40px);
            margin-top: 20px;
          }

          .business-answer-quick {
            margin-top: 30px;
            padding: 24px 20px;
            border-radius: 22px;
          }

          .business-answer-quick-heading h2 {
            font-size: 2.2rem;
          }

          .business-answer-quick-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 18px;
          }

          .business-answer-quick-grid a {
            min-height: 112px;
            padding: 14px;
          }

          .business-answer-quick-grid strong {
            font-size: 1.55rem;
          }

          .business-editorial-content {
            width: calc(100% - 40px);
            margin-top: 34px;
          }

          .business-content-heading h2 {
            font-size: 2.5rem;
          }

          .business-editorial-content article {
            padding: 24px 4px;
            border-bottom: 1px solid rgba(18, 54, 93, 0.1);
          }

          .business-editorial-content article h2 {
            font-size: 1.45rem;
          }

          .business-editorial-content article p,
          .business-editorial-content article li,
          .business-editorial-content article dd {
            font-size: 1.04rem;
            line-height: 1.6;
          }
        }
      `}</style>
    </main>
  )
}


function BusinessDaysFromTodayPage({ dayCount, onNavigate }: BusinessDaysFromTodayPageProps) {
  const currentTime = useCurrentMinute()
  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  const answerCalculation = useMemo(
    () => calculateBusinessDaysWithCalendar(today, dayCount, holidayCalendar),
    [today, dayCount, holidayCalendar],
  )
  const answerDate = answerCalculation.date

  useEffect(() => {
    syncShareableQueryParams({
      calendar: holidayCalendarQueryValue(holidayCalendar),
    })
  }, [holidayCalendar])

  const relatedDayCounts = useMemo(() => {
    const primaryCounts = [3, 5, 7, 10]
    const extendedCounts = [4, 8, 20, 30]
    const orderedCounts = primaryCounts.includes(dayCount)
      ? [...primaryCounts, ...extendedCounts]
      : [dayCount, ...primaryCounts, ...extendedCounts]

    return orderedCounts
      .filter(
        (value, index, values) =>
          value !== dayCount && values.indexOf(value) === index,
      )
      .slice(0, 4)
  }, [dayCount])

  const relatedAnswers = useMemo(
    () =>
      relatedDayCounts.map((relatedDayCount) => ({
        dayCount: relatedDayCount,
        date: calculateBusinessDaysWithCalendar(
          today,
          relatedDayCount,
          holidayCalendar,
        ).date,
      })),
    [relatedDayCounts, today, holidayCalendar],
  )

  const monthName = (date: PlainDate) =>
    [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]

  return (
    <main className="page-shell exact-business-page">
      <header className="exact-business-header" aria-label="WhenIsDue navigation">
        <a
          className="exact-business-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>
      </header>

      <section className="exact-business-shell" aria-labelledby="business-days-from-today-title">
        <div className="exact-business-hero">
          <p className="exact-business-eyebrow">
            {dayCount} business days from today
          </p>

          <h1 id="business-days-from-today-title">
            {dayCount} {dayCount === 1 ? 'business day' : 'business days'} from today is
          </h1>

          <strong
            className="exact-business-date"
            aria-label={`${formatWeekday(answerDate)}, ${formatPlainDate(answerDate)}`}
          >
            <span className="exact-business-weekday">
              {formatWeekday(answerDate)},
            </span>

            <span className="exact-business-date-main" aria-hidden="true">
              <span className="exact-business-month">{monthName(answerDate)}</span>
              <span className="exact-business-day">{answerDate.day}</span>
              <span className="exact-business-comma">,</span>
              <span className="exact-business-year">{answerDate.year}</span>
            </span>
          </strong>

          <p className="exact-business-context">
            Today is {formatWeekday(today)}, {monthName(today)} {today.day}, {today.year}
          </p>

          <p className="exact-business-rule">
            {holidayCalendar === 'none'
              ? 'Weekends skipped · Public holidays still count'
              : `Weekends + ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped`}
          </p>
        </div>

        <div className="exact-business-actions">
          <ResultActions
            title={`${dayCount} business days from today`}
            date={answerDate}
            details={
              holidayCalendar === 'none'
                ? 'Weekends skipped'
                : `${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped`
            }
            variant="return-window"
          />
        </div>
      </section>

      <section className="exact-business-options">
        <details className="exact-business-details">
          <summary>Holiday settings</summary>
          <div className="exact-business-detail-body">
            <HolidayCalendarSelect
              value={holidayCalendar}
              onChange={(nextCalendar) => {
                setHolidayCalendar(nextCalendar)
                trackWhenIsDueEvent('holiday_calendar_changed', {
                  context: 'business_days_from_today',
                  days: dayCount,
                  value: nextCalendar,
                })
              }}
              compact
            />
          </div>
        </details>

        <details className="exact-business-details">
          <summary>Why this date?</summary>
          <div className="exact-business-detail-body">
            <p>
              {formatBusinessDayExplanation(
                today,
                dayCount,
                answerDate,
                holidayCalendar,
              )}
            </p>

            <CalculationReceipt
              analyticsContext="business_days_from_today"
              rows={[
                {
                  label: 'Today',
                  value: `${formatWeekday(today)}, ${formatPlainDate(today)}`,
                },
                {
                  label: 'Business days added',
                  value: String(dayCount),
                },
                {
                  label: 'Holiday calendar',
                  value: getHolidayCalendarOption(holidayCalendar).label,
                },
                {
                  label: 'Skipped holidays',
                  value: formatSkippedHolidaySummary(
                    answerCalculation.skippedHolidays,
                  ),
                },
                {
                  label: 'Result',
                  value: `${formatWeekday(answerDate)}, ${formatPlainDate(answerDate)}`,
                },
              ]}
            />
          </div>
        </details>
      </section>

      <section className="exact-business-related" aria-labelledby="exact-business-related-title">
        <div>
          <p className="exact-business-section-eyebrow">Other common answers</p>
          <h2 id="exact-business-related-title">Need a different number?</h2>
        </div>

        <div className="exact-business-related-grid">
          {relatedAnswers.map(({ dayCount: relatedDayCount, date }) => (
            <button
              type="button"
              className="exact-business-related-card"
              key={relatedDayCount}
              onClick={() =>
                onNavigate(
                  `/${relatedDayCount}-business-days-from-today${
                    holidayCalendar === 'none'
                      ? ''
                      : `?calendar=${holidayCalendar}`
                  }`,
                )
              }
            >
              <span>{relatedDayCount} business days</span>
              <strong>
                {monthName(date)} {date.day}
              </strong>
              <small>{formatWeekday(date)}</small>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="exact-business-custom-button"
          onClick={() =>
            onNavigate(
              `/business-days-calculator${
                holidayCalendar === 'none'
                  ? ''
                  : `?calendar=${holidayCalendar}`
              }`,
            )
          }
        >
          Choose another date or number
        </button>
      </section>

      <section className="exact-business-content" aria-label="Business-day counting help">
        <article>
          <h2>How this date is calculated</h2>
          <p>
            Monday through Friday count as business days. Saturdays and Sundays
            are skipped. Public holidays count by default unless you choose a
            supported holiday calendar.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Check the original terms or official calendar when a deadline matters."
      />

      <style>{`
        .exact-business-page {
          --exact-ink: #153654;
          --exact-muted: #667b8e;
          --exact-accent: #2d7b64;
          --exact-field: #e4eef4;
          min-height: 100vh;
          background: #fffaf2;
        }

        .exact-business-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .exact-business-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .exact-business-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .exact-business-shell,
        .exact-business-options,
        .exact-business-related,
        .exact-business-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .exact-business-shell {
          margin-top: 22px;
        }

        .exact-business-hero {
          padding: clamp(34px, 4.8vw, 52px) clamp(24px, 5vw, 58px) 30px;
          border: 1px solid rgba(46, 87, 110, 0.12);
          border-radius: 28px;
          background: var(--exact-field);
          text-align: center;
        }

        .exact-business-eyebrow,
        .exact-business-section-eyebrow {
          margin: 0;
          color: var(--exact-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .exact-business-hero h1 {
          margin: 10px 0 0;
          color: var(--exact-ink);
          font-size: clamp(2.7rem, 5.5vw, 4.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .exact-business-date {
          display: grid;
          justify-items: center;
          margin-top: 24px;
          color: var(--exact-ink);
          font-weight: 900;
        }

        .exact-business-weekday {
          color: #3e667d;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .exact-business-date-main {
          display: inline-flex;
          align-items: baseline;
          gap: 0.09em;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .exact-business-comma {
          margin-left: -0.08em;
        }

        .exact-business-context {
          margin: 17px 0 0;
          color: var(--exact-muted);
          font-size: 0.94rem;
        }

        .exact-business-rule {
          margin: 7px 0 0;
          color: #748596;
          font-size: 0.84rem;
          font-weight: 750;
        }

        .exact-business-actions {
          margin-top: 10px;
        }

        .exact-business-actions > .result-actions {
          justify-content: center;
        }

        .exact-business-options {
          margin-top: 12px;
        }

        .exact-business-details {
          margin-top: 10px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .exact-business-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .exact-business-detail-body {
          padding: 0 14px 16px;
        }

        .exact-business-detail-body > p {
          margin: 0;
          color: #61768a;
          line-height: 1.58;
        }

        .exact-business-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .exact-business-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #edf3f6;
        }

        .exact-business-related h2 {
          margin: 6px 0 0;
          color: var(--exact-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .exact-business-related-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .exact-business-related-card,
        .exact-business-custom-button {
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font: inherit;
          cursor: pointer;
        }

        .exact-business-related-card {
          min-height: 86px;
          display: grid;
          align-content: center;
          gap: 3px;
          padding: 10px 12px;
          text-align: left;
        }

        .exact-business-related-card span {
          font-size: 0.8rem;
          font-weight: 800;
        }

        .exact-business-related-card strong {
          color: var(--exact-ink);
          font-size: 1.2rem;
        }

        .exact-business-related-card small {
          color: #718396;
        }

        .exact-business-custom-button {
          min-height: 48px;
          margin-top: 10px;
          padding: 10px 14px;
          font-weight: 850;
        }

        .exact-business-content {
          margin-top: 30px;
        }

        .exact-business-content article {
          padding: 20px 0;
          border-top: 1px solid rgba(21, 54, 84, 0.1);
        }

        .exact-business-content h2 {
          margin: 0;
          color: var(--exact-ink);
          font-size: 1.08rem;
        }

        .exact-business-content p {
          max-width: 760px;
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .exact-business-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .exact-business-brand img {
            width: 154px;
          }

          .exact-business-shell,
          .exact-business-options,
          .exact-business-related,
          .exact-business-content {
            width: min(100% - 24px, 680px);
          }

          .exact-business-shell {
            margin-top: 12px;
          }

          .exact-business-hero {
            padding: 22px 20px 18px;
            border-radius: 24px;
            text-align: left;
          }

          .exact-business-hero h1 {
            margin-top: 8px;
            font-size: clamp(2rem, 8.8vw, 2.85rem);
            line-height: 1;
          }

          .exact-business-date {
            justify-items: start;
            margin-top: 16px;
          }

          .exact-business-weekday {
            font-size: clamp(2rem, 8.8vw, 2.75rem);
          }

          .exact-business-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            margin-top: 4px;
            font-size: clamp(2.7rem, 12.4vw, 4rem);
            line-height: 0.9;
            white-space: normal;
          }

          .exact-business-month,
          .exact-business-day,
          .exact-business-year {
            display: block;
          }

          .exact-business-comma {
            display: none;
          }

          .exact-business-context {
            margin-top: 14px;
            font-size: 0.87rem;
          }

          .exact-business-rule {
            margin-top: 6px;
            font-size: 0.78rem;
            line-height: 1.4;
          }

          .exact-business-actions {
            margin-top: 8px;
          }

          .exact-business-related {
            padding: 18px;
          }

          .exact-business-related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .exact-business-related-card {
            min-height: 76px;
          }

          .exact-business-content {
            margin-top: 24px;
          }
        }
      `}</style>
    </main>
  )
}

type ResultActionsProps = {
  title: string
  date: PlainDate
  details?: string
  time?: string
  variant?: 'default' | 'return-window'
}

function ResultActions({
  title,
  date,
  details,
  time,
  variant = 'default',
}: ResultActionsProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(() =>
    isFavoriteCalculation(
      title,
      `${window.location.pathname}${window.location.search}`,
    ),
  )
  const dateText = formatPlainDate(date)
  const shareText = `${title}: ${dateText}${details ? ` — ${details}` : ''}`

  useEffect(() => {
    const refreshFavoriteState = () => {
      setIsFavorite(
        isFavoriteCalculation(
          title,
          `${window.location.pathname}${window.location.search}`,
        ),
      )
    }

    window.addEventListener(SAVED_CALCULATIONS_EVENT, refreshFavoriteState)
    return () => {
      window.removeEventListener(SAVED_CALCULATIONS_EVENT, refreshFavoriteState)
    }
  }, [title])

  useEffect(() => {
    if (
      message !== 'Copied.' &&
      message !== 'Link copied.' &&
      message !== 'Shared.' &&
      message !== 'Calendar file created.'
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [message])

  async function copyExactLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage('Link copied.')
      recordRecentCalculation(title, date, details)
      trackWhenIsDueEvent('copy_exact_link', {
        title,
        result_date: toDateKey(date),
        status: 'success',
      })
    } catch {
      setMessage('Link copy is not available in this browser.')
      trackWhenIsDueEvent('copy_exact_link', {
        title,
        result_date: toDateKey(date),
        status: 'failed',
      })
    }
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(shareText)
      setMessage('Copied.')
      recordRecentCalculation(title, date, details)
      trackWhenIsDueEvent('copy_result', { title, result_date: toDateKey(date), status: 'success' })
    } catch {
      setMessage('Copy is not available in this browser.')
      trackWhenIsDueEvent('copy_result', { title, result_date: toDateKey(date), status: 'failed' })
    }
  }

  async function shareAnswer() {
    if (!navigator.share) {
      await copyAnswer()
      return
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        url: window.location.href,
      })
      setMessage('Shared.')
      recordRecentCalculation(title, date, details)
      trackWhenIsDueEvent('share_result', { title, result_date: toDateKey(date), status: 'success' })
    } catch {
      setMessage('Share cancelled or unavailable.')
      trackWhenIsDueEvent('share_result', { title, result_date: toDateKey(date), status: 'cancelled_or_failed' })
    }
  }

  function addToCalendar() {
    const dateKey = toDateKey(date).replaceAll('-', '')
    const nextDateKey = toDateKey(addCalendarDays(date, 1)).replaceAll('-', '')
    const validTime = time && timeToMinutes(time) !== null ? time : null
    const timedStart = validTime
      ? `${dateKey}T${validTime.replace(':', '')}00`
      : null
    const escapeIcs = (value: string) =>
      value
        .replaceAll('\\', '\\\\')
        .replaceAll(',', '\\,')
        .replaceAll(';', '\\;')
        .replaceAll('\n', '\\n')

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WhenIsDue//Date Reminder//EN',
      'BEGIN:VEVENT',
      `UID:${crypto.randomUUID()}@whenisdue.com`,
      timedStart
        ? `DTSTART:${timedStart}`
        : `DTSTART;VALUE=DATE:${dateKey}`,
      timedStart ? '' : `DTEND;VALUE=DATE:${nextDateKey}`,
      `SUMMARY:${escapeIcs(title)}`,
      details ? `DESCRIPTION:${escapeIcs(details)}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = time ? 'whenisdue-deadline.ics' : 'whenisdue-date.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage('Calendar file created.')
    recordRecentCalculation(title, date, details)
    trackWhenIsDueEvent('calendar_export', {
      title,
      result_date: toDateKey(date),
      result_time: time ?? null,
      event_type: time ? 'timed' : 'all_day',
      status: 'created',
    })
  }

  function toggleFavorite() {
    const nextFavoriteState = toggleFavoriteCalculation(title, date, details)
    setIsFavorite(nextFavoriteState)
    recordRecentCalculation(title, date, details)
    setMessage(nextFavoriteState ? 'Saved to favorites.' : 'Removed from favorites.')
    trackWhenIsDueEvent(
      nextFavoriteState ? 'favorite_added' : 'favorite_removed',
      {
        title,
        result_date: toDateKey(date),
      },
    )
  }

  const isReturnWindowVariant = variant === 'return-window'

  return (
    <>
      <div
        className={`result-actions${isReturnWindowVariant ? ' result-actions-return-window' : ''}`}
        aria-label="Result actions"
      >
        {isReturnWindowVariant ? (
          <>
            <div className="result-actions-primary-row">
              <button
                type="button"
                className="result-action-primary"
                onClick={copyAnswer}
              >
                {message === 'Copied.' ? 'Copied ✓' : 'Copy result'}
              </button>
              <button
                type="button"
                className={`result-action-secondary ${
                  message === 'Calendar file created.' ? 'is-action-confirmed' : ''
                }`}
                onClick={addToCalendar}
              >
                {message === 'Calendar file created.'
                  ? 'Calendar ready ✓'
                  : 'Add to calendar'}
              </button>
            </div>

            <details className="result-actions-more">
              <summary>More options</summary>
              <div className="result-actions-more-row">
                <button
                  type="button"
                  className={isFavorite ? 'is-favorite' : ''}
                  onClick={toggleFavorite}
                  aria-pressed={isFavorite}
                >
                  {isFavorite ? 'Favorited ✓' : 'Favorite'}
                </button>
                <button
                  type="button"
                  className={message === 'Link copied.' ? 'is-action-confirmed' : ''}
                  onClick={copyExactLink}
                >
                  {message === 'Link copied.' ? 'Link copied ✓' : 'Copy link'}
                </button>
                <button
                  type="button"
                  className={message === 'Shared.' ? 'is-action-confirmed' : ''}
                  onClick={shareAnswer}
                >
                  {message === 'Shared.' ? 'Shared ✓' : 'Share'}
                </button>
              </div>
            </details>
          </>
        ) : (
          <>
            <button
              type="button"
              className={isFavorite ? 'is-favorite' : ''}
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
            >
              {isFavorite ? 'Favorited ✓' : 'Favorite'}
            </button>
            <button
              type="button"
              className={message === 'Copied.' ? 'is-action-confirmed' : ''}
              onClick={copyAnswer}
              aria-label={message === 'Copied.' ? 'Result copied' : 'Copy result'}
            >
              {message === 'Copied.' ? 'Copied ✓' : 'Copy result'}
            </button>
            <button
              type="button"
              className={message === 'Link copied.' ? 'is-action-confirmed' : ''}
              onClick={copyExactLink}
            >
              {message === 'Link copied.' ? 'Link copied ✓' : 'Copy link'}
            </button>
            <button
              type="button"
              className={message === 'Shared.' ? 'is-action-confirmed' : ''}
              onClick={shareAnswer}
            >
              {message === 'Shared.' ? 'Shared ✓' : 'Share'}
            </button>
            <button
              type="button"
              className={
                message === 'Calendar file created.' ? 'is-action-confirmed' : ''
              }
              onClick={addToCalendar}
            >
              {message === 'Calendar file created.'
                ? 'Calendar ready ✓'
                : 'Add to calendar'}
            </button>
          </>
        )}

        {message &&
        message !== 'Copied.' &&
        message !== 'Link copied.' &&
        message !== 'Shared.' &&
        message !== 'Calendar file created.' ? (
          <span aria-live="polite">{message}</span>
        ) : (
          <span className="sr-only" aria-live="polite">
            {message === 'Copied.'
              ? 'Result copied.'
              : message === 'Link copied.'
                ? 'Link copied.'
                : message === 'Shared.'
                  ? 'Shared.'
                  : message === 'Calendar file created.'
                    ? 'Calendar ready.'
                    : ''}
          </span>
        )}
      </div>

      <style>{`
        .result-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
        }

        .result-actions button {
          min-height: 44px;
          padding: 7px 11px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 8px;
          background: #fff;
          color: #526a85;
          font: inherit;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease,
            transform 140ms ease,
            box-shadow 140ms ease;
        }

        .result-actions button:hover {
          border-color: rgba(19, 38, 70, 0.28);
        }

        .result-actions button:active {
          transform: translateY(1px);
        }

        .result-actions button:focus-visible,
        .result-actions summary:focus-visible {
          outline: 3px solid rgba(29, 79, 130, 0.28);
          outline-offset: 2px;
        }

        .result-actions button.is-favorite {
          border-color: rgba(36, 107, 82, 0.34);
          background: #eaf5ef;
          color: #1f5e48;
        }

        .result-actions button.is-action-confirmed {
          border-color: rgba(36, 107, 82, 0.5);
          background: #e5f3ec;
          color: #1f5e48;
          box-shadow: 0 0 0 3px rgba(36, 107, 82, 0.08);
        }

        .result-actions span {
          color: #75879b;
          font-size: 0.72rem;
        }

        .result-actions-return-window {
          width: min(100%, 620px);
          margin-inline: auto;
          flex-direction: column;
          align-items: stretch;
        }

        .result-actions-primary-row {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 8px;
        }

        .result-actions-return-window .result-action-primary {
          border-color: #246b52;
          background: #246b52;
          color: #fff;
          font-size: 0.84rem;
          box-shadow: 0 6px 16px rgba(36, 107, 82, 0.14);
        }

        .result-actions-return-window .result-action-primary:hover {
          border-color: #1b543f;
          background: #1b543f;
        }

        .result-actions-return-window .result-action-secondary {
          border-color: rgba(36, 107, 82, 0.42);
          color: #246b52;
          font-size: 0.82rem;
        }

        .result-actions-return-window .result-action-secondary:hover {
          border-color: #246b52;
          background: #f3faf6;
        }

        .result-actions-more {
          width: 100%;
          text-align: center;
        }

        .result-actions-more summary {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          color: #64798f;
          font-size: 0.76rem;
          font-weight: 850;
          cursor: pointer;
          list-style-position: inside;
        }

        .result-actions-more[open] summary {
          color: #29435e;
        }

        .result-actions-more-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 7px;
          margin-top: 3px;
        }

        .result-actions-more-row button {
          min-height: 40px;
          background: rgba(255, 255, 255, 0.82);
        }

        @media (max-width: 560px) {
          .result-actions-primary-row {
            grid-template-columns: 1fr;
          }

          .result-actions-return-window .result-action-primary,
          .result-actions-return-window .result-action-secondary {
            min-height: 44px;
          }

          .result-actions-more-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .result-actions-more-row button {
            min-width: 0;
            padding-inline: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .result-actions button {
            transition: none;
          }
        }
      `}</style>
    </>
  )
}

type CalculationReceiptRow = {
  label: string
  value: string
}

type CalculationReceiptProps = {
  title?: string
  rows: CalculationReceiptRow[]
  analyticsContext?: string
}

function CalculationReceipt({
  title = 'How this date was calculated',
  rows,
  analyticsContext = 'calculation',
}: CalculationReceiptProps) {
  return (
    <>
      <details
        className="calculation-receipt"
        onToggle={(event) => {
          if (event.currentTarget.open) {
            trackWhenIsDueEvent('receipt_opened', { context: analyticsContext })
          }
        }}
      >
        <summary>{title}</summary>
        <dl>
          {rows.map((row) => (
            <div key={`${row.label}-${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </details>
      <style>{`
        .calculation-receipt {
          width: min(100%, 620px);
          margin: 14px auto 0;
          text-align: left;
          border-top: 1px solid rgba(19, 38, 70, 0.09);
          padding-top: 10px;
        }

        .calculation-receipt summary {
          cursor: pointer;
          color: #60758d;
          font-size: 0.78rem;
          font-weight: 850;
          text-align: center;
        }

        .calculation-receipt dl {
          margin: 12px 0 0;
          display: grid;
          gap: 7px;
        }

        .calculation-receipt dl > div {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(19, 38, 70, 0.07);
        }

        .calculation-receipt dt {
          color: #7b8999;
          font-size: 0.74rem;
        }

        .calculation-receipt dd {
          margin: 0;
          color: #314963;
          font-size: 0.76rem;
          font-weight: 800;
          text-align: right;
        }

        @media (max-width: 560px) {
          .calculation-receipt dl > div {
            align-items: flex-start;
            flex-direction: column;
            gap: 2px;
          }

          .calculation-receipt dd {
            text-align: left;
          }
        }
      `}</style>
    </>
  )
}

function BusinessDaysBetweenPage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(() =>
    getInitialDateQueryParam('start', todayInputValue()),
  )
  const [endDate, setEndDate] = useState(() =>
    getInitialDateQueryParam(
      'end',
      toDateKey(addCalendarDays(getTodayPlainDate(new Date()), 14)),
    ),
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  const parsedStartDate = parsePlainDate(startDate)
  const parsedEndDate = parsePlainDate(endDate)
  const businessDayCalculation =
    parsedStartDate && parsedEndDate
      ? countBusinessDaysBetweenWithCalendar(
          parsedStartDate,
          parsedEndDate,
          holidayCalendar,
        )
      : null
  const businessDays = businessDayCalculation?.count ?? null

  useEffect(() => {
    syncShareableQueryParams({
      start: startDate,
      end: endDate,
      calendar: holidayCalendarQueryValue(holidayCalendar),
    })
  }, [startDate, endDate, holidayCalendar])

  const formatBetweenDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  async function copyBetweenResult() {
    if (
      businessDays === null ||
      !parsedStartDate ||
      !parsedEndDate
    ) {
      return
    }

    const resultText = `${businessDays} ${
      businessDays === 1 ? 'business day' : 'business days'
    } between ${formatBetweenDate(parsedStartDate)} and ${formatBetweenDate(
      parsedEndDate,
    )}`

    try {
      await navigator.clipboard.writeText(resultText)
      setCopyMessage('Copied')
      trackWhenIsDueEvent('result_copied', {
        context: 'business_days_between',
        value: businessDays,
      })
      window.setTimeout(() => setCopyMessage(null), 1800)
    } catch {
      setCopyMessage('Could not copy')
      window.setTimeout(() => setCopyMessage(null), 1800)
    }
  }

  return (
    <main className="page-shell between-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section
        className="between-answer-shell"
        aria-labelledby="business-between-title"
      >
        <div className="between-answer-hero">
          <p className="between-answer-eyebrow">
            Business days between dates
          </p>

          {businessDays !== null && parsedStartDate && parsedEndDate ? (
            <>
              <p className="between-answer-intro">There are</p>

              <h1 id="business-between-title" className="between-answer-number">
                {businessDays}
              </h1>

              <p className="between-answer-unit">
                {businessDays === 1 ? 'business day' : 'business days'}
              </p>

              <p className="between-answer-range">
                between{' '}
                <strong>{formatBetweenDate(parsedStartDate)}</strong>
                {' and '}
                <strong>{formatBetweenDate(parsedEndDate)}</strong>
              </p>

            </>
          ) : (
            <>
              <h1 id="business-between-title" className="between-answer-question">
                How many business days are between these dates?
              </h1>
              <p className="between-answer-range">
                Choose two valid dates below.
              </p>
            </>
          )}
        </div>

        <form
          className="between-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Start date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'business_days_between_start',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <label>
            <span>End date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'business_days_between_end',
                  value: event.target.value,
                })
              }}
            />
          </label>
        </form>
      </section>

      {businessDays !== null && parsedStartDate && parsedEndDate ? (
        <section className="between-answer-actions">
          <button
            className="between-answer-copy"
            type="button"
            onClick={copyBetweenResult}
          >
            {copyMessage ?? 'Copy result'}
          </button>

          <details className="between-answer-details">
            <summary>Why this number?</summary>
            <div className="between-answer-detail-body">
              <p>
                WhenIsDue counts qualifying weekdays after the start date
                through the end date. The start date is excluded and the end
                date is included.
              </p>

              <CalculationReceipt
                analyticsContext="business_days_between"
                rows={[
                  {
                    label: 'Start date',
                    value: `${formatWeekday(
                      parsedStartDate,
                    )}, ${formatPlainDate(parsedStartDate)}`,
                  },
                  {
                    label: 'End date',
                    value: `${formatWeekday(
                      parsedEndDate,
                    )}, ${formatPlainDate(parsedEndDate)}`,
                  },
                  {
                    label: 'Counting rule',
                    value: 'Start excluded · End included',
                  },
                  {
                    label: 'Weekend rule',
                    value: 'Saturday and Sunday skipped',
                  },
                  {
                    label: 'Holiday calendar',
                    value: getHolidayCalendarOption(holidayCalendar).label,
                  },
                  {
                    label: 'Skipped holidays',
                    value: formatSkippedHolidaySummary(
                      businessDayCalculation?.skippedHolidays ?? [],
                    ),
                  },
                  {
                    label: 'Result',
                    value: `${businessDays} ${
                      businessDays === 1 ? 'business day' : 'business days'
                    }`,
                  },
                ]}
              />
            </div>
          </details>

          <details className="between-answer-details">
            <summary>Holiday settings</summary>
            <div className="between-answer-detail-body">
              <HolidayCalendarSelect
                value={holidayCalendar}
                onChange={(nextCalendar) => {
                  setHolidayCalendar(nextCalendar)
                  trackWhenIsDueEvent('holiday_calendar_changed', {
                    context: 'business_days_between',
                    value: nextCalendar,
                  })
                }}
                compact
              />

              <p className="between-answer-holiday-note">
                {holidayCalendar === 'none'
                  ? 'Weekends are skipped. Public holidays still count as weekdays.'
                  : `Weekends and ${
                      getHolidayCalendarOption(holidayCalendar).shortLabel
                    } holidays are excluded.`}
              </p>
            </div>
          </details>
        </section>
      ) : null}

      <section className="between-answer-content" aria-label="Business-day counting help">
        <div className="between-answer-content-heading">
          <p className="between-answer-section-eyebrow">Counting rule</p>
          <h2>Start excluded. End included.</h2>
        </div>

        <article>
          <h2>How this count works</h2>
          <p>
            WhenIsDue counts qualifying weekdays after the start date through
            the end date. Saturdays and Sundays are skipped.
          </p>
        </article>

        <article>
          <h2>Do public holidays count?</h2>
          <p>
            They count by default. Choose a supported holiday calendar when the
            rule you are following excludes those holidays.
          </p>
        </article>

        <article>
          <h2>What if the dates are reversed?</h2>
          <p>
            The calculator uses the earlier date as the beginning of the range
            and the later date as the end, so the result stays a positive count.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Contracts, policies, and laws can define whether start dates, end dates, weekends, or holidays count differently."
      />

      <style>{`
        .between-answer-page {
          --between-ink: #153654;
          --between-muted: #667b8e;
          --between-accent: #2d7b64;
          --between-field: #e8e8f2;
          --between-field-soft: #f2f2f8;
          min-height: 100vh;
          background: #fffaf2;
        }

        .between-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 54, 84, 0.12);
        }

        .between-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .between-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .between-answer-shell,
        .between-answer-actions,
        .between-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .between-answer-shell {
          margin-top: 22px;
        }

        .between-answer-hero {
          padding: clamp(34px, 4.8vw, 54px) clamp(24px, 5vw, 58px) 30px;
          border: 1px solid rgba(67, 67, 112, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--between-field);
          text-align: center;
        }

        .between-answer-eyebrow,
        .between-answer-section-eyebrow {
          margin: 0;
          color: var(--between-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .between-answer-intro {
          margin: 16px 0 0;
          color: var(--between-ink);
          font-size: clamp(2.1rem, 4vw, 3.5rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .between-answer-number {
          margin: 6px 0 0;
          color: var(--between-ink);
          font-size: clamp(7.5rem, 17vw, 13rem);
          font-weight: 950;
          line-height: 0.78;
          letter-spacing: -0.07em;
        }

        .between-answer-unit {
          margin: 18px 0 0;
          color: #3f657b;
          font-size: clamp(2rem, 4vw, 3.4rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .between-answer-range {
          max-width: 820px;
          margin: 14px auto 0;
          color: var(--between-muted);
          font-size: 1rem;
          line-height: 1.5;
        }

        .between-answer-range strong {
          color: #34516c;
          font-weight: 850;
        }

        .between-answer-question {
          max-width: 760px;
          margin: 14px auto 0;
          color: var(--between-ink);
          font-size: clamp(2.6rem, 5.5vw, 4.7rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .between-answer-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 15px 18px;
          border: 1px solid rgba(67, 67, 112, 0.12);
          border-top: 1px solid rgba(67, 67, 112, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--between-field-soft);
        }

        .between-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .between-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .between-answer-controls input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 54, 84, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .between-answer-actions {
          margin-top: 10px;
        }

        .between-answer-copy {
          display: block;
          width: min(100%, 330px);
          min-height: 48px;
          margin: 0 auto;
          border: 1px solid #267357;
          border-radius: 10px;
          background: #267357;
          color: #fff;
          font: inherit;
          font-size: 0.92rem;
          font-weight: 900;
          cursor: pointer;
        }

        .between-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .between-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .between-answer-detail-body {
          padding: 0 14px 16px;
        }

        .between-answer-detail-body > p,
        .between-answer-holiday-note {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .between-answer-holiday-note {
          margin-top: 10px;
        }

        .between-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .between-answer-content {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .between-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .between-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--between-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .between-answer-content article {
          padding: 21px;
          border: 1px solid rgba(21, 54, 84, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .between-answer-content h2 {
          margin: 0;
          color: var(--between-ink);
          font-size: 1.08rem;
        }

        .between-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .between-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .between-answer-brand img {
            width: 154px;
          }

          .between-answer-shell,
          .between-answer-actions,
          .between-answer-content {
            width: min(100% - 24px, 680px);
          }

          .between-answer-shell {
            margin-top: 12px;
          }

          .between-answer-hero {
            padding: 20px 20px 17px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .between-answer-intro {
            margin-top: 12px;
            font-size: clamp(1.8rem, 8.2vw, 2.5rem);
          }

          .between-answer-number {
            margin-top: 4px;
            font-size: clamp(6.2rem, 28vw, 8.5rem);
          }

          .between-answer-unit {
            margin-top: 12px;
            font-size: clamp(1.8rem, 8.4vw, 2.65rem);
          }

          .between-answer-range {
            margin-top: 10px;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .between-answer-range strong {
            display: inline;
          }

          .between-answer-question {
            margin-top: 10px;
            font-size: clamp(2.2rem, 10vw, 3.25rem);
          }

          .between-answer-controls {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .between-answer-controls input {
            min-height: 46px;
            padding: 8px 9px;
            font-size: 0.9rem;
          }

          .between-answer-copy {
            width: 100%;
          }

          .between-answer-content {
            display: block;
            margin-top: 28px;
          }

          .between-answer-content-heading {
            margin-bottom: 8px;
          }

          .between-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(21, 54, 84, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .between-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
function FreeTrialPage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(() =>
    getInitialDateQueryParam('start', todayInputValue()),
  )
  const [trialLength, setTrialLength] = useState(() =>
    getInitialPositiveIntegerQueryParam('days', '7', getAmountLimit('trial')),
  )
  const [title, setTitle] = useState(getDefaultTitle('trial'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() =>
    loadSavedDeadlines(),
  )
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedStartDate = parsePlainDate(startDate)
  const parsedTrialLength = parseInteger(trialLength)
  const validationMessage = getTrialValidationMessage(
    parsedStartDate,
    parsedTrialLength,
  )
  const titleValidationMessage = getSaveTitleValidationMessage(title)
  const trialEndDate =
    parsedStartDate && parsedTrialLength !== null && !validationMessage
      ? addCalendarDays(parsedStartDate, parsedTrialLength)
      : null
  const cancelByDate = trialEndDate ? addCalendarDays(trialEndDate, -1) : null
  const canSave = Boolean(
    trialEndDate &&
      parsedStartDate &&
      !validationMessage &&
      !titleValidationMessage,
  )

  const formatFreeTrialDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  useEffect(() => {
    syncShareableQueryParams({ start: startDate, days: trialLength })
  }, [startDate, trialLength])

  function saveTrialDeadline() {
    if (!trialEndDate || !parsedStartDate || titleValidationMessage) {
      return
    }

    const nextDeadline: SavedDeadline = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: 'trial',
      dueDate: toDateKey(trialEndDate),
      startDate: toDateKey(parsedStartDate),
      done: false,
      createdAt: new Date().toISOString(),
    }

    if (isDuplicateSavedDeadline(savedDeadlines, nextDeadline)) {
      setStorageMessage('This due date is already saved.')
      return
    }

    const nextDeadlines = [nextDeadline, ...savedDeadlines]
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage('Saved to My due dates.')
  }

  return (
    <main className="page-shell free-trial-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section
        className="free-trial-answer-shell"
        aria-labelledby="free-trial-title"
      >
        <div className="free-trial-answer-hero">
          <p className="free-trial-answer-eyebrow">Free trial calculator</p>

          {trialEndDate && parsedStartDate && parsedTrialLength !== null ? (
            <>
              <h1 id="free-trial-title">Your free trial ends</h1>
              <strong
                className="free-trial-answer-date"
                aria-label={`${formatWeekday(trialEndDate)}, ${formatPlainDate(trialEndDate)}`}
              >
                <span className="free-trial-answer-weekday">
                  {formatWeekday(trialEndDate)},
                </span>
                <span className="free-trial-answer-date-main" aria-hidden="true">
                  <span className="free-trial-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][trialEndDate.month - 1]
                    }
                  </span>
                  <span className="free-trial-answer-day">
                    {trialEndDate.day}
                  </span>
                  <span className="free-trial-answer-comma">,</span>
                  <span className="free-trial-answer-year">
                    {trialEndDate.year}
                  </span>
                </span>
              </strong>

              <p className="free-trial-answer-context">
                {parsedTrialLength}-day trial · Starts {formatFreeTrialDate(parsedStartDate)}
              </p>

              {cancelByDate ? (
                <p className="free-trial-answer-reminder">
                  Suggested reminder: <strong>{formatWeekday(cancelByDate)}, {formatFreeTrialDate(cancelByDate)}</strong>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h1 id="free-trial-title">When does my free trial end?</h1>
              <p className="free-trial-answer-context">
                Enter a valid start date and trial length below.
              </p>
            </>
          )}
        </div>

        <div className="free-trial-answer-controls">
          <label>
            <span>Trial starts</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'free_trial',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <label>
            <span>Trial length</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={getAmountLimit('trial')}
              value={trialLength}
              onChange={(event) => {
                setTrialLength(event.target.value)
                trackWhenIsDueEvent('number_changed', {
                  context: 'free_trial',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <div
            className="free-trial-answer-quick-picks"
            aria-label="Quick trial length values"
          >
            {trialLengthQuickPicks.map((quickPick) => (
              <button
                className={
                  trialLength === String(quickPick) ? 'is-active' : ''
                }
                key={quickPick}
                type="button"
                aria-pressed={trialLength === String(quickPick)}
                onClick={() => {
                  setTrialLength(String(quickPick))
                  trackWhenIsDueEvent('quick_pick', {
                    context: 'free_trial',
                    value: quickPick,
                  })
                }}
              >
                {quickPick} days
              </button>
            ))}
          </div>

          {validationMessage ? (
            <p className="form-message">{validationMessage}</p>
          ) : null}
        </div>
      </section>

      {trialEndDate &&
      cancelByDate &&
      parsedStartDate &&
      parsedTrialLength !== null ? (
        <section className="free-trial-answer-actions">
          <ResultActions
            title="Free trial ends"
            date={trialEndDate}
            details={`Suggested reminder: ${formatFreeTrialDate(cancelByDate)}`}
            variant="return-window"
          />

          <details className="free-trial-answer-details">
            <summary>Why this date?</summary>
            <div className="free-trial-answer-detail-body">
              <p>
                {formatFreeTrialExplanation(
                  parsedStartDate,
                  parsedTrialLength,
                  trialEndDate,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="free_trial"
                rows={[
                  {
                    label: 'Trial starts',
                    value: `${formatWeekday(parsedStartDate)}, ${formatPlainDate(parsedStartDate)}`,
                  },
                  {
                    label: 'Trial length',
                    value: `${parsedTrialLength} ${
                      parsedTrialLength === 1 ? 'day' : 'days'
                    }`,
                  },
                  {
                    label: 'Counting rule',
                    value: 'Full trial length added to the start date',
                  },
                  {
                    label: 'Trial ends',
                    value: `${formatWeekday(trialEndDate)}, ${formatPlainDate(trialEndDate)}`,
                  },
                  {
                    label: 'Suggested reminder',
                    value: `${formatWeekday(cancelByDate)}, ${formatPlainDate(cancelByDate)}`,
                  },
                ]}
              />
            </div>
          </details>

          <details className="free-trial-answer-details">
            <summary>Save this date</summary>
            <div className="free-trial-answer-detail-body">
              <div className="business-save">
                <label className="field title-field">
                  <span>Title</span>
                  <input
                    maxLength={titleMaxLength}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  {titleValidationMessage ? (
                    <span className="field-error">{titleValidationMessage}</span>
                  ) : null}
                </label>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canSave}
                  onClick={saveTrialDeadline}
                >
                  Save to My due dates
                </button>
                {storageMessage ? (
                  <p className="form-message">{storageMessage}</p>
                ) : null}
              </div>
            </div>
          </details>
        </section>
      ) : null}

      <section className="free-trial-answer-related" aria-label="Related trial and renewal tools">
        <div>
          <p className="free-trial-answer-section-eyebrow">Next step</p>
          <h2>What happens after the trial?</h2>
        </div>

        <nav>
          <a
            href="/subscription-renewal-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/subscription-renewal-calculator')
            }}
          >
            Subscription renewal calculator
          </a>
          <a
            href="/return-window-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/return-window-calculator')
            }}
          >
            Return window calculator
          </a>
        </nav>
      </section>

      <section className="free-trial-answer-content" aria-label="Free trial help">
        <div className="free-trial-answer-content-heading">
          <p className="free-trial-answer-section-eyebrow">Trial timing rules</p>
          <h2>Start, trial, renewal</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the day your trial starts and the number of days in the trial.
            The calculator shows the trial end date and a suggested one-day-before
            reminder. Always check the company's official cancellation terms
            because some services renew earlier or use a specific billing time.
          </p>
        </article>

        <article>
          <h2>Common trial lengths</h2>
          <ul>
            <li>7-day trial</li>
            <li>14-day trial</li>
            <li>30-day trial</li>
          </ul>
        </article>

        <article>
          <h2>Free trial calculation example</h2>
          <p>
            Suppose a 14-day trial starts on May 1. Using this calculator's
            date-addition method, the trial end date is May 15 and the suggested
            reminder date is May 14. This treats the start date as day zero.
            A service may instead count the signup date as day one, so its
            displayed renewal date should take priority.
          </p>
        </article>

        <article>
          <h2>What to check before the trial renews</h2>
          <ul>
            <li>The exact renewal date shown in your account or confirmation email</li>
            <li>The renewal time and time zone, not only the calendar date</li>
            <li>Whether cancellation must be completed a day or more in advance</li>
            <li>Whether deleting an app also cancels the subscription</li>
            <li>Whether the service sends a cancellation confirmation</li>
          </ul>
        </article>

        <article>
          <h2>Free trial FAQ</h2>
          <dl>
            <dt>Does the signup day count as the first day?</dt>
            <dd>
              This calculator adds the full trial length to the start date.
              Services may use a different counting convention, so check the
              renewal date displayed by the provider.
            </dd>
            <dt>Why is the suggested reminder one day earlier?</dt>
            <dd>
              It provides a simple planning buffer before the calculated end
              date. It is not a guarantee that every provider will accept
              cancellation until that date.
            </dd>
            <dt>Does uninstalling an app cancel a free trial?</dt>
            <dd>
              Usually, uninstalling an app and cancelling its subscription are
              separate actions. Use the provider, App Store, or Google Play
              subscription controls and confirm the cancellation.
            </dd>
            <dt>Can a trial renew at a specific time?</dt>
            <dd>
              Yes. Some services use a particular time or time zone. This
              calculator works with calendar dates only.
            </dd>
          </dl>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always confirm the renewal date, cancellation deadline, and time zone shown by the service."
      />

      <style>{`
        .free-trial-answer-page {
          --trial-ink: #143454;
          --trial-muted: #65798d;
          --trial-accent: #2e7a63;
          --trial-field: #e8edf7;
          --trial-field-soft: #f1f4fa;
          min-height: 100vh;
          background: #fffaf2;
        }

        .free-trial-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(20, 52, 84, 0.12);
        }

        .free-trial-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .free-trial-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .free-trial-answer-shell,
        .free-trial-answer-actions,
        .free-trial-answer-related,
        .free-trial-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .free-trial-answer-shell {
          margin-top: 22px;
        }

        .free-trial-answer-hero {
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(64, 76, 113, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--trial-field);
          text-align: center;
        }

        .free-trial-answer-eyebrow,
        .free-trial-answer-section-eyebrow {
          margin: 0;
          color: var(--trial-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .free-trial-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--trial-ink);
          font-size: clamp(2.8rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .free-trial-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 26px;
          color: var(--trial-ink);
          font-weight: 900;
        }

        .free-trial-answer-weekday {
          color: #37627b;
          font-size: clamp(2.5rem, 4.4vw, 4rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .free-trial-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.7rem, 6.2vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .free-trial-answer-month,
        .free-trial-answer-day,
        .free-trial-answer-comma,
        .free-trial-answer-year {
          display: inline;
        }

        .free-trial-answer-comma {
          margin-left: -0.08em;
        }

        .free-trial-answer-context {
          margin: 18px 0 0;
          color: var(--trial-muted);
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .free-trial-answer-reminder {
          width: fit-content;
          margin: 16px auto 0;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.62);
          color: #5f7186;
          font-size: 0.9rem;
        }

        .free-trial-answer-reminder strong {
          color: #294b66;
        }

        .free-trial-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(150px, 0.7fr) minmax(260px, 1fr);
          gap: 12px;
          align-items: end;
          padding: 18px;
          border: 1px solid rgba(64, 76, 113, 0.12);
          border-top: 1px solid rgba(64, 76, 113, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--trial-field-soft);
        }

        .free-trial-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .free-trial-answer-controls label > span {
          color: #526a82;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .free-trial-answer-controls input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(20, 52, 84, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .free-trial-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .free-trial-answer-quick-picks button {
          min-height: 50px;
          border: 1px solid rgba(20, 52, 84, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.8);
          color: #4e6680;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .free-trial-answer-quick-picks button.is-active {
          border-color: rgba(46, 122, 99, 0.58);
          background: #e7f3ee;
          color: #1f6655;
          box-shadow: inset 0 0 0 1px rgba(46, 122, 99, 0.16);
        }

        .free-trial-answer-controls .form-message {
          grid-column: 1 / -1;
          margin: 0;
        }

        .free-trial-answer-actions {
          margin-top: 16px;
        }

        .free-trial-answer-actions > .result-actions {
          justify-content: center;
        }

        .free-trial-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(20, 52, 84, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .free-trial-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .free-trial-answer-detail-body {
          padding: 0 14px 16px;
        }

        .free-trial-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .free-trial-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .free-trial-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(20, 52, 84, 0.1);
          border-radius: 22px;
          background: #eef3f9;
        }

        .free-trial-answer-related h2,
        .free-trial-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--trial-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .free-trial-answer-related nav {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .free-trial-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(20, 52, 84, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .free-trial-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .free-trial-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .free-trial-answer-content article {
          padding: 21px;
          border: 1px solid rgba(20, 52, 84, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .free-trial-answer-content article:last-child {
          grid-column: 1 / -1;
        }

        .free-trial-answer-content h2 {
          margin: 0;
          color: var(--trial-ink);
          font-size: 1.08rem;
        }

        .free-trial-answer-content p,
        .free-trial-answer-content li,
        .free-trial-answer-content dd {
          color: #65798d;
          line-height: 1.55;
        }

        .free-trial-answer-content dl {
          margin: 14px 0 0;
        }

        .free-trial-answer-content dt {
          margin: 16px 0 0;
          color: var(--trial-ink);
          font-weight: 850;
        }

        .free-trial-answer-content dd {
          margin: 4px 0 0;
        }

        @media (max-width: 760px) {
          .free-trial-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .free-trial-answer-brand img {
            width: 154px;
          }

          .free-trial-answer-shell,
          .free-trial-answer-actions,
          .free-trial-answer-related,
          .free-trial-answer-content {
            width: min(100% - 24px, 680px);
          }

          .free-trial-answer-shell {
            margin-top: 14px;
          }

          .free-trial-answer-hero {
            padding: 28px 20px 26px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .free-trial-answer-hero h1 {
            font-size: clamp(2.65rem, 12vw, 4rem);
          }

          .free-trial-answer-date {
            justify-items: start;
            margin-top: 22px;
          }

          .free-trial-answer-weekday {
            font-size: clamp(2.3rem, 10vw, 3.2rem);
          }

          .free-trial-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(3.05rem, 14vw, 4.6rem);
            line-height: 0.9;
            white-space: normal;
          }

          .free-trial-answer-month,
          .free-trial-answer-day,
          .free-trial-answer-year {
            display: block;
          }

          .free-trial-answer-comma {
            display: none;
          }

          .free-trial-answer-context,
          .free-trial-answer-reminder {
            margin-left: 0;
            margin-right: 0;
          }

          .free-trial-answer-reminder {
            border-radius: 12px;
          }

          .free-trial-answer-controls {
            grid-template-columns: minmax(0, 1.15fr) minmax(105px, 0.65fr);
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .free-trial-answer-quick-picks {
            grid-column: 1 / -1;
          }

          .free-trial-answer-controls input,
          .free-trial-answer-quick-picks button {
            min-height: 46px;
          }

          .free-trial-answer-related {
            padding: 20px 18px;
          }

          .free-trial-answer-related nav {
            grid-template-columns: 1fr;
          }

          .free-trial-answer-content {
            display: block;
            margin-top: 28px;
          }

          .free-trial-answer-content-heading {
            margin-bottom: 8px;
          }

          .free-trial-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(20, 52, 84, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .free-trial-answer-content article p,
          .free-trial-answer-content article li,
          .free-trial-answer-content article dd {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}

function ReturnWindowPage({ onNavigate }: NavigationProps) {
  const [purchaseDate, setPurchaseDate] = useState(() =>
    getInitialDateQueryParam('start', todayInputValue()),
  )
  const [returnWindow, setReturnWindow] = useState(() =>
    getInitialPositiveIntegerQueryParam(
      'days',
      '30',
      getAmountLimit('return'),
    ),
  )
  const [title, setTitle] = useState(getDefaultTitle('return'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() =>
    loadSavedDeadlines(),
  )
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedPurchaseDate = parsePlainDate(purchaseDate)
  const parsedReturnWindow = parseInteger(returnWindow)
  const validationMessage = getReturnWindowValidationMessage(
    parsedPurchaseDate,
    parsedReturnWindow,
  )
  const titleValidationMessage = getSaveTitleValidationMessage(title)
  const returnDeadline =
    parsedPurchaseDate && parsedReturnWindow !== null && !validationMessage
      ? addCalendarDays(
          parsedPurchaseDate,
          Math.max(parsedReturnWindow - 1, 0),
        )
      : null
  const canSave = Boolean(
    returnDeadline &&
      parsedPurchaseDate &&
      !validationMessage &&
      !titleValidationMessage,
  )

  useEffect(() => {
    syncShareableQueryParams({ start: purchaseDate, days: returnWindow })
  }, [purchaseDate, returnWindow])

  function saveReturnDeadline() {
    if (!returnDeadline || !parsedPurchaseDate || titleValidationMessage) {
      return
    }

    const nextDeadline: SavedDeadline = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: 'return',
      dueDate: toDateKey(returnDeadline),
      startDate: toDateKey(parsedPurchaseDate),
      done: false,
      createdAt: new Date().toISOString(),
    }

    if (isDuplicateSavedDeadline(savedDeadlines, nextDeadline)) {
      setStorageMessage('This due date is already saved.')
      return
    }

    const nextDeadlines = [nextDeadline, ...savedDeadlines]
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage('Saved to My due dates.')
  }

  return (
    <main className="page-shell return-window-page return-answer-first-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section
        className="return-answer-hero"
        aria-labelledby="return-window-title"
        aria-live="polite"
      >
        <div className="return-answer-copy">
          <p className="return-answer-eyebrow">Return window calculator</p>
          <h1 id="return-window-title">Last day to return is</h1>

          {returnDeadline && parsedReturnWindow !== null && parsedPurchaseDate ? (
            <>
              <strong
                className="return-answer-date"
                aria-label={`${formatWeekday(returnDeadline)}, ${formatPlainDate(returnDeadline)}`}
              >
                <span className="return-answer-weekday">
                  {formatWeekday(returnDeadline)},
                </span>
                <span className="return-answer-date-main" aria-hidden="true">
                  <span className="return-answer-month">
                    {new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(returnDeadline.year, returnDeadline.month - 1, returnDeadline.day)))}
                  </span>
                  <span className="return-answer-day">
                    {returnDeadline.day}
                  </span>
                  <span className="return-answer-comma">,</span>
                  <span className="return-answer-year">
                    {returnDeadline.year}
                  </span>
                </span>
              </strong>
              <p className="return-answer-context">
                {parsedReturnWindow}-day window · Starts{' '}
                {formatPlainDate(parsedPurchaseDate)}
              </p>
            </>
          ) : (
            <p className="return-answer-error">
              {validationMessage ?? 'Enter a valid return window.'}
            </p>
          )}
        </div>

        <form
          className="return-answer-controls"
          onSubmit={(event) => event.preventDefault()}
          aria-label="Change return window"
        >
          <label>
            <span>Return period starts</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={purchaseDate}
              onChange={(event) => {
                setPurchaseDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'return_window',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <label>
            <span>Days to return</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={getAmountLimit('return')}
              value={returnWindow}
              onChange={(event) => {
                setReturnWindow(event.target.value)
                trackWhenIsDueEvent('number_changed', {
                  context: 'return_window',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <div className="return-answer-quick-picks" aria-label="Common return windows">
            {returnWindowQuickPicks.map((quickPick) => {
              const selected = returnWindow === String(quickPick)
              return (
                <button
                  className={selected ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setReturnWindow(String(quickPick))
                    trackWhenIsDueEvent('quick_pick', {
                      context: 'return_window',
                      value: quickPick,
                    })
                  }}
                >
                  {quickPick} days
                </button>
              )
            })}
          </div>

          {validationMessage ? (
            <p className="return-answer-form-message">{validationMessage}</p>
          ) : null}
        </form>
      </section>

      {returnDeadline && parsedReturnWindow !== null && parsedPurchaseDate ? (
        <section className="return-answer-actions" aria-label="Return deadline actions">
          <ResultActions
            title="Return deadline"
            date={returnDeadline}
            details={`${parsedReturnWindow}-day return window`}
            variant="return-window"
          />
        </section>
      ) : null}

      <section className="return-answer-details" aria-label="Return calculation details">
        <details className="return-answer-detail-card">
          <summary>Why this date?</summary>
          {returnDeadline && parsedReturnWindow !== null && parsedPurchaseDate ? (
            <div className="return-answer-detail-body">
              <p>
                {formatReturnWindowExplanation(
                  parsedPurchaseDate,
                  parsedReturnWindow,
                  returnDeadline,
                )}
              </p>
              <CalculationReceipt
                analyticsContext="return_window"
                rows={[
                  {
                    label: 'Window starts',
                    value: `${formatWeekday(parsedPurchaseDate)}, ${formatPlainDate(parsedPurchaseDate)}`,
                  },
                  {
                    label: 'Window length',
                    value: `${parsedReturnWindow} ${parsedReturnWindow === 1 ? 'day' : 'days'}`,
                  },
                  {
                    label: 'Counting rule',
                    value: 'Start date counts as day 1',
                  },
                  {
                    label: 'Last day to return',
                    value: `${formatWeekday(returnDeadline)}, ${formatPlainDate(returnDeadline)}`,
                  },
                ]}
              />
            </div>
          ) : null}
        </details>

        <details className="return-answer-detail-card">
          <summary>Which date starts the return period?</summary>
          <div className="return-answer-detail-body">
            <p>
              Use whichever date the retailer says starts the return period.
              For shipped orders, that may be the delivery date rather than the
              purchase date.
            </p>
          </div>
        </details>

        <details className="return-answer-detail-card">
          <summary>Save this date</summary>
          <div className="return-answer-detail-body return-answer-save">
            <label>
              <span>Title</span>
              <input
                maxLength={titleMaxLength}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            {titleValidationMessage ? (
              <span className="field-error">{titleValidationMessage}</span>
            ) : null}
            <button
              className="primary-button"
              type="button"
              disabled={!canSave}
              onClick={saveReturnDeadline}
            >
              Save to My due dates
            </button>
            {storageMessage ? (
              <p className="form-message">{storageMessage}</p>
            ) : null}
          </div>
        </details>
      </section>

      <section className="return-policy-note" aria-label="Return policy reminder">
        <p>
          <strong>Check the retailer&apos;s policy.</strong> Some return periods
          start from purchase, others from delivery, and holiday purchases may
          get extra time.
        </p>
      </section>

      <nav className="return-answer-bottom-nav" aria-label="More WhenIsDue tools">
        <a
          href="/calculators"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/calculators')
          }}
        >
          Calculators
        </a>
        <a
          href="/workspace"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/workspace')
          }}
        >
          Workspace
        </a>
      </nav>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The retailer's written return policy controls the actual return deadline."
      />

      <style>{`
        .return-answer-first-page {
          --return-ink: #113356;
          --return-muted: #657a8f;
          --return-accent: #2d7461;
          --return-panel: #e8f2ec;
          --return-panel-deep: #dcebe3;
          min-height: 100vh;
          background: #fffaf2;
        }

        .return-answer-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 51, 86, 0.11);
        }

        .return-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .return-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .return-answer-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .return-answer-nav a {
          color: #5a7187;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .return-answer-hero {
          width: min(100% - 32px, 1130px);
          margin: 22px auto 0;
          overflow: hidden;
          border: 1px solid rgba(17, 51, 86, 0.09);
          border-radius: 28px;
          background: var(--return-panel);
        }

        .return-answer-copy {
          padding: clamp(36px, 5vw, 64px) clamp(28px, 5vw, 64px) 34px;
        }

        .return-answer-eyebrow {
          margin: 0;
          color: var(--return-accent);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .return-answer-copy h1 {
          margin: 9px 0 0;
          color: var(--return-ink);
          font-size: clamp(2rem, 3vw, 3.1rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .return-answer-date {
          display: block;
          max-width: 100%;
          margin-top: 22px;
          color: var(--return-ink);
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -0.055em;
        }

        .return-answer-weekday {
          display: block;
          margin: 0 0 8px;
          color: var(--return-ink);
          font-size: clamp(2.5rem, 4.4vw, 4.25rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.045em;
        }

        .return-answer-date-main {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.08em;
          max-width: 100%;
          font-size: clamp(3.45rem, 6.1vw, 5.85rem);
          line-height: 0.9;
        }

        .return-answer-month,
        .return-answer-day,
        .return-answer-year,
        .return-answer-comma {
          display: inline;
        }

        .return-answer-context {
          margin: 12px 0 0;
          color: var(--return-muted);
          font-size: 1rem;
          font-weight: 700;
        }

        .return-answer-error {
          margin: 22px 0 0;
          color: #7a5314;
          font-size: 1rem;
          font-weight: 750;
        }

        .return-answer-controls {
          display: grid;
          grid-template-columns: minmax(220px, 1.15fr) minmax(150px, 0.65fr) minmax(380px, 1.7fr);
          gap: 12px;
          align-items: end;
          padding: 22px clamp(28px, 5vw, 64px);
          border-top: 1px solid rgba(17, 51, 86, 0.08);
          background: rgba(255, 255, 255, 0.42);
        }

        .return-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .return-answer-controls label > span {
          color: #536b80;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .return-answer-controls input {
          width: 100%;
          min-height: 48px;
          padding: 9px 12px;
          border: 1px solid rgba(17, 51, 86, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .return-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 7px;
        }

        .return-answer-quick-picks button {
          min-height: 48px;
          padding: 8px 6px;
          border: 1px solid rgba(17, 51, 86, 0.13);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.78);
          color: #4e6880;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 900;
          cursor: pointer;
        }

        .return-answer-quick-picks button.is-selected {
          border-color: rgba(45, 116, 97, 0.62);
          background: #f4fbf7;
          color: #225f50;
          box-shadow: inset 0 0 0 1px rgba(45, 116, 97, 0.14);
        }

        .return-answer-form-message {
          grid-column: 1 / -1;
          margin: 0;
          color: #7a5314;
          font-size: 0.9rem;
          font-weight: 750;
        }

        .return-answer-actions {
          width: min(100% - 32px, 1130px);
          margin: 14px auto 0;
        }

        .return-answer-actions .result-actions {
          justify-content: flex-start;
        }

        .return-answer-details {
          width: min(100% - 32px, 900px);
          margin: 28px auto 0;
          border-top: 1px solid rgba(17, 51, 86, 0.1);
        }

        .return-answer-detail-card {
          border-bottom: 1px solid rgba(17, 51, 86, 0.1);
        }

        .return-answer-detail-card summary {
          min-height: 58px;
          display: flex;
          align-items: center;
          color: #36536d;
          font-size: 0.94rem;
          font-weight: 900;
          cursor: pointer;
        }

        .return-answer-detail-body {
          padding: 0 0 20px;
        }

        .return-answer-detail-body > p {
          max-width: 720px;
          margin: 0;
          color: #63798f;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .return-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .return-answer-save {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px 12px;
          align-items: end;
        }

        .return-answer-save label {
          display: grid;
          gap: 7px;
        }

        .return-answer-save label > span {
          color: #536b80;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .return-answer-save input {
          min-height: 46px;
          width: 100%;
          padding: 9px 11px;
          border: 1px solid rgba(17, 51, 86, 0.14);
          border-radius: 10px;
          background: #fff;
          color: #17304d;
          font: inherit;
        }

        .return-answer-save .field-error,
        .return-answer-save .form-message {
          grid-column: 1 / -1;
        }

        .return-policy-note {
          width: min(100% - 32px, 900px);
          margin: 24px auto 0;
          padding: 15px 18px;
          border-left: 4px solid #d6a340;
          border-radius: 10px;
          background: #fff7e4;
        }

        .return-policy-note p {
          margin: 0;
          color: #65583d;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .return-policy-note strong {
          color: #6f4d16;
        }

        .return-answer-bottom-nav {
          width: min(100% - 32px, 930px);
          margin: 18px auto 0;
          padding-top: 16px;
          border-top: 1px solid rgba(17, 51, 86, 0.1);
          display: flex;
          justify-content: center;
          gap: 22px;
        }

        .return-answer-bottom-nav a {
          color: #667b8f;
          font-size: 0.88rem;
          font-weight: 800;
          text-decoration: none;
        }

        .return-answer-bottom-nav a:hover {
          color: var(--return-ink);
        }

        @media (max-width: 860px) {
          .return-answer-controls {
            grid-template-columns: 1fr 0.7fr;
          }

          .return-answer-quick-picks {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 720px) {
          .return-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            gap: 12px;
          }

          .return-answer-brand img {
            width: 154px;
          }

          .return-answer-nav {
            gap: 12px;
          }

          .return-answer-nav a {
            font-size: 0.8rem;
          }

          .return-answer-home-link {
            display: none;
          }

          .return-answer-hero {
            width: calc(100% - 24px);
            margin-top: 14px;
            border-radius: 22px;
          }

          .return-answer-copy {
            padding: 26px 20px 24px;
          }

          .return-answer-copy h1 {
            font-size: clamp(1.75rem, 8vw, 2.25rem);
          }

          .return-answer-date {
            display: block;
            margin-top: 18px;
            line-height: 0.9;
          }

          .return-answer-weekday {
            display: block;
            margin: 0 0 10px;
            font-size: clamp(1.85rem, 8.8vw, 2.6rem);
            line-height: 0.98;
          }

          .return-answer-date-main {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            font-size: clamp(3.55rem, 17vw, 5rem);
            line-height: 0.82;
            letter-spacing: -0.06em;
          }

          .return-answer-month,
          .return-answer-day,
          .return-answer-year {
            display: block;
          }

          .return-answer-comma {
            display: none;
          }

          .return-answer-month {
            font-size: 0.92em;
          }

          .return-answer-day {
            font-size: 1.08em;
          }

          .return-answer-year {
            font-size: 0.96em;
          }

          .return-answer-context {
            margin-top: 9px;
            font-size: 0.9rem;
          }

          .return-answer-controls {
            grid-template-columns: 1fr 0.62fr;
            gap: 10px;
            padding: 16px 18px 18px;
          }

          .return-answer-controls input {
            min-height: 46px;
          }

          .return-answer-quick-picks {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 5px;
          }

          .return-answer-quick-picks button {
            min-height: 42px;
            padding: 6px 3px;
            border-radius: 9px;
            font-size: 0.72rem;
          }

          .return-answer-actions {
            width: calc(100% - 24px);
            margin-top: 12px;
          }

          .return-answer-actions .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }

          .return-answer-actions .result-actions button,
          .return-answer-actions .result-actions a {
            width: 100%;
            min-height: 44px;
            padding: 8px 9px;
            font-size: 0.8rem;
          }

          .return-answer-actions .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .return-answer-details,
          .return-policy-note {
            width: calc(100% - 24px);
          }

          .return-answer-details {
            margin-top: 22px;
          }

          .return-answer-detail-card summary {
            min-height: 54px;
          }

          .return-answer-save {
            grid-template-columns: 1fr;
          }

          .return-answer-save .primary-button {
            width: 100%;
          }
        }

        @media (max-width: 430px) {
          .return-answer-brand img {
            width: 142px;
          }

          .return-answer-nav {
            gap: 10px;
          }

          .return-answer-nav a {
            font-size: 0.76rem;
          }

          .return-answer-date-main {
            font-size: clamp(3.25rem, 16.5vw, 4.6rem);
          }

          .return-answer-weekday {
            font-size: clamp(1.7rem, 8vw, 2.3rem);
          }

          .return-answer-controls {
            grid-template-columns: 1fr;
          }

          .return-answer-quick-picks {
            grid-column: auto;
          }
        }
      `}</style>
    </main>
  )
}



const RECENT_CALCULATIONS_STORAGE_KEY = 'whenisdue:recent-calculations'
const FAVORITE_CALCULATIONS_STORAGE_KEY = 'whenisdue:favorite-calculations'
const SAVED_CALCULATIONS_EVENT = 'whenisdue:saved-calculations-changed'

type SavedCalculation = {
  id: string
  title: string
  dateText: string
  details?: string
  url: string
  savedAt: number
}

function readSavedCalculations(key: string): SavedCalculation[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is SavedCalculation => (
      item &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.dateText === 'string' &&
      typeof item.url === 'string' &&
      typeof item.savedAt === 'number'
    ))
  } catch {
    return []
  }
}

function writeSavedCalculations(key: string, items: SavedCalculation[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
    window.dispatchEvent(new Event(SAVED_CALCULATIONS_EVENT))
  } catch {
    // Local storage can be unavailable in strict privacy modes.
  }
}

function calculationId(title: string, url: string) {
  return `${title}::${url}`
}

function buildSavedCalculation(
  title: string,
  date: PlainDate,
  details?: string,
): SavedCalculation {
  const url = `${window.location.pathname}${window.location.search}`

  return {
    id: calculationId(title, url),
    title,
    dateText: formatPlainDate(date),
    details,
    url,
    savedAt: Date.now(),
  }
}

function recordRecentCalculation(
  title: string,
  date: PlainDate,
  details?: string,
) {
  const next = buildSavedCalculation(title, date, details)
  const existing = readSavedCalculations(RECENT_CALCULATIONS_STORAGE_KEY)
    .filter((item) => item.id !== next.id)

  writeSavedCalculations(
    RECENT_CALCULATIONS_STORAGE_KEY,
    [next, ...existing].slice(0, 8),
  )
}

function isFavoriteCalculation(title: string, url: string) {
  const id = calculationId(title, url)
  return readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY)
    .some((item) => item.id === id)
}

function toggleFavoriteCalculation(
  title: string,
  date: PlainDate,
  details?: string,
) {
  const next = buildSavedCalculation(title, date, details)
  const favorites = readSavedCalculations(FAVORITE_CALCULATIONS_STORAGE_KEY)
  const exists = favorites.some((item) => item.id === next.id)

  if (exists) {
    writeSavedCalculations(
      FAVORITE_CALCULATIONS_STORAGE_KEY,
      favorites.filter((item) => item.id !== next.id),
    )
    return false
  }

  writeSavedCalculations(
    FAVORITE_CALCULATIONS_STORAGE_KEY,
    [next, ...favorites].slice(0, 12),
  )
  return true
}

function removeSavedCalculation(key: string, id: string) {
  writeSavedCalculations(
    key,
    readSavedCalculations(key).filter((item) => item.id !== id),
  )
}

const HOLIDAY_CALENDAR_STORAGE_KEY = 'whenisdue:holiday-calendar'

function getSavedHolidayCalendar(): HolidayCalendarId {
  try {
    const saved = window.localStorage.getItem(HOLIDAY_CALENDAR_STORAGE_KEY)
    return isHolidayCalendarId(saved) ? saved : 'none'
  } catch {
    return 'none'
  }
}

function saveHolidayCalendar(calendar: HolidayCalendarId) {
  try {
    if (calendar === 'none') {
      window.localStorage.removeItem(HOLIDAY_CALENDAR_STORAGE_KEY)
    } else {
      window.localStorage.setItem(HOLIDAY_CALENDAR_STORAGE_KEY, calendar)
    }
  } catch {
    // Local storage can be unavailable in strict privacy modes.
  }
}

function getInitialHolidayCalendarQueryParam(): HolidayCalendarId {
  const value = new URLSearchParams(window.location.search).get('calendar')
  return isHolidayCalendarId(value) ? value : getSavedHolidayCalendar()
}

function holidayCalendarQueryValue(calendar: HolidayCalendarId) {
  return calendar === 'none' ? null : calendar
}

function formatSkippedHolidaySummary(
  skippedHolidays: Array<{ date: string; name: string }>,
) {
  if (skippedHolidays.length === 0) {
    return 'None encountered'
  }

  const visible = skippedHolidays.slice(0, 6).map((holiday) => {
    const parsed = parsePlainDate(holiday.date)
    return parsed ? `${holiday.name} — ${formatPlainDate(parsed)}` : `${holiday.name} — ${holiday.date}`
  })

  const remaining = skippedHolidays.length - visible.length

  return remaining > 0
    ? `${visible.join('; ')}; +${remaining} more`
    : visible.join('; ')
}

function formatBusinessDayExplanation(
  startDate: PlainDate,
  dayCount: number,
  resultDate: PlainDate,
  holidayCalendar: HolidayCalendarId,
) {
  const calendar = getHolidayCalendarOption(holidayCalendar)
  const dayWord = dayCount === 1 ? 'day' : 'days'
  const rule =
    holidayCalendar === 'none'
      ? 'Weekends are skipped. Public holidays still count as weekdays.'
      : `Weekends and ${calendar.shortLabel.toLowerCase()} holidays are skipped.`

  return `${dayCount} business ${dayWord} after ${formatPlainDate(startDate)} is ${formatPlainDate(resultDate)}. ${rule}`
}

function formatNetTermExplanation(
  invoiceDate: PlainDate,
  dayCount: number,
  dueDate: PlainDate,
) {
  return `A Net ${dayCount} invoice dated ${formatPlainDate(invoiceDate)} is due ${dayCount} calendar days later, on ${formatPlainDate(dueDate)}. Weekends and public holidays do not automatically move the due date unless the invoice or contract says otherwise.`
}

function formatInvoiceTermExplanation(
  invoiceDate: PlainDate,
  term: InvoiceTerm,
  dueDate: PlainDate,
) {
  if (term === 'eom') {
    return `For an end-of-month term, an invoice dated ${formatPlainDate(invoiceDate)} is due on ${formatPlainDate(dueDate)}, the last calendar day of that invoice month. Weekend or holiday adjustments depend on the invoice or contract.`
  }

  const match = /^net(\d+)$/.exec(term)
  const dayCount = match ? Number(match[1]) : 0

  return formatNetTermExplanation(invoiceDate, dayCount, dueDate)
}

function formatReturnWindowExplanation(
  startDate: PlainDate,
  windowDays: number,
  deadline: PlainDate,
) {
  return `A ${windowDays}-day return window starting on ${formatPlainDate(startDate)} ends on ${formatPlainDate(deadline)}. This calculator counts calendar days and does not automatically extend the deadline for weekends or public holidays unless the retailer's policy says otherwise.`
}

function formatFreeTrialExplanation(
  startDate: PlainDate,
  trialDays: number,
  endDate: PlainDate,
) {
  return `A ${trialDays}-day trial starting on ${formatPlainDate(startDate)} ends on ${formatPlainDate(endDate)} using calendar-day counting. The actual cancellation cutoff can depend on the service's billing terms, time zone, and whether the start date counts as day one.`
}

function formatPaydayExplanation(
  knownPayday: PlainDate,
  schedule: PaySchedule,
  nextPayday: PlainDate,
) {
  return `With a ${payScheduleLabel(schedule).toLowerCase()} schedule and a known payday of ${formatPlainDate(knownPayday)}, the next scheduled payday is ${formatPlainDate(nextPayday)}. Weekend, holiday, bank, or employer payroll adjustments are not applied automatically.`
}

function formatBusinessHoursExplanation(
  startDate: PlainDate,
  startTime: string,
  businessHours: number,
  workdayStart: string,
  workdayEnd: string,
  holidayCalendar: HolidayCalendarId,
  deadlineDate: PlainDate,
  deadlineTime: string,
) {
  const calendar = getHolidayCalendarOption(holidayCalendar)
  const holidayRule =
    holidayCalendar === 'none'
      ? 'Weekends and time outside the workday are skipped; public holidays still count as weekdays.'
      : `Weekends, time outside the workday, and ${calendar.shortLabel.toLowerCase()} holidays are skipped.`

  return `Adding ${businessHours} business ${businessHours === 1 ? 'hour' : 'hours'} from ${formatPlainDate(startDate)} at ${formatTime12Hour(startTime)}, using a ${formatTime12Hour(workdayStart)}–${formatTime12Hour(workdayEnd)} workday, gives a deadline of ${formatPlainDate(deadlineDate)} at ${formatTime12Hour(deadlineTime)}. ${holidayRule}`
}





type HolidayCalendarSelectProps = {
  value: HolidayCalendarId
  onChange: (value: HolidayCalendarId) => void
  compact?: boolean
}

function HolidayCalendarSelect({
  value,
  onChange,
  compact = false,
}: HolidayCalendarSelectProps) {
  const selected = getHolidayCalendarOption(value)

  return (
    <>
      <label className={`holiday-calendar-control ${compact ? 'is-compact' : ''}`}>
        <span>Public holidays</span>
        <select
          value={value}
          onChange={(event) => {
            const next = event.target.value
            if (!isHolidayCalendarId(next)) return
            saveHolidayCalendar(next)
            onChange(next)
          }}
        >
          {holidayCalendarOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <small>{selected.note}</small>
      </label>

      <style>{`
        .holiday-calendar-control {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .holiday-calendar-control > span {
          color: #526a85;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .holiday-calendar-control select {
          width: 100%;
          min-height: 44px;
          padding: 8px 10px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 9px;
          background: #fff;
          color: #223b59;
          font: inherit;
          font-size: 0.86rem;
        }

        .holiday-calendar-control small {
          max-width: 620px;
          color: #7a8999;
          font-size: 0.7rem;
          line-height: 1.4;
        }

        .holiday-calendar-control.is-compact {
          width: min(100%, 520px);
          margin: 12px auto 0;
          text-align: left;
        }

        .holiday-calendar-control.is-compact > span,
        .holiday-calendar-control.is-compact small {
          text-align: center;
        }

        @media (max-width: 560px) {
          .holiday-calendar-control.is-compact > span,
          .holiday-calendar-control.is-compact small {
            text-align: left;
          }
        }
      `}</style>
    </>
  )
}

function getInitialInvoiceTermQueryParam(name: string, fallback: InvoiceTerm): InvoiceTerm {
  const value = new URLSearchParams(window.location.search).get(name) as InvoiceTerm | null
  return value && invoiceTerms.includes(value) ? value : fallback
}

function TwoTenNetThirtyPage({ onNavigate }: NavigationProps) {
  const [invoiceDate, setInvoiceDate] = useState(() =>
    getInitialDateQueryParam('date', todayInputValue()),
  )

  const parsedInvoiceDate = parsePlainDate(invoiceDate)
  const discountDeadline = parsedInvoiceDate
    ? addCalendarDays(parsedInvoiceDate, 10)
    : null
  const finalDueDate = parsedInvoiceDate
    ? getDueDateForMode('invoice', parsedInvoiceDate, 0, 'net30')
    : null

  useEffect(() => {
    syncShareableQueryParams({ date: invoiceDate })
  }, [invoiceDate])

  const formatTwoTenDate = (date: PlainDate) =>
    `${[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][date.month - 1]} ${date.day}, ${date.year}`

  return (
    <main className="page-shell two-ten-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="two-ten-answer-shell" aria-labelledby="two-ten-answer-title">
        <div className="two-ten-answer-hero">
          <p className="two-ten-answer-eyebrow">2/10 Net 30 calculator</p>

          {parsedInvoiceDate && discountDeadline && finalDueDate ? (
            <>
              <h1 id="two-ten-answer-title">Two payment dates matter</h1>

              <div className="two-ten-answer-grid" aria-live="polite">
                <article className="two-ten-answer-card is-discount">
                  <span>Pay by this date to save 2%</span>
                  <strong>{formatWeekday(discountDeadline)},</strong>
                  <b>{formatTwoTenDate(discountDeadline)}</b>
                  <small>10 calendar days after the invoice date</small>
                </article>

                <article className="two-ten-answer-card is-final">
                  <span>Otherwise, full payment is due</span>
                  <strong>{formatWeekday(finalDueDate)},</strong>
                  <b>{formatTwoTenDate(finalDueDate)}</b>
                  <small>30 calendar days after the invoice date</small>
                </article>
              </div>

              <p className="two-ten-answer-context">
                Invoice dated {formatTwoTenDate(parsedInvoiceDate)}
              </p>
            </>
          ) : (
            <>
              <h1 id="two-ten-answer-title">When are 2/10 Net 30 payments due?</h1>
              <p className="two-ten-answer-context">
                Enter a valid invoice date below.
              </p>
            </>
          )}
        </div>

        <form
          className="two-ten-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Invoice date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={invoiceDate}
              onChange={(event) => {
                setInvoiceDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'two_ten_net_30',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <div className="two-ten-answer-definition">
            <strong>2/10 Net 30</strong>
            <span>2% discount within 10 days · full amount due in 30 days</span>
          </div>
        </form>
      </section>

      {parsedInvoiceDate && discountDeadline && finalDueDate ? (
        <section className="two-ten-answer-actions">
          <ResultActions
            title="2/10 Net 30 final due date"
            date={finalDueDate}
            details={`2% discount deadline: ${formatTwoTenDate(discountDeadline)}`}
            variant="return-window"
          />

          <details className="two-ten-answer-details">
            <summary>Why these dates?</summary>
            <div className="two-ten-answer-detail-body">
              <p>
                The invoice date is treated as day zero. The 2% discount window
                ends 10 calendar days after the invoice date, and the full Net
                30 amount is due 30 calendar days after it. Weekends and public
                holidays are not moved automatically.
              </p>

              <CalculationReceipt
                analyticsContext="two_ten_net_30"
                rows={[
                  {
                    label: 'Invoice date',
                    value: `${formatWeekday(parsedInvoiceDate)}, ${formatPlainDate(parsedInvoiceDate)}`,
                  },
                  {
                    label: 'Early-payment term',
                    value: '2% discount within 10 calendar days',
                  },
                  {
                    label: 'Discount deadline',
                    value: `${formatWeekday(discountDeadline)}, ${formatPlainDate(discountDeadline)}`,
                  },
                  {
                    label: 'Final payment term',
                    value: 'Net 30 — 30 calendar days',
                  },
                  {
                    label: 'Final due date',
                    value: `${formatWeekday(finalDueDate)}, ${formatPlainDate(finalDueDate)}`,
                  },
                ]}
              />
            </div>
          </details>
        </section>
      ) : null}

      <section className="two-ten-answer-related" aria-label="Related invoice calculators">
        <div>
          <p className="two-ten-answer-section-eyebrow">Related invoice tools</p>
          <h2>Need a different payment term?</h2>
        </div>

        <nav>
          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            Invoice due date calculator
          </a>
          <a
            href="/net-30-due-date"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/net-30-due-date')
            }}
          >
            Net 30 due date
          </a>
        </nav>
      </section>

      <section className="two-ten-answer-content" aria-label="2/10 Net 30 help">
        <div className="two-ten-answer-content-heading">
          <p className="two-ten-answer-section-eyebrow">Payment-term rules</p>
          <h2>Discount window, final due date</h2>
        </div>

        <article>
          <h2>What does 2/10 Net 30 mean?</h2>
          <p>
            “2/10” is the early-payment discount: the buyer may take a 2%
            discount when paying within 10 days. “Net 30” is the final payment
            term: if the discount is not taken, the full invoice is due 30 days
            after the invoice date.
          </p>
        </article>

        <article>
          <h2>Example</h2>
          <p>
            For an invoice dated August 10, the discount deadline is August 20
            and the Net 30 due date is September 9 when both periods are counted
            as calendar days from the invoice date.
          </p>
        </article>

        <article>
          <h2>Do weekends and holidays change the dates?</h2>
          <p>
            Not automatically in this calculator. Some contracts or company
            policies move a payment date that lands on a weekend or holiday,
            while others do not. Use the written payment terms that apply to
            the invoice.
          </p>
        </article>

        <article>
          <h2>What this calculator does not calculate</h2>
          <p>
            It does not calculate late fees, interest, penalties, or legal
            payment rules. Those can depend on the contract and applicable law.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The invoice or contract controls the actual payment terms and any weekend, holiday, late-fee, or interest rules."
      />

      <style>{`
        .two-ten-answer-page {
          --two-ten-ink: #153553;
          --two-ten-muted: #687b8e;
          --two-ten-accent: #2d7b64;
          --two-ten-field: #f2e3d7;
          --two-ten-field-soft: #f8eee7;
          min-height: 100vh;
          background: #fffaf2;
        }

        .two-ten-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(21, 53, 83, 0.12);
        }

        .two-ten-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .two-ten-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .two-ten-answer-shell,
        .two-ten-answer-actions,
        .two-ten-answer-related,
        .two-ten-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .two-ten-answer-shell {
          margin-top: 22px;
        }

        .two-ten-answer-hero {
          padding: clamp(34px, 4.6vw, 52px) clamp(24px, 5vw, 58px) 28px;
          border: 1px solid rgba(112, 75, 52, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--two-ten-field);
          text-align: center;
        }

        .two-ten-answer-eyebrow,
        .two-ten-answer-section-eyebrow {
          margin: 0;
          color: var(--two-ten-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .two-ten-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--two-ten-ink);
          font-size: clamp(2.7rem, 5.5vw, 4.8rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .two-ten-answer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          max-width: 900px;
          margin: 24px auto 0;
        }

        .two-ten-answer-card {
          padding: 18px 20px;
          border: 1px solid rgba(21, 53, 83, 0.09);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.66);
        }

        .two-ten-answer-card.is-discount {
          border-color: rgba(45, 123, 100, 0.26);
          background: #e7f2ec;
        }

        .two-ten-answer-card.is-final {
          background: rgba(255, 255, 255, 0.72);
        }

        .two-ten-answer-card span,
        .two-ten-answer-card strong,
        .two-ten-answer-card b,
        .two-ten-answer-card small {
          display: block;
        }

        .two-ten-answer-card span {
          color: #5a7085;
          font-size: 0.84rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.055em;
        }

        .two-ten-answer-card strong {
          margin-top: 9px;
          color: #3c667b;
          font-size: clamp(1.65rem, 3vw, 2.5rem);
          line-height: 1;
        }

        .two-ten-answer-card b {
          margin-top: 4px;
          color: var(--two-ten-ink);
          font-size: clamp(2.2rem, 4.6vw, 4rem);
          line-height: 0.95;
          letter-spacing: -0.045em;
        }

        .two-ten-answer-card small {
          margin-top: 10px;
          color: #738497;
          font-size: 0.82rem;
        }

        .two-ten-answer-context {
          margin: 14px 0 0;
          color: var(--two-ten-muted);
          font-size: 0.92rem;
        }

        .two-ten-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 1.2fr);
          gap: 12px;
          align-items: end;
          padding: 15px 18px;
          border: 1px solid rgba(112, 75, 52, 0.12);
          border-top: 1px solid rgba(112, 75, 52, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--two-ten-field-soft);
        }

        .two-ten-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .two-ten-answer-controls label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .two-ten-answer-controls input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(21, 53, 83, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .two-ten-answer-definition {
          display: grid;
          gap: 4px;
          align-content: center;
          min-height: 50px;
          padding: 8px 12px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.62);
        }

        .two-ten-answer-definition strong {
          color: #214c64;
          font-size: 0.9rem;
        }

        .two-ten-answer-definition span {
          color: #687b8e;
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .two-ten-answer-actions {
          margin-top: 10px;
        }

        .two-ten-answer-actions > .result-actions {
          justify-content: center;
        }

        .two-ten-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(21, 53, 83, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .two-ten-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .two-ten-answer-detail-body {
          padding: 0 14px 16px;
        }

        .two-ten-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .two-ten-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .two-ten-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(21, 53, 83, 0.1);
          border-radius: 22px;
          background: #f4ece6;
        }

        .two-ten-answer-related h2,
        .two-ten-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--two-ten-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .two-ten-answer-related nav {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .two-ten-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(21, 53, 83, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .two-ten-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .two-ten-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .two-ten-answer-content article {
          padding: 21px;
          border: 1px solid rgba(21, 53, 83, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .two-ten-answer-content h2 {
          margin: 0;
          color: var(--two-ten-ink);
          font-size: 1.08rem;
        }

        .two-ten-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .two-ten-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .two-ten-answer-brand img {
            width: 154px;
          }

          .two-ten-answer-shell,
          .two-ten-answer-actions,
          .two-ten-answer-related,
          .two-ten-answer-content {
            width: min(100% - 24px, 680px);
          }

          .two-ten-answer-shell {
            margin-top: 14px;
          }

          .two-ten-answer-hero {
            padding: 22px 18px 20px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .two-ten-answer-hero h1 {
            font-size: clamp(2.15rem, 9.6vw, 3.2rem);
            line-height: 0.96;
          }

          .two-ten-answer-grid {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 16px;
          }

          .two-ten-answer-card {
            position: relative;
            padding: 13px 14px 13px 19px;
          }

          .two-ten-answer-card::before {
            content: '';
            position: absolute;
            top: 16px;
            bottom: 16px;
            left: 9px;
            width: 3px;
            border-radius: 999px;
            background: rgba(61, 104, 124, 0.28);
          }

          .two-ten-answer-card.is-discount::before {
            background: rgba(45, 123, 100, 0.74);
          }

          .two-ten-answer-card strong {
            font-size: clamp(1.55rem, 7.6vw, 2.3rem);
          }

          .two-ten-answer-card b {
            font-size: clamp(2rem, 9.6vw, 3.05rem);
          }

          .two-ten-answer-card small {
            margin-top: 7px;
            font-size: 0.76rem;
          }

          .two-ten-answer-context {
            margin-top: 10px;
            font-size: 0.84rem;
          }

          .two-ten-answer-controls {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .two-ten-answer-definition {
            min-height: auto;
          }

          .two-ten-answer-related {
            padding: 20px 18px;
          }

          .two-ten-answer-related nav {
            grid-template-columns: 1fr;
          }

          .two-ten-answer-content {
            display: block;
            margin-top: 28px;
          }

          .two-ten-answer-content-heading {
            margin-bottom: 8px;
          }

          .two-ten-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(21, 53, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .two-ten-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
function InvoiceDueDatePage({ onNavigate }: NavigationProps) {
  const [invoiceDate, setInvoiceDate] = useState(() => getInitialDateQueryParam('date', todayInputValue()))
  const [invoiceTerm, setInvoiceTerm] = useState<InvoiceTerm>(() =>
    getInitialInvoiceTermQueryParam('term', 'net30'),
  )
  const [title, setTitle] = useState(getDefaultTitle('invoice'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedInvoiceDate = parsePlainDate(invoiceDate)
  const validationMessage = getValidationMessage('invoice', parsedInvoiceDate, 0, title)
  const titleValidationMessage = getSaveTitleValidationMessage(title)
  const invoiceDueDate = parsedInvoiceDate && !validationMessage
    ? getDueDateForMode('invoice', parsedInvoiceDate, 0, invoiceTerm)
    : null
  const calendarDaysFromInvoice = parsedInvoiceDate && invoiceDueDate
    ? daysBetween(parsedInvoiceDate, invoiceDueDate)
    : 0
  const canSave = Boolean(invoiceDueDate && parsedInvoiceDate && !validationMessage && !titleValidationMessage)

  useEffect(() => {
    syncShareableQueryParams({ date: invoiceDate, term: invoiceTerm })
  }, [invoiceDate, invoiceTerm])

  function saveInvoiceDeadline() {
    if (!invoiceDueDate || !parsedInvoiceDate || titleValidationMessage) {
      return
    }

    const nextDeadline: SavedDeadline = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: 'invoice',
      dueDate: toDateKey(invoiceDueDate),
      startDate: toDateKey(parsedInvoiceDate),
      done: false,
      createdAt: new Date().toISOString(),
    }

    if (isDuplicateSavedDeadline(savedDeadlines, nextDeadline)) {
      setStorageMessage('This due date is already saved.')
      return
    }

    const nextDeadlines = [nextDeadline, ...savedDeadlines]
    const storageResult = saveSavedDeadlines(nextDeadlines)

    if (!storageResult.ok) {
      setStorageMessage(storageResult.message)
      return
    }

    setSavedDeadlines(nextDeadlines)
    setStorageMessage('Saved to My due dates.')
  }

  const quickInvoiceTerms: Array<{ term: InvoiceTerm; label: string }> = [
    { term: 'net7', label: 'Net 7' },
    { term: 'net15', label: 'Net 15' },
    { term: 'net30', label: 'Net 30' },
    { term: 'net45', label: 'Net 45' },
    { term: 'net60', label: 'Net 60' },
    { term: 'net90', label: 'Net 90' },
    { term: 'eom', label: 'EOM' },
  ]

  return (
    <main className="page-shell invoice-due-date-page invoice-answer-first-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="invoice-answer-hero" aria-labelledby="invoice-due-date-title" aria-live="polite">
        <p className="invoice-answer-eyebrow">Invoice due date</p>
        <h1 id="invoice-due-date-title">Your invoice is due</h1>

        {invoiceDueDate && parsedInvoiceDate ? (
          <>
            <strong className="invoice-answer-date" aria-label={`${formatWeekday(invoiceDueDate)}, ${formatPlainDate(invoiceDueDate)}`}>
              <span className="invoice-answer-weekday">{formatWeekday(invoiceDueDate)},</span>
              <span className="invoice-answer-date-main" aria-hidden="true">
                <span className="invoice-answer-month">
                  {new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(invoiceDueDate.year, invoiceDueDate.month - 1, invoiceDueDate.day)))}
                </span>
                <span className="invoice-answer-day">{invoiceDueDate.day}</span>
                <span className="invoice-answer-comma">,</span>
                <span className="invoice-answer-year">{invoiceDueDate.year}</span>
              </span>
            </strong>
            <p className="invoice-answer-context">
              {invoiceTermLabels[invoiceTerm]} · Invoice dated {formatPlainDate(parsedInvoiceDate)}
            </p>
          </>
        ) : (
          <p className="invoice-answer-error">{validationMessage ?? 'Enter a valid invoice date.'}</p>
        )}
      </section>

      <section className="invoice-answer-controls" aria-label="Change invoice due date calculation">
        <form className="invoice-answer-form" onSubmit={(event) => event.preventDefault()}>
            <label className="field start-field">
              <span>Invoice date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={invoiceDate}
                onChange={(event) => {
                  setInvoiceDate(event.target.value)
                  trackWhenIsDueEvent('date_changed', { context: 'invoice_due_date', value: event.target.value })
                }}
              />
            </label>

            <div className="invoice-term-presets" aria-label="Quick payment term choices">
              {quickInvoiceTerms.map(({ term, label }) => (
                <button
                  className={invoiceTerm === term ? 'is-active' : ''}
                  key={term}
                  type="button"
                  aria-pressed={invoiceTerm === term}
                  onClick={() => {
                    setInvoiceTerm(term)
                    trackWhenIsDueEvent('term_changed', { context: 'invoice_due_date_preset', value: term })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>
      </section>

      {invoiceDueDate && parsedInvoiceDate ? (
        <section className="invoice-answer-support" aria-label="Invoice due date actions and details">
          <ResultActions
            title="Invoice due date"
            date={invoiceDueDate}
            details={invoiceTermLabels[invoiceTerm]}
          />

          <details className="invoice-answer-detail-card">
            <summary>Why this date?</summary>
            <div className="invoice-answer-detail-body">
              <p>{formatInvoiceTermExplanation(parsedInvoiceDate, invoiceTerm, invoiceDueDate)}</p>
              <CalculationReceipt
                analyticsContext="invoice_due_date"
                rows={[
                  { label: 'Invoice date', value: `${formatWeekday(parsedInvoiceDate)}, ${formatPlainDate(parsedInvoiceDate)}` },
                  { label: 'Payment terms', value: invoiceTermLabels[invoiceTerm] },
                  {
                    label: 'Counting rule',
                    value: invoiceTerm === 'eom'
                      ? 'Last calendar day of the invoice month'
                      : `${calendarDaysFromInvoice} calendar ${calendarDaysFromInvoice === 1 ? 'day' : 'days'} after invoice date`,
                  },
                  { label: 'Due date', value: `${formatWeekday(invoiceDueDate)}, ${formatPlainDate(invoiceDueDate)}` },
                ]}
              />
            </div>
          </details>

          <details className="invoice-answer-detail-card">
            <summary>Save this date</summary>
            <div className="invoice-answer-detail-body business-save">
              <label className="field title-field">
                <span>Title</span>
                <input
                  maxLength={titleMaxLength}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                {titleValidationMessage ? <span className="field-error">{titleValidationMessage}</span> : null}
              </label>
              <button className="primary-button" type="button" disabled={!canSave} onClick={saveInvoiceDeadline}>
                Save to My due dates
              </button>
              {storageMessage ? <p className="form-message">{storageMessage}</p> : null}
            </div>
          </details>
        </section>
      ) : null}

      <section className="invoice-term-links" aria-label="Exact invoice term pages">
        <div>
          <p className="invoice-section-eyebrow">Exact payment terms</p>
          <h2>Jump straight to a Net due date</h2>
        </div>

        <nav>
          {[7, 15, 30, 45, 60, 90].map((term) => {
            const path = `/net-${term}-due-date`

            return (
              <a
                href={path}
                key={term}
                onClick={(event) => {
                  event.preventDefault()
                  trackWhenIsDueEvent('related_invoice_term_click', { term, path })
                  onNavigate(path)
                }}
              >
                Net {term} <span aria-hidden="true">→</span>
              </a>
            )
          })}
        </nav>
      </section>

      <section className="business-content invoice-editorial-content" aria-label="Invoice due date help">
        <div className="invoice-content-heading">
          <p className="invoice-section-eyebrow">Invoice due-date rules</p>
          <h2>Issued, terms, due</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the invoice date and choose the payment terms. The calculator uses the same Net 7, Net 15, Net 30, Net 45, Net 60, Net 90, and EOM rules as the homepage calculator.
          </p>
        </article>

        <article>
          <h2>Net 30 calculation example</h2>
          <p>
            If an invoice is dated July 1 with Net 30 terms, this calculator adds 30 calendar days and shows July 31 as the due date. The invoice date is treated as day zero. The written invoice or contract controls if it uses a different counting method.
          </p>
        </article>

        <article>
          <h2>Calendar days, business days, and EOM</h2>
          <p>
            This calculator treats Net terms such as 30 as calendar days and supports EOM by returning the last calendar day of the invoice month. It does not automatically skip weekends or holidays. Some agreements use different month-end rules, such as EOM + 15 or a fixed day of the following month, so always confirm the exact invoice or contract wording.
          </p>
        </article>

        <article>
          <h2>Have 2/10 Net 30 terms?</h2>
          <p>
            Use the{' '}
            <a
              href="/2-10-net-30-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/2-10-net-30-calculator')
              }}
            >
              2/10 Net 30 calculator
            </a>{' '}
            to see both the 2% early-payment discount deadline and the final Net 30 due date.
          </p>
        </article>

        <article>
          <h2>Invoice due date FAQ</h2>
          <dl>
            <dt>What does Net 30 mean?</dt>
            <dd>It commonly means payment is due 30 days after the invoice date, but the contract or invoice may define the starting day and counting method differently.</dd>

            <dt>Are Net 30 terms calendar days or business days?</dt>
            <dd>Calendar days are commonly used unless the agreement specifically says business days. Confirm the written terms.</dd>

            <dt>What if the due date falls on a weekend or holiday?</dt>
            <dd>This calculator leaves the date unchanged. The contract, company policy, or applicable rules may determine whether payment moves to another day.</dd>

            <dt>Does this calculator handle EOM terms?</dt>
            <dd>Yes. The EOM option returns the last calendar day of the invoice month. It does not currently calculate variations such as EOM + 15 or other custom month-end terms.</dd>
          </dl>
        </article>

        <article>
          <h2>Need business-day terms instead?</h2>
          <p>
            If the payment terms specifically use working days, use the{' '}
            <a
              href="/business-days-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/business-days-calculator')
              }}
            >
              Business Days Calculator
            </a>
            .
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The invoice or contract controls the actual payment terms and any weekend, holiday, late-fee, or interest rules."
      />

      <style>{`
        .invoice-editorial-page {
          --invoice-navy: #17385f;
          --invoice-deep: #112c4d;
          --invoice-green: #2d7c67;
          --invoice-ivory: #fbf6ec;
          --invoice-silver: #eef0ef;
          --invoice-graphite: #2d3439;
        }

        .invoice-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 44, 77, 0.12);
        }

        .invoice-editorial-brand {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          text-decoration: none;
        }

        .invoice-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .invoice-editorial-nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 18px;
          min-width: 0;
        }

        .invoice-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .invoice-editorial-hero,
        .invoice-editorial-workspace,
        .invoice-term-links,
        .invoice-editorial-content {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .invoice-editorial-image-wrap {
          position: relative;
          min-height: 480px;
          overflow: hidden;
          border: 1px solid rgba(17, 44, 77, 0.12);
          border-radius: 28px;
          background: #cfd2d2;
        }

        .invoice-editorial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .invoice-editorial-image-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(7, 17, 29, 0.2) 0%,
            rgba(7, 17, 29, 0.06) 38%,
            rgba(7, 17, 29, 0) 68%
          );
          pointer-events: none;
        }

        .invoice-editorial-answer {
          position: relative;
          z-index: 1;
          width: min(470px, calc(100% - 64px));
          margin: 32px;
          padding: 34px 34px 30px;
          border: 1px solid rgba(255, 255, 255, 0.52);
          border-radius: 24px;
          background: rgba(250, 247, 239, 0.94);
          box-shadow: 0 18px 55px rgba(11, 24, 39, 0.16);
          backdrop-filter: blur(10px);
        }

        .invoice-editorial-eyebrow,
        .invoice-section-eyebrow {
          margin: 0;
          color: var(--invoice-green);
          font-size: 0.79rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .invoice-editorial-answer h1 {
          margin: 10px 0 0;
          color: var(--invoice-deep);
          font-size: clamp(2.7rem, 5.2vw, 4.7rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .invoice-editorial-primary-answer {
          display: grid;
          gap: 4px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(17, 44, 77, 0.12);
        }

        .invoice-editorial-primary-answer span {
          color: #65788d;
          font-size: 0.95rem;
          font-weight: 850;
        }

        .invoice-editorial-primary-answer strong {
          color: var(--invoice-deep);
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .invoice-editorial-primary-answer small {
          color: #58708a;
          font-size: 1rem;
          font-weight: 800;
        }

        .invoice-editorial-path {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 0.8fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid rgba(17, 44, 77, 0.1);
        }

        .invoice-editorial-path span {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .invoice-editorial-path small {
          color: #8090a0;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .invoice-editorial-path b {
          overflow: hidden;
          color: #304c67;
          font-size: 0.78rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .invoice-editorial-path i {
          color: #9aa5ae;
          font-style: normal;
        }

        .invoice-editorial-error {
          margin: 20px 0 0;
          color: #7b4a28;
          line-height: 1.5;
        }

        .invoice-editorial-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17, 44, 77, 0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .invoice-custom-heading h2,
        .invoice-term-links h2,
        .invoice-content-heading h2 {
          margin: 6px 0 0;
          color: var(--invoice-deep);
          font-size: clamp(2rem, 3.8vw, 3.25rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .invoice-custom-heading > p:last-child {
          margin: 8px 0 0;
          color: #6c7e91;
          font-size: 1rem;
        }

        .invoice-editorial-calculation-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1.28fr);
          gap: 16px;
          margin-top: 22px;
        }

        .invoice-editorial-form {
          display: grid;
          gap: 15px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17, 44, 77, 0.1);
          border-radius: 18px;
          background: #f3f0e9;
        }

        .invoice-editorial-form .field {
          display: grid;
          gap: 7px;
        }

        .invoice-editorial-form .field > span {
          color: #566f87;
          font-size: 0.9rem;
          font-weight: 900;
        }

        .invoice-editorial-form input,
        .invoice-editorial-form select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17, 44, 77, 0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .invoice-term-presets {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .invoice-term-presets button {
          min-height: 42px;
          padding: 7px 8px;
          border: 1px solid rgba(17, 44, 77, 0.14);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.76);
          color: #455f78;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .invoice-term-presets button.is-active {
          border-color: rgba(45, 124, 103, 0.62);
          background: #e9f4ef;
          color: #1d6655;
          box-shadow: inset 0 0 0 1px rgba(45, 124, 103, 0.22);
        }

        .invoice-editorial-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--invoice-deep);
          color: #f8f1e6;
        }

        .invoice-result-kicker {
          margin: 0;
          color: #9ec4b3;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .invoice-result-date {
          margin: 10px 0 0;
          color: #fff8ec;
          font-size: clamp(3.6rem, 7vw, 6.5rem);
          font-weight: 850;
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .invoice-result-weekday {
          margin: 10px 0 0;
          color: #d5dfea;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .invoice-result-term {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 16px;
        }

        .invoice-result-term span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223, 189, 122, 0.6);
          border-radius: 999px;
          background: #fff7e8;
          color: #7c4f24;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .invoice-result-term small {
          color: #c6d2df;
          font-size: 0.88rem;
        }

        .invoice-result-note {
          max-width: 720px;
          margin: 20px 0 0;
          color: #d0d9e2;
          font-size: 0.96rem;
          line-height: 1.55;
        }

        .invoice-editorial-result .calculation-receipt {
          margin-top: 20px;
        }

        .invoice-editorial-result .result-actions {
          margin-top: 16px;
        }

        .invoice-save-details {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          color: #e7edf3;
        }

        .invoice-save-details summary {
          cursor: pointer;
          font-weight: 850;
        }

        .invoice-term-links {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17, 44, 77, 0.1);
          border-radius: 24px;
          background: #edf1f2;
        }

        .invoice-term-links > div {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .invoice-term-links h2 {
          font-size: clamp(1.9rem, 3.2vw, 2.8rem);
        }

        .invoice-term-links nav {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin-top: 18px;
        }

        .invoice-term-links a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 58px;
          padding: 11px 13px;
          border: 1px solid rgba(17, 44, 77, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .invoice-term-links a span {
          color: var(--invoice-green);
          font-size: 1.05rem;
        }

        .invoice-editorial-content {
          margin-top: 40px;
        }

        .invoice-content-heading {
          margin-bottom: 18px;
        }

        .invoice-editorial-content article {
          border-color: rgba(17, 44, 77, 0.09);
        }

        @media (max-width: 760px) {
          .invoice-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .invoice-editorial-brand img {
            width: 154px;
          }

          .invoice-editorial-nav {
            gap: 12px;
          }

          .invoice-editorial-nav a {
            font-size: 0.8rem;
          }

          .invoice-editorial-home-link {
            display: none;
          }

          .invoice-editorial-hero,
          .invoice-editorial-workspace,
          .invoice-term-links,
          .invoice-editorial-content {
            width: min(100% - 24px, 680px);
          }

          .invoice-editorial-image-wrap {
            min-height: 470px;
            border-radius: 24px;
          }

          .invoice-editorial-image {
            object-position: 62% 68%;
          }

          .invoice-editorial-image-wrap::after {
            background: linear-gradient(
              180deg,
              rgba(7, 17, 29, 0.03) 0%,
              rgba(7, 17, 29, 0.02) 45%,
              rgba(7, 17, 29, 0.16) 100%
            );
          }

          .invoice-editorial-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
            margin: 0;
            padding: 18px 18px 16px;
            border-radius: 18px;
          }

          .invoice-editorial-answer h1 {
            margin-top: 7px;
            font-size: clamp(2.05rem, 9.2vw, 2.8rem);
            line-height: 0.98;
          }

          .invoice-editorial-primary-answer {
            margin-top: 14px;
            padding-top: 12px;
          }

          .invoice-editorial-primary-answer strong {
            font-size: clamp(1.9rem, 8.8vw, 2.55rem);
          }

          .invoice-editorial-path {
            grid-template-columns: 1fr auto 0.82fr auto 1fr;
            gap: 5px;
            margin-top: 16px;
            padding-top: 13px;
          }

          .invoice-editorial-path b {
            font-size: 0.68rem;
          }

          .invoice-editorial-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .invoice-custom-heading h2,
          .invoice-content-heading h2 {
            font-size: clamp(2rem, 9vw, 2.75rem);
          }

          .invoice-custom-heading > p:last-child {
            font-size: 0.94rem;
            line-height: 1.45;
          }

          .invoice-editorial-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .invoice-editorial-form {
            padding: 18px;
            border-radius: 16px;
          }

          .invoice-term-presets {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
          }

          .invoice-term-presets button {
            min-height: 40px;
            padding: 6px 5px;
            font-size: 0.74rem;
          }

          .invoice-editorial-result {
            padding: 22px 18px 18px;
            border-radius: 18px;
          }

          .invoice-result-date {
            font-size: clamp(2.85rem, 11.2vw, 4.1rem);
            line-height: 0.94;
          }

          .invoice-result-note {
            margin-top: 16px;
            font-size: 0.9rem;
            line-height: 1.45;
          }

          .invoice-editorial-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 14px;
          }

          .invoice-editorial-result .result-actions button,
          .invoice-editorial-result .result-actions a {
            min-height: 46px;
            width: 100%;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .invoice-editorial-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .invoice-term-links {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .invoice-term-links > div {
            display: block;
          }

          .invoice-term-links h2 {
            margin-top: 5px;
            font-size: clamp(1.8rem, 8vw, 2.35rem);
          }

          .invoice-term-links nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
            margin-top: 14px;
          }

          .invoice-term-links a {
            min-height: 52px;
          }

          .invoice-editorial-content {
            margin-top: 28px;
          }

          .invoice-editorial-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17, 44, 77, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .invoice-editorial-content article h2 {
            font-size: 1.18rem;
            line-height: 1.25;
          }

          .invoice-editorial-content article p,
          .invoice-editorial-content article dd,
          .invoice-editorial-content article li {
            color: #66798d;
            font-size: 0.92rem;
            line-height: 1.5;
          }

          .invoice-editorial-content article dl {
            margin-top: 12px;
          }

          .invoice-editorial-content article dt {
            margin-top: 14px;
            color: #172c47;
            font-size: 0.94rem;
            line-height: 1.32;
          }
        }

        @media (max-width: 430px) {
          .invoice-editorial-brand img {
            width: 142px;
          }

          .invoice-editorial-nav {
            gap: 10px;
          }

          .invoice-editorial-nav a {
            font-size: 0.76rem;
          }

          .invoice-editorial-image-wrap {
            min-height: 450px;
          }

          .invoice-editorial-answer {
            left: 14px;
            right: 14px;
            bottom: 14px;
            padding: 17px 16px 15px;
          }

          .invoice-editorial-eyebrow {
            font-size: 0.72rem;
            letter-spacing: 0.12em;
          }

          .invoice-editorial-primary-answer span {
            font-size: 0.85rem;
          }

          .invoice-editorial-primary-answer small {
            font-size: 0.9rem;
          }

          .invoice-editorial-path {
            display: none;
          }

          .invoice-term-presets {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .invoice-answer-first-page {
          --invoice-ink: #112c4d;
          --invoice-muted: #63778b;
          --invoice-accent: #2d7c67;
          --invoice-paper: #f1e4cf;
          --invoice-answer-field: #ead9bb;
          --invoice-answer-field-soft: #f3e7d4;
          min-height: 100vh;
          background: #fffaf2;
        }

        .invoice-answer-header,
        .invoice-answer-hero,
        .invoice-answer-controls,
        .invoice-answer-support,
        .invoice-answer-first-page .invoice-term-links,
        .invoice-answer-first-page .invoice-editorial-content {
          width: min(100% - 32px, 1040px);
          margin-left: auto;
          margin-right: auto;
        }

        .invoice-answer-header {
          min-height: 70px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(17, 44, 77, 0.12);
        }

        .invoice-answer-brand {
          display: inline-flex;
          align-items: center;
        }

        .invoice-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .invoice-answer-hero {
          margin-top: 22px;
          padding: clamp(42px, 7vw, 72px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(112, 82, 42, 0.12);
          border-radius: 28px 28px 0 0;
          background: var(--invoice-answer-field);
          text-align: center;
        }

        .invoice-answer-eyebrow {
          margin: 0;
          color: var(--invoice-accent);
          font-size: 0.77rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .invoice-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--invoice-ink);
          font-size: clamp(2.4rem, 5vw, 4.6rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .invoice-answer-date {
          display: grid;
          justify-items: center;
          max-width: 100%;
          margin: 25px auto 0;
          color: var(--invoice-ink);
          font-weight: 900;
          text-align: center;
        }

        .invoice-answer-weekday {
          display: block;
          color: #315b75;
          font-size: clamp(2.8rem, 4.5vw, 4.25rem);
          font-weight: 850;
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .invoice-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.9rem, 6.35vw, 6rem);
          line-height: 0.92;
          letter-spacing: -0.06em;
          white-space: nowrap;
        }

        .invoice-answer-month,
        .invoice-answer-day,
        .invoice-answer-comma,
        .invoice-answer-year {
          display: inline;
        }

        .invoice-answer-comma {
          margin-left: -0.08em;
        }

        .invoice-answer-context,
        .invoice-answer-error {
          margin: 18px 0 0;
          color: #65758a;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .invoice-answer-error {
          color: #7b4a28;
        }

        .invoice-answer-controls {
          padding: 18px;
          border: 1px solid rgba(112, 82, 42, 0.12);
          border-top: 1px solid rgba(112, 82, 42, 0.1);
          border-radius: 0 0 28px 28px;
          background: var(--invoice-answer-field-soft);
        }

        .invoice-answer-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(300px, 1.35fr);
          gap: 12px;
          align-items: end;
        }

        .invoice-answer-form .field {
          display: grid;
          gap: 6px;
        }

        .invoice-answer-form .field > span {
          color: #526b83;
          font-size: 0.84rem;
          font-weight: 850;
        }

        .invoice-answer-form input,
        .invoice-answer-form select {
          width: 100%;
          min-height: 46px;
          box-sizing: border-box;
          padding: 8px 10px;
          border: 1px solid rgba(17, 44, 77, 0.16);
          border-radius: 9px;
          background: #fff;
          color: #17304d;
          font: inherit;
        }

        .invoice-answer-form .invoice-term-presets {
          grid-column: 1 / -1;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }

        .invoice-answer-form .invoice-term-presets button {
          min-height: 38px;
          padding: 5px 7px;
          border-radius: 8px;
          font-size: 0.78rem;
        }

        .invoice-answer-form .form-message {
          grid-column: 1 / -1;
          margin: 0;
        }

        .invoice-answer-support {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .invoice-answer-support .result-actions {
          justify-content: center;
          margin: 0;
        }

        .invoice-answer-detail-card {
          border: 1px solid rgba(17, 44, 77, 0.1);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.68);
        }

        .invoice-answer-detail-card summary {
          padding: 13px 15px;
          color: #24425e;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .invoice-answer-detail-body {
          padding: 0 15px 15px;
          color: var(--invoice-muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .invoice-answer-detail-body > p:first-child {
          margin-top: 0;
        }

        .invoice-answer-detail-body .calculation-receipt {
          margin-top: 14px;
        }

        .invoice-answer-first-page .invoice-term-links {
          margin-top: 28px;
          padding: 20px 22px;
          border-radius: 16px;
          background: #edf1ee;
        }

        .invoice-answer-first-page .invoice-editorial-content {
          margin-top: 34px;
        }

        @media (max-width: 760px) {
          .invoice-answer-header,
          .invoice-answer-hero,
          .invoice-answer-controls,
          .invoice-answer-support,
          .invoice-answer-first-page .invoice-term-links,
          .invoice-answer-first-page .invoice-editorial-content {
            width: min(100% - 24px, 680px);
          }

          .invoice-answer-header {
            min-height: 58px;
          }

          .invoice-answer-brand img {
            width: 154px;
          }

          .invoice-answer-hero {
            margin-top: 14px;
            padding: 32px 18px 28px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .invoice-answer-hero h1 {
            font-size: clamp(2.2rem, 10vw, 3.2rem);
          }

          .invoice-answer-date {
            justify-items: start;
            margin-top: 20px;
            text-align: left;
          }

          .invoice-answer-weekday {
            margin-bottom: 9px;
            font-size: clamp(2.35rem, 10.5vw, 3.2rem);
            line-height: 0.96;
          }

          .invoice-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            margin-top: 0;
            font-size: clamp(3.1rem, 15vw, 5rem);
            line-height: 0.88;
            white-space: normal;
          }

          .invoice-answer-month,
          .invoice-answer-day,
          .invoice-answer-year {
            display: block;
          }

          .invoice-answer-comma {
            display: none;
          }

          .invoice-answer-context {
            margin-top: 16px;
            font-size: 0.9rem;
          }

          .invoice-answer-controls {
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .invoice-answer-form {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .invoice-answer-form .invoice-term-presets {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .invoice-answer-form .invoice-term-presets button {
            min-height: 36px;
            padding: 5px 4px;
            font-size: 0.74rem;
          }

          .invoice-answer-support {
            margin-top: 14px;
          }

          .invoice-answer-support .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .invoice-answer-support .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .invoice-answer-first-page .invoice-term-links {
            margin-top: 22px;
            padding: 18px 14px;
          }

          .invoice-answer-first-page .invoice-editorial-content {
            margin-top: 28px;
          }
        }
      `}</style>
    </main>
  )
}


type InvoiceTermPageProps = NavigationProps & {
  dayCount: 7 | 15 | 30 | 45 | 60 | 90
  term: Extract<InvoiceTerm, 'net7' | 'net15' | 'net30' | 'net45' | 'net60' | 'net90'>
}

function InvoiceTermPage({ dayCount, term, onNavigate }: InvoiceTermPageProps) {
  const [invoiceDate, setInvoiceDate] = useState(() => getInitialDateQueryParam('date', todayInputValue()))
  const parsedInvoiceDate = parsePlainDate(invoiceDate)
  const dueDate = parsedInvoiceDate
    ? getDueDateForMode('invoice', parsedInvoiceDate, 0, term)
    : null
  const relatedTerms = [7, 15, 30, 45, 60, 90]
    .filter((days) => days !== dayCount)
    .slice(0, 4)

  useEffect(() => {
    syncShareableQueryParams({ date: invoiceDate })
  }, [invoiceDate])

  return (
    <main className="page-shell net-term-page">
      <section className="net-term-hero" aria-labelledby={`net-${dayCount}-title`}>
        <CalculatorPageHeader onNavigate={onNavigate} />

        <div className="net-term-answer">
          <p className="net-term-kicker">Net {dayCount} due date</p>

          <label className="net-term-date-input">
            <span>Invoice date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={invoiceDate}
              onChange={(event) => {
                setInvoiceDate(event.target.value)
                trackWhenIsDueEvent('date_changed', { context: `net_${dayCount}`, value: event.target.value })
              }}
            />
          </label>

          {dueDate ? (
            <>
              <h1 id={`net-${dayCount}-title`} className="net-term-date">
                {formatPlainDate(dueDate)}
              </h1>
              <p className="net-term-weekday">{formatWeekday(dueDate)}</p>
              <p className="net-term-rule">
                Net {dayCount} · {dayCount} calendar days after the invoice date
              </p>
              <p className="net-term-note">
                Weekends and public holidays do not change this date unless your invoice or contract says otherwise.
              </p>
              <p className="net-citation-explanation">
                {formatNetTermExplanation(
                  parsedInvoiceDate!,
                  dayCount,
                  dueDate,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="net_term"
                rows={[
                  { label: 'Invoice date', value: `${formatWeekday(parsedInvoiceDate!)}, ${formatPlainDate(parsedInvoiceDate!)}` },
                  { label: 'Payment terms', value: `Net ${dayCount}` },
                  { label: 'Counting rule', value: `${dayCount} calendar days after invoice date` },
                  { label: 'Weekend handling', value: 'No automatic adjustment' },
                  { label: 'Public holidays', value: 'No automatic adjustment' },
                  { label: 'Due date', value: `${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}` },
                ]}
              />
              <ResultActions
                title={`Net ${dayCount} invoice due date`}
                date={dueDate}
                details={`${dayCount} calendar days after the invoice date`}
              />
            </>
          ) : (
            <h1 id={`net-${dayCount}-title`} className="net-term-date net-term-date-error">
              Enter a valid invoice date
            </h1>
          )}
        </div>
      </section>

      <section className="net-term-related" aria-labelledby={`net-${dayCount}-related`}>
        <div className="net-term-related-heading">
          <h2 id={`net-${dayCount}-related`}>Other common invoice terms</h2>
          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            Custom terms
          </a>
        </div>

        <div className="net-term-grid">
          {relatedTerms.map((days) => {
            const relatedDate = parsedInvoiceDate
              ? getDueDateForMode('invoice', parsedInvoiceDate, 0, `net${days}` as InvoiceTerm)
              : null

            return (
              <a
                key={days}
                href={`/net-${days}-due-date?date=${invoiceDate}`}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(`/net-${days}-due-date?date=${invoiceDate}`)
                }}
              >
                <span>Net {days}</span>
                <strong>{relatedDate ? formatPlainDate(relatedDate) : 'Choose a date'}</strong>
              </a>
            )
          })}
        </div>
      </section>

      <section className="net-term-explanation">
        <h2>What does Net {dayCount} mean?</h2>
        <p>
          Net {dayCount} commonly means an invoice is due {dayCount} calendar days after the invoice date.
          This page treats the invoice date as day zero. Your written invoice or contract controls if it
          specifies business days, a different starting rule, or a weekend or holiday adjustment.
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .net-term-hero {
          width: min(100% - 32px, 1240px);
          min-height: 78vh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .net-term-header {
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .net-term-header a {
          color: #647990;
          font-size: 0.78rem;
          font-weight: 800;
          text-decoration: none;
        }

        .net-term-brand {
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .net-term-answer {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 12px 44px;
        }

        .net-term-kicker {
          margin: 0 0 13px;
          color: #526b87;
          font-size: clamp(1.25rem, 2.5vw, 1.95rem);
          font-weight: 900;
        }

        .net-term-date-input {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #75879b;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .net-term-date-input input {
          min-height: 42px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.16);
          border-radius: 8px;
          background: #fff;
          color: #1a314c;
          font: inherit;
          font-size: 0.88rem;
        }

        .net-term-date {
          margin: 0;
          max-width: 100%;
          color: #0b1830;
          font-size: clamp(4.4rem, 10vw, 8.8rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .net-term-date-error {
          font-size: clamp(2.2rem, 5vw, 4rem);
        }

        .net-term-weekday {
          margin: 16px 0 0;
          color: #546a83;
          font-size: clamp(1.5rem, 3vw, 2.4rem);
        }

        .net-citation-explanation {
          max-width: 660px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .net-term-rule {
          margin: 14px 0 0;
          color: #60758e;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .net-term-note {
          max-width: 650px;
          margin: 7px 0 0;
          color: #8894a3;
          font-size: 0.75rem;
          line-height: 1.45;
        }

        .net-term-related,
        .net-term-explanation {
          width: min(100% - 32px, 1080px);
          margin: 0 auto;
        }

        .net-term-related {
          padding: 36px 0 46px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .net-term-related-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .net-term-related-heading h2,
        .net-term-explanation h2 {
          margin: 0;
          color: #18304c;
          font-size: 1.25rem;
        }

        .net-term-related-heading a {
          color: #687d95;
          font-size: 0.78rem;
          font-weight: 800;
          text-decoration: none;
        }

        .net-term-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .net-term-grid a {
          min-height: 94px;
          padding: 13px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 9px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
          background: #fff;
        }

        .net-term-grid span {
          color: #71849a;
          font-size: 0.74rem;
          font-weight: 900;
        }

        .net-term-grid strong {
          margin-top: 5px;
          color: #142945;
          font-size: 1rem;
          line-height: 1.15;
        }

        .net-term-explanation {
          padding: 8px 0 56px;
        }

        .net-term-explanation p {
          max-width: 760px;
          color: #60748a;
          line-height: 1.65;
        }

        @media (max-width: 760px) {
          .net-term-hero {
            width: min(100% - 24px, 1240px);
            min-height: 72vh;
          }

          .net-term-header {
            min-height: 52px;
          }

          .net-term-answer {
            padding: 24px 0 34px;
          }

          .net-term-date-input {
            flex-direction: column;
            gap: 5px;
            margin-bottom: 18px;
          }

          .net-term-date {
            font-size: clamp(3.5rem, 17vw, 5.5rem);
            line-height: 0.98;
          }

          .net-term-weekday {
            margin-top: 11px;
            font-size: 1.6rem;
          }

          .net-term-related,
          .net-term-explanation {
            width: min(100% - 24px, 1080px);
          }

          .net-term-grid {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .net-term-grid a {
            min-height: 80px;
          }
        }
      `}</style>
    </main>
  )
}



const WORKDAY_PREFERENCES_STORAGE_KEY = 'whenisdue:workday-preferences'

type WorkdayPreferences = {
  start: string
  end: string
}

function getSavedWorkdayPreferences(): WorkdayPreferences {
  try {
    const raw = window.localStorage.getItem(WORKDAY_PREFERENCES_STORAGE_KEY)
    if (!raw) return { start: '09:00', end: '17:00' }

    const parsed = JSON.parse(raw) as Partial<WorkdayPreferences>

    if (
      typeof parsed.start === 'string' &&
      typeof parsed.end === 'string' &&
      timeToMinutes(parsed.start) !== null &&
      timeToMinutes(parsed.end) !== null &&
      (timeToMinutes(parsed.end) ?? 0) > (timeToMinutes(parsed.start) ?? 0)
    ) {
      return {
        start: parsed.start,
        end: parsed.end,
      }
    }
  } catch {
    // Fall back to the default workday.
  }

  return { start: '09:00', end: '17:00' }
}

function saveWorkdayPreferences(preferences: WorkdayPreferences) {
  try {
    window.localStorage.setItem(
      WORKDAY_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // Local storage can be unavailable in strict privacy modes.
  }
}


function BusinessHoursDeadlinePage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(() =>
    getInitialDateQueryParam('date', todayInputValue()),
  )
  const [startTime, setStartTime] = useState(
    () => new URLSearchParams(window.location.search).get('time') ?? '09:00',
  )
  const [hours, setHours] = useState(() =>
    getInitialPositiveIntegerQueryParam('hours', '8', 1000),
  )
  const savedWorkdayPreferences = useMemo(getSavedWorkdayPreferences, [])
  const [workdayStart, setWorkdayStart] = useState(
    () =>
      new URLSearchParams(window.location.search).get('workstart') ??
      savedWorkdayPreferences.start,
  )
  const [workdayEnd, setWorkdayEnd] = useState(
    () =>
      new URLSearchParams(window.location.search).get('workend') ??
      savedWorkdayPreferences.end,
  )
  const [workdayPreferenceMessage, setWorkdayPreferenceMessage] =
    useState<string | null>(null)
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  const slaPresets = [
    { label: '4 hours', hours: '4' },
    { label: '8 hours', hours: '8' },
    { label: '16 hours', hours: '16' },
    { label: '24 hours', hours: '24' },
  ]

  const workdayPresets = [
    { label: '8 AM–4 PM', start: '08:00', end: '16:00' },
    { label: '9 AM–5 PM', start: '09:00', end: '17:00' },
    { label: '10 AM–6 PM', start: '10:00', end: '18:00' },
  ]

  function applyWorkdayPreset(start: string, end: string) {
    setWorkdayStart(start)
    setWorkdayEnd(end)
    setWorkdayPreferenceMessage(null)
    trackWhenIsDueEvent('workday_preset_applied', { start, end })
  }

  function saveCurrentWorkday() {
    const startMinutes = timeToMinutes(workdayStart)
    const endMinutes = timeToMinutes(workdayEnd)

    if (
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      setWorkdayPreferenceMessage('Choose a valid workday before saving.')
      return
    }

    saveWorkdayPreferences({ start: workdayStart, end: workdayEnd })
    setWorkdayPreferenceMessage('Workday saved on this device.')
    trackWhenIsDueEvent('workday_preference_saved', {
      start: workdayStart,
      end: workdayEnd,
    })
  }

  function resetSavedWorkday() {
    try {
      window.localStorage.removeItem(WORKDAY_PREFERENCES_STORAGE_KEY)
    } catch {
      // Ignore storage failures.
    }

    setWorkdayStart('09:00')
    setWorkdayEnd('17:00')
    setWorkdayPreferenceMessage('Reset to 9 AM–5 PM.')
    trackWhenIsDueEvent('workday_preference_reset')
  }

  const parsedStartDate = parsePlainDate(startDate)
  const parsedHours = parseInteger(hours)
  const workdayStartMinutes = timeToMinutes(workdayStart)
  const workdayEndMinutes = timeToMinutes(workdayEnd)

  const validationMessage =
    !parsedStartDate
      ? 'Choose a valid start date.'
      : parsedHours === null || parsedHours <= 0
        ? 'Enter a whole number of business hours greater than 0.'
        : workdayStartMinutes === null || workdayEndMinutes === null
          ? 'Choose valid workday times.'
          : workdayEndMinutes <= workdayStartMinutes
            ? 'Workday end must be later than workday start.'
            : null

  const result =
    !validationMessage && parsedStartDate && parsedHours !== null
      ? calculateBusinessHoursDeadline(
          parsedStartDate,
          startTime,
          parsedHours,
          workdayStart,
          workdayEnd,
          holidayCalendar,
        )
      : null

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  useEffect(() => {
    syncShareableQueryParams({
      date: startDate,
      time: startTime,
      hours,
      workstart: workdayStart,
      workend: workdayEnd,
      calendar: holidayCalendarQueryValue(holidayCalendar),
    })
  }, [startDate, startTime, hours, workdayStart, workdayEnd, holidayCalendar])

  return (
    <main className="page-shell sla-answer-page">
      <CalculatorPageHeader onNavigate={onNavigate} />

      <section className="sla-answer-shell" aria-labelledby="sla-answer-title">
        <div className="sla-answer-hero">
          <p className="sla-answer-eyebrow">Business hours / SLA calculator</p>

          {result && parsedStartDate && parsedHours !== null ? (
            <>
              <h1 id="sla-answer-title">This SLA is due</h1>
              <strong
                className="sla-answer-date"
                aria-label={`${formatWeekday(result.date)}, ${formatPlainDate(result.date)} at ${formatTime12Hour(result.time)}`}
              >
                <span className="sla-answer-weekday">
                  {formatWeekday(result.date)},
                </span>
                <span className="sla-answer-date-main" aria-hidden="true">
                  <span className="sla-answer-month">
                    {
                      [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                      ][result.date.month - 1]
                    }
                  </span>
                  <span className="sla-answer-day">{result.date.day}</span>
                  <span className="sla-answer-comma">,</span>
                  <span className="sla-answer-year">{result.date.year}</span>
                </span>
              </strong>

              <strong className="sla-answer-time">
                {formatTime12Hour(result.time)}
              </strong>

              <p className="sla-answer-context">
                {parsedHours} business {parsedHours === 1 ? 'hour' : 'hours'} from{' '}
                {formatTime12Hour(startTime)} on {formatPlainDate(parsedStartDate)}
              </p>

              <p className="sla-answer-rule">
                Using {formatTime12Hour(workdayStart)}–{formatTime12Hour(workdayEnd)}
                {' · '}
                {getHolidayCalendarOption(holidayCalendar).shortLabel}
              </p>
            </>
          ) : (
            <>
              <h1 id="sla-answer-title">When is this SLA due?</h1>
              <p className="sla-answer-context">
                Enter a valid start date, time, and number of business hours below.
              </p>
            </>
          )}
        </div>

        <form
          className="sla-answer-controls"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                trackWhenIsDueEvent('date_changed', {
                  context: 'business_hours_deadline',
                  value: event.target.value,
                })
              }}
            />
          </label>

          <label>
            <span>Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label>
            <span>Business hours</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              inputMode="numeric"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>

          <div
            className="sla-answer-quick-picks"
            aria-label="Common SLA hour presets"
          >
            {slaPresets.map((preset) => {
              const active = hours === preset.hours
              return (
                <button
                  type="button"
                  key={preset.hours}
                  className={active ? 'is-active' : ''}
                  aria-pressed={active}
                  onClick={() => {
                    setHours(preset.hours)
                    trackWhenIsDueEvent('quick_pick', {
                      context: 'business_hours_deadline',
                      value: preset.hours,
                    })
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {validationMessage ? (
            <p className="sla-answer-error" role="alert">
              {validationMessage}
            </p>
          ) : null}
        </form>
      </section>

      {result && parsedStartDate && parsedHours !== null ? (
        <section className="sla-answer-actions">
          <ResultActions
            title={`${parsedHours}-business-hour deadline`}
            date={result.date}
            time={result.time}
            details={`${formatTime12Hour(result.time)} · ${formatTime12Hour(workdayStart)}–${formatTime12Hour(workdayEnd)} workday · ${getHolidayCalendarOption(holidayCalendar).shortLabel}`}
            variant="return-window"
          />

          <details className="sla-answer-details">
            <summary>Why this date and time?</summary>
            <div className="sla-answer-detail-body">
              <p>
                {formatBusinessHoursExplanation(
                  parsedStartDate,
                  startTime,
                  parsedHours,
                  workdayStart,
                  workdayEnd,
                  holidayCalendar,
                  result.date,
                  result.time,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="business_hours_deadline"
                rows={[
                  {
                    label: 'Start',
                    value: `${formatPlainDate(parsedStartDate)} · ${formatTime12Hour(startTime)}`,
                  },
                  {
                    label: 'Business hours added',
                    value: String(parsedHours),
                  },
                  {
                    label: 'Workday',
                    value: `${formatTime12Hour(workdayStart)}–${formatTime12Hour(workdayEnd)}`,
                  },
                  {
                    label: 'Holiday calendar',
                    value: getHolidayCalendarOption(holidayCalendar).label,
                  },
                  ...(holidayCalendar !== 'none'
                    ? [
                        {
                          label: 'Holidays skipped',
                          value: formatSkippedHolidaySummary(result.skippedHolidays),
                        },
                      ]
                    : []),
                  {
                    label: 'Deadline',
                    value: `${formatPlainDate(result.date)} · ${formatTime12Hour(result.time)}`,
                  },
                ]}
              />
            </div>
          </details>

          <details className="sla-answer-details">
            <summary>Workday and holiday settings</summary>
            <div className="sla-answer-settings">
              <div className="sla-answer-workday">
                <label>
                  <span>Workday starts</span>
                  <input
                    type="time"
                    value={workdayStart}
                    onChange={(event) => {
                      setWorkdayStart(event.target.value)
                      setWorkdayPreferenceMessage(null)
                    }}
                  />
                </label>
                <label>
                  <span>Workday ends</span>
                  <input
                    type="time"
                    value={workdayEnd}
                    onChange={(event) => {
                      setWorkdayEnd(event.target.value)
                      setWorkdayPreferenceMessage(null)
                    }}
                  />
                </label>
              </div>

              <div className="sla-answer-workday-presets">
                {workdayPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    className={
                      workdayStart === preset.start && workdayEnd === preset.end
                        ? 'is-active'
                        : ''
                    }
                    onClick={() => applyWorkdayPreset(preset.start, preset.end)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <HolidayCalendarSelect
                value={holidayCalendar}
                onChange={(nextCalendar) => {
                  setHolidayCalendar(nextCalendar)
                  trackWhenIsDueEvent('holiday_calendar_changed', {
                    context: 'business_hours_deadline',
                    value: nextCalendar,
                  })
                }}
                compact
              />

              <div className="sla-answer-preference-actions">
                <button type="button" onClick={saveCurrentWorkday}>
                  Remember this workday
                </button>
                <button type="button" onClick={resetSavedWorkday}>
                  Reset
                </button>
                {workdayPreferenceMessage ? (
                  <span aria-live="polite">{workdayPreferenceMessage}</span>
                ) : null}
              </div>
            </div>
          </details>
        </section>
      ) : null}

      <section className="sla-answer-related" aria-label="Related business timing tools">
        <div>
          <p className="sla-answer-section-eyebrow">Related timing tools</p>
          <h2>Need a different counting rule?</h2>
        </div>

        <nav>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator
          </a>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator
          </a>
          <a
            href="/notice-period-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/notice-period-calculator')
            }}
          >
            Notice period calculator
          </a>
        </nav>
      </section>

      <section className="sla-answer-content" aria-label="Business-hour rules">
        <div className="sla-answer-content-heading">
          <p className="sla-answer-section-eyebrow">Business-hour rules</p>
          <h2>Start, working window, deadline</h2>
        </div>

        <article>
          <h2>How the business-hour clock works</h2>
          <p>
            If the start is before the workday begins, counting starts at the
            workday start. If it is at or after the workday end, counting starts
            at the next business-day start.
          </p>
        </article>

        <article>
          <h2>What if the SLA starts on a weekend?</h2>
          <p>
            Counting begins at the start of the next qualifying business day
            under the workday and holiday settings you selected.
          </p>
        </article>

        <article>
          <h2>What if it starts after business hours?</h2>
          <p>
            The remaining hours do not count overnight. The clock resumes at the
            start of the next qualifying business day.
          </p>
        </article>

        <article>
          <h2>Do public holidays count?</h2>
          <p>
            They count by default. Choose a supported holiday calendar when the
            SLA or policy excludes those holidays from working time.
          </p>
        </article>

        <article>
          <h2>Important</h2>
          <p>
            This is a planning calculator. The SLA, contract, support policy,
            customer agreement, or other source that created the deadline
            controls the actual working hours, holiday exclusions, time zone,
            and cutoff rules.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. SLAs and business-hour policies can define different working hours, holidays, time zones, start rules, and cutoff times."
      />

      <style>{`
        .sla-answer-page {
          --sla-ink: #173453;
          --sla-muted: #687b8e;
          --sla-accent: #2d7b64;
          --sla-field: #efe2c8;
          --sla-field-soft: #f6eddc;
          min-height: 100vh;
          background: #fffaf2;
        }

        .sla-answer-header {
          width: min(100% - 32px, 1100px);
          min-height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(23, 52, 83, 0.12);
        }

        .sla-answer-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .sla-answer-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .sla-answer-shell,
        .sla-answer-actions,
        .sla-answer-related,
        .sla-answer-content {
          width: min(100% - 32px, 1100px);
          margin-left: auto;
          margin-right: auto;
        }

        .sla-answer-shell {
          margin-top: 22px;
        }

        .sla-answer-hero {
          padding: clamp(42px, 6vw, 68px) clamp(24px, 5vw, 58px) 34px;
          border: 1px solid rgba(116, 82, 39, 0.13);
          border-radius: 28px 28px 0 0;
          background: var(--sla-field);
          text-align: center;
        }

        .sla-answer-eyebrow,
        .sla-answer-section-eyebrow {
          margin: 0;
          color: var(--sla-accent);
          font-size: 0.8rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .sla-answer-hero h1 {
          margin: 10px 0 0;
          color: var(--sla-ink);
          font-size: clamp(2.75rem, 5.8vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
        }

        .sla-answer-date {
          display: grid;
          justify-items: center;
          margin-top: 25px;
          color: var(--sla-ink);
          font-weight: 900;
        }

        .sla-answer-weekday {
          color: #3d657a;
          font-size: clamp(2.4rem, 4.2vw, 3.9rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .sla-answer-date-main {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.09em;
          max-width: 100%;
          margin-top: 6px;
          font-size: clamp(3.55rem, 6vw, 5.8rem);
          line-height: 0.92;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .sla-answer-month,
        .sla-answer-day,
        .sla-answer-comma,
        .sla-answer-year {
          display: inline;
        }

        .sla-answer-comma {
          margin-left: -0.08em;
        }

        .sla-answer-time {
          display: block;
          width: fit-content;
          margin: 20px auto 0;
          padding: 9px 15px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.62);
          color: #214b64;
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1;
        }

        .sla-answer-context,
        .sla-answer-rule {
          margin: 16px 0 0;
          color: var(--sla-muted);
          font-size: 0.96rem;
          line-height: 1.5;
        }

        .sla-answer-rule {
          margin-top: 7px;
          font-size: 0.88rem;
        }

        .sla-answer-controls {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(140px, 0.75fr) minmax(120px, 0.55fr) minmax(320px, 1.4fr);
          gap: 12px;
          align-items: end;
          padding: 18px;
          border: 1px solid rgba(116, 82, 39, 0.13);
          border-top: 1px solid rgba(116, 82, 39, 0.08);
          border-radius: 0 0 28px 28px;
          background: var(--sla-field-soft);
        }

        .sla-answer-controls label {
          display: grid;
          gap: 7px;
        }

        .sla-answer-controls label > span,
        .sla-answer-settings label > span {
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .sla-answer-controls input,
        .sla-answer-settings input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(23, 52, 83, 0.14);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .sla-answer-quick-picks {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .sla-answer-quick-picks button,
        .sla-answer-workday-presets button,
        .sla-answer-preference-actions button {
          min-height: 46px;
          padding: 8px 9px;
          border: 1px solid rgba(23, 52, 83, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f6780;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .sla-answer-quick-picks button.is-active,
        .sla-answer-workday-presets button.is-active {
          border-color: rgba(45, 123, 100, 0.58);
          background: #e7f3ee;
          color: #1f6655;
        }

        .sla-answer-error {
          grid-column: 1 / -1;
          margin: 0;
          color: #934a42;
          font-size: 0.84rem;
          font-weight: 750;
        }

        .sla-answer-actions {
          margin-top: 16px;
        }

        .sla-answer-actions > .result-actions {
          justify-content: center;
        }

        .sla-answer-details {
          margin-top: 12px;
          border: 1px solid rgba(23, 52, 83, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.74);
        }

        .sla-answer-details summary {
          min-height: 50px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #34516d;
          font-size: 0.98rem;
          font-weight: 900;
          cursor: pointer;
        }

        .sla-answer-detail-body,
        .sla-answer-settings {
          padding: 0 14px 16px;
        }

        .sla-answer-detail-body > p {
          max-width: 760px;
          margin: 0;
          color: #61768a;
          font-size: 0.95rem;
          line-height: 1.58;
        }

        .sla-answer-detail-body .calculation-receipt {
          margin-top: 16px;
        }

        .sla-answer-settings {
          display: grid;
          gap: 12px;
        }

        .sla-answer-workday {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .sla-answer-workday label {
          display: grid;
          gap: 7px;
        }

        .sla-answer-workday-presets {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .sla-answer-preference-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .sla-answer-preference-actions span {
          color: #61778d;
          font-size: 0.84rem;
        }

        .sla-answer-related {
          margin-top: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(23, 52, 83, 0.1);
          border-radius: 22px;
          background: #f2eee6;
        }

        .sla-answer-related h2,
        .sla-answer-content-heading h2 {
          margin: 6px 0 0;
          color: var(--sla-ink);
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .sla-answer-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .sla-answer-related a {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border: 1px solid rgba(23, 52, 83, 0.11);
          border-radius: 12px;
          background: #fff;
          color: #35536e;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        .sla-answer-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 34px;
        }

        .sla-answer-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 3px;
        }

        .sla-answer-content article {
          padding: 21px;
          border: 1px solid rgba(23, 52, 83, 0.08);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
        }

        .sla-answer-content article:last-child {
          grid-column: 1 / -1;
        }

        .sla-answer-content h2 {
          margin: 0;
          color: var(--sla-ink);
          font-size: 1.08rem;
        }

        .sla-answer-content p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .sla-answer-header {
            width: min(100% - 24px, 680px);
            min-height: 76px;
          }

          .sla-answer-brand img {
            width: 154px;
          }

          .sla-answer-shell,
          .sla-answer-actions,
          .sla-answer-related,
          .sla-answer-content {
            width: min(100% - 24px, 680px);
          }

          .sla-answer-shell {
            margin-top: 14px;
          }

          .sla-answer-hero {
            padding: 28px 20px 26px;
            border-radius: 24px 24px 0 0;
            text-align: left;
          }

          .sla-answer-hero h1 {
            font-size: clamp(2.65rem, 12vw, 4rem);
          }

          .sla-answer-date {
            justify-items: start;
            margin-top: 22px;
          }

          .sla-answer-weekday {
            font-size: clamp(2.3rem, 10vw, 3.2rem);
          }

          .sla-answer-date-main {
            display: grid;
            justify-items: start;
            gap: 0;
            font-size: clamp(3.05rem, 14vw, 4.6rem);
            line-height: 0.9;
            white-space: normal;
          }

          .sla-answer-month,
          .sla-answer-day,
          .sla-answer-year {
            display: block;
          }

          .sla-answer-comma {
            display: none;
          }

          .sla-answer-time {
            margin-left: 0;
            margin-right: 0;
            border-radius: 12px;
          }

          .sla-answer-controls {
            grid-template-columns: minmax(0, 1.2fr) minmax(105px, 0.72fr);
            gap: 10px;
            padding: 14px;
            border-radius: 0 0 24px 24px;
          }

          .sla-answer-controls > label:nth-child(3) {
            grid-column: 1 / -1;
          }

          .sla-answer-quick-picks {
            grid-column: 1 / -1;
          }

          .sla-answer-controls input,
          .sla-answer-quick-picks button {
            min-height: 46px;
          }

          .sla-answer-workday-presets {
            grid-template-columns: 1fr;
          }

          .sla-answer-related {
            padding: 20px 18px;
          }

          .sla-answer-related nav {
            grid-template-columns: 1fr;
          }

          .sla-answer-content {
            display: block;
            margin-top: 28px;
          }

          .sla-answer-content-heading {
            margin-bottom: 8px;
          }

          .sla-answer-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(23, 52, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .sla-answer-content p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }
      `}</style>
    </main>
  )
}
type StaticPageRoute = Extract<RouteName, 'about' | 'privacy' | 'terms' | 'contact'>

type StaticPageProps = NavigationProps & {
  route: StaticPageRoute
}

function StaticPage({ route, onNavigate }: StaticPageProps) {
  const page = getStaticPageContent(route)

  return (
    <main className="page-shell static-page">
      <section className="intro" aria-labelledby={`${route}-title`}>
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <a
          className="back-link"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          Home
        </a>
        <h1 id={`${route}-title`}>{page.title}</h1>
      </section>

      <section className="static-content" aria-label={page.title}>
        {page.sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
        {page.email ? (
          <p>
            <a href={`mailto:${page.email}`}>{page.email}</a>
          </p>
        ) : null}
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}

function NotFoundPage({ onNavigate }: NavigationProps) {

  return (
    <main className="page-shell static-page">
      <section className="intro" aria-labelledby="not-found-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <h1 id="not-found-title">Page not found</h1>
        <p className="subtitle">
          That page does not exist yet. You can go back home or choose one of the calculators below.
        </p>
      </section>

      <section className="static-content" aria-label="Page not found links">
        <div className="not-found-links">
          <a
            className="calculator-link-card"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            <strong>Home</strong>
            <span>Return to the main due date calculator.</span>
          </a>
          <a
            className="calculator-link-card"
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            <strong>Business Days Calculator</strong>
            <span>Add business days to a start date.</span>
          </a>
          <a
            className="calculator-link-card"
            href="/free-trial-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/free-trial-calculator')
            }}
          >
            <strong>Free Trial Calculator</strong>
            <span>Estimate the trial end and set a one-day-before reminder.</span>
          </a>
          <a
            className="calculator-link-card"
            href="/return-window-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/return-window-calculator')
            }}
          >
            <strong>Return Window Calculator</strong>
            <span>Find the last day to return an item.</span>
          </a>
          <a
            className="calculator-link-card"
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            <strong>Invoice Due Date Calculator</strong>
            <span>Calculate due dates from payment terms.</span>
          </a>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}

function CalculatorPageHeader({ onNavigate }: NavigationProps) {
  return (
    <header className="calculator-page-header" aria-label="WhenIsDue navigation">
      <a
        className="calculator-page-brand"
        href="/"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/')
        }}
        aria-label="WhenIsDue home"
      >
        <img src="/whenisdue-logo.png" alt="WhenIsDue" />
      </a>

      <a
        className="calculator-page-all-link"
        href="/calculators"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/calculators')
        }}
      >
        All calculators
      </a>
    </header>
  )
}

type IdentityRowProps = {
  onNavigate?: (path: string) => void
  showHomeLink?: boolean
}

function IdentityRow({ onNavigate }: IdentityRowProps) {
  const siteMark = onNavigate ? (
    <a
      className="site-mark site-mark-link"
      href="/"
      onClick={(event) => {
        event.preventDefault()
        onNavigate('/')
      }}
    >
      <span className="brand-calendar" aria-hidden="true">
        <span />
        <strong>✓</strong>
      </span>
      <span>WhenIsDue</span>
    </a>
  ) : (
    <p className="site-mark">
      <span className="brand-calendar" aria-hidden="true">
        <span />
        <strong>✓</strong>
      </span>
      <span>WhenIsDue</span>
    </p>
  )

  return (
    <>
      <style>{`
        @media (max-width: 760px) {
          .invoice-bam-intro,
          .free-trial-bam-intro,
          .return-window-page .intro {
            padding-bottom: 10px !important;
          }

          .invoice-bam-intro h1,
          .free-trial-bam-intro h1,
          .return-window-page .intro h1 {
            font-size: clamp(2.1rem, 10vw, 2.9rem) !important;
            line-height: 1.02 !important;
            letter-spacing: -0.035em !important;
          }

          .invoice-bam-intro .subtitle,
          .free-trial-bam-intro .subtitle,
          .return-window-page .intro .subtitle {
            font-size: 0.96rem !important;
            line-height: 1.45 !important;
          }

          .invoice-due-date-page .business-workspace,
          .free-trial-page .business-workspace,
          .return-window-page .business-workspace {
            gap: 10px !important;
          }

          .invoice-due-date-page .invoice-due-date-result,
          .free-trial-page .free-trial-result,
          .return-window-page .return-window-result {
            border: 1px solid rgba(19, 38, 70, 0.09) !important;
            border-radius: 16px !important;
            background: #fff !important;
            box-shadow: none !important;
          }

          .invoice-due-date-page .result-label,
          .free-trial-page .result-label,
          .return-window-page .result-label {
            color: #667c92 !important;
            font-size: 0.88rem !important;
            font-weight: 900 !important;
            letter-spacing: 0.06em !important;
            text-transform: uppercase !important;
          }

          .invoice-due-date-page .due-date,
          .free-trial-page .due-date,
          .return-window-page .due-date {
            color: #0b1830 !important;
            font-weight: 950 !important;
            letter-spacing: -0.045em !important;
            line-height: 0.98 !important;
          }

          .invoice-due-date-page .result-note,
          .free-trial-page .result-note,
          .return-window-page .result-note {
            color: #667c92 !important;
            font-size: 0.92rem !important;
            line-height: 1.5 !important;
          }

          .invoice-due-date-page .status-badge,
          .free-trial-page .status-badge,
          .return-window-page .status-badge {
            font-size: 0.86rem !important;
            line-height: 1.4 !important;
          }
        }
      

        @media (max-width: 760px) {
          /* Net-term pages are the reference: question → compact inputs → obvious answer. */
          .next-payday-hero,
          .business-hours-hero,
          .invoice-bam-intro,
          .free-trial-bam-intro,
          .return-window-page .intro {
            width: calc(100% - 24px) !important;
            margin: 14px auto 0 !important;
            padding: 0 0 10px !important;
            text-align: left !important;
          }

          .next-payday-hero h1,
          .business-hours-hero h1,
          .invoice-bam-intro h1,
          .free-trial-bam-intro h1,
          .return-window-page .intro h1 {
            margin: 0 !important;
            color: #10213b !important;
            font-size: clamp(2rem, 9vw, 2.75rem) !important;
            line-height: 1.02 !important;
            letter-spacing: -0.035em !important;
            text-align: left !important;
          }

          .next-payday-hero > p:last-child,
          .business-hours-hero > p:last-child,
          .invoice-bam-intro .subtitle,
          .free-trial-bam-intro .subtitle,
          .return-window-page .intro .subtitle {
            max-width: none !important;
            margin: 7px 0 0 !important;
            color: #5f748b !important;
            font-size: 0.96rem !important;
            line-height: 1.42 !important;
            text-align: left !important;
          }

          .next-payday-workspace,
          .business-hours-workspace,
          .invoice-due-date-page .business-workspace,
          .free-trial-page .business-workspace,
          .return-window-page .business-workspace {
            width: calc(100% - 24px) !important;
            margin: 6px auto 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
          }

          /* Inputs first, like Net 30. Keep the input area visually light. */
          .next-payday-form,
          .business-hours-form,
          .invoice-due-date-page .business-calculator,
          .free-trial-page .business-calculator,
          .return-window-page .business-calculator {
            order: 1 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            gap: 10px !important;
          }

          .next-payday-form label,
          .business-hours-form > label,
          .invoice-due-date-page .field,
          .free-trial-page .field,
          .return-window-page .field {
            gap: 5px !important;
          }

          .next-payday-form label > span,
          .business-hours-form label > span,
          .invoice-due-date-page .field > span:first-child,
          .free-trial-page .field > span:first-child,
          .return-window-page .field > span:first-child {
            color: #506985 !important;
            font-size: 0.84rem !important;
            font-weight: 850 !important;
          }

          .next-payday-form input,
          .next-payday-form select,
          .business-hours-form input,
          .invoice-due-date-page .field input,
          .invoice-due-date-page .field select,
          .free-trial-page .field input,
          .return-window-page .field input {
            min-height: 44px !important;
            border-radius: 9px !important;
            background: #fff !important;
            font-size: 1rem !important;
          }

          /* The answer follows the compact input block and owns the visual hierarchy. */
          .next-payday-result,
          .business-hours-result,
          .invoice-due-date-page .invoice-due-date-result,
          .free-trial-page .free-trial-result,
          .return-window-page .return-window-result {
            order: 2 !important;
            min-height: 0 !important;
            padding: 18px 8px 12px !important;
            border: 0 !important;
            border-top: 1px solid rgba(19, 38, 70, 0.1) !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            text-align: center !important;
            overflow: hidden !important;
          }

          .next-payday-result > p:first-child,
          .business-hours-result > p:first-child,
          .invoice-due-date-page .result-label,
          .free-trial-page .result-label,
          .return-window-page .result-label {
            margin: 0 0 8px !important;
            color: #61778d !important;
            font-size: 0.82rem !important;
            font-weight: 900 !important;
            letter-spacing: 0.07em !important;
            text-transform: uppercase !important;
          }

          .next-payday-date,
          .business-hours-date,
          .invoice-due-date-page .due-date,
          .free-trial-page .due-date,
          .return-window-page .due-date {
            width: 100% !important;
            margin: 0 !important;
            color: #08172f !important;
            font-family: inherit !important;
            font-size: clamp(3rem, 15vw, 4.8rem) !important;
            font-weight: 950 !important;
            line-height: 0.98 !important;
            letter-spacing: -0.05em !important;
            text-align: center !important;
            text-wrap: balance !important;
            overflow-wrap: anywhere !important;
          }

          .next-payday-weekday,
          .business-hours-weekday {
            margin-top: 10px !important;
            color: #536b85 !important;
            font-size: 1.08rem !important;
            font-weight: 800 !important;
          }

          .next-payday-rule,
          .business-hours-rule,
          .invoice-due-date-page .result-note,
          .free-trial-page .result-note,
          .return-window-page .result-note,
          .invoice-due-date-page .result-meta,
          .free-trial-page .result-meta,
          .return-window-page .result-meta {
            color: #667c92 !important;
            font-size: 0.9rem !important;
            line-height: 1.45 !important;
          }

          /* SLA: keep quick hour choices secondary so they do not push the answer away. */
          .business-hours-presets {
            order: 3 !important;
            gap: 6px !important;
          }

          .business-hours-default-note,
          .business-hours-advanced {
            order: 4 !important;
          }

          .business-hours-presets button {
            min-height: 40px !important;
            padding: 6px 10px !important;
            font-size: 0.8rem !important;
          }

          .business-hours-time-block {
            margin-top: 12px !important;
            padding: 9px 14px 10px !important;
            border-radius: 12px !important;
          }

          /* Payday quick choices and policy copy come after the answer. */
          .next-payday-secondary {
            order: 3 !important;
            padding: 6px 0 0 !important;
          }

          /* Remove old green visual language from the legacy result panels. */
          .invoice-due-date-page .status-badge,
          .free-trial-page .status-badge,
          .return-window-page .status-badge {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            white-space: normal !important;
            overflow: visible !important;
            overflow-wrap: anywhere !important;
            word-break: normal !important;
            text-align: center !important;
            border-color: rgba(19, 38, 70, 0.12) !important;
            background: #f5f7f9 !important;
            color: #536b85 !important;
          }

          .invoice-due-date-page .result-meta,
          .free-trial-page .result-meta,
          .return-window-page .result-meta,
          .invoice-due-date-page .result-note,
          .free-trial-page .result-note,
          .return-window-page .result-note {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            white-space: normal !important;
            overflow: visible !important;
            overflow-wrap: anywhere !important;
            word-break: normal !important;
          }

          .invoice-due-date-page .invoice-due-date-result,
          .free-trial-page .free-trial-result,
          .return-window-page .return-window-result {
            border-left: 0 !important;
          }

          .invoice-due-date-page .result-meta-stack,
          .free-trial-page .result-meta-stack,
          .return-window-page .result-meta-stack {
            align-items: center !important;
          }

          /* Keep actions below the answer; they should never compete with it. */
          .result-actions {
            margin-top: 14px !important;
          }
        }
`}</style>

      <header className="site-header friendly-site-header">
      <div className="identity-row">
        {siteMark}
        {onNavigate ? (
          <nav className="top-nav friendly-top-nav" aria-label="Main navigation">
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/')
              }}
            >
              Home
            </a>
            <a
              href="/calculators"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/calculators')
              }}
            >
              Calculators
            </a>
            <a
              className="workspace-nav-link"
              href="/workspace"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/workspace')
              }}
            >
              VA Workspace
            </a>
          </nav>
        ) : null}
      </div>
      </header>
    </>
  )
}


type SiteFooterProps = {
  onNavigate: (path: string) => void
  planningNote?: string
}

function SiteFooter({
  onNavigate,
  planningNote = 'For planning only. Always check the original terms on your invoice, receipt, order, or trial.',
}: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <a
          href="/about"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/about')
          }}
        >
          About
        </a>
        <a
          href="/privacy"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/privacy')
          }}
        >
          Privacy
        </a>
        <a
          href="/terms"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/terms')
          }}
        >
          Terms
        </a>
        <a
          href="/contact"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/contact')
          }}
        >
          Contact
        </a>
      </div>
      <p>
        Calculator dates are saved in this browser only.
      </p>
      <p>
        {planningNote}
      </p>
    </footer>
  )
}

function useCurrentMinute(): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 60_000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  return currentTime
}

type NextDueSpotlightProps = {
  deadline: NextDueDeadline
  onToggleDone: (id: string) => void
}

function NextDueSpotlight({ deadline, onToggleDone }: NextDueSpotlightProps) {
  const categoryClass = `category-${deadline.category}`
  const urgencyClass = getUrgencyClass(deadline.daysRemaining)
  const isUrgent = deadline.daysRemaining <= 2

  return (
    <section className={`next-due next-due-redesign ${categoryClass} ${isUrgent ? 'is-urgent' : ''}`}>
      <div className="saved-date-tile spotlight-date-tile" aria-hidden="true">
        <span>{formatMonthShort(deadline.dueDate)}</span>
        <strong>{deadline.dueDate.day}</strong>
        <small>{formatWeekday(deadline.dueDate)}</small>
      </div>
      <div className="next-due-main">
        <div className="next-due-kicker">
          <p className="next-due-label">Next active deadline</p>
          <span>Closest date that still needs attention</span>
        </div>
        <h3>{deadline.title}</h3>
        <p className="next-due-meta">
          <span className={`category-pill ${categoryClass}`}>{modeLabels[deadline.category]}</span>
          <span>{formatPlainDate(deadline.dueDate)}</span>
        </p>
      </div>
      <div className="next-due-footer">
        <span className={`status-badge ${urgencyClass}`}>
          {formatSpotlightRemaining(deadline.daysRemaining)}
        </span>
        <div className="next-due-actions">
          <button type="button" onClick={() => onToggleDone(deadline.id)}>
            Mark done
          </button>
        </div>
      </div>
    </section>
  )
}

type SavedDeadlineGroupKey = 'overdue' | 'dueSoon' | 'later' | 'completed'

type SavedDeadlineGroups = Record<SavedDeadlineGroupKey, SavedDeadline[]>

type SavedDeadlineGroupProps = {
  title: string
  description: string
  deadlines: SavedDeadline[]
  emptyMessage: string
  groupClass: string
  today: PlainDate
  onDelete: (id: string) => void
  onToggleDone: (id: string) => void
}

function SavedDeadlineGroup({
  title,
  description,
  deadlines,
  emptyMessage,
  groupClass,
  today,
  onDelete,
  onToggleDone,
}: SavedDeadlineGroupProps) {
  return (
    <section className={`saved-deadline-group ${groupClass}`}>
      <div className="saved-group-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span>{deadlines.length}</span>
      </div>

      {deadlines.length > 0 ? (
        <ul className="deadline-card-grid">
          {deadlines.map((deadline) => (
            <SavedDeadlineItem
              deadline={deadline}
              key={deadline.id}
              today={today}
              onDelete={onDelete}
              onToggleDone={onToggleDone}
            />
          ))}
        </ul>
      ) : (
        <p className="saved-group-empty">{emptyMessage}</p>
      )}
    </section>
  )
}

type SavedDeadlineItemProps = {
  deadline: SavedDeadline
  today: PlainDate
  onDelete: (id: string) => void
  onToggleDone: (id: string) => void
}

function SavedDeadlineItem({
  deadline,
  today,
  onDelete,
  onToggleDone,
}: SavedDeadlineItemProps) {
  const dueDate = parsePlainDate(deadline.dueDate)
  const remaining = dueDate ? daysBetween(today, dueDate) : 0
  const status = dueDate ? getStatusText(remaining, deadline.done) : 'Invalid date'
  const urgencyClass = deadline.done ? 'status-done' : getUrgencyClass(remaining)
  const categoryClass = `category-${deadline.category}`

  return (
    <li className={`deadline-card ${urgencyClass} ${categoryClass} ${deadline.done ? 'is-done' : ''}`}>
      <div className="saved-date-tile" aria-hidden="true">
        <span>{dueDate ? formatMonthShort(dueDate) : '—'}</span>
        <strong>{dueDate ? dueDate.day : '?'}</strong>
        <small>{dueDate ? formatWeekday(dueDate) : 'Invalid'}</small>
      </div>

      <div className="deadline-card-copy">
        <h4>{deadline.title}</h4>
        <p>
          <span className={`category-pill ${categoryClass}`}>{modeLabels[deadline.category]}</span>
          <span>{dueDate ? formatPlainDate(dueDate) : 'Invalid date'}</span>
        </p>
        <span className={`status-badge ${urgencyClass}`}>{status}</span>
      </div>

      <div className="deadline-card-actions">
        <button
          className="deadline-done-button"
          type="button"
          onClick={() => onToggleDone(deadline.id)}
        >
          {deadline.done ? 'Restore' : 'Mark done'}
        </button>
        <button
          className="deadline-delete-button"
          type="button"
          onClick={() => onDelete(deadline.id)}
          aria-label={`Delete ${deadline.title}`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

type NextDueDeadline = SavedDeadline & {
  dueDate: PlainDate
  daysRemaining: number
}



function ScenarioIcon({ mode }: { mode: CalculatorMode }) {
  if (mode === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M6.5 3.5v3M17.5 3.5v3M4 8.5h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
        <path d="M12 11.5v5M9.5 14h5" />
      </svg>
    )
  }

  if (mode === 'business') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M4.5 8h15A1.5 1.5 0 0 1 21 9.5v9A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-9A1.5 1.5 0 0 1 4.5 8Z" />
        <path d="M3 13h18M10 13v2h4v-2" />
      </svg>
    )
  }

  if (mode === 'invoice') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M6 3.5h12v17l-2-1.25L14 20.5l-2-1.25-2 1.25-2-1.25L6 20.5v-17Z" />
        <path d="M9 8h6M9 11.5h6M9 15h3.5" />
      </svg>
    )
  }

  if (mode === 'trial') {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2M8 3.75 6.5 2.5M16 3.75l1.5-1.25" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M7 8.5V6.75A2.75 2.75 0 0 1 9.75 4h4.5A2.75 2.75 0 0 1 17 6.75V8.5M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M14.5 12.25H10a2.5 2.5 0 0 0 0 5h1.5M9.5 14.25l-2 1.5 2 1.5" />
    </svg>
  )
}

function getFriendlyModeInstruction(mode: CalculatorMode): string {
  const instructions: Record<CalculatorMode, string> = {
    calendar: 'Choose a starting date and how many calendar days to add.',
    business: 'Choose a starting date and how many weekdays to count.',
    invoice: 'Choose the invoice date and its payment terms.',
    trial: 'Choose the signup date and the length of the trial.',
    return: 'Choose the purchase date and the store’s return window.',
  }

  return instructions[mode]
}

function getFriendlyStartDateLabel(mode: CalculatorMode): string {
  const labels: Record<CalculatorMode, string> = {
    calendar: 'What date should we start from?',
    business: 'What is the starting date?',
    invoice: 'When was the invoice sent?',
    trial: 'When did the trial start?',
    return: 'When did you buy it?',
  }

  return labels[mode]
}

function getFriendlyAmountLabel(mode: CalculatorMode): string {
  const labels: Record<CalculatorMode, string> = {
    calendar: 'How many days should we add?',
    business: 'How many business days?',
    invoice: 'Payment terms',
    trial: 'How many days is the trial?',
    return: 'How many days is the return window?',
  }

  return labels[mode]
}

function getFriendlyCountingNote(mode: CalculatorMode): string {
  const notes: Record<CalculatorMode, string> = {
    calendar: 'We’ll count every day, including weekends.',
    business: 'We’ll count Monday through Friday and skip weekends.',
    invoice: 'We’ll calculate from the invoice date using the selected terms.',
    trial: 'We’ll show the calculated end date and a safer day to cancel.',
    return: 'We’ll count forward from the purchase date.',
  }

  return notes[mode]
}

function getFriendlyResultLabel(mode: CalculatorMode): string {
  const labels: Record<CalculatorMode, string> = {
    calendar: 'Your due date',
    business: 'Business-day deadline',
    invoice: 'Payment is due',
    trial: 'Trial ends',
    return: 'Last day to return',
  }

  return labels[mode]
}

function getCopyAnswer(mode: CalculatorMode, dueDate: PlainDate, cancelByDate: PlainDate | null): string {
  if (mode === 'trial' && cancelByDate) {
    return `The trial ends ${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}. Suggested reminder date: ${formatPlainDate(cancelByDate)}.`
  }

  const prefix: Record<CalculatorMode, string> = {
    calendar: 'The due date is',
    business: 'The business-day deadline is',
    invoice: 'Payment is due',
    trial: 'The trial ends',
    return: 'The last day to return is',
  }

  return `${prefix[mode]} ${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}.`
}

function formatMonthShort(date: PlainDate): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    month: 'short',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day))).toUpperCase()
}


type WhenIsDueAnalyticsValue = string | number | boolean | null | undefined

function trackWhenIsDueEvent(
  name: string,
  values: Record<string, WhenIsDueAnalyticsValue> = {},
) {
  const payload = {
    event: `wid_${name}`,
    page_path: window.location.pathname,
    ...values,
  }

  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }

  if (typeof analyticsWindow.gtag === 'function') {
    analyticsWindow.gtag('event', `wid_${name}`, {
      page_path: window.location.pathname,
      ...values,
    })
  } else {
    analyticsWindow.dataLayer ??= []
    analyticsWindow.dataLayer.push(payload)
  }

  window.dispatchEvent(
    new CustomEvent('whenisdue:analytics', {
      detail: payload,
    }),
  )
}

function getInitialDateQueryParam(name: string, fallback: string) {
  const value = new URLSearchParams(window.location.search).get(name)
  return value && parsePlainDate(value) ? value : fallback
}

function getInitialPositiveIntegerQueryParam(
  name: string,
  fallback: string,
  max: number,
) {
  const value = new URLSearchParams(window.location.search).get(name)
  const parsed = value ? parseInteger(value) : null
  return parsed !== null && parsed > 0 && parsed <= max ? String(parsed) : fallback
}

function syncShareableQueryParams(values: Record<string, string | null | undefined>) {
  const url = new URL(window.location.href)

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
  })

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function getLocalTimeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local device time'
  } catch {
    return 'Local device time'
  }
}

function getDefaultTitle(mode: CalculatorMode): string {
  if (mode === 'business') {
    return 'Business days deadline'
  }

  if (mode === 'invoice') {
    return 'Invoice due date'
  }

  if (mode === 'trial') {
    return 'Free trial deadline'
  }

  if (mode === 'return') {
    return 'Return deadline'
  }

  return 'Calendar deadline'
}

function groupSavedDeadlines(
  deadlines: SavedDeadline[],
  today: PlainDate,
  excludedDeadlineId?: string,
): SavedDeadlineGroups {
  const groups: SavedDeadlineGroups = {
    overdue: [],
    dueSoon: [],
    later: [],
    completed: [],
  }

  deadlines.forEach((deadline) => {
    if (deadline.id === excludedDeadlineId) {
      return
    }

    if (deadline.done) {
      groups.completed.push(deadline)
      return
    }

    const dueDate = parsePlainDate(deadline.dueDate)

    if (!dueDate) {
      groups.later.push(deadline)
      return
    }

    const daysRemaining = daysBetween(today, dueDate)

    if (daysRemaining < 0) {
      groups.overdue.push(deadline)
      return
    }

    if (daysRemaining <= 7) {
      groups.dueSoon.push(deadline)
      return
    }

    groups.later.push(deadline)
  })

  return groups
}

function getNextDueDeadline(deadlines: SavedDeadline[], today: PlainDate): NextDueDeadline | null {
  const activeDeadlines = deadlines
    .filter((deadline) => !deadline.done)
    .map((deadline) => {
      const dueDate = parsePlainDate(deadline.dueDate)

      if (!dueDate) {
        return null
      }

      return {
        ...deadline,
        dueDate,
        daysRemaining: daysBetween(today, dueDate),
      }
    })
    .filter((deadline): deadline is NextDueDeadline => deadline !== null)

  if (activeDeadlines.length === 0) {
    return null
  }

  return [...activeDeadlines].sort((first, second) => {
    if (first.daysRemaining !== second.daysRemaining) {
      return first.daysRemaining - second.daysRemaining
    }

    return second.createdAt.localeCompare(first.createdAt)
  })[0]
}


function getRouteFromPath(pathname: string): RouteName {
  if (pathname === '/') {
    return 'home'
  }

  if (pathname === '/calculators') {
    return 'calculators'
  }

  if (pathname === '/business-days-calculator') {
    return 'business-days'
  }

  if (pathname === '/business-days-between-dates') {
    return 'business-days-between'
  }

  if (pathname === '/business-hours-deadline-calculator') {
    return 'business-hours-deadline'
  }

  if (pathname === '/saved-calculations') {
    return 'saved-calculations'
  }

  if (pathname === '/next-payday-calculator') {
    return 'next-payday'
  }

  if (pathname === '/deadline-calculator') {
    return 'deadline-calculator'
  }

  if (pathname === '/does-the-start-date-count') {
    return 'start-date-count-guide'
  }

  if (pathname === '/do-weekends-count-as-business-days') {
    return 'weekends-business-days-guide'
  }

  if (pathname === '/do-public-holidays-count-as-business-days') {
    return 'public-holidays-business-days-guide'
  }

  if (pathname === '/shipping-delivery-range-calculator') {
    return 'shipping-delivery-range'
  }

  if (pathname === '/2-10-net-30-calculator') {
    return 'two-ten-net-30'
  }

  if (pathname === '/notice-period-calculator') {
    return 'notice-period'
  }

  if (pathname === '/subscription-renewal-calculator') {
    return 'subscription-renewal'
  }

  if (pathname === '/what-does-within-days-mean') {
    return 'within-days-guide'
  }

  if (pathname === '/net-30-vs-30-days') {
    return 'net-30-vs-30-days-guide'
  }

  if (pathname === '/what-if-a-deadline-falls-on-a-weekend') {
    return 'deadline-weekend-extension-guide'
  }

  if (pathname === '/3-business-days-from-today') {
    return 'three-business-days'
  }

  if (pathname === '/4-business-days-from-today') {
    return 'four-business-days'
  }

  if (pathname === '/5-business-days-from-today') {
    return 'five-business-days'
  }

  if (pathname === '/7-business-days-from-today') {
    return 'seven-business-days'
  }

  if (pathname === '/8-business-days-from-today') {
    return 'eight-business-days'
  }

  if (pathname === '/10-business-days-from-today') {
    return 'ten-business-days'
  }

  if (pathname === '/20-business-days-from-today') {
    return 'twenty-business-days'
  }

  if (pathname === '/30-business-days-from-today') {
    return 'thirty-business-days'
  }

  if (pathname === '/free-trial-calculator') {
    return 'free-trial'
  }

  if (pathname === '/return-window-calculator') {
    return 'return-window'
  }

  if (pathname === '/invoice-due-date-calculator') {
    return 'invoice-due-date'
  }

  if (pathname === '/net-7-due-date') {
    return 'net-7'
  }

  if (pathname === '/net-15-due-date') {
    return 'net-15'
  }

  if (pathname === '/net-30-due-date') {
    return 'net-30'
  }

  if (pathname === '/net-45-due-date') {
    return 'net-45'
  }

  if (pathname === '/net-60-due-date') {
    return 'net-60'
  }

  if (pathname === '/net-90-due-date') {
    return 'net-90'
  }

  if (pathname === '/workspace') {
    return 'workspace'
  }

  if (pathname === '/typing') {
    return 'typing'
  }

  if (pathname === '/about') {
    return 'about'
  }

  if (pathname === '/privacy') {
    return 'privacy'
  }

  if (pathname === '/terms') {
    return 'terms'
  }

  if (pathname === '/contact') {
    return 'contact'
  }

  return 'not-found'
}

type RouteMetadata = {
  title: string
  description: string
  path: string
  openGraphDescription?: string
  twitterDescription?: string
}

function applyRouteMetadata(route: RouteName) {
  const metadata = getRouteMetadata(route)
  document.title = metadata.title

  const robots = getOrCreateMetaName('robots')
  robots.setAttribute(
    'content',
    route === 'not-found' ||
    route === 'workspace' ||
    route === 'typing' ||
    route === 'saved-calculations'
      ? 'noindex, follow'
      : 'index, follow',
  )

  const description = getOrCreateMetaDescription()
  description.setAttribute('content', metadata.description)

  const openGraphTitle = getOrCreateMetaProperty('og:title')
  openGraphTitle.setAttribute('content', metadata.title)

  const openGraphDescription = getOrCreateMetaProperty('og:description')
  openGraphDescription.setAttribute('content', metadata.openGraphDescription ?? metadata.description)

  const openGraphUrl = getOrCreateMetaProperty('og:url')
  openGraphUrl.setAttribute('content', `https://www.whenisdue.com${metadata.path}`)

  const twitterTitle = getOrCreateMetaName('twitter:title')
  twitterTitle.setAttribute('content', metadata.title)

  const twitterDescription = getOrCreateMetaName('twitter:description')
  twitterDescription.setAttribute('content', metadata.twitterDescription ?? metadata.description)

  const canonicalUrl = `https://www.whenisdue.com${metadata.path}`
  const canonical = getOrCreateCanonicalLink()
  canonical.setAttribute('href', canonicalUrl)

  applyRouteStructuredData(route, metadata, canonicalUrl)
}

function getRouteMetadata(route: RouteName): RouteMetadata {
  if (route === 'calculators') {
    return {
      title: 'Date & Deadline Calculators - Business Days, Invoices, Returns & More | WhenIsDue',
      description: 'Choose a focused calculator for business days, invoice due dates, return deadlines, free trials, SLA business hours, paydays and more.',
      path: '/calculators',
    }
  }

  if (route === 'business-days') {
    return {
      title: 'Business Days Calculator - What Date Is 3, 5, 7 or 10 Business Days From Today? | WhenIsDue',
      description: 'See the exact date 3, 5, 7, 10 or any number of business days from today or another date. Weekends are skipped, with optional supported holiday calendars.',
      openGraphDescription: 'See the exact date 3, 5, 7 or 10 business days from today or calculate from any start date.',
      twitterDescription: 'Find the exact date 3, 5, 7 or 10 business days from today.',
      path: '/business-days-calculator',
    }
  }

  if (route === 'business-days-between') {
    return {
      title: 'Business Days Between Dates Calculator | WhenIsDue',
      description: 'Count business days between two dates instantly. Weekends are skipped and the counting rule is shown clearly.',
      openGraphDescription: 'Count weekdays between two dates instantly with a clear start-date and end-date counting rule.',
      twitterDescription: 'Count business days between two dates instantly.',
      path: '/business-days-between-dates',
    }
  }

  if (route === 'business-hours-deadline') {
    return {
      title: 'Business Hours Deadline Calculator for SLAs | WhenIsDue',
      description: 'Add business hours to a date and time using a workday schedule. Skip weekends and optionally supported public holidays.',
      openGraphDescription: 'Calculate an SLA or response deadline using business hours, workday times, weekends, and optional holiday calendars.',
      twitterDescription: 'Add business hours to a date and time and calculate the exact deadline.',
      path: '/business-hours-deadline-calculator',
    }
  }

  if (route === 'saved-calculations') {
    return {
      title: 'Saved Calculations - WhenIsDue',
      description: 'Reopen recent and favorite WhenIsDue calculations saved on this device.',
      path: '/saved-calculations',
    }
  }

  if (route === 'next-payday') {
    return {
      title: 'Next Payday Calculator | WhenIsDue',
      description: 'Find your next payday for weekly, biweekly, semimonthly, or monthly pay schedules.',
      openGraphDescription: 'Enter a known payday and pay schedule to calculate the next payday instantly.',
      twitterDescription: 'Calculate your next payday from a known payday and pay schedule.',
      path: '/next-payday-calculator',
    }
  }

  if (route === 'deadline-calculator') {
    return {
      title: 'Deadline Calculator - Business or Calendar Day Rules | WhenIsDue',
      description: 'Calculate a deadline with explicit rules for the start day, business or calendar days, public holidays, and final-day adjustment.',
      openGraphDescription: 'Choose how a deadline should be counted and see the exact date plus the assumptions used.',
      twitterDescription: 'Calculate a deadline with clear business-day, holiday, and counting rules.',
      path: '/deadline-calculator',
    }
  }

  if (route === 'start-date-count-guide') {
    return {
      title: 'Does the Start Date Count? Day 0 vs Day 1 Explained | WhenIsDue',
      description: 'Learn when a deadline start date counts as day 1, when counting starts after it, and how ambiguous wording can produce two different due dates.',
      openGraphDescription: 'See how day-zero and day-one deadline counting can produce different dates, with a clear worked example.',
      twitterDescription: 'Does the start date count? Compare day-zero and day-one deadline counting.',
      path: '/does-the-start-date-count',
    }
  }

  if (route === 'weekends-business-days-guide') {
    return {
      title: 'Do Weekends Count as Business Days? | WhenIsDue',
      description: 'See whether Saturdays and Sundays count as business days, how business days differ from calendar days, and what happens when a deadline lands on a weekend.',
      openGraphDescription: 'Learn how weekends are treated in standard business-day counting, with a clear Friday-to-Monday example.',
      twitterDescription: 'Do weekends count as business days? See the standard Monday–Friday rule and worked example.',
      path: '/do-weekends-count-as-business-days',
    }
  }

  if (route === 'public-holidays-business-days-guide') {
    return {
      title: 'Do Public Holidays Count as Business Days? | WhenIsDue',
      description: 'See when public holidays count as business days, when they are skipped, and how the selected holiday calendar can change a deadline.',
      openGraphDescription: 'Learn how public holidays affect business-day deadlines with a clear US Labor Day example.',
      twitterDescription: 'Do public holidays count as business days? See when they count, when they are skipped, and why the calendar matters.',
      path: '/do-public-holidays-count-as-business-days',
    }
  }

  if (route === 'shipping-delivery-range') {
    return {
      title: 'Shipping Delivery Date Range Calculator | WhenIsDue',
      description: 'Turn a shipping estimate such as 3–5 business days into exact earliest and latest delivery dates, with optional holiday-aware counting.',
      openGraphDescription: 'Enter an order or ship date and convert a business-day or calendar-day shipping range into actual delivery dates.',
      twitterDescription: 'Convert 3–5 business days into exact earliest and latest delivery dates.',
      path: '/shipping-delivery-range-calculator',
    }
  }

  if (route === 'two-ten-net-30') {
    return {
      title: '2/10 Net 30 Calculator - Discount & Due Date | WhenIsDue',
      description: 'Enter an invoice date to calculate the 2% early-payment discount deadline and the final Net 30 due date for 2/10 Net 30 terms.',
      openGraphDescription: 'Calculate both dates in 2/10 Net 30 payment terms: the 10-day discount deadline and the 30-day final due date.',
      twitterDescription: 'Calculate the 2/10 Net 30 discount deadline and final invoice due date.',
      path: '/2-10-net-30-calculator',
    }
  }

  if (route === 'notice-period') {
    return {
      title: 'Notice Period Calculator - Find the Last Date to Give Notice | WhenIsDue',
      description: 'Count backward from a renewal or event date to find the latest date to give notice in calendar days, business days, weeks, or months.',
      openGraphDescription: 'Enter an event date and notice period to find the last date to give notice, with optional business-day and holiday rules.',
      twitterDescription: 'Calculate the last date to give notice before a renewal, cancellation, or other event.',
      path: '/notice-period-calculator',
    }
  }

  if (route === 'subscription-renewal') {
    return {
      title: 'Subscription Renewal & Cancellation Calculator | WhenIsDue',
      description: 'Find the next subscription renewal date and, if advance notice is required, the last day to cancel before renewal.',
      openGraphDescription: 'Enter the last renewal or start date, billing interval, and optional cancellation notice period to see both dates.',
      twitterDescription: 'Calculate your next subscription renewal date and optional last day to cancel.',
      path: '/subscription-renewal-calculator',
    }
  }

  if (route === 'within-days-guide') {
    return {
      title: 'What Does “Within X Days” Mean? | WhenIsDue',
      description: 'See why “within X days” can be ambiguous, compare before-versus-after interpretations, and calculate both possible dates.',
      openGraphDescription: 'Understand “within X days” wording and compare both possible directions before relying on it as a deadline.',
      twitterDescription: 'What does “within X days” mean? Compare the common interpretations and calculate both dates.',
      path: '/what-does-within-days-mean',
    }
  }

  if (route === 'net-30-vs-30-days-guide') {
    return {
      title: 'Net 30 vs 30 Days: Are They the Same? | WhenIsDue',
      description: 'See when Net 30 and 30 calendar days produce the same due date, why the payment-term wording can still matter, and compare both dates.',
      openGraphDescription: 'Compare Net 30 with a simple 30-day duration and see when payment-term wording can change the result.',
      twitterDescription: 'Is Net 30 the same as 30 days? Compare the dates and understand why the payment-term wording matters.',
      path: '/net-30-vs-30-days',
    }
  }

  if (route === 'deadline-weekend-extension-guide') {
    return {
      title: 'What If a Deadline Falls on a Weekend? | WhenIsDue',
      description: 'See when a Saturday or Sunday deadline may move to the next business day, when it may stay put, and how holidays can affect the final date.',
      openGraphDescription: 'Does a weekend deadline automatically move to Monday? See why the governing rule controls the final-day adjustment.',
      twitterDescription: 'What happens when a deadline falls on a weekend? See when it may move to the next business day.',
      path: '/what-if-a-deadline-falls-on-a-weekend',
    }
  }

  if (
    route === 'three-business-days' ||
    route === 'four-business-days' ||
    route === 'five-business-days' ||
    route === 'seven-business-days' ||
    route === 'eight-business-days' ||
    route === 'ten-business-days' ||
    route === 'twenty-business-days' ||
    route === 'thirty-business-days'
  ) {
    const dayCountByRoute = {
      'three-business-days': 3,
      'four-business-days': 4,
      'five-business-days': 5,
      'seven-business-days': 7,
      'eight-business-days': 8,
      'ten-business-days': 10,
      'twenty-business-days': 20,
      'thirty-business-days': 30,
    } as const
    const dayCount = dayCountByRoute[route]

    return {
      title: `${dayCount} Business Days From Today: Exact Date | WhenIsDue`,
      description: `See the exact date ${dayCount} business days from today instantly. Weekends are skipped and your device time zone is shown.`,
      openGraphDescription: `Get the exact date ${dayCount} business days from today instantly, with weekends skipped.`,
      twitterDescription: `See the exact date ${dayCount} business days from today instantly.`,
      path: `/${dayCount}-business-days-from-today`,
    }
  }

  if (route === 'free-trial') {
    return {
      title: 'Free Trial Calculator - WhenIsDue',
      description: 'Estimate when a free trial ends and see a suggested one-day-before reminder.',
      path: '/free-trial-calculator',
    }
  }

  if (route === 'return-window') {
    return {
      title: '30 Day Return Policy Calculator & Return Window Calculator | WhenIsDue',
      description: 'Calculate the last day of a 30-day return policy or any custom return window from the purchase or delivery date. Supports 7, 14, 30, 60 and 90-day windows.',
      openGraphDescription: 'Calculate the last day of a 30-day return policy or any custom return window from the purchase or delivery date.',
      twitterDescription: 'Calculate the last day of a 30-day return policy or custom return window.',
      path: '/return-window-calculator',
    }
  }

  if (route === 'invoice-due-date') {
    return {
      title: 'Invoice Due Date Calculator - Net 7, 15, 30, 45, 60 & 90 | WhenIsDue',
      description: 'Enter an invoice date and payment terms to see the due date instantly. Calculate Net 7, Net 15, Net 30, Net 45, Net 60, Net 90 and EOM terms.',
      openGraphDescription: 'Calculate an invoice due date instantly from common Net payment terms or end-of-month terms.',
      twitterDescription: 'Enter an invoice date and payment terms to see the due date instantly.',
      path: '/invoice-due-date-calculator',
    }
  }

  if (
    route === 'net-7' ||
    route === 'net-15' ||
    route === 'net-30' ||
    route === 'net-45' ||
    route === 'net-60' ||
    route === 'net-90'
  ) {
    const dayCountByRoute = {
      'net-7': 7,
      'net-15': 15,
      'net-30': 30,
      'net-45': 45,
      'net-60': 60,
      'net-90': 90,
    } as const
    const dayCount = dayCountByRoute[route]

    return {
      title: `Net ${dayCount} Due Date Calculator | WhenIsDue`,
      description: `Enter an invoice date and instantly see the Net ${dayCount} payment due date. Uses ${dayCount} calendar days after the invoice date.`,
      openGraphDescription: `Calculate a Net ${dayCount} invoice due date instantly from any invoice date.`,
      twitterDescription: `Find the Net ${dayCount} due date instantly.`,
      path: `/net-${dayCount}-due-date`,
    }
  }

  if (route === 'typing') {
    return {
      title: 'Free VA Typing Test and Practice | WhenIsDue',
      description: 'Practice realistic virtual assistant typing tests with professional emails, office passages, timed sessions, WPM, accuracy, and mistake analysis.',
      openGraphDescription: 'A free typing trainer for virtual assistant applicants with realistic work passages and timed practice.',
      twitterDescription: 'Practice VA typing tests with realistic emails, WPM, accuracy, and local progress history.',
      path: '/typing',
    }
  }

  if (route === 'workspace') {
    return {
      title: 'VA Workspace - WhenIsDue',
      description: 'A private cloud-synced client and follow-up workspace for virtual assistants.',
      path: '/workspace',
    }
  }

  if (route === 'about') {
    return {
      title: 'About - WhenIsDue',
      description: 'Learn what WhenIsDue does and how its simple due date calculators work.',
      path: '/about',
    }
  }

  if (route === 'privacy') {
    return {
      title: 'Privacy Policy - WhenIsDue',
      description: 'Learn how WhenIsDue handles saved due dates, local browser storage, accounts, analytics, and ads.',
      path: '/privacy',
    }
  }

  if (route === 'terms') {
    return {
      title: 'Terms of Use - WhenIsDue',
      description: "Read the terms for using WhenIsDue's simple due date calculators.",
      path: '/terms',
    }
  }

  if (route === 'contact') {
    return {
      title: 'Contact - WhenIsDue',
      description: 'Contact WhenIsDue for questions, corrections, feedback, or calculation issues.',
      path: '/contact',
    }
  }

  if (route === 'not-found') {
    return {
      title: 'Page Not Found - WhenIsDue',
      description: 'That page does not exist yet. Choose a calculator or go back home.',
      path: window.location.pathname,
    }
  }

  return {
    title: 'WhenIsDue - Instant Date and Deadline Answers',
    description: 'Get instant answers for business days, return deadlines, invoice due dates, free trials, and other common date questions.',
    openGraphDescription: 'WhenIsDue gives you the date first: business days, return deadlines, invoice due dates, trials, and more.',
    twitterDescription: 'Instant date and deadline answers without unnecessary steps.',
    path: '/',
  }
}


type StructuredData = Record<string, unknown>

function applyRouteStructuredData(
  route: RouteName,
  metadata: RouteMetadata,
  canonicalUrl: string,
) {
  const scriptId = 'whenisdue-route-structured-data'
  let script = document.getElementById(scriptId) as HTMLScriptElement | null

  if (route === 'workspace' || route === 'typing' || route === 'not-found') {
    script?.remove()
    return
  }

  const structuredData = getRouteStructuredData(route, metadata, canonicalUrl)

  if (!script) {
    script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    document.head.append(script)
  }

  script.textContent = JSON.stringify(structuredData)
}

function getRouteStructuredData(
  route: RouteName,
  metadata: RouteMetadata,
  canonicalUrl: string,
): StructuredData | StructuredData[] {
  const organizationId = 'https://www.whenisdue.com/#organization'
  const websiteId = 'https://www.whenisdue.com/#website'

  const organization: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: 'WhenIsDue',
    url: 'https://www.whenisdue.com/',
  }

  const website: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: 'WhenIsDue',
    url: 'https://www.whenisdue.com/',
    description: 'Instant date and deadline answers for business days, returns, invoices, trials, and other common date questions.',
    inLanguage: 'en',
    publisher: {
      '@id': organizationId,
    },
  }

  const websiteReference: StructuredData = {
    '@id': websiteId,
  }

  const organizationReference: StructuredData = {
    '@id': organizationId,
  }

  if (route === 'home') {
    return [
      organization,
      website,
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': 'https://www.whenisdue.com/#webapp',
        name: 'WhenIsDue',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        url: canonicalUrl,
        description: metadata.description,
        provider: organizationReference,
        isPartOf: websiteReference,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ]
  }

  if (route === 'business-days') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#calculator`,
      name: 'Business Days Calculator',
      url: canonicalUrl,
      description: metadata.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      provider: organizationReference,
      isPartOf: websiteReference,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }
  }

  if (
    route === 'three-business-days' ||
    route === 'four-business-days' ||
    route === 'five-business-days' ||
    route === 'seven-business-days' ||
    route === 'eight-business-days' ||
    route === 'ten-business-days' ||
    route === 'twenty-business-days' ||
    route === 'thirty-business-days'
  ) {
    const dayCountByRoute = {
      'three-business-days': 3,
      'four-business-days': 4,
      'five-business-days': 5,
      'seven-business-days': 7,
      'eight-business-days': 8,
      'ten-business-days': 10,
      'twenty-business-days': 20,
      'thirty-business-days': 30,
    } as const
    const dayCount = dayCountByRoute[route]

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: `${dayCount} Business Days From Today`,
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
    }
  }

  if (route === 'start-date-count-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'Does the Start Date Count?',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        {
          '@type': 'Thing',
          name: 'Deadline counting',
        },
        {
          '@type': 'Thing',
          name: 'Business days',
        },
      ],
    }
  }
  if (route === 'weekends-business-days-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'Do Weekends Count as Business Days?',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        {
          '@type': 'Thing',
          name: 'Business days',
        },
        {
          '@type': 'Thing',
          name: 'Weekends',
        },
        {
          '@type': 'Thing',
          name: 'Deadline counting',
        },
      ],
    }
  }
  if (route === 'public-holidays-business-days-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'Do Public Holidays Count as Business Days?',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        {
          '@type': 'Thing',
          name: 'Business days',
        },
        {
          '@type': 'Thing',
          name: 'Public holidays',
        },
        {
          '@type': 'Thing',
          name: 'Deadline counting',
        },
      ],
    }
  }

  if (route === 'within-days-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'What Does “Within X Days” Mean?',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        { '@type': 'Thing', name: 'Deadline wording' },
        { '@type': 'Thing', name: 'Date calculation' },
        { '@type': 'Thing', name: 'Deadline counting' },
      ],
    }
  }

  if (route === 'net-30-vs-30-days-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'Net 30 vs 30 Days',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        { '@type': 'Thing', name: 'Net 30 payment terms' },
        { '@type': 'Thing', name: 'Invoice due dates' },
        { '@type': 'Thing', name: 'Calendar-day counting' },
      ],
    }
  }

  if (route === 'deadline-weekend-extension-guide') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: 'What If a Deadline Falls on a Weekend?',
      url: canonicalUrl,
      description: metadata.description,
      isPartOf: websiteReference,
      publisher: organizationReference,
      about: [
        { '@type': 'Thing', name: 'Deadline adjustment' },
        { '@type': 'Thing', name: 'Weekend deadlines' },
        { '@type': 'Thing', name: 'Business-day counting' },
      ],
    }
  }

  if (
    route === 'calculators' ||
    route === 'business-days-between' ||
    route === 'business-hours-deadline' ||
    route === 'shipping-delivery-range' ||
    route === 'two-ten-net-30' ||
    route === 'notice-period' ||
    route === 'subscription-renewal' ||
    route === 'next-payday' ||
    route === 'deadline-calculator' ||
    route === 'free-trial' ||
    route === 'return-window' ||
    route === 'invoice-due-date' ||
    route === 'net-7' ||
    route === 'net-15' ||
    route === 'net-30' ||
    route === 'net-45' ||
    route === 'net-60' ||
    route === 'net-90'
  ) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#calculator`,
      name: metadata.title.replace(' - WhenIsDue', '').replace(' | WhenIsDue', ''),
      url: canonicalUrl,
      description: metadata.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      provider: organizationReference,
      isPartOf: websiteReference,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    name: metadata.title,
    url: canonicalUrl,
    description: metadata.description,
    isPartOf: websiteReference,
    publisher: organizationReference,
  }
}

function getOrCreateMetaDescription(): HTMLMetaElement {
  const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]')

  if (existing) {
    return existing
  }

  const meta = document.createElement('meta')
  meta.setAttribute('name', 'description')
  document.head.append(meta)
  return meta
}

function getOrCreateMetaName(name: string): HTMLMetaElement {
  const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (existing) {
    return existing
  }

  const meta = document.createElement('meta')
  meta.setAttribute('name', name)
  document.head.append(meta)
  return meta
}

function getOrCreateMetaProperty(property: string): HTMLMetaElement {
  const existing = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)

  if (existing) {
    return existing
  }

  const meta = document.createElement('meta')
  meta.setAttribute('property', property)
  document.head.append(meta)
  return meta
}

function getOrCreateCanonicalLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (existing) {
    return existing
  }

  const link = document.createElement('link')
  link.setAttribute('rel', 'canonical')
  document.head.append(link)
  return link
}

type StaticPageContent = {
  title: string
  sections: Array<{
    title: string
    paragraphs: string[]
  }>
  email?: string
}

function getStaticPageContent(route: StaticPageRoute): StaticPageContent {
  const contactEmail = 'contact.whenisdue@gmail.com'

  if (route === 'about') {
    return {
      title: 'About WhenIsDue',
      sections: [
        {
          title: 'What WhenIsDue does',
          paragraphs: [
            'WhenIsDue is a daily client-action workspace for virtual assistants. It organizes tasks, deadlines, waiting items, and follow-ups into one clear queue. Free deadline calculators remain available as supporting tools.',
          ],
        },
        {
          title: 'Two different storage models',
          paragraphs: [
            'The public calculators can be used without an account. Dates saved from the calculators remain in the browser on that device.',
            'The VA Workspace requires an account. Its client and task records are stored in a private cloud workspace so they can be accessed after signing in on another supported device or browser.',
          ],
        },
        {
          title: 'Independent service',
          paragraphs: [
            'WhenIsDue is operated independently under the name WhenIsDue. It is not affiliated with Supabase or with any government, legal, financial, medical, school, employer, retailer, or service provider.',
          ],
        },
        {
          title: 'Important reminder',
          paragraphs: [
            'Calculations and workspace information are provided for organization and planning. Verify important deadlines, appointments, policies, and obligations with the original or official source.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            `Questions, support requests, privacy requests, and account-deletion requests can be sent to ${contactEmail}.`,
          ],
        },
      ],
      email: contactEmail,
    }
  }

  if (route === 'privacy') {
    return {
      title: 'Privacy Policy',
      sections: [
        {
          title: 'Effective date',
          paragraphs: [
            'This Privacy Policy is effective July 30, 2026. It explains how WhenIsDue handles information used by the public calculators and the VA Workspace.',
          ],
        },
        {
          title: 'Public calculators',
          paragraphs: [
            'The public due-date calculators do not require an account. Dates and labels that you choose to save through those calculators are stored in your browser on that device.',
            'Clearing browser data, using private browsing, changing browsers, or switching devices may remove or hide calculator records. These calculator records are separate from VA Workspace cloud records.',
          ],
        },
        {
          title: 'VA Workspace account information',
          paragraphs: [
            'Creating a VA Workspace account requires an email address and password. Authentication is provided through Supabase. WhenIsDue does not display your password and does not include passwords in workspace backup files.',
            'Authentication may use session information in your browser to keep you signed in and to determine which workspace records your account is authorized to access.',
          ],
        },
        {
          title: 'VA Workspace records',
          paragraphs: [
            'The VA Workspace may contain client names, contact details, service descriptions, notes, task titles, task details, dates, and statuses that you choose to enter.',
            'Workspace records are stored using Supabase cloud services and are associated with the signed-in account. A browser copy may also be kept locally to support the current workspace and migration features.',
          ],
        },
        {
          title: 'How information is used',
          paragraphs: [
            'Information is used to provide account access, save and synchronize workspace records, restore backups, respond to support requests, investigate technical or security issues, and operate and improve WhenIsDue.',
            'WhenIsDue does not sell VA Workspace records or use client records for advertising.',
          ],
        },
        {
          title: 'Service providers and access',
          paragraphs: [
            'WhenIsDue uses service providers, including Supabase for authentication and database services and Vercel for website hosting and deployment. These providers process information as needed to operate the service.',
            'The WhenIsDue operator may be technically able to access stored records when reasonably necessary for support, security, legal compliance, account deletion, or service administration. Users should avoid entering information that is not necessary for their work.',
          ],
        },
        {
          title: 'Security',
          paragraphs: [
            'WhenIsDue uses account authentication and database access controls intended to separate each user’s workspace. No online service can guarantee absolute security, and users are responsible for protecting their account password and devices.',
            'Do not share passwords through email or support messages. WhenIsDue will not ask you to send your password.',
          ],
        },
        {
          title: 'Backups, export, and retention',
          paragraphs: [
            'Workspace users can download a JSON backup containing their clients and tasks. Backup files do not intentionally include passwords, authentication tokens, or Supabase project keys.',
            'Workspace records are generally retained while the account remains active or as needed to provide the service. Some limited information may be retained when reasonably necessary for security, fraud prevention, dispute resolution, legal obligations, or recovery from backups.',
          ],
        },
        {
          title: 'Your choices and rights',
          paragraphs: [
            'You may edit or delete workspace records, download a backup, and request account deletion. Depending on applicable law, you may also have rights to request access, correction, objection, portability, erasure, or blocking of personal information.',
            `To make a privacy or account-deletion request, email ${contactEmail} from the email address associated with the account. WhenIsDue may request reasonable verification before acting on the request.`,
          ],
        },
        {
          title: 'Account deletion',
          paragraphs: [
            'Verified account-deletion requests are handled manually. WhenIsDue aims to delete the account and associated active workspace records within 30 days, unless limited retention is required or permitted for legal, security, fraud-prevention, dispute, or backup-recovery purposes.',
          ],
        },
        {
          title: 'Client information entered by workspace users',
          paragraphs: [
            'Workspace users decide what information to enter about their clients. Users are responsible for having an appropriate reason and authority to store that information and for following confidentiality, contractual, professional, and privacy obligations that apply to their work.',
          ],
        },
        {
          title: 'Children',
          paragraphs: [
            'WhenIsDue is not designed to collect personal information directly from children. Do not create an account or enter a child’s personal information unless you have the authority and lawful basis to do so.',
          ],
        },
        {
          title: 'Policy changes',
          paragraphs: [
            'This policy may be updated as the service changes. The effective date will be revised when material changes are published.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            `Privacy questions and requests can be sent to ${contactEmail}.`,
          ],
        },
      ],
      email: contactEmail,
    }
  }

  if (route === 'terms') {
    return {
      title: 'Terms of Use',
      sections: [
        {
          title: 'Effective date and operator',
          paragraphs: [
            'These Terms are effective July 30, 2026. The service is operated under the name WhenIsDue.',
          ],
        },
        {
          title: 'Acceptance',
          paragraphs: [
            'By using WhenIsDue, you agree to these Terms and the Privacy Policy. If you do not agree, do not use the service.',
          ],
        },
        {
          title: 'Public calculators',
          paragraphs: [
            'The calculators provide general date calculations for convenience and planning. Results may not account for holidays, time zones, provider-specific counting rules, contract language, local law, or special circumstances.',
            'You are responsible for checking important dates against the original agreement, receipt, invoice, policy, calendar, or official source.',
          ],
        },
        {
          title: 'VA Workspace accounts',
          paragraphs: [
            'You are responsible for providing accurate account information, maintaining the confidentiality of your password, securing your devices, and notifying WhenIsDue if you believe your account has been compromised.',
            'You may not access another person’s account or attempt to bypass authentication, database access controls, rate limits, or other safeguards.',
          ],
        },
        {
          title: 'Client and workspace information',
          paragraphs: [
            'You retain responsibility for the information you enter. You must have an appropriate right, permission, or lawful basis to store and use client information in the workspace.',
            'Do not use WhenIsDue to store information when doing so would violate a contract, professional duty, confidentiality obligation, privacy requirement, or applicable law.',
          ],
        },
        {
          title: 'Acceptable use',
          paragraphs: [
            'Do not use WhenIsDue for unlawful activity, harassment, fraud, unauthorized surveillance, malicious code, interference with the service, credential theft, or attempts to access data that does not belong to you.',
          ],
        },
        {
          title: 'Backups and availability',
          paragraphs: [
            'Workspace export tools are provided as an additional safeguard, but users remain responsible for downloading backups appropriate to their needs.',
            'WhenIsDue may be changed, suspended, interrupted, or discontinued. Continuous availability, perfect synchronization, permanent storage, and error-free operation are not guaranteed.',
          ],
        },
        {
          title: 'Deletion and termination',
          paragraphs: [
            `You may request account deletion by emailing ${contactEmail} from the email address associated with the account. Verified requests are generally processed within 30 days.`,
            'WhenIsDue may restrict or terminate access when reasonably necessary to protect users, comply with law, investigate misuse, or secure the service.',
          ],
        },
        {
          title: 'No professional advice',
          paragraphs: [
            'WhenIsDue does not provide legal, financial, tax, medical, employment, privacy-compliance, or other professional advice. Obtain qualified advice when the consequences of a deadline or data-handling decision are significant.',
          ],
        },
        {
          title: 'Disclaimer and limitation',
          paragraphs: [
            'The service is provided on an “as is” and “as available” basis to the extent permitted by law. WhenIsDue does not guarantee that calculations, reminders, stored records, synchronization, exports, or other features will always be complete, accurate, available, or suitable for a particular purpose.',
            'To the extent permitted by applicable law, WhenIsDue is not responsible for indirect, incidental, special, consequential, or business losses resulting from use of or inability to use the service.',
          ],
        },
        {
          title: 'Governing law',
          paragraphs: [
            'These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict-of-law principles.',
            'Nothing in these Terms limits rights that cannot legally be waived under applicable law.',
          ],
        },
        {
          title: 'Changes',
          paragraphs: [
            'These Terms may be updated as WhenIsDue changes. Continued use after revised Terms are published means you accept the revised Terms.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            `Questions about these Terms can be sent to ${contactEmail}.`,
          ],
        },
      ],
      email: contactEmail,
    }
  }

  return {
    title: 'Contact WhenIsDue',
    sections: [
      {
        title: 'Support and feedback',
        paragraphs: [
          'Use the email below for technical problems, corrections, feature feedback, privacy questions, and general support.',
        ],
      },
      {
        title: 'Account deletion and privacy requests',
        paragraphs: [
          'Send the request from the email address associated with your VA Workspace account. Include a clear request such as “Delete my WhenIsDue account.”',
          'Do not send your password, authentication code, Supabase key, or confidential client records by email.',
        ],
      },
      {
        title: 'Response expectations',
        paragraphs: [
          'WhenIsDue currently provides email support only. Response times are not guaranteed, but verified account-deletion requests are generally processed within 30 days.',
        ],
      },
    ],
    email: contactEmail,
  }
}

function formatBusinessDistance(days: number): string {
  return `${days} ${days === 1 ? 'business day' : 'business days'}`
}

function formatSpotlightRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining)
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`
  }

  if (daysRemaining === 0) {
    return 'Due today'
  }

  if (daysRemaining === 1) {
    return 'Due tomorrow'
  }

  return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`
}

function getUrgencyClass(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return 'status-overdue'
  }

  if (daysRemaining <= 2) {
    return 'status-now'
  }

  if (daysRemaining <= 7) {
    return 'status-soon'
  }

  return 'status-comfortable'
}

function compareSavedDeadlines(first: SavedDeadline, second: SavedDeadline): number {
  const firstDate = parsePlainDate(first.dueDate)
  const secondDate = parsePlainDate(second.dueDate)
  const firstKey = firstDate ? toDateKey(firstDate) : '9999-12-31'
  const secondKey = secondDate ? toDateKey(secondDate) : '9999-12-31'

  if (firstKey !== secondKey) {
    return firstKey.localeCompare(secondKey)
  }

  return second.createdAt.localeCompare(first.createdAt)
}

function isDuplicateSavedDeadline(deadlines: SavedDeadline[], nextDeadline: SavedDeadline): boolean {
  return deadlines.some(
    (deadline) =>
      deadline.title === nextDeadline.title &&
      deadline.category === nextDeadline.category &&
      deadline.dueDate === nextDeadline.dueDate,
  )
}

function getAmountLimit(mode: CalculatorMode): number {
  if (mode === 'business') {
    return 2600
  }

  if (mode === 'trial' || mode === 'return') {
    return 365
  }

  return 3650
}

function getValidationMessage(
  mode: CalculatorMode,
  startDate: PlainDate | null,
  amount: number | null,
  title: string,
): string | null {
  if (!startDate) {
    return 'Enter a valid date from 1900-01-01 to 2100-12-31.'
  }

  if (!isDateInSupportedRange(startDate)) {
    return 'Date must be from 1900-01-01 to 2100-12-31.'
  }

  if (mode !== 'invoice') {
    const limit = getAmountLimit(mode)

    if (amount === null || amount <= 0 || amount > limit) {
      return positiveWholeNumberMessage
    }
  }

  if (title.length > titleMaxLength) {
    return `Title must be ${titleMaxLength} characters or less.`
  }

  return null
}

function getBusinessDaysValidationMessage(
  startDate: PlainDate | null,
  businessDays: number | null,
  title: string,
): string | null {
  if (!startDate) {
    return 'Enter a valid date from 1900-01-01 to 2100-12-31.'
  }

  if (!isDateInSupportedRange(startDate)) {
    return 'Date must be from 1900-01-01 to 2100-12-31.'
  }

  if (businessDays === null || businessDays <= 0 || businessDays > 2600) {
    return positiveWholeNumberMessage
  }

  if (title.length > titleMaxLength) {
    return `Title must be ${titleMaxLength} characters or less.`
  }

  return null
}

function getSaveTitleValidationMessage(title: string): string | null {
  if (!title.trim()) {
    return 'Add a title before saving.'
  }

  if (title.length > titleMaxLength) {
    return `Title must be ${titleMaxLength} characters or less.`
  }

  return null
}

function getTrialValidationMessage(
  startDate: PlainDate | null,
  trialLength: number | null,
): string | null {
  if (!startDate) {
    return 'Enter a valid date from 1900-01-01 to 2100-12-31.'
  }

  if (!isDateInSupportedRange(startDate)) {
    return 'Date must be from 1900-01-01 to 2100-12-31.'
  }

  const limit = getAmountLimit('trial')

  if (trialLength === null || trialLength <= 0 || trialLength > limit) {
    return positiveWholeNumberMessage
  }

  return null
}

function getReturnWindowValidationMessage(
  purchaseDate: PlainDate | null,
  returnWindow: number | null,
): string | null {
  if (!purchaseDate) {
    return 'Enter a valid date from 1900-01-01 to 2100-12-31.'
  }

  if (!isDateInSupportedRange(purchaseDate)) {
    return 'Date must be from 1900-01-01 to 2100-12-31.'
  }

  const limit = getAmountLimit('return')

  if (returnWindow === null || returnWindow <= 0 || returnWindow > limit) {
    return positiveWholeNumberMessage
  }

  return null
}

type StorageResult = {
  ok: boolean
  message: string | null
}

function saveSavedDeadlines(deadlines: SavedDeadline[]): StorageResult {
  try {
    localStorage.setItem(storageKey, JSON.stringify(deadlines))
    return { ok: true, message: null }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return {
        ok: false,
        message: 'Browser storage is full. Delete a saved due date or copy the result.',
      }
    }

    return {
      ok: false,
      message: 'Saving is unavailable in this browser. You can still calculate due dates.',
    }
  }
}

function loadSavedDeadlines(): SavedDeadline[] {
  try {
    const savedValue = localStorage.getItem(storageKey)

    if (!savedValue) {
      return []
    }

    const parsed = JSON.parse(savedValue)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isSavedDeadline)
  } catch {
    return []
  }
}

function isSavedDeadline(value: unknown): value is SavedDeadline {
  if (!value || typeof value !== 'object') {
    return false
  }

  const deadline = value as Partial<SavedDeadline>

  const dueDate = typeof deadline.dueDate === 'string' ? parsePlainDate(deadline.dueDate) : null
  const startDate = typeof deadline.startDate === 'string' ? parsePlainDate(deadline.startDate) : null

  return (
    typeof deadline.id === 'string' &&
    typeof deadline.title === 'string' &&
    deadline.title.length <= titleMaxLength &&
    typeof deadline.dueDate === 'string' &&
    dueDate !== null &&
    isDateInSupportedRange(dueDate) &&
    (
      deadline.startDate === undefined ||
      (
        typeof deadline.startDate === 'string' &&
        startDate !== null &&
        isDateInSupportedRange(startDate)
      )
    ) &&
    typeof deadline.done === 'boolean' &&
    typeof deadline.createdAt === 'string' &&
    typeof deadline.category === 'string' &&
    modes.includes(deadline.category as CalculatorMode)
  )
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

export default App
