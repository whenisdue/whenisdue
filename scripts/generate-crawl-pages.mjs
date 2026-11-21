import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { getCrawlContent } from './crawl-content.mjs'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')
const ROUTE_METADATA_TS = path.join(ROOT, 'src', 'routeMetadata.ts')
const SITE_ORIGIN = 'https://www.whenisdue.com'

async function loadTypeScriptModule(sourcePath, tempFileName) {
  const source = await fs.readFile(sourcePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText

  const tempPath = path.join(ROOT, 'scripts', tempFileName)
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

function renderCrawlContent(routePath, content) {
  const navLinks = [
    ['Home', '/'],
    ['Calculators', '/calculators'],
    ['Guides', '/guides'],
    ['About', '/about'],
  ]
  const footerLinks = [
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Contact', '/contact'],
  ]
  const nav = navLinks.map(([label, href]) =>
    `<a href="${href}"${routePath === href ? ' aria-current="page"' : ''}>${label}</a>`,
  ).join('')
  const footer = footerLinks.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')
  const sections = content.sections.map((item) => {
    const paragraphs = item.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
    const links = item.links?.length
      ? `<ul>${item.links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.title)}</a>${link.description ? `<p>${escapeHtml(link.description)}</p>` : ''}</li>`).join('')}</ul>`
      : ''
    return `<section><h2>${escapeHtml(item.title)}</h2>${paragraphs}${links}</section>`
  }).join('')
  const contentMarkup = sections || '<section><h2>Check the source wording</h2><p>Use the instructions, invoice, policy, or notice that applies to your situation to confirm the trigger date, counting convention, and cutoff.</p></section>'
  const shell = `<div class="crawl-page"><header class="crawl-header"><a class="crawl-brand" href="/" aria-label="WhenIsDue home"><img src="/whenisdue-logo.png" alt="WhenIsDue" /></a><nav aria-label="Main navigation">${nav}</nav></header><main class="crawl-main" data-crawl-page="true"><p class="crawl-eyebrow">WhenIsDue</p><h1>${escapeHtml(content.heading)}</h1><p class="crawl-description">${escapeHtml(content.intro)}</p>${contentMarkup}</main><footer class="crawl-footer"><p>For planning only. Check the original terms for an important deadline.</p><nav aria-label="Footer navigation">${footer}</nav></footer></div>`
  return shell
}

function addCrawlBody(html, routePath, content, indexable) {
  if (!indexable) return html

  const crawlStyles = `<style id="whenisdue-crawl-styles">
    .crawl-page{max-width:1120px;margin:0 auto;padding:20px clamp(16px,4vw,42px) 32px;color:#212850;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}
    .crawl-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:8px 0 22px;border-bottom:1px solid #e6e9ed}
    .crawl-brand{display:inline-flex;align-items:center;min-height:42px}.crawl-brand img{width:154px;max-height:38px;object-fit:contain}
    .crawl-header nav,.crawl-footer nav{display:flex;flex-wrap:wrap;gap:10px 20px}.crawl-header a,.crawl-footer a{color:#325e75;font-weight:700;text-underline-offset:3px}
    .crawl-main{max-width:850px;margin:30px auto}.crawl-eyebrow{margin:0 0 6px;color:#167f78;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .crawl-main h1{margin:0;font-size:clamp(2rem,5vw,3.2rem);line-height:1.08;letter-spacing:-.035em}.crawl-description{max-width:760px;margin:13px 0 26px;color:#50647a;font-size:1.08rem;line-height:1.6}
    .crawl-main section{margin:24px 0;padding:0 0 22px;border-bottom:1px solid #e7ebef}.crawl-main h2{margin:0 0 9px;font-size:1.35rem;line-height:1.25}.crawl-main section p,.crawl-main li{max-width:780px;color:#45596f}.crawl-main section p{margin:8px 0;line-height:1.68}.crawl-main ul{display:grid;gap:12px;padding-left:22px}.crawl-main li>a{color:#146c69;font-weight:750}.crawl-main li p{margin:3px 0 0;font-size:.94rem}
    .crawl-footer{padding:18px 0 0;border-top:1px solid #e6e9ed;color:#61748a;font-size:.9rem}.crawl-footer p{margin:0 0 12px}
    @media(max-width:640px){.crawl-header{align-items:flex-start;flex-direction:column;gap:8px;padding-bottom:16px}.crawl-header nav{gap:8px 16px}.crawl-main{margin:22px auto}.crawl-description{font-size:1rem}}
  </style>`

  html = replaceOrInsert(html, /<style\s+id=["']whenisdue-crawl-styles["'][^>]*>[\s\S]*?<\/style>/i, crawlStyles)
  const rootPattern = /<div\s+id=["']root["']\s*>[\s\S]*?<\/div>/i
  if (!rootPattern.test(html)) throw new Error(`Could not find the React root while generating ${routePath}`)
  return html.replace(rootPattern, `<div id="root">${renderCrawlContent(routePath, content)}</div>`)
}

const routeModule = await loadTypeScriptModule(ROUTE_METADATA_TS, '.routeMetadata.generated.mjs')
const guideCatalogPath = path.join(ROOT, 'src', 'guidesCatalog.ts')
const guideCatalogModule = await loadTypeScriptModule(guideCatalogPath, '.guidesCatalog.generated.mjs')
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
const crawlRoutes = Object.entries(ROUTE_PATH_TO_NAME).map(([routePath, route]) => ({
  path: routePath,
  route,
  metadata: getRouteMetadata(route, routePath),
}))

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
await fs.writeFile(path.join(ROOT, 'public', 'sitemap.xml'), sitemapXml, 'utf8')

for (const [routePath, route] of Object.entries(ROUTE_PATH_TO_NAME)) {
  const metadata = getRouteMetadata(route, routePath)
  let html = applyHead(
    baseHtml,
    route,
    metadata,
    isRouteIndexable(route),
    getRouteSchemaKind(route),
  )

  html = addCrawlBody(
    html,
    routePath,
    getCrawlContent(route, metadata, crawlRoutes, guideCatalogModule.guideCategories),
    isRouteIndexable(route),
  )

  const outputPath =
    routePath === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, `${routePath.slice(1)}.html`)

  await fs.writeFile(outputPath, html, 'utf8')
}

const notFoundMetadata = getRouteMetadata('not-found', '/404')
let notFoundHtml = applyHead(
  baseHtml,
  'not-found',
  notFoundMetadata,
  false,
  'none',
)
notFoundHtml = addCrawlBody(notFoundHtml, '/404', getCrawlContent('not-found', notFoundMetadata), false)
await fs.writeFile(path.join(DIST, '404.html'), notFoundHtml, 'utf8')

console.log(
  `Generated crawl-facing HTML for ${Object.keys(ROUTE_PATH_TO_NAME).length} routes plus 404.html.`,
)
