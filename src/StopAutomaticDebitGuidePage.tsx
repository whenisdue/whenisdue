import AnswerFeedback from './AnswerFeedback.tsx'

type StopAutomaticDebitGuidePageProps = {
  onNavigate: (path: string) => void
}

export default function StopAutomaticDebitGuidePage({
  onNavigate,
}: StopAutomaticDebitGuidePageProps) {
  return (
    <main className="page-shell stop-debit-page">
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

      <article className="stop-debit-shell">
        <header className="stop-debit-hero">
          <p className="stop-debit-eyebrow">U.S. automatic-payment guide</p>
          <h1>
            How Many Business Days Before Must I Notify My Bank to Stop an
            Automatic Debit?
          </h1>
          <p className="stop-debit-answer">
            <strong>Generally, at least three business days before.</strong>{' '}
            Under U.S. Regulation E, a consumer may stop a covered preauthorized
            electronic fund transfer by notifying the bank or credit union
            orally or in writing at least three business days before the debit
            is scheduled. The financial institution’s own Regulation E
            business-day calendar controls the date.
          </p>
          <p className="stop-debit-caveat">
            A generic Monday–Friday calculation may not give you the date your
            institution will use. Contact it early to confirm its calendar and
            designated way to submit and verify a stop-payment notice.
          </p>
        </header>

        <AnswerFeedback />

        <section className="stop-debit-section">
          <h2>Which automatic debits does the rule cover?</h2>
          <p>
            The three-business-day rule concerns a{' '}
            <strong>preauthorized electronic fund transfer (EFT)</strong> from
            a consumer account. In general, that is a transfer authorized in
            advance to recur at substantially regular intervals without the
            consumer taking a new action each time. See{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/2/"
              target="_blank"
              rel="noreferrer"
            >
              Regulation E’s definition of a preauthorized EFT
            </a>
            .
          </p>
          <p>
            An automatic monthly payment authorized in advance that happens
            without further action can qualify. A one-time payment—or a bill
            payment you initiate each month—does not become a preauthorized EFT
            simply because it uses an electronic service. A recurring debit-card
            payment may require a closer look at how it is processed. Ask your
            financial institution whether Regulation E’s stop-payment procedure
            applies to the specific payment.
          </p>
        </section>

        <section className="stop-debit-section">
          <h2>How do I count backward three business days?</h2>
          <p>
            Regulation E defines a business day by whether the offices of the
            consumer’s financial institution are open to the public for
            substantially all business functions. It is not a universal
            Monday–Friday calendar. A Saturday opening for some teller services
            may not count; the institution may also decide whether an abbreviated
            day qualifies. Read the{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/2/"
              target="_blank"
              rel="noreferrer"
            >
              official business-day definition and interpretation
            </a>
            .
          </p>

          <div className="stop-debit-example">
            <h3>Example with stated assumptions</h3>
            <p>
              Suppose the debit is scheduled for{' '}
              <time dateTime="2026-11-09">Monday, November 9, 2026</time>, and
              the bank treats Monday through Friday as business days, with no
              relevant holidays or closures. Count backward:
            </p>
            <ol>
              <li>
                <time dateTime="2026-11-06">Friday, November 6</time> — first
                business day
              </li>
              <li>
                <time dateTime="2026-11-05">Thursday, November 5</time> —
                second business day
              </li>
              <li>
                <time dateTime="2026-11-04">Wednesday, November 4</time> —
                third business day
              </li>
            </ol>
            <p>
              Under those assumptions, the calendar points to{' '}
              <strong>Wednesday, November 4</strong>. This example is only an
              estimate because your bank’s Regulation E business days may
              differ. Contact it early, use its designated method, and keep a
              record of when you gave notice. A general business-days calculator
              cannot determine your institution’s Regulation E calendar.
            </p>
          </div>
        </section>

        <section className="stop-debit-section">
          <h2>How should I notify the bank?</h2>
          <p>
            Use the bank’s designated stop-payment contact method and keep a
            record of when you gave notice. If you’re unsure whether an online
            message reaches the appropriate team, contact the bank to confirm.
            Regulation E provides that required notices can be effective outside
            normal business hours. State which company and payment you want
            stopped, the scheduled date, and whether you are stopping one
            payment or future payments. Ask what confirmation it will provide
            and whether it charges a fee; keep the bank’s response with your
            records. See the{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/2/"
              target="_blank"
              rel="noreferrer"
            >
              official business-day interpretation
            </a>
            .
          </p>
          <p>
            The CFPB’s{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/a/"
              target="_blank"
              rel="noreferrer"
            >
              model disclosure for preauthorized payments
            </a>{' '}
            says to give the institution time to receive the request at least
            three business days before payment.
          </p>
        </section>

        <section className="stop-debit-section">
          <h2>What does written confirmation mean?</h2>
          <p>
            If you give an oral stop-payment order, the institution may require
            you to confirm it in writing within 14 days. If it requires this, it
            must tell you when you make the oral request and provide the address
            for the confirmation. If you do not provide required confirmation
            within 14 days, the oral order stops being binding. The 14-day
            confirmation is conditional; it applies when the institution
            requires it. See{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/10/"
              target="_blank"
              rel="noreferrer"
            >
              Regulation E §1005.10(c)(2)
            </a>
            .
          </p>
          <p>
            Regulation E’s commentary says a required notice can be effective
            outside normal business hours, but the institution is not required
            to provide a 24-hour phone line. Check which channel the bank
            accepts; do not assume every online message or after-hours call
            reaches the right team. See the{' '}
            <a
              href="https://www.consumerfinance.gov/rules-policy/regulations/1005/2/"
              target="_blank"
              rel="noreferrer"
            >
              official interpretation of “business day”
            </a>
            .
          </p>
        </section>

        <section className="stop-debit-section">
          <h2>Stopping the debit does not cancel the obligation</h2>
          <p>
            A stop-payment order tells the financial institution not to make a
            specified payment. Revoking authorization with the company is a
            separate action. If you are ending recurring payments, contact the
            company to revoke authorization and notify your bank; keep records
            of both requests. Stopping an automatic loan payment does not cancel
            the loan or erase the balance. Read the CFPB’s guides on{' '}
            <a
              href="https://www.consumerfinance.gov/ask-cfpb/how-do-i-stop-automatic-payments-from-my-bank-account-en-2023/"
              target="_blank"
              rel="noreferrer"
            >
              stopping automatic payments from a bank account
            </a>{' '}
            and{' '}
            <a
              href="https://www.consumerfinance.gov/ask-cfpb/how-can-i-stop-a-payday-lender-from-electronically-taking-money-out-of-my-bank-or-credit-union-account-en-1605/"
              target="_blank"
              rel="noreferrer"
            >
              stopping electronic debits by a payday lender
            </a>
            .
          </p>
        </section>

        <section
          className="stop-debit-section stop-debit-related"
          aria-labelledby="stop-debit-related-title"
        >
          <h2 id="stop-debit-related-title">Related WhenIsDue guides</h2>
          <ul>
            <li>
              <a
                href="/do-weekends-count-as-business-days"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/do-weekends-count-as-business-days')
                }}
              >
                Do weekends count as business days?
              </a>
            </li>
            <li>
              <a
                href="/do-public-holidays-count-as-business-days"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/do-public-holidays-count-as-business-days')
                }}
              >
                Do public holidays count as business days?
              </a>
            </li>
            <li>
              <a
                href="/business-days-calculator"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/business-days-calculator')
                }}
              >
                Business Days Calculator
              </a>
              <span>
                {' '}
                — useful for an assumption-based estimate, but it does not know
                which days your financial institution treats as Regulation E
                business days.
              </span>
            </li>
          </ul>
        </section>

        <section
          className="stop-debit-section stop-debit-sources"
          aria-labelledby="stop-debit-sources-title"
        >
          <h2 id="stop-debit-sources-title">Official sources</h2>
          <ul>
            <li>
              <a
                href="https://www.consumerfinance.gov/rules-policy/regulations/1005/10/"
                target="_blank"
                rel="noreferrer"
              >
                12 CFR §1005.10 — Preauthorized transfers
              </a>
            </li>
            <li>
              <a
                href="https://www.consumerfinance.gov/rules-policy/regulations/1005/2/"
                target="_blank"
                rel="noreferrer"
              >
                12 CFR §1005.2 — Definitions
              </a>
            </li>
            <li>
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/how-do-i-stop-automatic-payments-from-my-bank-account-en-2023/"
                target="_blank"
                rel="noreferrer"
              >
                CFPB: How do I stop automatic payments from my bank account?
              </a>
            </li>
            <li>
              <a
                href="https://www.consumerfinance.gov/ask-cfpb/how-can-i-stop-a-payday-lender-from-electronically-taking-money-out-of-my-bank-or-credit-union-account-en-1605/"
                target="_blank"
                rel="noreferrer"
              >
                CFPB: How can I stop a payday lender from electronically taking
                money out of my account?
              </a>
            </li>
            <li>
              <a
                href="https://www.consumerfinance.gov/rules-policy/regulations/1005/a/"
                target="_blank"
                rel="noreferrer"
              >
                Appendix A to Part 1005 — Model Disclosure Clauses and Forms
              </a>
            </li>
          </ul>
        </section>
      </article>

      <style>{`
        .stop-debit-page {
          --stop-debit-ink: var(--wid-ink-page);
          --stop-debit-muted: var(--wid-muted-page);
          --stop-debit-accent: var(--wid-accent-page);
          min-height: 100vh;
        }

        .stop-debit-shell {
          width: min(100%, 1000px);
          margin: 22px auto 0;
          padding-bottom: 30px;
        }

        .stop-debit-hero {
          padding: clamp(28px, 5vw, 50px) clamp(22px, 5vw, 56px);
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 26px;
          background: var(--wid-result-surface);
        }

        .stop-debit-eyebrow {
          margin: 0;
          color: var(--stop-debit-accent);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .stop-debit-hero h1 {
          max-width: 850px;
          margin: 8px 0 0;
          color: var(--stop-debit-ink);
          font-size: clamp(2.2rem, 5.5vw, 4rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .stop-debit-answer {
          max-width: 850px;
          margin: 16px 0 0;
          color: #3c5d76;
          font-size: clamp(1.15rem, 2.5vw, 1.55rem);
          font-weight: 620;
          line-height: 1.42;
        }

        .stop-debit-answer strong {
          color: var(--stop-debit-ink);
          font-weight: 900;
        }

        .stop-debit-caveat {
          max-width: 820px;
          margin: 12px 0 0;
          color: var(--stop-debit-muted);
          line-height: 1.55;
        }

        .stop-debit-section {
          margin-top: 24px;
          padding: 0 6px;
        }

        .stop-debit-section h2 {
          margin: 0;
          color: var(--stop-debit-ink);
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .stop-debit-section h3 {
          margin: 0;
          color: var(--stop-debit-ink);
          font-size: 1.08rem;
          line-height: 1.3;
        }

        .stop-debit-section p,
        .stop-debit-section li {
          color: #536b80;
          line-height: 1.62;
        }

        .stop-debit-section p {
          margin: 10px 0 0;
        }

        .stop-debit-section a {
          color: #225f78;
          font-weight: 750;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.18em;
        }

        .stop-debit-example {
          margin-top: 18px;
          padding: 18px 22px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
        }

        .stop-debit-example ol,
        .stop-debit-related ul {
          margin: 10px 0 0;
          padding-left: 22px;
        }

        .stop-debit-example ol {
          display: grid;
          gap: 2px;
        }

        @media (max-width: 760px) {
          .stop-debit-page {
            padding-top: 2px;
          }

          .stop-debit-shell {
            margin-top: 6px;
          }

          .stop-debit-hero {
            padding: 18px 16px;
            border-radius: 22px;
          }

          .stop-debit-hero h1 {
            font-size: clamp(1.9rem, 8vw, 2.55rem);
          }

          .stop-debit-answer {
            margin-top: 11px;
            font-size: 1.05rem;
            line-height: 1.42;
          }

          .stop-debit-caveat {
            margin-top: 9px;
            font-size: 0.94rem;
          }

          .stop-debit-section {
            margin-top: 18px;
          }

          .stop-debit-example {
            padding: 14px 15px;
          }
        }
      `}</style>
    </main>
  )
}
