import { createHmac, timingSafeEqual } from "crypto";

// Customers are anonymous — no login. To gate the customer order-detail API
// we issue a short HMAC-signed token at placeOrder time that binds the
// requester to that specific orderId. The token is stored client-side and
// sent back with every read.

function getSecret(): string {
  const s =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.ORDER_TOKEN_SECRET;
  if (!s) throw new Error("order-token: missing AUTH_SECRET/NEXTAUTH_SECRET");
  return s;
}

export function signOrderToken(orderId: string): string {
  const mac = createHmac("sha256", getSecret()).update(orderId).digest();
  return mac.toString("base64url");
}

export function verifyOrderToken(orderId: string, token: string): boolean {
  if (!orderId || !token) return false;
  try {
    const expected = createHmac("sha256", getSecret())
      .update(orderId)
      .digest();
    const provided = Buffer.from(token, "base64url");
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}
