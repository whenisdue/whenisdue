import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const ROUTE_METADATA_TS = path.join(ROOT, 'src', 'routeMetadata.ts')
const SITE_ORIGIN = 'https://www.whenisdue.com'

async function loadRouteMetadataModule() {
  const source = await fs.readFile(ROUTE_METADATA_TS, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: ROUTE_METADATA_TS,
  }).outputText

  const tempPath = path.join(ROOT, 'scripts', '.routeMetadata.generated.mjs')
  await fs.writeFile(tempPath, transpiled, 'utf8')

  try {
    return await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`)
  } finally {
    await fs.rm(tempPath, { force: true })
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function replaceOrInsert(html, pattern, replacement, marker = '</head>') {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace(marker, `    ${replacement}\n  ${marker}`)
}

function buildStructuredData(route, metadata, canonicalUrl, schemaKind) {
  if (schemaKind === 'none') return null

  const organizationId = `${SITE_ORIGIN}/#organization`
  const websiteId = `${SITE_ORIGIN}/#website`

  if (route === 'home') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': organizationId,
        name: 'WhenIsDue',
        url: `${SITE_ORIGIN}/`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'WhenIsDue',
        url: `${SITE_ORIGIN}/`,
        description:
          'Instant date and deadline answers for business days, returns, invoices, trials, and other common date questions.',
        inLanguage: 'en',
        publisher: { '@id': organizationId },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${SITE_ORIGIN}/#webapp`,
        name: 'WhenIsDue',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        url: canonicalUrl,
        description: metadata.description,
        provider: { '@id': organizationId },
        isPartOf: { '@id': websiteId },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ]
  }

  if (schemaKind === 'WebApplication') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#calculator`,
      name: metadata.title.replace(' - WhenIsDue', '').replace(' | WhenIsDue', ''),
      url: canonicalUrl,
      description: metadata.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      provider: { '@id': organizationId },
      isPartOf: { '@id': websiteId },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    name: metadata.title,
    url: canonicalUrl,
    description: metadata.description,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': organizationId },
  }
}

function applyHead(html, route, metadata, indexable, schemaKind) {
  const canonicalUrl = `${SITE_ORIGIN}${metadata.path}`
  const ogDescription = metadata.openGraphDescription ?? metadata.description
  const twitterDescription = metadata.twitterDescription ?? metadata.description
  const robots = indexable ? 'index, follow' : 'noindex, follow'

  html = replaceOrInsert(
    html,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(metadata.title)}</title>`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${robots}" />`,
  )
  html = replaceOrInsert(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
  )
  html = replaceOrInsert(
    html,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(twitterDescription)}" />`,
  )

  const structuredData = buildStructuredData(route, metadata, canonicalUrl, schemaKind)
  const schemaPattern = /<script\s+id=["']whenisdue-route-structured-data["'][^>]*>[\s\S]*?<\/script>/i

  if (structuredData) {
    const script = `<script id="whenisdue-route-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`
    html = replaceOrInsert(html, schemaPattern, script)
  } else if (schemaPattern.test(html)) {
    html = html.replace(schemaPattern, '')
  }

  return html
}

const routeModule = await loadRouteMetadataModule()
const {
  ROUTE_PATH_TO_NAME,
  getRouteMetadata,
  isRouteIndexable,
  getRouteSchemaKind,
} = routeModule

const baseHtml = await fs.readFile(path.join(DIST, 'index.html'), 'utf8')

const sitemapUrls = Object.entries(ROUTE_PATH_TO_NAME)
  .filter(([, route]) => isRouteIndexable(route))
  .map(([routePath]) => `${SITE_ORIGIN}${routePath}`)

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapUrls.flatMap((url) => [
    '  <url>',
    `    <loc>${url}</loc>`,
    '  </url>',
  ]),
  '</urlset>',
  '',
].join('\n')

await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf8')

for (const [routePath, route] of Object.entries(ROUTE_PATH_TO_NAME)) {
  const metadata = getRouteMetadata(route, routePath)
  const html = applyHead(
    baseHtml,
    route,
    metadata,
    isRouteIndexable(route),
    getRouteSchemaKind(route),
  )

  const outputPath =
    routePath === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, `${routePath.slice(1)}.html`)

  await fs.writeFile(outputPath, html, 'utf8')
}

const notFoundMetadata = getRouteMetadata('not-found', '/404')
const notFoundHtml = applyHead(
  baseHtml,
  'not-found',
  notFoundMetadata,
  false,
  'none',
)
await fs.writeFile(path.join(DIST, '404.html'), notFoundHtml, 'utf8')

console.log(
  `Generated crawl-facing HTML for ${Object.keys(ROUTE_PATH_TO_NAME).length} routes plus 404.html.`,
)
