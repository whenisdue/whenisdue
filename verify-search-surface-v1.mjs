import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  const fullPath = path.join(root, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }

  return fs.readFileSync(fullPath, 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(haystack, needle, message) {
  assert(haystack.includes(needle), message)
}

const app = read('src/App.tsx')
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')

const publicRoutes = [
  '/',
  '/calculators',
  '/business-days-calculator',
  '/business-days-between-dates',
  '/business-hours-deadline-calculator',
  '/next-payday-calculator',
  '/invoice-due-date-calculator',
  '/return-window-calculator',
  '/free-trial-calculator',
  '/3-business-days-from-today',
  '/4-business-days-from-today',
  '/5-business-days-from-today',
  '/7-business-days-from-today',
  '/8-business-days-from-today',
  '/10-business-days-from-today',
  '/20-business-days-from-today',
  '/30-business-days-from-today',
  '/net-7-due-date',
  '/net-15-due-date',
  '/net-30-due-date',
  '/net-45-due-date',
  '/net-60-due-date',
  '/net-90-due-date',
]

const noindexRoutes = [
  '/workspace',
  '/typing',
  '/saved-calculations',
]

const base = 'https://www.whenisdue.com'

assertIncludes(
  app,
  "const canonicalUrl = `https://www.whenisdue.com${metadata.path}`",
  'Canonical URLs must be built from the route metadata path, not from query-state URLs.',
)

assertIncludes(
  app,
  "canonical.setAttribute('href', canonicalUrl)",
  'Canonical link assignment is missing.',
)

assertIncludes(
  app,
  "openGraphUrl.setAttribute('content', `https://www.whenisdue.com${metadata.path}`)",
  'Open Graph URL should use the clean route path.',
)

assertIncludes(
  app,
  "route === 'saved-calculations'",
  'Saved Calculations must remain in the noindex route group.',
)

assertIncludes(
  app,
  "'noindex, follow'",
  'Noindex routes should use noindex, follow.',
)

assertIncludes(
  app,
  "'index, follow'",
  'Public routes should use index, follow.',
)

assertIncludes(
  app,
  "https://www.whenisdue.com/#organization",
  'Stable Organization structured-data ID is missing.',
)

assertIncludes(
  app,
  "https://www.whenisdue.com/#website",
  'Stable WebSite structured-data ID is missing.',
)

assertIncludes(
  robots,
  'User-agent: *\nAllow: /',
  'robots.txt must allow standard public crawling.',
)

assertIncludes(
  robots,
  'User-agent: OAI-SearchBot\nAllow: /',
  'robots.txt must explicitly allow OAI-SearchBot.',
)

assertIncludes(
  robots,
  'Sitemap: https://www.whenisdue.com/sitemap.xml',
  'robots.txt must declare the production sitemap.',
)

for (const route of publicRoutes) {
  const url = `${base}${route === '/' ? '/' : route}`

  assertIncludes(
    sitemap,
    `<loc>${url}</loc>`,
    `Public route missing from sitemap: ${route}`,
  )
}

for (const route of noindexRoutes) {
  const url = `${base}${route}`

  assert(
    !sitemap.includes(`<loc>${url}</loc>`),
    `Noindex route must not appear in sitemap: ${route}`,
  )
}

const sitemapLocs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
)

assert(
  sitemapLocs.every((url) => !url.includes('?')),
  'Sitemap should contain clean canonical URLs only; query-state URLs were found.',
)

assert(
  !sitemap.includes('/typing'),
  '/typing must remain excluded from the sitemap.',
)

assert(
  !sitemap.includes('/workspace'),
  '/workspace must remain excluded from the sitemap.',
)

assert(
  !sitemap.includes('/saved-calculations'),
  '/saved-calculations must remain excluded from the sitemap.',
)

console.log('✓ Search surface verification v1 passed')
console.log(`  Public sitemap routes checked: ${publicRoutes.length}`)
console.log(`  Noindex routes checked: ${noindexRoutes.length}`)
console.log('  Canonicals: clean route paths')
console.log('  robots.txt: public crawling + OAI-SearchBot allowed')
console.log('  Structured data: stable Organization/WebSite entity IDs present')
