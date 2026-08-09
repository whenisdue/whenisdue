import {
  type PlainDate,
  toDateKey,
} from './dateHelpers.ts'

export type DeadlineTriggerKind =
  | 'issued'
  | 'sent'
  | 'received'
  | 'delivered'
  | 'accepted'
  | 'filed'
  | 'served'

export type DeadlineTriggerSource =
  | 'explicit-user-wording'
  | 'user-selected'

export type DeadlineTriggerEvent = {
  kind: DeadlineTriggerKind
  label: string
}

export type DeadlineTrigger = {
  event: DeadlineTriggerEvent
  date: PlainDate
  source: DeadlineTriggerSource
  originalText: string | null
  ruleVersion: 'deadline-trigger-v1'
}

const triggerEvents: Record<DeadlineTriggerKind, DeadlineTriggerEvent> = {
  issued: {
    kind: 'issued',
    label: 'Issued',
  },
  sent: {
    kind: 'sent',
    label: 'Sent',
  },
  received: {
    kind: 'received',
    label: 'Received',
  },
  delivered: {
    kind: 'delivered',
    label: 'Delivered',
  },
  accepted: {
    kind: 'accepted',
    label: 'Accepted',
  },
  filed: {
    kind: 'filed',
    label: 'Filed',
  },
  served: {
    kind: 'served',
    label: 'Served',
  },
}

const triggerAliases: Record<string, DeadlineTriggerKind> = {
  issue: 'issued',
  issued: 'issued',
  issuance: 'issued',

  send: 'sent',
  sent: 'sent',
  sending: 'sent',

  receive: 'received',
  received: 'received',
  receipt: 'received',

  deliver: 'delivered',
  delivered: 'delivered',
  delivery: 'delivered',

  accept: 'accepted',
  accepted: 'accepted',
  acceptance: 'accepted',

  file: 'filed',
  filed: 'filed',
  filing: 'filed',

  serve: 'served',
  served: 'served',
  service: 'served',
}

function normalizeTriggerText(value: string) {
  return value.trim().toLowerCase().replace(/[.,;:!?]+$/g, '')
}

/**
 * Convert an explicit trigger word into a canonical trigger event.
 *
 * This function is intentionally conservative. It does not infer that
 * "invoice date", "order date", or another generic date means issued,
 * received, delivered, or any other clock-start event.
 */
export function parseDeadlineTriggerEvent(
  value: string,
): DeadlineTriggerEvent | null {
  const normalized = normalizeTriggerText(value)
  const kind = triggerAliases[normalized]

  if (!kind) return null

  return triggerEvents[kind]
}

export function getDeadlineTriggerEvent(
  kind: DeadlineTriggerKind,
): DeadlineTriggerEvent {
  return triggerEvents[kind]
}

export function createDeadlineTrigger(input: {
  kind: DeadlineTriggerKind
  date: PlainDate
  source: DeadlineTriggerSource
  originalText?: string | null
}): DeadlineTrigger {
  return {
    event: getDeadlineTriggerEvent(input.kind),
    date: input.date,
    source: input.source,
    originalText: input.originalText?.trim() || null,
    ruleVersion: 'deadline-trigger-v1',
  }
}

export function summarizeDeadlineTrigger(trigger: DeadlineTrigger) {
  return {
    event: trigger.event.kind,
    label: trigger.event.label,
    date: toDateKey(trigger.date),
    source: trigger.source,
    originalText: trigger.originalText,
    ruleVersion: trigger.ruleVersion,
  }
}
