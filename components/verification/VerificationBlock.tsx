import Link from "next/link";

type Props = {
  statusLabel?: string | null;
  /**
   * Historical: some events store a human-readable source name here.
   * If this looks like a URL, we treat it as the source URL.
   */
  source?: string | null;

  /**
   * Preferred: the official primary source URL for verification.
   * (If you add this to your events.json, pass it from the Event page template.)
   */
  sourceUrl?: string | null;

  /**
   * ISO 8601 UTC timestamp, e.g. "2026-02-24T02:30:00Z"
   */
  lastVerifiedUtc?: string | null;

  verificationMethod?: string | null;
  nextScheduledCheck?: string | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function looksLikeUrl(v: string): boolean {
  const s = v.trim();
  return /^https?:\/\//i.test(s);
}

function safeParseDate(iso: string | null | undefined): Date | null {
  if (!isNonEmptyString(iso)) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatUtcLong(d: Date): string {
  // Always show UTC so it’s deterministic and “receipt-like”.
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(d);
  } catch {
    // Fallback: ISO-ish
    return d.toISOString().replace(".000Z", "Z");
  }
}

function hostFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function normalizeStatusLabel(label: string | null | undefined): string | null {
  if (!isNonEmptyString(label)) return null;
  return label.trim();
}

export default function VerificationBlock(props: Props) {
  const statusLabel = normalizeStatusLabel(props.statusLabel);

  const lastVerified = safeParseDate(props.lastVerifiedUtc);

  // Source URL preference:
  // 1) sourceUrl prop
  // 2) source prop if it looks like a URL
  const sourceUrl =
    (isNonEmptyString(props.sourceUrl) ? props.sourceUrl.trim() : null) ??
    (isNonEmptyString(props.source) && looksLikeUrl(props.source) ? props.source.trim() : null);

  // Source label preference:
  // 1) source prop if it’s not a URL (human-readable name)
  // 2) hostname from sourceUrl
  const sourceLabel =
    isNonEmptyString(props.source) && !looksLikeUrl(props.source)
      ? props.source.trim()
      : sourceUrl
        ? hostFromUrl(sourceUrl)
        : null;

  const method = isNonEmptyString(props.verificationMethod) ? props.verificationMethod.trim() : null;
  const nextCheck = safeParseDate(props.nextScheduledCheck);

  const isVerified = Boolean(lastVerified && sourceUrl);

  return (
    <section className="mt-12 border-t border-white/10 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium opacity-90">Verification</div>

        {statusLabel ? (
          <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-xs font-semibold tracking-wide opacity-80">
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 w-[720px] max-w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {/* Trust stamp */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {isVerified ? "Verified" : "Not verified"}
            </div>
            <div className="mt-2 text-sm opacity-75">
              {isVerified
                ? "This date is backed by a primary source and a verification timestamp."
                : "This date is not yet backed by a primary source with a verification timestamp."}
            </div>
          </div>

          {/* Subtle indicator */}
          <span
            className={[
              "mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
              isVerified ? "bg-emerald-400/80" : "bg-white/20",
            ].join(" ")}
            aria-hidden="true"
          />
        </div>

        {/* Receipt rows */}
        <div className="mt-5 space-y-2 text-sm">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="opacity-60">Last verified</div>
            <div className="opacity-90">
              {lastVerified ? formatUtcLong(lastVerified) : <span className="opacity-60">—</span>}
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="opacity-60">Primary source</div>
            <div className="opacity-90">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-white/20 hover:decoration-white/50 transition"
                >
                  {sourceLabel ?? sourceUrl}
                </a>
              ) : (
                <span className="opacity-60">—</span>
              )}
            </div>
          </div>

          {method ? (
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div className="opacity-60">Method</div>
              <div className="opacity-90">{method}</div>
            </div>
          ) : null}

          {nextCheck ? (
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div className="opacity-60">Next check</div>
              <div className="opacity-90">{formatUtcLong(nextCheck)}</div>
            </div>
          ) : null}
        </div>

        {/* Quiet note */}
        <div className="mt-5 text-xs opacity-60">
          Note: We only update “Last verified” when we confirm the source still matches the date.
        </div>

        {/* Optional: link to tools (kept subtle, not a CTA) */}
        <div className="mt-4">
          <Link href="/tools" className="text-xs opacity-60 hover:opacity-90 transition">
            Time tools →
          </Link>
        </div>
      </div>
    </section>
  );
}
