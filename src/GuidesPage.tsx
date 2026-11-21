import type { MouseEvent } from 'react'
import PublicSiteHeader from './PublicSiteHeader.tsx'
import PublicSiteFooter from './PublicSiteFooter.tsx'
import { guideCategories } from './guidesCatalog.ts'
import './GuidesPage.css'

type GuidesPageProps = {
  onNavigate: (path: string) => void
}

export default function GuidesPage({ onNavigate }: GuidesPageProps) {
  function followInternalLink(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onNavigate(path)
    }
  }

  return (
    <main className="page-shell guides-page">
      <PublicSiteHeader onNavigate={onNavigate} />

      <header className="guides-hero">
        <p className="guides-eyebrow">WhenIsDue Guides</p>
        <h1>Date and deadline guides</h1>
        <p>
          A date calculation is only as clear as the rule behind it. These guides
          explain how to identify the starting event, count the stated period,
          handle calendar exceptions, and confirm the final cutoff.
        </p>
      </header>

      <section className="guides-method" aria-labelledby="guides-method-title">
        <div className="guides-method-copy">
          <p className="guides-eyebrow">A practical check</p>
          <h2 id="guides-method-title">Work through the rule in this order</h2>
          <ol>
            <li>
              <strong>Find the event that starts the clock.</strong> It may be
              the invoice date, the day an item arrived, or the date a notice was
              received.
            </li>
            <li>
              <strong>Read the unit.</strong> Calendar days, business days, and
              one calendar month describe different periods.
            </li>
            <li>
              <strong>Check Day 1.</strong> The trigger date may count, or the
              count may begin the following day.
            </li>
            <li>
              <strong>Apply exceptions only when the rule provides them.</strong>
              Weekends and holidays do not automatically move every deadline.
            </li>
            <li>
              <strong>Confirm how completion is measured.</strong> Check the
              cutoff time, time zone, and whether something must be sent,
              submitted, postmarked, or received.
            </li>
          </ol>
        </div>

        <aside className="guides-worked-example" aria-labelledby="guides-example-title">
          <h2 id="guides-example-title">One period, two possible dates</h2>
          <p>
            Suppose a 10-day period starts on Friday, June 5, 2026. If the next
            day is Day 1, Day 10 is Monday, June 15. If June 5 is Day 1, Day 10
            is Sunday, June 14.
          </p>
          <p>
            This is calendar arithmetic only. The invoice, policy, contract, or
            official instructions determine which convention applies and
            whether a weekend adjustment is allowed.
          </p>
          <a
            href="/deadline-calculator"
            onClick={followInternalLink('/deadline-calculator')}
          >
            Compare counting rules in the deadline calculator
          </a>
        </aside>
      </section>

      <section className="guides-library" aria-labelledby="guides-library-title">
        <div className="guides-library-heading">
          <div>
            <p className="guides-eyebrow">Browse by question</p>
            <h2 id="guides-library-title">The guide library</h2>
          </div>
          <p>
            Each guide focuses on a specific phrase or calculation and points
            out where the controlling source may set a different rule.
          </p>
        </div>

        <div className="guides-category-grid">
          {guideCategories.map((category) => (
            <section className="guides-category" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <ul>
                {category.guides.map((guide) => (
                  <li key={guide.href}>
                    <a href={guide.href} onClick={followInternalLink(guide.href)}>
                      <strong>{guide.title}</strong>
                      <span>{guide.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="guides-next-step" aria-labelledby="guides-next-step-title">
        <div>
          <p className="guides-eyebrow">Need a date?</p>
          <h2 id="guides-next-step-title">Use the rule with a calculator</h2>
          <p>
            Calculators show the assumptions used in the result. Compare those
            settings with the original document before relying on an important
            deadline.
          </p>
        </div>
        <div className="guides-tool-links">
          {[
            ['Business days', '/business-days-calculator'],
            ['Invoice due dates', '/invoice-due-date-calculator'],
            ['Return windows', '/return-window-calculator'],
            ['Notice periods', '/notice-period-calculator'],
          ].map(([label, href]) => (
            <a href={href} key={href} onClick={followInternalLink(href)}>
              {label}
            </a>
          ))}
          <a href="/calculators" onClick={followInternalLink('/calculators')}>
            View all calculators
          </a>
        </div>
      </section>

      <PublicSiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. Check the original terms or authoritative source for important deadlines."
      />
    </main>
  )
}
