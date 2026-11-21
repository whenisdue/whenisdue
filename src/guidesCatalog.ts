export type GuideItem = {
  title: string
  description: string
  href: string
}

export type GuideCategory = {
  title: string
  description: string
  guides: GuideItem[]
}

export const guideCategories: GuideCategory[] = [
  {
    title: 'Count the days',
    description: 'Start with the event, then choose the unit and counting convention.',
    guides: [
      {
        title: 'Does the start date count?',
        description: 'Compare counting the trigger date as Day 1 with beginning the next day.',
        href: '/does-the-start-date-count',
      },
      {
        title: 'What does “within X days” mean?',
        description: 'See what the final day usually means and why the starting point matters.',
        href: '/what-does-within-days-mean',
      },
      {
        title: 'Do weekends count as business days?',
        description: 'Compare business days with calendar days using a Friday example.',
        href: '/do-weekends-count-as-business-days',
      },
      {
        title: 'Do public holidays count as business days?',
        description: 'Learn when the chosen holiday calendar changes a working-day count.',
        href: '/do-public-holidays-count-as-business-days',
      },
      {
        title: 'How long are business days?',
        description: 'Translate common business-day periods into calendar time.',
        href: '/how-long-are-business-days',
      },
      {
        title: 'What if a deadline falls on a weekend?',
        description: 'Check whether the deadline stays put or moves under its governing rule.',
        href: '/what-if-a-deadline-falls-on-a-weekend',
      },
      {
        title: '30 days vs. one calendar month',
        description: 'Compare fixed-day arithmetic with month-based date arithmetic.',
        href: '/30-days-vs-one-month',
      },
    ],
  },
  {
    title: 'Read the wording',
    description: 'Small wording differences can change what has to happen by the date.',
    guides: [
      {
        title: 'Does “by Friday” include Friday?',
        description: 'Understand the usual meaning and the limits of a date without a cutoff time.',
        href: '/does-by-date-include-date',
      },
      {
        title: 'Postmarked by vs. received by',
        description: 'Separate a mailing-date requirement from an arrival-date requirement.',
        href: '/postmarked-by-vs-received-by',
      },
      {
        title: 'When must I notify my bank to stop an automatic debit?',
        description: 'Review the U.S. three-business-day rule and the bank-specific calendar caveat.',
        href: '/stop-automatic-debit-3-business-days',
      },
    ],
  },
  {
    title: 'Understand invoice terms',
    description: 'Use the written invoice terms as the source for the trigger date and payment rule.',
    guides: [
      {
        title: 'Net 30 vs. 30 days',
        description: 'See when the date arithmetic matches and why the wording still matters.',
        href: '/net-30-vs-30-days',
      },
      {
        title: 'Net 30 and 2/10 Net 30 worked examples',
        description: 'Compare a payment due date with an early-payment discount date.',
        href: '/net-30-and-2-10-net-30',
      },
    ],
  },
  {
    title: 'Returns and service deadlines',
    description: 'Find the event that starts the window and check what counts as completing it.',
    guides: [
      {
        title: 'How to calculate a return-window deadline',
        description: 'Compare purchase and delivery dates, Day 1 rules, weekends, and cutoff details.',
        href: '/return-window-deadline-guide',
      },
    ],
  },
]

export const guidePaths = guideCategories.flatMap((category) =>
  category.guides.map((guide) => guide.href),
)
