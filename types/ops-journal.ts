import { z } from 'zod';

export const OpsEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    eventType: z.literal("DRAFT_INITIALIZED"),
    draftId: z.string(),
    conflictId: z.string(),
    operatorId: z.string(),
    revision: z.number().default(1),
  }),
  z.object({
    eventType: z.literal("GATE_FAILURE"),
    draftId: z.string(),
    errorCode: z.string(), // e.g., E_TIMELOCK_NOT_MATURE
    context: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    eventType: z.literal("RECOVERY_ACTION"),
    draftId: z.string(),
    actionTaken: z.string(),
    supersededByDraftId: z.string().optional(),
  }),
  z.object({
    eventType: z.literal("PUBLISH_INTENT_EXPORTED"),
    draftId: z.string(),
    destination: z.string(),
  })
]).and(z.object({
  ts: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime",
  }),
  eventId: z.string().uuid(),
}));

export type OpsEvent = z.infer<typeof OpsEventSchema>;