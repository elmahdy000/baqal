export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export function getVapidPrivateKey(): string {
  return process.env.VAPID_PRIVATE_KEY ?? "";
}

export function getVapidSubject(): string {
  return process.env.VAPID_SUBJECT ?? "mailto:admin@baqal.app";
}

export function hasVapidKeys(): boolean {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}

let warned = false;
export function warnIfMissingVapid() {
  if (warned) return;
  warned = true;
  if (!hasVapidKeys()) {
    console.warn(
      "[baqal] VAPID keys missing. Web Push disabled. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
  }
}

if (typeof window === "undefined") {
  warnIfMissingVapid();
}
