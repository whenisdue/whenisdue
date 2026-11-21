import type { MouseEvent } from 'react'
import AnswerFeedback from './AnswerFeedback.tsx'
import PublicSiteFooter from './PublicSiteFooter.tsx'
import PublicSiteHeader from './PublicSiteHeader.tsx'
import './GuideArticlePage.css'

type ReturnWindowGuidePageProps = {
  onNavigate: (path: string) => void
}

export default function ReturnWindowGuidePage({ onNavigate }: ReturnWindowGuidePageProps) {
  function followInternalLink(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onNavigate(path)
    }
  }

  return (
    <main className="page-shell guide-article-page">
      <PublicSiteHeader onNavigate={onNavigate} />

      <article className="guide-article">
        <header className="guide-article-hero">
          <p className="guide-article-eyebrow">Returns and date counting</p>
          <h1>How to calculate the last day of a return window</h1>
          <p className="guide-article-lede">
            A “30-day return window” does not identify its own starting date,
            counting rule, or return cutoff. Use the retailer’s written policy
            to answer those questions before relying on a calculated date.
          </p>
        </header>

        <AnswerFeedback />

        <section className="guide-article-section">
          <h2>1. Find the date that starts the window</h2>
          <p>
            Look for the event named in the policy: purchase, shipment, delivery,
            pickup, activation, or another date. A receipt may show the purchase
            date while an online order page shows delivery. Those dates can be
            several days apart, so choosing the wrong one shifts the whole
            count.
          </p>
          <p>
            The U.S. Federal Trade Commission recommends checking a seller’s
            return policy and deadline on the receipt, product packaging, or
            website and keeping purchase documents. That practical step helps
            identify which date and instructions the seller actually published.
          </p>
        </section>

        <section className="guide-article-section">
          <h2>2. Check what “days” means</h2>
          <p>
            A policy may count calendar days, business days, or a named number
            of weeks. Calendar days include weekends. A business-day count
            normally skips some non-working days, but the policy may define the
            calendar it uses. Do not silently swap one kind of day for another.
          </p>
          <p>
            Also check whether a public holiday is skipped and what happens if
            the last date lands on a weekend or holiday. A calculator should
            show the calendar-day result unless the policy or an applicable rule
            supports a different treatment.
          </p>
        </section>

        <section className="guide-article-section guide-article-example" aria-labelledby="return-example-title">
          <p className="guide-article-eyebrow">Worked date example</p>
          <h2 id="return-example-title">A 30-day window after Friday, June 5, 2026</h2>
          <p>
            Assume a policy uses the purchase date as its trigger and counts
            calendar days. The date differs by one day depending on its Day 1
            convention:
          </p>
          <ul>
            <li>
              <strong>Start date excluded:</strong> begin counting June 6 as
              Day 1; Day 30 is Sunday, July 5, 2026.
            </li>
            <li>
              <strong>Start date is Day 1:</strong> count June 5 as Day 1; Day
              30 is Saturday, July 4, 2026.
            </li>
          </ul>
          <p>
            If the policy instead starts the window on delivery and the item
            arrived Monday, June 8, the same next-day convention gives
            Wednesday, July 8. These are examples of date arithmetic; they do
            not decide which rule a particular seller uses.
          </p>
        </section>

        <section className="guide-article-section">
          <h2>3. Check what must happen by the last day</h2>
          <p>
            “Return within 30 days” may not say whether the seller must receive
            the item by then or whether you only need to start a return request
            or hand a package to the carrier. Read the instructions for the
            accepted return method, shipping label, drop-off location, and any
            approval or confirmation step.
          </p>
          <p>
            Look for an exact time and time zone if an online portal closes at a
            specific hour. Save the receipt, tracking record, confirmation
            email, and any message that shows when the return was requested or
            accepted.
          </p>
        </section>

        <section className="guide-article-section">
          <h2>Use the calculator with the policy beside you</h2>
          <p>
            Enter the trigger date and window length, then choose whether the
            start date counts. The return-window calculator shows a calendar-day
            date and does not move it automatically for weekends or holidays.
            Compare that result with the seller’s policy and any rules that apply
            where you live. If the policy is unclear or conflicts with a
            consumer-protection rule, contact the seller or a local consumer
            protection office.
          </p>
          <p>
            The FTC’s consumer guidance also recommends checking a seller’s
            deadline, return method, and other policy details before sending an
            item back.
          </p>
        </section>

        <section className="guide-article-related" aria-labelledby="return-related-title">
          <h2 id="return-related-title">Related resources</h2>
          <ul>
            <li>
              <a href="/return-window-calculator" onClick={followInternalLink('/return-window-calculator')}>
                Return window calculator
              </a>
            </li>
            <li>
              <a href="/does-the-start-date-count" onClick={followInternalLink('/does-the-start-date-count')}>
                Does the start date count?
              </a>
            </li>
            <li>
              <a href="/postmarked-by-vs-received-by" onClick={followInternalLink('/postmarked-by-vs-received-by')}>
                Postmarked by vs. received by
              </a>
            </li>
          </ul>
        </section>

        <section className="guide-article-sources" aria-labelledby="return-sources-title">
          <h2 id="return-sources-title">Source</h2>
          <ul>
            <li>
              <a href="https://consumer.ftc.gov/articles/solving-problems-business-returns-refunds-and-other-resolutions" target="_blank" rel="noreferrer">
                Federal Trade Commission: Returns, refunds, and other resolutions
              </a>
            </li>
          </ul>
        </section>
      </article>

      <PublicSiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The seller’s policy and applicable rules control."
      />
    </main>
  )
}
