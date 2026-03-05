import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd()); // Forces the script to read your exact .env.local file

import { chromium } from "playwright";
import crypto from "crypto";
import * as Sentry from "@sentry/node";
import { prisma } from "../lib/data-service"; 

// 1. Initialize Sentry for instant crash reporting
Sentry.init({
  dsn: process.env.SENTRY_DSN, 
  environment: process.env.NODE_ENV ?? "production",
});

// Now it perfectly matches whatever the Next.js server sees!
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const BROADCAST_URL = process.env.BROADCAST_URL || "http://127.0.0.1:3000/api/broadcast";

if (!WEBHOOK_SECRET) {
  console.error("FATAL ERROR: WEBHOOK_SECRET is missing from your .env.local file!");
  process.exit(1);
}

async function reportAndExit(err: Error, exitCode = 1) {
  console.error("Scraper Error:", err.message);
  Sentry.captureException(err);
  await Sentry.flush(2000);
  process.exit(exitCode);
}

process.on("unhandledRejection", (reason) => {
  reportAndExit(reason instanceof Error ? reason : new Error(String(reason)));
});

process.on("uncaughtException", (err) => {
  reportAndExit(err);
});

async function fireDetonator(seriesKey: string) {
  console.log(`Firing HMAC Detonator for ${seriesKey}...`);
  
  const payload = JSON.stringify({
    seriesKey: seriesKey,
    event: "NEW_DATE_VERIFIED"
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET as string)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    const response = await fetch(BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-timestamp": timestamp,
        "x-webhook-signature": `v1=${signature}`
      },
      body: payload
    });

    const result = await response.json();
    console.log("Broadcast Result:", result);
  } catch (error) {
    throw new Error(`Failed to hit broadcast webhook: ${error}`);
  }
}

async function runScraper() {
  console.log("Initiating Autonomous Federal Scraper...");
  
  // 2. Polite Automation: Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  
  const page = await context.newPage();

  try {
    // 3. Navigate to a SAFE Target to bypass HTTP2 blocks for this test
    console.log("Accessing safe test portal...");
    
    const response = await page.goto("https://example.com", { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });

    if (response?.status() === 403) {
      throw new Error("403 Forbidden: Blocked by bot protection.");
    }

    // --- YOUR CUSTOM EXTRACTION LOGIC GOES HERE ---
    // We are simulating finding a verified date. We will add 1 hour to the date 
    // to guarantee it registers as "new" in your database on this run.
    const foundDate = new Date(); 
    foundDate.setHours(foundDate.getHours() + 1);

    const seriesKeyTarget = "snap-california-2026";
    const verificationUrl = page.url();
    // ----------------------------------------------

    console.log(`Extracted verified date: ${foundDate.toISOString()} for ${seriesKeyTarget}`);

    // 4. Verify against Database to prevent duplicate broadcasts
    const existingRecord = await prisma.occurrence.findFirst({
      where: {
        series: { seriesKey: seriesKeyTarget },
        status: "VERIFIED"
      },
      orderBy: { date: "desc" }
    });

    if (!existingRecord || existingRecord.date.getTime() !== foundDate.getTime()) {
      console.log("New verified date detected. Updating Authority Engine Database...");

      await prisma.series.upsert({
        where: { seriesKey: seriesKeyTarget },
        update: {},
        create: {
          seriesKey: seriesKeyTarget,
          canonicalName: "California SNAP Deposits",
          entityName: "California Department of Social Services",
          frequency: "MONTHLY",
          occurrenceRule: "FIRST_HALF"
        }
      });

      await prisma.occurrence.create({
        data: {
          series: { connect: { seriesKey: seriesKeyTarget } },
          date: foundDate,
          status: "VERIFIED",
          verificationProof: verificationUrl,
          verifiedAt: new Date()
        }
      });

      // 5. Fire the Broadcast!
      await fireDetonator(seriesKeyTarget);
    } else {
      console.log("Date already verified in database. Standing down.");
    }

  } finally {
    await browser.close();
  }
}

// Execute Script
runScraper()
  .then(async () => {
    console.log("Scraper execution complete.");
    await Sentry.flush(1000);
    process.exit(0);
  })
  .catch((err) => reportAndExit(err));