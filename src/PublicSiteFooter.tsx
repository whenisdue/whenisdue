import type { MouseEvent } from 'react'

type PublicSiteFooterProps = {
  onNavigate: (path: string) => void
  planningNote?: string
}

const footerLinks = [
  ['Home', '/'],
  ['Calculators', '/calculators'],
  ['Guides', '/guides'],
  ['About', '/about'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Contact', '/contact'],
]

export default function PublicSiteFooter({
  onNavigate,
  planningNote = 'For planning only. Always check the original terms on your invoice, receipt, order, or trial.',
}: PublicSiteFooterProps) {
  function followInternalLink(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      onNavigate(path)
    }
  }

  return (
    <footer className="site-footer">
      <div className="footer-links">
        {footerLinks.map(([label, href]) => (
          <a href={href} key={href} onClick={followInternalLink(href)}>
            {label}
          </a>
        ))}
      </div>
      <p>Calculator dates are saved in this browser only.</p>
      <p>{planningNote}</p>
    </footer>
  )
}
