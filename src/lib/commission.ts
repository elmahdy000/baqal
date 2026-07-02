import type { Prisma } from "@prisma/client";

export function computeCommission(
  total: Prisma.Decimal | number | string,
  rate: Prisma.Decimal | number | string
): number {
  const t = typeof total === "object" ? Number(total) : Number(total);
  const r = typeof rate === "object" ? Number(rate) : Number(rate);
  if (!Number.isFinite(t) || !Number.isFinite(r)) return 0;
  return Math.round((t * r) / 100 * 100) / 100;
}

export function formatCommissionRate(rate: Prisma.Decimal | number | string): string {
  const r = typeof rate === "object" ? Number(rate) : Number(rate);
  return `${r.toFixed(2).replace(/\.?0+$/, "")}%`;
}
