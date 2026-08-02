// scripts/generate-sitemap.mjs
//
// يولّد ملف public/sitemap.xml ديناميكياً قبل كل عملية بناء (build)
// عبر قراءة كل المنتجات النشطة والمجموعات من Supabase.
// Generates public/sitemap.xml dynamically before every build by
// reading all active products and collections from Supabase.
//
// يعمل تلقائياً عبر "prebuild" في package.json، ويمكن تشغيله يدوياً بـ:
//   npm run generate:sitemap

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://www.pitsiky.com';
const SUPABASE_URL = 'https://srzxzpwispudxldqjjah.supabase.co';
// نفس مفتاح anon العام المستخدم في src/lib/supabase.ts (آمن للقراءة العامة فقط)
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyenh6cHdpc3B1ZHhsZHFqamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTM4MDcsImV4cCI6MjA5ODkyOTgwN30.AAa9rSrdcxdgNCkU-Ab9BKqcahbL49KCMIgvl8B3a0s';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/collections', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/custom', changefreq: 'monthly', priority: '0.6' },
  { path: '/track', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.2' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.2' },
];

const urlEntry = (loc, changefreq, priority, lastmod) => `  <url>
    <loc>${loc}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

async function main() {
  const entries = STATIC_ROUTES.map((r) =>
    urlEntry(`${BASE_URL}${r.path}`, r.changefreq, r.priority),
  );

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // المنتجات النشطة فقط، ولها handle صالح — نتجنب أي منتج بدون slug
    // Only active products with a valid handle — skip anything missing a slug
    const { data: products, error: prodErr } = await supabase
      .from('ecom_products')
      .select('handle, updated_at, status')
      .eq('status', 'active')
      .not('handle', 'is', null);

    if (prodErr) throw prodErr;

    (products || [])
      .filter((p) => p.handle && p.handle.trim())
      .forEach((p) => {
        entries.push(
          urlEntry(
            `${BASE_URL}/products/${p.handle}`,
            'weekly',
            '0.7',
            p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
          ),
        );
      });

    // المجموعات / الفئات المرئية فقط
    // Only visible categories/collections
    const { data: categories, error: catErr } = await supabase
      .from('pts_categories')
      .select('slug, updated_at, is_visible, archived')
      .eq('is_visible', true)
      .eq('archived', false);

    if (catErr) throw catErr;

    (categories || [])
      .filter((c) => c.slug && c.slug.trim())
      .forEach((c) => {
        entries.push(
          urlEntry(
            `${BASE_URL}/collections/${c.slug}`,
            'weekly',
            '0.7',
            c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : undefined,
          ),
        );
      });

    console.log(`sitemap: ${products?.length || 0} products, ${categories?.length || 0} collections`);
  } catch (err) {
    // لا نفشل عملية البناء إذا تعذر الاتصال بـ Supabase أثناء الـ build —
    // نكتفي بروابط الصفحات الثابتة كحد أدنى.
    // Never fail the build if Supabase is unreachable during build time —
    // fall back to the static routes only.
    console.warn('generate-sitemap: could not fetch dynamic routes, falling back to static routes only.', err.message || err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  const outDir = path.resolve(__dirname, '../public');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`sitemap.xml written with ${entries.length} URLs.`);
}

main();
