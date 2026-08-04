import type { TypingCategory } from './typingTypes'

export const typingCategoryLabels: Record<TypingCategory, string> = {
  'va-email': 'VA emails',
  office: 'General office work',
}

const vaEmailPassages = [
  'Hi Sarah, I am following up about your appointment on Thursday, August 6 at 2:30 PM. Please let me know whether the time still works for you or if you would prefer to reschedule.',
  'Good morning, Daniel. I reviewed the calendar and moved your planning call to Tuesday at 10:00 AM. I also sent an updated invitation to everyone on the attendee list.',
  'Hello Mia, this is a friendly reminder that the revised content calendar is due tomorrow. I can upload the final version as soon as you approve the two remaining captions.',
  'Hi Robert, thank you for sending the invoice. I forwarded it to the accounting team and asked them to confirm the expected payment date. I will follow up again on Friday if needed.',
  'Good afternoon, Elaine. Your customer requested an update regarding order 48217. The package is currently in transit and the estimated delivery date is September 14.',
  'Hi Anthony, I completed the meeting notes and organized the action items by owner and deadline. The document is ready for your review in the shared project folder.',
  'Hello Rachel, I am checking whether you received the proposal sent last Monday. Please tell me if you need another copy or would like me to arrange a short follow-up call.',
  'Good morning, Kevin. I confirmed the venue reservation for 24 guests on October 9 at 6:00 PM. The restaurant requires the final head count three days before the event.',
  'Hi Olivia, the client approved the first draft but requested changes to the opening paragraph and pricing table. I added both revisions to today’s priority list.',
  'Hello Marcus, I noticed that the calendar invitation still lists the old video link. I replaced it with the correct meeting room and notified all six participants.',
  'Good afternoon, Jasmine. I answered the support messages received overnight and flagged two billing concerns for your review. No urgent cancellations were reported.',
  'Hi Thomas, here is today’s progress update: the spreadsheet is complete, the vendor reply is still pending, and the presentation is scheduled for final review at 4:15 PM.',
  'Hello Andrea, the customer asked to change the delivery address to 318 West Pine Street, Unit 4B. Please confirm whether I should update the order before noon.',
  'Good morning, Steven. I prepared the weekly email summary with completed tasks, blocked items, upcoming deadlines, and questions that still require your decision.',
  'Hi Nicole, I called the clinic and confirmed your follow-up visit for November 12 at 9:45 AM. They asked you to arrive fifteen minutes early and bring a valid identification card.',
]

const officePassages = [
  'Please review the attached report before the team meeting. Add your comments beside each open question and mark any figures that need to be verified.',
  'The weekly schedule includes three client calls, two project reviews, and one training session. Leave at least thirty minutes between appointments for notes and follow-up.',
  'Enter each customer name, email address, phone number, and order reference in the correct spreadsheet column. Check the source document before saving the final entry.',
  'Today’s priorities are to confirm the venue, update the contact list, prepare the agenda, and send the revised meeting invitation before 3:00 PM.',
  'A clear status update should explain what is complete, what is still in progress, what is blocked, and what decision is needed from the client.',
  'Before closing the task, confirm that the file name is correct, the final document is in the shared folder, and the appropriate people have been notified.',
  'The support queue should be reviewed in order of urgency. Handle account access problems first, then billing questions, delivery updates, and general requests.',
  'Use consistent formatting for dates, phone numbers, headings, and currency values. Small data-entry errors can create confusion in later reports.',
  'The project coordinator moved the deadline from Monday to Wednesday. Update the task board, calendar reminder, progress report, and client summary.',
  'When a request is unclear, write down the specific question and ask for confirmation before making a permanent change to the record.',
  'The afternoon checklist includes reviewing new messages, updating overdue items, preparing tomorrow’s schedule, and recording anything that is waiting on a reply.',
  'Save the original document before editing a large section. Use a descriptive file name so another team member can identify the latest approved version.',
  'The training session begins at 1:30 PM in Conference Room B. Participants should bring a laptop, charger, notebook, and a copy of the onboarding guide.',
  'A professional follow-up is brief, polite, and specific. Mention the original request, explain what is still needed, and provide a clear next step.',
  'At the end of the day, compare the completed work with the task list and move unfinished items to the correct date instead of leaving them unassigned.',
]

const passagePools: Record<TypingCategory, string[]> = {
  'va-email': vaEmailPassages,
  office: officePassages,
}

function shuffledIndexes(length: number, seed: number): number[] {
  const indexes = Array.from({ length }, (_, index) => index)
  let value = Math.max(1, Math.floor(seed))

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    value = (value * 48271) % 2147483647
    const swapIndex = value % (index + 1)
    const current = indexes[index]
    indexes[index] = indexes[swapIndex]
    indexes[swapIndex] = current
  }

  return indexes
}

export function buildTypingText(category: TypingCategory, seed: number): string {
  const pool = passagePools[category]
  const blocks: string[] = []

  for (let round = 0; round < 3; round += 1) {
    const order = shuffledIndexes(pool.length, seed + round * 97)
    for (const index of order) {
      blocks.push(pool[index])
    }
  }

  return blocks.join(' ')
}
