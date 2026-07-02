import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveImage } from "@/lib/upload";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const LIMIT = 20;
const WINDOW_MS = 60_000;

function rateLimit(userId: string): boolean {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || b.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= LIMIT) return false;
  b.count += 1;
  return true;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const role = session.user.role;
  if (
    role !== "STORE_OWNER" &&
    role !== "STORE_STAFF" &&
    role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!rateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "عدد الرفعات كبير، حاول تاني بعد شوية" },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder = folderRaw === "logos" ? "logos" : "products";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  try {
    const url = await saveImage(file, folder);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل رفع الصورة";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
