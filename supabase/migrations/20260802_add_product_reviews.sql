-- 20260802_add_product_reviews.sql
--
-- يضيف جدول مراجعات المنتجات (Reviews) اللازم لميزة تقييمات العملاء
-- بالنجوم في صفحة المنتج. شغّل هذا الملف يدوياً في Supabase SQL Editor
-- (أو عبر supabase db push) قبل نشر الكود الجديد.
--
-- Adds the product reviews table needed for the new star-rating customer
-- reviews feature on the product page. Run this manually in the Supabase
-- SQL Editor (or via `supabase db push`) before deploying the new frontend
-- code, otherwise ProductReviews.tsx will simply hide itself gracefully.

create table if not exists public.ecom_product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ecom_products(id) on delete cascade,
  customer_name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ecom_product_reviews_product_id_idx
  on public.ecom_product_reviews (product_id);

alter table public.ecom_product_reviews enable row level security;

-- أي زائر يمكنه قراءة المراجعات المعتمدة فقط
-- Anyone can read approved reviews
drop policy if exists "Public can read approved reviews" on public.ecom_product_reviews;
create policy "Public can read approved reviews"
  on public.ecom_product_reviews
  for select
  using (approved = true);

-- أي زائر يمكنه إضافة مراجعة جديدة (تُنشر مباشرة افتراضياً؛ يمكن تغييرها
-- إلى false ومراجعتها يدوياً من لوحة التحكم إذا رغبت في تعديل لاحقاً)
-- Anyone can submit a new review (published immediately by default; set
-- the default above to false and moderate manually if you prefer)
drop policy if exists "Public can submit reviews" on public.ecom_product_reviews;
create policy "Public can submit reviews"
  on public.ecom_product_reviews
  for insert
  with check (
    char_length(customer_name) > 0
    and char_length(customer_name) <= 80
    and (comment is null or char_length(comment) <= 1000)
  );
