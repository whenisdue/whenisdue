import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const SITE_ORIGIN = 'https://www.whenisdue.com'
const ROUTE_METADATA_TS = path.join(ROOT, 'src', 'routeMetadata.ts')

async function loadRouteMetadataModule() {
  const source = await fs.readFile(ROUTE_METADATA_TS, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: ROUTE_METADATA_TS,
  }).outputText

  const tempPath = path.join(ROOT, 'scripts', '.routeMetadata.verify.generated.mjs')
  await fs.writeFile(tempPath, transpiled, 'utf8')

  try {
    return await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`)
  } finally {
    await fs.rm(tempPath, { force: true })
  }
}

function getTag(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? null
}

function decodeHtml(value) {
  return value
    ?.replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

const routeModule = await loadRouteMetadataModule()
const {
  ROUTE_PATH_TO_NAME,
  getRouteMetadata,
  isRouteIndexable,
} = routeModule

const errors = []
const indexablePaths = new Set()

for (const [routePath, route] of Object.entries(ROUTE_PATH_TO_NAME)) {
  const metadata = getRouteMetadata(route, routePath)
  const filePath =
    routePath === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, `${routePath.slice(1)}.html`)

  let html
  try {
    html = await fs.readFile(filePath, 'utf8')
  } catch {
    errors.push(`${routePath}: missing generated HTML (${path.relative(ROOT, filePath)})`)
    continue
  }

  const expectedCanonical = `${SITE_ORIGIN}${metadata.path}`
  const title = decodeHtml(getTag(html, /<title>([\s\S]*?)<\/title>/i))
  const description = decodeHtml(
    getTag(html, /<meta\s+name=["\']description["\']\s+content="([^"]*)"[^>]*>/i),
  )
  const canonical = getTag(
    html,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i,
  )
  const ogUrl = getTag(
    html,
    /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["'][^>]*>/i,
  )
  const robots = getTag(
    html,
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/i,
  )

  if (title !== metadata.title) errors.push(`${routePath}: title mismatch`)
  if (description !== metadata.description) errors.push(`${routePath}: description mismatch`)
  if (canonical !== expectedCanonical) errors.push(`${routePath}: canonical mismatch (${canonical})`)
  if (ogUrl !== expectedCanonical) errors.push(`${routePath}: og:url mismatch (${ogUrl})`)

  const expectedRobots = isRouteIndexable(route) ? 'index, follow' : 'noindex, follow'
  if (robots !== expectedRobots) errors.push(`${routePath}: robots mismatch (${robots})`)

  const schemaMatch = html.match(
    /<script\s+id=["']whenisdue-route-structured-data["'][^>]*>([\s\S]*?)<\/script>/i,
  )

  if (isRouteIndexable(route) && !schemaMatch) {
    errors.push(`${routePath}: missing crawl-facing JSON-LD`)
  }

  if (schemaMatch) {
    try {
      JSON.parse(schemaMatch[1])
    } catch {
      errors.push(`${routePath}: invalid crawl-facing JSON-LD`)
    }
  }

  if (isRouteIndexable(route)) indexablePaths.add(routePath)
}

const sitemapPath = path.join(DIST, 'sitemap.xml')
const sitemap = await fs.readFile(sitemapPath, 'utf8')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const sitemapPaths = new Set(
  sitemapUrls.map((url) => new URL(url).pathname.replace(/\/$/, '') || '/'),
)

for (const url of sitemapUrls) {
  const parsed = new URL(url)
  if (parsed.origin !== SITE_ORIGIN) errors.push(`sitemap: wrong origin ${url}`)
  if (parsed.search) errors.push(`sitemap: parameterized URL ${url}`)
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    errors.push(`sitemap: trailing slash ${url}`)
  }
}

for (const routePath of indexablePaths) {
  if (!sitemapPaths.has(routePath)) errors.push(`sitemap: missing indexable route ${routePath}`)
}

for (const sitemapPathname of sitemapPaths) {
  if (!indexablePaths.has(sitemapPathname)) {
    errors.push(`sitemap: undeclared or non-indexable route ${sitemapPathname}`)
  }
}

if (sitemapUrls.length !== new Set(sitemapUrls).size) {
  errors.push('sitemap: duplicate URLs found')
}

if (errors.length > 0) {
  console.error('Crawl-surface verification FAILED:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Crawl-surface verification passed for ${Object.keys(ROUTE_PATH_TO_NAME).length} routes and ${sitemapUrls.length} sitemap URLs.`,
)
