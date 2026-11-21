import type { MouseEvent } from 'react'
import AnswerFeedback from './AnswerFeedback.tsx'
import PublicSiteFooter from './PublicSiteFooter.tsx'
import PublicSiteHeader from './PublicSiteHeader.tsx'
import './GuideArticlePage.css'

type NetTermsGuidePageProps = {
  onNavigate: (path: string) => void
}

export default function NetTermsGuidePage({ onNavigate }: NetTermsGuidePageProps) {
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
          <p className="guide-article-eyebrow">Invoice terms guide</p>
          <h1>Net 30 and 2/10 Net 30: worked date examples</h1>
          <p className="guide-article-lede">
            Net terms describe a payment window, but the invoice or contract
            still decides what date starts the count and which days count. Here
            is a clear way to separate the arithmetic from the written terms.
          </p>
        </header>

        <AnswerFeedback />

        <section className="guide-article-section">
          <h2>What “2/10 Net 30” commonly describes</h2>
          <p>
            A common reading is a 2% discount when payment is made within 10
            days, with the full net amount due within 30 days if the discount is
            not used. The Connecticut Department of Revenue Services describes
            these terms that way in its guidance on early-payment discounts.
            The actual invoice or agreement controls the amount eligible for a
            discount, the date that starts each period, and any other condition.
          </p>
          <p>
            “Net 30” by itself commonly means the net amount is due within a
            30-day period. It does not tell you by itself whether the count
            begins on the invoice date, invoice receipt, delivery, completion of
            service, or another event. U.S. Treasury’s Invoice Processing
            Platform, for example, defines its own Net 30 vendor term using the
            later of specified receipt and invoice events. That is an example
            of one program’s rule, not a universal definition.
          </p>
        </section>

        <section className="guide-article-section guide-article-example" aria-labelledby="net-terms-example-title">
          <p className="guide-article-eyebrow">Illustrative arithmetic</p>
          <h2 id="net-terms-example-title">A $1,000 invoice dated June 1, 2026</h2>
          <p>
            Assume the invoice says both periods run from its date, counting
            starts the next day, and the 2% discount applies to the full $1,000.
            Under those stated assumptions:
          </p>
          <ul>
            <li>
              <strong>Discount amount:</strong> 2% of $1,000 is $20, so the
              discounted payment would be $980.
            </li>
            <li>
              <strong>Discount date:</strong> Day 10 is June 11, 2026.
            </li>
            <li>
              <strong>Net 30 date:</strong> Day 30 is July 1, 2026.
            </li>
          </ul>
          <p>
            If the document uses receipt of goods, service completion, invoice
            receipt, end-of-month dating, or a different counting convention,
            those dates can change. The example is not a recommendation to pay
            early; compare the terms with your cash, discount, and accounting
            requirements.
          </p>
        </section>

        <section className="guide-article-section">
          <h2>Check these details before using a date calculator</h2>
          <ul>
            <li>
              <strong>Trigger:</strong> Is the clock tied to the invoice date,
              when the invoice arrived, delivery, or completed work?
            </li>
            <li>
              <strong>Day 1:</strong> Does the stated period begin on the trigger
              date or the day after?
            </li>
            <li>
              <strong>Unit:</strong> Does the invoice specify calendar days,
              business days, or a calendar-month/end-of-month rule?
            </li>
            <li>
              <strong>Discount base:</strong> Which line items and amounts
              qualify, and what proof of payment date is accepted?
            </li>
            <li>
              <strong>Cutoff:</strong> Is payment due when initiated, received,
              cleared, or posted, and is there a stated time zone?
            </li>
          </ul>
          <p>
            A calculator can perform the selected date arithmetic; it cannot
            determine which payment term your supplier intended or whether a
            particular payment qualifies. Ask the supplier or accounts-payable
            contact if the written terms leave a material question open.
          </p>
        </section>

        <section className="guide-article-related" aria-labelledby="net-terms-related-title">
          <h2 id="net-terms-related-title">Related tools and reading</h2>
          <ul>
            <li>
              <a href="/invoice-due-date-calculator" onClick={followInternalLink('/invoice-due-date-calculator')}>
                Invoice due date calculator
              </a>
            </li>
            <li>
              <a href="/2-10-net-30-calculator" onClick={followInternalLink('/2-10-net-30-calculator')}>
                2/10 Net 30 calculator
              </a>
            </li>
            <li>
              <a href="/net-30-vs-30-days" onClick={followInternalLink('/net-30-vs-30-days')}>
                Net 30 vs. 30 days
              </a>
            </li>
          </ul>
        </section>

        <section className="guide-article-sources" aria-labelledby="net-terms-sources-title">
          <h2 id="net-terms-sources-title">Sources</h2>
          <ul>
            <li>
              <a href="https://portal.ct.gov/drs/publications/policy-statements/1996/ps-962-the-treatment-of-early-payment-discounts" target="_blank" rel="noreferrer">
                Connecticut Department of Revenue Services: Treatment of Early Payment Discounts
              </a>
            </li>
            <li>
              <a href="https://fiscal.treasury.gov/financial-management-solutions/invoice-processing-platform-ipp/prompt-pay-guidance" target="_blank" rel="noreferrer">
                U.S. Treasury Invoice Processing Platform: Prompt Pay Guidance
              </a>
              <span> (the Treasury description applies to its own vendor-payment program)</span>
            </li>
          </ul>
        </section>
      </article>

      <PublicSiteFooter
        onNavigate={onNavigate}
        planningNote="For planning only. The invoice, contract, and applicable payment rules control."
      />
    </main>
  )
}
