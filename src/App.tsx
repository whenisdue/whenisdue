import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  type CalculatorMode,
  type InvoiceTerm,
  type PlainDate,
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
const titleMaxLength = 80

type RouteName = 'home' | 'business-days'

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
    document.title = route === 'business-days'
      ? 'Business Days Calculator — WhenIsDue'
      : 'WhenIsDue — Simple Due Date Calculator'
  }, [route])

  function navigate(path: string) {
    window.history.pushState(null, '', path)
    setRoute(getRouteFromPath(path))
    window.scrollTo({ top: 0 })
  }

  if (route === 'business-days') {
    return <BusinessDaysPage onNavigate={navigate} />
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
      </section>

      <SiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Always check the original terms or official calendar when a deadline matters."
      />
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
        <a href="#">About</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Contact</a>
        <a
          href="/business-days-calculator"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/business-days-calculator')
          }}
        >
          Business Days Calculator
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

  return 'home'
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
