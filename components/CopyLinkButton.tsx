"use client";

import { useEffect, useMemo, useState } from "react";

type CopyLinkButtonProps = {
  /** Optional: override what gets copied */
  getTextToCopy?: () => string;
  /** Optional: label shown by default */
  label?: string;
  /** Optional: label shown after successful copy */
  copiedLabel?: string;
  /** Optional: extra classNames for styling/placement */
  className?: string;
};

function isClipboardAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  );
}

async function fallbackCopy(text: string): Promise<boolean> {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function CopyLinkButton({
  getTextToCopy,
  label = "Copy link",
  copiedLabel = "Copied ✓",
  className = "",
}: CopyLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status !== "copied") return;
    const t = window.setTimeout(() => setStatus("idle"), 1500);
    return () => window.clearTimeout(t);
  }, [status]);

  const textToCopy = useMemo(() => {
    if (getTextToCopy) return getTextToCopy();
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [getTextToCopy, status]);

  async function onCopy() {
    const text = textToCopy || (typeof window !== "undefined" ? window.location.href : "");
    if (!text) return;

    try {
      if (isClipboardAvailable()) {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
        return;
      }
    } catch {
      // fall through to legacy copy
    }

    const ok = await fallbackCopy(text);
    setStatus(ok ? "copied" : "error");
  }

  const shown = status === "copied" ? copiedLabel : status === "error" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        "rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium opacity-70 hover:opacity-100 hover:bg-white/[0.04] transition whitespace-nowrap " +
        className
      }
      aria-label={label}
      title={status === "error" ? "Your browser blocked clipboard access" : label}
    >
      {shown}
    </button>
  );
}
