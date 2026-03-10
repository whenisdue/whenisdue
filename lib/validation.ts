import { z } from "zod";
import { EventCategory, EventDateStatus } from "@prisma/client";

const baseEventFields = {
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (e.g., my-event-name)"),
  category: z.nativeEnum(EventCategory, { error: "Category is required" }),  description: z.string().trim().max(5000, "Description is too long").optional().or(z.literal("")),
  trending: z.boolean().optional().default(false),
  dateLabel: z.string().trim().optional().or(z.literal("")),
};

// 1. EXACT DATE SCHEMA
const exactSchema = z.object({
  ...baseEventFields,
  dateStatus: z.literal(EventDateStatus.EXACT),
  localDate: z.string().min(1, "Local Date is required for EXACT events"),
  localTime: z.string().min(1, "Local Time is required for EXACT events"),
  timeZone: z.string().min(1, "Time Zone is required for EXACT events"),
  displayMonth: z.string().optional(),
  displayYear: z.string().optional(),
});

// 2. TBA SCHEMA
const tbaSchema = z.object({
  ...baseEventFields,
  dateStatus: z.literal(EventDateStatus.TBA),
  localDate: z.string().optional(),
  localTime: z.string().optional(),
  timeZone: z.string().optional(),
  displayMonth: z.string().optional(),
  displayYear: z.string().optional(),
});

// 3. TBD MONTH SCHEMA
const tbdMonthSchema = z.object({
  ...baseEventFields,
  dateStatus: z.literal(EventDateStatus.TBD_MONTH),
  localDate: z.string().optional(),
  localTime: z.string().optional(),
  timeZone: z.string().optional(),
  displayMonth: z.coerce.number().int().min(1).max(12),
  displayYear: z.coerce.number().int().min(2000).max(2100),
});

export const adminEventSchema = z.discriminatedUnion("dateStatus", [
  exactSchema,
  tbaSchema,
  tbdMonthSchema,
]);

export type AdminEventInput = z.infer<typeof adminEventSchema>;