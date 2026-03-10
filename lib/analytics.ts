// web/lib/analytics.ts

type ClickEvent = { eventId: string; ts: number };

const queue: ClickEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

/**
 * Pushes a click into the memory queue and debounces the network request.
 */
export function trackClick(eventId: string) {
  queue.push({ eventId, ts: Date.now() });

  // Flush immediately if batch gets too large to protect memory
  if (queue.length >= 10) {
    flushQueue();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushQueue, 1000); // 1-second debounce
  }
}

function flushQueue() {
  if (isFlushing || queue.length === 0) return;
  
  isFlushing = true;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;

  const batch = queue.splice(0, 10);
  const payload = JSON.stringify({ events: batch });

  // Delivery Method 1: sendBeacon (Zero UX Impact)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const sent = navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    if (sent) {
      isFlushing = false;
      return;
    }
  }

  // Delivery Method 2: Fetch Keepalive Fallback
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true
  }).catch(() => {
    // We intentionally swallow errors here. Telemetry should never crash the UI.
  }).finally(() => {
    isFlushing = false;
    
    // If more clicks came in while flushing, schedule the next batch
    if (queue.length > 0) {
      flushTimer = setTimeout(flushQueue, 500);
    }
  });
}