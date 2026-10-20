import AnswerFeedback from './AnswerFeedback.tsx'

type ThirtyDaysVsOneMonthGuidePageProps = {
  onNavigate: (path: string) => void
}

const deadlineCalculatorHref =
  '/deadline-calculator?days=30&unit=calendar-days&direction=after&startday=exclude-trigger&endrule=none'

const comparisonRows = [
  {
    start: { label: 'January 15, 2026', date: '2026-01-15', weekday: 'Thursday' },
    days: { label: 'February 14, 2026', date: '2026-02-14', weekday: 'Saturday' },
    month: { label: 'February 15, 2026', date: '2026-02-15', weekday: 'Sunday' },
  },
  {
    start: { label: 'February 1, 2026', date: '2026-02-01', weekday: 'Sunday' },
    days: { label: 'March 3, 2026', date: '2026-03-03', weekday: 'Tuesday' },
    month: { label: 'March 1, 2026', date: '2026-03-01', weekday: 'Sunday' },
  },
  {
    start: { label: 'January 31, 2028', date: '2028-01-31', weekday: 'Monday' },
    days: { label: 'March 1, 2028', date: '2028-03-01', weekday: 'Wednesday' },
    month: { label: 'February 29, 2028', date: '2028-02-29', weekday: 'Tuesday' },
  },
  {
    start: { label: 'March 31, 2026', date: '2026-03-31', weekday: 'Tuesday' },
    days: { label: 'April 30, 2026', date: '2026-04-30', weekday: 'Thursday' },
    month: { label: 'April 30, 2026', date: '2026-04-30', weekday: 'Thursday' },
  },
]

export default function ThirtyDaysVsOneMonthGuidePage({
  onNavigate,
}: ThirtyDaysVsOneMonthGuidePageProps) {
  return (
    <main className="page-shell thirty-month-page">
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

      <article className="thirty-month-shell">
        <header className="thirty-month-hero">
          <p className="thirty-month-eyebrow">Calendar date guide</p>
          <h1>Are 30 Days and One Month the Same?</h1>
          <p className="thirty-month-answer">
            <strong>No.</strong> Thirty days is a fixed number of calendar days.
            One calendar month follows the calendar, so the resulting date can
            be different.
          </p>
          <p className="thirty-month-caveat">
            An actual contract, statutory, or legal deadline depends on its
            wording and the rules that apply. The date arithmetic below is an
            example, not a ruling on a real deadline.
          </p>
        </header>

        <section
          className="thirty-month-primary"
          aria-labelledby="thirty-month-primary-title"
        >
          <div className="thirty-month-primary-heading">
            <p className="thirty-month-eyebrow">Worked example · Day 0</p>
            <h2 id="thirty-month-primary-title">
              Starting date: Saturday, January 31, 2026
            </h2>
          </div>

          <div className="thirty-month-primary-grid">
            <article className="thirty-month-result is-days">
              <span>Add 30 calendar days</span>
              <strong>Monday,</strong>
              <b>March 2, 2026</b>
              <small>No weekend or holiday adjustment</small>
            </article>

            <article className="thirty-month-result is-month">
              <span>Add one calendar month</span>
              <strong>Saturday,</strong>
              <b>February 28, 2026</b>
              <small>Last-valid-day convention</small>
            </article>
          </div>

          <p className="thirty-month-convention">
            For the month result, this guide keeps the same day number in the
            target month. If that date does not exist, it uses that month’s last
            valid day. This is one date-arithmetic convention, not a universal
            deadline rule.
          </p>
        </section>

        <AnswerFeedback />

        <section className="thirty-month-section">
          <h2>Why do the dates differ?</h2>
          <p>
            Calendar days are counted one by one, so adding 30 days always
            advances exactly 30 days from the Day 0 date. Calendar months have
            different lengths. Adding one month moves to the corresponding
            place in the next month under a stated month-addition convention.
          </p>
        </section>

        <section className="thirty-month-section thirty-month-table-section">
          <h2>Compare more dates</h2>
          <p>
            Each 30-day result starts counting after Day 0. Every one-month
            result uses the last-valid-day convention described above.
          </p>

          <table className="thirty-month-table">
            <thead>
              <tr>
                <th scope="col">Start date</th>
                <th scope="col">+30 calendar days</th>
                <th scope="col">+1 calendar month</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.start.date}>
                  <th scope="row">
                    <time dateTime={row.start.date}>
                      <span>{row.start.weekday}</span>
                      {row.start.label}
                    </time>
                  </th>
                  <td>
                    <time dateTime={row.days.date}>
                      <span>{row.days.weekday}</span>
                      {row.days.label}
                    </time>
                  </td>
                  <td>
                    <time dateTime={row.month.date}>
                      <span>{row.month.weekday}</span>
                      {row.month.label}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="thirty-month-section">
          <h2>What happens at month end or in a leap year?</h2>
          <p>
            With this guide’s convention, January 31 moves to February 28 in
            2026, or February 29 in leap year 2028. March 31 moves to April 30
            because April has no 31st. A fixed 30-day count can land later, as
            the January examples show.
          </p>
          <p>
            Date software can implement its own month arithmetic. For example,
            Salesforce documents an <code>ADDMONTHS</code> function that uses
            the last valid day when the target month is shorter. That describes
            Salesforce’s function; it does not define a contract or legal
            deadline. See{' '}
            <a
              href="https://help.salesforce.com/s/articleView?id=formula_examples_dates.htm&language=en_US&type=5"
              target="_blank"
              rel="noreferrer"
            >
              Salesforce’s date formula examples
            </a>
            .
          </p>
        </section>

        <section className="thirty-month-section thirty-month-terms">
          <h2>What if the period is in a contract or legal notice?</h2>
          <p>
            Adding 30 calendar days, adding a calendar month in date software,
            and counting a contractual or statutory “month” are separate
            operations. Follow the exact wording and applicable counting rules.
            Do not assume that “one month” always means the same date next
            month or always means 30 days.
          </p>
          <p>
            For one jurisdiction-specific example, Section 31 of the Philippine
            Administrative Code of 1987 defines a month as 30 days unless it
            refers to a specific calendar month; in that case, it uses the
            number of days in that month. That definition concerns legal
            periods in its own context. It does not decide every contract or
            deadline in every jurisdiction. Read{' '}
            <a
              href="https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/53270"
              target="_blank"
              rel="noreferrer"
            >
              Section 31 in the Supreme Court E-Library
            </a>
            .
          </p>
        </section>

        <section className="thirty-month-calculator">
          <div>
            <p className="thirty-month-eyebrow">Need a specific date?</p>
            <h2>Calculate a 30-day deadline</h2>
            <p>
              The deadline calculator opens with 30 calendar days after the
              start date and the start date excluded from the count. It handles
              day counts, not calendar-month arithmetic.
            </p>
          </div>
          <a
            href={deadlineCalculatorHref}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(deadlineCalculatorHref)
            }}
          >
            Calculate a 30-day deadline <span aria-hidden="true">→</span>
          </a>
        </section>
      </article>

      <style>{`
        .thirty-month-page {
          --month-ink: var(--wid-ink-page);
          --month-muted: var(--wid-muted-page);
          --month-accent: var(--wid-accent-page);
        }

        .thirty-month-shell {
          width: min(100%, 1000px);
          margin: 22px auto 0;
        }

        .thirty-month-hero {
          padding: clamp(30px, 5vw, 54px) clamp(22px, 5vw, 56px);
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 26px;
          background: var(--wid-result-surface);
        }

        .thirty-month-eyebrow {
          margin: 0;
          color: var(--month-accent);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .thirty-month-hero h1 {
          max-width: 850px;
          margin: 8px 0 0;
          color: var(--month-ink);
          font-size: clamp(2.5rem, 5.5vw, 4.6rem);
          line-height: 0.99;
          letter-spacing: -0.05em;
        }

        .thirty-month-answer {
          max-width: 820px;
          margin: 20px 0 0;
          color: #3c5d76;
          font-size: clamp(1.3rem, 2.6vw, 1.9rem);
          font-weight: 650;
          line-height: 1.35;
        }

        .thirty-month-answer strong {
          color: var(--month-ink);
          font-size: 1.25em;
          font-weight: 950;
        }

        .thirty-month-caveat {
          max-width: 790px;
          margin: 14px 0 0;
          color: var(--month-muted);
          font-size: 0.96rem;
          line-height: 1.55;
        }

        .thirty-month-primary {
          margin-top: 14px;
          padding: 24px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 22px;
          background: #faf7f3;
        }

        .thirty-month-primary-heading h2 {
          margin: 5px 0 0;
          color: var(--month-ink);
          font-size: clamp(1.35rem, 2.8vw, 2rem);
          line-height: 1.16;
          letter-spacing: -0.03em;
        }

        .thirty-month-primary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .thirty-month-result {
          padding: 18px 20px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 18px;
          background: #fff;
        }

        .thirty-month-result.is-days {
          background: #eaf4f1;
          border-color: rgba(23, 163, 152, 0.22);
        }

        .thirty-month-result span,
        .thirty-month-result strong,
        .thirty-month-result b,
        .thirty-month-result small {
          display: block;
        }

        .thirty-month-result > span {
          color: #526a82;
          font-size: 0.83rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .thirty-month-result strong {
          margin-top: 12px;
          color: #3c667b;
          font-size: clamp(1.55rem, 3vw, 2.15rem);
          line-height: 1;
        }

        .thirty-month-result b {
          margin-top: 5px;
          color: var(--month-ink);
          font-size: clamp(2rem, 4.5vw, 3.3rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .thirty-month-result small {
          margin-top: 10px;
          color: var(--month-muted);
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .thirty-month-convention {
          margin: 14px 0 0;
          color: #536b80;
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .thirty-month-section {
          margin-top: 24px;
          padding: 0 4px;
        }

        .thirty-month-section h2,
        .thirty-month-calculator h2 {
          margin: 0;
          color: var(--month-ink);
          font-size: clamp(1.4rem, 2.6vw, 1.9rem);
          line-height: 1.15;
          letter-spacing: -0.025em;
        }

        .thirty-month-section p,
        .thirty-month-calculator p {
          max-width: 860px;
          margin: 9px 0 0;
          color: #5e7287;
          line-height: 1.62;
        }

        .thirty-month-section a {
          color: #225f78;
          font-weight: 750;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.18em;
        }

        .thirty-month-table-section {
          padding: 22px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
        }

        .thirty-month-table {
          width: 100%;
          margin-top: 14px;
          border-collapse: collapse;
          table-layout: fixed;
          color: var(--month-ink);
          font-size: 0.88rem;
          line-height: 1.35;
        }

        .thirty-month-table th,
        .thirty-month-table td {
          padding: 10px 9px;
          border-bottom: 1px solid rgba(21, 54, 84, 0.1);
          text-align: left;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        .thirty-month-table thead th {
          color: #506981;
          font-size: 0.78rem;
          font-weight: 900;
        }

        .thirty-month-table tbody th {
          font-weight: 750;
        }

        .thirty-month-table time span {
          display: block;
          color: #728295;
          font-size: 0.76rem;
          font-weight: 650;
        }

        .thirty-month-terms {
          padding: 20px 22px;
          border-radius: 18px;
          background: #f4ece6;
        }

        .thirty-month-calculator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin: 24px 0 8px;
          padding: 22px;
          border: 1px solid rgba(23, 163, 152, 0.2);
          border-radius: 18px;
          background: #eaf4f1;
        }

        .thirty-month-calculator h2 {
          margin-top: 5px;
        }

        .thirty-month-calculator p {
          max-width: 660px;
          font-size: 0.9rem;
        }

        .thirty-month-calculator > a {
          flex: 0 0 auto;
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 12px;
          background: #236e62;
          color: #fff;
          font-size: 0.92rem;
          font-weight: 850;
          text-decoration: none;
        }

        .thirty-month-calculator > a:hover,
        .thirty-month-calculator > a:focus-visible {
          background: #18574e;
        }

        @media (max-width: 760px) {
          .thirty-month-page {
            padding-top: 2px;
          }

          .thirty-month-shell {
            margin-top: 6px;
          }

          .thirty-month-hero {
            padding: 16px;
            border-radius: 22px;
          }

          .thirty-month-hero h1 {
            font-size: clamp(1.85rem, 7.8vw, 2.65rem);
          }

          .thirty-month-answer {
            margin-top: 12px;
            font-size: 1.08rem;
          }

          .thirty-month-caveat {
            margin-top: 12px;
            font-size: 0.88rem;
          }

          .thirty-month-primary {
            padding: 11px 12px;
            border-radius: 18px;
          }

          .thirty-month-primary-grid {
            grid-template-columns: 1fr;
            gap: 4px;
            margin-top: 10px;
          }

          .thirty-month-primary-heading h2 {
            font-size: 1.24rem;
          }

          .thirty-month-result {
            padding: 10px 12px;
          }

          .thirty-month-result strong {
            margin-top: 8px;
          }

          .thirty-month-result small {
            margin-top: 8px;
          }

          .thirty-month-result.is-month small {
            margin-top: 6px;
          }

          .thirty-month-result b {
            font-size: clamp(1.9rem, 9vw, 2.6rem);
          }

          .thirty-month-table-section {
            padding: 17px 11px;
          }

          .thirty-month-table {
            font-size: 0.76rem;
          }

          .thirty-month-table th,
          .thirty-month-table td {
            padding: 9px 5px;
          }

          .thirty-month-table thead th {
            font-size: 0.7rem;
          }

          .thirty-month-terms {
            padding: 18px 16px;
          }

          .thirty-month-calculator {
            align-items: stretch;
            flex-direction: column;
            gap: 14px;
            padding: 18px;
          }

          .thirty-month-calculator > a {
            width: 100%;
          }
        }
      `}</style>
    </main>
  )
}
