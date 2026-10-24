import AnswerFeedback from './AnswerFeedback.tsx'

type ByFridayGuidePageProps = {
  onNavigate: (path: string) => void
}

export default function ByFridayGuidePage({
  onNavigate,
}: ByFridayGuidePageProps) {
  return (
    <main className="page-shell by-friday-page">
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

      <article className="by-friday-shell">
        <header className="by-friday-hero">
          <p className="by-friday-eyebrow">Deadline wording guide</p>
          <h1>Does “By Friday” Include Friday?</h1>
          <p className="by-friday-answer">
            <strong>Usually, yes.</strong> In ordinary English, “by Friday”
            generally includes Friday as the last day to complete something.
            “Before Friday” means earlier than Friday.
          </p>
        </header>

        <AnswerFeedback />

        <section className="by-friday-section by-friday-meaning">
          <table className="by-friday-table">
            <thead>
              <tr>
                <th scope="col">Wording</th>
                <th scope="col">Usual meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">By Friday</th>
                <td>Friday is included</td>
              </tr>
              <tr>
                <th scope="row">Before Friday</th>
                <td>Complete it earlier than Friday</td>
              </tr>
            </tbody>
          </table>

          <p>
            For example, “Please send it by Friday,{' '}
            <time dateTime="2026-11-06">November 6, 2026</time>” usually means
            you can send it on Friday, November 6. “Before Friday, November 6”
            usually means no later than{' '}
            <time dateTime="2026-11-05">Thursday, November 5</time>.
          </p>
        </section>

        <section className="by-friday-section">
          <h2>What time is it due?</h2>
          <p>“By Friday” does not specify an exact hour or time zone.</p>
          <p>
            A contract, payment instruction, application portal, or other
            deadline may establish a particular cutoff. For a formal deadline,
            the rule and jurisdiction that apply control.
          </p>
          <p>
            Check the instructions for the exact date, time, time zone, and
            whether the item must be sent, submitted, or received by then.
          </p>
          <p>If the deadline matters and the cutoff is unclear, ask the organization that set it.</p>
          <p>If you're setting a deadline, include the exact date, time, and time zone.</p>
        </section>

        <section className="by-friday-section by-friday-related" aria-labelledby="by-friday-related-title">
          <h2 id="by-friday-related-title">Related resources</h2>
          <ul>
            <li>
              <a
                href="/deadline-calculator"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/deadline-calculator')
                }}
              >
                Deadline calculator
              </a>
            </li>
            <li>
              <a
                href="/what-does-within-days-mean"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/what-does-within-days-mean')
                }}
              >
                What does “within days” mean?
              </a>
            </li>
          </ul>
        </section>

        <section className="by-friday-section by-friday-sources" aria-labelledby="by-friday-sources-title">
          <h2 id="by-friday-sources-title">Sources</h2>
          <ul>
            <li>
              <a href="https://dictionary.cambridge.org/dictionary/english/by" target="_blank" rel="noreferrer">
                Cambridge Dictionary: “by”
              </a>
            </li>
            <li>
              <a href="https://dictionary.cambridge.org/grammar/british-grammar/adjunct" target="_blank" rel="noreferrer">
                Cambridge Grammar: “before”
              </a>
            </li>
            <li>
              <a href="https://ell.stackexchange.com/questions/87002/what-does-by-mean-if-we-are-talking-about-a-date" target="_blank" rel="noreferrer">
                English Language Learners Stack Exchange discussion illustrating different interpretations
              </a>
              <span> (community discussion, not an authority)</span>
            </li>
          </ul>
        </section>
      </article>

      <style>{`
        .by-friday-page {
          --by-friday-ink: var(--wid-ink-page);
          --by-friday-muted: var(--wid-muted-page);
          --by-friday-accent: var(--wid-accent-page);
          min-height: 100vh;
        }

        .by-friday-shell {
          width: min(100%, 1000px);
          margin: 22px auto 0;
        }

        .by-friday-hero {
          padding: clamp(28px, 5vw, 50px) clamp(22px, 5vw, 56px);
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 26px;
          background: var(--wid-result-surface);
        }

        .by-friday-eyebrow {
          margin: 0;
          color: var(--by-friday-accent);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .by-friday-hero h1 {
          max-width: 850px;
          margin: 8px 0 0;
          color: var(--by-friday-ink);
          font-size: clamp(2.2rem, 5.5vw, 4rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .by-friday-answer {
          max-width: 820px;
          margin: 16px 0 0;
          color: #3c5d76;
          font-size: clamp(1.15rem, 2.5vw, 1.55rem);
          font-weight: 620;
          line-height: 1.42;
        }

        .by-friday-answer strong {
          color: var(--by-friday-ink);
          font-weight: 900;
        }

        .by-friday-section {
          margin-top: 24px;
          padding: 0 6px;
        }

        .by-friday-section h2 {
          margin: 0;
          color: var(--by-friday-ink);
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .by-friday-section p,
        .by-friday-section li {
          color: #536b80;
          line-height: 1.62;
        }

        .by-friday-section p {
          margin: 10px 0 0;
        }

        .by-friday-section a {
          color: #225f78;
          font-weight: 750;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.18em;
        }

        .by-friday-meaning {
          padding: 18px 22px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
        }

        .by-friday-table {
          width: 100%;
          border-collapse: collapse;
          color: var(--by-friday-ink);
          text-align: left;
        }

        .by-friday-table th,
        .by-friday-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(21, 54, 84, 0.1);
        }

        .by-friday-table thead th {
          color: #506981;
          font-size: 0.82rem;
        }

        .by-friday-table tbody th {
          font-weight: 800;
        }

        .by-friday-related ul,
        .by-friday-sources ul {
          margin: 10px 0 0;
          padding-left: 22px;
        }

        .by-friday-sources span {
          color: var(--by-friday-muted);
          font-size: 0.9rem;
        }

        @media (max-width: 760px) {
          .by-friday-page {
            padding-top: 2px;
          }

          .by-friday-shell {
            margin-top: 6px;
          }

          .by-friday-hero {
            padding: 18px 16px;
            border-radius: 22px;
          }

          .by-friday-hero h1 {
            font-size: clamp(1.9rem, 8vw, 2.55rem);
          }

          .by-friday-answer {
            margin-top: 11px;
            font-size: 1.05rem;
            line-height: 1.42;
          }

          .by-friday-section {
            margin-top: 18px;
          }

          .by-friday-meaning {
            padding: 14px 10px;
          }

          .by-friday-table {
            font-size: 0.9rem;
          }

          .by-friday-table th,
          .by-friday-table td {
            padding: 9px 6px;
            vertical-align: top;
          }
        }
      `}</style>
    </main>
  )
}
