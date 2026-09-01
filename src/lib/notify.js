/**
 * notify.js — message arrival notifications.
 *
 * - playPop(): short in-app sound (WebAudio, no asset file needed)
 * - notifyMessage(name, body): browser notification when the tab isn't
 *   focused (requires permission, requested lazily on the first message)
 */

let audioCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** Short two-tone pop, similar to a chat app notification sound. */
export function playPop() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.08, t + i * 0.09 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 0.2);
  });
}

export function askNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function notifyMessage(title, body, onClick) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title || "New message", {
      body: body || "",
      icon: "/favicon.svg",
      tag: "lingua-msg",
    });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
    setTimeout(() => n.close(), 5000);
  } catch {
    // Some mobile browsers only allow notifications via service workers — ignore.
  }
}
