// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * Phase 14 — Machine Mirror Endpoint
 *
 * Pattern:
 * /v1/api/tracker/{slug}.json
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Strip the .json extension to match your actual data IDs
  const cleanSlug = params.slug.replace(/\.json$/, "");

  // Reach outside the web folder to your root data folder
  const eventsPath = path.join(process.cwd(), "../data/events.json");

  if (!fs.existsSync(eventsPath)) {
    return NextResponse.json(
      { error: "Registry not found" },
      { status: 500 }
    );
  }

  const raw = fs.readFileSync(eventsPath, "utf-8");
  const events = JSON.parse(raw);

  // Match the event by either eventId or canonicalSlug
  const event = events.find(
    (e: any) => e.eventId === cleanSlug || e.canonicalSlug === cleanSlug
  );

  if (!event) {
    return NextResponse.json(
      { error: "Tracker not found" },
      { status: 404 }
    );
  }

  // Load checkpoint hash for anchoring
  let registryRootHash: string | null = null;
  try {
    const checkpointPath = path.join(
      process.cwd(),
      "public",
      ".well-known",
      "registry-checkpoint.json"
    );
    if (fs.existsSync(checkpointPath)) {
      const checkpointRaw = fs.readFileSync(checkpointPath, "utf-8");
      const checkpoint = JSON.parse(checkpointRaw);
      registryRootHash = checkpoint.rootHash || checkpoint.root_hash || checkpoint.rootSha256 || null;
    }
  } catch {
    registryRootHash = null;
  }

  const categoryPath = event.categoryId ? `${event.categoryId}/` : "";
  const canonicalUrl = `https://whenisdue.com/${categoryPath}${cleanSlug}`;
  const mirrorUrl = `https://whenisdue.com/v1/api/tracker/${cleanSlug}.json`;

  const responsePayload = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": mirrorUrl,
    "name": event.name || event.title || "WhenIsDue Tracker",
    "url": canonicalUrl,
    "identifier": {
      "@type": "PropertyValue",
      "propertyID": "whenisdue:slug",
      "value": cleanSlug
    },
    "version": event.version || event.semanticVersion || "registry-current",
    "dateModified": new Date().toISOString(),
    "isBasedOn": event.sourceUrl || (event.provenanceAnchors && event.provenanceAnchors[0]?.url) || null,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "propertyID": "status",
        "value": event.status || "UNKNOWN"
      },
      {
        "@type": "PropertyValue",
        "propertyID": "category",
        "value": event.categoryId || event.category || "General"
      }
    ],
    "registryAnchor": registryRootHash
      ? {
          "rootHash": registryRootHash,
          "trustManifest": "https://whenisdue.com/.well-known/whenisdue-trust.json"
        }
      : null
  };

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, must-revalidate"
    }
  });
}