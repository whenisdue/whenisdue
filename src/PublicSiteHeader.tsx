import './PublicSiteHeader.css'

type PublicSiteHeaderProps = {
  onNavigate: (path: string) => void
  showWorkspaceLink?: boolean
}

const publicLinks = [
  { label: 'Home', href: '/' },
  { label: 'Calculators', href: '/calculators' },
  { label: 'Guides', href: '/guides' },
  { label: 'About', href: '/about' },
]

export default function PublicSiteHeader({
  onNavigate,
  showWorkspaceLink = false,
}: PublicSiteHeaderProps) {
  const links = showWorkspaceLink
    ? [...publicLinks, { label: 'VA Workspace', href: '/workspace' }]
    : publicLinks

  return (
    <header className="calculator-page-header public-site-header">
      <a
        className="calculator-page-brand"
        href="/"
        aria-label="WhenIsDue home"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/')
        }}
      >
        <img src="/whenisdue-logo.png" alt="WhenIsDue" />
      </a>

      <nav className="public-site-nav" aria-label="Main navigation">
        {links.map((link) => (
          <a
            href={link.href}
            key={link.href}
            className={link.href === '/workspace' ? 'workspace-nav-link' : undefined}
            aria-current={window.location.pathname === link.href ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(link.href)
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
