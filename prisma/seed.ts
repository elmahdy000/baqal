import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const CATEGORY_LIST: { nameAr: string; slug: string; icon: string }[] = [
  { nameAr: "مشروبات", slug: "drinks", icon: "🥤" },
  { nameAr: "ألبان", slug: "dairy", icon: "🥛" },
  { nameAr: "مخبوزات", slug: "bakery", icon: "🍞" },
  { nameAr: "سناكس", slug: "snacks", icon: "🍿" },
  { nameAr: "حلويات", slug: "sweets", icon: "🍬" },
  { nameAr: "منظفات", slug: "cleaning", icon: "🧼" },
  { nameAr: "عناية شخصية", slug: "personal-care", icon: "🧴" },
  { nameAr: "معلبات", slug: "canned", icon: "🥫" },
  { nameAr: "زيوت وسمن", slug: "oils", icon: "🫙" },
  { nameAr: "أرز ومكرونة", slug: "grains", icon: "🍚" },
  { nameAr: "خضار وفاكهة", slug: "produce", icon: "🥬" },
  { nameAr: "منتجات أطفال", slug: "baby", icon: "🍼" },
  { nameAr: "مستلزمات البيت", slug: "home", icon: "🧻" },
  { nameAr: "مخللات", slug: "pickles", icon: "🫙" },
  { nameAr: "عطارة", slug: "spices", icon: "🌶️" },
  { nameAr: "عروض", slug: "offers", icon: "🏷️" },
  { nameAr: "محتاجه بسرعة", slug: "emergency", icon: "⚡" },
];

type SeedProduct = {
  nameAr: string;
  name: string;
  categorySlug: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  unit: "PIECE" | "KG" | "GRAM" | "LITER" | "ML" | "PACK" | "BOX" | "CARTON" | "DOZEN";
  imageUrl?: string;
  alsoInOffers?: boolean;
  alsoInEmergency?: boolean;
};

// Unsplash direct image URLs (400x400) — public CDN, always available
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80`;

const PRODUCT_LIST: SeedProduct[] = [
  { nameAr: "عيش بلدي", name: "Baladi Bread", categorySlug: "bakery", price: 5, stockQuantity: 200, unit: "PIECE", alsoInEmergency: true, imageUrl: IMG("1509440159596-0249088772ff") },
  { nameAr: "لبن جهينة 1 لتر", name: "Juhayna Milk 1L", categorySlug: "dairy", price: 32, stockQuantity: 40, unit: "LITER", alsoInEmergency: true, imageUrl: IMG("1550583724-b2692b85b150") },
  { nameAr: "جبنة قريش", name: "Qarish Cheese", categorySlug: "dairy", price: 25, stockQuantity: 15, unit: "PACK", imageUrl: IMG("1486297678162-eb2a19b0a32d") },
  { nameAr: "بيبسي 1 لتر", name: "Pepsi 1L", categorySlug: "drinks", price: 22, discountPrice: 18, stockQuantity: 60, unit: "LITER", alsoInOffers: true, imageUrl: IMG("1629203851122-3726ecdf080e") },
  { nameAr: "كوكاكولا 1 لتر", name: "Coca-Cola 1L", categorySlug: "drinks", price: 22, stockQuantity: 55, unit: "LITER", imageUrl: IMG("1554866585-cd94860890b7") },
  { nameAr: "ماء صافي 1.5 لتر", name: "Safi Water 1.5L", categorySlug: "drinks", price: 8, stockQuantity: 120, unit: "LITER", alsoInEmergency: true, imageUrl: IMG("1548839140-29a749e1cf4d") },
  { nameAr: "بطاطس شيبسي", name: "Chipsy Chips", categorySlug: "snacks", price: 10, stockQuantity: 80, unit: "PACK", imageUrl: IMG("1613919113640-25732ec5e61f") },
  { nameAr: "شوكولاتة كتكات", name: "KitKat", categorySlug: "sweets", price: 15, stockQuantity: 3, unit: "PIECE", imageUrl: IMG("1623660053975-e17be8b28c78") },
  { nameAr: "بسكويت أوريو", name: "Oreo Biscuits", categorySlug: "sweets", price: 18, discountPrice: 14, stockQuantity: 30, unit: "PACK", alsoInOffers: true, imageUrl: IMG("1606355603833-33fee2b8f8b0") },
  { nameAr: "صابون لوكس", name: "Lux Soap", categorySlug: "personal-care", price: 20, stockQuantity: 25, unit: "PIECE", imageUrl: IMG("1600857544200-b2f666a9a2ec") },
  { nameAr: "شامبو هيد آند شولدرز", name: "Head & Shoulders Shampoo", categorySlug: "personal-care", price: 95, stockQuantity: 12, unit: "PIECE", imageUrl: IMG("1585232004423-244e0e6904e3") },
  { nameAr: "معجون أسنان سيجنال", name: "Signal Toothpaste", categorySlug: "personal-care", price: 35, stockQuantity: 18, unit: "PIECE", imageUrl: IMG("1607613009820-a29f7bb81c04") },
  { nameAr: "مناديل فاين", name: "Fine Tissues", categorySlug: "home", price: 30, stockQuantity: 40, unit: "PACK", imageUrl: IMG("1584556812952-905ffd0c611a") },
  { nameAr: "تونة", name: "Tuna Can", categorySlug: "canned", price: 45, stockQuantity: 22, unit: "PIECE", imageUrl: IMG("1597733336794-12d05021d510") },
  { nameAr: "فول مدمس معلب", name: "Canned Foul", categorySlug: "canned", price: 20, stockQuantity: 30, unit: "PIECE", imageUrl: IMG("1584663643127-be4c26c9f9b0") },
  { nameAr: "زيت عافية 1 لتر", name: "Afia Oil 1L", categorySlug: "oils", price: 90, discountPrice: 80, stockQuantity: 20, unit: "LITER", alsoInOffers: true, imageUrl: IMG("1620705540051-5abfeb42a5c9") },
  { nameAr: "سمنة", name: "Ghee", categorySlug: "oils", price: 120, stockQuantity: 10, unit: "PACK", imageUrl: IMG("1620705540051-5abfeb42a5c9") },
  { nameAr: "أرز أبيض 1 كجم", name: "White Rice 1kg", categorySlug: "grains", price: 40, stockQuantity: 50, unit: "KG", imageUrl: IMG("1586201375761-83865001e31c") },
  { nameAr: "مكرونة السويسي", name: "El Sowessy Pasta", categorySlug: "grains", price: 20, stockQuantity: 45, unit: "PACK", imageUrl: IMG("1551462147-ff29053bfc14") },
  { nameAr: "طماطم 1 كجم", name: "Tomatoes 1kg", categorySlug: "produce", price: 18, stockQuantity: 0, unit: "KG", imageUrl: IMG("1592924357228-91a4daadcfea") },
  { nameAr: "خيار 1 كجم", name: "Cucumber 1kg", categorySlug: "produce", price: 15, stockQuantity: 20, unit: "KG", imageUrl: IMG("1604977042946-1eecc30f269e") },
  { nameAr: "بصل 1 كجم", name: "Onion 1kg", categorySlug: "produce", price: 12, stockQuantity: 35, unit: "KG", imageUrl: IMG("1518977676601-b53f82aba655") },
  { nameAr: "تفاح 1 كجم", name: "Apple 1kg", categorySlug: "produce", price: 55, stockQuantity: 18, unit: "KG", imageUrl: IMG("1567306226416-28f0efdc88ce") },
  { nameAr: "موز 1 كجم", name: "Banana 1kg", categorySlug: "produce", price: 25, stockQuantity: 25, unit: "KG", imageUrl: IMG("1571771894821-ce9b6c11b08e") },
  { nameAr: "حفاضات بامبرز", name: "Pampers Diapers", categorySlug: "baby", price: 180, stockQuantity: 8, unit: "PACK", alsoInEmergency: true, imageUrl: IMG("1522771930-78848d9293e8") },
  { nameAr: "لبن أطفال سيميلاك", name: "Similac Baby Formula", categorySlug: "baby", price: 350, stockQuantity: 5, unit: "BOX", imageUrl: IMG("1519689680058-324335c77eba") },
  { nameAr: "بطاريات AA", name: "AA Batteries", categorySlug: "home", price: 40, stockQuantity: 30, unit: "PACK", alsoInEmergency: true, imageUrl: IMG("1620286502-41ec9385e5ee") },
  { nameAr: "مربى فراولة", name: "Strawberry Jam", categorySlug: "sweets", price: 55, stockQuantity: 15, unit: "PIECE", imageUrl: IMG("1590080875515-8a3a8dc5735e") },
  { nameAr: "عسل نحل", name: "Honey", categorySlug: "sweets", price: 150, stockQuantity: 0, unit: "PIECE", imageUrl: IMG("1587049352846-4a222e784d38") },
  { nameAr: "جبنة رومي", name: "Roumi Cheese", categorySlug: "dairy", price: 220, stockQuantity: 6, unit: "KG", imageUrl: IMG("1486297678162-eb2a19b0a32d") },
  { nameAr: "جبنة بيضاء إسطنبولي", name: "Istanbuli White Cheese", categorySlug: "dairy", price: 140, stockQuantity: 12, unit: "KG", imageUrl: IMG("1486297678162-eb2a19b0a32d") },
  { nameAr: "جبنة براميلي فلفل", name: "Baramili Cheese with Pepper", categorySlug: "dairy", price: 150, stockQuantity: 8, unit: "KG", imageUrl: IMG("1486297678162-eb2a19b0a32d") },
  { nameAr: "مخلل مشكل بلدي", name: "Mixed Pickles", categorySlug: "pickles", price: 35, stockQuantity: 20, unit: "KG", imageUrl: IMG("1590080875515-8a3a8dc5735e") },
  { nameAr: "زيتون أخضر تفاحي", name: "Green Olives", categorySlug: "pickles", price: 110, stockQuantity: 15, unit: "KG", imageUrl: IMG("1590080875515-8a3a8dc5735e") },
  { nameAr: "فلفل أسود حصى", name: "Black Pepper", categorySlug: "spices", price: 0.5, stockQuantity: 5000, unit: "GRAM", imageUrl: IMG("1597733336794-12d05021d510") },
  { nameAr: "كمون مطحون نقي", name: "Ground Cumin", categorySlug: "spices", price: 0.4, stockQuantity: 6000, unit: "GRAM", imageUrl: IMG("1597733336794-12d05021d510") },
  { nameAr: "كزبرة ناعمة", name: "Ground Coriander", categorySlug: "spices", price: 0.25, stockQuantity: 8000, unit: "GRAM", imageUrl: IMG("1597733336794-12d05021d510") },
];

const BUILDING_CODES_A = ["AB12CD", "EF34GH", "IJ56KL", "MN78OP"];
const BUILDING_CODES_B = ["QR90ST", "UV12WX", "YZ34AB"];

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `B${ts}${rand}`;
}

async function clearAll() {
  // Order matters: children first.
  await prisma.walkInSaleItem.deleteMany();
  await prisma.walkInSale.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.favoriteProduct.deleteMany();
  await prisma.customRequest.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.building.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
  await prisma.area.deleteMany();
}

async function main() {
  console.log("🧹 Clearing existing data...");
  await clearAll();

  const adminHash = await bcrypt.hash("admin123456", 10);
  const storeHash = await bcrypt.hash("store123456", 10);

  // 1. Super admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@baqal.app",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      name: "المدير العام",
      isActive: true,
    },
  });

  // 2. Areas
  const areaMaadi = await prisma.area.create({
    data: { name: "Maadi", nameAr: "المعادي", city: "Cairo" },
  });
  const areaNasr = await prisma.area.create({
    data: { name: "Nasr City", nameAr: "مدينة نصر", city: "Cairo" },
  });
  const areaZayed = await prisma.area.create({
    data: { name: "Sheikh Zayed", nameAr: "الشيخ زايد", city: "Giza" },
  });

  // 3. Stores
  const storeA = await prisma.store.create({
    data: {
      name: "El Baraka Market",
      nameAr: "بركة ماركت",
      slug: "baraka",
      phone: "+201001234567",
      email: "store@baqal.app",
      status: "ACTIVE",
      isOpen: true,
      deliveryFee: new Prisma.Decimal(10),
      minOrderAmount: new Prisma.Decimal(30),
      address: "شارع 9 المعادي",
      platformCommissionRate: new Prisma.Decimal(5),
    },
  });
  const storeB = await prisma.store.create({
    data: {
      name: "Al Nour Grocery",
      nameAr: "النور",
      slug: "alnour",
      phone: "+201007654321",
      status: "ACTIVE",
      isOpen: true,
      deliveryFee: new Prisma.Decimal(15),
      minOrderAmount: new Prisma.Decimal(50),
      address: "مدينة نصر - المنطقة الثامنة",
      platformCommissionRate: new Prisma.Decimal(7),
    },
  });

  // 3b. Plans + subscriptions
  const planBasic = await prisma.plan.create({
    data: {
      tier: "BASIC",
      name: "Basic",
      nameAr: "الأساسية",
      priceMonthly: new Prisma.Decimal(299),
      priceYearly: new Prisma.Decimal(2990),
      maxBuildings: 3,
      maxProducts: 300,
      maxStoreUsers: 1,
      features: ["basic-reports"],
    },
  });
  const planPlus = await prisma.plan.create({
    data: {
      tier: "PLUS",
      name: "Plus",
      nameAr: "بلس",
      priceMonthly: new Prisma.Decimal(599),
      priceYearly: new Prisma.Decimal(5990),
      maxBuildings: 15,
      maxProducts: 1000,
      maxStoreUsers: 3,
      features: ["offers", "push", "basic-reports"],
    },
  });
  const planPro = await prisma.plan.create({
    data: {
      tier: "PRO",
      name: "Pro",
      nameAr: "برو",
      priceMonthly: new Prisma.Decimal(1299),
      priceYearly: new Prisma.Decimal(12990),
      maxBuildings: 999999,
      maxProducts: 999999,
      maxStoreUsers: 10,
      features: ["offers", "push", "drivers", "advanced-reports", "pay-later", "pos"],
    },
  });
  await prisma.plan.create({
    data: {
      tier: "ENTERPRISE",
      name: "Enterprise",
      nameAr: "المؤسسات",
      priceMonthly: new Prisma.Decimal(0),
      priceYearly: new Prisma.Decimal(0),
      maxBuildings: 999999,
      maxProducts: 999999,
      maxStoreUsers: 999,
      features: ["multi-branch", "custom-onboarding", "priority-support"],
    },
  });

  await prisma.subscription.create({
    data: {
      storeId: storeA.id,
      planId: planPro.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      amount: new Prisma.Decimal(1299),
      renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });
  await prisma.subscription.create({
    data: {
      storeId: storeB.id,
      planId: planPlus.id,
      status: "TRIAL",
      billingCycle: "MONTHLY",
      amount: new Prisma.Decimal(0),
      endsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      renewalDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    },
  });

  // reference to silence unused warning if planBasic not used further
  void planBasic;

  // 4. Store owners
  await prisma.user.create({
    data: {
      email: "store@baqal.app",
      passwordHash: storeHash,
      role: "STORE_OWNER",
      storeId: storeA.id,
      name: "أحمد البقال",
      isActive: true,
    },
  });
  await prisma.user.create({
    data: {
      email: "alnour@baqal.app",
      passwordHash: storeHash,
      role: "STORE_OWNER",
      storeId: storeB.id,
      name: "محمود النور",
      isActive: true,
    },
  });

  // 5. Categories per store
  const categoriesByStore: Record<string, Record<string, string>> = {};
  for (const store of [storeA, storeB]) {
    categoriesByStore[store.id] = {};
    for (let i = 0; i < CATEGORY_LIST.length; i++) {
      const c = CATEGORY_LIST[i];
      const created = await prisma.category.create({
        data: {
          name: c.slug,
          nameAr: c.nameAr,
          slug: c.slug,
          icon: c.icon,
          order: i,
          storeId: store.id,
        },
      });
      categoriesByStore[store.id][c.slug] = created.id;
    }
  }

  // 6. Products per store
  let productCount = 0;
  const productsByStore: Record<string, { id: string; nameAr: string; price: number; discountPrice: number | null }[]> = {};
  for (const store of [storeA, storeB]) {
    productsByStore[store.id] = [];
    for (const p of PRODUCT_LIST) {
      const catId = categoriesByStore[store.id][p.categorySlug];
      const created = await prisma.product.create({
        data: {
          name: p.name,
          nameAr: p.nameAr,
          categoryId: catId,
          price: new Prisma.Decimal(p.price),
          discountPrice: p.discountPrice != null ? new Prisma.Decimal(p.discountPrice) : null,
          stockQuantity: p.stockQuantity,
          unit: p.unit,
          imageUrl: p.imageUrl ?? null,
          isAvailable: true,
          lowStockThreshold: 5,
          storeId: store.id,
        },
      });
      productsByStore[store.id].push({
        id: created.id,
        nameAr: p.nameAr,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
      });
      productCount++;

      // For products flagged alsoInOffers, create a companion product in the offers category.
      if (p.alsoInOffers) {
        const offersCatId = categoriesByStore[store.id]["offers"];
        await prisma.product.create({
          data: {
            name: `${p.name} (Offer)`,
            nameAr: `${p.nameAr} - عرض`,
            categoryId: offersCatId,
            price: new Prisma.Decimal(p.price),
            discountPrice: p.discountPrice != null ? new Prisma.Decimal(p.discountPrice) : null,
            stockQuantity: p.stockQuantity,
            unit: p.unit,
            isAvailable: true,
            lowStockThreshold: 5,
            storeId: store.id,
          },
        });
        productCount++;
      }

      // Emergency companions for select items.
      if (p.alsoInEmergency) {
        const emerCatId = categoriesByStore[store.id]["emergency"];
        await prisma.product.create({
          data: {
            name: `${p.name} (Emergency)`,
            nameAr: `${p.nameAr} - عاجل`,
            categoryId: emerCatId,
            price: new Prisma.Decimal(p.price),
            stockQuantity: p.stockQuantity,
            unit: p.unit,
            isAvailable: true,
            lowStockThreshold: 5,
            storeId: store.id,
          },
        });
        productCount++;
      }
    }
  }

  // 7. Buildings
  const buildingsA: { id: string; code: string; deliveryFee: number | null }[] = [];
  const buildingsB: { id: string; code: string; deliveryFee: number | null }[] = [];
  const areaIds = [areaMaadi.id, areaNasr.id, areaZayed.id];

  for (let i = 0; i < BUILDING_CODES_A.length; i++) {
    const code = BUILDING_CODES_A[i];
    const b = await prisma.building.create({
      data: {
        name: `مبنى ${i + 1} - بركة`,
        code,
        areaId: areaIds[i % areaIds.length],
        street: `شارع ${i + 1}`,
        buildingNumber: `${10 + i}`,
        storeId: storeA.id,
        deliveryFee: i === 0 ? new Prisma.Decimal(8) : null,
        isActive: true,
      },
    });
    buildingsA.push({ id: b.id, code: b.code, deliveryFee: i === 0 ? 8 : null });
  }

  for (let i = 0; i < BUILDING_CODES_B.length; i++) {
    const code = BUILDING_CODES_B[i];
    const b = await prisma.building.create({
      data: {
        name: `مبنى ${i + 1} - النور`,
        code,
        areaId: areaIds[(i + 1) % areaIds.length],
        street: `شارع النور ${i + 1}`,
        buildingNumber: `${20 + i}`,
        storeId: storeB.id,
        isActive: true,
      },
    });
    buildingsB.push({ id: b.id, code: b.code, deliveryFee: null });
  }

  // 8. QR codes — one per building
  let qrCount = 0;
  for (const b of buildingsA) {
    await prisma.qRCode.create({
      data: {
        storeId: storeA.id,
        buildingId: b.id,
        code: b.code,
        url: `${APP_URL}/b/${b.code}`,
        isActive: true,
      },
    });
    qrCount++;
  }
  for (const b of buildingsB) {
    await prisma.qRCode.create({
      data: {
        storeId: storeB.id,
        buildingId: b.id,
        code: b.code,
        url: `${APP_URL}/b/${b.code}`,
        isActive: true,
      },
    });
    qrCount++;
  }

  // 9. Sample customer + address (store A)
  const customer = await prisma.customer.create({
    data: {
      name: "منى محمد",
      phone: "01111111111",
      storeId: storeA.id,
    },
  });
  const firstBuilding = buildingsA[0];
  const address = await prisma.address.create({
    data: {
      customerId: customer.id,
      buildingId: firstBuilding.id,
      buildingName: `مبنى 1 - بركة`,
      floor: "3",
      apartment: "12",
      deliveryNotes: "الجرس الأزرق",
      isDefault: true,
    },
  });

  // 10. Sample orders — 3 orders for store A
  const productsA = productsByStore[storeA.id];
  const orderStatuses: Array<"PENDING" | "PREPARING" | "DELIVERED"> = [
    "PENDING",
    "PREPARING",
    "DELIVERED",
  ];
  let orderCount = 0;

  for (const status of orderStatuses) {
    // Pick 3-4 items from productsA.
    const picks = productsA.slice(orderCount * 3, orderCount * 3 + 4);
    let subtotal = 0;
    const itemsData = picks.map((p) => {
      const unitPrice = p.discountPrice ?? p.price;
      const quantity = 1 + (orderCount % 3);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;
      return {
        productId: p.id,
        productNameSnapshot: p.nameAr,
        quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
      };
    });
    const deliveryFee = firstBuilding.deliveryFee ?? 10;
    const total = subtotal + deliveryFee;

    const isDelivered = status === "DELIVERED";
    const commissionRate = 5;
    const commission = Math.round(total * commissionRate) / 100;

    const order = await prisma.order.create({
      data: {
        orderNumber: genOrderNumber(),
        storeId: storeA.id,
        customerId: customer.id,
        buildingId: firstBuilding.id,
        addressId: address.id,
        status,
        subtotal: new Prisma.Decimal(subtotal),
        deliveryFee: new Prisma.Decimal(deliveryFee),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        paymentMethod: "CASH_ON_DELIVERY",
        paymentStatus: isDelivered ? "PAID" : "UNPAID",
        platformCommissionRate: isDelivered
          ? new Prisma.Decimal(commissionRate)
          : null,
        platformCommission: isDelivered ? new Prisma.Decimal(commission) : null,
        items: { create: itemsData },
      },
    });

    if (isDelivered) {
      const settlement = await prisma.settlement.create({
        data: {
          storeId: storeA.id,
          amount: new Prisma.Decimal(commission),
          orderCount: 1,
          fromDate: order.createdAt,
          toDate: order.createdAt,
          status: "PENDING",
        },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { settlementId: settlement.id },
      });
    }

    // History progression mirrors the current status.
    const progression: Array<"PENDING" | "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED"> =
      status === "PENDING"
        ? ["PENDING"]
        : status === "PREPARING"
        ? ["PENDING", "ACCEPTED", "PREPARING"]
        : ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
    for (const s of progression) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: s,
          createdBy: admin.id,
        },
      });
    }

    orderCount++;
  }

  const userCount = await prisma.user.count();
  const storeCount = await prisma.store.count();
  const categoryCount = await prisma.category.count();
  const finalProductCount = await prisma.product.count();
  const buildingCount = await prisma.building.count();
  const finalQrCount = await prisma.qRCode.count();
  const finalOrderCount = await prisma.order.count();

  console.log("✅ Seed complete");
  console.log(`  Users: ${userCount}`);
  console.log(`  Stores: ${storeCount}`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Products: ${finalProductCount}`);
  console.log(`  Buildings: ${buildingCount}`);
  console.log(`  QR codes: ${finalQrCount}`);
  console.log(`  Orders: ${finalOrderCount}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
