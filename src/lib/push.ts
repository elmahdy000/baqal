import webpush from "web-push";
import { db } from "@/lib/db";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  hasVapidKeys,
} from "@/lib/vapid";

let configured = false;
function configure() {
  if (configured) return hasVapidKeys();
  if (!hasVapidKeys()) return false;
  webpush.setVapidDetails(
    getVapidSubject(),
    getVapidPublicKey(),
    getVapidPrivateKey()
  );
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

async function sendOne(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const status =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (status === 404 || status === 410) {
      try {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      } catch {}
    }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configure()) return;
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  await Promise.all(subs.map((s) => sendOne(s, payload)));
}

export async function sendPushToStore(storeId: string, payload: PushPayload) {
  if (!configure()) return;
  const users = await db.user.findMany({
    where: {
      storeId,
      role: { in: ["STORE_OWNER", "STORE_STAFF"] },
    },
    select: { id: true },
  });
  if (users.length === 0) return;
  const subs = await db.pushSubscription.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
  });
  await Promise.all(subs.map((s) => sendOne(s, payload)));
}

export async function sendPushToCustomerPhone(
  storeId: string,
  phone: string,
  payload: PushPayload
) {
  if (!configure()) return;
  if (!phone) return;
  const subs = await db.pushSubscription.findMany({
    where: { customerPhone: phone, storeId },
  });
  await Promise.all(subs.map((s) => sendOne(s, payload)));
}
