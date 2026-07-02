import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(10, "كلمة السر 10 حروف على الأقل"),
});

export const createStoreSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  phone: z.string().optional(),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(10, "كلمة السر 10 حروف على الأقل"),
  ownerName: z.string().min(2),
});

export const createBuildingSchema = z.object({
  name: z.string().min(2),
  storeId: z.string().min(1),
  street: z.string().optional(),
  buildingNumber: z.string().optional(),
  compoundName: z.string().optional(),
  areaId: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  stockQuantity: z.coerce.number().int().nonnegative(),
  unit: z.enum(["PIECE", "KG", "GRAM", "LITER", "ML", "PACK", "BOX", "CARTON", "DOZEN"]),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.coerce.boolean().default(true),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  buildingCode: z.string().optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  deliveryNotes: z.string().optional(),
  items: z.array(cartItemSchema).min(1),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "PAY_LATER"]).default("CASH_ON_DELIVERY"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const categorySchema = z.object({
  nameAr: z.string().min(1, "اسم الفئة مطلوب"),
  slug: z.string().min(1, "المعرف مطلوب").regex(/^[a-z0-9-]+$/, "المعرف حروف إنجليزية وأرقام وشرطات فقط"),
  icon: z.string().optional().nullable(),
  order: z.coerce.number().int().nonnegative().default(0),
});

export const offerSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("رابط الصورة غير صالح").optional().nullable().or(z.literal("")),
  discountPct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  productIds: z.array(z.string()).default([]),
});

export const customRequestSchema = z.object({
  storeSlug: z.string().min(1),
  customerName: z.string().min(2, "الاسم مطلوب"),
  customerPhone: z.string().min(6, "رقم الموبايل مطلوب"),
  text: z.string().min(3, "اكتب اللي محتاجه"),
});

export const customRequestReplySchema = z.object({
  reply: z.string().min(1, "الرد مطلوب"),
  status: z.enum(["ANSWERED_AVAILABLE", "ANSWERED_UNAVAILABLE", "ANSWERED_SOON"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;

export const commissionRateSchema = z.object({
  storeId: z.string().min(1),
  rate: z.coerce.number().min(0).max(100),
});

export const settlementCreateSchema = z.object({
  storeId: z.string().min(1),
  method: z.enum(["CASH", "BANK_TRANSFER", "INSTAPAY", "VODAFONE_CASH", "OTHER"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const settlementUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED"]),
  method: z.enum(["CASH", "BANK_TRANSFER", "INSTAPAY", "VODAFONE_CASH", "OTHER"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
