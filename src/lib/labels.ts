import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StoreStatus,
  InventoryMovementType,
  NotificationType,
  ProductUnit,
  SettlementStatus,
  SettlementMethod,
  SupportTicketStatus,
  SupportTicketPriority,
} from "@prisma/client";

export function orderStatusLabel(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING: "جديد",
    ACCEPTED: "مقبول",
    PREPARING: "بيتجهز",
    OUT_FOR_DELIVERY: "في الطريق",
    DELIVERED: "تم التوصيل",
    CANCELLED: "ملغي",
    REJECTED: "مرفوض",
  };
  return map[s] ?? s;
}

export function orderStatusTone(
  s: OrderStatus
): "yellow" | "blue" | "orange" | "green" | "red" | "default" {
  switch (s) {
    case "PENDING":
      return "yellow";
    case "ACCEPTED":
    case "PREPARING":
      return "blue";
    case "OUT_FOR_DELIVERY":
      return "orange";
    case "DELIVERED":
      return "green";
    case "CANCELLED":
    case "REJECTED":
      return "red";
    default:
      return "default";
  }
}

export function paymentMethodLabel(m: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    CASH_ON_DELIVERY: "كاش عند الاستلام",
    PAY_LATER: "ادفع بعدين",
    WALLET: "محفظة",
    CARD_LATER: "بطاقة لاحقاً",
  };
  return map[m] ?? m;
}

export function paymentStatusLabel(s: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    UNPAID: "غير مدفوع",
    PAID: "مدفوع",
    PARTIALLY_PAID: "مدفوع جزئياً",
    REFUNDED: "مسترد",
  };
  return map[s] ?? s;
}

export function storeStatusLabel(s: StoreStatus): string {
  const map: Record<StoreStatus, string> = {
    ACTIVE: "نشط",
    SUSPENDED: "موقوف",
    PENDING: "قيد الانتظار",
  };
  return map[s] ?? s;
}

export function storeStatusTone(
  s: StoreStatus
): "green" | "red" | "yellow" | "default" {
  switch (s) {
    case "ACTIVE":
      return "green";
    case "SUSPENDED":
      return "red";
    case "PENDING":
      return "yellow";
    default:
      return "default";
  }
}

export function productUnitLabel(u: ProductUnit): string {
  const map: Record<ProductUnit, string> = {
    PIECE: "قطعة",
    KG: "كجم",
    GRAM: "جرام",
    LITER: "لتر",
    ML: "مل",
    PACK: "عبوة",
    BOX: "علبة",
    CARTON: "كرتونة",
    DOZEN: "دستة",
  };
  return map[u] ?? u;
}

export function inventoryMovementLabel(t: InventoryMovementType): string {
  const map: Record<InventoryMovementType, string> = {
    STOCK_IN: "إدخال مخزون",
    STOCK_OUT: "إخراج مخزون",
    ORDER_RESERVED: "حجز لطلب",
    ORDER_CANCELLED: "إلغاء طلب",
    MANUAL_ADJUSTMENT: "تعديل يدوي",
    DAMAGED: "تالف",
    EXPIRED: "منتهي الصلاحية",
    RETURNED: "مرتجع",
  };
  return map[t] ?? t;
}

export function notificationTypeLabel(t: NotificationType): string {
  const map: Record<NotificationType, string> = {
    ORDER_NEW: "طلب جديد",
    ORDER_ACCEPTED: "تم قبول الطلب",
    ORDER_REJECTED: "تم رفض الطلب",
    ORDER_PREPARING: "الطلب بيتجهز",
    ORDER_OUT_FOR_DELIVERY: "الطلب في الطريق",
    ORDER_DELIVERED: "تم توصيل الطلب",
    ORDER_CANCELLED: "تم إلغاء الطلب",
    LOW_STOCK: "مخزون منخفض",
    OUT_OF_STOCK: "نفذ المخزون",
    OFFER: "عرض",
    SYSTEM: "النظام",
  };
  return map[t] ?? t;
}

export function settlementStatusLabel(s: SettlementStatus): string {
  const map: Record<SettlementStatus, string> = {
    PENDING: "قيد التسوية",
    PAID: "تم الدفع",
    CANCELLED: "ملغية",
  };
  return map[s] ?? s;
}

export function settlementStatusTone(
  s: SettlementStatus
): "yellow" | "green" | "red" {
  switch (s) {
    case "PENDING":
      return "yellow";
    case "PAID":
      return "green";
    case "CANCELLED":
      return "red";
  }
}

export function settlementMethodLabel(m: SettlementMethod | null): string {
  if (!m) return "—";
  const map: Record<SettlementMethod, string> = {
    CASH: "كاش",
    BANK_TRANSFER: "تحويل بنكي",
    INSTAPAY: "إنستاباي",
    VODAFONE_CASH: "فودافون كاش",
    OTHER: "أخرى",
  };
  return map[m] ?? m;
}

export function supportStatusLabel(s: SupportTicketStatus): string {
  const map: Record<SupportTicketStatus, string> = {
    OPEN: "مفتوحة",
    IN_PROGRESS: "قيد المعالجة",
    RESOLVED: "تم الحل",
    CLOSED: "مغلقة",
  };
  return map[s] ?? s;
}

export function supportStatusTone(
  s: SupportTicketStatus
): "yellow" | "blue" | "green" | "default" {
  switch (s) {
    case "OPEN":
      return "yellow";
    case "IN_PROGRESS":
      return "blue";
    case "RESOLVED":
      return "green";
    case "CLOSED":
      return "default";
  }
}

export function supportPriorityLabel(p: SupportTicketPriority): string {
  const map: Record<SupportTicketPriority, string> = {
    LOW: "منخفضة",
    NORMAL: "عادية",
    HIGH: "مرتفعة",
    URGENT: "عاجلة",
  };
  return map[p] ?? p;
}

export function supportPriorityTone(
  p: SupportTicketPriority
): "default" | "blue" | "orange" | "red" {
  switch (p) {
    case "LOW":
      return "default";
    case "NORMAL":
      return "blue";
    case "HIGH":
      return "orange";
    case "URGENT":
      return "red";
  }
}

export const DEFAULT_CATEGORIES_AR: string[] = [
  "مشروبات",
  "ألبان",
  "مخبوزات",
  "سناكس",
  "حلويات",
  "منظفات",
  "عناية شخصية",
  "معلبات",
  "زيوت وسمن",
  "أرز ومكرونة",
  "خضار وفاكهة",
  "منتجات أطفال",
  "مستلزمات البيت",
  "عروض",
  "محتاجه بسرعة",
];
