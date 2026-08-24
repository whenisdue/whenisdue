export type RouteName =
  | 'home'
  | 'calculators'
  | 'business-days'
  | 'business-days-between'
  | 'business-hours-deadline'
  | 'saved-calculations'
  | 'next-payday'
  | 'deadline-calculator'
  | 'start-date-count-guide'
  | 'weekends-business-days-guide'
  | 'public-holidays-business-days-guide'
  | 'how-long-business-days-guide'
  | 'shipping-delivery-range'
  | 'two-ten-net-30'
  | 'notice-period'
  | 'subscription-renewal'
  | 'within-days-guide'
  | 'net-30-vs-30-days-guide'
  | 'deadline-weekend-extension-guide'
  | 'three-business-days'
  | 'four-business-days'
  | 'five-business-days'
  | 'seven-business-days'
  | 'eight-business-days'
  | 'ten-business-days'
  | 'twenty-business-days'
  | 'thirty-business-days'
  | 'free-trial'
  | 'return-window'
  | 'invoice-due-date'
  | 'net-7'
  | 'net-15'
  | 'net-30'
  | 'net-45'
  | 'net-60'
  | 'net-90'
  | 'workspace'
  | 'typing'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'not-found'

export type RouteMetadata = {
  title: string
  description: string
  path: string
  openGraphDescription?: string
  twitterDescription?: string
}

export const ROUTE_PATH_TO_NAME = {
  "/": 'home',
  "/calculators": 'calculators',
  "/business-days-calculator": 'business-days',
  "/business-days-between-dates": 'business-days-between',
  "/business-hours-deadline-calculator": 'business-hours-deadline',
  "/saved-calculations": 'saved-calculations',
  "/next-payday-calculator": 'next-payday',
  "/deadline-calculator": 'deadline-calculator',
  "/does-the-start-date-count": 'start-date-count-guide',
  "/do-weekends-count-as-business-days": 'weekends-business-days-guide',
  "/do-public-holidays-count-as-business-days": 'public-holidays-business-days-guide',
  "/how-long-are-business-days": 'how-long-business-days-guide',
  "/shipping-delivery-range-calculator": 'shipping-delivery-range',
  "/2-10-net-30-calculator": 'two-ten-net-30',
  "/notice-period-calculator": 'notice-period',
  "/subscription-renewal-calculator": 'subscription-renewal',
  "/what-does-within-days-mean": 'within-days-guide',
  "/net-30-vs-30-days": 'net-30-vs-30-days-guide',
  "/what-if-a-deadline-falls-on-a-weekend": 'deadline-weekend-extension-guide',
  "/3-business-days-from-today": 'three-business-days',
  "/4-business-days-from-today": 'four-business-days',
  "/5-business-days-from-today": 'five-business-days',
  "/7-business-days-from-today": 'seven-business-days',
  "/8-business-days-from-today": 'eight-business-days',
  "/10-business-days-from-today": 'ten-business-days',
  "/20-business-days-from-today": 'twenty-business-days',
  "/30-business-days-from-today": 'thirty-business-days',
  "/free-trial-calculator": 'free-trial',
  "/return-window-calculator": 'return-window',
  "/invoice-due-date-calculator": 'invoice-due-date',
  "/net-7-due-date": 'net-7',
  "/net-15-due-date": 'net-15',
  "/net-30-due-date": 'net-30',
  "/net-45-due-date": 'net-45',
  "/net-60-due-date": 'net-60',
  "/net-90-due-date": 'net-90',
  "/workspace": 'workspace',
  "/typing": 'typing',
  "/about": 'about',
  "/privacy": 'privacy',
  "/terms": 'terms',
  "/contact": 'contact',
} as const satisfies Record<string, Exclude<RouteName, 'not-found'>>

export const ROUTE_PATHS = Object.keys(ROUTE_PATH_TO_NAME)

const NOINDEX_ROUTES = new Set<RouteName>(['not-found', 'saved-calculations', 'typing', 'workspace'])
const WEB_APPLICATION_ROUTES = new Set<RouteName>([
  'business-days',
  'business-days-between',
  'business-hours-deadline',
  'calculators',
  'deadline-calculator',
  'free-trial',
  'home',
  'invoice-due-date',
  'net-15',
  'net-30',
  'net-45',
  'net-60',
  'net-7',
  'net-90',
  'next-payday',
  'notice-period',
  'return-window',
  'shipping-delivery-range',
  'subscription-renewal',
  'two-ten-net-30'
])

export function getRouteFromPath(pathname: string): RouteName {
  return ROUTE_PATH_TO_NAME[pathname as keyof typeof ROUTE_PATH_TO_NAME] ?? 'not-found'
}

export function isRouteIndexable(route: RouteName) {
  return !NOINDEX_ROUTES.has(route)
}

export function getRouteSchemaKind(route: RouteName): 'WebApplication' | 'WebPage' | 'none' {
  if (route === 'workspace' || route === 'typing' || route === 'not-found') return 'none'
  return WEB_APPLICATION_ROUTES.has(route) ? 'WebApplication' : 'WebPage'
}

export function getRouteMetadata(route: RouteName, currentPath = '/'): RouteMetadata {
  if (route === 'calculators') {
    return {
      title: 'Date & Deadline Calculators - Business Days, Invoices, Returns & More | WhenIsDue',
      description: 'Choose a focused calculator for business days, invoice due dates, return deadlines, free trials, SLA business hours, paydays and more.',
      path: '/calculators',
    }
  }

  if (route === 'business-days') {
    return {
      title: 'Business Days Calculator - What Date Is 3, 5, 7 or 10 Business Days From Today? | WhenIsDue',
      description: 'See the exact date 3, 5, 7, 10 or any number of business days from today or another date. Weekends are skipped, with optional supported holiday calendars.',
      openGraphDescription: 'See the exact date 3, 5, 7 or 10 business days from today or calculate from any start date.',
      twitterDescription: 'Find the exact date 3, 5, 7 or 10 business days from today.',
      path: '/business-days-calculator',
    }
  }

  if (route === 'business-days-between') {
    return {
      title: 'Business Days Between Dates Calculator | WhenIsDue',
      description: 'Count business days between two dates instantly. Weekends are skipped and the counting rule is shown clearly.',
      openGraphDescription: 'Count weekdays between two dates instantly with a clear start-date and end-date counting rule.',
      twitterDescription: 'Count business days between two dates instantly.',
      path: '/business-days-between-dates',
    }
  }

  if (route === 'business-hours-deadline') {
    return {
      title: 'Business Hours Deadline Calculator for SLAs | WhenIsDue',
      description: 'Add business hours to a date and time using a workday schedule. Skip weekends and optionally supported public holidays.',
      openGraphDescription: 'Calculate an SLA or response deadline using business hours, workday times, weekends, and optional holiday calendars.',
      twitterDescription: 'Add business hours to a date and time and calculate the exact deadline.',
      path: '/business-hours-deadline-calculator',
    }
  }

  if (route === 'saved-calculations') {
    return {
      title: 'Saved Calculations - WhenIsDue',
      description: 'Reopen recent and favorite WhenIsDue calculations saved on this device.',
      path: '/saved-calculations',
    }
  }

  if (route === 'next-payday') {
    return {
      title: 'Next Payday Calculator | WhenIsDue',
      description: 'Find your next payday for weekly, biweekly, semimonthly, or monthly pay schedules.',
      openGraphDescription: 'Enter a known payday and pay schedule to calculate the next payday instantly.',
      twitterDescription: 'Calculate your next payday from a known payday and pay schedule.',
      path: '/next-payday-calculator',
    }
  }

  if (route === 'deadline-calculator') {
    return {
      title: 'Deadline Calculator - Business or Calendar Day Rules | WhenIsDue',
      description: 'Calculate a deadline with explicit rules for the start day, business or calendar days, public holidays, and final-day adjustment.',
      openGraphDescription: 'Choose how a deadline should be counted and see the exact date plus the assumptions used.',
      twitterDescription: 'Calculate a deadline with clear business-day, holiday, and counting rules.',
      path: '/deadline-calculator',
    }
  }

  if (route === 'start-date-count-guide') {
    return {
      title: 'Does the Start Date Count? Day 0 vs Day 1 Explained | WhenIsDue',
      description: 'Learn when a deadline start date counts as day 1, when counting starts after it, and how ambiguous wording can produce two different due dates.',
      openGraphDescription: 'See how day-zero and day-one deadline counting can produce different dates, with a clear worked example.',
      twitterDescription: 'Does the start date count? Compare day-zero and day-one deadline counting.',
      path: '/does-the-start-date-count',
    }
  }

  if (route === 'weekends-business-days-guide') {
    return {
      title: 'Do Weekends Count as Business Days? | WhenIsDue',
      description: 'See whether Saturdays and Sundays count as business days, how business days differ from calendar days, and what happens when a deadline lands on a weekend.',
      openGraphDescription: 'Learn how weekends are treated in standard business-day counting, with a clear Friday-to-Monday example.',
      twitterDescription: 'Do weekends count as business days? See the standard Monday–Friday rule and worked example.',
      path: '/do-weekends-count-as-business-days',
    }
  }

  if (route === 'public-holidays-business-days-guide') {
    return {
      title: 'Do Public Holidays Count as Business Days? | WhenIsDue',
      description: 'See when public holidays count as business days, when they are skipped, and how the selected holiday calendar can change a deadline.',
      openGraphDescription: 'Learn how public holidays affect business-day deadlines with a clear US Labor Day example.',
      twitterDescription: 'Do public holidays count as business days? See when they count, when they are skipped, and why the calendar matters.',
      path: '/do-public-holidays-count-as-business-days',
    }
  }

  if (route === 'how-long-business-days-guide') {
    return {
      title: 'How Long Are Business Days? 1–30 Business Days Explained | WhenIsDue',
      description: 'See how long 1, 3, 5, 10, 20 or 30 business days usually take in calendar time, why weekends change the wait, and when holidays can extend it.',
      openGraphDescription: 'See how long common business-day periods usually take and use the Business Days Calculator for the exact date.',
      twitterDescription: 'How long are 3, 5, 10 or 30 business days? See the quick answer and calculate the exact date.',
      path: '/how-long-are-business-days',
    }
  }

  if (route === 'shipping-delivery-range') {
    return {
      title: 'Shipping Delivery Date Range Calculator | WhenIsDue',
      description: 'Turn a shipping estimate such as 3–5 business days into exact earliest and latest delivery dates, with optional holiday-aware counting.',
      openGraphDescription: 'Enter an order or ship date and convert a business-day or calendar-day shipping range into actual delivery dates.',
      twitterDescription: 'Convert 3–5 business days into exact earliest and latest delivery dates.',
      path: '/shipping-delivery-range-calculator',
    }
  }

  if (route === 'two-ten-net-30') {
    return {
      title: '2/10 Net 30 Calculator - Discount & Due Date | WhenIsDue',
      description: 'Enter an invoice date to calculate the 2% early-payment discount deadline and the final Net 30 due date for 2/10 Net 30 terms.',
      openGraphDescription: 'Calculate both dates in 2/10 Net 30 payment terms: the 10-day discount deadline and the 30-day final due date.',
      twitterDescription: 'Calculate the 2/10 Net 30 discount deadline and final invoice due date.',
      path: '/2-10-net-30-calculator',
    }
  }

  if (route === 'notice-period') {
    return {
      title: 'Notice Period Calculator - Find the Last Date to Give Notice | WhenIsDue',
      description: 'Count backward from a renewal or event date to find the latest date to give notice in calendar days, business days, weeks, or months.',
      openGraphDescription: 'Enter an event date and notice period to find the last date to give notice, with optional business-day and holiday rules.',
      twitterDescription: 'Calculate the last date to give notice before a renewal, cancellation, or other event.',
      path: '/notice-period-calculator',
    }
  }

  if (route === 'subscription-renewal') {
    return {
      title: 'Subscription Renewal & Cancellation Calculator | WhenIsDue',
      description: 'Find the next subscription renewal date and, if advance notice is required, the last day to cancel before renewal.',
      openGraphDescription: 'Enter the last renewal or start date, billing interval, and optional cancellation notice period to see both dates.',
      twitterDescription: 'Calculate your next subscription renewal date and optional last day to cancel.',
      path: '/subscription-renewal-calculator',
    }
  }

  if (route === 'within-days-guide') {
    return {
      title: 'What Does “Within X Days” Mean? | WhenIsDue',
      description: 'See why “within X days” can be ambiguous, compare before-versus-after interpretations, and calculate both possible dates.',
      openGraphDescription: 'Understand “within X days” wording and compare both possible directions before relying on it as a deadline.',
      twitterDescription: 'What does “within X days” mean? Compare the common interpretations and calculate both dates.',
      path: '/what-does-within-days-mean',
    }
  }

  if (route === 'net-30-vs-30-days-guide') {
    return {
      title: 'Net 30 vs 30 Days: Are They the Same? | WhenIsDue',
      description: 'See when Net 30 and 30 calendar days produce the same due date, why the payment-term wording can still matter, and compare both dates.',
      openGraphDescription: 'Compare Net 30 with a simple 30-day duration and see when payment-term wording can change the result.',
      twitterDescription: 'Is Net 30 the same as 30 days? Compare the dates and understand why the payment-term wording matters.',
      path: '/net-30-vs-30-days',
    }
  }

  if (route === 'deadline-weekend-extension-guide') {
    return {
      title: 'What If a Deadline Falls on a Weekend? | WhenIsDue',
      description: 'See when a Saturday or Sunday deadline may move to the next business day, when it may stay put, and how holidays can affect the final date.',
      openGraphDescription: 'Does a weekend deadline automatically move to Monday? See why the governing rule controls the final-day adjustment.',
      twitterDescription: 'What happens when a deadline falls on a weekend? See when it may move to the next business day.',
      path: '/what-if-a-deadline-falls-on-a-weekend',
    }
  }

  if (
    route === 'three-business-days' ||
    route === 'four-business-days' ||
    route === 'five-business-days' ||
    route === 'seven-business-days' ||
    route === 'eight-business-days' ||
    route === 'ten-business-days' ||
    route === 'twenty-business-days' ||
    route === 'thirty-business-days'
  ) {
    const dayCountByRoute = {
      'three-business-days': 3,
      'four-business-days': 4,
      'five-business-days': 5,
      'seven-business-days': 7,
      'eight-business-days': 8,
      'ten-business-days': 10,
      'twenty-business-days': 20,
      'thirty-business-days': 30,
    } as const
    const dayCount = dayCountByRoute[route]

    return {
      title: `${dayCount} Business Days From Today: Exact Date | WhenIsDue`,
      description: `See the exact date ${dayCount} business days from today instantly. Weekends are skipped and your device time zone is shown.`,
      openGraphDescription: `Get the exact date ${dayCount} business days from today instantly, with weekends skipped.`,
      twitterDescription: `See the exact date ${dayCount} business days from today instantly.`,
      path: `/${dayCount}-business-days-from-today`,
    }
  }

  if (route === 'free-trial') {
    return {
      title: 'Free Trial Calculator - WhenIsDue',
      description: 'Estimate when a free trial ends and see a suggested one-day-before reminder.',
      path: '/free-trial-calculator',
    }
  }

  if (route === 'return-window') {
    return {
      title: '30 Day Return Policy Calculator & Return Window Calculator | WhenIsDue',
      description: 'Calculate the last day of a 30-day return policy or any custom return window from the purchase or delivery date. Supports 7, 14, 30, 60 and 90-day windows.',
      openGraphDescription: 'Calculate the last day of a 30-day return policy or any custom return window from the purchase or delivery date.',
      twitterDescription: 'Calculate the last day of a 30-day return policy or custom return window.',
      path: '/return-window-calculator',
    }
  }

  if (route === 'invoice-due-date') {
    return {
      title: 'Invoice Due Date Calculator - Net 7, 15, 30, 45, 60 & 90 | WhenIsDue',
      description: 'Enter an invoice date and payment terms to see the due date instantly. Calculate Net 7, Net 15, Net 30, Net 45, Net 60, Net 90 and EOM terms.',
      openGraphDescription: 'Calculate an invoice due date instantly from common Net payment terms or end-of-month terms.',
      twitterDescription: 'Enter an invoice date and payment terms to see the due date instantly.',
      path: '/invoice-due-date-calculator',
    }
  }

  if (
    route === 'net-7' ||
    route === 'net-15' ||
    route === 'net-30' ||
    route === 'net-45' ||
    route === 'net-60' ||
    route === 'net-90'
  ) {
    const dayCountByRoute = {
      'net-7': 7,
      'net-15': 15,
      'net-30': 30,
      'net-45': 45,
      'net-60': 60,
      'net-90': 90,
    } as const
    const dayCount = dayCountByRoute[route]

    return {
      title: `Net ${dayCount} Due Date Calculator | WhenIsDue`,
      description: `Enter an invoice date and instantly see the Net ${dayCount} payment due date. Uses ${dayCount} calendar days after the invoice date.`,
      openGraphDescription: `Calculate a Net ${dayCount} invoice due date instantly from any invoice date.`,
      twitterDescription: `Find the Net ${dayCount} due date instantly.`,
      path: `/net-${dayCount}-due-date`,
    }
  }

  if (route === 'typing') {
    return {
      title: 'Free VA Typing Test and Practice | WhenIsDue',
      description: 'Practice realistic virtual assistant typing tests with professional emails, office passages, timed sessions, WPM, accuracy, and mistake analysis.',
      openGraphDescription: 'A free typing trainer for virtual assistant applicants with realistic work passages and timed practice.',
      twitterDescription: 'Practice VA typing tests with realistic emails, WPM, accuracy, and local progress history.',
      path: '/typing',
    }
  }

  if (route === 'workspace') {
    return {
      title: 'VA Workspace - WhenIsDue',
      description: 'A private cloud-synced client and follow-up workspace for virtual assistants.',
      path: '/workspace',
    }
  }

  if (route === 'about') {
    return {
      title: 'About WhenIsDue - Date & Deadline Answer Engine',
      description: 'Learn how WhenIsDue gives clear, deterministic date and deadline answers while making important counting rules and assumptions visible.',
      path: '/about',
    }
  }

  if (route === 'privacy') {
    return {
      title: 'Privacy Policy - WhenIsDue',
      description: 'Learn how WhenIsDue handles saved due dates, local browser storage, accounts, analytics, and ads.',
      path: '/privacy',
    }
  }

  if (route === 'terms') {
    return {
      title: 'Terms of Use - WhenIsDue',
      description: "Read the terms for using WhenIsDue's simple due date calculators.",
      path: '/terms',
    }
  }

  if (route === 'contact') {
    return {
      title: 'Contact - WhenIsDue',
      description: 'Contact WhenIsDue for questions, corrections, feedback, or calculation issues.',
      path: '/contact',
    }
  }

  if (route === 'not-found') {
    return {
      title: 'Page Not Found - WhenIsDue',
      description: 'That page does not exist yet. Choose a calculator or go back home.',
      path: currentPath,
    }
  }

  return {
    title: 'WhenIsDue - Instant Date and Deadline Answers',
    description: 'Get instant answers for business days, return deadlines, invoice due dates, free trials, and other common date questions.',
    openGraphDescription: 'WhenIsDue gives you the date first: business days, return deadlines, invoice due dates, trials, and more.',
    twitterDescription: 'Instant date and deadline answers without unnecessary steps.',
    path: '/',
  }
}
