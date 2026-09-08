/**
 * First-party analytics.
 *
 * Events are posted to this app's own endpoint with `sendBeacon`, which the
 * browser queues and delivers without blocking navigation or unload. There is
 * no third-party script, no cookie, and nothing that identifies a visitor —
 * only an event name and an optional label.
 */

const ENDPOINT = "/api/analytics";

export function track(name: string, detail?: string): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify({ name, detail });

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}
