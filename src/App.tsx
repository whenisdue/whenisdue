import { useEffect, useMemo, useState } from 'react'
import './App.css'
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

type RouteName =
  | 'home'
  | 'business-days'
  | 'free-trial'
  | 'return-window'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'

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
    document.title = getDocumentTitle(route)
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

  if (route === 'about' || route === 'privacy' || route === 'terms' || route === 'contact') {
    return <StaticPage route={route} onNavigate={navigate} />
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

  const today = useMemo(() => getTodayPlainDate(currentTime), [currentTime])
  const parsedStartDate = parsePlainDate(startDate)
  const amount = parseInteger(dayAmount)
  const validationMessage = getValidationMessage(mode, parsedStartDate, amount, title)
  const canCalculate = parsedStartDate !== null && (mode === 'invoice' || amount !== null) && !validationMessage
  const safeAmount = amount ?? 0
  const dueDate = canCalculate && parsedStartDate
    ? getDueDateForMode(mode, parsedStartDate, safeAmount, invoiceTerm)
    : null
  const cancelByDate = mode === 'trial' && dueDate ? getDueDateForMode('calendar', dueDate, -1, invoiceTerm) : null
  const daysRemaining = dueDate ? daysBetween(today, dueDate) : 0
  const statusText = dueDate ? getStatusText(daysRemaining) : 'Enter a valid date'

  useEffect(() => {
    if (!isCustomTitle) {
      setTitle(getDefaultTitle(mode))
    }
  }, [isCustomTitle, mode])

  const amountLabel = getAmountLabel(mode)
  const canSave = Boolean(dueDate && title.trim() && !validationMessage)
  const sortedSavedDeadlines = useMemo(
    () => [...savedDeadlines].sort(compareSavedDeadlines),
    [savedDeadlines],
  )
  const nextDueDeadline = useMemo(
    () => getNextDueDeadline(savedDeadlines, today),
    [savedDeadlines, today],
  )

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
    setStorageMessage(null)
    setTitle(getDefaultTitle(mode))
    setIsCustomTitle(false)
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

  return (
    <main className="page-shell home-page">
      <section className="intro" aria-labelledby="homepage-title">
        <IdentityRow currentTime={currentTime} />
        <h1 id="homepage-title">When is it due?</h1>
        <p className="subtitle">
          Turn calendar days, business days, invoice terms, free trials, and return windows into exact dates.
        </p>
        <p className="intro-note">
          Calculate an exact due date, then save it in this browser for quick reference.
        </p>
      </section>

      <a
        className="popular-calculator-card"
        href="/business-days-calculator"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/business-days-calculator')
        }}
      >
        <span>Popular calculator</span>
        <strong>Business Days Calculator</strong>
        <em>Add business days to a start date. Weekends are skipped automatically.</em>
        <b>Open calculator →</b>
      </a>

      <section className="workspace" aria-label="Deadline calculator and saved due dates">
        <form className="calculator-card" onSubmit={(event) => event.preventDefault()}>
          <div className="card-heading">
            <h2>Deadline calculator</h2>
            <p>Choose a start date and deadline type.</p>
          </div>

          <label className="field start-field">
            <span>{getStartDateLabel(mode)}</span>
            <input
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <fieldset className="field mode-field">
            <legend>Mode</legend>
            <div className="mode-grid">
              {modes.map((modeOption) => (
                <label className="mode-option" key={modeOption}>
                  <input
                    type="radio"
                    name="mode"
                    value={modeOption}
                    checked={mode === modeOption}
                    onChange={() => {
                      setMode(modeOption)
                    }}
                  />
                  <span>{modeLabels[modeOption]}</span>
                </label>
              ))}
            </div>
            <p className="mode-note">{getModeNote(mode)}</p>
          </fieldset>

          {mode === 'invoice' ? (
            <label className="field value-field">
              <span>Invoice term</span>
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
            <label className="field value-field">
              <span>{amountLabel}</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max={getAmountLimit(mode)}
                value={dayAmount}
                onChange={(event) => setDayAmount(event.target.value)}
              />
            </label>
          )}

          <p className="current-mode">
            <span>Mode</span>
            <strong>{modeLabels[mode]}</strong>
          </p>

          <section className={`result-panel ${daysRemaining < 0 ? 'is-overdue' : ''}`}>
            <p className="result-label">Answer</p>
            {dueDate ? (
              <>
                <p className="due-date">{formatPlainDate(dueDate)}</p>
                {mode === 'business' ? (
                  <div className="result-meta result-meta-stack">
                    <span>{formatWeekday(dueDate)}</span>
                    <span>{formatBusinessDistance(safeAmount)} from start date</span>
                    <span className={`status-badge ${getUrgencyClass(daysRemaining)}`}>
                      {formatCalendarDistance(daysRemaining)}
                    </span>
                  </div>
                ) : (
                  <div className="result-meta">
                    <span>{formatWeekday(dueDate)}</span>
                    <span className={`status-badge ${getUrgencyClass(daysRemaining)}`}>
                      {statusText}
                    </span>
                  </div>
                )}
                {cancelByDate ? (
                  <p className="cancel-date">
                    Suggested cancel-by date: <strong>{formatPlainDate(cancelByDate)}</strong>
                  </p>
                ) : null}
              </>
            ) : (
              <p className="result-meta">{validationMessage ?? 'Enter a valid local calendar date.'}</p>
            )}
          </section>

          <label className="field title-field">
            <span>Title</span>
            <input
              maxLength={titleMaxLength}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setIsCustomTitle(true)
              }}
            />
          </label>

          <button className="primary-button" type="button" disabled={!canSave} onClick={saveDeadline}>
            Save to My due dates
          </button>
          {storageMessage ? <p className="form-message">{storageMessage}</p> : null}
        </form>

        <section className="dashboard" aria-labelledby="saved-title">
          <div className="card-heading">
            <h2 id="saved-title">My due dates</h2>
            <p>Saved in this browser on this device.</p>
          </div>

          {nextDueDeadline ? (
            <NextDueSpotlight
              deadline={nextDueDeadline}
              onToggleDone={toggleDone}
            />
          ) : null}

          {savedDeadlines.length > 0 ? (
            <ul className="deadline-list">
              {sortedSavedDeadlines.map((deadline) => (
                <SavedDeadlineItem
                  deadline={deadline}
                  key={deadline.id}
                  today={today}
                  onDelete={deleteDeadline}
                  onToggleDone={toggleDone}
                />
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No saved due dates yet. Save a result to keep it here.</p>
            </div>
          )}
        </section>
      </section>

      <section className="popular-calculators" aria-labelledby="popular-calculators-title">
        <div className="section-heading">
          <h2 id="popular-calculators-title">Popular calculators</h2>
          <p>Quick tools for common due dates.</p>
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
        </div>
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
        <IdentityRow currentTime={currentTime} onNavigate={onNavigate} showHomeLink />
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
              min="0"
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
  const currentTime = useCurrentMinute()
  const [startDate, setStartDate] = useState(todayInputValue)
  const [trialLength, setTrialLength] = useState('7')

  const parsedStartDate = parsePlainDate(startDate)
  const parsedTrialLength = parseInteger(trialLength)
  const validationMessage = getTrialValidationMessage(parsedStartDate, parsedTrialLength)
  const trialEndDate = parsedStartDate && parsedTrialLength !== null && !validationMessage
    ? addCalendarDays(parsedStartDate, parsedTrialLength)
    : null
  const cancelByDate = trialEndDate ? addCalendarDays(trialEndDate, -1) : null
  const calendarDaysFromStart = parsedStartDate && trialEndDate ? daysBetween(parsedStartDate, trialEndDate) : 0

  return (
    <main className="page-shell free-trial-page">
      <section className="intro" aria-labelledby="free-trial-title">
        <IdentityRow currentTime={currentTime} onNavigate={onNavigate} showHomeLink />
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
              min="0"
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
      </section>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  )
}

function ReturnWindowPage({ onNavigate }: NavigationProps) {
  const currentTime = useCurrentMinute()
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue)
  const [returnWindow, setReturnWindow] = useState('30')

  const parsedPurchaseDate = parsePlainDate(purchaseDate)
  const parsedReturnWindow = parseInteger(returnWindow)
  const validationMessage = getReturnWindowValidationMessage(parsedPurchaseDate, parsedReturnWindow)
  const returnDeadline = parsedPurchaseDate && parsedReturnWindow !== null && !validationMessage
    ? addCalendarDays(parsedPurchaseDate, Math.max(parsedReturnWindow - 1, 0))
    : null
  const calendarDaysFromPurchase = parsedPurchaseDate && returnDeadline
    ? daysBetween(parsedPurchaseDate, returnDeadline)
    : 0

  return (
    <main className="page-shell return-window-page">
      <section className="intro" aria-labelledby="return-window-title">
        <IdentityRow currentTime={currentTime} onNavigate={onNavigate} showHomeLink />
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
              min="0"
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
  const currentTime = useCurrentMinute()
  const page = getStaticPageContent(route)

  return (
    <main className="page-shell static-page">
      <section className="intro" aria-labelledby={`${route}-title`}>
        <IdentityRow currentTime={currentTime} onNavigate={onNavigate} showHomeLink />
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
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
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

type IdentityRowProps = {
  currentTime: Date
  onNavigate?: (path: string) => void
  showHomeLink?: boolean
}

function IdentityRow({ currentTime, onNavigate, showHomeLink = false }: IdentityRowProps) {
  const siteMark = showHomeLink ? (
    <a
      className="site-mark site-mark-link"
      href="/"
      onClick={(event) => {
        event.preventDefault()
        onNavigate?.('/')
      }}
    >
      WHENISDUE.COM
    </a>
  ) : (
    <p className="site-mark">WHENISDUE.COM</p>
  )

  return (
    <div className="identity-row">
      {siteMark}
      <div className="local-time" aria-label="Current local time">
        <span>Local time</span>
        <time dateTime={currentTime.toISOString()}>{formatCurrentTime(currentTime)}</time>
      </div>
    </div>
  )
}

type SiteFooterProps = NavigationProps & {
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
        <a
          href="/business-days-calculator"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/business-days-calculator')
          }}
        >
          Business Days Calculator
        </a>
        <a
          href="/free-trial-calculator"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/free-trial-calculator')
          }}
        >
          Free Trial Calculator
        </a>
        <a
          href="/return-window-calculator"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/return-window-calculator')
          }}
        >
          Return Window Calculator
        </a>
      </div>
      <p>
        Saved items stay in this browser only. If you clear browser data, use private browsing, or switch devices, they may not be there later.
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
    <section className={`next-due ${categoryClass} ${isUrgent ? 'is-urgent' : ''}`}>
      <div className="next-due-kicker">
        <p className="next-due-label">Next due</p>
        <span>Closest active deadline</span>
      </div>
      <h3>{deadline.title}</h3>
      <p className="next-due-meta">
        <span className={`category-pill ${categoryClass}`}>{modeLabels[deadline.category]}</span>
        <span>Due {formatPlainDate(deadline.dueDate)}</span>
      </p>
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
    <li className={`deadline-item ${urgencyClass} ${categoryClass} ${deadline.done ? 'is-done' : ''}`}>
      <div>
        <h3>{deadline.title}</h3>
        <p>
          <span className={`category-pill ${categoryClass}`}>{modeLabels[deadline.category]}</span>
          <span>{dueDate ? formatPlainDate(dueDate) : 'Invalid date'}</span>
        </p>
      </div>
      <div className="deadline-actions">
        <span className={`status-badge ${urgencyClass}`}>{status}</span>
        <button type="button" onClick={() => onToggleDone(deadline.id)}>
          {deadline.done ? 'Undo' : 'Done'}
        </button>
        <button type="button" onClick={() => onDelete(deadline.id)}>
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

function formatCurrentTime(date: Date): string {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  const calendarDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)

  return `${calendarDate} · ${time}`
}

function getRouteFromPath(pathname: string): RouteName {
  if (pathname === '/business-days-calculator') {
    return 'business-days'
  }

  if (pathname === '/free-trial-calculator') {
    return 'free-trial'
  }

  if (pathname === '/return-window-calculator') {
    return 'return-window'
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

  return 'home'
}

function getDocumentTitle(route: RouteName): string {
  if (route === 'business-days') {
    return 'Business Days Calculator — WhenIsDue'
  }

  if (route === 'free-trial') {
    return 'Free Trial Calculator — WhenIsDue'
  }

  if (route === 'return-window') {
    return 'Return Window Calculator — WhenIsDue'
  }

  if (route === 'about') {
    return 'About — WhenIsDue'
  }

  if (route === 'privacy') {
    return 'Privacy Policy — WhenIsDue'
  }

  if (route === 'terms') {
    return 'Terms of Use — WhenIsDue'
  }

  if (route === 'contact') {
    return 'Contact — WhenIsDue'
  }

  return 'WhenIsDue — Simple Due Date Calculator'
}

type StaticPageContent = {
  title: string
  paragraphs: string[]
  email?: string
}

function getStaticPageContent(route: StaticPageRoute): StaticPageContent {
  if (route === 'about') {
    return {
      title: 'About WhenIsDue',
      paragraphs: [
        'WhenIsDue is a simple independent due date calculator. It helps people calculate calendar days, business days, invoice terms, free trial dates, return windows, and other everyday deadlines.',
        'Saved due dates stay in your browser on your device. WhenIsDue is not an official government, legal, financial, or medical source.',
      ],
    }
  }

  if (route === 'privacy') {
    return {
      title: 'Privacy Policy',
      paragraphs: [
        'This MVP does not require an account, does not ask for personal information, and does not upload saved due dates.',
        'Saved due dates are stored locally in your browser. Clearing browser data, using private browsing, or switching devices may remove or hide saved due dates.',
        'If analytics or ads are added later, this page will be updated.',
      ],
    }
  }

  if (route === 'terms') {
    return {
      title: 'Terms of Use',
      paragraphs: [
        'WhenIsDue provides general date calculation tools for convenience only.',
        'You should verify important deadlines with official documents, contracts, schools, employers, agencies, or service providers.',
        'WhenIsDue does not provide legal, financial, medical, tax, immigration, or professional advice.',
      ],
    }
  }

  return {
    title: 'Contact',
    paragraphs: [
      'For questions, corrections, or feedback about WhenIsDue, contact:',
    ],
    email: 'bjesguerra2025@gmail.com',
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

function getAmountLabel(mode: CalculatorMode): string {
  if (mode === 'business') {
    return 'Business days'
  }

  if (mode === 'trial') {
    return 'Trial length in days'
  }

  if (mode === 'return') {
    return 'Return window days'
  }

  return 'Calendar days'
}

function getStartDateLabel(mode: CalculatorMode): string {
  if (mode === 'trial') {
    return 'Signup date'
  }

  if (mode === 'return') {
    return 'Delivery date'
  }

  if (mode === 'invoice') {
    return 'Invoice date'
  }

  return 'Start date'
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

    if (amount === null || amount < 0 || amount > limit) {
      return `${getAmountLabel(mode)} must be a whole number from 0 to ${limit}.`
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

  if (businessDays === null || businessDays < 0 || businessDays > 2600) {
    return 'Business days must be a whole number from 0 to 2600.'
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

  if (trialLength === null || trialLength < 0 || trialLength > limit) {
    return `Trial length must be a whole number from 0 to ${limit}.`
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

  if (returnWindow === null || returnWindow < 0 || returnWindow > limit) {
    return `Return window must be a whole number from 0 to ${limit}.`
  }

  return null
}

function getModeNote(mode: CalculatorMode): string {
  if (mode === 'business') {
    return 'Counts Monday to Friday only. Public holidays are not removed in this MVP.'
  }

  if (mode === 'invoice') {
    return 'Net terms usually use calendar days from the invoice date unless your agreement says otherwise.'
  }

  if (mode === 'trial') {
    return 'Most trial periods count calendar days.'
  }

  if (mode === 'return') {
    return 'Check whether the store counts from purchase, shipping, or delivery date.'
  }

  return 'Counts every day, including weekends.'
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
