# قرارات المعمارية — تحويل المشروع إلى SaaS

## القرار 1: قاعدة البيانات
**الاختيار:** PostgreSQL الحالي في Replit (لا انتقال لـ Supabase)

**السبب:**
- لا توقف للخدمة
- Drizzle ORM يدعم RLS transactions مباشرةً
- اتصال واحد موثوق، لا pooling خارجي مطلوب

**كيف نطبق RLS:**
```typescript
// كل query حساسة داخل transaction صريح
await db.transaction(async (tx) => {
  await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}, true)`);
  const results = await tx.select().from(table);
});
```

---

## القرار 2: بوابة الدفع
**الاختيار:** يُحدد في المرحلة 3 (Chargily و/أو Stripe)

---

## القرار 3: الـ Webhook عند انتهاء الاشتراك
**السلوك المحدد:**
```
رسالة واردة على Webhook
├── tenant غير موجود           → تجاهل + log + رجّع 200 لفيسبوك
├── onboarding غير مكتمل       → أضف للـ Queue (48 ساعة TTL)
├── اشتراك منتهٍ + grace period → عالجها + تذكير يومي للـ tenant
├── اشتراك منتهٍ بلا grace      → رد افتراضي + إشعار للـ tenant
└── اشتراك نشط                 → عالجها بشكل عادي
```

---

## القرار 4: عزل البيانات (Defense in Depth)
**3 طبقات حماية:**
1. RLS على مستوى PostgreSQL (الأقوى)
2. `.where(eq(table.tenantId, req.tenantId))` في كل query
3. tenantId يُقرأ من JWT فقط — لا من body/query/URL

---

## القرار 5: جداول خارج Multi-tenancy
**الجداول التي لا تحتاج tenant_id:**
- `subscription_plans` — مشتركة بين الجميع
- `domain_templates` — مشتركة بين الجميع

**الجداول التي تحتاج tenant_id (28 جدول):**
- admin_users, ai_config, ai_providers, appointments, available_slots
- broadcast_templates, broadcasts, comments_log, conversation_sessions
- conversations, delivery_prices, faqs, fb_settings, leads
- order_sessions, orders, platform_events, pre_order_sessions
- pre_orders, processed_messages, product_categories, product_folders
- product_inquiries, products, provider_usage_log, subscription_usage
- user_counters, user_product_context

---

## تحذيرات UNIQUE Constraints
هذه الـ UNIQUE constraints ستُعدَّل في المرحلة 1:

| الجدول | الـ Constraint الحالي | بعد المرحلة 1 |
|--------|----------------------|---------------|
| leads | UNIQUE(fb_user_id) | UNIQUE(tenant_id, fb_user_id) |
| order_sessions | UNIQUE(fb_user_id) | UNIQUE(tenant_id, fb_user_id) |
| user_product_context | PK(fb_user_id) | نضيف tenant_id كـ index |
| user_counters | PK(fb_user_id) | نضيف tenant_id كـ index |
| pre_order_sessions | PK(fb_user_id) | نضيف tenant_id كـ index |

---

## حالة الإعداد

| المكون | الحالة |
|--------|--------|
| PostgreSQL 16.10 | ✅ جاهز، يدعم RLS |
| ENCRYPTION_KEY | ✅ مضبوط |
| JWT_SECRET | ✅ مضبوط |
| DATABASE_URL | ✅ مضبوط |
| REDIS_URL | ⚠️ غير مضبوط (يُضاف في المرحلة 6) |
| نسخة احتياطية | ✅ موجودة في scripts/saas-migration/backups/ |
| Rollback scripts | ✅ جاهزة لكل خطوة |

---

## ترتيب التنفيذ المتفق عليه

```
المرحلة 0 — التحضير                    ✅ مكتملة
المرحلة 1 — قاعدة البيانات + RLS       ← التالية
المرحلة 2 — التسجيل + Onboarding
المرحلة 3 — الدفع + Trial
المرحلة 4 — Testing الشامل
المرحلة 5 — Super Admin
المرحلة 6 — Redis + BullMQ
المرحلة 7 — الإشعارات + Landing Page
```
