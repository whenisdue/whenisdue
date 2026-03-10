"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTtfToken, generateTtfToken } from "@/lib/ttf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { after } from "next/server";
import { createHash } from "node:crypto";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
  fields?: Record<string, string>;
};

// Expose a quick server fetcher so the modal gets a fresh token on open
export async function getFreshTtf() {
  return generateTtfToken();
}

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  date: z.string().trim().max(100).optional(),
  source: z.string().trim().max(300).refine((val) => !val || val.startsWith('http'), {
    message: "If provided, source must be a valid URL starting with http/https",
  }).optional(),
  ttf: z.string().min(1, "Session invalid"),
  company_fax: z.string().max(100).optional(), // Honeypot trap
});

export async function submitEventRequest(prev: ActionState, formData: FormData): Promise<ActionState> {
  const rawFields = {
    title: String(formData.get("title") || ""),
    date: String(formData.get("date") || ""),
    source: String(formData.get("source") || ""),
    ttf: String(formData.get("ttf") || ""),
    company_fax: String(formData.get("company_fax") || ""),
  };

  const parsed = schema.safeParse(rawFields);

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { ok: false, fieldErrors: flat.fieldErrors, formErrors: flat.formErrors, fields: rawFields };
  }

  const data = parsed.data;

  // 1. Invisible Honeypot Check (Silently drop bots so they don't know they failed)
  if (data.company_fax && data.company_fax.length > 0) {
    return { ok: true, message: "Thank you! Your request has been sent for review." };
  }

  // 2. Cryptographic Time-To-Fill Check
  const issuedAtMs = verifyTtfToken(data.ttf);
  if (!issuedAtMs) {
    return { ok: false, formErrors: ["Session expired. Please close and reopen the form."], fields: rawFields };
  }
  const elapsedMs = Date.now() - issuedAtMs;
  if (elapsedMs < 3000) {
    // Submitted under 3 seconds - silent drop
    return { ok: true, message: "Thank you! Your request has been sent for review." };
  }

  // 3. Hybrid Rate Limit Check
  const isAllowed = await checkRateLimit("submit_event");
  if (!isAllowed) {
    return { ok: false, formErrors: ["You are doing that too much. Please try again later."], fields: rawFields };
  }

  const ip = await getClientIp();
  const ipHash = createHash("sha256").update(ip + ":" + (process.env.IP_HASH_SECRET || "secret")).digest("hex");

  // 4. DB Insert
  try {
    await prisma.eventSubmission.create({
      data: {
        submittedTitle: data.title,
        submittedDate: data.date || null,
        submittedSource: data.source || null,
        submitterIpHash: ipHash,
      },
    });

    // 5. Non-Blocking Notification via after()
    after(async () => {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🚨 **New Event Request**\n**Title:** ${data.title}\n**Date:** ${data.date || "N/A"}\n**Source:** ${data.source || "N/A"}`,
          }),
        }).catch(() => console.error("Webhook failed silently."));
      }
    });

    return { ok: true, message: "Thank you! Your request has been sent for review." };
  } catch (error) {
    console.error("Submission error:", error);
    return { ok: false, formErrors: ["An internal error occurred. Please try again."], fields: rawFields };
  }
}