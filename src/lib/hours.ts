// Store working hours helpers
// openingHours field is a JSON string of shape:
// { weekly: { sun: {open:"08:00", close:"23:00"} | null, mon: ..., tue, wed, thu, fri, sat } }

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type DayHours = { open: string; close: string } | null;

export type WeeklyHours = Record<DayKey, DayHours>;

export type OpeningHoursJson = { weekly: WeeklyHours };

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DAY_LABELS_AR: Record<DayKey, string> = {
  sun: "الأحد",
  mon: "الإثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
  sat: "السبت",
};

export function defaultHoursJson(): OpeningHoursJson {
  const day: DayHours = { open: "09:00", close: "23:00" };
  return {
    weekly: {
      sun: day,
      mon: day,
      tue: day,
      wed: day,
      thu: day,
      fri: day,
      sat: day,
    },
  };
}

function parseTime(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function parseOpeningHours(raw: string | null | undefined): OpeningHoursJson | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const weekly = (parsed as { weekly?: unknown }).weekly;
    if (!weekly || typeof weekly !== "object") return null;
    const out: WeeklyHours = {
      sun: null,
      mon: null,
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      sat: null,
    };
    for (const key of DAY_KEYS) {
      const v = (weekly as Record<string, unknown>)[key];
      if (v && typeof v === "object") {
        const oo = (v as { open?: unknown }).open;
        const cc = (v as { close?: unknown }).close;
        if (typeof oo === "string" && typeof cc === "string") {
          out[key] = { open: oo, close: cc };
        } else {
          out[key] = null;
        }
      } else {
        out[key] = null;
      }
    }
    return { weekly: out };
  } catch {
    return null;
  }
}

export function isStoreOpenNow(store: { openingHours: string | null }): boolean {
  const parsed = parseOpeningHours(store.openingHours);
  if (!parsed) return true; // fail-open

  const now = new Date();
  const dayIdx = now.getDay(); // 0=Sun
  const key = DAY_KEYS[dayIdx];
  const day = parsed.weekly[key];
  if (!day) return false;

  const openMin = parseTime(day.open);
  const closeMin = parseTime(day.close);
  if (openMin == null || closeMin == null) return true; // fail-open on garbage

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (closeMin > openMin) {
    return nowMin >= openMin && nowMin <= closeMin;
  }
  // overnight (e.g. 22:00 -> 02:00)
  return nowMin >= openMin || nowMin <= closeMin;
}
