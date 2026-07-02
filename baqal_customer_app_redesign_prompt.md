# Baqal Customer App UI/UX Redesign Prompt

## Project

You are improving the **customer-facing PWA / mobile web app** for the SaaS grocery platform:

```txt
Baqal / بقالك
```

This is the customer app used by residents after scanning a building QR code. The customer opens the grocery store page, browses products, adds items to cart, places orders, tracks orders, views offers, and manages basic account/cart information.

The current app is functional, but the UI is weak, flat, and not visually consistent with the main Baqal design system. Product cards are not distinctive, order cards are plain, the home page lacks identity, and the bottom navigation feels basic.

Do not rebuild the business logic from scratch.  
Do not break routes, API calls, cart state, favorites, product filtering, orders, checkout, or order tracking.  
Refactor and redesign the UI/UX only while preserving existing functionality.

---

# Main Goal

Transform the customer app from a plain mobile interface into a polished, modern, grocery-tech PWA experience.

The final app should feel:

```txt
Modern
Mobile-first
RTL-first
Fast
Friendly
Trustworthy
Premium but simple
Consistent with Baqal landing page and dashboard
Designed for local grocery ordering in Egypt / MENA
```

The user should instantly feel:

```txt
ده تطبيق بقالة حديث ومحترم ومصمم بعناية
```

---

# Current UI Problems

Fix these issues visible in the current screenshots:

```txt
1. The customer app does not look visually distinctive.
2. The design does not fully match the main Baqal identity.
3. Product cards are weak, flat, and not attractive.
4. Placeholder/image areas look boring and too empty.
5. Product card hierarchy is poor.
6. Price, name, favorite, discount, and add-to-cart actions need stronger layout.
7. Home page sections feel generic.
8. “محتاجه بسرعة” and “عروض” do not feel important enough.
9. Offers page does not feel like a real offers/deals page.
10. Orders page cards are too plain and repetitive.
11. Order status is not visually strong.
12. Bottom navigation feels old and flat.
13. Empty states and skeletons need polish.
14. Spacing and typography need a consistent design system.
15. The whole app feels separate from the rest of Baqal.
```

---

# Design Direction

Use a clean modern Arabic commerce UI style.

The design should combine:

```txt
Grocery app simplicity
Modern SaaS polish
Soft cards
Rounded UI
Clear hierarchy
Strong product cards
Subtle depth
Light background
Green brand identity
Orange offer accents
```

Avoid:

```txt
Dark theme
Cartoon style
Random gradients
Heavy glassmorphism
Over-designed flashy visuals
Huge empty gray blocks
Weak product cards
Crowded screens
Old-looking bottom nav
```

---

# Brand Design System

Use the following visual system across the entire customer app.

## Colors

```txt
Primary Green: #16A34A
Primary Green Dark: #15803D
Primary Green Light: #DCFCE7
Primary Green Soft: #ECFDF5

Orange Accent: #F97316
Orange Soft: #FFF7ED

Background: #F8FAFC
Card: #FFFFFF
Card Alt: #F1F5F9

Text Dark: #0F172A
Text Main: #111827
Text Muted: #64748B

Border: #E2E8F0
Border Soft: #EDF2F7

Danger: #DC2626
Danger Soft: #FEF2F2

Warning: #F59E0B
Warning Soft: #FFFBEB

Success: #22C55E
Info: #0EA5E9
```

## Color Usage Rules

```txt
Green = primary actions, active states, available/open status
Orange = offers, discounts, urgency, highlights
Slate = text and neutral structure
White = product cards and main surfaces
Soft backgrounds only, no heavy dark sections
```

---

# Typography

Use a modern Arabic font:

```txt
Cairo
Tajawal
IBM Plex Sans Arabic
```

Typography rules:

```txt
Use RTL everywhere.
Titles should be bold and clear.
Secondary text should be muted.
Prices should be visually strong.
Use consistent font sizes.
Avoid tiny unreadable labels.
Avoid random bold weights.
Use tabular numbers for prices and totals.
```

Recommended hierarchy:

```txt
Screen title: text-2xl / text-3xl font-bold
Section title: text-xl font-bold
Product name: text-sm or text-base font-semibold
Price: text-base / text-lg font-bold text-emerald-700
Muted metadata: text-xs / text-sm text-slate-500
```

---

# Global UI Rules

Apply these rules across all customer screens:

```txt
Mobile-first layout
RTL-first layout
Light theme only
Background: bg-slate-50
Cards: bg-white
Main radius: rounded-2xl
Small radius: rounded-xl
Soft border: border border-slate-200
Subtle shadow: shadow-sm / shadow-md
Consistent spacing: p-4, gap-4, mb-5
Clear section headers
Clean empty states
Smooth tap feedback
No broken images
No huge unused spaces
```

---

# Required Screens To Redesign

Focus on the following screens/components:

```txt
1. Customer home page
2. Offers page
3. My orders page
4. Product card
5. Offer card
6. Order card
7. Bottom navigation
8. Store header
9. Search bar
10. Category chips
11. Favorite button
12. Add-to-cart button
13. Status badges
14. Empty states
15. Loading skeletons
```

---

# 1. Customer Home Page Redesign

## Current Problem

The current home page is too plain. The header, product cards, sections, and category chips do not feel premium or distinctive.

## Required Structure

Use this structure:

```txt
Store Header Card
Search Bar
Category Chips
Quick Highlights Strip
محتاجه بسرعة Section
عروض Section
Recommended / All Products Section
Sticky Bottom Navigation
```

---

## Store Header Card

Redesign the top store area into a clear branded card.

It should include:

```txt
Store avatar/icon
Store name
Open/closed badge
Delivery fee
Minimum order
Favorite button
Optional small info line
```

Example copy:

```txt
بركة ماركت
التوصيل 10 ج.م • أقل طلب 30 ج.م
مفتوح الآن
```

Visual requirements:

```txt
Use white or soft green background.
Use rounded-2xl.
Add subtle shadow.
Store icon inside green soft circle.
Favorite button as floating circular button.
Status badge should be clear and polished.
Do not make the header look like plain text stuck to the top.
```

Suggested layout:

```txt
Right: store icon + store name + delivery/min order
Left: favorite button + open badge
```

Open badge:

```txt
مفتوح
```

Style:

```txt
bg-emerald-50 text-emerald-700 border border-emerald-200
```

Closed badge:

```txt
مغلق
```

Style:

```txt
bg-slate-100 text-slate-600 border border-slate-200
```

---

## Search Bar

The current search bar is too generic.

Placeholder:

```txt
دور على أي منتج...
```

Requirements:

```txt
White background
Rounded-2xl
Soft border
Subtle shadow
Search icon inside
Clear focus state
Comfortable height
Sticky on scroll optional
```

Suggested style:

```txt
h-12 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm
focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100
```

---

## Category Chips

Improve category chips.

Categories example:

```txt
الكل
مشروبات
ألبان
مخبوزات
سناكس
حلويات
عروض
محتاجه بسرعة
```

Requirements:

```txt
Horizontal scroll
Hidden native scrollbar
Rounded-full chips
Active state strong green
Inactive state white with border
Smooth transition
Better spacing
```

Active style:

```txt
bg-emerald-700 text-white shadow-sm border-emerald-700
```

Inactive style:

```txt
bg-white text-slate-700 border border-slate-200 hover:bg-slate-50
```

Add CSS:

```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## Quick Highlights Strip

Add a small strip under the category chips.

Example items:

```txt
توصيل سريع
منتجات يومية
عروض شغالة
أكثر طلبًا
```

Visual:

```txt
Small pill cards
Soft green/orange backgrounds
Compact icons
Horizontal scroll
```

---

## “محتاجه بسرعة” Section

This section must look important.

Title:

```txt
محتاجه بسرعة ⚡
```

Subtitle:

```txt
أهم المنتجات اللي بتتطلب بسرعة
```

Action button:

```txt
أضف الكل للسلة
```

Requirements:

```txt
Use a strong section header.
Use orange/lightning accent.
Cards should be compact and attractive.
Section should not look like plain text + products.
```

Suggested section header:

```txt
Right: title + subtitle
Left: small outline button
```

---

## “عروض” Section

Offers must feel like real deals.

Title:

```txt
العروض
```

Subtitle:

```txt
خصومات مختارة من بركة ماركت
```

Requirements:

```txt
Offer cards should have orange accent.
Discount badge should be prominent.
Old price and new price must be clear.
Savings hint optional.
```

---

# 2. Product Card Redesign

## Required Product Card Content

Each product card must include:

```txt
Product image
Favorite button
Discount badge if exists
Product name
Category / unit
Price
Old price if discounted
Availability / stock hint optional
Add button
```

---

## Product Card Visual Style

Current product cards are weak. Replace them with a stronger reusable `ProductCard` component.

Card style:

```txt
bg-white
rounded-2xl
border border-slate-200
shadow-sm
overflow-hidden
transition
active:scale-[0.98]
```

Image area:

```txt
Aspect ratio 1:1 or fixed mobile-friendly height
object-cover
soft background fallback
floating favorite button
floating discount badge
```

Content:

```txt
p-3 or p-4
product name bold
category/unit muted
price strong green
old price line-through if discounted
compact add button
```

Product name:

```txt
text-sm font-bold text-slate-900 line-clamp-2
```

Category/unit:

```txt
text-xs text-slate-500
```

Price:

```txt
text-base font-black text-emerald-700 tabular-nums
```

Old price:

```txt
text-xs text-slate-400 line-through tabular-nums
```

---

## Add To Cart Button

Use a compact button.

Button text:

```txt
أضف
```

or:

```txt
أضف للسلة
```

Style:

```txt
bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl
```

For small cards, use:

```txt
+ أضف
```

If out of stock:

```txt
غير متاح
```

Style:

```txt
bg-slate-100 text-slate-400 cursor-not-allowed
```

---

## Product Image Fallback

Broken or empty image areas must look clean.

Fallback should not be a huge empty gray box.

Fallback options:

```txt
Product initials
Package icon
Text: لا توجد صورة
Soft gradient background
```

Fallback style:

```txt
bg-slate-100 text-slate-400 flex items-center justify-center
```

Never show a browser broken image icon.

---

## Discount Badge

If product has discount, show badge:

```txt
خصم
```

or:

```txt
خصم 15%
```

Style:

```txt
bg-orange-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-sm
```

---

## Favorite Button

Use circular button:

```txt
bg-white shadow-sm border border-slate-200 rounded-full
```

Inactive:

```txt
Heart outline, slate color
```

Active:

```txt
Heart filled red, light red background
```

Add subtle pop animation on toggle.

---

# 3. Offer Card Redesign

Offer cards should be a special variant of product cards.

Required content:

```txt
Product image
Favorite button
Discount badge
Product name
Category / unit
Old price
New price
Savings hint
Add to cart button
```

Savings hint examples:

```txt
وفرت 8 ج.م
عرض لفترة محدودة
```

Visual style:

```txt
White card with orange soft accent
Discount badge prominent
New price green
Old price muted + line-through
Small orange strip or badge
```

---

# 4. Offers Page Redesign

## Required Layout

```txt
Header
Offers Summary Strip
Offer Filter Chips
Offers Grid
Bottom Navigation
```

Header:

```txt
العروض
خصومات مختارة من بركة ماركت
```

Summary strip:

```txt
5 عروض متاحة اليوم
```

Optional urgency strip:

```txt
العروض بتتحدث حسب المتاح في البقالة
```

Offer filter chips:

```txt
الكل
خصومات
أقل سعر
الأحدث
```

Empty state:

```txt
مفيش عروض متاحة حالياً
أول ما يبقى فيه خصومات هتظهر هنا
```

---

# 5. Orders Page Redesign

## Current Problem

Order cards are flat and do not communicate status clearly.

## Required Layout

```txt
Header
Status Filter Chips
Orders List
Bottom Navigation
```

Header:

```txt
طلباتي
تابع حالة كل طلب بسهولة
```

Status chips:

```txt
الكل
جديد
قيد التنفيذ
في الطريق
تم التوصيل
ملغي
```

---

## Order Card Required Content

Each order card should show:

```txt
Status badge
Store name
Order code
Items preview
Total price
Order date
Action buttons
```

Suggested layout:

```txt
Top row: store name + status badge
Second row: order code
Middle: product summary pills
Bottom row: total + date + actions
```

Example:

```txt
بركة ماركت
#BMR3KN05MXOMV
أرز أبيض 1 كجم ×1، جبنة رومي ×1
270.00 ج.م
02 يوليو 2026
```

Actions:

```txt
عرض التفاصيل
إعادة الطلب
تتبع الطلب
```

---

## Order Status Badge Styles

Use these states:

```txt
جديد = amber
قيد التنفيذ = blue
في الطريق = orange
تم التوصيل = green
ملغي = red
```

Styles:

```txt
جديد:
bg-amber-50 text-amber-700 border border-amber-200

قيد التنفيذ:
bg-blue-50 text-blue-700 border border-blue-200

في الطريق:
bg-orange-50 text-orange-700 border border-orange-200

تم التوصيل:
bg-emerald-50 text-emerald-700 border border-emerald-200

ملغي:
bg-red-50 text-red-700 border border-red-200
```

---

## Order Items Preview

Current item preview is too plain.

Use pill/box style:

```txt
كوكاكولا 1 لتر ×1
بيبسي 1 لتر ×1
```

Style:

```txt
bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm text-slate-600
```

If there are many items:

```txt
+3 منتجات أخرى
```

---

# 6. Bottom Navigation Redesign

## Tabs

```txt
الرئيسية
العروض
طلباتي
السلة
حسابي
```

## Current Problem

The bottom navigation is too basic and old-looking.

## Required Design

```txt
Fixed bottom
White background
Soft top border or shadow
Rounded top corners optional
Active item clearly highlighted
Inactive items muted
Icons aligned with labels
Safe-area padding for mobile
```

Active state:

```txt
Icon green
Text green
Small soft green pill/circle behind icon
```

Inactive state:

```txt
text-slate-400
```

Suggested active style:

```txt
bg-emerald-50 text-emerald-700 rounded-xl
```

Cart tab should show badge if items exist:

```txt
1
2
3
```

Badge style:

```txt
bg-red-500 text-white rounded-full text-xs
```

---

# 7. Cart Entry Points

Make cart access clear.

Rules:

```txt
Cart icon in bottom nav should show count.
Product add action should give feedback.
After adding, show toast or mini cart confirmation.
If cart has items, optional floating mini cart bar can appear above bottom nav.
```

Mini cart bar example:

```txt
السلة: 3 منتجات — 120.00 ج.م
عرض السلة
```

---

# 8. Empty States

Create polished empty states.

## Empty Products

```txt
مفيش منتجات متاحة حالياً
جرّب قسم تاني أو ارجع بعد شوية
```

## Empty Offers

```txt
مفيش عروض متاحة حالياً
أول ما يبقى فيه خصومات هتظهر هنا
```

## Empty Orders

```txt
لسه معملتش طلبات
ابدأ اختار منتجاتك واطلب بسهولة
```

## Empty Cart

```txt
السلة فاضية
أضف المنتجات اللي محتاجها وهتظهر هنا
```

Design:

```txt
Icon inside soft circle
Bold title
Muted subtitle
Optional CTA
White card or dashed border card
```

---

# 9. Loading Skeletons

Replace ugly gray blocks with better skeletons.

## Product Skeleton

```txt
Image skeleton
Title skeleton
Category skeleton
Price skeleton
Button skeleton
```

## Order Skeleton

```txt
Badge skeleton
Store name skeleton
Items preview skeleton
Total/date skeleton
```

Use:

```txt
animate-pulse
bg-slate-200
rounded-xl
```

Skeleton cards should match the actual final card shape.

---

# 10. Motion / Animation

Add subtle professional animations.

Use Framer Motion or CSS transitions.

Required animations:

```txt
Page fade-in
Section fade-up
Product cards stagger in
Offer cards stagger in
Order cards reveal animation
Category chip active transition
Favorite heart pop
Add-to-cart feedback
Bottom nav active transition
Skeleton loading shimmer
```

Example motion:

```tsx
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.35, ease: "easeOut" }}
```

Stagger:

```tsx
const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};
```

Avoid:

```txt
Excessive bounce
Slow animation
Flashing effects
Too many distracting motions
```

---

# 11. Component Refactor

Create or improve these components:

```txt
CustomerAppLayout
StoreHeaderCard
SearchBar
CategoryChips
QuickHighlightPills
SectionHeader
ProductCard
OfferCard
OrderCard
OrderStatusBadge
FavoriteButton
AddToCartButton
BottomNavigation
EmptyState
SkeletonCard
MiniCartBar
```

---

# 12. Screen-Specific Copy

## Home

```txt
بركة ماركت
مفتوح
التوصيل 10 ج.م
أقل طلب 30 ج.م
دور على أي منتج...
محتاجه بسرعة
أهم المنتجات اللي بتتطلب بسرعة
العروض
خصومات مختارة
أضف الكل للسلة
```

## Offers

```txt
العروض
خصومات مختارة من بركة ماركت
5 عروض متاحة اليوم
وفرت
خصم
أضف للسلة
```

## Orders

```txt
طلباتي
تابع حالة كل طلب بسهولة
الكل
جديد
قيد التنفيذ
في الطريق
تم التوصيل
ملغي
عرض التفاصيل
إعادة الطلب
تتبع الطلب
```

## Product Card

```txt
أضف
أضف للسلة
غير متاح
نفد المخزون
خصم
```

## Empty States

```txt
مفيش منتجات متاحة حالياً
مفيش عروض متاحة حالياً
لسه معملتش طلبات
السلة فاضية
```

---

# 13. Responsive Behavior

This is a mobile-first PWA.

## Mobile

```txt
Single-column flow
Product grid: 2 columns
Offer grid: 2 columns
Bottom navigation fixed
Header compact
Search full width
Horizontal category chips
```

## Small Mobile

```txt
Product grid can remain 2 columns if readable.
If too tight, reduce padding and image height.
Do not make cards overflow.
```

## Tablet

```txt
Product grid: 3 columns
More spacious header
Bottom nav can remain fixed
```

---

# 14. Accessibility

Implement:

```txt
Readable contrast
Clear focus states
aria-label for icon buttons
aria-label for favorite button
aria-label for add-to-cart button
Buttons not smaller than comfortable tap target
Do not rely only on color for order status
Alt text for product images
```

---

# 15. Technical Rules

Do not break:

```txt
Routes
API calls
Cart logic
Favorite logic
Orders logic
Order status logic
Product listing logic
Category filtering
Search logic
Checkout flow
Bottom navigation routing
PWA behavior
```

Only change:

```txt
Layout
Styling
Components
Spacing
Visual hierarchy
Animations
Empty states
Skeletons
Micro-interactions
```

---

# 16. Final Expected Result

The final customer app should have:

```txt
A stronger home page
Modern product cards
Distinctive offer cards
Professional order cards
A polished bottom navigation
Consistent Baqal identity
Better spacing and typography
Subtle animations
Clean empty states
Better skeleton loading
```

The final impression should be:

```txt
ده تطبيق عميل مميز تابع لمنصة بقالك، مش واجهة موبايل عادية.
```

The customer should instantly understand:

```txt
المتجر مفتوح أم لا
التوصيل كام
أقل طلب كام
أبحث منين
الأقسام فين
المنتجات المهمة فين
العروض فين
أضيف للسلة منين
أتابع طلباتي منين
```
