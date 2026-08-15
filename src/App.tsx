import { useEffect, useMemo, useState } from 'react'
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
      <header className="shipping-editorial-header" aria-label="WhenIsDue navigation">
        <a
          className="shipping-editorial-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="shipping-editorial-nav" aria-label="Main navigation">
          <a
            className="shipping-editorial-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section className="deadline-editorial-hero" aria-label="Deadline calculator answer">
        <div className="deadline-editorial-card">
          <p className="deadline-editorial-eyebrow">Rule-aware deadline calculator</p>
          <h1>When is it due?</h1>
          {result && parsedTriggerDate && parsedDuration !== null ? (
            <>
              <div className="deadline-editorial-divider" />
              <p className="deadline-editorial-rule">
                {parsedDuration} {unit === 'business-days' ? 'business days' : 'calendar days'} {direction === 'after' ? 'after' : 'before'}
              </p>
              <strong className="deadline-editorial-date">
                {formatPlainDate(result.answerDate)}
              </strong>
              <span className="deadline-editorial-weekday">
                {formatWeekday(result.answerDate)}
              </span>
              <div className="deadline-editorial-meta">
                <span>Start date</span>
                <strong>{formatPlainDate(parsedTriggerDate)}</strong>
              </div>
            </>
          ) : (
            <p className="deadline-editorial-empty">Set the date and counting rule below.</p>
          )}
        </div>
      </section>

      <section className="deadline-rule-shell">
        <header className="deadline-rule-intro">
          <p className="friendly-eyebrow">Your calculation</p>
          <h2>Set the date and counting rule</h2>
          <p>The due date updates immediately.</p>
        </header>

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
          <section className="deadline-rule-answer" aria-live="polite">
            <span>Due date</span>
            <strong>{formatPlainDate(result.answerDate)}</strong>
            <small>{formatWeekday(result.answerDate)}</small>

            <p>
              {result ? buildDeadlineExplanation(result, triggerKind) : null}
            </p>

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
                    unit === 'business-days'
                      ? 'business days'
                      : 'calendar days'
                  }`,
                },
                ...(unit === 'business-days' && workingSchedule
                  ? [
                      {
                        label: 'Working days',
                        value: workingSchedule.label,
                      },
                    ]
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
                  ? [
                      {
                        label: 'Skipped dates',
                        value:
                          result.skippedDates.length === 1
                            ? '1 non-working day skipped'
                            : `${result.skippedDates.length} non-working days skipped`,
                      },
                    ]
                  : []),
              ]}
            />
            {result ? <DeadlineProvenanceDetails answer={result} /> : null}
          </section>
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
          background: #fffaf2;
        }

        .deadline-rule-page .shipping-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .deadline-rule-page .shipping-editorial-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .deadline-rule-page .shipping-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .deadline-rule-page .shipping-editorial-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .deadline-rule-page .shipping-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .deadline-editorial-hero {
          position: relative;
          width: min(100% - 24px, 1100px);
          min-height: 520px;
          margin: 14px auto 0;
          overflow: hidden;
          border: 1px solid rgba(22, 49, 78, 0.12);
          border-radius: 28px;
          background-image: url('/deadline-calculator-background.webp');
          background-position: center;
          background-size: cover;
        }

        .deadline-editorial-card {
          position: absolute;
          top: 34px;
          left: 34px;
          width: min(46%, 500px);
          padding: 34px 36px 30px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 24px;
          background: rgba(255, 252, 245, 0.94);
          box-shadow: 0 18px 50px rgba(39, 40, 34, 0.08);
          backdrop-filter: blur(8px);
        }

        .deadline-editorial-eyebrow {
          margin: 0;
          color: #2e8872;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .deadline-editorial-card h1 {
          margin: 10px 0 0;
          color: #14375f;
          font-size: clamp(3rem, 5.2vw, 5.2rem);
          line-height: 0.94;
          letter-spacing: -0.055em;
        }

        .deadline-editorial-divider {
          height: 1px;
          margin: 24px 0 18px;
          background: rgba(22, 49, 78, 0.13);
        }

        .deadline-editorial-rule {
          margin: 0;
          color: #657b91;
          font-size: 1rem;
          font-weight: 800;
        }

        .deadline-editorial-date {
          display: block;
          margin-top: 8px;
          color: #14375f;
          font-size: clamp(2.45rem, 4.5vw, 4.4rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .deadline-editorial-weekday {
          display: block;
          margin-top: 7px;
          color: #627990;
          font-size: 1.08rem;
          font-weight: 800;
        }

        .deadline-editorial-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          padding: 14px 16px;
          border-radius: 14px;
          background: #edf6f8;
        }

        .deadline-editorial-meta span {
          color: #60788e;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .deadline-editorial-meta strong {
          color: #234765;
          font-size: 0.98rem;
        }

        .deadline-editorial-empty {
          margin: 22px 0 0;
          color: #657b91;
          font-size: 1rem;
          line-height: 1.5;
        }

        .deadline-rule-shell {
          width: min(100% - 24px, 1100px);
          margin: 22px auto 0;
          padding: 30px 32px 54px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.72);
        }

        .deadline-rule-intro {
          text-align: left;
        }

        .deadline-rule-intro h2 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.1rem, 4vw, 3.3rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .deadline-rule-intro > p:last-child {
          margin: 10px 0 0;
          color: #61788f;
          font-size: 1rem;
          line-height: 1.5;
        }

        .deadline-rule-source-note {
          display: grid;
          gap: 4px;
          margin: 20px auto 0;
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
          font-size: 0.96rem;
          line-height: 1.5;
        }

        .deadline-rule-essential {
          display: grid;
          grid-template-columns: 1.25fr 0.8fr 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
          padding: 22px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 18px;
          background: #f2eee5;
        }

        .deadline-rule-essential label,
        .deadline-rule-advanced-grid label {
          display: grid;
          gap: 7px;
        }

        .deadline-rule-essential label > span,
        .deadline-rule-advanced-grid label > span {
          color: #526a82;
          font-size: 0.92rem;
          font-weight: 850;
        }

        .deadline-rule-essential input,
        .deadline-rule-essential select,
        .deadline-rule-advanced-grid select {
          min-height: 52px;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(22, 49, 78, 0.14);
          border-radius: 12px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .deadline-rule-answer {
          margin-top: 16px;
          padding: 30px 28px;
          border: 0;
          border-radius: 20px;
          background: #173b63;
          text-align: left;
        }

        .deadline-rule-answer > span {
          color: #9fd0b4;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .deadline-rule-answer > strong {
          display: block;
          margin-top: 8px;
          color: #fff7e8;
          font-size: clamp(2.1rem, 7vw, 3.7rem);
          line-height: 1.05;
        }

        .deadline-rule-answer > small {
          display: block;
          margin-top: 8px;
          color: #d5e0eb;
          font-size: 1rem;
          font-weight: 750;
        }

        .deadline-rule-answer > p {
          max-width: 760px;
          margin: 18px 0 0;
          color: #d5e0eb;
          font-size: 1rem;
          line-height: 1.6;
        }

        .deadline-rule-compare {
          margin-top: 16px;
          padding: 18px;
          border: 1px solid rgba(183, 121, 31, 0.16);
          border-radius: 16px;
          background: #fffdf8;
        }

        .deadline-rule-ambiguity {
          margin-top: 16px;
        }

        .deadline-rule-ambiguity .deadline-rule-compare-grid button {
          min-height: 136px;
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
          border: 1px solid rgba(22, 49, 78, 0.1);
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

        .deadline-rule-advanced {
          margin-top: 16px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.7);
        }

        .deadline-rule-advanced summary {
          min-height: 48px;
          display: flex;
          align-items: center;
          padding: 10px 14px;
          color: #36526f;
          font-size: 0.98rem;
          font-weight: 850;
          cursor: pointer;
        }

        .deadline-rule-advanced-grid {
          display: grid;
          gap: 12px;
          padding: 0 14px 16px;
        }

        .deadline-rule-caveat,
        .deadline-rule-error {
          max-width: 680px;
          margin: 16px auto 0;
          color: #657b91;
          font-size: 0.95rem;
          line-height: 1.55;
          text-align: center;
        }

        @media (max-width: 900px) and (min-width: 721px) {
          .deadline-rule-essential {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .deadline-rule-page .shipping-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .deadline-rule-page .shipping-editorial-brand img {
            width: 154px;
          }

          .deadline-rule-page .shipping-editorial-nav {
            gap: 12px;
          }

          .deadline-rule-page .shipping-editorial-nav a {
            font-size: 0.8rem;
          }

          .deadline-rule-page .shipping-editorial-home-link {
            display: none;
          }

          .deadline-editorial-hero {
            width: calc(100% - 28px);
            min-height: 660px;
            margin-top: 14px;
            border-radius: 24px;
            background-position: 58% center;
          }

          .deadline-editorial-card {
            top: 24px;
            left: 20px;
            right: 20px;
            width: auto;
            padding: 24px 22px 22px;
            border-radius: 22px;
          }

          .deadline-editorial-card h1 {
            font-size: clamp(3.25rem, 14vw, 4.25rem);
          }

          .deadline-editorial-date {
            font-size: clamp(2.55rem, 11.5vw, 3.65rem);
          }

          .deadline-editorial-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

          .deadline-rule-shell {
            width: calc(100% - 28px);
            margin-top: 16px;
            padding: 24px 18px 38px;
            border-radius: 22px;
          }

          .deadline-rule-intro h2 {
            font-size: clamp(2.35rem, 11vw, 3.15rem);
          }

          .deadline-rule-essential {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            padding: 16px;
          }

          .deadline-rule-essential label:first-child,
          .deadline-rule-essential label:nth-child(3),
          .deadline-rule-essential label:nth-child(4) {
            grid-column: 1 / -1;
          }

          .deadline-rule-essential input,
          .deadline-rule-essential select {
            min-height: 50px;
          }

          .deadline-rule-compare-grid {
            grid-template-columns: 1fr;
          }

          .deadline-rule-answer {
            padding: 26px 20px;
            border-radius: 20px;
          }

          .deadline-rule-answer > strong {
            font-size: clamp(2.65rem, 12vw, 3.6rem);
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
    <main className="page-shell start-date-guide-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <article className="start-date-guide-shell">
        <header className="start-date-guide-hero">
          <p className="friendly-eyebrow">Deadline counting guide</p>
          <h1>Does the start date count?</h1>

          <div className="start-date-guide-answer">
            <strong>It depends on the wording of the rule.</strong>
            <p>
              If a deadline says <b>“5 business days after August 10”</b>,
              August 10 is normally treated as the reference date and counting
              starts after it. If the rule says <b>“count August 10 as day
              one”</b>, the start date counts when it is a qualifying day.
              Wording such as <b>“within 5 business days of August 10”</b> may
              not tell you which convention to use.
            </p>
          </div>

          <p className="start-date-guide-scope">
            General counting guidance only. The contract, policy, law, or
            instruction that created the deadline controls.
          </p>
        </header>

        <section
          className="start-date-guide-example"
          aria-labelledby="start-date-guide-example-title"
        >
          <div className="start-date-guide-example-heading">
            <span>Worked example</span>
            <h2 id="start-date-guide-example-title">
              August 10, 2026 + 5 business days
            </h2>
            <p>Monday–Friday only. Public holidays are not excluded.</p>
          </div>

          <div className="start-date-guide-results">
            <div>
              <span>Start date does not count</span>
              <strong>
                {excluded ? formatPlainDate(excluded.answerDate) : '—'}
              </strong>
              <small>
                {excluded ? formatWeekday(excluded.answerDate) : ''}
              </small>
              <p>Counting begins with the next qualifying business day.</p>
            </div>

            <div>
              <span>Start date counts as day 1</span>
              <strong>
                {included ? formatPlainDate(included.answerDate) : '—'}
              </strong>
              <small>
                {included ? formatWeekday(included.answerDate) : ''}
              </small>
              <p>August 10 is day 1 because it is a Monday.</p>
            </div>
          </div>

          <a
            className="start-date-guide-cta"
            href={calculatorPath}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'start_date_count',
              })
              onNavigate(calculatorPath)
            }}
          >
            Check your exact deadline →
          </a>
        </section>

        <section className="start-date-guide-content">
          <article>
            <h2>When the wording is clear</h2>
            <dl>
              <div>
                <dt>“5 business days after receipt”</dt>
                <dd>
                  The receipt date is the reference event. Counting starts
                  after that date unless the governing rule says otherwise.
                </dd>
              </div>
              <div>
                <dt>“Count the date received as day one”</dt>
                <dd>
                  The instruction explicitly tells you to include the start
                  date when it qualifies.
                </dd>
              </div>
            </dl>
          </article>

          <article>
            <h2>When the wording is not clear</h2>
            <p>
              Phrases such as “within 5 business days of,” “5 business days
              from,” or similar wording can leave the start-day convention
              unstated. In that situation, a calculator should not silently
              turn one interpretation into an authoritative deadline.
            </p>
            <p>
              WhenIsDue can show both possible dates so you can compare them
              against the original instruction before choosing a rule.
            </p>
          </article>

          <article>
            <h2>Why one day can change the answer</h2>
            <p>
              With calendar days, including the start date can shift the result
              by one calendar day. With business days, weekends and selected
              public holidays can make the difference look larger on the
              calendar.
            </p>
          </article>

          <article>
            <h2>What should you do if the rule is silent?</h2>
            <p>
              Do not guess when the deadline matters. Check the original
              contract, policy, notice, statute, court rule, or other source
              that created the deadline. If the source still does not resolve
              the convention, ask the responsible person or qualified adviser
              before relying on one date.
            </p>
          </article>
        </section>

        <section className="start-date-guide-related" aria-label="Related tools">
          <div>
            <span>Related tools</span>
            <h2>Calculate the date with the rule made explicit</h2>
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
        .start-date-guide-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .start-date-guide-shell {
          width: min(100% - 32px, 920px);
          margin: 0 auto;
          padding: 36px 0 64px;
        }

        .start-date-guide-hero {
          text-align: center;
        }

        .start-date-guide-hero h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 7vw, 4.6rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .start-date-guide-answer {
          max-width: 760px;
          margin: 22px auto 0;
          padding: 22px;
          border: 1px solid rgba(22, 49, 78, 0.09);
          border-radius: 18px;
          background: #fff;
          text-align: left;
        }

        .start-date-guide-answer > strong {
          display: block;
          color: #17304d;
          font-size: clamp(1.4rem, 3vw, 2rem);
          line-height: 1.2;
        }

        .start-date-guide-answer p {
          margin: 10px 0 0;
          color: #526a82;
          font-size: 1.02rem;
          line-height: 1.65;
        }

        .start-date-guide-answer b {
          color: #29435e;
        }

        .start-date-guide-scope {
          max-width: 700px;
          margin: 12px auto 0;
          color: #718197;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .start-date-guide-example {
          margin-top: 28px;
          padding: 20px;
          border: 1px solid rgba(183, 121, 31, 0.16);
          border-radius: 18px;
          background: #fffdf8;
        }

        .start-date-guide-example-heading {
          text-align: center;
        }

        .start-date-guide-example-heading > span,
        .start-date-guide-related > div > span {
          color: #8a6a2c;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .start-date-guide-example-heading h2,
        .start-date-guide-related h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.25rem;
        }

        .start-date-guide-example-heading p {
          margin: 6px 0 0;
          color: #718197;
          font-size: 0.94rem;
        }

        .start-date-guide-results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .start-date-guide-results > div {
          padding: 17px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 14px;
          background: #fff;
        }

        .start-date-guide-results span {
          display: block;
          color: #526a82;
          font-size: 0.92rem;
          font-weight: 850;
        }

        .start-date-guide-results strong {
          display: block;
          margin-top: 7px;
          color: #17304d;
          font-size: clamp(1.55rem, 3vw, 2.15rem);
          line-height: 1.1;
        }

        .start-date-guide-results small {
          display: block;
          margin-top: 4px;
          color: #6d8196;
          font-size: 0.94rem;
        }

        .start-date-guide-results p {
          margin: 10px 0 0;
          color: #667c92;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .start-date-guide-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 18px auto 0;
          padding: 9px 15px;
          border-radius: 11px;
          background: #173a63;
          color: #fff;
          font-weight: 850;
          text-decoration: none;
        }

        .start-date-guide-content {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .start-date-guide-content > article {
          padding: 20px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
        }

        .start-date-guide-content h2 {
          margin: 0;
          color: #29435e;
          font-size: 1.2rem;
        }

        .start-date-guide-content p {
          margin: 9px 0 0;
          color: #5f748a;
          font-size: 1rem;
          line-height: 1.65;
        }

        .start-date-guide-content dl {
          display: grid;
          gap: 10px;
          margin: 14px 0 0;
        }

        .start-date-guide-content dl > div {
          padding: 13px 14px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 12px;
          background: #fff;
        }

        .start-date-guide-content dt {
          color: #29435e;
          font-weight: 900;
        }

        .start-date-guide-content dd {
          margin: 5px 0 0;
          color: #667c92;
          line-height: 1.55;
        }

        .start-date-guide-related {
          margin-top: 24px;
          padding: 20px 0 0;
          border-top: 1px solid rgba(22, 49, 78, 0.1);
        }

        .start-date-guide-related nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .start-date-guide-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 720px) {
          .start-date-guide-shell {
            width: min(100% - 20px, 920px);
            padding-top: 24px;
          }

          .start-date-guide-results {
            grid-template-columns: 1fr;
          }

          .start-date-guide-answer,
          .start-date-guide-example,
          .start-date-guide-content > article {
            padding: 16px;
          }

          .start-date-guide-related nav {
            display: grid;
            grid-template-columns: 1fr;
          }

          .start-date-guide-related a {
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
  const threeCalendarDays = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 3,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const calculatorPath =
    '/deadline-calculator?date=2026-08-14&days=1&unit=business-days&direction=after&startday=exclude-trigger'

  return (
    <main className="page-shell weekends-business-guide-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <article className="weekends-business-guide-shell">
        <header className="weekends-business-guide-hero">
          <p className="friendly-eyebrow">Business-day guide</p>
          <h1>Do weekends count as business days?</h1>

          <div className="weekends-business-guide-answer">
            <strong>No — not in the standard Monday–Friday business-day rule.</strong>
            <p>
              Saturdays and Sundays are skipped when a deadline is measured in
              business days using a Monday–Friday workweek. Calendar days are
              different: they count weekends unless the governing rule says
              otherwise.
            </p>
          </div>

          <p className="weekends-business-guide-scope">
            “Business day” can be defined differently by a contract, employer,
            jurisdiction, market, or industry. Use the definition that applies
            to your deadline.
          </p>
        </header>

        <section
          className="weekends-business-guide-example"
          aria-labelledby="weekends-business-guide-example-title"
        >
          <div className="weekends-business-guide-example-heading">
            <span>Worked example</span>
            <h2 id="weekends-business-guide-example-title">
              Start on Friday, August 14, 2026
            </h2>
          </div>

          <div className="weekends-business-guide-results">
            <div>
              <span>Add 1 business day</span>
              <strong>
                {oneBusinessDay
                  ? formatPlainDate(oneBusinessDay.answerDate)
                  : '—'}
              </strong>
              <small>
                {oneBusinessDay
                  ? formatWeekday(oneBusinessDay.answerDate)
                  : ''}
              </small>
              <p>
                Saturday and Sunday are skipped, so the next standard business
                day is Monday.
              </p>
            </div>

            <div>
              <span>Add 3 calendar days</span>
              <strong>
                {threeCalendarDays
                  ? formatPlainDate(threeCalendarDays.answerDate)
                  : '—'}
              </strong>
              <small>
                {threeCalendarDays
                  ? formatWeekday(threeCalendarDays.answerDate)
                  : ''}
              </small>
              <p>
                Calendar-day counting includes Saturday and Sunday.
              </p>
            </div>
          </div>

          <a
            className="weekends-business-guide-cta"
            href={calculatorPath}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'weekends_business_days',
              })
              onNavigate(calculatorPath)
            }}
          >
            Calculate your exact deadline →
          </a>
        </section>

        <section className="weekends-business-guide-content">
          <article>
            <h2>What counts as a business day?</h2>
            <p>
              In WhenIsDue’s standard business-day schedule, Monday through
              Friday are working days and Saturday and Sunday are not. A
              selected public-holiday calendar can exclude supported holidays
              as well.
            </p>
          </article>

          <article>
            <h2>Do public holidays count?</h2>
            <p>
              Weekends and public holidays are separate rules. A calculator
              can skip weekends while still counting a weekday public holiday
              unless a holiday calendar or governing rule says to exclude it.
            </p>
            <p>
              WhenIsDue therefore shows the holiday calendar used instead of
              silently assuming that every public holiday should be removed.
            </p>
          </article>

          <article>
            <h2>What if the deadline itself lands on a weekend?</h2>
            <p>
              Do not automatically move it unless the rule that created the
              deadline says to do so. Some instructions move a non-business
              final date to the next business day, some use the previous
              business day, and some leave the calendar date unchanged.
            </p>
          </article>

          <article>
            <h2>Business days vs calendar days</h2>
            <dl>
              <div>
                <dt>Business days</dt>
                <dd>
                  Count only qualifying working days under the selected
                  schedule and holiday rules.
                </dd>
              </div>
              <div>
                <dt>Calendar days</dt>
                <dd>
                  Count every date on the calendar, including Saturdays and
                  Sundays, unless a separate final-day rule changes the result.
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="weekends-business-guide-related" aria-label="Related deadline guides and tools">
          <div>
            <span>Related answers</span>
            <h2>Make the counting rule explicit</h2>
          </div>

          <nav>
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
        .weekends-business-guide-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .weekends-business-guide-shell {
          width: min(100% - 32px, 920px);
          margin: 0 auto;
          padding: 36px 0 64px;
        }

        .weekends-business-guide-hero {
          text-align: center;
        }

        .weekends-business-guide-hero h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 7vw, 4.6rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .weekends-business-guide-answer {
          max-width: 760px;
          margin: 22px auto 0;
          padding: 22px;
          border: 1px solid rgba(22, 49, 78, 0.09);
          border-radius: 18px;
          background: #fff;
          text-align: left;
        }

        .weekends-business-guide-answer > strong {
          display: block;
          color: #17304d;
          font-size: clamp(1.35rem, 3vw, 1.9rem);
          line-height: 1.2;
        }

        .weekends-business-guide-answer p {
          margin: 10px 0 0;
          color: #526a82;
          font-size: 1.02rem;
          line-height: 1.65;
        }

        .weekends-business-guide-scope {
          max-width: 700px;
          margin: 12px auto 0;
          color: #718197;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .weekends-business-guide-example {
          margin-top: 28px;
          padding: 20px;
          border: 1px solid rgba(183, 121, 31, 0.16);
          border-radius: 18px;
          background: #fffdf8;
        }

        .weekends-business-guide-example-heading {
          text-align: center;
        }

        .weekends-business-guide-example-heading > span,
        .weekends-business-guide-related > div > span {
          color: #8a6a2c;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .weekends-business-guide-example-heading h2,
        .weekends-business-guide-related h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.25rem;
        }

        .weekends-business-guide-results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .weekends-business-guide-results > div {
          padding: 17px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 14px;
          background: #fff;
        }

        .weekends-business-guide-results span {
          display: block;
          color: #526a82;
          font-size: 0.92rem;
          font-weight: 850;
        }

        .weekends-business-guide-results strong {
          display: block;
          margin-top: 7px;
          color: #17304d;
          font-size: clamp(1.55rem, 3vw, 2.15rem);
          line-height: 1.1;
        }

        .weekends-business-guide-results small {
          display: block;
          margin-top: 4px;
          color: #6d8196;
          font-size: 0.94rem;
        }

        .weekends-business-guide-results p {
          margin: 10px 0 0;
          color: #667c92;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .weekends-business-guide-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 18px auto 0;
          padding: 9px 15px;
          border-radius: 11px;
          background: #173a63;
          color: #fff;
          font-weight: 850;
          text-decoration: none;
        }

        .weekends-business-guide-content {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .weekends-business-guide-content > article {
          padding: 20px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
        }

        .weekends-business-guide-content h2 {
          margin: 0;
          color: #29435e;
          font-size: 1.2rem;
        }

        .weekends-business-guide-content p {
          margin: 9px 0 0;
          color: #5f748a;
          font-size: 1rem;
          line-height: 1.65;
        }

        .weekends-business-guide-content dl {
          display: grid;
          gap: 10px;
          margin: 14px 0 0;
        }

        .weekends-business-guide-content dl > div {
          padding: 13px 14px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 12px;
          background: #fff;
        }

        .weekends-business-guide-content dt {
          color: #29435e;
          font-weight: 900;
        }

        .weekends-business-guide-content dd {
          margin: 5px 0 0;
          color: #667c92;
          line-height: 1.55;
        }

        .weekends-business-guide-related {
          margin-top: 24px;
          padding: 20px 0 0;
          border-top: 1px solid rgba(22, 49, 78, 0.1);
        }

        .weekends-business-guide-related nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .weekends-business-guide-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 720px) {
          .weekends-business-guide-shell {
            width: min(100% - 20px, 920px);
            padding-top: 24px;
          }

          .weekends-business-guide-results {
            grid-template-columns: 1fr;
          }

          .weekends-business-guide-answer,
          .weekends-business-guide-example,
          .weekends-business-guide-content > article {
            padding: 16px;
          }

          .weekends-business-guide-related nav {
            display: grid;
            grid-template-columns: 1fr;
          }

          .weekends-business-guide-related a {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  )
}


function PublicHolidaysBusinessDaysGuidePage({ onNavigate }: NavigationProps) {
  const friday = parsePlainDate('2026-09-04')!

  const withoutHolidayCalendar = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  const withUsFederalHolidays = calculateDeadlineByRule({
    triggerDate: friday,
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'us',
    endDayAdjustment: 'none',
  })

  const calculatorPath =
    '/deadline-calculator?date=2026-09-04&days=1&unit=business-days&direction=after&startday=exclude-trigger&calendar=us'

  return (
    <main className="page-shell public-holidays-business-guide-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <article className="public-holidays-business-guide-shell">
        <header className="public-holidays-business-guide-hero">
          <p className="friendly-eyebrow">Business-day guide</p>
          <h1>Do public holidays count as business days?</h1>

          <div className="public-holidays-business-guide-answer">
            <strong>Sometimes — it depends on the rule and holiday calendar being used.</strong>
            <p>
              A weekday public holiday can either count or be skipped. If your
              deadline says to exclude public holidays, use the applicable
              holiday calendar. If it only says “business days” and does not
              define holidays, check the source that created the deadline
              instead of assuming.
            </p>
          </div>

          <p className="public-holidays-business-guide-scope">
            Holiday coverage varies by country, state, province, territory,
            employer, and proclamation. The governing rule controls.
          </p>
        </header>

        <section
          className="public-holidays-business-guide-example"
          aria-labelledby="public-holidays-business-guide-example-title"
        >
          <div className="public-holidays-business-guide-example-heading">
            <span>Worked example</span>
            <h2 id="public-holidays-business-guide-example-title">
              Start Friday, September 4, 2026 + 1 business day
            </h2>
            <p>
              Monday, September 7, 2026 is US Labor Day.
            </p>
          </div>

          <div className="public-holidays-business-guide-results">
            <div>
              <span>Weekends only</span>
              <strong>
                {withoutHolidayCalendar
                  ? formatPlainDate(withoutHolidayCalendar.answerDate)
                  : '—'}
              </strong>
              <small>
                {withoutHolidayCalendar
                  ? formatWeekday(withoutHolidayCalendar.answerDate)
                  : ''}
              </small>
              <p>
                Monday is a weekday, so it counts when no public-holiday
                exclusions are applied.
              </p>
            </div>

            <div>
              <span>US federal holidays excluded</span>
              <strong>
                {withUsFederalHolidays
                  ? formatPlainDate(withUsFederalHolidays.answerDate)
                  : '—'}
              </strong>
              <small>
                {withUsFederalHolidays
                  ? formatWeekday(withUsFederalHolidays.answerDate)
                  : ''}
              </small>
              <p>
                Labor Day is skipped, so the next qualifying business day is
                Tuesday.
              </p>
            </div>
          </div>

          <a
            className="public-holidays-business-guide-cta"
            href={calculatorPath}
            onClick={(event) => {
              event.preventDefault()
              trackWhenIsDueEvent('authority_guide_calculator_click', {
                guide: 'public_holidays_business_days',
              })
              onNavigate(calculatorPath)
            }}
          >
            Calculate with your holiday calendar →
          </a>
        </section>

        <section className="public-holidays-business-guide-content">
          <article>
            <h2>Why “business day” is not always enough</h2>
            <p>
              Monday through Friday is only the working-week part of the rule.
              Holidays are a separate question. A weekday can be Monday through
              Friday and still be excluded because it is a recognized public
              holiday under the applicable calendar.
            </p>
          </article>

          <article>
            <h2>Which holiday calendar should you use?</h2>
            <p>
              Use the calendar named by the contract, policy, law, employer, or
              organization that created the deadline. Do not substitute a
              different national or local calendar just because the date looks
              like a holiday where you live.
            </p>
          </article>

          <article>
            <h2>What WhenIsDue supports</h2>
            <p>
              WhenIsDue can optionally exclude supported holidays for the US,
              England &amp; Wales, Canada, Australia, and the Philippines.
              Coverage is deliberately labeled because local, provincial,
              state, territory, company-specific, and proclamation-based
              closures can differ.
            </p>
          </article>

          <article>
            <h2>What if the final date itself is a holiday?</h2>
            <p>
              That is a separate final-day rule. Some instructions move the
              deadline to the next business day, some move it to the previous
              business day, and some do not move it at all. WhenIsDue keeps
              that adjustment separate so the calculation does not silently
              invent a policy.
            </p>
          </article>

          <article>
            <h2>Quick rule of thumb</h2>
            <dl>
              <div>
                <dt>The rule explicitly excludes public holidays</dt>
                <dd>
                  Use the applicable holiday calendar and skip those dates.
                </dd>
              </div>
              <div>
                <dt>The rule says only “business days”</dt>
                <dd>
                  Check how that term is defined before assuming holidays are
                  excluded.
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section
          className="public-holidays-business-guide-related"
          aria-label="Related deadline guides and tools"
        >
          <div>
            <span>Related answers</span>
            <h2>Make each counting rule explicit</h2>
          </div>

          <nav>
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
        planningNote="For planning only. Check the holiday calendar and final-day rule that apply to your deadline."
      />

      <style>{`
        .public-holidays-business-guide-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .public-holidays-business-guide-shell {
          width: min(100% - 32px, 920px);
          margin: 0 auto;
          padding: 36px 0 64px;
        }

        .public-holidays-business-guide-hero {
          text-align: center;
        }

        .public-holidays-business-guide-hero h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 7vw, 4.6rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .public-holidays-business-guide-answer {
          max-width: 760px;
          margin: 22px auto 0;
          padding: 22px;
          border: 1px solid rgba(22, 49, 78, 0.09);
          border-radius: 18px;
          background: #fff;
          text-align: left;
        }

        .public-holidays-business-guide-answer > strong {
          display: block;
          color: #17304d;
          font-size: clamp(1.35rem, 3vw, 1.9rem);
          line-height: 1.2;
        }

        .public-holidays-business-guide-answer p {
          margin: 10px 0 0;
          color: #526a82;
          font-size: 1.02rem;
          line-height: 1.65;
        }

        .public-holidays-business-guide-scope {
          max-width: 700px;
          margin: 12px auto 0;
          color: #718197;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .public-holidays-business-guide-example {
          margin-top: 28px;
          padding: 20px;
          border: 1px solid rgba(183, 121, 31, 0.16);
          border-radius: 18px;
          background: #fffdf8;
        }

        .public-holidays-business-guide-example-heading {
          text-align: center;
        }

        .public-holidays-business-guide-example-heading > span,
        .public-holidays-business-guide-related > div > span {
          color: #8a6a2c;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .public-holidays-business-guide-example-heading h2,
        .public-holidays-business-guide-related h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.25rem;
        }

        .public-holidays-business-guide-example-heading p {
          margin: 6px 0 0;
          color: #718197;
          font-size: 0.94rem;
        }

        .public-holidays-business-guide-results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .public-holidays-business-guide-results > div {
          padding: 17px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 14px;
          background: #fff;
        }

        .public-holidays-business-guide-results span {
          display: block;
          color: #526a82;
          font-size: 0.92rem;
          font-weight: 850;
        }

        .public-holidays-business-guide-results strong {
          display: block;
          margin-top: 7px;
          color: #17304d;
          font-size: clamp(1.55rem, 3vw, 2.15rem);
          line-height: 1.1;
        }

        .public-holidays-business-guide-results small {
          display: block;
          margin-top: 4px;
          color: #6d8196;
          font-size: 0.94rem;
        }

        .public-holidays-business-guide-results p {
          margin: 10px 0 0;
          color: #667c92;
          font-size: 0.94rem;
          line-height: 1.5;
        }

        .public-holidays-business-guide-cta {
          min-height: 48px;
          width: fit-content;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 18px auto 0;
          padding: 9px 15px;
          border-radius: 11px;
          background: #173a63;
          color: #fff;
          font-weight: 850;
          text-decoration: none;
        }

        .public-holidays-business-guide-content {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }

        .public-holidays-business-guide-content > article {
          padding: 20px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
        }

        .public-holidays-business-guide-content h2 {
          margin: 0;
          color: #29435e;
          font-size: 1.2rem;
        }

        .public-holidays-business-guide-content p {
          margin: 9px 0 0;
          color: #5f748a;
          font-size: 1rem;
          line-height: 1.65;
        }

        .public-holidays-business-guide-content dl {
          display: grid;
          gap: 10px;
          margin: 14px 0 0;
        }

        .public-holidays-business-guide-content dl > div {
          padding: 13px 14px;
          border: 1px solid rgba(22, 49, 78, 0.08);
          border-radius: 12px;
          background: #fff;
        }

        .public-holidays-business-guide-content dt {
          color: #29435e;
          font-weight: 900;
        }

        .public-holidays-business-guide-content dd {
          margin: 5px 0 0;
          color: #667c92;
          line-height: 1.55;
        }

        .public-holidays-business-guide-related {
          margin-top: 24px;
          padding: 20px 0 0;
          border-top: 1px solid rgba(22, 49, 78, 0.1);
        }

        .public-holidays-business-guide-related nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .public-holidays-business-guide-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(22, 49, 78, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.88rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 720px) {
          .public-holidays-business-guide-shell {
            width: min(100% - 20px, 920px);
            padding-top: 24px;
          }

          .public-holidays-business-guide-results {
            grid-template-columns: 1fr;
          }

          .public-holidays-business-guide-answer,
          .public-holidays-business-guide-example,
          .public-holidays-business-guide-content > article {
            padding: 16px;
          }

          .public-holidays-business-guide-related nav {
            display: grid;
            grid-template-columns: 1fr;
          }

          .public-holidays-business-guide-related a {
            justify-content: center;
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
  }, [
    startDate,
    minimumDays,
    maximumDays,
    countMode,
    holidayCalendar,
  ])

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

  return (
    <main className="page-shell shipping-range-page shipping-editorial-page">
      <header className="shipping-editorial-header" aria-label="WhenIsDue navigation">
        <a
          className="shipping-editorial-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="shipping-editorial-nav" aria-label="Main navigation">
          <a
            className="shipping-editorial-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section className="shipping-editorial-hero" aria-labelledby="shipping-title">
        <div className="shipping-editorial-image-wrap">
          <img
            className="shipping-editorial-image"
            src="/business-days-light-gap.webp"
            alt="Warm architectural interior with a sequence of daylight bands interrupted by a wider shadow interval"
          />

          <div className="shipping-editorial-answer">
            <p className="shipping-editorial-eyebrow">Delivery range calculator</p>
            <h1 id="shipping-title">
              When will {minimumDays || '3'}–{maximumDays || '5'}{' '}
              {countMode === 'business' ? 'business' : 'calendar'} days arrive?
            </h1>

            {earliest && latest ? (
              <div className="shipping-editorial-range">
                <div>
                  <span>Earliest</span>
                  <strong>{formatPlainDate(earliest)}</strong>
                  <small>{formatWeekday(earliest)}</small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>Latest</span>
                  <strong>{formatPlainDate(latest)}</strong>
                  <small>{formatWeekday(latest)}</small>
                </div>
              </div>
            ) : (
              <p className="shipping-editorial-error">{validationMessage}</p>
            )}
          </div>
        </div>
      </section>

      <section className="shipping-editorial-workspace" aria-label="Shipping and delivery range calculator">
        <div className="shipping-editorial-heading">
          <p className="shipping-section-eyebrow">Your calculation</p>
          <h2>Set the ship date and delivery window</h2>
          <p>The range updates immediately.</p>
        </div>

        <div className="shipping-editorial-calculation-grid">
          <form className="shipping-editorial-form" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              <span>Order or ship date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <div className="shipping-editorial-days-grid">
              <label className="field">
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

              <label className="field">
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
            </div>

            <fieldset className="shipping-editorial-mode">
              <legend>Count as</legend>
              <label>
                <input
                  type="radio"
                  name="shipping-range-mode"
                  value="business"
                  checked={countMode === 'business'}
                  onChange={() => setCountMode('business')}
                />
                <span>Business days</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="shipping-range-mode"
                  value="calendar"
                  checked={countMode === 'calendar'}
                  onChange={() => setCountMode('calendar')}
                />
                <span>Calendar days</span>
              </label>
            </fieldset>

            {countMode === 'business' ? (
              <div className="shipping-editorial-calendar">
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
            ) : null}

            <div className="shipping-editorial-quick-picks" aria-label="Common shipping windows">
              {[
                ['3–5', '3', '5'],
                ['5–7', '5', '7'],
                ['7–10', '7', '10'],
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
                    {label} days
                  </button>
                )
              })}
            </div>
          </form>

          <section className="shipping-editorial-result" aria-live="polite">
            <p className="shipping-result-kicker">Estimated delivery</p>

            {earliest && latest ? (
              <>
                <div className="shipping-result-window">
                  <div>
                    <span>Earliest</span>
                    <strong>{formatPlainDate(earliest)}</strong>
                    <small>{formatWeekday(earliest)}</small>
                  </div>
                  <i aria-hidden="true">→</i>
                  <div>
                    <span>Latest</span>
                    <strong>{formatPlainDate(latest)}</strong>
                    <small>{formatWeekday(latest)}</small>
                  </div>
                </div>

                <div className="shipping-result-summary">
                  <span>{rangeSummary}</span>
                  <small>
                    after {formatPlainDate(parsedStart!)}
                  </small>
                </div>

                <p className="shipping-result-note">
                  {countMode === 'business'
                    ? holidayCalendar === 'none'
                      ? 'Weekends skipped. Public holidays still count as weekdays.'
                      : `Weekends and ${
                          getHolidayCalendarOption(holidayCalendar).shortLabel
                        } holidays skipped.`
                    : 'Calendar days counted, including weekends.'}
                </p>

                <CalculationReceipt
                  analyticsContext="shipping_delivery_range"
                  rows={[
                    {
                      label: 'Order / ship date',
                      value: `${formatWeekday(parsedStart!)}, ${formatPlainDate(
                        parsedStart!,
                      )}`,
                    },
                    {
                      label: 'Delivery estimate',
                      value: rangeSummary,
                    },
                    {
                      label: 'Counting method',
                      value:
                        countMode === 'business'
                          ? 'Business days'
                          : 'Calendar days',
                    },
                    ...(countMode === 'business'
                      ? [
                          {
                            label: 'Holiday calendar',
                            value:
                              getHolidayCalendarOption(holidayCalendar).label,
                          },
                        ]
                      : []),
                    {
                      label: 'Earliest date',
                      value: `${formatWeekday(earliest)}, ${formatPlainDate(
                        earliest,
                      )}`,
                    },
                    {
                      label: 'Latest date',
                      value: `${formatWeekday(latest)}, ${formatPlainDate(
                        latest,
                      )}`,
                    },
                  ]}
                />

                <div className="shipping-range-actions shipping-editorial-actions">
                  <ResultActions
                    title="Estimated delivery window"
                    date={latest}
                    details={`${formatPlainDate(earliest)} to ${formatPlainDate(
                      latest,
                    )}`}
                  />
                </div>
              </>
            ) : (
              <p className="shipping-range-error" role="status">
                {validationMessage}
              </p>
            )}
          </section>
        </div>
      </section>

      <section className="shipping-editorial-content" aria-label="Shipping delivery range help">
        <div className="shipping-content-heading">
          <p className="shipping-section-eyebrow">Delivery-window rules</p>
          <h2>What 3–5 business days actually means</h2>
        </div>

        <article>
          <h2>What does 3–5 business days mean?</h2>
          <p>
            It means the delivery estimate is a range, not one exact date.
            The earliest date is three qualifying business days after the
            order or ship date, and the latest date is five qualifying
            business days after it.
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
            No. This calculator only translates a stated delivery window
            such as “3–5 business days” into actual dates. Carrier delays,
            cut-off times, weather, handling time, and local delivery rules
            can change the real arrival date.
          </p>
        </article>
      </section>

      <section className="shipping-editorial-related" aria-label="Related date tools">
        <div>
          <p className="shipping-section-eyebrow">Related answers</p>
          <h2>Need a different kind of date?</h2>
        </div>

        <nav>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/do-weekends-count-as-business-days"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/do-weekends-count-as-business-days')
            }}
          >
            Do weekends count? <span aria-hidden="true">→</span>
          </a>
          <a
            href="/do-public-holidays-count-as-business-days"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/do-public-holidays-count-as-business-days')
            }}
          >
            Do public holidays count? <span aria-hidden="true">→</span>
          </a>
        </nav>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Shipping promises, cut-off times, handling time, carrier delays, and local delivery rules can change the actual arrival date."
      />

      <style>{`
        .shipping-editorial-page {
          --shipping-navy: #17385f;
          --shipping-deep: #112f53;
          --shipping-green: #2d7c67;
          --shipping-blue: #eef5f8;
        }

        .shipping-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .shipping-editorial-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .shipping-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .shipping-editorial-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .shipping-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .shipping-editorial-hero,
        .shipping-editorial-workspace,
        .shipping-editorial-content,
        .shipping-editorial-related {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .shipping-editorial-image-wrap {
          position: relative;
          min-height: 470px;
          overflow: hidden;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 28px;
          background: #d2c3aa;
        }

        .shipping-editorial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .shipping-editorial-answer {
          position: relative;
          z-index: 1;
          width: min(510px, calc(100% - 64px));
          margin: 32px;
          padding: 30px 32px 28px;
          border-radius: 24px;
          background: rgba(250, 247, 239, 0.94);
          box-shadow: 0 18px 54px rgba(10, 26, 44, 0.15);
          backdrop-filter: blur(10px);
        }

        .shipping-editorial-eyebrow,
        .shipping-section-eyebrow {
          margin: 0;
          color: var(--shipping-green);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .shipping-editorial-answer h1 {
          margin: 10px 0 0;
          color: var(--shipping-deep);
          font-size: clamp(2.45rem, 4.6vw, 4.2rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
          text-wrap: balance;
        }

        .shipping-editorial-range {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(17, 47, 83, 0.12);
        }

        .shipping-editorial-range > div,
        .shipping-result-window > div {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .shipping-editorial-range span,
        .shipping-result-window span {
          color: #688095;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .shipping-editorial-range strong {
          color: var(--shipping-deep);
          font-size: clamp(1.65rem, 3vw, 2.5rem);
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .shipping-editorial-range small,
        .shipping-result-window small {
          color: #62768b;
          font-size: 0.9rem;
          font-weight: 750;
        }

        .shipping-editorial-range i,
        .shipping-result-window i {
          color: #7890a4;
          font-style: normal;
          font-size: 1.2rem;
        }

        .shipping-editorial-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .shipping-editorial-heading h2,
        .shipping-content-heading h2,
        .shipping-editorial-related h2 {
          margin: 6px 0 0;
          color: var(--shipping-deep);
          font-size: clamp(2rem, 3.7vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .shipping-editorial-heading > p:last-child {
          margin: 8px 0 0;
          color: #6b7f92;
        }

        .shipping-editorial-calculation-grid {
          display: grid;
          grid-template-columns: minmax(290px, 0.78fr) minmax(0, 1.22fr);
          gap: 16px;
          margin-top: 22px;
        }

        .shipping-editorial-form {
          display: grid;
          gap: 15px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 18px;
          background: #f2efe8;
        }

        .shipping-editorial-form .field {
          display: grid;
          gap: 7px;
        }

        .shipping-editorial-form .field > span,
        .shipping-editorial-mode legend {
          color: #566f87;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .shipping-editorial-form input[type='date'],
        .shipping-editorial-form input[type='number'] {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17, 47, 83, 0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .shipping-editorial-days-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .shipping-editorial-mode {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
          padding: 0;
          border: 0;
        }

        .shipping-editorial-mode legend {
          grid-column: 1 / -1;
          margin-bottom: 0;
        }

        .shipping-editorial-mode label {
          position: relative;
        }

        .shipping-editorial-mode input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .shipping-editorial-mode span {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 8px;
          border: 1px solid rgba(17, 47, 83, 0.13);
          border-radius: 10px;
          background: rgba(255,255,255,0.78);
          color: #4e6680;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .shipping-editorial-mode input:checked + span {
          border-color: rgba(45,124,103,0.6);
          background: #e8f4ef;
          color: #1f6656;
          box-shadow: inset 0 0 0 1px rgba(45,124,103,0.2);
        }

        .shipping-editorial-quick-picks {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .shipping-editorial-quick-picks button {
          min-height: 42px;
          border: 1px solid rgba(17,47,83,0.13);
          border-radius: 10px;
          background: rgba(255,255,255,0.78);
          color: #4e6680;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .shipping-editorial-quick-picks button.is-active {
          border-color: rgba(45,124,103,0.6);
          background: #e8f4ef;
          color: #1f6656;
        }

        .shipping-editorial-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--shipping-deep);
          color: #f8f1e6;
        }

        .shipping-result-kicker {
          margin: 0;
          color: #9fc6b4;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .shipping-result-window {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }

        .shipping-result-window strong {
          color: #fff8ec;
          font-size: clamp(2.4rem, 5.2vw, 4.7rem);
          line-height: 0.94;
          letter-spacing: -0.05em;
        }

        .shipping-result-window span,
        .shipping-result-window small,
        .shipping-result-window i {
          color: #c8d7e3;
        }

        .shipping-result-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 20px;
        }

        .shipping-result-summary span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223,189,122,0.55);
          border-radius: 999px;
          background: #fff7e8;
          color: #7b4f26;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .shipping-result-summary small {
          color: #c8d4df;
          font-size: 0.88rem;
        }

        .shipping-result-note {
          margin: 18px 0 0;
          color: #ced8e2;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .shipping-editorial-result .calculation-receipt {
          margin-top: 18px;
        }

        .shipping-editorial-actions {
          margin-top: 14px;
        }

        .shipping-editorial-content {
          margin-top: 38px;
        }

        .shipping-content-heading {
          margin-bottom: 16px;
        }

        .shipping-editorial-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .shipping-content-heading {
          grid-column: 1 / -1;
        }

        .shipping-editorial-content article {
          padding: 22px;
          border: 1px solid rgba(17,47,83,0.09);
          border-radius: 18px;
          background: rgba(255,255,255,0.72);
        }

        .shipping-editorial-content article h2 {
          margin: 0;
          color: var(--shipping-deep);
          font-size: 1.08rem;
        }

        .shipping-editorial-content article p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        .shipping-editorial-related {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17,47,83,0.1);
          border-radius: 24px;
          background: var(--shipping-blue);
        }

        .shipping-editorial-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .shipping-editorial-related a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid rgba(17,47,83,0.12);
          border-radius: 12px;
          background: rgba(255,255,255,0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .shipping-editorial-related a span {
          color: var(--shipping-green);
          font-size: 1.05rem;
        }

        @media (max-width: 760px) {
          .shipping-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .shipping-editorial-brand img {
            width: 154px;
          }

          .shipping-editorial-nav {
            gap: 12px;
          }

          .shipping-editorial-nav a {
            font-size: 0.8rem;
          }

          .shipping-editorial-home-link {
            display: none;
          }

          .shipping-editorial-hero,
          .shipping-editorial-workspace,
          .shipping-editorial-content,
          .shipping-editorial-related {
            width: min(100% - 24px, 680px);
          }

          .shipping-editorial-image-wrap {
            min-height: 470px;
            border-radius: 24px;
          }

          .shipping-editorial-image {
            object-position: center;
          }

          .shipping-editorial-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
            margin: 0;
            padding: 18px;
            border-radius: 18px;
          }

          .shipping-editorial-answer h1 {
            font-size: clamp(2rem, 9vw, 2.75rem);
          }

          .shipping-editorial-range {
            gap: 8px;
            margin-top: 15px;
            padding-top: 13px;
          }

          .shipping-editorial-range strong {
            font-size: clamp(1.55rem, 7vw, 2.2rem);
          }

          .shipping-editorial-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .shipping-editorial-heading h2,
          .shipping-content-heading h2,
          .shipping-editorial-related h2 {
            font-size: clamp(1.9rem, 8.6vw, 2.6rem);
          }

          .shipping-editorial-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .shipping-editorial-form {
            padding: 18px;
          }

          .shipping-editorial-result {
            padding: 22px 18px 18px;
          }

          .shipping-result-window {
            gap: 8px;
            margin-top: 15px;
          }

          .shipping-result-window strong {
            font-size: clamp(2rem, 9.5vw, 3.25rem);
          }

          .shipping-editorial-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .shipping-editorial-result .result-actions button,
          .shipping-editorial-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .shipping-editorial-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .shipping-editorial-content {
            display: block;
            margin-top: 28px;
          }

          .shipping-content-heading {
            margin-bottom: 8px;
          }

          .shipping-editorial-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17,47,83,0.1);
            border-radius: 0;
            background: transparent;
          }

          .shipping-editorial-content article h2 {
            font-size: 1.08rem;
            line-height: 1.3;
          }

          .shipping-editorial-content article p {
            font-size: 0.94rem;
            line-height: 1.52;
          }

          .shipping-editorial-related {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .shipping-editorial-related nav {
            grid-template-columns: 1fr;
            gap: 7px;
          }
        }

        @media (max-width: 430px) {
          .shipping-editorial-brand img {
            width: 142px;
          }

          .shipping-editorial-nav {
            gap: 10px;
          }

          .shipping-editorial-nav a {
            font-size: 0.76rem;
          }

          .shipping-editorial-image-wrap {
            min-height: 440px;
          }

          .shipping-editorial-answer {
            left: 14px;
            right: 14px;
            bottom: 14px;
            padding: 16px;
          }

          .shipping-editorial-eyebrow {
            font-size: 0.7rem;
          }

          .shipping-editorial-range small {
            font-size: 0.76rem;
          }

          .shipping-editorial-days-grid {
            gap: 8px;
          }

          .shipping-editorial-mode span,
          .shipping-editorial-quick-picks button {
            font-size: 0.76rem;
          }
        }
      `}</style>
    </main>
  )
}


type NoticePeriodUnit =
  | 'calendar-days'
  | 'business-days'
  | 'weeks'
  | 'months'

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
    parsedAmount !== null ? `${parsedAmount} ${unitLabel}` : `${noticeAmount} ${unitLabel}`

  return (
    <main className="page-shell notice-editorial-page">
      <header className="notice-editorial-header" aria-label="WhenIsDue navigation">
        <a
          className="notice-editorial-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="notice-editorial-nav" aria-label="Main navigation">
          <a
            className="notice-editorial-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section
        className="notice-editorial-hero"
        aria-labelledby="notice-period-title"
      >
        <div className="notice-editorial-image-wrap">
          <img
            className="notice-editorial-image"
            src="/notice-period-background.webp"
            alt=""
          />

          <div className="notice-editorial-answer">
            <p className="notice-editorial-eyebrow">Notice period calculator</p>
            <h1 id="notice-period-title">When should I give notice?</h1>

            {noticeDeadline && parsedEventDate && parsedAmount !== null ? (
              <>
                <div className="notice-editorial-primary-answer">
                  <span>{noticeRuleLabel} before</span>
                  <strong>{formatPlainDate(noticeDeadline)}</strong>
                  <small>{formatWeekday(noticeDeadline)}</small>
                </div>

                <div className="notice-editorial-event-row">
                  <span>Event date</span>
                  <b>{formatPlainDate(parsedEventDate)}</b>
                </div>
              </>
            ) : (
              <p className="notice-editorial-error">
                Enter a valid event date and notice period.
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className="notice-editorial-workspace"
        aria-label="Notice period calculator"
      >
        <div className="notice-editorial-heading">
          <p className="notice-section-eyebrow">Your calculation</p>
          <h2>Set the event date and notice period</h2>
          <p>The latest notice date updates immediately.</p>
        </div>

        <div className="notice-editorial-calculation-grid">
          <form
            className="notice-editorial-form"
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

            <div className="notice-editorial-input-grid">
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
            </div>

            {noticeUnit === 'business-days' ? (
              <div className="notice-editorial-calendar">
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

            <div
              className="notice-editorial-quick-picks"
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
          </form>

          <section className="notice-editorial-result" aria-live="polite">
            {noticeDeadline && parsedEventDate && parsedAmount !== null ? (
              <>
                <p className="notice-result-kicker">Give notice by</p>
                <p className="notice-result-date">
                  {formatPlainDate(noticeDeadline)}
                </p>
                <p className="notice-result-weekday">
                  {formatWeekday(noticeDeadline)}
                </p>

                <div className="notice-result-summary">
                  <span>{noticeRuleLabel}</span>
                  <small>before {formatPlainDate(parsedEventDate)}</small>
                </div>

                <p className="notice-result-note">
                  {noticeUnit === 'business-days'
                    ? holidayCalendar === 'none'
                      ? 'Weekends are skipped. Public holidays still count as weekdays.'
                      : `Weekends and ${
                          getHolidayCalendarOption(holidayCalendar).shortLabel
                        } holidays are skipped.`
                    : noticeUnit === 'months'
                      ? 'Month-based notice moves back by whole calendar months, clamping to the last day when needed.'
                      : 'The calculation counts backward from the event date using the unit selected above.'}
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

                <ResultActions
                  title="Notice deadline"
                  date={noticeDeadline}
                  details={`${noticeRuleLabel} before ${formatPlainDate(
                    parsedEventDate,
                  )}`}
                />
              </>
            ) : (
              <p className="notice-editorial-error">
                Enter a valid event date and notice period.
              </p>
            )}
          </section>
        </div>
      </section>

      <section
        className="notice-editorial-related"
        aria-label="Related deadline tools"
      >
        <div>
          <p className="notice-section-eyebrow">Related deadline tools</p>
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
            Deadline calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            Business days calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/does-the-start-date-count"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/does-the-start-date-count')
            }}
          >
            Does the start date count? <span aria-hidden="true">→</span>
          </a>
        </nav>
      </section>

      <section
        className="notice-editorial-content"
        aria-label="Notice period help"
      >
        <div className="notice-content-heading">
          <p className="notice-section-eyebrow">Notice-period rules</p>
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
        .notice-editorial-page {
          --notice-navy: #112f53;
          --notice-green: #2d7c67;
          --notice-blue: #eef5f8;
          --notice-warm: #f2ede4;
        }

        .notice-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .notice-editorial-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .notice-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .notice-editorial-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .notice-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .notice-editorial-hero,
        .notice-editorial-workspace,
        .notice-editorial-related,
        .notice-editorial-content {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .notice-editorial-image-wrap {
          position: relative;
          min-height: 470px;
          overflow: hidden;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 28px;
          background: #d8c7ad;
        }

        .notice-editorial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .notice-editorial-answer {
          position: relative;
          z-index: 1;
          width: min(500px, calc(100% - 64px));
          margin: 32px;
          padding: 32px 34px 28px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 24px;
          background: rgba(250, 247, 239, 0.94);
          box-shadow: 0 18px 52px rgba(11, 24, 39, 0.15);
          backdrop-filter: blur(10px);
        }

        .notice-editorial-eyebrow,
        .notice-section-eyebrow {
          margin: 0;
          color: var(--notice-green);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .notice-editorial-answer h1 {
          margin: 10px 0 0;
          color: var(--notice-navy);
          font-size: clamp(2.65rem, 5vw, 4.5rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .notice-editorial-primary-answer {
          display: grid;
          gap: 4px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(17, 47, 83, 0.11);
        }

        .notice-editorial-primary-answer span {
          color: #687e91;
          font-size: 0.95rem;
          font-weight: 850;
        }

        .notice-editorial-primary-answer strong {
          color: var(--notice-navy);
          font-size: clamp(2.15rem, 4vw, 3.4rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .notice-editorial-primary-answer small {
          color: #5e7489;
          font-size: 1rem;
          font-weight: 800;
        }

        .notice-editorial-event-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 14px;
          background: rgba(238, 245, 248, 0.92);
        }

        .notice-editorial-event-row span {
          color: #667e91;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .notice-editorial-event-row b {
          color: #24435f;
          font-size: 0.95rem;
        }

        .notice-editorial-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .notice-editorial-heading h2,
        .notice-editorial-related h2,
        .notice-content-heading h2 {
          margin: 6px 0 0;
          color: var(--notice-navy);
          font-size: clamp(2rem, 3.7vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .notice-editorial-heading > p:last-child {
          margin: 8px 0 0;
          color: #6b7f92;
        }

        .notice-editorial-calculation-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.72fr) minmax(0, 1.28fr);
          gap: 16px;
          margin-top: 22px;
        }

        .notice-editorial-form {
          display: grid;
          gap: 15px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 18px;
          background: var(--notice-warm);
        }

        .notice-editorial-form label {
          display: grid;
          gap: 7px;
        }

        .notice-editorial-form label > span {
          color: #566f87;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .notice-editorial-form input,
        .notice-editorial-form select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17, 47, 83, 0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .notice-editorial-input-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .notice-editorial-quick-picks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .notice-editorial-quick-picks button {
          min-height: 44px;
          border: 1px solid rgba(17, 47, 83, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.78);
          color: #4f6780;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .notice-editorial-quick-picks button.is-active {
          border-color: rgba(45, 124, 103, 0.6);
          background: #e8f4ef;
          color: #1f6656;
          box-shadow: inset 0 0 0 1px rgba(45, 124, 103, 0.18);
        }

        .notice-editorial-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--notice-navy);
          color: #f8f1e6;
        }

        .notice-result-kicker {
          margin: 0;
          color: #9fc6b4;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .notice-result-date {
          margin: 10px 0 0;
          color: #fff8ec;
          font-size: clamp(3.5rem, 7vw, 6.2rem);
          font-weight: 850;
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .notice-result-weekday {
          margin: 10px 0 0;
          color: #d5dfea;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .notice-result-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 16px;
        }

        .notice-result-summary span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223, 189, 122, 0.55);
          border-radius: 999px;
          background: #fff7e8;
          color: #7b4f26;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .notice-result-summary small,
        .notice-result-note {
          color: #c8d4df;
        }

        .notice-result-note {
          max-width: 720px;
          margin: 18px 0 0;
          font-size: 0.95rem;
          line-height: 1.52;
        }

        .notice-editorial-result .calculation-receipt {
          margin-top: 18px;
        }

        .notice-editorial-result .result-actions {
          margin-top: 14px;
        }

        .notice-editorial-related {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 24px;
          background: var(--notice-blue);
        }

        .notice-editorial-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .notice-editorial-related a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .notice-editorial-related a span {
          color: var(--notice-green);
          font-size: 1.05rem;
        }

        .notice-editorial-content {
          margin-top: 38px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .notice-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }

        .notice-editorial-content article {
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.09);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .notice-editorial-content article:last-child {
          grid-column: 1 / -1;
        }

        .notice-editorial-content article h2 {
          margin: 0;
          color: var(--notice-navy);
          font-size: 1.08rem;
        }

        .notice-editorial-content article p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        .notice-editorial-error {
          color: #65798d;
        }

        @media (max-width: 760px) {
          .notice-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .notice-editorial-brand img {
            width: 154px;
          }

          .notice-editorial-nav {
            gap: 12px;
          }

          .notice-editorial-nav a {
            font-size: 0.8rem;
          }

          .notice-editorial-home-link {
            display: none;
          }

          .notice-editorial-hero,
          .notice-editorial-workspace,
          .notice-editorial-related,
          .notice-editorial-content {
            width: min(100% - 24px, 680px);
          }

          .notice-editorial-image-wrap {
            min-height: 465px;
            border-radius: 24px;
          }

          .notice-editorial-image {
            object-position: 56% center;
          }

          .notice-editorial-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
            margin: 0;
            padding: 18px;
            border-radius: 18px;
          }

          .notice-editorial-answer h1 {
            font-size: clamp(2.05rem, 9.3vw, 2.85rem);
          }

          .notice-editorial-primary-answer {
            margin-top: 14px;
            padding-top: 12px;
          }

          .notice-editorial-primary-answer strong {
            font-size: clamp(1.95rem, 8.8vw, 2.6rem);
          }

          .notice-editorial-event-row {
            margin-top: 13px;
            padding: 11px 12px;
          }

          .notice-editorial-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .notice-editorial-heading h2,
          .notice-editorial-related h2,
          .notice-content-heading h2 {
            font-size: clamp(1.9rem, 8.5vw, 2.55rem);
          }

          .notice-editorial-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .notice-editorial-form {
            padding: 18px;
          }

          .notice-editorial-result {
            padding: 22px 18px 18px;
          }

          .notice-result-date {
            font-size: clamp(2.9rem, 11.5vw, 4.2rem);
          }

          .notice-result-note {
            font-size: 0.92rem;
            line-height: 1.48;
          }

          .notice-editorial-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .notice-editorial-result .result-actions button,
          .notice-editorial-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .notice-editorial-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .notice-editorial-related {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .notice-editorial-related nav {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .notice-editorial-content {
            display: block;
            margin-top: 28px;
          }

          .notice-content-heading {
            margin-bottom: 8px;
          }

          .notice-editorial-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17, 47, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .notice-editorial-content article h2 {
            font-size: 1.08rem;
            line-height: 1.3;
          }

          .notice-editorial-content article p {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }

        @media (max-width: 430px) {
          .notice-editorial-brand img {
            width: 142px;
          }

          .notice-editorial-nav {
            gap: 10px;
          }

          .notice-editorial-nav a {
            font-size: 0.76rem;
          }

          .notice-editorial-image-wrap {
            min-height: 440px;
          }

          .notice-editorial-answer {
            left: 14px;
            right: 14px;
            bottom: 14px;
            padding: 16px;
          }

          .notice-editorial-eyebrow {
            font-size: 0.7rem;
          }

          .notice-editorial-event-row span {
            font-size: 0.68rem;
          }

          .notice-editorial-event-row b {
            font-size: 0.84rem;
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

  return (
    <main className="page-shell subscription-lifecycle-page">
      <header
        className="subscription-lifecycle-header"
        aria-label="WhenIsDue navigation"
      >
        <a
          className="subscription-lifecycle-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="subscription-lifecycle-nav" aria-label="Main navigation">
          <a
            className="subscription-lifecycle-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section
        className="subscription-lifecycle-hero"
        aria-labelledby="subscription-renewal-title"
      >
        <div className="subscription-lifecycle-image-wrap">
          <img
            className="subscription-lifecycle-image"
            src="/homepage-editorial.webp"
            alt=""
          />

          <div className="subscription-lifecycle-answer">
            <p className="subscription-lifecycle-eyebrow">
              Subscription renewal calculator
            </p>
            <h1 id="subscription-renewal-title">
              When does my subscription renew?
            </h1>

            {nextRenewal && parsedStart && parsedIntervalAmount !== null ? (
              <>
                <div className="subscription-lifecycle-primary-answer">
                  <span>{subscriptionIntervalLabel}</span>
                  <strong>{formatPlainDate(nextRenewal)}</strong>
                  <small>{formatWeekday(nextRenewal)}</small>
                </div>

                <div className="subscription-lifecycle-reminder">
                  <span>
                    {cancellationDeadline
                      ? 'Last day to cancel'
                      : 'Advance notice'}
                  </span>
                  <b>
                    {cancellationDeadline
                      ? formatPlainDate(cancellationDeadline)
                      : 'Not applied'}
                  </b>
                </div>
              </>
            ) : (
              <p className="subscription-lifecycle-error">
                Enter a valid date and renewal interval.
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className="subscription-lifecycle-workspace"
        aria-label="Subscription renewal calculator"
      >
        <div className="subscription-lifecycle-heading">
          <p className="subscription-section-eyebrow">Your calculation</p>
          <h2>Set the renewal schedule</h2>
          <p>The next renewal and cancellation date update immediately.</p>
        </div>

        <div className="subscription-lifecycle-calculation-grid">
          <form
            className="subscription-lifecycle-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              <span>Start or last renewal date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <div className="subscription-lifecycle-interval-grid">
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
            </div>

            <div
              className="subscription-lifecycle-quick-picks"
              aria-label="Common renewal intervals"
            >
              {[
                ['Monthly', '1', 'months'],
                ['Quarterly', '3', 'months'],
                ['6 months', '6', 'months'],
                ['Yearly', '1', 'years'],
              ].map(([label, amount, unit]) => {
                const isActive =
                  intervalAmount === amount && intervalUnit === unit
                return (
                  <button
                    className={isActive ? 'is-active' : ''}
                    type="button"
                    aria-pressed={isActive}
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

            <label>
              <span>Cancel this many days before renewal</span>
              <input
                type="number"
                min="0"
                max="365"
                step="1"
                inputMode="numeric"
                value={noticeDays}
                onChange={(event) => setNoticeDays(event.target.value)}
              />
              <small>Use 0 if the plan has no advance-notice rule.</small>
            </label>
          </form>

          <section className="subscription-lifecycle-result" aria-live="polite">
            {nextRenewal &&
            parsedStart &&
            parsedIntervalAmount !== null &&
            parsedIntervalAmount >= 1 ? (
              <>
                <p className="subscription-result-kicker">Next renewal</p>
                <p className="subscription-result-date">
                  {formatPlainDate(nextRenewal)}
                </p>
                <p className="subscription-result-weekday">
                  {formatWeekday(nextRenewal)}
                </p>

                <div className="subscription-result-summary">
                  <span>{subscriptionIntervalLabel}</span>
                  <small>after {formatPlainDate(parsedStart)}</small>
                </div>

                {cancellationDeadline && parsedNoticeDays ? (
                  <div className="subscription-cancel-card">
                    <small>Last day to cancel</small>
                    <strong>{formatPlainDate(cancellationDeadline)}</strong>
                    <span>{formatWeekday(cancellationDeadline)}</span>
                    <p>{parsedNoticeDays} calendar days before renewal.</p>
                  </div>
                ) : (
                  <div className="subscription-cancel-card is-neutral">
                    <small>Advance cancellation notice</small>
                    <strong>Not applied</strong>
                    <p>
                      Enter a notice period above if your plan requires one.
                    </p>
                  </div>
                )}

                <p className="subscription-result-note">
                  This projects the next billing date from the date and interval
                  you enter. Provider time zones, billing cut-off times,
                  trial-conversion rules, and grace periods can change the
                  actual charge or cancellation deadline.
                </p>

                <CalculationReceipt
                  analyticsContext="subscription_renewal"
                  rows={[
                    {
                      label: 'Start / last renewal date',
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
                    ...(cancellationDeadline && parsedNoticeDays
                      ? [
                          {
                            label: 'Advance notice',
                            value: `${parsedNoticeDays} calendar days`,
                          },
                          {
                            label: 'Last day to cancel',
                            value: `${formatWeekday(cancellationDeadline)}, ${formatPlainDate(cancellationDeadline)}`,
                          },
                        ]
                      : []),
                  ]}
                />

                <ResultActions
                  title="Subscription renewal date"
                  date={nextRenewal}
                  details={
                    cancellationDeadline
                      ? `Last day to cancel: ${formatPlainDate(cancellationDeadline)}`
                      : `${subscriptionIntervalLabel} after ${formatPlainDate(parsedStart)}`
                  }
                />
              </>
            ) : (
              <p className="subscription-lifecycle-error">
                Enter a valid date and renewal interval.
              </p>
            )}
          </section>
        </div>
      </section>

      <section
        className="subscription-lifecycle-related"
        aria-label="Related lifecycle tools"
      >
        <div>
          <p className="subscription-section-eyebrow">Related lifecycle tools</p>
          <h2>Before and after renewal</h2>
        </div>

        <nav>
          <a
            href="/free-trial-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/free-trial-calculator')
            }}
          >
            Free trial calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/notice-period-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/notice-period-calculator')
            }}
          >
            Notice period calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator <span aria-hidden="true">→</span>
          </a>
        </nav>
      </section>

      <section
        className="subscription-lifecycle-content"
        aria-label="Subscription renewal help"
      >
        <div className="subscription-content-heading">
          <p className="subscription-section-eyebrow">Renewal timing rules</p>
          <h2>Start, interval, renewal</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the start date or most recent renewal date, then choose how
            often the subscription renews. WhenIsDue projects the next renewal
            date from that schedule.
          </p>
        </article>

        <article>
          <h2>How monthly renewals are handled</h2>
          <p>
            Monthly and yearly intervals try to keep the same day number. If
            the target month does not contain that day, the calculator uses the
            last day of that month.
          </p>
        </article>

        <article>
          <h2>How the cancellation deadline is calculated</h2>
          <p>
            If the subscription requires advance notice, enter the number of
            calendar days required before renewal. WhenIsDue counts backward
            from the projected renewal date.
          </p>
        </article>

        <article>
          <h2>What to confirm with the provider</h2>
          <ul>
            <li>The exact renewal date shown in your account</li>
            <li>The billing time and time zone</li>
            <li>Any required cancellation-notice period</li>
            <li>Trial-conversion, grace-period, or refund rules</li>
          </ul>
        </article>

        <article>
          <h2>Subscription renewal FAQ</h2>
          <dl>
            <dt>Does a monthly subscription always renew on the same date?</dt>
            <dd>
              Usually it follows the same day number, but shorter months and
              provider rules can move the billing date.
            </dd>
            <dt>What if my plan says cancel 7 days before renewal?</dt>
            <dd>
              Enter 7 in the notice field. The calculator will show a projected
              last day to cancel seven calendar days before the renewal date.
            </dd>
            <dt>Does this include billing time zones?</dt>
            <dd>
              No. This calculator works with calendar dates only. Use the
              provider's displayed billing time and time zone when the cutoff
              matters.
            </dd>
            <dt>Can a trial and subscription use different renewal rules?</dt>
            <dd>
              Yes. Trial conversion can follow different timing from later
              recurring billing. Check the service's actual renewal terms.
            </dd>
          </dl>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Subscription providers can use different billing dates, time zones, cut-off times, trial rules, and cancellation policies."
      />

      <style>{`
        .subscription-lifecycle-page {
          --sub-navy: #112f53;
          --sub-green: #2d7c67;
          --sub-blue: #eef5f8;
          --sub-warm: #f2ede4;
        }

        .subscription-lifecycle-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .subscription-lifecycle-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .subscription-lifecycle-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .subscription-lifecycle-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .subscription-lifecycle-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .subscription-lifecycle-hero,
        .subscription-lifecycle-workspace,
        .subscription-lifecycle-related,
        .subscription-lifecycle-content {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .subscription-lifecycle-image-wrap {
          position: relative;
          min-height: 470px;
          overflow: hidden;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 28px;
          background: #d8c8b3;
        }

        .subscription-lifecycle-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .subscription-lifecycle-image-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(11, 24, 39, 0.12),
            rgba(11, 24, 39, 0.01) 58%,
            rgba(11, 24, 39, 0)
          );
          pointer-events: none;
        }

        .subscription-lifecycle-answer {
          position: relative;
          z-index: 1;
          width: min(500px, calc(100% - 64px));
          margin: 32px;
          padding: 32px 34px 28px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 24px;
          background: rgba(250, 247, 239, 0.94);
          box-shadow: 0 18px 52px rgba(11, 24, 39, 0.15);
          backdrop-filter: blur(10px);
        }

        .subscription-lifecycle-eyebrow,
        .subscription-section-eyebrow {
          margin: 0;
          color: var(--sub-green);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .subscription-lifecycle-answer h1 {
          margin: 10px 0 0;
          color: var(--sub-navy);
          font-size: clamp(2.65rem, 5vw, 4.5rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .subscription-lifecycle-primary-answer {
          display: grid;
          gap: 4px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(17, 47, 83, 0.11);
        }

        .subscription-lifecycle-primary-answer span {
          color: #687e91;
          font-size: 0.95rem;
          font-weight: 850;
        }

        .subscription-lifecycle-primary-answer strong {
          color: var(--sub-navy);
          font-size: clamp(2.15rem, 4vw, 3.4rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .subscription-lifecycle-primary-answer small {
          color: #5e7489;
          font-size: 1rem;
          font-weight: 800;
        }

        .subscription-lifecycle-reminder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 14px;
          background: rgba(238, 245, 248, 0.92);
        }

        .subscription-lifecycle-reminder span {
          color: #667e91;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .subscription-lifecycle-reminder b {
          color: #24435f;
          font-size: 0.95rem;
        }

        .subscription-lifecycle-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .subscription-lifecycle-heading h2,
        .subscription-lifecycle-related h2,
        .subscription-content-heading h2 {
          margin: 6px 0 0;
          color: var(--sub-navy);
          font-size: clamp(2rem, 3.7vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .subscription-lifecycle-heading > p:last-child {
          margin: 8px 0 0;
          color: #6b7f92;
        }

        .subscription-lifecycle-calculation-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.72fr) minmax(0, 1.28fr);
          gap: 16px;
          margin-top: 22px;
        }

        .subscription-lifecycle-form {
          display: grid;
          gap: 15px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 18px;
          background: var(--sub-warm);
        }

        .subscription-lifecycle-form label {
          display: grid;
          gap: 7px;
        }

        .subscription-lifecycle-form label > span {
          color: #566f87;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .subscription-lifecycle-form label > small {
          color: #6d8196;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .subscription-lifecycle-form input,
        .subscription-lifecycle-form select {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17, 47, 83, 0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .subscription-lifecycle-interval-grid,
        .subscription-lifecycle-quick-picks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .subscription-lifecycle-quick-picks button {
          min-height: 44px;
          border: 1px solid rgba(17, 47, 83, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.78);
          color: #4f6780;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .subscription-lifecycle-quick-picks button.is-active {
          border-color: rgba(45, 124, 103, 0.6);
          background: #e8f4ef;
          color: #1f6656;
          box-shadow: inset 0 0 0 1px rgba(45, 124, 103, 0.18);
        }

        .subscription-lifecycle-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--sub-navy);
          color: #f8f1e6;
        }

        .subscription-result-kicker {
          margin: 0;
          color: #9fc6b4;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .subscription-result-date {
          margin: 10px 0 0;
          color: #fff8ec;
          font-size: clamp(3.5rem, 7vw, 6.2rem);
          font-weight: 850;
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .subscription-result-weekday {
          margin: 10px 0 0;
          color: #d5dfea;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .subscription-result-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 16px;
        }

        .subscription-result-summary span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223, 189, 122, 0.55);
          border-radius: 999px;
          background: #fff7e8;
          color: #7b4f26;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .subscription-result-summary small,
        .subscription-result-note,
        .subscription-cancel-card p {
          color: #c8d4df;
        }

        .subscription-cancel-card {
          display: grid;
          gap: 3px;
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
        }

        .subscription-cancel-card small {
          color: #9fc6b4;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .subscription-cancel-card strong {
          color: #fff8ec;
          font-size: 1.15rem;
        }

        .subscription-cancel-card span {
          color: #d5dfea;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .subscription-cancel-card p {
          margin: 3px 0 0;
          font-size: 0.86rem;
        }

        .subscription-result-note {
          max-width: 720px;
          margin: 18px 0 0;
          font-size: 0.95rem;
          line-height: 1.52;
        }

        .subscription-lifecycle-result .calculation-receipt {
          margin-top: 18px;
        }

        .subscription-lifecycle-result .result-actions {
          margin-top: 14px;
        }

        .subscription-lifecycle-related {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 24px;
          background: var(--sub-blue);
        }

        .subscription-lifecycle-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .subscription-lifecycle-related a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .subscription-lifecycle-related a span {
          color: var(--sub-green);
          font-size: 1.05rem;
        }

        .subscription-lifecycle-content {
          margin-top: 38px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .subscription-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }

        .subscription-lifecycle-content article {
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.09);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .subscription-lifecycle-content article:last-child {
          grid-column: 1 / -1;
        }

        .subscription-lifecycle-content article h2 {
          margin: 0;
          color: var(--sub-navy);
          font-size: 1.08rem;
        }

        .subscription-lifecycle-content article p,
        .subscription-lifecycle-content article li,
        .subscription-lifecycle-content article dd {
          color: #65798d;
          line-height: 1.55;
        }

        .subscription-lifecycle-content article dl {
          margin: 14px 0 0;
        }

        .subscription-lifecycle-content article dt {
          margin: 16px 0 0;
          color: var(--sub-navy);
          font-weight: 850;
        }

        .subscription-lifecycle-content article dd {
          margin: 4px 0 0;
        }

        @media (max-width: 760px) {
          .subscription-lifecycle-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .subscription-lifecycle-brand img {
            width: 154px;
          }

          .subscription-lifecycle-nav {
            gap: 12px;
          }

          .subscription-lifecycle-nav a {
            font-size: 0.8rem;
          }

          .subscription-lifecycle-home-link {
            display: none;
          }

          .subscription-lifecycle-hero,
          .subscription-lifecycle-workspace,
          .subscription-lifecycle-related,
          .subscription-lifecycle-content {
            width: min(100% - 24px, 680px);
          }

          .subscription-lifecycle-image-wrap {
            min-height: 465px;
            border-radius: 24px;
          }

          .subscription-lifecycle-image {
            object-position: 58% center;
          }

          .subscription-lifecycle-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
            margin: 0;
            padding: 18px;
            border-radius: 18px;
          }

          .subscription-lifecycle-answer h1 {
            font-size: clamp(2.05rem, 9.3vw, 2.85rem);
          }

          .subscription-lifecycle-primary-answer {
            margin-top: 14px;
            padding-top: 12px;
          }

          .subscription-lifecycle-primary-answer strong {
            font-size: clamp(1.95rem, 8.8vw, 2.6rem);
          }

          .subscription-lifecycle-reminder {
            margin-top: 13px;
            padding: 11px 12px;
          }

          .subscription-lifecycle-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .subscription-lifecycle-heading h2,
          .subscription-lifecycle-related h2,
          .subscription-content-heading h2 {
            font-size: clamp(1.9rem, 8.5vw, 2.55rem);
          }

          .subscription-lifecycle-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .subscription-lifecycle-form {
            padding: 18px;
          }

          .subscription-lifecycle-result {
            padding: 22px 18px 18px;
          }

          .subscription-result-date {
            font-size: clamp(2.9rem, 11.5vw, 4.2rem);
          }

          .subscription-result-note {
            font-size: 0.92rem;
            line-height: 1.48;
          }

          .subscription-lifecycle-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .subscription-lifecycle-result .result-actions button,
          .subscription-lifecycle-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .subscription-lifecycle-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .subscription-lifecycle-related {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .subscription-lifecycle-related nav {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .subscription-lifecycle-content {
            display: block;
            margin-top: 28px;
          }

          .subscription-content-heading {
            margin-bottom: 8px;
          }

          .subscription-lifecycle-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17, 47, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .subscription-lifecycle-content article h2 {
            font-size: 1.08rem;
            line-height: 1.3;
          }

          .subscription-lifecycle-content article p,
          .subscription-lifecycle-content article li,
          .subscription-lifecycle-content article dd {
            font-size: 0.94rem;
            line-height: 1.52;
          }

          .subscription-lifecycle-content article dt {
            margin-top: 18px;
          }
        }

        @media (max-width: 430px) {
          .subscription-lifecycle-brand img {
            width: 142px;
          }

          .subscription-lifecycle-nav {
            gap: 10px;
          }

          .subscription-lifecycle-nav a {
            font-size: 0.76rem;
          }

          .subscription-lifecycle-image-wrap {
            min-height: 440px;
          }

          .subscription-lifecycle-answer {
            left: 14px;
            right: 14px;
            bottom: 14px;
            padding: 16px;
          }

          .subscription-lifecycle-eyebrow {
            font-size: 0.7rem;
          }

          .subscription-lifecycle-reminder span {
            font-size: 0.68rem;
          }

          .subscription-lifecycle-reminder b {
            font-size: 0.84rem;
          }
        }
      `}</style>
    </main>
  )
}

function WithinDaysGuidePage({ onNavigate }: NavigationProps) {
  const [amount, setAmount] = useState(() =>
    getInitialPositiveIntegerQueryParam('amount', '5', 365),
  )
  const [referenceDate, setReferenceDate] = useState(() =>
    getInitialDateQueryParam(
      'date',
      toDateKey(addCalendarDays(getTodayPlainDate(new Date()), 10)),
    ),
  )
  const [countMode, setCountMode] = useState<'calendar' | 'business'>(() =>
    new URLSearchParams(window.location.search).get('unit') === 'business'
      ? 'business'
      : 'calendar',
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

  const parsedAmount = parseInteger(amount)
  const parsedDate = parsePlainDate(referenceDate)

  const beforeDate =
    parsedAmount !== null && parsedDate
      ? countMode === 'business'
        ? calculateBusinessDaysWithCalendar(
            parsedDate,
            -parsedAmount,
            holidayCalendar,
          ).date
        : addCalendarDays(parsedDate, -parsedAmount)
      : null

  const afterDate =
    parsedAmount !== null && parsedDate
      ? countMode === 'business'
        ? calculateBusinessDaysWithCalendar(
            parsedDate,
            parsedAmount,
            holidayCalendar,
          ).date
        : addCalendarDays(parsedDate, parsedAmount)
      : null

  useEffect(() => {
    saveHolidayCalendar(holidayCalendar)
  }, [holidayCalendar])

  useEffect(() => {
    syncShareableQueryParams({
      amount,
      date: referenceDate,
      unit: countMode,
      calendar:
        countMode === 'business'
          ? holidayCalendarQueryValue(holidayCalendar)
          : null,
    })
  }, [amount, referenceDate, countMode, holidayCalendar])

  return (
    <main className="page-shell within-guide">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="within-guide-shell">
        <header>
          <p className="friendly-eyebrow">Deadline wording</p>
          <h1>What does “within X days” mean?</h1>
          <p>
            “Within” can be ambiguous by itself. The surrounding wording must
            tell you whether to count before, after, or inside a stated window.
          </p>
        </header>

        <section className="within-guide-bam">
          <strong>Do not assume a direction from the word “within” alone.</strong>
          <span>
            “Within 5 days after receipt” counts forward. “5 days before
            renewal” counts backward. “Within 5 days of July 1” may need
            clarification.
          </span>
        </section>

        <section className="within-guide-tool">
          <form onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Number of days</span>
              <input
                type="number"
                min="0"
                max="365"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              <span>Reference date</span>
              <input
                type="date"
                value={referenceDate}
                onChange={(event) => setReferenceDate(event.target.value)}
              />
            </label>
            <label>
              <span>Count as</span>
              <select
                value={countMode}
                onChange={(event) =>
                  setCountMode(event.target.value as 'calendar' | 'business')
                }
              >
                <option value="calendar">Calendar days</option>
                <option value="business">Business days</option>
              </select>
            </label>

            {countMode === 'business' ? (
              <HolidayCalendarSelect
                value={holidayCalendar}
                onChange={setHolidayCalendar}
                compact
              />
            ) : null}
          </form>

          <div className="within-guide-results" aria-live="polite">
            {beforeDate && afterDate && parsedDate && parsedAmount !== null ? (
              <>
                <article>
                  <small>If it means before</small>
                  <strong>{formatPlainDate(beforeDate)}</strong>
                  <b>{formatWeekday(beforeDate)}</b>
                </article>
                <article>
                  <small>If it means after</small>
                  <strong>{formatPlainDate(afterDate)}</strong>
                  <b>{formatWeekday(afterDate)}</b>
                </article>
              </>
            ) : (
              <p>Enter a valid date and number of days.</p>
            )}
          </div>
        </section>

        <section className="within-guide-copy">
          <article>
            <h2>Does the starting day count?</h2>
            <p>
              That is a separate question. Some rules use day zero; others
              include the triggering day. “Within” alone does not answer it.
            </p>
          </article>
          <article>
            <h2>Do weekends and holidays count?</h2>
            <p>
              Calendar days count them. Business or working days use the
              applicable workweek and holiday rules.
            </p>
          </article>
          <article>
            <h2>When should you check the source?</h2>
            <p>
              Always when the wording comes from a contract, policy, law,
              court rule, regulated notice, or another source that defines its
              own counting method.
            </p>
          </article>
        </section>

        <nav className="within-guide-related">
          <a href="/deadline-calculator" onClick={(e) => { e.preventDefault(); onNavigate('/deadline-calculator') }}>Deadline calculator</a>
          <a href="/does-the-start-date-count" onClick={(e) => { e.preventDefault(); onNavigate('/does-the-start-date-count') }}>Does the start date count?</a>
          <a href="/do-weekends-count-as-business-days" onClick={(e) => { e.preventDefault(); onNavigate('/do-weekends-count-as-business-days') }}>Do weekends count?</a>
        </nav>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The governing wording controls direction, start-day counting, weekends, holidays, service, receipt, and final-day rules."
      />

      <style>{`
        .within-guide { min-height:100vh; background:#fffaf2; }
        .within-guide-shell { width:min(100% - 32px,980px); margin:0 auto; padding:34px 0 64px; }
        .within-guide-shell > header { text-align:center; }
        .within-guide-shell h1 { margin:6px 0 0; color:#152d48; font-size:clamp(2.35rem,6vw,4.4rem); line-height:1; letter-spacing:-.04em; }
        .within-guide-shell > header > p:last-child { max-width:700px; margin:12px auto 0; color:#61788f; line-height:1.55; }
        .within-guide-bam { max-width:760px; margin:22px auto 0; padding:18px; border:1px solid rgba(62,126,82,.14); border-radius:14px; background:#f7fcf7; text-align:center; }
        .within-guide-bam strong,.within-guide-bam span { display:block; }
        .within-guide-bam strong { color:#214b38; font-size:1.1rem; }
        .within-guide-bam span { margin-top:8px; color:#567162; line-height:1.55; }
        .within-guide-tool { display:grid; grid-template-columns:.85fr 1.15fr; gap:14px; margin-top:18px; }
        .within-guide-tool form,.within-guide-results { padding:20px; border:1px solid rgba(19,38,70,.09); border-radius:18px; background:#fff; }
        .within-guide-tool form { display:grid; gap:12px; align-content:start; }
        .within-guide-tool label { display:grid; gap:6px; color:#526a82; font-size:.9rem; font-weight:850; }
        .within-guide-tool input,.within-guide-tool select { min-height:48px; width:100%; padding:9px 11px; border:1px solid rgba(19,38,70,.14); border-radius:10px; background:#fff; color:#17304d; font:inherit; }
        .within-guide-results { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .within-guide-results article { display:flex; flex-direction:column; justify-content:center; padding:16px; border:1px solid rgba(19,38,70,.09); border-radius:13px; background:#fffdf9; text-align:center; }
        .within-guide-results small { color:#72869a; font-size:.78rem; font-weight:900; text-transform:uppercase; }
        .within-guide-results strong { margin-top:7px; color:#10213f; font-size:clamp(1.55rem,3.2vw,2.35rem); line-height:1.05; }
        .within-guide-results b { margin-top:5px; color:#667c92; font-size:.92rem; }
        .within-guide-copy { display:grid; gap:12px; margin-top:22px; }
        .within-guide-copy article { padding:18px; border:1px solid rgba(19,38,70,.08); border-radius:14px; background:rgba(255,255,255,.72); }
        .within-guide-copy h2 { margin:0; color:#29435e; font-size:1.12rem; }
        .within-guide-copy p { margin:8px 0 0; color:#5f748a; line-height:1.6; }
        .within-guide-related { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; padding-top:18px; border-top:1px solid rgba(19,38,70,.1); }
        .within-guide-related a { min-height:44px; display:inline-flex; align-items:center; padding:8px 12px; border:1px solid rgba(19,38,70,.1); border-radius:999px; background:#fff; color:#4f6a85; font-size:.86rem; font-weight:850; text-decoration:none; }
        @media (max-width:760px) {
          .within-guide-shell { width:min(100% - 20px,980px); padding-top:24px; }
          .within-guide-tool,.within-guide-results { grid-template-columns:1fr; }
          .within-guide-tool form,.within-guide-results { padding:16px; }
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

  return (
    <main className="page-shell net-thirty-vs-days-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="net-thirty-vs-days-shell">
        <header className="net-thirty-vs-days-intro">
          <p className="friendly-eyebrow">Invoice wording</p>
          <h1>Net 30 vs 30 days</h1>
          <p>
            They often produce the same date, but they are not always
            interchangeable as payment terms.
          </p>
        </header>

        <section className="net-thirty-vs-days-bam">
          <strong>
            Net 30 is a payment term. “30 days” is only a duration unless the
            source defines more.
          </strong>
          <p>
            In a simple invoice calculation, both may mean 30 calendar days
            after the invoice date. But the trigger event, start-day rule,
            weekend rule, holiday rule, or contract wording can change the
            actual deadline.
          </p>
        </section>

        <section className="net-thirty-vs-days-workspace">
          <form onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Invoice date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
              />
            </label>
          </form>

          <section className="net-thirty-vs-days-results" aria-live="polite">
            {parsedInvoiceDate && netThirtyDate && thirtyCalendarDaysDate ? (
              <>
                <article>
                  <small>Net 30</small>
                  <strong>{formatPlainDate(netThirtyDate)}</strong>
                  <b>{formatWeekday(netThirtyDate)}</b>
                  <p>
                    30 calendar days after the invoice date in WhenIsDue’s
                    standard Net 30 calculation.
                  </p>
                </article>

                <article>
                  <small>30 calendar days</small>
                  <strong>{formatPlainDate(thirtyCalendarDaysDate)}</strong>
                  <b>{formatWeekday(thirtyCalendarDaysDate)}</b>
                  <p>30 calendar days after the same reference date.</p>
                </article>
              </>
            ) : (
              <p>Enter a valid invoice date.</p>
            )}
          </section>
        </section>

        <section className="net-thirty-vs-days-copy">
          <article>
            <h2>When are they the same?</h2>
            <p>
              They match when “Net 30” means payment is due 30 calendar days
              after the invoice date and no other rule adjusts the final date.
            </p>
          </article>

          <article>
            <h2>Why can they differ?</h2>
            <p>
              A payment term can use a different starting event, such as
              receipt of the invoice, acceptance of goods, or completion of
              work. It can also include weekend, holiday, or other
              contract-specific rules.
            </p>
          </article>

          <article>
            <h2>Does the invoice date count as day one?</h2>
            <p>
              In WhenIsDue’s standard Net 30 calculation, the invoice date is
              treated as day zero and the due date is 30 calendar days later.
              If the governing wording uses a different convention, follow
              that wording.
            </p>
          </article>

          <article>
            <h2>What should you rely on?</h2>
            <p>
              Use the written invoice, contract, purchase order, or payment
              policy. The source that created the obligation controls the real
              deadline.
            </p>
          </article>
        </section>

        <nav className="net-thirty-vs-days-related" aria-label="Related invoice tools">
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
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            Invoice due date calculator
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

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Payment terms can define a different trigger event, counting convention, weekend or holiday rule, or final-day adjustment."
      />

      <style>{`
        .net-thirty-vs-days-page { min-height: 100vh; background: #fffaf2; }
        .net-thirty-vs-days-shell { width: min(100% - 32px, 980px); margin: 0 auto; padding: 34px 0 64px; }
        .net-thirty-vs-days-intro { text-align: center; }
        .net-thirty-vs-days-intro h1 { margin: 6px 0 0; color: #152d48; font-size: clamp(2.35rem, 6vw, 4.4rem); line-height: 1; letter-spacing: -0.04em; }
        .net-thirty-vs-days-intro > p:last-child { max-width: 700px; margin: 12px auto 0; color: #61788f; font-size: 1rem; line-height: 1.55; }
        .net-thirty-vs-days-bam { max-width: 780px; margin: 22px auto 0; padding: 18px; border: 1px solid rgba(62,126,82,.14); border-radius: 14px; background: #f7fcf7; text-align: center; }
        .net-thirty-vs-days-bam strong { display: block; color: #214b38; font-size: 1.12rem; line-height: 1.35; }
        .net-thirty-vs-days-bam p { margin: 8px 0 0; color: #567162; font-size: .96rem; line-height: 1.55; }
        .net-thirty-vs-days-workspace { display: grid; grid-template-columns: .7fr 1.3fr; gap: 14px; margin-top: 18px; }
        .net-thirty-vs-days-workspace form, .net-thirty-vs-days-results { padding: 20px; border: 1px solid rgba(19,38,70,.09); border-radius: 18px; background: #fff; }
        .net-thirty-vs-days-workspace form { align-self: stretch; display: flex; align-items: center; }
        .net-thirty-vs-days-workspace label { width: 100%; display: grid; gap: 6px; color: #526a82; font-size: .9rem; font-weight: 850; }
        .net-thirty-vs-days-workspace input { min-height: 48px; width: 100%; padding: 9px 11px; border: 1px solid rgba(19,38,70,.14); border-radius: 10px; background: #fff; color: #17304d; font: inherit; font-size: 1rem; }
        .net-thirty-vs-days-results { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
        .net-thirty-vs-days-results article { padding: 17px; border: 1px solid rgba(19,38,70,.09); border-radius: 13px; background: #fffdf9; text-align: center; }
        .net-thirty-vs-days-results small { display: block; color: #72869a; font-size: .78rem; font-weight: 900; letter-spacing: .035em; text-transform: uppercase; }
        .net-thirty-vs-days-results strong { display: block; margin-top: 7px; color: #10213f; font-size: clamp(1.55rem,3.2vw,2.35rem); line-height: 1.05; }
        .net-thirty-vs-days-results b { display: block; margin-top: 5px; color: #667c92; font-size: .92rem; }
        .net-thirty-vs-days-results p { margin: 9px 0 0; color: #667c92; font-size: .9rem; line-height: 1.5; }
        .net-thirty-vs-days-copy { display: grid; gap: 12px; margin-top: 22px; }
        .net-thirty-vs-days-copy article { padding: 18px; border: 1px solid rgba(19,38,70,.08); border-radius: 14px; background: rgba(255,255,255,.72); }
        .net-thirty-vs-days-copy h2 { margin: 0; color: #29435e; font-size: 1.12rem; }
        .net-thirty-vs-days-copy p { margin: 8px 0 0; color: #5f748a; font-size: .97rem; line-height: 1.6; }
        .net-thirty-vs-days-related { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; padding-top: 18px; border-top: 1px solid rgba(19,38,70,.1); }
        .net-thirty-vs-days-related a { min-height: 44px; display: inline-flex; align-items: center; padding: 8px 12px; border: 1px solid rgba(19,38,70,.1); border-radius: 999px; background: #fff; color: #4f6a85; font-size: .86rem; font-weight: 850; text-decoration: none; }
        @media (max-width: 760px) {
          .net-thirty-vs-days-shell { width: min(100% - 20px,980px); padding-top: 24px; }
          .net-thirty-vs-days-workspace, .net-thirty-vs-days-results { grid-template-columns: 1fr; }
          .net-thirty-vs-days-workspace form, .net-thirty-vs-days-results { padding: 16px; }
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
    <main className="page-shell weekend-deadline-guide-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="weekend-deadline-guide-shell">
        <header className="weekend-deadline-guide-intro">
          <p className="friendly-eyebrow">Deadline interpretation</p>
          <h1>What if a deadline falls on a weekend?</h1>
          <p>
            Sometimes the deadline moves to the next business day. Sometimes
            it does not. The rule that created the deadline decides.
          </p>
        </header>

        <section className="weekend-deadline-guide-bam">
          <strong>
            Do not automatically assume “Saturday means Monday.”
          </strong>
          <p>
            Many rules extend a deadline that lands on a weekend or holiday to
            the next business day, but that is not universal. Contracts,
            policies, court rules, and laws can define the final-day rule
            differently.
          </p>
        </section>

        <section className="weekend-deadline-guide-workspace">
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

          <section className="weekend-deadline-guide-result" aria-live="polite">
            {parsedDeadlineDate && nextBusinessDay ? (
              <>
                <span>If the rule says “next business day”</span>
                <strong>{formatPlainDate(nextBusinessDay)}</strong>
                <b>{formatWeekday(nextBusinessDay)}</b>
                <p>
                  Starting from {formatPlainDate(parsedDeadlineDate)}, WhenIsDue
                  moves forward to the next qualifying business day under the
                  selected calendar.
                </p>
              </>
            ) : (
              <p>Enter a valid deadline date.</p>
            )}
          </section>
        </section>

        <section className="weekend-deadline-guide-copy">
          <article>
            <h2>When does a weekend deadline usually move?</h2>
            <p>
              It moves when the governing rule explicitly says the final day
              must be a business day, working day, or non-holiday, or when that
              rule provides a next-business-day adjustment.
            </p>
          </article>

          <article>
            <h2>When might it stay on Saturday or Sunday?</h2>
            <p>
              A contract or policy may simply say “30 calendar days” or give a
              fixed date without any weekend extension. In that case, you
              should not add Monday unless the source says to.
            </p>
          </article>

          <article>
            <h2>What about public holidays?</h2>
            <p>
              The same issue applies. Some rules move a final date that lands
              on a recognized holiday; others do not. The applicable holiday
              calendar also matters.
            </p>
          </article>

          <article>
            <h2>What if the wording is unclear?</h2>
            <p>
              Use the deadline calculator to compare the stated rule with a
              next-business-day adjustment. If the deadline comes from a legal
              or regulated source, check the source definition before acting.
            </p>
          </article>
        </section>

        <nav className="weekend-deadline-guide-related" aria-label="Related deadline guides">
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
        </nav>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The governing contract, policy, law, court rule, or other source controls whether a weekend or holiday deadline moves."
      />

      <style>{`
        .weekend-deadline-guide-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .weekend-deadline-guide-shell {
          width: min(100% - 32px, 980px);
          margin: 0 auto;
          padding: 34px 0 64px;
        }

        .weekend-deadline-guide-intro {
          text-align: center;
        }

        .weekend-deadline-guide-intro h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 6vw, 4.4rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .weekend-deadline-guide-intro > p:last-child {
          max-width: 720px;
          margin: 12px auto 0;
          color: #61788f;
          font-size: 1rem;
          line-height: 1.55;
        }

        .weekend-deadline-guide-bam {
          max-width: 780px;
          margin: 22px auto 0;
          padding: 18px;
          border: 1px solid rgba(183, 121, 31, 0.15);
          border-radius: 14px;
          background: #fffdf8;
          text-align: center;
        }

        .weekend-deadline-guide-bam strong {
          display: block;
          color: #6c5220;
          font-size: 1.12rem;
          line-height: 1.35;
        }

        .weekend-deadline-guide-bam p {
          margin: 8px 0 0;
          color: #786b4d;
          font-size: 0.96rem;
          line-height: 1.55;
        }

        .weekend-deadline-guide-workspace {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 14px;
          margin-top: 18px;
        }

        .weekend-deadline-guide-workspace form,
        .weekend-deadline-guide-result {
          padding: 20px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 18px;
          background: #fff;
        }

        .weekend-deadline-guide-workspace form {
          display: grid;
          gap: 14px;
          align-content: center;
        }

        .weekend-deadline-guide-workspace label {
          display: grid;
          gap: 6px;
          color: #526a82;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .weekend-deadline-guide-workspace input {
          min-height: 48px;
          width: 100%;
          padding: 9px 11px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 10px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .weekend-deadline-guide-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .weekend-deadline-guide-result > span {
          color: #71869b;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .weekend-deadline-guide-result > strong {
          margin-top: 8px;
          color: #10213f;
          font-size: clamp(2rem, 4.5vw, 3.25rem);
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .weekend-deadline-guide-result > b {
          margin-top: 6px;
          color: #637a91;
          font-size: 1rem;
        }

        .weekend-deadline-guide-result > p {
          max-width: 640px;
          margin: 12px auto 0;
          color: #5f748a;
          font-size: 0.94rem;
          line-height: 1.55;
        }

        .weekend-deadline-guide-copy {
          display: grid;
          gap: 12px;
          margin-top: 22px;
        }

        .weekend-deadline-guide-copy article {
          padding: 18px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
        }

        .weekend-deadline-guide-copy h2 {
          margin: 0;
          color: #29435e;
          font-size: 1.12rem;
        }

        .weekend-deadline-guide-copy p {
          margin: 8px 0 0;
          color: #5f748a;
          font-size: 0.97rem;
          line-height: 1.6;
        }

        .weekend-deadline-guide-related {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .weekend-deadline-guide-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.86rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .weekend-deadline-guide-shell {
            width: min(100% - 20px, 980px);
            padding-top: 24px;
          }

          .weekend-deadline-guide-workspace {
            grid-template-columns: 1fr;
          }

          .weekend-deadline-guide-workspace form,
          .weekend-deadline-guide-result {
            padding: 16px;
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

  return (
    <main className="page-shell next-payday-page">
      <header className="next-payday-brand-header">
        <a
          className="next-payday-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="next-payday-brand-nav" aria-label="Main navigation">
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
            VA Workspace
          </a>
        </nav>
      </header>

      <section className="next-payday-editorial-hero" aria-label="Next payday answer">
        <div className="next-payday-editorial-card">
          <p className="friendly-eyebrow">Next payday calculator</p>
          <h1>When is my next payday?</h1>

          {nextPayday && parsedKnownPayday ? (
            <>
              <div className="next-payday-editorial-divider" />
              <p className="next-payday-editorial-rule">{scheduleShortLabel}</p>
              <strong className="next-payday-editorial-date">
                {formatPlainDate(nextPayday)}
              </strong>
              <span className="next-payday-editorial-weekday">
                {formatWeekday(nextPayday)}
              </span>
              <div className="next-payday-editorial-meta">
                <span>Known payday</span>
                <strong>{formatPlainDate(parsedKnownPayday)}</strong>
              </div>
            </>
          ) : (
            <p className="next-payday-editorial-empty">Choose a valid known payday.</p>
          )}
        </div>
      </section>

      <section className="next-payday-calculation-shell" aria-label="Next payday calculator">
        <header className="next-payday-calculation-heading">
          <p className="friendly-eyebrow">Your calculation</p>
          <h2>Set a known payday and pay schedule</h2>
          <p>The next scheduled payday updates immediately.</p>
        </header>

        <div className="next-payday-workspace">
          <div className="next-payday-form">
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

            <label>
              <span>Pay schedule</span>
              <select
                value={schedule}
                onChange={(event) => {
                  const next = event.target.value as PaySchedule
                  setSchedule(next)
                  trackWhenIsDueEvent('pay_schedule_changed', { value: next })
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly · every 2 weeks</option>
                <option value="semimonthly-1-15">Semimonthly · 1st and 15th</option>
                <option value="semimonthly-15-last">Semimonthly · 15th and last day</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <div className="next-payday-quick-picks" aria-label="Common pay schedules">
              {[
                ['Weekly', 'weekly'],
                ['Every 2 weeks', 'biweekly'],
                ['1st & 15th', 'semimonthly-1-15'],
                ['15th & last', 'semimonthly-15-last'],
              ].map(([label, value]) => (
                <button
                  type="button"
                  key={value}
                  className={schedule === value ? 'is-active' : ''}
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
          </div>

          <div className="next-payday-result" aria-live="polite">
            {nextPayday && parsedKnownPayday ? (
              <>
                <p>Next payday</p>
                <div className="next-payday-date">{formatPlainDate(nextPayday)}</div>
                <div className="next-payday-weekday">{formatWeekday(nextPayday)}</div>
                <div className="next-payday-schedule-pill">{scheduleShortLabel}</div>
                <p className="next-payday-rule">{payScheduleLabel(schedule)}</p>

                <p className="next-payday-citation-explanation">
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

                <ResultActions
                  title="Next payday"
                  date={nextPayday}
                  details={payScheduleLabel(schedule)}
                />
              </>
            ) : (
              <p className="next-payday-empty">Choose a valid known payday.</p>
            )}
          </div>
        </div>

        <p className="next-payday-caveat">
          This calculates the schedule only. Employers and banks may move payments
          for weekends, holidays, payroll processing, or local rules.
        </p>
      </section>

      <section className="next-payday-related" aria-labelledby="next-payday-related-title">
        <div>
          <p className="friendly-eyebrow">Related timing tools</p>
          <h2 id="next-payday-related-title">Plan around the payment date</h2>
        </div>
        <div className="next-payday-related-grid">
          <a
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            <span>Business days calculator</span>
            <strong>→</strong>
          </a>
          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            <span>Invoice due date calculator</span>
            <strong>→</strong>
          </a>
          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            <span>Deadline calculator</span>
            <strong>→</strong>
          </a>
        </div>
      </section>

      <section className="next-payday-rules" aria-label="Pay schedule help">
        <header>
          <p className="friendly-eyebrow">Pay schedule rules</p>
          <h2>Known payday, schedule, next payday</h2>
        </header>

        <div className="next-payday-rules-grid">
          <article>
            <h3>How this calculator works</h3>
            <p>
              Weekly and biweekly schedules add 7 or 14 calendar days. Semimonthly
              schedules use the selected dates each month. Monthly schedules use the
              same calendar day when that day exists, or the last day of a shorter month.
            </p>
          </article>

          <article>
            <h3>Biweekly is not twice a month</h3>
            <p>
              Biweekly means every 14 days. Semimonthly means two scheduled pay dates
              each month, so the spacing between checks can vary.
            </p>
          </article>

          <article>
            <h3>Weekend and holiday changes</h3>
            <p>
              This calculator shows the scheduled date before employer or bank
              adjustments. Your payroll policy may move a payment earlier or later.
            </p>
          </article>

          <article>
            <h3>If your schedule is different</h3>
            <p>
              Use the closest matching schedule here, then confirm the actual payroll
              policy with your employer or payroll provider.
            </p>
          </article>
        </div>

        <div className="next-payday-faq">
          <h3>Next payday FAQ</h3>
          <dl>
            <div>
              <dt>Is biweekly the same as twice a month?</dt>
              <dd>No. Biweekly means every 14 days. Semimonthly means two scheduled pay dates each month.</dd>
            </div>
            <div>
              <dt>Does this move payday for a weekend or holiday?</dt>
              <dd>No. Payroll policies differ, so the displayed date is the schedule date before employer or bank adjustments.</dd>
            </div>
            <div>
              <dt>What if my employer uses a different schedule?</dt>
              <dd>Use the closest matching schedule here and confirm the actual payroll policy with your employer.</dd>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .next-payday-page {
          background: #fffaf2;
        }

        .next-payday-brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          width: min(1080px, calc(100% - 36px));
          margin: 0 auto;
          padding: 22px 0 16px;
          border-bottom: 1px solid rgba(19, 38, 70, 0.12);
        }

        .next-payday-brand {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
        }

        .next-payday-brand img {
          display: block;
          width: auto;
          height: 42px;
        }

        .next-payday-brand-nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .next-payday-brand-nav a {
          color: #58708a;
          font-size: 0.94rem;
          font-weight: 850;
          text-decoration: none;
        }

        .next-payday-editorial-hero {
          position: relative;
          min-height: 560px;
          width: min(1080px, calc(100% - 36px));
          margin: 14px auto 0;
          overflow: hidden;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 28px;
          background-image: url('/next-payday-background.webp');
          background-position: center;
          background-size: cover;
        }

        .next-payday-editorial-card {
          position: absolute;
          top: 32px;
          left: 32px;
          width: min(475px, calc(100% - 64px));
          padding: 30px 32px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 24px;
          background: rgba(255, 252, 245, 0.94);
          box-shadow: 0 18px 48px rgba(40, 33, 23, 0.08);
          backdrop-filter: blur(7px);
        }

        .next-payday-editorial-card h1 {
          margin: 12px 0 0;
          max-width: 420px;
          color: #12355d;
          font-size: clamp(2.9rem, 5vw, 4.55rem);
          font-weight: 950;
          line-height: 0.94;
          letter-spacing: -0.06em;
          text-wrap: balance;
        }

        .next-payday-editorial-divider {
          height: 1px;
          margin: 24px 0 20px;
          background: rgba(19, 38, 70, 0.12);
        }

        .next-payday-editorial-rule {
          margin: 0;
          color: #657b92;
          font-size: 1rem;
          font-weight: 850;
        }

        .next-payday-editorial-date {
          display: block;
          margin-top: 6px;
          color: #12355d;
          font-size: clamp(2.35rem, 4vw, 3.6rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .next-payday-editorial-weekday {
          display: block;
          margin-top: 7px;
          color: #5f7790;
          font-size: 1rem;
          font-weight: 800;
        }

        .next-payday-editorial-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 22px;
          padding: 13px 14px;
          border-radius: 14px;
          background: #edf5f7;
          color: #365875;
        }

        .next-payday-editorial-meta span {
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .next-payday-editorial-meta strong {
          font-size: 0.96rem;
        }

        .next-payday-editorial-empty {
          margin: 22px 0 0;
          color: #6b7e91;
        }

        .next-payday-calculation-shell {
          width: min(1080px, calc(100% - 36px));
          margin: 22px auto 0;
          padding: 30px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.7);
        }

        .next-payday-calculation-heading h2 {
          margin: 7px 0 0;
          color: #12355d;
          font-size: clamp(2.15rem, 4vw, 3.6rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .next-payday-calculation-heading > p:last-child {
          margin: 10px 0 0;
          color: #6b8094;
          font-size: 1rem;
        }

        .next-payday-workspace {
          display: grid;
          grid-template-columns: minmax(280px, 0.72fr) minmax(390px, 1.28fr);
          gap: 16px;
          margin-top: 22px;
        }

        .next-payday-form,
        .next-payday-result {
          min-width: 0;
          border-radius: 20px;
        }

        .next-payday-form {
          display: grid;
          align-content: start;
          gap: 18px;
          padding: 22px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          background: #f3eee4;
        }

        .next-payday-form label {
          display: grid;
          gap: 7px;
        }

        .next-payday-form label > span {
          color: #526b85;
          font-size: 0.93rem;
          font-weight: 900;
        }

        .next-payday-form input,
        .next-payday-form select {
          width: 100%;
          min-width: 0;
          min-height: 52px;
          padding: 10px 12px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 12px;
          background: #fff;
          color: #243f5e;
          font: inherit;
          font-size: 1rem;
        }

        .next-payday-quick-picks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .next-payday-quick-picks button {
          min-height: 46px;
          padding: 8px 10px;
          border: 1px solid rgba(19, 38, 70, 0.12);
          border-radius: 11px;
          background: #fff;
          color: #58718a;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 850;
          cursor: pointer;
        }

        .next-payday-quick-picks button.is-active {
          border-color: rgba(43, 129, 112, 0.48);
          background: #e7f4ee;
          color: #1f6b5c;
          box-shadow: inset 0 0 0 1px rgba(43, 129, 112, 0.18);
        }

        .next-payday-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 28px 34px;
          background: #153a64;
          color: #fffaf2;
          text-align: left;
        }

        .next-payday-result > p:first-child {
          margin: 0;
          color: #9bcab8;
          font-size: 0.82rem;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .next-payday-date {
          margin-top: 12px;
          color: #fff8ea;
          font-size: clamp(4.2rem, 7vw, 7rem);
          font-weight: 950;
          line-height: 0.88;
          letter-spacing: -0.065em;
          text-wrap: balance;
        }

        .next-payday-weekday {
          margin-top: 16px;
          color: #dbe6ef;
          font-size: 1.12rem;
          font-weight: 850;
        }

        .next-payday-schedule-pill {
          align-self: flex-start;
          margin-top: 20px;
          padding: 8px 13px;
          border: 1px solid #e5c995;
          border-radius: 999px;
          background: #fff7e7;
          color: #7c5422;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .next-payday-rule {
          margin: 14px 0 0;
          color: #c6d5e2;
          font-size: 0.98rem;
          line-height: 1.45;
        }

        .next-payday-citation-explanation {
          max-width: 680px;
          margin: 22px 0 0;
          color: #d6e0e8;
          font-size: 1rem;
          line-height: 1.62;
          text-align: left;
        }

        .next-payday-result .calculation-receipt {
          margin-top: 22px;
        }

        .next-payday-result .result-actions {
          margin-top: 18px;
        }

        .next-payday-empty {
          margin: auto;
          color: #d4e0e8;
        }

        .next-payday-caveat {
          margin: 14px 4px 0;
          color: #687e92;
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .next-payday-related {
          width: min(1080px, calc(100% - 36px));
          margin: 24px auto 0;
          padding: 28px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 24px;
          background: #edf5f7;
        }

        .next-payday-related > div:first-child {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .next-payday-related h2 {
          margin: 7px 0 0;
          color: #12355d;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }

        .next-payday-related-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .next-payday-related-grid a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 62px;
          padding: 14px 16px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 13px;
          background: #fff;
          color: #173a63;
          font-size: 0.92rem;
          font-weight: 850;
          text-decoration: none;
        }

        .next-payday-related-grid strong {
          color: #2c846f;
          font-size: 1.15rem;
        }

        .next-payday-rules {
          width: min(1080px, calc(100% - 36px));
          margin: 36px auto 0;
          padding-bottom: 18px;
        }

        .next-payday-rules > header h2 {
          margin: 8px 0 0;
          color: #12355d;
          font-size: clamp(2.25rem, 4vw, 3.6rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .next-payday-rules-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .next-payday-rules-grid article,
        .next-payday-faq {
          padding: 22px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.76);
        }

        .next-payday-rules-grid h3,
        .next-payday-faq h3 {
          margin: 0;
          color: #173a63;
          font-size: 1.05rem;
        }

        .next-payday-rules-grid p {
          margin: 12px 0 0;
          color: #667d93;
          line-height: 1.6;
        }

        .next-payday-faq {
          margin-top: 12px;
        }

        .next-payday-faq dl {
          display: grid;
          gap: 14px;
          margin: 18px 0 0;
        }

        .next-payday-faq dl > div {
          display: grid;
          gap: 5px;
        }

        .next-payday-faq dt {
          color: #173a63;
          font-weight: 850;
        }

        .next-payday-faq dd {
          margin: 0;
          color: #6a7f92;
          line-height: 1.58;
        }

        @media (max-width: 760px) {
          .next-payday-brand-header,
          .next-payday-editorial-hero,
          .next-payday-calculation-shell,
          .next-payday-related,
          .next-payday-rules {
            width: calc(100% - 20px);
          }

          .next-payday-brand-header {
            gap: 14px;
            padding: 18px 0 12px;
          }

          .next-payday-brand img {
            height: 34px;
          }

          .next-payday-brand-nav {
            gap: 14px;
          }

          .next-payday-brand-nav a {
            font-size: 0.8rem;
            white-space: nowrap;
          }

          .next-payday-editorial-hero {
            min-height: 540px;
            margin-top: 12px;
            border-radius: 24px;
            background-position: 73% 58%;
          }

          .next-payday-editorial-card {
            top: 16px;
            bottom: auto;
            left: 14px;
            width: calc(100% - 28px);
            padding: 18px 20px 16px;
            border-radius: 22px;
          }

          .next-payday-editorial-card h1 {
            margin-top: 8px;
            font-size: clamp(2.2rem, 10.2vw, 3rem);
            line-height: 0.96;
          }

          .next-payday-editorial-divider {
            margin: 15px 0 12px;
          }

          .next-payday-editorial-rule {
            font-size: 0.9rem;
          }

          .next-payday-editorial-date {
            font-size: clamp(2.25rem, 9.8vw, 3rem);
          }

          .next-payday-editorial-weekday {
            margin-top: 5px;
            font-size: 0.94rem;
          }

          .next-payday-editorial-meta {
            margin-top: 14px;
            padding: 10px 12px;
          }

          .next-payday-editorial-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .next-payday-calculation-shell {
            margin-top: 14px;
            padding: 18px 14px;
          }

          .next-payday-calculation-heading h2 {
            font-size: clamp(2.25rem, 10vw, 3rem);
          }

          .next-payday-workspace {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 16px;
          }

          .next-payday-form {
            gap: 14px;
            padding: 16px;
          }

          .next-payday-form input,
          .next-payday-form select {
            min-height: 46px;
            padding: 8px 10px;
          }

          .next-payday-quick-picks {
            gap: 7px;
          }

          .next-payday-quick-picks button {
            min-height: 42px;
            padding: 7px 8px;
            font-size: 0.84rem;
          }

          .next-payday-result {
            padding: 24px 18px 22px;
          }

          .next-payday-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .next-payday-result .result-actions button,
          .next-payday-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .next-payday-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .next-payday-date {
            font-size: clamp(4rem, 17vw, 5.5rem);
          }

          .next-payday-citation-explanation {
            font-size: 0.98rem;
          }

          .next-payday-related {
            padding: 20px 16px;
          }

          .next-payday-related > div:first-child {
            align-items: flex-start;
            gap: 12px;
          }

          .next-payday-related-grid {
            grid-template-columns: 1fr;
            gap: 7px;
            margin-top: 16px;
          }

          .next-payday-related-grid a {
            min-height: 52px;
            padding: 11px 14px;
          }

          .next-payday-rules {
            margin-top: 30px;
          }

          .next-payday-rules-grid {
            grid-template-columns: 1fr;
          }

          .next-payday-rules-grid article,
          .next-payday-faq {
            padding: 16px;
          }

          .next-payday-rules-grid {
            gap: 9px;
            margin-top: 18px;
          }

          .next-payday-faq dl {
            gap: 11px;
            margin-top: 14px;
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

    if (
      deadlineInterpretation.classification === 'ambiguous' &&
      deadlineInterpretation.triggerDate
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
      deadlineInterpretation.classification === 'resolved' &&
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
      description: 'Add working hours inside a business-day schedule.',
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

type AskWhenBoxProps = NavigationProps & {
  holidayCalendar: HolidayCalendarId
  today: PlainDate
}

function AskWhenBox({ onNavigate, holidayCalendar, today }: AskWhenBoxProps) {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') ?? '',
  )
  const [submittedWithoutMatch, setSubmittedWithoutMatch] = useState(false)
  const match = useMemo(
    () => resolveAskWhenQuery(query, holidayCalendar, today),
    [query, holidayCalendar, today],
  )

  const examples = [
    'what is 3 business days from today',
    '5 business days after 2026-08-10',
    '3-5 business days shipping',
    'Net 30 due date',
    '30 day return',
  ]

  function submitQuery() {
    if (!query.trim()) return

    if (!match) {
      setSubmittedWithoutMatch(true)
      trackWhenIsDueEvent('ask_when_unrecognized', {
        query: query.trim(),
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
          query: query.trim(),
          normalized_query: normalizeAskWhenQuery(query),
          answer: match.label,
        },
      )
      return
    }

    trackWhenIsDueEvent('ask_when_submitted', {
      query: query.trim(),
      normalized_query: normalizeAskWhenQuery(query),
      destination: match.path,
    })
    onNavigate(match.path)
  }

  return (
    <section className="ask-when-box" aria-labelledby="ask-when-title">
      <div className="ask-when-heading">
        <span>Ask WhenIsDue</span>
        <h2 id="ask-when-title">What date do you need?</h2>
        <p>Type a date or deadline question in plain English.</p>
      </div>

      <form
        className="ask-when-form"
        onSubmit={(event) => {
          event.preventDefault()
          submitQuery()
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSubmittedWithoutMatch(false)
          }}
          placeholder="Try: 10 business days from today"
          aria-label="Ask a date or deadline question"
          autoComplete="off"
        />
      </form>

      {query.trim() && (match || submittedWithoutMatch) ? (
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

      <div className="ask-when-examples" aria-label="Ask WhenIsDue examples">
        {examples.map((example) => (
          <button
            type="button"
            key={example}
            onClick={() => {
              setQuery(example)
              trackWhenIsDueEvent('ask_when_example_clicked', { query: example })
            }}
          >
            {example}
          </button>
        ))}
      </div>

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
  const [isMobileTaskListExpanded, setIsMobileTaskListExpanded] = useState(false)

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
            <a
              href="/workspace"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/workspace')
              }}
            >
              VA Workspace
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
            />
          </div>

          <figure className="date-home-editorial-art">
            <img
              src="/homepage-editorial.webp"
              alt="A parcel, envelope, folded document, and paper slip arranged on a warm stone surface."
              decoding="async"
              fetchPriority="high"
            />
            <figcaption className="date-home-today-card" aria-hidden="true">
              <span>Today</span>
              <strong>{formatPlainDate(today)}</strong>
              <small>{formatWeekday(today)}</small>
            </figcaption>
          </figure>
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

        .date-home-editorial-art {
          position: relative;
          min-width: 0;
          min-height: 590px;
          margin: 0;
          overflow: hidden;
          background: #d9c6aa;
        }

        .date-home-editorial-art img {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 590px;
          object-fit: cover;
          object-position: 50% center;
        }

        .date-home-editorial-art .date-home-today-card {
          position: absolute;
          left: 50%;
          top: 52%;
          width: min(72%, 430px);
          padding: 20px 24px 22px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 18px;
          background: rgba(255, 250, 242, 0.56);
          box-shadow: 0 18px 42px rgba(19, 38, 70, 0.14);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          text-align: center;
          transform: translate(-50%, -50%);
        }

        .date-home-editorial-art .date-home-today-card span,
        .date-home-editorial-art .date-home-today-card strong,
        .date-home-editorial-art .date-home-today-card small {
          display: block;
        }

        .date-home-editorial-art .date-home-today-card span {
          color: #246b52;
          font-size: 0.7rem;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .date-home-editorial-art .date-home-today-card strong {
          margin-top: 7px;
          color: #10213f;
          font-size: clamp(2rem, 3.6vw, 3.35rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .date-home-editorial-art .date-home-today-card small {
          margin-top: 7px;
          color: #60758d;
          font-size: 0.9rem;
          font-weight: 850;
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
            grid-template-columns: 1fr;
            min-height: 0;
            margin-top: 10px;
            border-radius: 20px;
          }

          .date-home-editorial-copy {
            padding: 16px 15px 14px;
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

          .date-home-editorial-art {
            min-height: 0;
          }

          .date-home-editorial-art img {
            min-height: 0;
            height: 172px;
            object-position: 44% center;
          }

          .date-home-editorial-art .date-home-today-card {
            left: 50%;
            top: 49%;
            width: min(82%, 310px);
            padding: 11px 14px 13px;
            border-radius: 14px;
          }

          .date-home-editorial-art .date-home-today-card span {
            font-size: 0.6rem;
          }

          .date-home-editorial-art .date-home-today-card strong {
            margin-top: 5px;
            font-size: clamp(1.5rem, 7.6vw, 2rem);
          }

          .date-home-editorial-art .date-home-today-card small {
            margin-top: 5px;
            font-size: 0.76rem;
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
            Different date or number
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

      <section className="date-home-tools" aria-labelledby="date-home-tools-title">
        <div className="date-home-tools-heading">
          <span className="date-home-chapter-label">Choose by task</span>
          <h2 id="date-home-tools-title">What do you need to know?</h2>
          <p>Pick the question closest to what you are trying to figure out.</p>
        </div>

        <div className="date-home-tool-grid">
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
            <span>Business days</span>
            <strong>When is it due?</strong>
            <small>Skip weekends and find the exact date.</small>
          </a>

          <a
            href="/return-window-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/return-window-calculator')
            }}
          >
            <span>Returns</span>
            <strong>Last day to return</strong>
            <small>Calculate from the purchase or delivery date.</small>
          </a>

          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            <span>Invoices</span>
            <strong>Invoice due date</strong>
            <small>Net 7, Net 15, Net 30, Net 45, and more.</small>
          </a>

          <a
            href="/free-trial-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/free-trial-calculator')
            }}
          >
            <span>Subscriptions</span>
            <strong>When does my trial end?</strong>
            <small>Find the end date before renewal.</small>
          </a>

          <a
            className={`date-home-tool-secondary ${isMobileTaskListExpanded ? 'is-expanded' : ''}`}
            href="/next-payday-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/next-payday-calculator')
            }}
          >
            <span>Pay schedule</span>
            <strong>When is my next payday?</strong>
            <small>Weekly, biweekly, semimonthly, or monthly.</small>
          </a>

          <a
            className={`date-home-tool-secondary ${isMobileTaskListExpanded ? 'is-expanded' : ''}`}
            href={`/business-hours-deadline-calculator${
              holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
            }`}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(
                `/business-hours-deadline-calculator${
                  holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
                }`,
              )
            }}
          >
            <span>SLA / response time</span>
            <strong>Add business hours</strong>
            <small>Calculate a deadline inside a workday schedule.</small>
          </a>

          <a
            className={`date-home-tool-secondary ${isMobileTaskListExpanded ? 'is-expanded' : ''}`}
            href={`/business-days-between-dates${
              holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
            }`}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(
                `/business-days-between-dates${
                  holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
                }`,
              )
            }}
          >
            <span>Date difference</span>
            <strong>Business days between dates</strong>
            <small>Count weekdays between two dates instantly.</small>
          </a>

          <a
            className={`date-home-tool-secondary ${isMobileTaskListExpanded ? 'is-expanded' : ''}`}
            href="/net-30-due-date"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/net-30-due-date')
            }}
          >
            <span>Invoices</span>
            <strong>Net 30 due date</strong>
            <small>Enter an invoice date and get the due date immediately.</small>
          </a>

          <a
            className={`date-home-tool-secondary ${isMobileTaskListExpanded ? 'is-expanded' : ''}`}
            href="/shipping-delivery-range-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/shipping-delivery-range-calculator')
            }}
          >
            <span>Shipping</span>
            <strong>Delivery date range</strong>
            <small>Turn 3–5 business days into earliest and latest dates.</small>
          </a>
        </div>

        <button
          type="button"
          className="date-home-tool-toggle"
          aria-expanded={isMobileTaskListExpanded}
          onClick={() => {
            const nextExpanded = !isMobileTaskListExpanded
            setIsMobileTaskListExpanded(nextExpanded)
            trackWhenIsDueEvent('homepage_task_list_toggled', {
              expanded: nextExpanded,
            })
          }}
        >
          {isMobileTaskListExpanded ? 'Show fewer tasks ↑' : 'Show more tasks ↓'}
        </button>
      </section>


      <HomepageQuestionMap onNavigate={onNavigate} />

      <DeadlineCountingGuideLinks onNavigate={onNavigate} />

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

      <section className="date-home-secondary" aria-label="WhenIsDue workspace">
        <div>
          <span>Need to keep track of deadlines?</span>
          <strong>VA Workspace is still here.</strong>
        </div>
        <a
          href="/workspace"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/workspace')
          }}
        >
          Open workspace
        </a>
      </section>

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

        .date-home-business,
        .date-home-tools {
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
        <IdentityRow onNavigate={onNavigate} />

        <div className="dual-intent-grid utility-hub-hero">
          <div className="dual-intent-copy">
            <p className="friendly-eyebrow">
              <span aria-hidden="true">◷</span>
              Date and deadline tools
            </p>
            <h1 id="homepage-title" tabIndex={-1}>Choose what you need to know.</h1>
            <p className="friendly-subtitle">
              Business days, invoice due dates, returns, free trials, and date differences — with the answer shown as quickly as possible.
            </p>

            <p className="friendly-subtitle">
              Choose the calculator that matches your question. Dedicated tools are faster and easier to verify.
            </p>
          </div>

          <div className="dual-intent-proof utility-directory-cards" aria-label="WhenIsDue calculators">
            <a
              className="intent-proof-card proof-calculator"
              href="/business-days-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-days-calculator' })
                onNavigate('/business-days-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">◷</span>
              <div>
                <p>Business days</p>
                <h2>Add business days</h2>
                <span>Skip weekends and optionally supported public holidays.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/business-days-between-dates"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-days-between-dates' })
                onNavigate('/business-days-between-dates')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↔</span>
              <div>
                <p>Date difference</p>
                <h2>Business days between dates</h2>
                <span>Count working days between two dates.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/invoice-due-date-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/invoice-due-date-calculator' })
                onNavigate('/invoice-due-date-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">#</span>
              <div>
                <p>Invoices</p>
                <h2>Invoice due date</h2>
                <span>Net 7, 15, 30, 45, 60, 90, and EOM.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/return-window-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/return-window-calculator' })
                onNavigate('/return-window-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↩</span>
              <div>
                <p>Returns</p>
                <h2>Return deadline</h2>
                <span>Find the last day of a return window.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/free-trial-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/free-trial-calculator' })
                onNavigate('/free-trial-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">◇</span>
              <div>
                <p>Subscriptions</p>
                <h2>Free trial end date</h2>
                <span>Find the trial end date and suggested reminder.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/deadline-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/deadline-calculator' })
                onNavigate('/deadline-calculator')
              }}
            >
              <strong>Rule-aware deadline</strong>
              <span>Choose how the deadline should be counted.</span>
            </a>

            <a
              className="intent-proof-card proof-calculator"
              href="/business-hours-deadline-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/business-hours-deadline-calculator' })
                onNavigate('/business-hours-deadline-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">⏱</span>
              <div>
                <p>SLA / response time</p>
                <h2>Business-hours deadline</h2>
                <span>Add working hours inside a business-day schedule.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/next-payday-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/next-payday-calculator' })
                onNavigate('/next-payday-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">$</span>
              <div>
                <p>Pay schedule</p>
                <h2>Next payday</h2>
                <span>Weekly, biweekly, semimonthly, or monthly.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/net-30-due-date"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/net-30-due-date' })
                onNavigate('/net-30-due-date')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">30</span>
              <div>
                <p>Popular answer</p>
                <h2>Net 30 due date</h2>
                <span>Fast one-input answer for a common invoice term.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/2-10-net-30-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/2-10-net-30-calculator' })
                onNavigate('/2-10-net-30-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">2%</span>
              <div>
                <p>Invoice discount terms</p>
                <h2>2/10 Net 30</h2>
                <span>See the discount deadline and the final payment due date.</span>
              </div>
            </a>

            <a
              className="intent-proof-card proof-calculator"
              href="/shipping-delivery-range-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/shipping-delivery-range-calculator' })
                onNavigate('/shipping-delivery-range-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">⇢</span>
              <div>
                <p>Shipping</p>
                <h2>Delivery date range</h2>
                <span>Convert 3–5 business days into an earliest and latest date.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/notice-period-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/notice-period-calculator' })
                onNavigate('/notice-period-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">←</span>
              <div>
                <p>Contracts & renewals</p>
                <h2>Notice period</h2>
                <span>Count backward to find the latest date to give notice.</span>
              </div>
            </a>
            <a
              className="intent-proof-card proof-calculator"
              href="/subscription-renewal-calculator"
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('calculator_directory_click', { path: '/subscription-renewal-calculator' })
                onNavigate('/subscription-renewal-calculator')
              }}
            >
              <span className="intent-proof-icon" aria-hidden="true">↻</span>
              <div>
                <p>Subscriptions</p>
                <h2>Renewal & cancellation</h2>
                <span>Find the next renewal date and optional cancellation deadline.</span>
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
            <p>Open the older all-in-one date calculator.</p>
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

  const primaryAnswerDate = calculateBusinessDaysWithCalendar(
    today,
    3,
    holidayCalendar,
  ).date

  return (
    <main className="page-shell business-page business-answer-first-page">
      <header className="business-answer-header" aria-label="WhenIsDue">
        <a
          className="business-answer-brand"
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

      <section className="business-answer-shell" aria-labelledby="business-days-title">
        <div className="business-answer-hero">
          <p className="business-answer-eyebrow">Business days calculator</p>
          <h1 id="business-days-title">
            3 business days from today is
          </h1>
          <p className="business-answer-date">
            <span className="business-answer-weekday">{formatWeekday(primaryAnswerDate)},</span>
            <span className="business-answer-month-date">{formatPlainDate(primaryAnswerDate)}</span>
          </p>
          <p className="business-answer-rule">
            {holidayCalendar === 'none'
              ? 'Weekends are skipped. Public holidays still count as weekdays.'
              : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays are skipped.`}
          </p>
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

          <div className="business-answer-counting-status">
            <span>Counting</span>
            <strong>
              {holidayCalendar === 'none'
                ? 'Weekends skipped'
                : `Weekends + ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped`}
            </strong>
          </div>

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

          {validationMessage ? (
            <p className="business-answer-form-message">{validationMessage}</p>
          ) : null}
        </form>
      </section>

      {dueDate && parsedBusinessDays !== null && parsedStartDate ? (
        <section className="business-answer-live-result" aria-live="polite">
          <p className="business-answer-live-label">Your answer</p>
          <p className="business-answer-live-sentence">
            {parsedBusinessDays} {parsedBusinessDays === 1 ? 'business day' : 'business days'} from{' '}
            {toDateKey(parsedStartDate) === toDateKey(today) ? 'today' : formatPlainDate(parsedStartDate)} is
          </p>
          <p className="business-answer-live-date">
            <strong>{formatWeekday(dueDate)},</strong>
            <span>{formatPlainDate(dueDate)}</span>
          </p>
          <p className="business-answer-live-note">
            {holidayCalendar === 'none'
              ? 'Weekends are skipped. Public holidays are not removed.'
              : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays are skipped.`}
          </p>
        </section>
      ) : null}

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
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0 0.22em;
          margin: 22px 0 0;
          color: var(--business-navy);
          font-size: clamp(3.8rem, 8.8vw, 8.7rem);
          font-weight: 900;
          line-height: 0.86;
          letter-spacing: -0.065em;
        }

        .business-answer-weekday,
        .business-answer-month-date {
          display: inline;
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
          padding: 24px clamp(24px, 5vw, 68px);
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
          margin: 0;
          color: #9c4e35;
          font-weight: 700;
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
            margin-top: 16px;
            border-radius: 24px;
          }

          .business-answer-hero {
            padding: 28px 24px 24px;
          }

          .business-answer-hero h1 {
            max-width: 100%;
            margin-top: 10px;
            font-size: clamp(2rem, 9.3vw, 3rem);
            line-height: 1.02;
          }

          .business-answer-date {
            display: block;
            margin-top: 22px;
            font-size: clamp(3.25rem, 15vw, 5.2rem);
            line-height: 0.88;
          }

          .business-answer-weekday,
          .business-answer-month-date {
            display: block;
          }

          .business-answer-month-date {
            margin-top: 4px;
          }

          .business-answer-rule {
            margin-top: 22px;
            font-size: 0.94rem;
            line-height: 1.4;
          }

          .business-answer-controls {
            grid-template-columns: 1fr 0.48fr;
            gap: 12px;
            padding: 22px 20px 24px;
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

    return orderedCounts.filter(
      (value, index, values) => value !== dayCount && values.indexOf(value) === index,
    ).slice(0, 4)
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

  return (
    <main className="page-shell three-business-days-page">
      <section className="three-business-hero" aria-labelledby="business-days-from-today-title">
        <div className="three-business-topbar">
          <button
            type="button"
            className="three-business-brand"
            onClick={() => onNavigate('/')}
            aria-label="WhenIsDue home"
          >
            WhenIsDue
          </button>
          <button
            type="button"
            className="three-business-calculator-link"
            onClick={() => onNavigate('/business-days-calculator')}
          >
            Business days calculator
          </button>
        </div>

        <div className="three-business-answer">
          <h1 id="business-days-from-today-title" className="three-business-question">
            {dayCount} business days from today
          </h1>

          <p className="three-business-date" aria-label={`Answer: ${formatPlainDate(answerDate)}`}>
            {formatPlainDate(answerDate)}
          </p>

          <p className="three-business-weekday">{formatWeekday(answerDate)}</p>

          <p className="three-business-context">
            Today: <strong>{formatWeekday(today)}, {formatPlainDate(today)}</strong>
            <span aria-hidden="true"> · </span>
            {getLocalTimeZoneName()}
          </p>

          <p className="three-business-rule">
            {holidayCalendar === 'none'
              ? 'Weekends skipped. Public holidays still count as weekdays.'
              : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped.`}
          </p>

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

          <p className="three-business-explanation">
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
                value: formatSkippedHolidaySummary(answerCalculation.skippedHolidays),
              },
              {
                label: 'Result',
                value: `${formatWeekday(answerDate)}, ${formatPlainDate(answerDate)}`,
              },
            ]}
          />
        </div>
      </section>

      <section className="three-business-more" aria-labelledby="three-business-more-title">
        <h2 id="three-business-more-title">Other common answers</h2>

        <div className="three-business-related-grid">
          {relatedAnswers.map(({ dayCount: relatedDayCount, date }) => (
            <button
              type="button"
              className="three-business-related-card"
              key={relatedDayCount}
              onClick={() =>
                onNavigate(
                  `/${relatedDayCount}-business-days-from-today${
                    holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
                  }`,
                )
              }
            >
              <span>{relatedDayCount} business days</span>
              <strong>{formatPlainDate(date)}</strong>
              <small>{formatWeekday(date)}</small>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="secondary-button three-business-custom-button"
          onClick={() =>
            onNavigate(
              `/business-days-calculator${
                holidayCalendar === 'none' ? '' : `?calendar=${holidayCalendar}`
              }`,
            )
          }
        >
          Different date or number
        </button>
      </section>

      <section className="three-business-explainer" aria-label="About the calculation">
        <article>
          <h2>How this date is calculated</h2>
          <p>
            Monday through Friday count as business days. Saturdays and Sundays are skipped.
            By default, public holidays still count as weekdays. Choose a supported holiday calendar above to skip known holidays too. Calendar coverage varies by country, so verify local rules when a deadline matters.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Check the original terms or official calendar when a deadline matters."
      />

      <style>{`
        .three-business-days-page {
          min-height: 100vh;
        }

        .three-business-hero {
          width: min(100% - 32px, 1240px);
          min-height: 82vh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .three-business-topbar {
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .three-business-brand,
        .three-business-calculator-link,
        .three-business-related-card {
          appearance: none;
          border: 0;
          background: transparent;
          cursor: pointer;
          font: inherit;
        }

        .three-business-brand,
        .three-business-calculator-link {
          padding: 0;
          color: #667991;
        }

        .three-business-brand {
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .three-business-calculator-link {
          font-size: 0.8rem;
          font-weight: 700;
        }

        .three-business-answer {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 38px 16px 54px;
        }

        .three-business-question {
          margin: 0 0 12px;
          font-size: clamp(1.25rem, 2.2vw, 2rem);
          font-weight: 800;
          color: #425b79;
        }

        .three-business-date {
          margin: 0;
          max-width: 100%;
          font-size: clamp(4rem, 8.2vw, 7.6rem);
          font-weight: 900;
          line-height: 0.94;
          letter-spacing: -0.055em;
          color: #0c1931;
          white-space: nowrap;
        }

        .three-business-weekday {
          margin: 18px 0 0;
          font-size: clamp(1.45rem, 3vw, 2.6rem);
          color: #566a83;
        }

        .three-business-context {
          margin: 30px 0 0;
          font-size: 0.9rem;
          color: #64778e;
        }

        .three-business-explanation {
          max-width: 660px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .three-business-rule {
          margin: 7px 0 0;
          font-size: 0.76rem;
          color: #8190a2;
        }

        .three-business-more,
        .three-business-explainer {
          width: min(100% - 32px, 1040px);
          margin: 0 auto;
        }

        .three-business-more {
          padding: 46px 0 56px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .three-business-more h2,
        .three-business-explainer h2 {
          margin: 0 0 16px;
          font-size: 1.3rem;
        }

        .three-business-related-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .three-business-related-card {
          min-height: 98px;
          padding: 14px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 10px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: left;
        }

        .three-business-related-card:hover {
          border-color: rgba(19, 38, 70, 0.22);
        }

        .three-business-related-card span {
          font-size: 0.78rem;
          font-weight: 800;
          color: #647991;
        }

        .three-business-related-card strong {
          margin-top: 4px;
          font-size: 1.25rem;
          color: #10213f;
        }

        .three-business-related-card small {
          margin-top: 2px;
          color: #718197;
        }

        .three-business-custom-button {
          margin-top: 18px;
        }

        .three-business-explainer {
          padding: 26px 0 52px;
        }

        .three-business-explainer article {
          max-width: 760px;
        }

        .three-business-explainer p {
          margin: 0;
          line-height: 1.65;
          color: #5e7087;
        }

        @media (max-width: 760px) {
          .three-business-hero {
            width: min(100% - 24px, 1240px);
            min-height: 78vh;
          }

          .three-business-topbar {
            min-height: 52px;
          }

          .three-business-calculator-link {
            font-size: 0.72rem;
          }

          .three-business-answer {
            padding: 28px 0 38px;
          }

          .three-business-question {
            margin-bottom: 10px;
            font-size: 1.08rem;
          }

          .three-business-date {
            font-size: clamp(3.2rem, 15vw, 5rem);
            line-height: 0.98;
            white-space: normal;
            text-wrap: balance;
          }

          .three-business-weekday {
            margin-top: 12px;
            font-size: 1.55rem;
          }

          .three-business-context {
            margin-top: 24px;
            font-size: 0.8rem;
          }

          .three-business-rule {
            font-size: 0.7rem;
          }

          .three-business-more,
          .three-business-explainer {
            width: min(100% - 24px, 1040px);
          }

          .three-business-related-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .three-business-related-card {
            min-height: 62px;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "label date"
              "label weekday";
            align-items: center;
            padding: 9px 12px;
          }

          .three-business-related-card span {
            grid-area: label;
          }

          .three-business-related-card strong {
            grid-area: date;
            margin: 0;
            text-align: right;
            font-size: 1.1rem;
          }

          .three-business-related-card small {
            grid-area: weekday;
            margin: 0;
            text-align: right;
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
    if (message !== 'Copied.') {
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
                className="result-action-secondary"
                onClick={addToCalendar}
              >
                Add to calendar
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
                <button type="button" onClick={copyExactLink}>Copy link</button>
                <button type="button" onClick={shareAnswer}>Share</button>
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
              {isFavorite ? 'Favorited' : 'Favorite'}
            </button>
            <button type="button" onClick={copyAnswer}>Copy result</button>
            <button type="button" onClick={copyExactLink}>Copy link</button>
            <button type="button" onClick={shareAnswer}>Share</button>
            <button type="button" onClick={addToCalendar}>Add to calendar</button>
          </>
        )}

        {message && message !== 'Copied.' ? (
          <span aria-live="polite">{message}</span>
        ) : (
          <span className="sr-only" aria-live="polite">
            {message === 'Copied.' ? 'Result copied.' : ''}
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
  const [startDate, setStartDate] = useState(() => getInitialDateQueryParam('start', todayInputValue()))
  const [endDate, setEndDate] = useState(() =>
    getInitialDateQueryParam(
      'end',
      toDateKey(addCalendarDays(getTodayPlainDate(new Date()), 14)),
    ),
  )
  const [holidayCalendar, setHolidayCalendar] = useState<HolidayCalendarId>(
    getInitialHolidayCalendarQueryParam,
  )

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

  return (
    <main className="page-shell business-between-page">
      <section className="business-between-hero" aria-labelledby="business-between-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />

        <div className="business-between-answer">
          <p className="business-between-kicker">Business days between dates</p>

          <div className="business-between-controls-card">
            <div className="business-between-inputs">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value)
                    trackWhenIsDueEvent('date_changed', { context: 'business_days_between_start', value: event.target.value })
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
                    trackWhenIsDueEvent('date_changed', { context: 'business_days_between_end', value: event.target.value })
                  }}
                />
              </label>
            </div>

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
          </div>

          {businessDays !== null ? (
            <>
              <h1 id="business-between-title" className="business-between-number">{businessDays}</h1>
              <p className="business-between-label">
                {businessDays === 1 ? 'business day' : 'business days'}
              </p>
              <p className="business-between-rule">
                Start date excluded · End date included · Weekends skipped
              </p>
              <p className="business-between-note">
                {holidayCalendar === 'none'
                  ? 'Public holidays still count as weekdays.'
                  : `${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays are excluded.`}
              </p>
              {parsedStartDate && parsedEndDate ? (
                <CalculationReceipt
                  analyticsContext="business_days_between"
                  rows={[
                    { label: 'Start date', value: `${formatWeekday(parsedStartDate)}, ${formatPlainDate(parsedStartDate)}` },
                    { label: 'End date', value: `${formatWeekday(parsedEndDate)}, ${formatPlainDate(parsedEndDate)}` },
                    { label: 'Counting rule', value: 'Start excluded · End included' },
                    { label: 'Weekend rule', value: 'Saturday and Sunday skipped' },
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
                    { label: 'Result', value: `${businessDays} ${businessDays === 1 ? 'business day' : 'business days'}` },
                  ]}
                />
              ) : null}
            </>
          ) : (
            <h1 id="business-between-title" className="business-between-number business-between-error">
              Choose two valid dates
            </h1>
          )}
        </div>
      </section>

      <section className="business-between-explanation">
        <h2>How this count works</h2>
        <p>
          WhenIsDue counts weekdays after the earlier date through the later date. Saturdays and Sundays are skipped.
          Public holidays still count by default, or you can choose a supported holiday calendar above to exclude known holidays.
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .business-between-hero {
          width: min(100% - 32px, 1240px);
          min-height: 76vh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .business-between-answer {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 12px 42px;
        }

        .business-between-controls-card {
          width: min(100%, 620px);
          margin: 0 auto 22px;
          padding: 16px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 16px;
          background: #fff;
        }

        .business-between-kicker {
          margin: 0 0 18px;
          color: #526b87;
          font-size: clamp(1.25rem, 2.5vw, 2rem);
          font-weight: 900;
        }

        .business-between-inputs {
          display: flex;
          gap: 10px;
          margin-bottom: 26px;
        }

        .business-between-inputs label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: #75879b;
          font-size: 0.75rem;
          font-weight: 800;
          text-align: left;
        }

        .business-between-inputs input {
          min-height: 42px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.16);
          border-radius: 8px;
          background: #fff;
          color: #1a314c;
          font: inherit;
          font-size: 0.88rem;
        }

        .business-between-number {
          margin: 0;
          color: #0b1830;
          font-size: clamp(7rem, 18vw, 14rem);
          font-weight: 900;
          line-height: 0.78;
          letter-spacing: -0.06em;
        }

        .business-between-error {
          font-size: clamp(2.2rem, 6vw, 4.5rem);
          line-height: 1;
        }

        .business-between-label {
          margin: 24px 0 0;
          color: #536981;
          font-size: clamp(1.6rem, 3vw, 2.5rem);
        }

        .business-between-rule {
          margin: 16px 0 0;
          color: #60758e;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .business-between-note {
          margin: 7px 0 0;
          color: #8894a3;
          font-size: 0.75rem;
        }

        .business-between-explanation {
          width: min(100% - 32px, 860px);
          margin: 0 auto;
          padding: 36px 0 58px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .business-between-explanation h2 {
          margin: 0;
          color: #18304c;
          font-size: 1.25rem;
        }

        .business-between-explanation p {
          color: #60748a;
          line-height: 1.65;
        }

        @media (max-width: 760px) {
          .business-between-hero {
            width: min(100% - 24px, 1240px);
            min-height: 72vh;
          }

          .business-between-answer {
            justify-content: flex-start;
            padding: 22px 0 30px;
          }

          .business-between-kicker {
            margin-bottom: 14px;
            font-size: 1.35rem;
          }

          .business-between-controls-card {
            margin-bottom: 16px;
            padding: 13px;
          }

          .business-between-inputs {
            width: 100%;
            flex-direction: column;
            margin-bottom: 20px;
          }

          .business-between-inputs label {
            width: 100%;
          }

          .business-between-number {
            font-size: clamp(5.4rem, 29vw, 7.8rem);
          }

          .business-between-label {
            margin-top: 14px;
            font-size: 1.6rem;
          }

          .business-between-rule {
            margin-top: 11px;
            font-size: 0.94rem;
            line-height: 1.45;
          }

          .business-between-note {
            font-size: 0.9rem;
            line-height: 1.45;
          }

          .business-between-explanation {
            width: min(100% - 24px, 860px);
          }
        }
      `}</style>
    </main>
  )
}

function FreeTrialPage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(() => getInitialDateQueryParam('start', todayInputValue()))
  const [trialLength, setTrialLength] = useState(() =>
    getInitialPositiveIntegerQueryParam('days', '7', getAmountLimit('trial')),
  )
  const [title, setTitle] = useState(getDefaultTitle('trial'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedStartDate = parsePlainDate(startDate)
  const parsedTrialLength = parseInteger(trialLength)
  const validationMessage = getTrialValidationMessage(parsedStartDate, parsedTrialLength)
  const titleValidationMessage = getSaveTitleValidationMessage(title)
  const trialEndDate = parsedStartDate && parsedTrialLength !== null && !validationMessage
    ? addCalendarDays(parsedStartDate, parsedTrialLength)
    : null
  const cancelByDate = trialEndDate ? addCalendarDays(trialEndDate, -1) : null
  const calendarDaysFromStart = parsedStartDate && trialEndDate ? daysBetween(parsedStartDate, trialEndDate) : 0
  const canSave = Boolean(trialEndDate && parsedStartDate && !validationMessage && !titleValidationMessage)

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
    <main className="page-shell free-trial-page trial-editorial-page">
      <header className="trial-editorial-header" aria-label="WhenIsDue navigation">
        <a
          className="trial-editorial-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
          aria-label="WhenIsDue home"
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="trial-editorial-nav" aria-label="Main navigation">
          <a
            className="trial-editorial-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section className="trial-editorial-hero" aria-labelledby="free-trial-title">
        <div className="trial-editorial-image-wrap">
          <img
            className="trial-editorial-image"
            src="/homepage-editorial.webp"
            alt="Warm editorial still life with papers and small packages arranged in a quiet architectural setting"
          />

          <div className="trial-editorial-answer">
            <p className="trial-editorial-eyebrow">Free trial calculator</p>
            <h1 id="free-trial-title">When does my free trial end?</h1>

            {trialEndDate && cancelByDate && parsedTrialLength !== null ? (
              <>
                <div className="trial-editorial-primary-answer">
                  <span>{parsedTrialLength}-day trial</span>
                  <strong>{formatPlainDate(trialEndDate)}</strong>
                  <small>{formatWeekday(trialEndDate)}</small>
                </div>

                <div className="trial-editorial-reminder">
                  <span>Suggested reminder</span>
                  <b>{formatPlainDate(cancelByDate)}</b>
                </div>
              </>
            ) : (
              <p className="trial-editorial-error">{validationMessage ?? 'Enter a valid trial date.'}</p>
            )}
          </div>
        </div>
      </section>

      <section className="trial-editorial-workspace" aria-label="Free trial calculator">
        <div className="trial-editorial-heading">
          <p className="trial-section-eyebrow">Your calculation</p>
          <h2>Set the trial start date and length</h2>
          <p>The answer updates immediately.</p>
        </div>

        <div className="trial-editorial-calculation-grid">
          <form className="trial-editorial-form" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              <span>Trial start date</span>
              <input
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  trackWhenIsDueEvent('date_changed', { context: 'free_trial', value: event.target.value })
                }}
              />
            </label>

            <label className="field">
              <span>Trial length in days</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max={getAmountLimit('trial')}
                value={trialLength}
                onChange={(event) => {
                  setTrialLength(event.target.value)
                  trackWhenIsDueEvent('number_changed', { context: 'free_trial', value: event.target.value })
                }}
              />
            </label>

            <div className="trial-editorial-quick-picks" aria-label="Quick trial length values">
              {trialLengthQuickPicks.map((quickPick) => (
                <button
                  className={trialLength === String(quickPick) ? 'is-active' : ''}
                  key={quickPick}
                  type="button"
                  aria-pressed={trialLength === String(quickPick)}
                  onClick={() => {
                    setTrialLength(String(quickPick))
                    trackWhenIsDueEvent('quick_pick', { context: 'free_trial', value: quickPick })
                  }}
                >
                  {quickPick} days
                </button>
              ))}
            </div>

            {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
          </form>

          <section className="trial-editorial-result" aria-live="polite">
            <p className="trial-result-kicker">Trial ends</p>

            {trialEndDate && cancelByDate && parsedTrialLength !== null ? (
              <>
                <p className="trial-result-date">{formatPlainDate(trialEndDate)}</p>
                <p className="trial-result-weekday">{formatWeekday(trialEndDate)}</p>

                <div className="trial-result-summary">
                  <span>{parsedTrialLength}-day trial</span>
                  <small>{calendarDaysFromStart} calendar days from start date</small>
                </div>

                <div className="trial-reminder-card">
                  <small>Suggested reminder</small>
                  <strong>{formatPlainDate(cancelByDate)}</strong>
                </div>

                <p className="trial-result-note">
                  {formatFreeTrialExplanation(
                    parsedStartDate!,
                    parsedTrialLength!,
                    trialEndDate,
                  )}
                </p>

                <CalculationReceipt
                  analyticsContext="free_trial"
                  rows={[
                    { label: 'Trial starts', value: `${formatWeekday(parsedStartDate!)}, ${formatPlainDate(parsedStartDate!)}` },
                    { label: 'Trial length', value: `${parsedTrialLength} ${parsedTrialLength === 1 ? 'day' : 'days'}` },
                    { label: 'Counting rule', value: 'Full trial length added to the start date' },
                    { label: 'Trial ends', value: `${formatWeekday(trialEndDate)}, ${formatPlainDate(trialEndDate)}` },
                    { label: 'Suggested reminder', value: `${formatWeekday(cancelByDate)}, ${formatPlainDate(cancelByDate)}` },
                  ]}
                />

                <ResultActions
                  title="Free trial ends"
                  date={trialEndDate}
                  details={`Suggested reminder: ${formatPlainDate(cancelByDate)}`}
                />

                <details className="trial-save-details">
                  <summary>More options</summary>
                  <div className="business-save">
                    <label className="field title-field">
                      <span>Title</span>
                      <input
                        maxLength={titleMaxLength}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                      {titleValidationMessage ? <span className="field-error">{titleValidationMessage}</span> : null}
                    </label>
                    <button className="primary-button" type="button" disabled={!canSave} onClick={saveTrialDeadline}>
                      Save to My due dates
                    </button>
                    {storageMessage ? <p className="form-message">{storageMessage}</p> : null}
                  </div>
                </details>
              </>
            ) : (
              <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
            )}
          </section>
        </div>
      </section>

      <section className="trial-editorial-related" aria-label="Related trial and renewal tools">
        <div>
          <p className="trial-section-eyebrow">Next step</p>
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
            Subscription renewal calculator <span aria-hidden="true">→</span>
          </a>
          <a
            href="/return-window-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/return-window-calculator')
            }}
          >
            Return window calculator <span aria-hidden="true">→</span>
          </a>
        </nav>
      </section>

      <section className="trial-editorial-content" aria-label="Free trial help">
        <div className="trial-content-heading">
          <p className="trial-section-eyebrow">Trial timing rules</p>
          <h2>Start, trial, renewal</h2>
        </div>

        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the day your trial starts and the number of days in the trial. The calculator shows the trial end date and the suggested one-day-before reminder. Always check the company's official cancellation terms because some services renew earlier or use a specific billing time.
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
            Suppose a 14-day trial starts on May 1. Using this calculator's date-addition method, the trial end date is May 15 and the suggested reminder date is May 14. This treats the start date as day zero. A service may instead count the signup date as day one, so its displayed renewal date should take priority.
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
            <dd>This calculator adds the full trial length to the start date. Services may use a different counting convention, so check the renewal date displayed by the provider.</dd>
            <dt>Why is the suggested reminder one day earlier?</dt>
            <dd>It provides a simple planning buffer before the calculated end date. It is not a guarantee that every provider will accept cancellation until that date.</dd>
            <dt>Does uninstalling an app cancel a free trial?</dt>
            <dd>Usually, uninstalling an app and cancelling its subscription are separate actions. Use the provider, App Store, or Google Play subscription controls and confirm the cancellation.</dd>
            <dt>Can a trial renew at a specific time?</dt>
            <dd>Yes. Some services use a particular time or time zone. This calculator works with calendar dates only.</dd>
          </dl>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always confirm the renewal date, cancellation deadline, and time zone shown by the service."
      />

      <style>{`
        .trial-editorial-page {
          --trial-deep: #17385f;
          --trial-navy: #112f53;
          --trial-green: #2d7c67;
          --trial-blue: #eef5f8;
          --trial-warm: #f2ede4;
        }

        .trial-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .trial-editorial-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .trial-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .trial-editorial-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .trial-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .trial-editorial-hero,
        .trial-editorial-workspace,
        .trial-editorial-related,
        .trial-editorial-content {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .trial-editorial-image-wrap {
          position: relative;
          min-height: 470px;
          overflow: hidden;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 28px;
          background: #d8c8b3;
        }

        .trial-editorial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .trial-editorial-image-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(11,24,39,0.12), rgba(11,24,39,0.01) 58%, rgba(11,24,39,0));
          pointer-events: none;
        }

        .trial-editorial-answer {
          position: relative;
          z-index: 1;
          width: min(475px, calc(100% - 64px));
          margin: 32px;
          padding: 32px 34px 28px;
          border: 1px solid rgba(255,255,255,0.45);
          border-radius: 24px;
          background: rgba(250,247,239,0.94);
          box-shadow: 0 18px 52px rgba(11,24,39,0.15);
          backdrop-filter: blur(10px);
        }

        .trial-editorial-eyebrow,
        .trial-section-eyebrow {
          margin: 0;
          color: var(--trial-green);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .trial-editorial-answer h1 {
          margin: 10px 0 0;
          color: var(--trial-navy);
          font-size: clamp(2.65rem, 5vw, 4.5rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .trial-editorial-primary-answer {
          display: grid;
          gap: 4px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(17,47,83,0.11);
        }

        .trial-editorial-primary-answer span {
          color: #687e91;
          font-size: 0.95rem;
          font-weight: 850;
        }

        .trial-editorial-primary-answer strong {
          color: var(--trial-navy);
          font-size: clamp(2.15rem, 4vw, 3.4rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .trial-editorial-primary-answer small {
          color: #5e7489;
          font-size: 1rem;
          font-weight: 800;
        }

        .trial-editorial-reminder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 14px;
          background: rgba(238,245,248,0.92);
        }

        .trial-editorial-reminder span {
          color: #667e91;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .trial-editorial-reminder b {
          color: #24435f;
          font-size: 0.95rem;
        }

        .trial-editorial-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17,47,83,0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .trial-editorial-heading h2,
        .trial-editorial-related h2,
        .trial-content-heading h2 {
          margin: 6px 0 0;
          color: var(--trial-navy);
          font-size: clamp(2rem, 3.7vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .trial-editorial-heading > p:last-child {
          margin: 8px 0 0;
          color: #6b7f92;
        }

        .trial-editorial-calculation-grid {
          display: grid;
          grid-template-columns: minmax(290px, 0.72fr) minmax(0, 1.28fr);
          gap: 16px;
          margin-top: 22px;
        }

        .trial-editorial-form {
          display: grid;
          gap: 15px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17,47,83,0.1);
          border-radius: 18px;
          background: var(--trial-warm);
        }

        .trial-editorial-form .field {
          display: grid;
          gap: 7px;
        }

        .trial-editorial-form .field > span {
          color: #566f87;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .trial-editorial-form input {
          width: 100%;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17,47,83,0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .trial-editorial-quick-picks {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .trial-editorial-quick-picks button {
          min-height: 44px;
          border: 1px solid rgba(17,47,83,0.13);
          border-radius: 10px;
          background: rgba(255,255,255,0.78);
          color: #4f6780;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
        }

        .trial-editorial-quick-picks button.is-active {
          border-color: rgba(45,124,103,0.6);
          background: #e8f4ef;
          color: #1f6656;
          box-shadow: inset 0 0 0 1px rgba(45,124,103,0.18);
        }

        .trial-editorial-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--trial-navy);
          color: #f8f1e6;
        }

        .trial-result-kicker {
          margin: 0;
          color: #9fc6b4;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .trial-result-date {
          margin: 10px 0 0;
          color: #fff8ec;
          font-size: clamp(3.5rem, 7vw, 6.2rem);
          font-weight: 850;
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .trial-result-weekday {
          margin: 10px 0 0;
          color: #d5dfea;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .trial-result-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 16px;
        }

        .trial-result-summary span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223,189,122,0.55);
          border-radius: 999px;
          background: #fff7e8;
          color: #7b4f26;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .trial-result-summary small {
          color: #c8d4df;
          font-size: 0.88rem;
        }

        .trial-reminder-card {
          display: grid;
          gap: 3px;
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
        }

        .trial-reminder-card small {
          color: #9fc6b4;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .trial-reminder-card strong {
          color: #fff8ec;
          font-size: 1.15rem;
        }

        .trial-result-note {
          max-width: 720px;
          margin: 18px 0 0;
          color: #ced8e2;
          font-size: 0.95rem;
          line-height: 1.52;
        }

        .trial-editorial-result .calculation-receipt {
          margin-top: 18px;
        }

        .trial-editorial-result .result-actions {
          margin-top: 14px;
        }

        .trial-save-details {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.16);
          color: #e7edf3;
        }

        .trial-save-details summary {
          cursor: pointer;
          font-weight: 850;
        }

        .trial-editorial-related {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17,47,83,0.1);
          border-radius: 24px;
          background: var(--trial-blue);
        }

        .trial-editorial-related nav {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .trial-editorial-related a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid rgba(17,47,83,0.12);
          border-radius: 12px;
          background: rgba(255,255,255,0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .trial-editorial-related a span {
          color: var(--trial-green);
          font-size: 1.05rem;
        }

        .trial-editorial-content {
          margin-top: 38px;
        }

        .trial-content-heading {
          margin-bottom: 16px;
        }

        .trial-editorial-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .trial-content-heading {
          grid-column: 1 / -1;
        }

        .trial-editorial-content article {
          padding: 22px;
          border: 1px solid rgba(17,47,83,0.09);
          border-radius: 18px;
          background: rgba(255,255,255,0.72);
        }

        .trial-editorial-content article h2 {
          margin: 0;
          color: var(--trial-navy);
          font-size: 1.08rem;
        }

        .trial-editorial-content article:last-child {
          grid-column: 1 / -1;
        }

        .trial-editorial-content article dl {
          margin: 14px 0 0;
        }

        .trial-editorial-content article dt {
          margin: 16px 0 0;
          color: var(--trial-navy);
          font-weight: 850;
        }

        .trial-editorial-content article dd {
          margin: 4px 0 0;
        }

        .trial-editorial-content article p,
        .trial-editorial-content article li,
        .trial-editorial-content article dd {
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .trial-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .trial-editorial-brand img {
            width: 154px;
          }

          .trial-editorial-nav {
            gap: 12px;
          }

          .trial-editorial-nav a {
            font-size: 0.8rem;
          }

          .trial-editorial-home-link {
            display: none;
          }

          .trial-editorial-hero,
          .trial-editorial-workspace,
          .trial-editorial-related,
          .trial-editorial-content {
            width: min(100% - 24px, 680px);
          }

          .trial-editorial-image-wrap {
            min-height: 465px;
            border-radius: 24px;
          }

          .trial-editorial-image {
            object-position: 58% center;
          }

          .trial-editorial-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
            margin: 0;
            padding: 18px;
            border-radius: 18px;
          }

          .trial-editorial-answer h1 {
            font-size: clamp(2.05rem, 9.3vw, 2.85rem);
          }

          .trial-editorial-primary-answer {
            margin-top: 14px;
            padding-top: 12px;
          }

          .trial-editorial-primary-answer strong {
            font-size: clamp(1.95rem, 8.8vw, 2.6rem);
          }

          .trial-editorial-reminder {
            margin-top: 13px;
            padding: 11px 12px;
          }

          .trial-editorial-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .trial-editorial-heading h2,
          .trial-editorial-related h2,
          .trial-content-heading h2 {
            font-size: clamp(1.9rem, 8.5vw, 2.55rem);
          }

          .trial-editorial-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .trial-editorial-form {
            padding: 18px;
          }

          .trial-editorial-result {
            padding: 22px 18px 18px;
          }

          .trial-result-date {
            font-size: clamp(2.9rem, 11.5vw, 4.2rem);
          }

          .trial-result-note {
            font-size: 0.92rem;
            line-height: 1.48;
          }

          .trial-editorial-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .trial-editorial-result .result-actions button,
          .trial-editorial-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .trial-editorial-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .trial-editorial-related {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .trial-editorial-related nav {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .trial-editorial-content {
            display: block;
            margin-top: 28px;
          }

          .trial-content-heading {
            margin-bottom: 8px;
          }

          .trial-editorial-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17,47,83,0.1);
            border-radius: 0;
            background: transparent;
          }

          .trial-editorial-content article h2 {
            font-size: 1.08rem;
            line-height: 1.3;
          }

          .trial-editorial-content article p,
          .trial-editorial-content article li,
          .trial-editorial-content article dd {
            font-size: 0.94rem;
            line-height: 1.52;
          }
        }

        @media (max-width: 430px) {
          .trial-editorial-brand img {
            width: 142px;
          }

          .trial-editorial-nav {
            gap: 10px;
          }

          .trial-editorial-nav a {
            font-size: 0.76rem;
          }

          .trial-editorial-image-wrap {
            min-height: 440px;
          }

          .trial-editorial-answer {
            left: 14px;
            right: 14px;
            bottom: 14px;
            padding: 16px;
          }

          .trial-editorial-eyebrow {
            font-size: 0.7rem;
          }

          .trial-editorial-reminder span {
            font-size: 0.68rem;
          }

          .trial-editorial-reminder b {
            font-size: 0.84rem;
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
      <header
        className="return-answer-header"
        aria-label="WhenIsDue navigation"
      >
        <a
          className="return-answer-brand"
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
  const dayWord = windowDays === 1 ? 'day' : 'days'

  return `A ${windowDays}-${dayWord} return window starting on ${formatPlainDate(startDate)} ends on ${formatPlainDate(deadline)}. This calculator counts calendar days and does not automatically extend the deadline for weekends or public holidays unless the retailer's policy says otherwise.`
}

function formatFreeTrialExplanation(
  startDate: PlainDate,
  trialDays: number,
  endDate: PlainDate,
) {
  const dayWord = trialDays === 1 ? 'day' : 'days'

  return `A ${trialDays}-${dayWord} trial starting on ${formatPlainDate(startDate)} ends on ${formatPlainDate(endDate)} using calendar-day counting. The actual cancellation cutoff can depend on the service's billing terms, time zone, and whether the start date counts as day one.`
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

  return (
    <main className="page-shell two-ten-net-thirty-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="two-ten-net-thirty-shell">
        <header className="two-ten-net-thirty-intro">
          <p className="friendly-eyebrow">Invoice payment terms</p>
          <h1>2/10 Net 30 calculator</h1>
          <p>
            Enter the invoice date to see the early-payment discount deadline
            and the final Net 30 due date.
          </p>
        </header>

        <section
          className="two-ten-net-thirty-workspace"
          aria-label="2/10 Net 30 calculator"
        >
          <form
            className="two-ten-net-thirty-form"
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

            <div className="two-ten-net-thirty-definition">
              <strong>2/10 Net 30 means:</strong>
              <span>
                2% discount if payment is made within 10 calendar days;
                otherwise the full invoice amount is due in 30 calendar days.
              </span>
            </div>
          </form>

          <section className="two-ten-net-thirty-result" aria-live="polite">
            {parsedInvoiceDate && discountDeadline && finalDueDate ? (
              <>
                <span>Payment deadlines</span>

                <div className="two-ten-net-thirty-result-grid">
                  <div className="two-ten-net-thirty-discount">
                    <small>Pay by this date for 2% discount</small>
                    <strong>{formatPlainDate(discountDeadline)}</strong>
                    <b>{formatWeekday(discountDeadline)}</b>
                    <p>10 calendar days after the invoice date.</p>
                  </div>

                  <div>
                    <small>Full payment due</small>
                    <strong>{formatPlainDate(finalDueDate)}</strong>
                    <b>{formatWeekday(finalDueDate)}</b>
                    <p>30 calendar days after the invoice date.</p>
                  </div>
                </div>

                <p className="two-ten-net-thirty-note">
                  The invoice date is treated as day zero. Weekends and public
                  holidays are not automatically moved. The written invoice or
                  contract controls if it uses a different rule.
                </p>

                <CalculationReceipt
                  analyticsContext="two_ten_net_30"
                  rows={[
                    {
                      label: 'Invoice date',
                      value: `${formatWeekday(
                        parsedInvoiceDate,
                      )}, ${formatPlainDate(parsedInvoiceDate)}`,
                    },
                    {
                      label: 'Early-payment term',
                      value: '2% discount within 10 calendar days',
                    },
                    {
                      label: 'Discount deadline',
                      value: `${formatWeekday(
                        discountDeadline,
                      )}, ${formatPlainDate(discountDeadline)}`,
                    },
                    {
                      label: 'Final payment term',
                      value: 'Net 30 — 30 calendar days',
                    },
                    {
                      label: 'Final due date',
                      value: `${formatWeekday(
                        finalDueDate,
                      )}, ${formatPlainDate(finalDueDate)}`,
                    },
                  ]}
                />

                <ResultActions
                  title="2/10 Net 30 final due date"
                  date={finalDueDate}
                  details={`2% discount deadline: ${formatPlainDate(
                    discountDeadline,
                  )}`}
                />
              </>
            ) : (
              <p className="two-ten-net-thirty-error">
                Enter a valid invoice date.
              </p>
            )}
          </section>
        </section>

        <section className="two-ten-net-thirty-content">
          <article>
            <h2>What does 2/10 Net 30 mean?</h2>
            <p>
              “2/10” is the early-payment discount: the buyer may take a 2%
              discount when paying within 10 days. “Net 30” is the final
              payment term: if the discount is not taken, the full invoice is
              due 30 days after the invoice date.
            </p>
          </article>

          <article>
            <h2>Example</h2>
            <p>
              For an invoice dated August 10, the discount deadline is August
              20 and the Net 30 due date is September 9 when both periods are
              counted as calendar days from the invoice date.
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
              payment rules. Those can depend on the contract and applicable
              law.
            </p>
          </article>
        </section>

        <section
          className="two-ten-net-thirty-related"
          aria-label="Related invoice calculators"
        >
          <div>
            <span>Related invoice tools</span>
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
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The invoice or contract controls the actual payment terms and any weekend, holiday, late-fee, or interest rules."
      />

      <style>{`
        .two-ten-net-thirty-page {
          min-height: 100vh;
          background: #fffaf2;
        }

        .two-ten-net-thirty-shell {
          width: min(100% - 32px, 980px);
          margin: 0 auto;
          padding: 34px 0 64px;
        }

        .two-ten-net-thirty-intro {
          text-align: center;
        }

        .two-ten-net-thirty-intro h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 6vw, 4.4rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .two-ten-net-thirty-intro > p:last-child {
          max-width: 680px;
          margin: 12px auto 0;
          color: #61788f;
          font-size: 1rem;
          line-height: 1.55;
        }

        .two-ten-net-thirty-workspace {
          display: grid;
          grid-template-columns: minmax(280px, 0.8fr) minmax(420px, 1.2fr);
          gap: 14px;
          margin-top: 24px;
        }

        .two-ten-net-thirty-form,
        .two-ten-net-thirty-result {
          min-width: 0;
          padding: 20px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 18px;
          background: #fff;
        }

        .two-ten-net-thirty-form {
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .two-ten-net-thirty-form label {
          display: grid;
          gap: 6px;
        }

        .two-ten-net-thirty-form label > span {
          color: #526a82;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .two-ten-net-thirty-form input {
          min-height: 48px;
          width: 100%;
          padding: 9px 11px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 10px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .two-ten-net-thirty-definition {
          display: grid;
          gap: 5px;
          padding: 14px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 12px;
          background: #f8fafb;
        }

        .two-ten-net-thirty-definition strong {
          color: #2d4965;
          font-size: 0.94rem;
        }

        .two-ten-net-thirty-definition span {
          color: #667c92;
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .two-ten-net-thirty-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .two-ten-net-thirty-result > span {
          color: #71869b;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .two-ten-net-thirty-result-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .two-ten-net-thirty-result-grid > div {
          padding: 17px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 13px;
          background: #fffdf9;
        }

        .two-ten-net-thirty-result-grid .two-ten-net-thirty-discount {
          background: #f7fcf7;
          border-color: rgba(62, 126, 82, 0.14);
        }

        .two-ten-net-thirty-result-grid small {
          display: block;
          color: #72869a;
          font-size: 0.78rem;
          font-weight: 900;
          line-height: 1.35;
          letter-spacing: 0.035em;
          text-transform: uppercase;
        }

        .two-ten-net-thirty-result-grid strong {
          display: block;
          margin-top: 7px;
          color: #10213f;
          font-size: clamp(1.7rem, 3.4vw, 2.55rem);
          line-height: 1.05;
        }

        .two-ten-net-thirty-result-grid b {
          display: block;
          margin-top: 5px;
          color: #667c92;
          font-size: 0.92rem;
        }

        .two-ten-net-thirty-result-grid p {
          margin: 9px 0 0;
          color: #667c92;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .two-ten-net-thirty-note {
          max-width: 700px;
          margin: 14px auto 0;
          color: #586f86;
          font-size: 0.95rem;
          line-height: 1.55;
        }

        .two-ten-net-thirty-error {
          margin: auto;
          color: #73869a;
        }

        .two-ten-net-thirty-content {
          display: grid;
          gap: 12px;
          margin-top: 22px;
        }

        .two-ten-net-thirty-content article {
          padding: 18px;
          border: 1px solid rgba(19, 38, 70, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
        }

        .two-ten-net-thirty-content h2 {
          margin: 0;
          color: #29435e;
          font-size: 1.12rem;
        }

        .two-ten-net-thirty-content p {
          margin: 8px 0 0;
          color: #5f748a;
          font-size: 0.97rem;
          line-height: 1.6;
        }

        .two-ten-net-thirty-related {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .two-ten-net-thirty-related > div > span {
          color: #7a8da1;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .two-ten-net-thirty-related h2 {
          margin: 5px 0 0;
          color: #29435e;
          font-size: 1.2rem;
        }

        .two-ten-net-thirty-related nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .two-ten-net-thirty-related a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.86rem;
          font-weight: 850;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .two-ten-net-thirty-shell {
            width: min(100% - 20px, 980px);
            padding-top: 24px;
          }

          .two-ten-net-thirty-workspace,
          .two-ten-net-thirty-result-grid {
            grid-template-columns: 1fr;
          }

          .two-ten-net-thirty-form,
          .two-ten-net-thirty-result {
            padding: 16px;
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
      <header className="invoice-answer-header" aria-label="WhenIsDue">
        <a
          className="invoice-answer-brand"
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

      <section className="invoice-answer-hero" aria-labelledby="invoice-due-date-title" aria-live="polite">
        <p className="invoice-answer-eyebrow">Invoice due date</p>
        <h1 id="invoice-due-date-title">Your invoice is due</h1>

        {invoiceDueDate && parsedInvoiceDate ? (
          <>
            <strong className="invoice-answer-date" aria-label={`${formatWeekday(invoiceDueDate)}, ${formatPlainDate(invoiceDueDate)}`}>
              <span className="invoice-answer-weekday">{formatWeekday(invoiceDueDate)},</span>
              <span className="invoice-answer-month">
                {new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(invoiceDueDate.year, invoiceDueDate.month - 1, invoiceDueDate.day)))}
              </span>
              <span className="invoice-answer-day">{invoiceDueDate.day}</span>
              <span className="invoice-answer-year">{invoiceDueDate.year}</span>
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

            <label className="field value-field">
              <span>Payment terms</span>
              <select
                value={invoiceTerm}
                onChange={(event) => {
                  const nextTerm = event.target.value as InvoiceTerm
                  setInvoiceTerm(nextTerm)
                  trackWhenIsDueEvent('term_changed', { context: 'invoice_due_date', value: nextTerm })
                }}
              >
                {invoiceTerms.map((term) => (
                  <option value={term} key={term}>
                    {invoiceTermLabels[term]}
                  </option>
                ))}
              </select>
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
          --invoice-paper: #f4ecdf;
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
          padding: clamp(42px, 7vw, 76px) 0 30px;
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
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: baseline;
          gap: 0 0.18em;
          max-width: 100%;
          margin: 25px auto 0;
          color: var(--invoice-ink);
          font-size: clamp(3rem, 7.4vw, 6.7rem);
          font-weight: 900;
          line-height: 0.93;
          letter-spacing: -0.06em;
          text-wrap: balance;
        }

        .invoice-answer-weekday {
          color: #315b75;
          font-size: 0.54em;
          font-weight: 850;
          letter-spacing: -0.035em;
        }

        .invoice-answer-month,
        .invoice-answer-day,
        .invoice-answer-year {
          display: inline;
        }

        .invoice-answer-year::before {
          content: ', ';
        }

        .invoice-answer-context,
        .invoice-answer-error {
          margin: 18px 0 0;
          color: var(--invoice-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .invoice-answer-error {
          color: #7b4a28;
        }

        .invoice-answer-controls {
          padding: 18px;
          border: 1px solid rgba(17, 44, 77, 0.1);
          border-radius: 18px;
          background: var(--invoice-paper);
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
            padding: 30px 0 20px;
            text-align: left;
          }

          .invoice-answer-hero h1 {
            font-size: clamp(2.2rem, 10vw, 3.2rem);
          }

          .invoice-answer-date {
            display: grid;
            justify-content: start;
            gap: 0;
            margin-top: 20px;
            font-size: clamp(3.1rem, 15vw, 5rem);
            line-height: 0.88;
            text-align: left;
          }

          .invoice-answer-weekday {
            margin-bottom: 9px;
            font-size: 0.42em;
          }

          .invoice-answer-month,
          .invoice-answer-day,
          .invoice-answer-year {
            display: block;
          }

          .invoice-answer-year::before {
            content: '';
          }

          .invoice-answer-context {
            margin-top: 16px;
            font-size: 0.9rem;
          }

          .invoice-answer-controls {
            padding: 14px;
            border-radius: 14px;
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
        <header className="net-term-header">
          <a
            className="net-term-brand"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            WhenIsDue
          </a>
          <a
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            Invoice calculator
          </a>
        </header>

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

    saveWorkdayPreferences({
      start: workdayStart,
      end: workdayEnd,
    })
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
    <main className="page-shell sla-editorial-page">
      <header className="sla-editorial-header" aria-label="WhenIsDue navigation">
        <a
          className="sla-editorial-brand"
          href="/"
          aria-label="WhenIsDue home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav className="sla-editorial-nav" aria-label="Main navigation">
          <a
            className="sla-editorial-home-link"
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
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
        </nav>
      </header>

      <section className="sla-editorial-hero" aria-labelledby="sla-editorial-title">
        <div className="sla-editorial-image-wrap">
          <img
            className="sla-editorial-image"
            src="/business-hours-sla-background.webp"
            alt=""
          />

          <div className="sla-editorial-answer">
            <p className="sla-editorial-eyebrow">
              Business hours / SLA calculator
            </p>
            <h1 id="sla-editorial-title">When is this SLA due?</h1>

            {result && parsedStartDate && parsedHours !== null ? (
              <>
                <div className="sla-editorial-primary-answer">
                  <span>
                    {parsedHours} business {parsedHours === 1 ? 'hour' : 'hours'}
                  </span>
                  <strong>{formatPlainDate(result.date)}</strong>
                  <small>{formatWeekday(result.date)}</small>
                </div>

                <div className="sla-editorial-time-row">
                  <span>Deadline time</span>
                  <b>{formatTime12Hour(result.time)}</b>
                </div>
              </>
            ) : (
              <p className="sla-editorial-error">
                {validationMessage ?? 'Enter valid details to calculate the deadline.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className="sla-editorial-workspace"
        aria-label="Business hours deadline calculator"
      >
        <div className="sla-editorial-heading">
          <p className="sla-section-eyebrow">Your calculation</p>
          <h2>Set the start time and working hours</h2>
          <p>The deadline updates immediately.</p>
        </div>

        <div className="sla-editorial-calculation-grid">
          <form
            className="sla-editorial-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="sla-editorial-start-grid">
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
            </div>

            <label>
              <span>Business hours to add</span>
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
              className="sla-editorial-quick-picks"
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
              <p className="sla-editorial-error" role="alert">
                {validationMessage}
              </p>
            ) : null}

            <p className="sla-editorial-default-note">
              Using {formatTime12Hour(workdayStart)}–{formatTime12Hour(workdayEnd)}{' '}
              and {getHolidayCalendarOption(holidayCalendar).shortLabel}.
            </p>

            <details className="sla-editorial-advanced">
              <summary>Workday and holiday settings</summary>

              <div className="sla-editorial-advanced-body">
                <div className="sla-editorial-day">
                  <span>Working day</span>
                  <div>
                    <label>
                      <span>Starts</span>
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
                      <span>Ends</span>
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
                </div>

                <div
                  className="sla-editorial-workday-presets"
                  aria-label="Common workday presets"
                >
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

                <div className="sla-editorial-preference-actions">
                  <button type="button" onClick={saveCurrentWorkday}>
                    Remember this workday
                  </button>
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={resetSavedWorkday}
                  >
                    Reset
                  </button>
                  {workdayPreferenceMessage ? (
                    <span aria-live="polite">{workdayPreferenceMessage}</span>
                  ) : null}
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
              </div>
            </details>
          </form>

          <section className="sla-editorial-result" aria-live="polite">
            {result && parsedStartDate && parsedHours !== null ? (
              <>
                <p className="sla-result-kicker">Deadline</p>
                <p className="sla-result-date">{formatPlainDate(result.date)}</p>
                <p className="sla-result-weekday">
                  {formatWeekday(result.date)}
                </p>

                <div className="sla-result-time-card">
                  <small>Deadline time</small>
                  <strong>{formatTime12Hour(result.time)}</strong>
                </div>

                <div className="sla-result-summary">
                  <span>
                    {parsedHours} business {parsedHours === 1 ? 'hour' : 'hours'}
                  </span>
                  <small>
                    {formatTime12Hour(workdayStart)}–
                    {formatTime12Hour(workdayEnd)} workday
                  </small>
                </div>

                <p className="sla-result-note">
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
                            value: formatSkippedHolidaySummary(
                              result.skippedHolidays,
                            ),
                          },
                        ]
                      : []),
                    {
                      label: 'Deadline',
                      value: `${formatPlainDate(result.date)} · ${formatTime12Hour(result.time)}`,
                    },
                  ]}
                />

                <ResultActions
                  title={`${parsedHours}-business-hour deadline`}
                  date={result.date}
                  time={result.time}
                  details={`${formatTime12Hour(result.time)} · ${formatTime12Hour(workdayStart)}–${formatTime12Hour(workdayEnd)} workday · ${getHolidayCalendarOption(holidayCalendar).shortLabel}`}
                />
              </>
            ) : (
              <p className="sla-editorial-empty">
                Enter valid details to calculate the deadline.
              </p>
            )}
          </section>
        </div>
      </section>

      <section
        className="sla-editorial-related"
        aria-label="Related business timing tools"
      >
        <div>
          <p className="sla-section-eyebrow">Related timing tools</p>
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
            Business days calculator <span aria-hidden="true">→</span>
          </a>

          <a
            href="/deadline-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/deadline-calculator')
            }}
          >
            Deadline calculator <span aria-hidden="true">→</span>
          </a>

          <a
            href="/notice-period-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/notice-period-calculator')
            }}
          >
            Notice period calculator <span aria-hidden="true">→</span>
          </a>
        </nav>
      </section>

      <section className="sla-editorial-content" aria-label="Business-hour rules">
        <div className="sla-content-heading">
          <p className="sla-section-eyebrow">Business-hour rules</p>
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
        .sla-editorial-page {
          --sla-navy: #112f53;
          --sla-green: #2d7c67;
          --sla-blue: #eef5f8;
          --sla-warm: #f2ede4;
        }

        .sla-editorial-header {
          width: min(100% - 32px, 1130px);
          min-height: 70px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(17, 47, 83, 0.12);
        }

        .sla-editorial-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .sla-editorial-brand img {
          display: block;
          width: 176px;
          height: auto;
        }

        .sla-editorial-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .sla-editorial-nav a {
          color: #5a728d;
          font-size: 0.9rem;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .sla-editorial-hero,
        .sla-editorial-workspace,
        .sla-editorial-related,
        .sla-editorial-content {
          width: min(100% - 32px, 1130px);
          margin-left: auto;
          margin-right: auto;
        }

        .sla-editorial-image-wrap {
          position: relative;
          min-height: 470px;
          overflow: hidden;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 28px;
          background: #c9b393;
        }

        .sla-editorial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .sla-editorial-answer {
          position: relative;
          z-index: 1;
          width: min(500px, calc(100% - 64px));
          margin: 32px;
          padding: 32px 34px 28px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 24px;
          background: rgba(250, 247, 239, 0.94);
          box-shadow: 0 18px 52px rgba(11, 24, 39, 0.15);
          backdrop-filter: blur(10px);
        }

        .sla-editorial-eyebrow,
        .sla-section-eyebrow {
          margin: 0;
          color: var(--sla-green);
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .sla-editorial-answer h1 {
          margin: 10px 0 0;
          color: var(--sla-navy);
          font-size: clamp(2.65rem, 5vw, 4.5rem);
          line-height: 0.97;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .sla-editorial-primary-answer {
          display: grid;
          gap: 4px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(17, 47, 83, 0.11);
        }

        .sla-editorial-primary-answer span {
          color: #687e91;
          font-size: 0.95rem;
          font-weight: 850;
        }

        .sla-editorial-primary-answer strong {
          color: var(--sla-navy);
          font-size: clamp(2.1rem, 4vw, 3.35rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .sla-editorial-primary-answer small {
          color: #5e7489;
          font-size: 1rem;
          font-weight: 800;
        }

        .sla-editorial-time-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 14px;
          background: rgba(238, 245, 248, 0.92);
        }

        .sla-editorial-time-row span {
          color: #667e91;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sla-editorial-time-row b {
          color: #24435f;
          font-size: 1.05rem;
        }

        .sla-editorial-workspace {
          margin-top: 22px;
          padding: 30px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 26px;
          background: #fffdf9;
        }

        .sla-editorial-heading h2,
        .sla-editorial-related h2,
        .sla-content-heading h2 {
          margin: 6px 0 0;
          color: var(--sla-navy);
          font-size: clamp(2rem, 3.7vw, 3.15rem);
          line-height: 1;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .sla-editorial-heading > p:last-child {
          margin: 8px 0 0;
          color: #6b7f92;
        }

        .sla-editorial-calculation-grid {
          display: grid;
          grid-template-columns: minmax(310px, 0.74fr) minmax(0, 1.26fr);
          gap: 16px;
          margin-top: 22px;
        }

        .sla-editorial-form {
          display: grid;
          gap: 14px;
          align-content: start;
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 18px;
          background: var(--sla-warm);
        }

        .sla-editorial-form label,
        .sla-editorial-day {
          display: grid;
          gap: 7px;
        }

        .sla-editorial-form label > span,
        .sla-editorial-day > span,
        .sla-editorial-day label > span {
          color: #566f87;
          font-size: 0.88rem;
          font-weight: 900;
        }

        .sla-editorial-form input {
          width: 100%;
          min-width: 0;
          min-height: 50px;
          padding: 10px 12px;
          border: 1px solid rgba(17, 47, 83, 0.16);
          border-radius: 11px;
          background: #fff;
          color: #17304d;
          font: inherit;
          font-size: 1rem;
        }

        .sla-editorial-start-grid,
        .sla-editorial-day > div {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .sla-editorial-quick-picks {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .sla-editorial-quick-picks button,
        .sla-editorial-workday-presets button {
          min-height: 42px;
          padding: 8px 9px;
          border: 1px solid rgba(17, 47, 83, 0.13);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.8);
          color: #4f6780;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .sla-editorial-quick-picks button.is-active,
        .sla-editorial-workday-presets button.is-active {
          border-color: rgba(45, 124, 103, 0.6);
          background: #e8f4ef;
          color: #1f6656;
          box-shadow: inset 0 0 0 1px rgba(45, 124, 103, 0.18);
        }

        .sla-editorial-default-note {
          margin: -2px 0 0;
          color: #6d8196;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .sla-editorial-advanced {
          border-top: 1px solid rgba(17, 47, 83, 0.1);
          padding-top: 6px;
        }

        .sla-editorial-advanced summary {
          min-height: 42px;
          display: flex;
          align-items: center;
          color: #526a82;
          font-size: 0.88rem;
          font-weight: 850;
          cursor: pointer;
        }

        .sla-editorial-advanced-body {
          display: grid;
          gap: 12px;
          padding-top: 8px;
        }

        .sla-editorial-workday-presets {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .sla-editorial-preference-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
        }

        .sla-editorial-preference-actions button {
          min-height: 40px;
          padding: 7px 10px;
          border: 1px solid rgba(17, 47, 83, 0.16);
          border-radius: 9px;
          background: #fff;
          color: #294766;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 850;
          cursor: pointer;
        }

        .sla-editorial-preference-actions button.is-secondary {
          color: #718398;
        }

        .sla-editorial-preference-actions span {
          color: #61778d;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .sla-editorial-error {
          margin: 0;
          color: #934a42;
          font-size: 0.82rem;
          font-weight: 750;
          line-height: 1.4;
        }

        .sla-editorial-result {
          min-width: 0;
          padding: 30px 34px;
          border-radius: 20px;
          background: var(--sla-navy);
          color: #f8f1e6;
        }

        .sla-result-kicker {
          margin: 0;
          color: #9fc6b4;
          font-size: 0.76rem;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .sla-result-date {
          margin: 10px 0 0;
          color: #fff8ec;
          font-size: clamp(3.5rem, 7vw, 6.2rem);
          font-weight: 850;
          line-height: 0.92;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .sla-result-weekday {
          margin: 10px 0 0;
          color: #d5dfea;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .sla-result-time-card {
          display: grid;
          gap: 3px;
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
        }

        .sla-result-time-card small {
          color: #9fc6b4;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sla-result-time-card strong {
          color: #fff8ec;
          font-size: clamp(2rem, 4.5vw, 3rem);
          line-height: 1;
          letter-spacing: -0.035em;
        }

        .sla-result-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-top: 18px;
        }

        .sla-result-summary span {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 10px;
          border: 1px solid rgba(223, 189, 122, 0.55);
          border-radius: 999px;
          background: #fff7e8;
          color: #7b4f26;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .sla-result-summary small,
        .sla-result-note {
          color: #c8d4df;
        }

        .sla-result-note {
          max-width: 720px;
          margin: 18px 0 0;
          font-size: 0.95rem;
          line-height: 1.52;
        }

        .sla-editorial-result .calculation-receipt {
          margin-top: 18px;
        }

        .sla-editorial-result .result-actions {
          margin-top: 14px;
        }

        .sla-editorial-empty {
          margin: 0;
          color: #c8d4df;
        }

        .sla-editorial-related {
          margin-top: 22px;
          padding: 24px 28px;
          border: 1px solid rgba(17, 47, 83, 0.1);
          border-radius: 24px;
          background: var(--sla-blue);
        }

        .sla-editorial-related nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .sla-editorial-related a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid rgba(17, 47, 83, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          color: #24425e;
          font-size: 0.88rem;
          font-weight: 900;
          text-decoration: none;
        }

        .sla-editorial-related a span {
          color: var(--sla-green);
          font-size: 1.05rem;
        }

        .sla-editorial-content {
          margin-top: 38px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .sla-content-heading {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }

        .sla-editorial-content article {
          padding: 22px;
          border: 1px solid rgba(17, 47, 83, 0.09);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
        }

        .sla-editorial-content article:last-child {
          grid-column: 1 / -1;
        }

        .sla-editorial-content article h2 {
          margin: 0;
          color: var(--sla-navy);
          font-size: 1.08rem;
        }

        .sla-editorial-content article p {
          margin: 8px 0 0;
          color: #65798d;
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .sla-editorial-header {
            width: min(100% - 24px, 680px);
            min-height: 58px;
            margin-bottom: 12px;
            gap: 12px;
          }

          .sla-editorial-brand img {
            width: 154px;
          }

          .sla-editorial-nav {
            gap: 12px;
          }

          .sla-editorial-nav a {
            font-size: 0.8rem;
          }

          .sla-editorial-home-link {
            display: none;
          }

          .sla-editorial-hero,
          .sla-editorial-workspace,
          .sla-editorial-related,
          .sla-editorial-content {
            width: min(100% - 24px, 680px);
          }

          .sla-editorial-image-wrap {
            min-height: 500px;
            border-radius: 24px;
          }

          .sla-editorial-image {
            object-position: 65% center;
          }

          .sla-editorial-answer {
            position: absolute;
            left: 16px;
            right: 16px;
            top: 16px;
            width: auto;
            margin: 0;
            padding: 18px;
            border-radius: 18px;
          }

          .sla-editorial-answer h1 {
            font-size: clamp(2.05rem, 9.3vw, 2.85rem);
          }

          .sla-editorial-primary-answer {
            margin-top: 14px;
            padding-top: 12px;
          }

          .sla-editorial-primary-answer strong {
            font-size: clamp(1.95rem, 8.8vw, 2.6rem);
          }

          .sla-editorial-time-row {
            margin-top: 13px;
            padding: 11px 12px;
          }

          .sla-editorial-workspace {
            margin-top: 14px;
            padding: 22px 18px;
            border-radius: 22px;
          }

          .sla-editorial-heading h2,
          .sla-editorial-related h2,
          .sla-content-heading h2 {
            font-size: clamp(1.9rem, 8.5vw, 2.55rem);
          }

          .sla-editorial-calculation-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .sla-editorial-form {
            padding: 18px;
          }

          .sla-editorial-start-grid {
            grid-template-columns: 1fr 1fr;
          }

          .sla-editorial-quick-picks {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sla-editorial-result {
            padding: 22px 18px 18px;
          }

          .sla-result-date {
            font-size: clamp(2.9rem, 11.5vw, 4.2rem);
          }

          .sla-result-note {
            font-size: 0.92rem;
            line-height: 1.48;
          }

          .sla-editorial-result .result-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .sla-editorial-result .result-actions button,
          .sla-editorial-result .result-actions a {
            width: 100%;
            min-height: 46px;
            padding: 9px 10px;
            font-size: 0.82rem;
          }

          .sla-editorial-result .result-actions > :last-child {
            grid-column: 1 / -1;
          }

          .sla-editorial-related {
            margin-top: 14px;
            padding: 20px 18px;
            border-radius: 22px;
          }

          .sla-editorial-related nav {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .sla-editorial-content {
            display: block;
            margin-top: 28px;
          }

          .sla-content-heading {
            margin-bottom: 8px;
          }

          .sla-editorial-content article {
            padding: 20px 2px;
            border: 0;
            border-top: 1px solid rgba(17, 47, 83, 0.1);
            border-radius: 0;
            background: transparent;
          }

          .sla-editorial-content article h2 {
            font-size: 1.08rem;
            line-height: 1.3;
          }

          .sla-editorial-content article p {
            font-size: 0.94rem;
            line-height: 1.52;
          }

          /* Mobile compactness pass: keep tap targets comfortable without stretched cards. */
          .sla-editorial-workspace {
            padding: 20px 16px;
          }

          .sla-editorial-form {
            gap: 12px;
            padding: 16px;
          }

          .sla-editorial-form input {
            min-height: 46px;
            padding: 8px 11px;
          }

          .sla-editorial-quick-picks {
            gap: 6px;
          }

          .sla-editorial-quick-picks button,
          .sla-editorial-workday-presets button {
            min-height: 38px;
            padding: 6px 8px;
          }

          .sla-editorial-default-note {
            margin-top: -3px;
            font-size: 0.8rem;
            line-height: 1.35;
          }

          .sla-editorial-advanced summary {
            min-height: 40px;
          }

          .sla-editorial-preference-actions button {
            min-height: 38px;
            padding: 6px 9px;
          }

          .sla-editorial-result {
            padding: 20px 16px 16px;
          }

          .sla-result-time-card {
            margin-top: 15px;
            padding: 12px 14px;
          }

          .sla-result-summary {
            margin-top: 15px;
          }

          .sla-result-note {
            margin-top: 15px;
          }

          .sla-editorial-result .result-actions {
            gap: 7px;
          }

          .sla-editorial-result .result-actions button,
          .sla-editorial-result .result-actions a {
            min-height: 42px;
            padding: 7px 9px;
          }

          .sla-editorial-related {
            padding: 18px 16px;
          }

          .sla-editorial-related nav {
            gap: 6px;
          }

          .sla-editorial-related a {
            min-height: 50px;
            padding: 10px 12px;
          }
        }

        @media (max-width: 430px) {
          .sla-editorial-brand img {
            width: 142px;
          }

          .sla-editorial-nav {
            gap: 10px;
          }

          .sla-editorial-nav a {
            font-size: 0.76rem;
          }

          .sla-editorial-image-wrap {
            min-height: 470px;
          }

          .sla-editorial-answer {
            left: 14px;
            right: 14px;
            top: 14px;
            padding: 16px;
          }

          .sla-editorial-eyebrow {
            font-size: 0.7rem;
          }

          .sla-editorial-time-row span {
            font-size: 0.68rem;
          }

          .sla-editorial-time-row b {
            font-size: 0.92rem;
          }

          .sla-editorial-start-grid {
            grid-template-columns: 1fr;
          }

          .sla-editorial-workday-presets {
            grid-template-columns: 1fr;
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
        Calculator dates are saved in this browser only. VA Workspace records are stored in the signed-in account and can be exported through Backup and restore.
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
