import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await db.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      nameAr: true,
      slug: true,
      isOpen: true,
      status: true,
      deliveryFee: true,
      minOrderAmount: true,
    },
  });
  if (!store || store.status !== "ACTIVE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...store,
    deliveryFee: Number(store.deliveryFee),
    minOrderAmount: Number(store.minOrderAmount),
  });
}
