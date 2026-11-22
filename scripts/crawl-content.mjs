const calculatorRoutes = new Set([
  'business-days',
  'business-days-between',
  'business-hours-deadline',
  'next-payday',
  'deadline-calculator',
  'shipping-delivery-range',
  'two-ten-net-30',
  'notice-period',
  'subscription-renewal',
  'free-trial',
  'return-window',
  'invoice-due-date',
  'net-7',
  'net-15',
  'net-30',
  'net-45',
  'net-60',
  'net-90',
])

const toolGuidance = {
  'business-days': [
    'A business-day result depends on the selected start-day convention and holiday calendar. Check the result explanation, then use the calendar that matches the rule you need to follow.',
  ],
  'business-days-between': [
    'The start and end date convention changes the total. Compare the selected convention with the wording in the agreement or schedule you are checking.',
  ],
  'business-hours-deadline': [
    'The result uses a work schedule and time zone. Confirm that the selected business hours, weekends, and holiday calendar match the applicable service rule.',
  ],
  'deadline-calculator': [
    'Choose calendar or business days, whether the trigger date counts, and any permitted final-day adjustment. A selected rule is an assumption, not a decision about which law or agreement governs.',
  ],
  'return-window': [
    'The return calculator counts calendar days and lets you choose whether the start date is Day 1. It does not automatically extend weekends or holidays; follow the seller policy and applicable rules.',
    'See the worked guide on purchase dates, delivery dates, and Day 1 counting.',
  ],
  'invoice-due-date': [
    'Invoice terms may use the invoice date, receipt, delivery, service completion, or an end-of-month rule as the starting point. Use the trigger date and convention stated in the written terms.',
  ],
  'two-ten-net-30': [
    'The 2% discount date and the full Net 30 date are separate calculations. Check which amount qualifies for a discount and which event starts each period.',
    'See the worked guide to Net 30 and 2/10 Net 30 dates.',
  ],
  'notice-period': [
    'A notice period can depend on when a notice is considered given or received, not just the event date. Verify the period unit, cutoff, and delivery method in the governing instructions.',
  ],
  'shipping-delivery-range': [
    'An estimate in business days may skip weekends and selected holidays. A carrier estimate is not a guarantee that a parcel will arrive on the calculated date.',
  ],
  'subscription-renewal': [
    'Billing cycles and cancellation cutoffs can differ. Check the service terms for the next charge date, notice period, and when a cancellation request takes effect.',
  ],
  'free-trial': [
    'A trial may end at a specific time or time zone, and the first paid charge may follow a separate schedule. Verify both in the provider’s terms.',
  ],
  'next-payday': [
    'Enter a known payday and the schedule that follows it. Weekly and biweekly dates use repeating intervals, while semimonthly and monthly schedules follow calendar dates that can fall differently across shorter months.',
    'If payday shifts around weekends, holidays, or employer processing, the actual deposit date can differ from the schedule calculation.',
  ],
  'net-7': ['Net 7 is modeled here as seven calendar days after the invoice date. Confirm whether the written terms start the count on the invoice date, receipt, delivery, or another event.'],
  'net-15': ['Net 15 is modeled here as fifteen calendar days after the invoice date. Check the invoice for the trigger date and any end-of-month, weekend, or holiday rule.'],
  'net-30': ['Net 30 is modeled here as thirty calendar days after the invoice date. The invoice or agreement may instead use receipt, delivery, service completion, or an end-of-month rule.'],
  'net-45': ['Net 45 is modeled here as forty-five calendar days after the invoice date. Verify the trigger date and any special payment or final-day rule in the written terms.'],
  'net-60': ['Net 60 is modeled here as sixty calendar days after the invoice date. Confirm the date that starts the period and any end-of-month or business-day adjustment in the agreement.'],
  'net-90': ['Net 90 is modeled here as ninety calendar days after the invoice date. Use the invoice or agreement to confirm the trigger date, unit, and any adjustment rule.'],
}

const guideDetails = {
  'start-date-count-guide': [
    'Compare two common counting conventions: the trigger date is Day 1, or the following date is Day 1. The exact wording and applicable rule determine which one to use.',
  ],
  'weekends-business-days-guide': [
    'Weekends are included in calendar-day counts. A business-day count typically skips weekend dates, while the governing agreement may define a different business-day calendar.',
  ],
  'public-holidays-business-days-guide': [
    'A public holiday is skipped only when the relevant rule and holiday calendar say it is. A date calculator cannot infer which region or institution’s holiday schedule applies.',
  ],
  'how-long-business-days-guide': [
    'A sequence of business days stretches across weekends and may extend further when a holiday calendar is applied. Starting date and holiday assumptions affect the final date.',
  ],
  'within-days-guide': [
    '“Within X days” usually points to the last date in the stated period, but the trigger date, Day 1 convention, cutoff, and governing wording still matter.',
  ],
  'net-30-vs-30-days-guide': [
    'Thirty calendar days is date arithmetic. Net 30 is an invoice payment term whose trigger date and counting method come from the invoice or agreement.',
  ],
  'thirty-days-vs-one-month-guide': [
    'Thirty days is a fixed period; one calendar month follows month boundaries. Month-end and leap-year examples show why the resulting dates can differ.',
  ],
  'by-friday-guide': [
    'In ordinary language “by Friday” generally includes Friday, but it does not set an exact hour, time zone, or sent-versus-received test.',
  ],
  'stop-automatic-debit-guide': [
    'The guide discusses the U.S. Regulation E rule for certain preauthorized transfers. The consumer’s financial institution defines its own business-day calendar and process.',
  ],
  'postmarked-vs-received-guide': [
    'A postmarked-by requirement focuses on the qualifying mailing mark; a received-by requirement focuses on arrival. The organization’s exact acceptance rules control.',
  ],
  'deadline-weekend-extension-guide': [
    'A Saturday or Sunday deadline does not automatically move to Monday. Look for a final-day adjustment rule and check whether a holiday changes it again.',
  ],
  'net-terms-guide': [
    'A worked $1,000 example separates a 2% early-payment discount from the Net 30 due date and states the invoice-date and Day 1 assumptions used.',
  ],
  'return-window-guide': [
    'A worked 30-day example compares counting from the purchase date with counting from the day after it, then checks delivery-date and return-method details.',
  ],
}

const headings = {
  home: 'Date and deadline answers, with clear counting rules',
  calculators: 'Date and deadline calculators',
  guides: 'Date and deadline guides',
  about: 'About WhenIsDue',
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  contact: 'Contact WhenIsDue',
}

function section(title, paragraphs = [], links = []) {
  return { title, paragraphs, links }
}

function pageContent(route, metadata, routes, guideCategories) {
  const heading = headings[route] ?? metadata.title.replace(/\s*(?:\||-)\s*WhenIsDue.*$/i, '')
  const sections = []
  const pageLinks = []

  if (route === 'home') {
    sections.push(section('Start with the counting rule', [
      'Calendar-day counts include weekends. Business-day calculations skip weekends; public holidays are skipped only when the selected calendar and rule include them. Some calculators let you choose whether the start date counts.',
      'For an important deadline, verify the starting event, cutoff time, and any weekend or holiday adjustment in the original invoice, receipt, return policy, contract, or official notice.',
    ], [
      { title: 'Browse calculators', href: '/calculators', description: 'Choose the date tool that matches your task.' },
      { title: 'Read date and deadline guides', href: '/guides', description: 'Work through day-counting, wording, invoice, and return examples.' },
    ]))
  } else if (route === 'calculators') {
    const links = routes
      .filter((item) => calculatorRoutes.has(item.route))
      .map((item) => ({
        title: item.metadata.title.replace(/\s*(?:\||-)\s*WhenIsDue.*$/i, ''),
        href: item.path,
        description: item.metadata.description,
      }))
    sections.push(section('Choose a focused calculator', [
      'Each tool explains the assumptions used in its date result. Check the original terms before treating a calculated date as a formal deadline.',
    ], links))
  } else if (route === 'guides') {
    sections.push(section('A practical way to check a date', [
      'Find the event that starts the count, read whether the period uses calendar days or business days, confirm whether the trigger date is Day 1, and apply weekend or holiday adjustments only when the source rule calls for them.',
      'A 10-day period from Friday, June 5, 2026 ends Monday, June 15 when counting begins the next day, or Sunday, June 14 when June 5 is Day 1. This example shows arithmetic; the controlling wording decides which date applies.',
    ], guideCategories.flatMap((category) => category.guides.map((guide) => ({
      title: guide.title,
      href: guide.href,
      description: guide.description,
    })))))
  } else if (route === 'about') {
    sections.push(
      section('What WhenIsDue does', [
        'WhenIsDue helps answer date and deadline questions such as when an invoice is due, what date falls a certain number of business days away, when a return window ends, and when a trial expires.',
        'The goal is to show the answer first, then make the rules and assumptions behind it easy to understand.',
      ]),
      section('How date answers are calculated', [
        'WhenIsDue uses deterministic date calculations and makes selected counting assumptions visible. A calculator reports the date produced by those inputs; it does not decide which contract, retailer policy, or legal rule controls.',
      ]),
      section('Editorial approach and corrections', [
        'Guides separate arithmetic examples from rules that apply to a particular contract, retailer, service, or jurisdiction, and link to source material when a formal rule is discussed. If you spot a wrong calculation or unclear explanation, email contact.whenisdue@gmail.com with the page address, the wording or source to check, and the result you expected. Leave out passwords and confidential client information.',
      ]),
      section('Built for clarity', [
        'Many date questions depend on whether the start date counts, whether weekends are skipped, which public holidays apply, or whether a final date should move to another business day. WhenIsDue aims to keep these details explicit while keeping the main answer easy to reach.',
      ]),
      section('Independent service', [
        'WhenIsDue is a small independent project. It is not affiliated with the governments, courts, employers, retailers, financial institutions, carriers, service providers, or other organizations whose dates or deadlines you may calculate.',
      ]),
      section('Important reminder', [
        'WhenIsDue is for general information and planning. For important legal, financial, employment, contractual, medical, school, or other official deadlines, verify the applicable rule and final date with the original or authoritative source.',
      ]),
      section('Contact', [
        'Questions, corrections, support requests, privacy requests, and account-deletion requests can be sent to contact.whenisdue@gmail.com.',
      ], [{ title: 'Email contact.whenisdue@gmail.com', href: 'mailto:contact.whenisdue@gmail.com' }]),
    )
  } else if (route === 'privacy') {
    sections.push(
      section('Effective date', [
        'This Privacy Policy is effective November 21, 2026. It explains how WhenIsDue handles information used by public calculators and the VA Workspace.',
      ]),
      section('Public calculators and saved dates', [
        'The public due-date calculators do not require an account. Dates and labels that a visitor chooses to save through those calculators are stored in the browser on that device. Clearing browser data, using private browsing, changing browsers, or switching devices may remove or hide those records. Calculator records are separate from VA Workspace cloud records.',
      ]),
      section('Discontinued answer feedback', [
        'Public pages no longer display or submit answer feedback. While the feature was available, a response could include the page path, whether the answer satisfied your query, one preset reason if you chose “Not quite,” and the time recorded. The feature did not intentionally include calculator inputs, URL query parameters, account identifiers, email addresses, or free-text notes. Its browser-storage marker for limiting repeat prompts is no longer used. Historical feedback records may remain in backend storage; discontinuing the feature did not delete them. For privacy-related requests, contact WhenIsDue using the method listed below.',
      ]),
      section('Advertising cookies and preferences', [
        'If Google ads are displayed on WhenIsDue, Google and third-party advertising vendors may use cookies, web beacons, IP addresses, or similar identifiers to serve and measure ads, including ads based on a visitor’s previous activity on this or other sites. Which vendors and ad networks can serve ads depends on the settings selected for the site; Google publishes provider names and data-use information in its current AdSense ad technology partner list.',
        'Visitors can manage personalized advertising through Google Ads Settings or use AboutAds.info to opt out of some participating companies’ interest-based ads. If personalized ads are served to visitors in the EEA, the United Kingdom, or Switzerland, WhenIsDue will use a Google-certified consent management platform integrated with the IAB Transparency and Consent Framework.',
      ], [
        { title: 'Google Ads Settings', href: 'https://adssettings.google.com/' },
        { title: 'AboutAds.info choices', href: 'https://www.aboutads.info/' },
        { title: 'How Google uses data on partner sites and apps', href: 'https://policies.google.com/technologies/partner-sites' },
        { title: 'Google AdSense ad technology partner list', href: 'https://support.google.com/adsense/answer/9012903?hl=en' },
        { title: 'Google publisher consent requirements', href: 'https://support.google.com/adsense/answer/13554116?hl=en' },
      ]),
      section('Workspace and service providers', [
        'Creating a VA Workspace account requires an email address and password. Authentication and database services are provided through Supabase; WhenIsDue does not display passwords or include them in workspace backups. Workspace records may include client details, service descriptions, notes, tasks, dates, and statuses that a signed-in user chooses to enter. Vercel provides website hosting and deployment.',
        'Information is used to provide account access, save and synchronize workspace records, respond to support requests, address technical or security issues, and operate and improve WhenIsDue. Workspace records are not sold or used for advertising. The operator may access stored records when reasonably necessary for support, security, legal compliance, account deletion, or service administration.',
      ]),
      section('Security, backups, and retention', [
        'Account authentication and database access controls are intended to separate each user’s workspace. No online service can guarantee absolute security. Users can download a JSON backup, but remain responsible for keeping their account and devices secure.',
        'Workspace records are generally retained while an account is active or as needed to provide the service. Limited information may be retained for security, fraud prevention, dispute resolution, legal obligations, or backup recovery.',
      ]),
      section('Choices and privacy requests', [
        'Workspace users can edit or delete records, download a backup, and request account deletion. Depending on applicable law, a person may also have rights to request access, correction, objection, portability, erasure, or blocking of personal information. Send a privacy or account-deletion request to contact.whenisdue@gmail.com from the account email; reasonable verification may be requested.',
        'Verified account-deletion requests are handled manually. WhenIsDue aims to delete the account and associated active workspace records within 30 days, except for limited information retained for legal, security, fraud-prevention, dispute, or backup-recovery purposes.',
      ]),
      section('Children and policy changes', [
        'WhenIsDue is not designed to collect personal information directly from children. Do not create an account or enter a child’s personal information unless you have the authority and lawful basis to do so. The policy may be updated as the service changes; the effective date will be revised when material changes are published.',
      ]),
    )
  } else if (route === 'contact') {
    sections.push(section('Questions, corrections, and support', [
      'Email the page address and describe what happened. For a calculation issue, include the dates and rule choices entered, the result expected, and the wording or source that should be checked. When reporting a content issue, quote only the relevant sentence or link to a public source.',
      'Do not send passwords, authentication codes, Supabase keys, or confidential client information. For a VA Workspace privacy or account-deletion request, email from the address associated with the account and state what you want changed or deleted; reasonable verification may be requested.',
      'WhenIsDue currently accepts support requests by email. Response timing can vary. Verified account-deletion requests are generally processed within 30 days.',
    ], [{ title: 'Email contact.whenisdue@gmail.com', href: 'mailto:contact.whenisdue@gmail.com' }]))
  } else if (guideDetails[route]) {
    sections.push(section('Key point and assumptions', guideDetails[route]))
    if (route === 'net-terms-guide') {
      sections.push(section('Sources for the examples', [
        'The common discount wording is described by Connecticut Department of Revenue Services guidance. The U.S. Treasury example describes the trigger used by its own vendor-payment program and is not a universal Net 30 rule.',
      ], [
        { title: 'Connecticut DRS: Treatment of Early Payment Discounts', href: 'https://portal.ct.gov/drs/publications/policy-statements/1996/ps-962-the-treatment-of-early-payment-discounts' },
        { title: 'U.S. Treasury IPP: Prompt Pay Guidance', href: 'https://fiscal.treasury.gov/financial-management-solutions/invoice-processing-platform-ipp/prompt-pay-guidance' },
      ]))
    }
    if (route === 'return-window-guide') {
      sections.push(section('Source for the checklist', [
        'The Federal Trade Commission recommends checking a seller’s return deadline and policy details and keeping purchase documentation.',
      ], [
        { title: 'FTC: Returns, refunds, and other resolutions', href: 'https://consumer.ftc.gov/articles/solving-problems-business-returns-refunds-and-other-resolutions' },
      ]))
    }
  } else if (toolGuidance[route]) {
    sections.push(section('Rules to check', toolGuidance[route]))
  } else if (/^(three|four|five|seven|eight|ten|twenty|thirty)-business-days$/.test(route)) {
    const count = route.split('-')[0]
    sections.push(section('How this quick answer is counted', [
      `This page calculates ${count} business days from today. Saturday and Sunday are skipped; the result uses the device’s current date and time zone. If the relevant rule excludes public holidays or uses another business-day calendar, confirm that calendar before relying on the date.`,
      'Use the Business Days Calculator to choose a different start date or supported holiday calendar.',
    ], [{ title: 'Open the Business Days Calculator', href: '/business-days-calculator', description: 'Choose another starting date and review the available counting options.' }]))
  } else if (route === 'terms') {
    sections.push(section('Date calculations and source rules', [
      'Calculators provide general date arithmetic for planning. A result may not account for a contract term, local law, time zone, provider-specific calendar, or special circumstance. Check an important date against its original or authoritative source.',
      'You are responsible for the information you enter and for having an appropriate right or lawful basis to store client information in VA Workspace. Do not use the service for unlawful activity, unauthorized access, credential theft, malicious code, or interference with the service.',
      'Workspace backups are an additional safeguard, not a guarantee of permanent storage or continuous availability. WhenIsDue does not provide legal, financial, tax, medical, employment, or other professional advice. The service is provided on an “as is” and “as available” basis to the extent permitted by law.',
      'The Terms are governed by the laws of the Republic of the Philippines, without regard to conflict-of-law principles. Rights that cannot legally be waived remain unaffected. Questions about the Terms or account deletion can be sent to contact.whenisdue@gmail.com.',
    ]))
  } else if (route === 'deadline-calculator') {
    sections.push(section('Select the rule that matches the source', toolGuidance[route]))
  }

  if (route !== 'calculators' && route !== 'guides' && route !== 'home' && route !== 'contact' && route !== 'privacy' && route !== 'about' && route !== 'terms') {
    const relatedGuides = route === 'return-window'
      ? [{ title: 'How to calculate a return-window deadline', href: '/return-window-deadline-guide', description: 'Compare trigger dates, Day 1, and weekend rules.' }]
      : route === 'return-window-guide'
        ? [{ title: 'Return window calculator', href: '/return-window-calculator', description: 'Compare the date produced by a selected trigger and Day 1 rule.' }]
        : route === 'net-terms-guide'
          ? [
            { title: 'Invoice due date calculator', href: '/invoice-due-date-calculator', description: 'Calculate invoice dates from the selected terms.' },
            { title: 'Net 30 vs. 30 days', href: '/net-30-vs-30-days', description: 'Compare a payment term with a simple 30-day duration.' },
          ]
          : route === 'two-ten-net-30' || route.startsWith('net-') || route === 'invoice-due-date'
        ? [{ title: 'Net 30 and 2/10 Net 30 worked examples', href: '/net-30-and-2-10-net-30', description: 'Separate the discount date from the full payment date.' }]
        : []
    pageLinks.push(...relatedGuides)
  }

  if (pageLinks.length > 0) sections.push(section('Related reading', [], pageLinks))

  return { heading, intro: metadata.description, sections }
}

export function getCrawlContent(route, metadata, routes = [], guideCategories = []) {
  return pageContent(route, metadata, routes, guideCategories)
}
