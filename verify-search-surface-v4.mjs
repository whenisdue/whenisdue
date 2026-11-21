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
const routeMetadata = read('src/routeMetadata.ts')
const crawlGenerator = read('scripts/generate-crawl-pages.mjs')
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')

const routeMapMatch = routeMetadata.match(
  /export const ROUTE_PATH_TO_NAME = \{([\s\S]*?)\} as const/,
)
assert(routeMapMatch, 'Route path-to-name map is missing.')
const routeEntries = [...routeMapMatch[1].matchAll(/^\s*"([^"]+)":\s*'([^']+)'/gm)]
  .map((match) => ({ path: match[1], route: match[2] }))
const noindexMatch = routeMetadata.match(
  /const NOINDEX_ROUTES = new Set<RouteName>\(\[([^\]]+)\]\)/,
)
assert(noindexMatch, 'Noindex route declarations are missing.')
const noindexNames = new Set([...noindexMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]))
const publicRoutes = routeEntries.filter((entry) => !noindexNames.has(entry.route)).map((entry) => entry.path)
const noindexRoutes = routeEntries.filter((entry) => noindexNames.has(entry.route)).map((entry) => entry.path)
const requiredPublicRoutes = [
  '/',
  '/calculators',
  '/guides',
  '/net-30-and-2-10-net-30',
  '/return-window-deadline-guide',
  '/business-days-calculator',
  '/deadline-calculator',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
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
  routeMetadata,
  "'saved-calculations'",
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
  crawlGenerator,
  "${SITE_ORIGIN}/#organization",
  'Stable Organization structured-data ID is missing.',
)

assertIncludes(
  crawlGenerator,
  "${SITE_ORIGIN}/#website",
  'Stable WebSite structured-data ID is missing.',
)

assertIncludes(
  routeMetadata,
  "path: '/deadline-calculator'",
  'Deadline calculator metadata path is missing.',
)

assertIncludes(
  routeMetadata,
  'ROUTE_PATH_TO_NAME[pathname as keyof typeof ROUTE_PATH_TO_NAME]',
  'Deadline calculator route resolver is missing.',
)

assertIncludes(
  app,
  "route === 'deadline-calculator'",
  'Deadline calculator render/metadata wiring is missing.',
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

for (const route of requiredPublicRoutes) {
  assert(
    publicRoutes.includes(route),
    `Required public route missing from route metadata: ${route}`,
  )
}

assertIncludes(
  routeMetadata,
  "path: `/${dayCount}-business-days-from-today`",
  'Dynamic business-days metadata path template is missing.',
)

assertIncludes(
  routeMetadata,
  "path: `/net-${dayCount}-due-date`",
  'Dynamic Net-term metadata path template is missing.',
)

assertIncludes(
  routeMetadata,
  "'four-business-days': 4",
  'Business-day route-to-day-count metadata map is incomplete.',
)

assertIncludes(
  routeMetadata,
  "'net-30': 30",
  'Net-term route-to-day-count metadata map is incomplete.',
)

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

const duplicateSitemapLocs = sitemapLocs.filter(
  (url, index) => sitemapLocs.indexOf(url) !== index,
)

assert(
  duplicateSitemapLocs.length === 0,
  `Duplicate sitemap URLs found: ${[...new Set(duplicateSitemapLocs)].join(', ')}`,
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

console.log('✓ Search surface verification v4 passed')
console.log(`  Public sitemap routes checked: ${publicRoutes.length}`)
console.log(`  Noindex routes checked: ${noindexRoutes.length}`)
console.log('  Canonicals: clean route paths')
console.log('  robots.txt: public crawling + OAI-SearchBot allowed')
console.log('  Structured data: stable Organization/WebSite entity IDs present')
console.log('  Sitemap: no duplicate or query-state URLs')
console.log('  Route metadata + pathname resolver wiring checked for public routes')
console.log('  Dynamic metadata families checked for exact business-day and Net-term pages')
