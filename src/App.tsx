import { useEffect, useMemo, useState } from 'react'
import './App.css'
import VaWorkspacePage from './va/VaWorkspacePage'
import {
  type CalculatorMode,
  type InvoiceTerm,
  type PlainDate,
  addCalendarDays,
  addBusinessDays,
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
const businessDayQuickPicks = [1, 5, 10, 15, 30]
const trialLengthQuickPicks = [7, 14, 30]
const returnWindowQuickPicks = [7, 14, 30, 60, 90]
const titleMaxLength = 80
const positiveWholeNumberMessage = 'Enter a whole number greater than 0.'

type RouteName =
  | 'home'
  | 'business-days'
  | 'free-trial'
  | 'return-window'
  | 'invoice-due-date'
  | 'workspace'
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
    setRoute(getRouteFromPath(path))
    window.scrollTo({ top: 0 })
  }

  if (route === 'business-days') {
    return <BusinessDaysPage onNavigate={navigate} />
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

  if (route === 'workspace') {
    return <VaWorkspacePage onNavigate={navigate} />
  }

  if (route === 'about' || route === 'privacy' || route === 'terms' || route === 'contact') {
    return <StaticPage route={route} onNavigate={navigate} />
  }

  if (route === 'not-found') {
    return <NotFoundPage onNavigate={navigate} />
  }

  return <HomePage onNavigate={navigate} />
}


function HomePage({ onNavigate }: NavigationProps) {
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
    function handleHomeHistoryFocus() {
      if (window.location.pathname === '/' && !window.location.hash) {
        window.requestAnimationFrame(() => {
          document.getElementById('homepage-title')?.focus({ preventScroll: true })
        })
      }
    }

    window.addEventListener('popstate', handleHomeHistoryFocus)

    return () => {
      window.removeEventListener('popstate', handleHomeHistoryFocus)
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
    trial: { title: 'Free trial', helper: 'Know when to cancel' },
    return: { title: 'Return', helper: 'Find the last return day' },
  }

  function focusHomeSection(sectionId: string, headingId: string) {
    const nextHash = `#${sectionId}`

    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', `/${nextHash}`)
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    window.setTimeout(() => {
      const heading = document.getElementById(headingId)
      heading?.focus({ preventScroll: true })
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
    <main className="page-shell home-page friendly-home">
      <a className="skip-to-calculator" href="#calculator" onClick={(event) => { event.preventDefault(); focusHomeSection('calculator', 'calculator-heading') }}>Skip to calculator</a>
      <section className="dual-intent-hero" aria-labelledby="homepage-title">
        <IdentityRow onNavigate={onNavigate} />

        <div className="dual-intent-grid">
          <div className="dual-intent-copy">
            <p className="friendly-eyebrow">
              <span aria-hidden="true">✓</span>
              Two simple ways to stay ahead of a deadline
            </p>
            <h1 id="homepage-title" tabIndex={-1}>Calculate a due date—or manage every client deadline.</h1>
            <p className="friendly-subtitle">
              Get a quick answer immediately, or open a private VA workspace for tasks,
              follow-ups, waiting items, and overdue work.
            </p>

            <div className="dual-intent-actions">
              <a
                className="calculator-primary-choice"
                href="#calculator"
                onClick={(event) => {
                  event.preventDefault()
                  focusHomeSection('calculator', 'calculator-heading')
                }}
              >
                Calculate a due date
              </a>
              <a
                className="workspace-secondary-choice"
                href="/workspace"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/workspace')
                }}
              >
                Manage client deadlines
              </a>
            </div>

            <p className="workspace-trust-line">
              Free calculators <span aria-hidden="true">·</span> Private VA account
              <span aria-hidden="true">·</span> Export your workspace anytime
            </p>
          </div>

          <div className="dual-intent-proof" aria-label="WhenIsDue product choices">
            <article className="intent-proof-card proof-calculator">
              <span className="intent-proof-icon" aria-hidden="true">◷</span>
              <div>
                <p>Quick utility</p>
                <h2>Find the exact date</h2>
                <span>Calendar days, business days, invoices, trials, and returns.</span>
              </div>
            </article>
            <article className="intent-proof-card proof-workspace">
              <span className="intent-proof-icon" aria-hidden="true">✓</span>
              <div>
                <p>Daily workspace</p>
                <h2>Know what needs attention</h2>
                <span>Keep every client’s next action, due date, and follow-up together.</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="calculator" className="friendly-calculator calculator-secondary-section" aria-label="Quick deadline calculators">
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
                    Suggested safe cancel-by date:
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
            Save date
          </button>
          {storageMessage ? <p className="form-message save-message">{storageMessage}</p> : null}
        </section>
      </section>

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
              <small>Find a safe cancel-by date</small>
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
        <span><b aria-hidden="true">○</b> VA Workspace uses a private account</span>
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}


function BusinessDaysPage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const [startDate, setStartDate] = useState(todayInputValue)
  const [businessDays, setBusinessDays] = useState('10')
  const [title, setTitle] = useState(getDefaultTitle('business'))
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>(() => loadSavedDeadlines())
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  const parsedStartDate = parsePlainDate(startDate)
  const parsedBusinessDays = parseInteger(businessDays)
  const validationMessage = getBusinessDaysValidationMessage(parsedStartDate, parsedBusinessDays, title)
  const dueDate = parsedStartDate && parsedBusinessDays !== null && !validationMessage
    ? addBusinessDays(parsedStartDate, parsedBusinessDays)
    : null
  const calendarDaysAway = parsedStartDate && dueDate ? daysBetween(parsedStartDate, dueDate) : 0
  const daysRemaining = dueDate ? daysBetween(today, dueDate) : 0
  const canSave = Boolean(dueDate && title.trim() && !validationMessage)

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
      <section className="intro business-intro" aria-labelledby="business-days-title">
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
        <h1 id="business-days-title">Business Days Calculator</h1>
        <p className="subtitle">
          Add business days to a start date. Weekends are skipped automatically.
        </p>
        <p className="intro-note">
          This calculator counts Monday to Friday only. Public holidays are not removed.
        </p>
      </section>

      <section className="business-workspace" aria-label="Business days calculator">
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
              onChange={(event) => setStartDate(event.target.value)}
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
              onChange={(event) => setBusinessDays(event.target.value)}
            />
            <span className="quick-picks" aria-label="Quick business day values">
              {businessDayQuickPicks.map((quickPick) => (
                <button
                  className={businessDays === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => setBusinessDays(String(quickPick))}
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
              <p className="result-note">Weekends skipped. Public holidays are not removed.</p>
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
            </>
          ) : (
            <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
          )}
        </section>
      </section>

      <section className="business-content" aria-label="Business days help">
        <article>
          <h2>How business days are counted</h2>
          <p>
            Business days are counted Monday through Friday. Saturdays and Sundays are skipped. This version does not remove public holidays, bank holidays, or company closures.
          </p>
        </article>

        <article>
          <h2>Examples</h2>
          <ul>
            <li>Start Friday + 1 business day = Monday</li>
            <li>Start Monday + 5 business days = next Monday</li>
            <li>Start Thursday + 2 business days = Monday</li>
          </ul>
        </article>

        <article>
          <h2>FAQ</h2>
          <dl>
            <dt>What counts as a business day?</dt>
            <dd>In this calculator, Monday through Friday count as business days. Saturdays and Sundays are skipped.</dd>
            <dt>Are public holidays removed?</dt>
            <dd>No. This calculator skips weekends only. Check your local holiday calendar if holidays matter.</dd>
            <dt>Why does one business day after Friday land on Monday?</dt>
            <dd>Saturday and Sunday are not counted, so Monday is the next business day.</dd>
            <dt>What is the difference between business days and calendar days?</dt>
            <dd>Calendar days count every day. Business days skip weekends.</dd>
          </dl>
        </article>

        <article>
          <h2>When to use this calculator</h2>
          <p>
            Use this calculator when a deadline is measured in business days instead of calendar days. It can help with work tasks, invoice follow-ups, school forms, shipping estimates, application timelines, and simple planning. This version skips weekends only, so always check official terms if holidays or local rules matter.
          </p>
        </article>

        <article>
          <h2>Business days vs calendar days</h2>
          <p>
            Calendar days count every day on the calendar. Business days usually count Monday through Friday and skip weekends. That is why 10 business days can be more than 10 calendar days away.
          </p>
        </article>
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always check the original terms or official calendar when a deadline matters."
      />
    </main>
  )
}

function FreeTrialPage({ onNavigate }: NavigationProps) {
  const [startDate, setStartDate] = useState(todayInputValue)
  const [trialLength, setTrialLength] = useState('7')
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
      <section className="intro" aria-labelledby="free-trial-title">
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
        <h1 id="free-trial-title">Free Trial Calculator</h1>
        <p className="subtitle">
          Find when a free trial ends and the last safe day to cancel before renewal.
        </p>
        <p className="intro-note">
          Date-only planning for trial periods that count calendar days.
        </p>
      </section>

      <section className="business-workspace" aria-label="Free trial calculator">
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <div className="card-heading">
            <h2>Calculate trial dates</h2>
            <p>Enter the trial start date and trial length.</p>
          </div>

          <label className="field start-field">
            <span>Trial start date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
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
              onChange={(event) => setTrialLength(event.target.value)}
            />
            <span className="quick-picks" aria-label="Quick trial length values">
              {trialLengthQuickPicks.map((quickPick) => (
                <button
                  className={trialLength === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => setTrialLength(String(quickPick))}
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
                <span>Last day to cancel: {formatPlainDate(cancelByDate)}</span>
                <span className="status-badge status-comfortable">
                  {calendarDaysFromStart} {calendarDaysFromStart === 1 ? 'calendar day' : 'calendar days'} from the start date
                </span>
              </div>
              <p className="result-note">Always check the service terms for exact renewal timing.</p>
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
            </>
          ) : (
            <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
          )}
        </section>
      </section>

      <section className="business-content" aria-label="Free trial help">
        <article>
          <h2>How this calculator works</h2>
          <p>
            Enter the day your trial starts and the number of days in the trial. The calculator shows the trial end date and the last day to cancel before the renewal date. Always check the company's official cancellation terms because some services renew earlier or use a specific billing time.
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
            Suppose a 14-day trial starts on May 1. Using this calculator's date-addition method, the trial end date is May 15 and the suggested cancel-by date is May 14. This treats the start date as day zero. A service may instead count the signup date as day one, so its displayed renewal date should take priority.
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
            <dt>Why is the suggested cancel-by date one day earlier?</dt>
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
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue)
  const [returnWindow, setReturnWindow] = useState('30')
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
  const calendarDaysFromPurchase = parsedPurchaseDate && returnDeadline
    ? daysBetween(parsedPurchaseDate, returnDeadline)
    : 0
  const canSave = Boolean(returnDeadline && parsedPurchaseDate && !validationMessage && !titleValidationMessage)

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
      <section className="intro" aria-labelledby="return-window-title">
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
        <h1 id="return-window-title">Return Window Calculator</h1>
        <p className="subtitle">
          Find the last calendar day to return an item.
        </p>
        <p className="intro-note">
          Date-only planning for common purchase return windows.
        </p>
      </section>

      <section className="business-workspace" aria-label="Return window calculator">
        <form className="calculator-card business-calculator" onSubmit={(event) => event.preventDefault()}>
          <div className="card-heading">
            <h2>Calculate return deadline</h2>
            <p>Enter the purchase date and return window.</p>
          </div>

          <label className="field start-field">
            <span>Purchase date</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
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
              onChange={(event) => setReturnWindow(event.target.value)}
            />
            <span className="quick-picks" aria-label="Quick return window values">
              {returnWindowQuickPicks.map((quickPick) => (
                <button
                  className={returnWindow === String(quickPick) ? 'is-selected' : ''}
                  key={quickPick}
                  type="button"
                  onClick={() => setReturnWindow(String(quickPick))}
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
                <span>Last day to return: {formatPlainDate(returnDeadline)}</span>
                <span className="status-badge status-comfortable">
                  {calendarDaysFromPurchase} {calendarDaysFromPurchase === 1 ? 'calendar day' : 'calendar days'} from purchase date
                </span>
              </div>
              <p className="result-note">
                Check the store's official return policy because some return windows start on delivery date, not purchase date.
              </p>
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
            </>
          ) : (
            <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
          )}
        </section>
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

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}

function InvoiceDueDatePage({ onNavigate }: NavigationProps) {
  const [invoiceDate, setInvoiceDate] = useState(todayInputValue)
  const [invoiceTerm, setInvoiceTerm] = useState<InvoiceTerm>('net30')
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
      <section className="intro" aria-labelledby="invoice-due-date-title">
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
        <h1 id="invoice-due-date-title">Invoice Due Date Calculator</h1>
        <p className="subtitle">
          Calculate invoice due dates from common payment terms.
        </p>
        <p className="intro-note">
          Date-only planning for Net 7, 15, 30, 45, 60, 90, and end-of-month invoices.
        </p>
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
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </label>

          <label className="field value-field">
            <span>Payment terms</span>
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

          {validationMessage ? <p className="form-message">{validationMessage}</p> : null}
        </form>

        <section className="result-panel invoice-due-date-result" aria-live="polite">
          <p className="result-label">Invoice due date</p>
          {invoiceDueDate ? (
            <>
              <p className="due-date">{formatPlainDate(invoiceDueDate)}</p>
              <div className="result-meta result-meta-stack">
                <span>Invoice due date: {formatPlainDate(invoiceDueDate)}</span>
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
                <button className="primary-button" type="button" disabled={!canSave} onClick={saveInvoiceDeadline}>
                  Save to My due dates
                </button>
                {storageMessage ? <p className="form-message">{storageMessage}</p> : null}
              </div>
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
            <li>Net 7</li>
            <li>Net 15</li>
            <li>Net 30</li>
            <li>Net 45</li>
            <li>Net 60</li>
            <li>Net 90</li>
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

      <SiteFooter onNavigate={onNavigate} />
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
            <span>Find the last safe day to cancel before renewal.</span>
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
  function openHomeSection(sectionId: 'calculator' | 'saved-dates' | 'more-tools') {
    if (!onNavigate) {
      return
    }

    const focusTargetId =
      sectionId === 'calculator'
        ? 'calculator-heading'
        : sectionId === 'saved-dates'
          ? 'saved-title'
          : 'popular-calculators-title'

    if (window.location.pathname !== '/') {
      onNavigate('/')
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.history.pushState(null, '', `/#${sectionId}`)
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })

        window.setTimeout(() => {
          document.getElementById(focusTargetId)?.focus({ preventScroll: true })
        }, 450)
      })
    })
  }

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
    <header className="site-header friendly-site-header">
      <div className="identity-row">
        {siteMark}
        {onNavigate ? (
          <nav className="top-nav friendly-top-nav" aria-label="Main navigation">
            <a
              href="/#calculator"
              onClick={(event) => {
                event.preventDefault()
                openHomeSection('calculator')
              }}
            >
              Calculate
            </a>
            <a
              href="/#saved-dates"
              onClick={(event) => {
                event.preventDefault()
                openHomeSection('saved-dates')
              }}
            >
              Saved dates
            </a>
            <a
              href="/#more-tools"
              onClick={(event) => {
                event.preventDefault()
                openHomeSection('more-tools')
              }}
            >
              More tools
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
    return `The trial ends ${formatWeekday(dueDate)}, ${formatPlainDate(dueDate)}. Suggested cancel-by date: ${formatPlainDate(cancelByDate)}.`
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

  if (pathname === '/business-days-calculator') {
    return 'business-days'
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

  if (pathname === '/workspace') {
    return 'workspace'
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
    route === 'not-found' || route === 'workspace' ? 'noindex, follow' : 'index, follow',
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

  const canonical = getOrCreateCanonicalLink()
  canonical.setAttribute('href', `https://www.whenisdue.com${metadata.path}`)
}

function getRouteMetadata(route: RouteName): RouteMetadata {
  if (route === 'business-days') {
    return {
      title: 'Business Days Calculator - WhenIsDue',
      description: 'Add business days to a start date and find the exact due date while skipping weekends.',
      path: '/business-days-calculator',
    }
  }

  if (route === 'free-trial') {
    return {
      title: 'Free Trial Calculator - WhenIsDue',
      description: 'Find when a free trial ends and the last safe day to cancel before renewal.',
      path: '/free-trial-calculator',
    }
  }

  if (route === 'return-window') {
    return {
      title: 'Return Window Calculator - WhenIsDue',
      description: 'Calculate the last day to return an item based on a purchase date and return window.',
      path: '/return-window-calculator',
    }
  }

  if (route === 'invoice-due-date') {
    return {
      title: 'Invoice Due Date Calculator - WhenIsDue',
      description: 'Calculate invoice due dates from common payment terms like Net 7, Net 15, Net 30, Net 45, and Net 60.',
      path: '/invoice-due-date-calculator',
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
    title: 'WhenIsDue - Client Follow-Up Workspace for Virtual Assistants',
    description: 'A daily client task and follow-up workspace for virtual assistants, with free deadline calculators for quick date planning.',
    openGraphDescription: 'Know what needs attention across every client with a private daily follow-up workspace for virtual assistants.',
    twitterDescription: 'A daily client task and follow-up workspace for virtual assistants.',
    path: '/',
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
            'WhenIsDue provides simple due-date calculators and a separate VA Workspace for organizing client tasks, action dates, follow-ups, waiting items, and completed work.',
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
