// In-memory sliding-window rate limiter. Suitable for single-node MVP.
// Not distributed — restart clears state. For prod: swap with Redis-backed impl.

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();

// Periodic cleanup to prevent unbounded growth. Runs opportunistically.
let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 60_000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    // If newest timestamp older than 10 min, drop the bucket.
    const last = bucket.timestamps[bucket.timestamps.length - 1] ?? 0;
    if (now - last > 10 * 60_000) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  const cutoff = now - windowMs;

  // Drop old timestamps.
  while (bucket.timestamps.length > 0 && bucket.timestamps[0] < cutoff) {
    bucket.timestamps.shift();
  }

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfter = Math.max(0, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfter };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}
