import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

// --- New Regex Helpers ---
const YMD_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const ISO_UTC_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$/;

const zYmd = z.string().regex(YMD_RE, "Expected YYYY-MM-DD");
const zIsoUtc = z.string().regex(ISO_UTC_RE, "Expected ISO UTC timestamp (…Z)");
const zHttpUrl = z.string().url();

// --- Existing Helper ---
const isoDateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid ISO date string",
});

// --- Enums & New Types ---
const StatusEnum = z.enum(["CONFIRMED", "EXPECTED", "RUMOR"]);
const zEventType = z.enum(["EVENT", "ANNOUNCEMENT", "SCHEDULE"]).optional();

const zOfficialDateRow = z.object({
  month: z.string().min(1).optional(),
  date: zYmd,
  group: z.string().min(1).optional()
});
const zOfficialDates = z.array(zOfficialDateRow).min(1);

const zCycleHistory = z.array(zYmd).min(1).optional();

const EventSchema = z
  .object({
    category: z.string().min(1),
    slug: z.string().min(1),
    canonicalSlug: z.string().min(1),

    title: z.string().optional(),
    eventName: z.string().optional(),
    description: z.string().optional(),

    // Preprocess statusLabel to uppercase before validation
    statusLabel: z.preprocess(
      (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
      StatusEnum
    ),

    dateLine: z.string().optional(),

    // Date fields
    dateISO: isoDateSchema.optional(),
    dueAt: isoDateSchema.optional(),
    dueDate: isoDateSchema.optional(),

    // Trust fields
    sourceUrl: z.string().optional(),
    lastVerifiedUtc: isoDateSchema.optional(),

    // Pattern fields
    confidenceScore: z.number().min(0).max(100).optional(),
    patternReasoning: z.string().optional(),
    seriesKey: z.string().optional(),

    // --- NEW FEDERAL FIELDS ---
    eventType: zEventType,
    officialDates: zOfficialDates.optional(),
    cycleHistory: zCycleHistory,
    verificationMethod: z.string().optional(),
    nextScheduledCheck: isoDateSchema.optional(),
    notes: z.string().optional(),
    recurrencePattern: z.string().optional(),
    recurrenceType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. canonicalSlug consistency
    const constructed = `${data.category}/${data.slug}`;
    if (
      data.canonicalSlug !== constructed &&
      data.canonicalSlug !== `/${constructed}`
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `canonicalSlug must be "${constructed}" (was "${data.canonicalSlug}")`,
        path: ["canonicalSlug"],
      });
    }

    // 2. Cross-field: confidenceScore -> patternReasoning
    if (data.confidenceScore !== undefined) {
      if (!data.patternReasoning || data.patternReasoning.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "patternReasoning is required when confidenceScore is present",
          path: ["patternReasoning"],
        });
      }
    }

    // --- STATUS & EVENT TYPE VARIABLES ---
    const isConfirmed = data.statusLabel === "CONFIRMED";
    const isExpected = data.statusLabel === "EXPECTED";
    const isSchedule = data.eventType === "SCHEDULE";

    // 3. Status-specific rules
    if (isConfirmed) {
      // sourceUrl required and valid URL
      if (!data.sourceUrl || data.sourceUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "sourceUrl is required for CONFIRMED events",
          path: ["sourceUrl"],
        });
      } else {
        const urlResult = zHttpUrl.safeParse(data.sourceUrl);
        if (!urlResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "sourceUrl must be a valid URL",
            path: ["sourceUrl"],
          });
        }
      }

      // lastVerifiedUtc required
      if (!data.lastVerifiedUtc) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "lastVerifiedUtc is required for CONFIRMED events",
          path: ["lastVerifiedUtc"],
        });
      }

      // Valid due date required (UNLESS it is a SCHEDULE node using officialDates)
      const hasDate = !!(data.dateISO || data.dueAt || data.dueDate);
      if (!hasDate && !isSchedule) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid due date (dateISO, dueAt, or dueDate) is required for CONFIRMED events",
          path: ["dateISO"],
        });
      }
    }

    // --- NEW FEDERAL RULES ---
    
    // Rule A: SCHEDULE nodes must be hardcoded official calendars
    if (isSchedule) {
      if (!isConfirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statusLabel"],
          message: 'eventType "SCHEDULE" must have statusLabel "CONFIRMED".'
        });
      }
      if (!Array.isArray(data.officialDates) || data.officialDates.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["officialDates"],
          message: 'eventType "SCHEDULE" requires officialDates[] with at least 1 entry.'
        });
      }
    }

    // Rule B: cycleHistory enforcement
    const hasPatternReasoning = typeof data.patternReasoning === "string" && data.patternReasoning.trim().length > 0;
    const hasConfidence = typeof data.confidenceScore === "number" && Number.isFinite(data.confidenceScore);

    if (isExpected && (hasPatternReasoning || hasConfidence)) {
       // We enforce either cycleHistory OR seriesKey to ensure older gaming nodes don't break
       const hasCycleHistory = Array.isArray(data.cycleHistory) && data.cycleHistory.length > 0;
       const hasSeriesKey = typeof data.seriesKey === "string" && data.seriesKey.trim().length > 0;

       if (!hasCycleHistory && !hasSeriesKey) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cycleHistory"],
            message: "EXPECTED events with patternReasoning/confidenceScore must include either cycleHistory[] or a seriesKey."
         });
       }
    }

    // Rule D: SCHEDULE nodes should NOT carry predictive fields
    if (isSchedule) {
      if (hasPatternReasoning) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["patternReasoning"],
          message: 'SCHEDULE nodes should not include patternReasoning (it is a verified calendar, not a prediction).'
        });
      }
      if (hasConfidence) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confidenceScore"],
          message: 'SCHEDULE nodes should not include confidenceScore.'
        });
      }
    }
  });

const EventsArraySchema = z.array(EventSchema).superRefine((events, ctx) => {
  const seriesCounts = new Map<string, number>();

  // 1. Build series history map from CONFIRMED events
  for (const ev of events) {
    if (ev.seriesKey && ev.statusLabel === "CONFIRMED") {
      seriesCounts.set(ev.seriesKey, (seriesCounts.get(ev.seriesKey) ?? 0) + 1);
    }
  }

  // 2. Validate any event with confidence > 0 has sufficient history
  events.forEach((ev, index) => {
    if ((ev.confidenceScore ?? 0) > 0) {
      // Bypass: If the event carries its own cycleHistory (like the new COLA node), it passes
      const hasCycleHistory = Array.isArray(ev.cycleHistory) && ev.cycleHistory.length >= 3;
      if (hasCycleHistory) {
         return; 
      }

      if (!ev.seriesKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "confidenceScore > 0 requires a seriesKey or cycleHistory[] (min 3) to verify historical data",
          path: [index, "seriesKey"],
        });
        return;
      }

      const historyCount = seriesCounts.get(ev.seriesKey) ?? 0;
      if (historyCount < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `confidenceScore > 0 requires at least 3 confirmed historical events in series "${ev.seriesKey}" (found ${historyCount})`,
          path: [index, "confidenceScore"],
        });
      }
    }
  });
});

export async function validateEventsOrThrow() {
  const jsonPath = path.resolve(process.cwd(), "../data/events.json");
  let raw: string;

  try {
    raw = await fs.readFile(jsonPath, "utf8");
  } catch (err) {
    throw new Error(`Failed to read events.json at ${jsonPath}: ${err}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse events.json: ${err}`);
  }

  if (!Array.isArray(json)) {
    throw new Error("events.json root must be an array");
  }

  const result = EventsArraySchema.safeParse(json);

  if (!result.success) {
    const jsonArray = json as Record<string, unknown>[];
    const formattedErrors = result.error.issues
      .map((e) => {
        const index = e.path[0];
        const field = String(e.path.slice(1).join("."));
        const item = jsonArray[Number(index)];
        const id = (item?.slug as string) || (item?.eventName as string) || `Index ${String(index)}`;
        return `[${id}] ${field}: ${e.message}`;
      })
      .join("\n");

    throw new Error(`Validation Failed:\n${formattedErrors}`);
  }

  const counts: Record<string, number> = {
    CONFIRMED: 0,
    EXPECTED: 0,
    RUMOR: 0,
  };

  for (const evt of result.data) {
    counts[evt.statusLabel]++;
  }

  return counts;
}