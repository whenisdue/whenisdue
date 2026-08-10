import { useEffect, useMemo, useState } from 'react'
import './App.css'
import './VaHomeCompact.css'
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
const businessDayQuickPicks = [1, 3, 5, 7, 10]
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
      startday: startDayConvention,
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
    endDayAdjustment,
    holidayCalendar,
    triggerKind,
  ])

  function applySavedRule(profile: DeadlineRuleProfile) {
    recordDeadlineSetupApplied(profile.id, triggerDate)
    setDuration(String(profile.duration))
    setDirection(profile.direction)
    setUnit(profile.unit)
    setStartDayConvention(profile.startDayConvention)
    setHolidayCalendar(profile.holidayCalendar)
    setEndDayAdjustment(profile.endDayAdjustment)
    setTriggerKind(profile.triggerKind)
  }

  return (
    <main className="page-shell deadline-rule-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="deadline-rule-shell">
        <header className="deadline-rule-intro">
          <p className="friendly-eyebrow">Rule-aware deadline</p>
          <h1>When is it due?</h1>
          <p>
            Start with the simple answer. Open the rule choices only when the
            wording you were given needs them.
          </p>
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

        {result && parsedTriggerDate && parsedDuration !== null ? (
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
                  label: triggerEvent ? 'Clock starts' : 'Start date',
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

        {cameFromWithinPhrase && startRuleComparison ? (
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
                onClick={() => setStartDayConvention('exclude-trigger')}
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
                onClick={() =>
                  setStartDayConvention('include-if-qualifying')
                }
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

        {result && parsedDuration !== null ? (
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
                value={startDayConvention}
                onChange={(event) =>
                  setStartDayConvention(
                    event.target.value as StartDayConvention,
                  )
                }
              >
                <option value="exclude-trigger">
                  No — start counting after it
                </option>
                <option value="include-if-qualifying">
                  Yes — if that day qualifies
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
          deadline. WhenIsDue shows the result for the rules you select.
        </p>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .deadline-rule-page {
          background: #fffaf2;
        }

        .deadline-rule-shell {
          width: min(100% - 24px, 860px);
          margin: 0 auto;
          padding: 36px 0 64px;
        }

        .deadline-rule-intro {
          text-align: center;
        }

        .deadline-rule-intro h1 {
          margin: 6px 0 0;
          color: #152d48;
          font-size: clamp(2.35rem, 7vw, 4rem);
          line-height: 1;
        }

        .deadline-rule-intro > p:last-child {
          max-width: 650px;
          margin: 14px auto 0;
          color: #61788f;
          font-size: 1.05rem;
          line-height: 1.6;
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
          grid-template-columns: 1.25fr 0.85fr 1fr 1fr;
          gap: 10px;
          margin-top: 28px;
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
          padding: 24px 18px;
          border: 1px solid rgba(22, 49, 78, 0.09);
          border-radius: 18px;
          background: #fff;
          text-align: center;
        }

        .deadline-rule-answer > span {
          color: #71869b;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .deadline-rule-answer > strong {
          display: block;
          margin-top: 6px;
          color: #132c47;
          font-size: clamp(2.1rem, 7vw, 3.7rem);
          line-height: 1.05;
        }

        .deadline-rule-answer > small {
          display: block;
          margin-top: 6px;
          color: #6d8296;
          font-size: 1rem;
          font-weight: 750;
        }

        .deadline-rule-answer > p {
          max-width: 680px;
          margin: 16px auto 0;
          color: #536b85;
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
          .deadline-rule-shell {
            padding-top: 24px;
          }

          .deadline-rule-essential {
            grid-template-columns: 1fr;
          }

          .deadline-rule-compare-grid {
            grid-template-columns: 1fr;
          }

          .deadline-rule-answer {
            padding: 20px 14px;
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

  return (
    <main className="page-shell next-payday-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="next-payday-hero">
        <h1>When is my next payday?</h1>
        <p>Enter a known payday and choose your pay schedule.</p>
      </section>

      <section className="next-payday-workspace" aria-label="Next payday calculator">
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

        </div>

        <div className="next-payday-result" aria-live="polite">
          {nextPayday && parsedKnownPayday ? (
            <>
              <p>Next payday</p>
              <div className="next-payday-date">{formatPlainDate(nextPayday)}</div>
              <div className="next-payday-weekday">{formatWeekday(nextPayday)}</div>
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

        <div className="next-payday-secondary">
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

          <p className="next-payday-caveat">
            This calculates the schedule only. Employers and banks may move payments
            for weekends, holidays, payroll processing, or local rules.
          </p>
        </div>
      </section>

      <section className="business-content" aria-label="Pay schedule help">
        <div className="business-copy">
          <h2>How this payday calculator works</h2>
          <p>
            Weekly and biweekly schedules add 7 or 14 calendar days. Semimonthly
            schedules use the selected dates each month. Monthly schedules use the
            same calendar day when that day exists, or the last day of a shorter month.
          </p>

          <dl className="business-faq">
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
        .next-payday-citation-explanation {
          max-width: 680px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .next-payday-hero {
          width: min(900px, calc(100% - 36px));
          margin: 42px auto 0;
          text-align: center;
        }

        .next-payday-hero h1 {
          margin: 6px 0 0;
          color: #10213b;
          font-size: clamp(2.3rem, 5vw, 4.7rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .next-payday-hero > p:last-child {
          max-width: 650px;
          margin: 12px auto 0;
          color: #6d8094;
          line-height: 1.55;
        }

        .next-payday-workspace {
          display: grid;
          grid-template-columns: minmax(280px, 0.8fr) minmax(360px, 1.2fr);
          gap: 14px;
          width: min(1080px, calc(100% - 36px));
          margin: 22px auto 0;
        }

        .next-payday-form,
        .next-payday-result {
          min-width: 0;
          padding: 20px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 18px;
          background: #fff;
        }

        .next-payday-form {
          display: grid;
          align-content: start;
          gap: 14px;
        }

        .next-payday-form label {
          display: grid;
          gap: 6px;
        }

        .next-payday-form label > span {
          color: #526a85;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .next-payday-form input,
        .next-payday-form select {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          padding: 8px 10px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 9px;
          background: #fff;
          color: #243f5e;
          font: inherit;
        }

        .next-payday-secondary {
          grid-column: 1 / -1;
          display: grid;
          gap: 8px;
          padding: 2px 4px 0;
        }

        .next-payday-quick-picks {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .next-payday-quick-picks button {
          min-height: 40px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.11);
          border-radius: 999px;
          background: #f7f9fb;
          color: #657a91;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 850;
          cursor: pointer;
        }

        .next-payday-quick-picks button.is-active {
          border-color: rgba(23, 58, 99, 0.28);
          background: #eef3f7;
          color: #173a63;
        }

        .next-payday-caveat {
          margin: 0;
          color: #667c92;
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .next-payday-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .next-payday-result > p:first-child {
          margin: 0;
          color: #667c92;
          font-size: 0.92rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .next-payday-date {
          margin-top: 7px;
          color: #0c1931;
          font-size: clamp(3.5rem, 7.2vw, 6.7rem);
          font-weight: 950;
          line-height: 0.98;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .next-payday-weekday {
          margin-top: 6px;
          color: #63788f;
          font-size: 0.92rem;
          font-weight: 800;
        }

        .next-payday-rule {
          margin: 9px 0 0;
          color: #667c92;
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .next-payday-empty {
          margin: auto;
          color: #7a8999;
        }

        @media (max-width: 760px) {
          .next-payday-hero,
          .next-payday-workspace {
            width: calc(100% - 20px);
          }

          .next-payday-hero {
            margin-top: 18px;
          }

          .next-payday-hero h1 {
            font-size: clamp(2.1rem, 10vw, 2.9rem);
          }

          .next-payday-hero > p:last-child {
            margin-top: 9px;
            font-size: 0.96rem;
            line-height: 1.45;
          }

          .next-payday-workspace {
            grid-template-columns: 1fr;
          }

          .next-payday-form {
            order: 1;
          }

          .next-payday-result {
            order: 2;
          }

          .next-payday-secondary {
            order: 3;
          }

          .next-payday-quick-picks button {
            min-height: 44px;
          }

          .next-payday-date {
            font-size: clamp(3.1rem, 14vw, 5rem);
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
        <span>Quick answer finder</span>
        <h2 id="ask-when-title">Ask WhenIsDue</h2>
        <p>Type a common date question. Your answer appears as soon as WhenIsDue recognizes the pattern.</p>
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
          width: min(920px, calc(100% - 36px));
          margin: 24px auto 0;
          padding: 22px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 14px 44px rgba(19, 38, 70, 0.06);
          text-align: center;
        }

        .ask-when-heading > span {
          display: block;
          margin-bottom: 4px;
          color: #78899b;
          font-size: 1rem;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .ask-when-heading h2 {
          margin: 0;
          color: #10213b;
          font-size: clamp(1.45rem, 3vw, 2.1rem);
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
          min-height: 56px;
          padding: 12px 16px;
          border: 1px solid rgba(19, 38, 70, 0.16);
          border-radius: 11px;
          color: #18314e;
          font: inherit;
          font-size: 1.08rem;
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
      <section className="date-home-hero" aria-labelledby="date-home-title">
        <header className="date-home-header">
          <a
            className="date-home-brand"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            WhenIsDue
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

        <div className="date-home-answer">
          <p className="date-home-kicker">Today is</p>
          <h1 id="date-home-title" className="date-home-date">
            {formatPlainDate(today)}
          </h1>
          <p className="date-home-weekday">{formatWeekday(today)}</p>
          <p className="date-home-timezone">{getLocalTimeZoneName()}</p>
        </div>
      </section>

      <section className="date-home-business" aria-labelledby="date-home-business-title">
        <div className="date-home-section-heading">
          <h2 id="date-home-business-title">Business days from today</h2>
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

        <div className="date-home-calendar-preference">
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
              ? 'Choose a calendar once and WhenIsDue will remember it on this device.'
              : `${getHolidayCalendarOption(holidayCalendar).shortLabel} is remembered on this device.`}
          </p>
        </div>

        <style>{`
          .date-home-calendar-preference {
            width: min(100%, 560px);
            margin: 12px auto 0;
          }

          .date-home-calendar-preference > p {
            margin: 6px 0 0;
            color: #7a8999;
            font-size: 0.72rem;
            text-align: center;
          }

          @media (max-width: 560px) {
            .date-home-calendar-preference > p {
              text-align: left;
            }
          }
        `}</style>
      </section>

      <AskWhenBox
        onNavigate={onNavigate}
        holidayCalendar={holidayCalendar}
        today={today}
      />

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

      <section className="date-home-tools" aria-labelledby="date-home-tools-title">
        <h2 id="date-home-tools-title">What do you need to know?</h2>

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
        </div>
      </section>

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
          min-height: 72vh;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .date-home-header {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .date-home-brand {
          color: #536c89;
          font-size: 0.9rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-decoration: none;
        }

        .date-home-nav {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .date-home-nav a {
          color: #687c94;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
        }

        .date-home-answer {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 34px 12px 54px;
        }

        .date-home-kicker {
          margin: 0 0 10px;
          color: #607793;
          font-size: clamp(1.1rem, 2vw, 1.65rem);
          font-weight: 800;
        }

        .date-home-date {
          margin: 0;
          max-width: 100%;
          color: #0b1830;
          font-size: clamp(4.7rem, 10.5vw, 9.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .date-home-weekday {
          margin: 18px 0 0;
          color: #536981;
          font-size: clamp(1.6rem, 3.2vw, 2.8rem);
        }

        .date-home-timezone {
          margin: 12px 0 0;
          color: #8290a1;
          font-size: 0.82rem;
        }

        .date-home-business,
        .date-home-tools,
        .date-home-secondary {
          width: min(100% - 32px, 1080px);
          margin: 0 auto;
        }

        .date-home-business {
          padding: 42px 0 54px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
        }

        .date-home-section-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: baseline;
          margin-bottom: 16px;
        }

        .date-home-section-heading h2,
        .date-home-tools h2 {
          margin: 0;
          color: #18304c;
          font-size: 1.35rem;
        }

        .date-home-section-heading a {
          color: #657b95;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
        }

        .date-home-business-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .date-home-business-answer {
          min-height: 112px;
          padding: 14px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 10px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
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
          margin: 8px 2px 0;
          color: #8491a1;
          font-size: 0.72rem;
        }

        .date-home-tools {
          padding: 28px 0 56px;
        }

        .date-home-tools h2 {
          margin-bottom: 16px;
        }

        .date-home-tool-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .date-home-tool-grid a {
          min-height: 132px;
          padding: 18px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.72);
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
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
          color: #536b87;
          font-size: 0.8rem;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .date-home-hero {
            width: min(100% - 24px, 1240px);
            min-height: 68vh;
          }

          .date-home-header {
            min-height: 52px;
          }

          .date-home-nav {
            gap: 12px;
          }

          .date-home-nav a {
            font-size: 0.72rem;
          }

          .date-home-answer {
            padding: 28px 0 38px;
          }

          .date-home-kicker {
            font-size: 1rem;
          }

          .date-home-date {
            font-size: clamp(3.7rem, 17vw, 5.8rem);
            line-height: 0.98;
          }

          .date-home-weekday {
            margin-top: 12px;
            font-size: 1.7rem;
          }

          .date-home-business,
          .date-home-tools,
          .date-home-secondary {
            width: min(100% - 24px, 1080px);
          }

          .date-home-business {
            padding: 30px 0 40px;
          }

          .date-home-section-heading {
            align-items: flex-start;
          }

          .date-home-business-grid {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .date-home-business-answer {
            min-height: 58px;
            padding: 8px 11px;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "label date"
              "label weekday";
            align-items: center;
          }

          .date-home-business-answer span {
            grid-area: label;
          }

          .date-home-business-answer strong {
            grid-area: date;
            margin: 0;
            text-align: right;
            font-size: 1.12rem;
          }

          .date-home-business-answer small {
            grid-area: weekday;
            margin: 0;
            text-align: right;
          }

          .date-home-tool-grid {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .date-home-tool-grid a {
            min-height: 104px;
          }

          .date-home-secondary {
            align-items: flex-start;
            flex-direction: column;
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

      <section id="more-tools" className="popular-calculators friendly-tools" aria-labelledby="popular-calculators-title">
        <div className="section-heading">
          <p className="friendly-eyebrow muted-eyebrow">More quick tools</p>
          <h2 id="popular-calculators-title" tabIndex={-1}>Common deadline calculators</h2>
          <p>Open a focused calculator when you need a little more guidance.</p>
        </div>
        <div className="popular-calculators-grid">
          <a
            className="calculator-link-card"
            href="/business-days-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/business-days-calculator')
            }}
          >
            <span className="tool-card-icon" aria-hidden="true">M–F</span>
            <span>
              <strong>Business days</strong>
              <small>Skip Saturdays and Sundays</small>
            </span>
            <b aria-hidden="true">→</b>
          </a>
          <a
            className="calculator-link-card"
            href="/free-trial-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/free-trial-calculator')
            }}
          >
            <span className="tool-card-icon" aria-hidden="true">★</span>
            <span>
              <strong>Free trial</strong>
              <small>Set a one-day-before reminder</small>
            </span>
            <b aria-hidden="true">→</b>
          </a>
          <a
            className="calculator-link-card"
            href="/return-window-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/return-window-calculator')
            }}
          >
            <span className="tool-card-icon" aria-hidden="true">↩</span>
            <span>
              <strong>Return window</strong>
              <small>Find the last day to return</small>
            </span>
            <b aria-hidden="true">→</b>
          </a>
          <a
            className="calculator-link-card"
            href="/invoice-due-date-calculator"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/invoice-due-date-calculator')
            }}
          >
            <span className="tool-card-icon" aria-hidden="true">$</span>
            <span>
              <strong>Invoice due date</strong>
              <small>Calculate payment terms</small>
            </span>
            <b aria-hidden="true">→</b>
          </a>
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
  const calendarDaysAway = parsedStartDate && dueDate ? daysBetween(parsedStartDate, dueDate) : 0
  const daysRemaining = dueDate ? daysBetween(today, dueDate) : 0
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

  return (
    <main className="page-shell business-page">
      <section className="intro business-intro business-answer-intro" aria-labelledby="business-days-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <h1 id="business-days-title">Business days from today</h1>
        <p className="business-answer-context">
          Today: <strong>{formatWeekday(today)}, {formatPlainDate(today)}</strong>
          <span aria-hidden="true"> · </span>
          {getLocalTimeZoneName()}
        </p>
      </section>

      <section className="business-today-answers business-bam-answers" aria-label="Business day answers from today">
        <div className="business-bam-list">
          {[3, 5, 7, 10].map((dayCount) => {
            const answerDate = calculateBusinessDaysWithCalendar(
              today,
              dayCount,
              holidayCalendar,
            ).date

            const exactPath = `/${dayCount}-business-days-from-today`
            const calendarQuery = holidayCalendarQueryValue(holidayCalendar)
            const exactHref = calendarQuery
              ? `${exactPath}?calendar=${calendarQuery}`
              : exactPath

            return (
              <a
                className="business-bam-row"
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
                aria-label={`${dayCount} business days from today is ${formatPlainDate(answerDate)}`}
              >
                <span>{dayCount} business days</span>
                <strong>{formatPlainDate(answerDate)}</strong>
                <small>{formatWeekday(answerDate)}</small>
              </a>
            )
          })}
        </div>
        <p className="business-bam-rule">
          {holidayCalendar === 'none'
            ? 'Weekends skipped. Public holidays still count as weekdays.'
            : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped.`}
        </p>

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

        <nav className="business-exact-links" aria-label="More business days from today answers">
          <span>More exact answers</span>
          <div>
            {[4, 8, 20, 30].map((dayCount) => {
              const path = `/${dayCount}-business-days-from-today`
              const calendarQuery = holidayCalendarQueryValue(holidayCalendar)
              const href = calendarQuery ? `${path}?calendar=${calendarQuery}` : path

              return (
                <a
                  href={href}
                  key={dayCount}
                  onClick={(event) => {
                    event.preventDefault()
                    trackWhenIsDueEvent('related_bam_click', {
                      context: 'business_days_calculator_more',
                      day_count: dayCount,
                    })
                    onNavigate(href)
                  }}
                >
                  {dayCount} business days
                </a>
              )
            })}
          </div>
        </nav>
      </section>

      <section className="business-workspace" aria-label="Custom business days calculator">
        <div className="business-custom-heading">
          <h2>Different date or number?</h2>
        </div>
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <div className="card-heading">
            <h2>Add business days</h2>
            <p>Enter a start date and a whole number of business days.</p>
          </div>

          <label className="field start-field">
            <span>Start date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                trackWhenIsDueEvent('date_changed', { context: 'business_days', value: event.target.value })
              }}
            />
          </label>

          <label className="field value-field">
            <span>Business days</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="2600"
              value={businessDays}
              onChange={(event) => {
                setBusinessDays(event.target.value)
                trackWhenIsDueEvent('number_changed', { context: 'business_days', value: event.target.value })
              }}
            />
            <span className="quick-picks" aria-label="Quick business day values">
              {businessDayQuickPicks.map((quickPick) => (
                <button
                  className={businessDays === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => {
                    setBusinessDays(String(quickPick))
                    trackWhenIsDueEvent('quick_pick', { context: 'business_days', value: quickPick })
                  }}
                >
                  {quickPick}
                </button>
              ))}
            </span>
          </label>

          {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>

        <section className={`result-panel business-result ${daysRemaining < 0 ? 'is-overdue' : ''}`}>
          <p className="result-label">Due date</p>
          {dueDate && parsedBusinessDays !== null ? (
            <>
              <p className="due-date">{formatPlainDate(dueDate)}</p>
              <div className="result-meta result-meta-stack">
                <span>{formatWeekday(dueDate)}</span>
                <span>{formatBusinessDistance(parsedBusinessDays)} from start date</span>
                <span className={`status-badge ${getUrgencyClass(daysRemaining)}`}>
                  {formatCalendarDistance(calendarDaysAway)}
                </span>
              </div>
              <p className="result-note">
                {holidayCalendar === 'none'
                  ? 'Weekends skipped. Public holidays are not removed.'
                  : `Weekends and ${getHolidayCalendarOption(holidayCalendar).shortLabel} holidays skipped.`}
              </p>

              {parsedStartDate && businessCalculation ? (
                <>
                  <p className="business-citation-explanation">
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
                </>
              ) : null}

              <details className="result-save-details">
                <summary>Save this date</summary>
                <div className="business-save">
                  <label className="field title-field">
                    <span>Title</span>
                    <input
                      maxLength={titleMaxLength}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                  <button className="primary-button" type="button" disabled={!canSave} onClick={saveBusinessDeadline}>
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
      </section>

      <section className="business-content" aria-label="Business days help">
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
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always check the original terms or official calendar when a deadline matters."
      />

      <style>{`
        .business-answer-intro {
          padding-bottom: 10px;
        }

        .business-answer-intro .friendly-site-header {
          margin-bottom: 8px;
        }

        .business-answer-intro h1 {
          margin-bottom: 4px;
          font-size: clamp(1.85rem, 3.4vw, 2.8rem);
        }

        .business-answer-context {
          margin: 0;
          color: #5a6f89;
          font-size: 0.9rem;
          line-height: 1.35;
        }

        .business-today-answers {
          width: min(100% - 32px, 1130px);
          margin: 0 auto 18px;
          padding: 0;
          border: 0;
          background: transparent;
        }

        .business-bam-list {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .business-bam-row {
          color: inherit;
          text-decoration: none;
          transition: border-color 120ms ease, transform 120ms ease;
          min-height: 138px;
          padding: 14px 18px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 10px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .business-bam-row span {
          font-size: 0.82rem;
          font-weight: 800;
          color: #55708f;
        }

        .business-bam-row strong {
          margin-top: 6px;
          font-size: clamp(1.7rem, 2.8vw, 2.65rem);
          line-height: 1.02;
          color: #10213f;
        }

        .business-bam-row small {
          margin-top: 4px;
          font-size: 0.9rem;
          color: #60738d;
        }

        .business-bam-rule {
          margin: 8px 2px 0;
          font-size: 0.78rem;
          color: #718197;
        }

        .result-save-details {
          margin-top: 16px;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
          padding-top: 12px;
        }

        .result-save-details summary {
          width: fit-content;
          cursor: pointer;
          font-weight: 700;
          color: #4f6682;
        }

        .business-today-heading h2,
        .business-custom-heading h2 {
          margin: 4px 0 6px;
        }

        .business-today-heading p,
        .business-custom-heading p,
        .business-today-note {
          margin: 0;
        }

        .business-today-date {
          margin: 8px 0 3px !important;
          font-size: 1rem;
          color: #10213f;
        }

        .business-today-timezone {
          margin: 0 0 8px !important;
          font-size: 0.92rem;
          color: #60738d;
        }

        .business-today-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .business-today-card {
          min-height: 124px;
          padding: 16px;
          border: 1px solid rgba(19, 38, 70, 0.12);
          border-radius: 12px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .business-today-card span {
          font-size: 0.85rem;
          font-weight: 700;
          color: #55708f;
        }

        .business-today-card strong {
          margin-top: 8px;
          font-size: clamp(1.05rem, 1.7vw, 1.35rem);
          line-height: 1.2;
          color: #10213f;
        }

        .business-today-card small {
          margin-top: 4px;
          color: #60738d;
        }

        .business-today-note {
          margin-top: 14px;
          color: #516783;
        }

        .business-bam-row:hover,
        .business-bam-row:focus-visible {
          border-color: rgba(23, 58, 99, 0.22);
          transform: translateY(-1px);
          outline: none;
        }

        .business-exact-links {
          width: 100%;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(19, 38, 70, 0.08);
        }

        .business-exact-links > span {
          display: block;
          margin-bottom: 7px;
          color: #6d8196;
          font-size: 0.82rem;
          font-weight: 850;
        }

        .business-exact-links > div {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .business-exact-links a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4e6985;
          font-size: 0.82rem;
          font-weight: 800;
          text-decoration: none;
        }

        .business-citation-explanation {
          max-width: 680px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .business-custom-heading {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }

        .business-page .quick-picks button {
          min-width: 44px;
          min-height: 44px;
        }

        @media (max-width: 760px) {
          .business-answer-intro {
            padding-top: 10px;
          }

          .business-answer-intro .friendly-top-nav {
            gap: 10px;
          }

          .business-answer-intro h1 {
            font-size: 1.85rem;
          }

          .business-answer-context {
            font-size: 0.82rem;
          }

          .business-today-answers {
            width: min(100% - 24px, 1130px);
          }

          .business-bam-list {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .business-bam-row {
            min-height: 52px;
            padding: 7px 10px;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "label date"
              "label weekday";
            align-items: center;
          }

          .business-bam-row span {
            grid-area: label;
            font-size: 0.84rem;
          }

          .business-bam-row strong {
            grid-area: date;
            margin: 0;
            text-align: right;
            font-size: 1.18rem;
          }

          .business-bam-row small {
            grid-area: weekday;
            margin: 0;
            text-align: right;
            font-size: 0.76rem;
          }

          .business-bam-rule {
            margin-top: 6px;
            font-size: 0.72rem;
          }
        }
      `}</style>
    </main>
  )
}


type BusinessDaysFromTodayPageProps = NavigationProps & {
  dayCount: 3 | 4 | 5 | 7 | 8 | 10 | 20 | 30
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
}

function ResultActions({ title, date, details, time }: ResultActionsProps) {
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

  return (
    <>
      <div className="result-actions" aria-label="Result actions">
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
        {message ? <span aria-live="polite">{message}</span> : null}
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
        }

        .result-actions button:hover {
          border-color: rgba(19, 38, 70, 0.28);
        }

        .result-actions button.is-favorite {
          border-color: rgba(19, 38, 70, 0.26);
          background: #f4f7fa;
          color: #243e5c;
        }

        .result-actions span {
          color: #75879b;
          font-size: 0.72rem;
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
    <main className="page-shell free-trial-page">
      <section className="intro free-trial-bam-intro" aria-labelledby="free-trial-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <h1 id="free-trial-title">When does my free trial end?</h1>
        <p className="subtitle">Enter the start date and trial length. The answer updates immediately.</p>
      </section>

      <section className="business-workspace" aria-label="Free trial calculator">
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <label className="field start-field">
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

          <label className="field value-field">
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
            <span className="quick-picks" aria-label="Quick trial length values">
              {trialLengthQuickPicks.map((quickPick) => (
                <button
                  className={trialLength === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => {
                    setTrialLength(String(quickPick))
                    trackWhenIsDueEvent('quick_pick', { context: 'free_trial', value: quickPick })
                  }}
                >
                  {quickPick}
                </button>
              ))}
            </span>
          </label>

          {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>

        <section className="result-panel free-trial-result">
          <p className="result-label">Trial dates</p>
          {trialEndDate && cancelByDate && parsedTrialLength !== null ? (
            <>
              <p className="due-date">{formatPlainDate(trialEndDate)}</p>
              <div className="result-meta result-meta-stack">
                <span>Trial ends on {formatPlainDate(trialEndDate)}</span>
                <span>Suggested reminder: {formatPlainDate(cancelByDate)}</span>
                <span className="status-badge status-comfortable">
                  {calendarDaysFromStart} {calendarDaysFromStart === 1 ? 'calendar day' : 'calendar days'} from the start date
                </span>
              </div>
              <p className="result-note">Always check the service terms for exact renewal timing.</p>
              <p className="trial-citation-explanation">
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
              <details className="result-save-details">
                <summary>Save this date</summary>
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
      </section>

      <style>{`
        .trial-citation-explanation {
          max-width: 680px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .free-trial-bam-intro {
          padding-bottom: 8px;
        }

        .free-trial-page .business-workspace {
          align-items: stretch;
        }

        .free-trial-page .business-calculator {
          padding-top: 16px;
        }

        .free-trial-page .free-trial-result .due-date {
          font-size: clamp(3.6rem, 8vw, 7rem);
          line-height: 0.96;
          letter-spacing: -0.045em;
        }

        .free-trial-page .free-trial-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .free-trial-page .quick-picks button {
          min-width: 44px;
          min-height: 44px;
        }

        @media (max-width: 760px) {
          .free-trial-page .business-workspace {
            gap: 10px;
          }

          .free-trial-page .business-calculator {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .free-trial-page .free-trial-result .due-date {
            font-size: clamp(3.2rem, 15vw, 5rem);
          }
        }
      `}</style>

      <section className="business-content" aria-label="Free trial help">
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

        <article>
          <h2>Related deadline tool</h2>
          <p>
            Bought something with a limited return period? Use the{' '}
            <a
              href="/return-window-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/return-window-calculator')
              }}
            >
              Return Window Calculator
            </a>
            .
          </p>
        </article>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}

function ReturnWindowPage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const [purchaseDate, setPurchaseDate] = useState(() => getInitialDateQueryParam('start', todayInputValue()))
  const [returnWindow, setReturnWindow] = useState(() =>
    getInitialPositiveIntegerQueryParam('days', '30', getAmountLimit('return')),
  )
  const [title, setTitle] = useState(getDefaultTitle('return'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedPurchaseDate = parsePlainDate(purchaseDate)
  const parsedReturnWindow = parseInteger(returnWindow)
  const validationMessage = getReturnWindowValidationMessage(parsedPurchaseDate, parsedReturnWindow)
  const titleValidationMessage = getSaveTitleValidationMessage(title)
  const returnDeadline = parsedPurchaseDate && parsedReturnWindow !== null && !validationMessage
    ? addCalendarDays(parsedPurchaseDate, Math.max(parsedReturnWindow - 1, 0))
    : null
  const canSave = Boolean(returnDeadline && parsedPurchaseDate && !validationMessage && !titleValidationMessage)

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
    <main className="page-shell return-window-page">
      <section className="intro return-answer-intro" aria-labelledby="return-window-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <h1 id="return-window-title">Return deadline</h1>
        <p className="return-answer-context">
          Enter the date your store says the return window begins. The start date counts as day 1.
        </p>
      </section>

      <section className="business-workspace return-primary-workspace" aria-label="Return deadline calculator">
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <label className="field start-field">
            <span>Return window start date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={purchaseDate}
              onChange={(event) => {
                setPurchaseDate(event.target.value)
                trackWhenIsDueEvent('date_changed', { context: 'return_window', value: event.target.value })
              }}
            />
          </label>

          <label className="field value-field">
            <span>Return window in days</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={getAmountLimit('return')}
              value={returnWindow}
              onChange={(event) => {
                setReturnWindow(event.target.value)
                trackWhenIsDueEvent('number_changed', { context: 'return_window', value: event.target.value })
              }}
            />
            <span className="quick-picks" aria-label="Quick return window values">
              {returnWindowQuickPicks.map((quickPick) => (
                <button
                  className={returnWindow === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => {
                    setReturnWindow(String(quickPick))
                    trackWhenIsDueEvent('quick_pick', { context: 'return_window', value: quickPick })
                  }}
                >
                  {quickPick}
                </button>
              ))}
            </span>
          </label>

          {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>

        <section className="result-panel return-window-result">
          <p className="result-label">Return deadline</p>
          {returnDeadline && parsedReturnWindow !== null ? (
            <>
              <p className="due-date">{formatPlainDate(returnDeadline)}</p>
              <div className="result-meta result-meta-stack">
                <span className="return-result-label">Last day to return</span>
                <span className="status-badge status-comfortable">
                  {parsedReturnWindow}-day return window · Start date counts as day 1
                </span>
              </div>
              <p className="result-note">
                Use the purchase or delivery date named in the store's policy.
              </p>
              <p className="return-citation-explanation">
                {formatReturnWindowExplanation(
                  parsedPurchaseDate!,
                  parsedReturnWindow!,
                  returnDeadline,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="return_window"
                rows={[
                  { label: 'Window starts', value: `${formatWeekday(parsedPurchaseDate!)}, ${formatPlainDate(parsedPurchaseDate!)}` },
                  { label: 'Window length', value: `${parsedReturnWindow} ${parsedReturnWindow === 1 ? 'day' : 'days'}` },
                  { label: 'Counting rule', value: 'Start date counts as day 1' },
                  { label: 'Last day to return', value: `${formatWeekday(returnDeadline)}, ${formatPlainDate(returnDeadline)}` },
                ]}
              />
              <ResultActions
                title="Return deadline"
                date={returnDeadline}
                details={`${parsedReturnWindow}-day return window`}
              />
              <details className="result-save-details">
                <summary>Save this date</summary>
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
                  <button className="primary-button" type="button" disabled={!canSave} onClick={saveReturnDeadline}>
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
      </section>

      <style>{`
        .return-citation-explanation {
          max-width: 680px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .return-related-tools {
          width: min(100% - 24px, 920px);
          margin: 24px auto 0;
          padding: 18px 0;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .return-related-tools > div > span {
          color: #7b8da0;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .return-related-tools h2 {
          margin: 4px 0 0;
          color: #28435f;
          font-size: 1.05rem;
        }

        .return-related-tools nav {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .return-related-tools a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.82rem;
          font-weight: 850;
          text-decoration: none;
        }

        .return-window-page .return-answer-intro {
          padding-bottom: 8px;
        }

        .return-window-page .return-primary-workspace {
          align-items: stretch;
        }

        .return-window-page .business-calculator {
          padding-top: 16px;
        }

        .return-window-page .return-window-result .due-date {
          font-size: clamp(3.8rem, 8.5vw, 7.4rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
        }

        .return-window-page .return-window-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .return-window-page .quick-picks button {
          min-width: 44px;
          min-height: 44px;
        }

        .return-window-page input,
        .return-window-page select,
        .return-window-page .quick-picks {
          max-width: 100%;
        }

        @media (max-width: 760px) {
          .return-window-page .return-primary-workspace {
            gap: 10px;
          }

          .return-window-page .business-calculator {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .return-window-page .return-window-result .due-date {
            font-size: clamp(3.25rem, 15.5vw, 5.2rem);
          }
        }
      `}</style>

      <section className="return-today-answers return-secondary-answers" aria-labelledby="return-today-title">
        <div className="return-today-heading">
          <h2 id="return-today-title">If your return window starts today</h2>
          <p className="return-today-date">
            Today: <strong>{formatWeekday(today)}, {formatPlainDate(today)}</strong>
            <span aria-hidden="true"> · </span>
            {getLocalTimeZoneName()}
          </p>
        </div>

        <div className="return-today-grid">
          {[7, 14, 30, 60].map((dayCount) => {
            const answerDate = addCalendarDays(today, Math.max(dayCount - 1, 0))

            return (
              <article className="return-today-card" key={dayCount}>
                <div className="return-today-card-top">
                  <span>{dayCount}-day window</span>
                </div>
                <strong>{formatPlainDate(answerDate)}</strong>
                <small>{formatWeekday(answerDate)}</small>
              </article>
            )
          })}
        </div>
      </section>

      <section className="business-content" aria-label="Return window help">
        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the purchase date and the number of days in the return window. The calculator shows the last calendar day to return the item. Some stores count from delivery date instead of purchase date, so always check the official return policy.
          </p>
        </article>

        <article>
          <h2>Common return windows</h2>
          <ul>
            <li>7-day return window</li>
            <li>14-day return window</li>
            <li>30-day return window</li>
            <li>60-day return window</li>
            <li>90-day return window</li>
          </ul>
        </article>

        <article>
          <h2>Return window calculation example</h2>
          <p>
            If a 30-day return window begins on July 1, this calculator shows July 30 as the last day to return the item. It counts July 1 as day one. Some retailers begin counting on the delivery date or the day after delivery, so use the date and counting rule stated in the store's policy.
          </p>
        </article>

        <article>
          <h2>Common return deadline mistakes</h2>
          <ul>
            <li>Using the purchase date when the policy starts on the delivery date</li>
            <li>Assuming every item follows the store's standard return window</li>
            <li>Overlooking final-sale, clearance, personalized, or opened-item exclusions</li>
            <li>Confusing the deadline to start a return with the deadline for the store to receive it</li>
            <li>Waiting until the final day without checking store hours or shipping requirements</li>
          </ul>
        </article>

        <article>
          <h2>Return window FAQ</h2>
          <dl>
            <dt>Does the purchase day count as day one?</dt>
            <dd>It does in this calculator. A retailer may count differently, especially for shipped orders.</dd>
            <dt>Should I use the order date or delivery date?</dt>
            <dd>Use whichever starting date the official return policy specifies. For online purchases, that is often the delivery date, but policies vary.</dd>
            <dt>What if the last day falls on a weekend or holiday?</dt>
            <dd>This calculator does not move the deadline. Check whether the store is open or whether an online or shipped return can be started that day.</dd>
            <dt>Does starting an online return meet the deadline?</dt>
            <dd>Some retailers require only that the return be initiated by the deadline; others require shipment or receipt. Check the exact wording of the policy.</dd>
          </dl>
        </article>

        <article>
          <h2>Related deadline tool</h2>
          <p>
            Need to avoid an automatic renewal instead? Use the{' '}
            <a
              href="/free-trial-calculator"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('/free-trial-calculator')
              }}
            >
              Free Trial Calculator
            </a>
            .
          </p>
        </article>
      </section>

      <section className="return-related-tools" aria-label="Related deadline calculators">
        <div>
          <span>Related deadlines</span>
          <h2>Other common date questions</h2>
        </div>

        <nav>
          {[
            ['/free-trial-calculator', 'Free trial end date'],
            ['/invoice-due-date-calculator', 'Invoice due date'],
            ['/business-days-calculator', 'Business days'],
          ].map(([path, label]) => (
            <a
              href={path}
              key={path}
              onClick={(event) => {
                event.preventDefault()
                trackWhenIsDueEvent('related_return_tool_click', { path })
                onNavigate(path)
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .return-answer-intro {
          padding-bottom: 10px;
        }

        .return-answer-intro .friendly-site-header {
          margin-bottom: 8px;
        }

        .return-answer-intro h1 {
          margin-bottom: 6px;
          font-size: clamp(2rem, 4vw, 3.2rem);
        }

        .return-answer-context {
          margin: 0;
          color: #5a6f89;
          font-size: 0.95rem;
        }

        .return-primary-workspace {
          margin-top: 0;
        }

        .return-primary-workspace .return-window-result .due-date {
          font-size: clamp(2.4rem, 6vw, 5rem);
          line-height: 1;
        }

        .return-result-label {
          font-weight: 800;
          color: #10213f;
        }

        .return-today-answers {
          width: min(100% - 32px, 1130px);
          margin: 20px auto;
          padding: 18px;
          border: 1px solid rgba(19, 38, 70, 0.12);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
        }

        .return-secondary-answers {
          margin-top: 24px;
        }

        .return-today-heading h2,
        .return-custom-heading h2 {
          margin: 4px 0 6px;
        }

        .return-today-heading p,
        .return-custom-heading p,
        .return-today-note {
          margin: 0;
        }

        .return-today-date {
          margin-top: 8px !important;
          font-size: 1rem;
          color: #10213f;
        }

        .return-today-timezone {
          margin-top: 3px !important;
          font-size: 0.92rem;
          color: #60738d;
        }

        .return-today-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .return-today-card {
          min-height: 124px;
          padding: 16px;
          border: 1px solid rgba(19, 38, 70, 0.12);
          border-radius: 12px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .return-today-card.is-common {
          border-width: 2px;
        }

        .return-today-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .return-today-card-top span {
          font-size: 0.85rem;
          font-weight: 700;
          color: #55708f;
        }

        .return-today-card-top b {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #55708f;
        }

        .return-today-card > strong {
          margin-top: 8px;
          font-size: clamp(1.05rem, 1.7vw, 1.35rem);
          line-height: 1.2;
          color: #10213f;
        }

        .return-today-card small {
          margin-top: 4px;
          color: #60738d;
        }

        .return-policy-warning {
          display: flex;
          gap: 8px 12px;
          flex-wrap: wrap;
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255, 247, 224, 0.8);
          color: #4f4a3c;
        }

        .return-policy-warning strong {
          color: #2f3c50;
        }

        .return-today-note {
          margin-top: 14px;
          color: #516783;
        }

        .return-custom-heading {
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }

        @media (max-width: 760px) {
          .return-answer-intro {
            padding-top: 10px;
          }

          .return-answer-intro h1 {
            font-size: 2rem;
          }

          .return-answer-context {
            font-size: 0.88rem;
          }

          .return-primary-workspace {
            margin-top: 0;
          }

          .return-primary-workspace .return-window-result .due-date {
            font-size: 2.65rem;
          }

          .return-today-answers {
            width: min(100% - 24px, 1130px);
            padding: 14px;
          }

          .return-today-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .return-today-card {
            min-height: 96px;
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

  return (
    <main className="page-shell invoice-due-date-page">
      <section className="intro invoice-bam-intro" aria-labelledby="invoice-due-date-title">
        <IdentityRow onNavigate={onNavigate} showHomeLink />
        <h1 id="invoice-due-date-title">Invoice due date</h1>
        <p className="subtitle">Enter the invoice date and payment terms. Your due date appears immediately.</p>
      </section>

      <section className="business-workspace" aria-label="Invoice due date calculator">
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <div className="card-heading">
            <h2>Calculate invoice due date</h2>
            <p>Enter the invoice date and payment terms.</p>
          </div>

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

          {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>

        <section className="result-panel invoice-due-date-result" aria-live="polite">
          <p className="result-label">Invoice due date</p>
          {invoiceDueDate ? (
            <>
              <p className="due-date">{formatPlainDate(invoiceDueDate)}</p>
              <div className="result-meta result-meta-stack">
                <span className="status-badge status-comfortable">
                  {invoiceTermLabels[invoiceTerm]}
                  {invoiceTerm === 'eom'
                    ? ' · End of invoice month'
                    : ` · ${calendarDaysFromInvoice} ${calendarDaysFromInvoice === 1 ? 'calendar day' : 'calendar days'} from invoice date`}
                </span>
              </div>
              <p className="result-note">
                Calendar-day terms are used for Net invoices. EOM means the last calendar day of the invoice month.
                Check the invoice or contract if weekends, holidays, or a different EOM rule apply.
              </p>
              <p className="invoice-citation-explanation">
                {formatInvoiceTermExplanation(
                  parsedInvoiceDate!,
                  invoiceTerm,
                  invoiceDueDate,
                )}
              </p>

              <CalculationReceipt
                analyticsContext="invoice_due_date"
                rows={[
                  { label: 'Invoice date', value: `${formatWeekday(parsedInvoiceDate!)}, ${formatPlainDate(parsedInvoiceDate!)}` },
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
              <ResultActions
                title="Invoice due date"
                date={invoiceDueDate}
                details={invoiceTermLabels[invoiceTerm]}
              />
              <details className="business-save">
                <summary>Save this date</summary>
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
              </details>
            </>
          ) : (
            <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
          )}
        </section>
      </section>

      <section className="business-content" aria-label="Invoice due date help">
        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the invoice date and choose the payment terms. The calculator uses the same Net 7, Net 15, Net 30, Net 45, Net 60, Net 90, and EOM rules as the homepage calculator.
          </p>
        </article>

        <article>
          <h2>Common invoice terms</h2>
          <ul>
            {[7, 15, 30, 45, 60, 90].map((days) => (
              <li key={days}>
                <a
                  href={`/net-${days}-due-date`}
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(`/net-${days}-due-date`)
                  }}
                >
                  Net {days} due date
                </a>
              </li>
            ))}
            <li>EOM — last calendar day of the invoice month</li>
          </ul>
        </article>

        <article>
          <h2>Net 30 calculation example</h2>
          <p>
            If an invoice is dated July 1 with Net 30 terms, this calculator adds 30 calendar days and shows July 31 as the due date. The invoice date is treated as day zero. The written invoice or contract controls if it uses a different counting method.
          </p>
        </article>

        <article>
          <h2>Calendar days, business days, and end-of-month terms</h2>
          <p>
            This calculator treats Net terms such as 30 as calendar days and supports EOM by returning the last calendar day of the invoice month. It does not automatically skip weekends or holidays. Some agreements use different month-end rules, such as EOM + 15 or a fixed day of the following month, so always confirm the exact invoice or contract wording.
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
          <h2>Related deadline tool</h2>
          <p>
            If your payment terms specifically use working days, use the{' '}
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

      <section className="invoice-related-answers" aria-label="Common invoice due date answers">
        <div>
          <span>Common payment terms</span>
          <h2>Exact Net due date pages</h2>
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
                Net {term}
              </a>
            )
          })}
        </nav>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .invoice-citation-explanation {
          max-width: 680px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .invoice-related-answers {
          width: min(100% - 24px, 920px);
          margin: 24px auto 0;
          padding: 18px 0;
          border-top: 1px solid rgba(19, 38, 70, 0.1);
          border-bottom: 1px solid rgba(19, 38, 70, 0.1);
        }

        .invoice-related-answers > div > span {
          color: #7b8da0;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .invoice-related-answers h2 {
          margin: 4px 0 0;
          color: #28435f;
          font-size: 1.05rem;
        }

        .invoice-related-answers nav {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .invoice-related-answers a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border: 1px solid rgba(19, 38, 70, 0.1);
          border-radius: 999px;
          background: #fff;
          color: #4f6a85;
          font-size: 0.82rem;
          font-weight: 850;
          text-decoration: none;
        }

        .invoice-bam-intro {
          padding-bottom: 8px;
        }

        .invoice-due-date-page .business-workspace {
          align-items: stretch;
        }

        .invoice-due-date-page .invoice-due-date-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .invoice-due-date-page .invoice-due-date-result .due-date {
          margin-top: 6px;
          font-size: clamp(3.8rem, 7.6vw, 6.8rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .invoice-due-date-page .invoice-due-date-result .result-meta-stack {
          align-items: center;
        }

        .invoice-due-date-page .invoice-due-date-result .result-note {
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 760px) {
          .invoice-due-date-page .business-workspace {
            gap: 10px;
          }

          .invoice-due-date-page .invoice-due-date-result .due-date {
            font-size: clamp(3.2rem, 14.5vw, 5rem);
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
  const [workdayPreferenceMessage, setWorkdayPreferenceMessage] = useState<string | null>(null)
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
    <main className="site-shell business-hours-page">
      <IdentityRow onNavigate={onNavigate} showHomeLink />

      <section className="business-hours-hero" aria-labelledby="business-hours-title">
        <h1 id="business-hours-title">When is this due in business hours?</h1>
        <p>Add working hours inside your business-day schedule.</p>
      </section>

      <section className="business-hours-workspace" aria-label="Business hours deadline calculator">
        <div className="business-hours-form">
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
            <span>Business hours to add</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>

          {validationMessage ? (
            <p className="business-hours-error" role="alert">{validationMessage}</p>
          ) : null}
        </div>

        <div className="business-hours-result" aria-live="polite">
          {result ? (
            <>
              <p>Deadline</p>
              <div className="business-hours-date">{formatPlainDate(result.date)}</div>

              <div className="business-hours-time-block">
                <span>Time</span>
                <strong>{formatTime12Hour(result.time)}</strong>
              </div>

              <div className="business-hours-weekday">{formatWeekday(result.date)}</div>

              <p className="business-hours-rule">
                {parsedHours} business {parsedHours === 1 ? 'hour' : 'hours'} ·{' '}
                {formatTime12Hour(workdayStart)}–{formatTime12Hour(workdayEnd)}
              </p>

              <p className="business-hours-citation-explanation">
                {formatBusinessHoursExplanation(
                  parsedStartDate!,
                  startTime,
                  parsedHours!,
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
                    value: `${formatPlainDate(parsedStartDate!)} · ${formatTime12Hour(startTime)}`,
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

              <ResultActions
                title={`${parsedHours}-business-hour deadline`}
                date={result.date}
                time={result.time}
                details={`${formatTime12Hour(result.time)} · ${formatTime12Hour(workdayStart)}–${formatTime12Hour(workdayEnd)} workday · ${getHolidayCalendarOption(holidayCalendar).shortLabel}`}
              />
            </>
          ) : (
            <p className="business-hours-empty">Enter valid details to calculate the deadline.</p>
          )}
        </div>

        <div className="business-hours-secondary">
          <div className="business-hours-presets" aria-label="Common SLA hour presets">
            {slaPresets.map((preset) => (
              <button
                type="button"
                key={preset.hours}
                className={hours === preset.hours ? 'is-active' : ''}
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
            ))}
          </div>

          <p className="business-hours-default-note">
            Using your remembered workday and holiday settings.
          </p>

          <details className="business-hours-advanced">
            <summary>Workday and holiday settings</summary>
            <div className="business-hours-advanced-body">
              <div className="business-hours-day">
                <span>Workday</span>
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

              <div className="business-hours-workday-presets" aria-label="Common workday presets">
                {workdayPresets.map((preset) => (
                  <button
                    type="button"
                    key={`${preset.start}-${preset.end}`}
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

              <div className="business-hours-preference-actions">
                <button type="button" onClick={saveCurrentWorkday}>
                  Remember this workday
                </button>
                <button type="button" className="is-secondary" onClick={resetSavedWorkday}>
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
              />
            </div>
          </details>

        </div>
      </section>

      <section className="business-content" aria-label="Business-hour rules">
        <div className="business-copy">
          <h2>How the business-hour clock works</h2>
          <p>
            If the start is before the workday begins, counting starts at the workday
            start. If it is at or after the workday end, counting starts at the next
            business-day start. This is a calculation tool, not a substitute for the
            SLA or contract you are checking.
          </p>

          <dl className="business-faq">
            <div>
              <dt>What if the SLA starts on a weekend?</dt>
              <dd>Counting begins at the start of the next business day.</dd>
            </div>
            <div>
              <dt>What if it starts after business hours?</dt>
              <dd>The clock begins at the next business-day start time.</dd>
            </div>
            <div>
              <dt>Do public holidays count?</dt>
              <dd>They count by default. Choose a supported holiday calendar to skip known holidays.</dd>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} />

      <style>{`
        .business-hours-citation-explanation {
          max-width: 700px;
          margin: 14px auto 0;
          color: #536b85;
          font-size: 1rem;
          line-height: 1.55;
          text-align: center;
        }

        .business-hours-hero {
          width: min(920px, calc(100% - 36px));
          margin: 42px auto 0;
          text-align: center;
        }

        .business-hours-hero h1 {
          margin: 6px 0 0;
          color: #10213b;
          font-size: clamp(2.2rem, 5vw, 4.5rem);
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .business-hours-hero > p:last-child {
          max-width: 700px;
          margin: 12px auto 0;
          color: #6d8094;
          line-height: 1.55;
        }

        .business-hours-workspace {
          display: grid;
          grid-template-columns: minmax(280px, 0.8fr) minmax(360px, 1.2fr);
          gap: 14px;
          width: min(1120px, calc(100% - 36px));
          margin: 22px auto 0;
        }

        .business-hours-form,
        .business-hours-result {
          min-width: 0;
          padding: 20px;
          border: 1px solid rgba(19, 38, 70, 0.09);
          border-radius: 18px;
          background: #fff;
        }

        .business-hours-form {
          display: grid;
          gap: 14px;
        }

        .business-hours-form label,
        .business-hours-day {
          display: grid;
          gap: 6px;
        }

        .business-hours-form label > span,
        .business-hours-day > span,
        .business-hours-day label > span {
          color: #526a85;
          font-size: 0.76rem;
          font-weight: 850;
        }

        .business-hours-form input {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          padding: 8px 10px;
          border: 1px solid rgba(19, 38, 70, 0.14);
          border-radius: 9px;
          color: #243f5e;
          font: inherit;
        }

        .business-hours-day > div {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .business-hours-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .business-hours-presets button {
          min-height: 40px;
          padding: 7px 11px;
          border: 1px solid rgba(19, 38, 70, 0.12);
          border-radius: 999px;
          background: #f7f9fb;
          color: #60758c;
          font: inherit;
          font-size: 0.74rem;
          font-weight: 850;
          cursor: pointer;
        }

        .business-hours-presets button.is-active {
          border-color: rgba(23, 58, 99, 0.28);
          background: #eef3f7;
          color: #173a63;
        }

        .business-hours-workday-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: -3px;
        }

        .business-hours-workday-presets button {
          min-height: 40px;
          padding: 7px 10px;
          border: 1px solid rgba(19, 38, 70, 0.11);
          border-radius: 999px;
          background: #fff;
          color: #667a91;
          font: inherit;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }

        .business-hours-workday-presets button.is-active {
          border-color: rgba(23, 58, 99, 0.28);
          background: #eef3f7;
          color: #173a63;
        }

        .business-hours-preference-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          margin-top: -4px;
        }

        .business-hours-preference-actions button {
          min-height: 40px;
          padding: 7px 10px;
          border: 1px solid rgba(23, 58, 99, 0.18);
          border-radius: 9px;
          background: #f4f7fa;
          color: #294766;
          font: inherit;
          font-size: 0.84rem;
          font-weight: 850;
          cursor: pointer;
        }

        .business-hours-preference-actions button.is-secondary {
          background: #fff;
          color: #718398;
        }

        .business-hours-preference-actions span {
          color: #61778d;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .business-hours-default-note {
          margin: -3px 0 0;
          color: #61778d;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .business-hours-advanced {
          border-top: 1px solid rgba(19, 38, 70, 0.08);
          padding-top: 10px;
        }

        .business-hours-advanced summary {
          min-height: 44px;
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #526a85;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .business-hours-advanced-body {
          display: grid;
          gap: 12px;
          padding-top: 8px;
        }

        .business-hours-secondary {
          grid-column: 1 / -1;
          display: grid;
          gap: 8px;
          padding: 2px 0 0;
        }

        .business-hours-error {
          margin: 0;
          color: #9a3f3f;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .business-hours-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .business-hours-result > p:first-child {
          margin: 0;
          color: #77899b;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .business-hours-date {
          margin-top: 7px;
          color: #0c1931;
          font-size: clamp(3.2rem, 6.8vw, 6.4rem);
          font-weight: 950;
          line-height: 0.98;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .business-hours-time-block {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 10px;
          align-self: center;
          margin-top: 16px;
          padding: 11px 18px 12px;
          border: 1px solid rgba(23, 58, 99, 0.14);
          border-radius: 14px;
          background: #eef4f8;
          color: #173a63;
        }

        .business-hours-time-block span {
          font-size: 0.88rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .business-hours-time-block strong {
          font-size: clamp(2.2rem, 4.7vw, 4rem);
          font-weight: 950;
          line-height: 0.95;
          letter-spacing: -0.035em;
        }

        .business-hours-weekday {
          margin-top: 14px;
          color: #536b85;
          font-size: 1.15rem;
          font-weight: 850;
        }

        .business-hours-rule {
          margin: 12px 0 0;
          color: #667c92;
          font-size: 1rem;
          font-weight: 650;
          line-height: 1.45;
        }

        .business-hours-empty {
          margin: auto;
          color: #7a8999;
        }

        @media (max-width: 760px) {
          .business-hours-hero,
          .business-hours-workspace {
            width: calc(100% - 20px);
          }

          .business-hours-hero {
            margin-top: 18px;
          }

          .business-hours-hero h1 {
            font-size: clamp(2.1rem, 10vw, 2.9rem);
          }

          .business-hours-hero > p:last-child {
            margin-top: 9px;
            font-size: 0.96rem;
            line-height: 1.45;
          }

          .business-hours-workspace {
            grid-template-columns: 1fr;
          }

          .business-hours-form {
            order: 1;
          }

          .business-hours-result {
            order: 2;
          }

          .business-hours-secondary {
            order: 3;
            padding-top: 2px;
          }

          .business-hours-presets button,
          .business-hours-workday-presets button,
          .business-hours-preference-actions button {
            min-height: 44px;
          }

          .business-hours-date {
            font-size: clamp(3rem, 14vw, 4.8rem);
          }

          .business-hours-time-block {
            gap: 8px;
            margin-top: 13px;
            padding: 10px 14px 11px;
          }

          .business-hours-time-block span {
            font-size: 0.8rem;
          }

          .business-hours-time-block strong {
            font-size: clamp(2rem, 10vw, 3.15rem);
          }

          .business-hours-weekday {
            font-size: 1.08rem;
          }

          .business-hours-rule {
            font-size: 0.96rem;
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
      title: 'Return Window Calculator - What Is My Last Day to Return an Item? | WhenIsDue',
      description: 'Enter the purchase or delivery date and return window to see the last day to return an item. Supports common 7, 14, 30, 60 and 90-day windows.',
      openGraphDescription: 'Enter a purchase or delivery date and instantly see the last day of the return window.',
      twitterDescription: 'Find the last day to return an item from the purchase or delivery date.',
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

  if (
    route === 'calculators' ||
    route === 'business-days-between' ||
    route === 'business-hours-deadline' ||
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

function formatCalendarDistance(daysRemaining: number): string {
  const days = Math.abs(daysRemaining)
  const label = days === 1 ? 'calendar day' : 'calendar days'

  if (daysRemaining < 0) {
    return `${days} ${label} overdue`
  }

  return `${daysRemaining} ${daysRemaining === 1 ? 'calendar day' : 'calendar days'} away`
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
