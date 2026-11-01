import AnswerFeedback from './AnswerFeedback.tsx'

type PostmarkedVsReceivedGuidePageProps = {
  onNavigate: (path: string) => void
}

export default function PostmarkedVsReceivedGuidePage({
  onNavigate,
}: PostmarkedVsReceivedGuidePageProps) {
  return (
    <main className="page-shell postmark-guide-page">
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

      <article className="postmark-guide-shell">
        <header className="postmark-guide-hero">
          <p className="postmark-guide-eyebrow">Deadline wording guide</p>
          <h1>Postmarked By vs. Received By: Which Deadline Counts?</h1>
          <p className="postmark-guide-answer">
            <strong>
              If a deadline says “postmarked by,” a qualifying postmark dated by
              that day may satisfy the requirement. If it says “received by,”
              the item must actually arrive by that day. Simply mailing
              something on a received-by deadline is not enough. Always follow
              the recipient&apos;s exact instructions.
            </strong>
          </p>
        </header>

        <AnswerFeedback />

        <section
          className="postmark-guide-section"
          aria-labelledby="postmark-guide-tests-title"
        >
          <h2 id="postmark-guide-tests-title">
            “Postmarked by” and “received by” are different tests
          </h2>
          <div className="postmark-guide-table-wrap">
            <table className="postmark-guide-table">
              <caption className="postmark-guide-visually-hidden">
                What each deadline phrase requires
              </caption>
              <colgroup>
                <col className="postmark-guide-wording-column" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Wording</th>
                  <th scope="col">What must happen</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Postmarked by Friday, November 6</th>
                  <td>
                    The item needs a qualifying postmark dated by November 6,
                    if accepted under the recipient&apos;s rules.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Received by Friday, November 6</th>
                  <td>The item must reach the recipient by November 6.</td>
                </tr>
                <tr>
                  <th scope="row">Both conditions</th>
                  <td>
                    Both the specified postmark and receipt requirements must
                    be met.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="postmark-guide-section"
          aria-labelledby="postmark-guide-example-title"
        >
          <h2 id="postmark-guide-example-title">
            Example: Friday, November 6, 2026
          </h2>
          <div className="postmark-guide-example">
            <p>
              Suppose a form has a deadline of{' '}
              <strong>
                <time dateTime="2026-11-06">Friday, November 6, 2026</time>
              </strong>
              .
            </p>
            <p>
              If the instructions say <strong>“postmarked by November 6,”</strong>{' '}
              you may take it to a USPS retail counter that day, hand it over,
              and request a free manual postmark. USPS says the date of a retail
              manual postmark matches the date the item is accepted at that
              counter. This may satisfy the postmark requirement if the
              receiving organization accepts that method and you meet any
              additional conditions. See{' '}
              <a
                href="https://pe.usps.com/text/DMM300/608.htm#11.0"
                target="_blank"
                rel="noreferrer"
              >
                USPS Domestic Mail Manual §608.11
              </a>
              .
            </p>
            <p>
              If the instructions say <strong>“received by November 6,”</strong>{' '}
              mailing the form on Friday is not enough. The recipient must
              actually receive it by the deadline.
            </p>
          </div>
        </section>

        <section
          className="postmark-guide-section"
          aria-labelledby="postmark-guide-dates-title"
        >
          <h2 id="postmark-guide-dates-title">
            Why can a postmark be later than the mailing date?
          </h2>
          <p>
            USPS generally applies postmarks using machines at originating
            processing facilities. These postmarks show the date of the first
            automated-processing operation, which may occur after USPS
            initially accepts the item.
          </p>
          <p>
            USPS explains that operational transportation adjustments can mean
            some mail does not reach a processing facility on the day it was
            collected. Its January 2026 clarification did not itself introduce
            a new postmarking practice. Not every piece of mail receives a
            postmark in ordinary processing.
          </p>
          <p className="postmark-guide-source-line">
            Source:{' '}
            <a
              href="https://about.usps.com/newsroom/statements/010226-postmarking-myths-and-facts.htm"
              target="_blank"
              rel="noreferrer"
            >
              USPS, Postmarking Myths and Facts
            </a>
          </p>
        </section>

        <section
          className="postmark-guide-section"
          aria-labelledby="postmark-guide-proof-title"
        >
          <h2 id="postmark-guide-proof-title">
            What should I do if proof of mailing matters?
          </h2>
          <p>
            <strong>To request a postmark matching retail acceptance:</strong>{' '}
            Present the item at a USPS retail counter and ask for a free manual
            postmark. For 50 or more pieces, contact the Post Office manager
            beforehand.
          </p>
          <p>
            <strong>To document presentation for mailing:</strong> Consider a
            USPS Certificate of Mailing, where eligible. This is a paid service
            providing mailing evidence, not proof of delivery.
          </p>
          <p>
            <strong>To obtain delivery evidence:</strong> Review eligible USPS
            services, including Certified Mail, Registered Mail, and Return
            Receipt, and confirm what the receiving organization actually
            requires.
          </p>
          <p>
            A postage label printed online, at a self-service kiosk, or on a
            postage meter does not by itself prove when USPS accepted the item.
          </p>
          <p className="postmark-guide-source-line">
            Sources:{' '}
            <a
              href="https://pe.usps.com/text/DMM300/608.htm#11.0"
              target="_blank"
              rel="noreferrer"
            >
              Domestic Mail Manual §608
            </a>
            {' · '}
            <a
              href="https://pe.usps.com/text/dmm300/503.htm"
              target="_blank"
              rel="noreferrer"
            >
              Domestic Mail Manual §503
            </a>
          </p>
        </section>

        <section
          className="postmark-guide-section"
          aria-labelledby="postmark-guide-check-title"
        >
          <h2 id="postmark-guide-check-title">Before you send it</h2>
          <p>Check the organization&apos;s instructions for:</p>
          <ul>
            <li>The exact deadline date and any cutoff time.</li>
            <li>Whether the item must be postmarked, received, or both.</li>
            <li>Which mailing or submission methods are allowed.</li>
            <li>Whether a particular proof of mailing or delivery is required.</li>
          </ul>
          <p>
            If the rule is unclear, ask the organization receiving the item. A
            USPS postmark or mailing receipt does not automatically satisfy
            every organization&apos;s requirements.
          </p>
        </section>

        <section
          className="postmark-guide-section postmark-guide-related"
          aria-labelledby="postmark-guide-related-title"
        >
          <h2 id="postmark-guide-related-title">Related WhenIsDue guide</h2>
          <ul>
            <li>
              <a
                href="/does-by-date-include-date"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/does-by-date-include-date')
                }}
              >
                Does “By Friday” Include Friday?
              </a>
            </li>
          </ul>
        </section>

        <section
          className="postmark-guide-section postmark-guide-sources"
          aria-labelledby="postmark-guide-sources-title"
        >
          <h2 id="postmark-guide-sources-title">Official USPS sources</h2>
          <ul>
            <li>
              <a
                href="https://about.usps.com/newsroom/statements/010226-postmarking-myths-and-facts.htm"
                target="_blank"
                rel="noreferrer"
              >
                Postmarking Myths and Facts
              </a>
            </li>
            <li>
              <a
                href="https://pe.usps.com/text/DMM300/608.htm#11.0"
                target="_blank"
                rel="noreferrer"
              >
                Domestic Mail Manual §608 — Postmarks and Postal Possession
              </a>
            </li>
            <li>
              <a
                href="https://pe.usps.com/text/dmm300/503.htm"
                target="_blank"
                rel="noreferrer"
              >
                Domestic Mail Manual §503 — Extra Services
              </a>
            </li>
          </ul>
        </section>
      </article>

      <style>{`
        .postmark-guide-page {
          --postmark-ink: var(--wid-ink-page);
          --postmark-muted: var(--wid-muted-page);
          --postmark-accent: var(--wid-accent-page);
          min-height: 100vh;
        }

        .postmark-guide-shell {
          width: min(100%, 1000px);
          margin: 22px auto 0;
          padding-bottom: 30px;
        }

        .postmark-guide-hero {
          padding: clamp(28px, 5vw, 50px) clamp(22px, 5vw, 56px);
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 26px;
          background: var(--wid-result-surface);
        }

        .postmark-guide-eyebrow {
          margin: 0;
          color: var(--postmark-accent);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .postmark-guide-hero h1 {
          max-width: 850px;
          margin: 8px 0 0;
          color: var(--postmark-ink);
          font-size: clamp(2.2rem, 5.5vw, 4rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
          text-wrap: balance;
        }

        .postmark-guide-answer {
          max-width: 850px;
          margin: 16px 0 0;
          color: #3c5d76;
          font-size: clamp(1.15rem, 2.5vw, 1.55rem);
          font-weight: 620;
          line-height: 1.42;
        }

        .postmark-guide-answer strong {
          color: var(--postmark-ink);
          font-weight: 800;
        }

        .postmark-guide-section {
          margin-top: 24px;
          padding: 0 6px;
        }

        .postmark-guide-section h2 {
          margin: 0;
          color: var(--postmark-ink);
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .postmark-guide-section p,
        .postmark-guide-section li {
          color: #536b80;
          line-height: 1.62;
        }

        .postmark-guide-section p {
          margin: 10px 0 0;
        }

        .postmark-guide-section a {
          color: #225f78;
          font-weight: 750;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.18em;
          overflow-wrap: anywhere;
        }

        .postmark-guide-table-wrap {
          width: 100%;
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.68);
        }

        .postmark-guide-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          color: var(--postmark-ink);
          text-align: left;
        }

        .postmark-guide-wording-column {
          width: 39%;
        }

        .postmark-guide-table th,
        .postmark-guide-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(21, 54, 84, 0.1);
          overflow-wrap: anywhere;
          vertical-align: top;
        }

        .postmark-guide-table thead th {
          color: #506981;
          font-size: 0.88rem;
        }

        .postmark-guide-table tbody th {
          font-weight: 800;
        }

        .postmark-guide-table tbody tr:last-child th,
        .postmark-guide-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .postmark-guide-example {
          margin-top: 14px;
          padding: 16px 20px;
          border: 1px solid rgba(21, 54, 84, 0.1);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
        }

        .postmark-guide-example p:first-child {
          margin-top: 0;
        }

        .postmark-guide-source-line {
          color: var(--postmark-muted) !important;
          font-size: 0.92rem;
        }

        .postmark-guide-related ul,
        .postmark-guide-sources ul {
          margin: 10px 0 0;
          padding-left: 22px;
        }

        .postmark-guide-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 760px) {
          .postmark-guide-page {
            padding-top: 2px;
          }

          .postmark-guide-shell {
            margin-top: 6px;
          }

          .postmark-guide-hero {
            padding: 18px 16px;
            border-radius: 22px;
          }

          .postmark-guide-hero h1 {
            font-size: clamp(1.9rem, 8vw, 2.55rem);
          }

          .postmark-guide-answer {
            margin-top: 11px;
            font-size: 1.05rem;
            line-height: 1.42;
          }

          .postmark-guide-section {
            margin-top: 18px;
          }

          .postmark-guide-table {
            font-size: 0.9rem;
          }

          .postmark-guide-table th,
          .postmark-guide-table td {
            padding: 9px 8px;
          }

          .postmark-guide-wording-column {
            width: 40%;
          }

          .postmark-guide-example {
            padding: 14px 15px;
          }
        }
      `}</style>
    </main>
  )
}
