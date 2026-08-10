import { type DeadlineTriggerKind } from './deadlineTrigger.ts'
import { type HolidayCalendarId } from './holidayCalendars.ts'

export function getTriggerDisplayLabel(triggerKind: DeadlineTriggerKind | null) {
  if (triggerKind === 'issued') return 'Issue'
  if (triggerKind === 'sent') return 'Sent'
  if (triggerKind === 'received') return 'Receipt'
  if (triggerKind === 'delivered') return 'Delivery'
  if (triggerKind === 'accepted') return 'Acceptance'
  if (triggerKind === 'filed') return 'Filing'
  if (triggerKind === 'served') return 'Service'
  return 'Start date'
}

export function getHolidayCalendarDisplayLabel(id: HolidayCalendarId) {
  if (id === 'none') return 'No public-holiday exclusions'
  if (id === 'us') return 'US federal holidays'
  if (id === 'uk') return 'England & Wales bank holidays'
  if (id === 'ca') return 'Canada federal holidays'
  if (id === 'au') return 'Australia nationwide holidays'
  return 'Philippines predictable regular holidays'
}
