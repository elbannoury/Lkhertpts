// scripts/generate-sitemap.mjs
//
// Runs before every build ("prebuild" in package.json) and writes:
//   • public/sitemap.xml   — pages + products + collections, WITH an image
//                            sitemap (wall art is visual: Google Images matters)
//   • public/llms-full.txt — the whole catalog + FAQ as plain text/Markdown for
//                            AI assistants (GEO), always in sync with the database
// If Supabase can't be reached the build does NOT fail — we fall back to the
// static pages only.
//
// Manual run: npm run generate:sitemap

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  SITE, BRAND_DESCRIPTION, FAQ_ITEMS, resolveFaq, productOptions, lowestPrice,
  productTitle, formatSize, formatMADText, productDescription, abs,
} from '../src/lib/seoShared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = SITE.url;

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/collections', changefreq: 'weekly', priority: '0.8' },
  { path: '/custom', changefreq: 'monthly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.2' },
];

const x = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const urlEntry = (loc, changefreq, priority, lastmod, images = []) => `  <url>
    <loc>${x(loc)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${images.map((im) => `    <image:image>\n      <image:loc>${x(im.url)}</image:loc>${im.title ? `\n      <image:title>${x(im.title)}</image:title>` : ''}\n    </image:image>`).join('\n')}${images.length ? '\n' : ''}  </url>`;

const day = (d) => (d ? new Date(d).toISOString().split('T')[0] : undefined);

async function main() {
  const entries = STATIC_ROUTES.map((r) => urlEntry(`${BASE_URL}${r.path}`, r.changefreq, r.priority));
  let products = [];
  let categories = [];

  try {
    const supabase = createClient(SITE.supabaseUrl, SITE.supabaseAnonKey);

    const { data: prods, error: prodErr } = await supabase
      .from('ecom_products')
      .select('handle, name, images, price, updated_at, product_type, description, description_ar, variants:ecom_product_variants(option1, price, position, inventory_qty)')
      .eq('status', 'active')
      .not('handle', 'is', null)
      .order('created_at', { ascending: false });
    if (prodErr) throw prodErr;
    products = (prods || []).filter((p) => p.handle && p.handle.trim());

    products.forEach((p) => {
      const imgs = (Array.isArray(p.images) ? p.images : []).slice(0, 5).map(abs).filter(Boolean)
        .map((url, i) => ({ url, title: i === 0 ? productTitle(p) : `${productTitle(p)} ${i + 1}` }));
      entries.push(urlEntry(`${BASE_URL}/products/${p.handle}`, 'weekly', '0.7', day(p.updated_at), imgs));
    });

    const { data: cats, error: catErr } = await supabase
      .from('pts_categories')
      .select('slug, title, title_ar, description, description_ar, updated_at, is_visible, archived')
      .eq('is_visible', true)
      .eq('archived', false)
      .order('position');
    if (catErr) throw catErr;
    categories = (cats || []).filter((c) => c.slug && c.slug.trim());
    categories.forEach((c) => entries.push(urlEntry(`${BASE_URL}/collections/${c.slug}`, 'weekly', '0.7', day(c.updated_at))));

    console.log(`sitemap: ${products.length} products, ${categories.length} collections`);
  } catch (err) {
    console.warn('generate-sitemap: could not fetch dynamic data, using static routes only.', err?.message || err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;

  const outDir = path.resolve(__dirname, '../public');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`sitemap.xml written with ${entries.length} URLs.`);

  // ------------------------------------------------------------- llms-full.txt
  const faq = resolveFaq(FAQ_ITEMS, 'en');
  const faqAr = resolveFaq(FAQ_ITEMS, 'ar');
  const lines = [];
  lines.push('# PITSIKY Art Gallery (بيتسيكي) — full catalog', '');
  lines.push(`> ${BRAND_DESCRIPTION.en}`, '', BRAND_DESCRIPTION.ar, '');
  lines.push('## Key facts', '');
  lines.push(`- Starting price: ${SITE.startingPriceMAD} MAD for 30x40 cm (larger sizes cost more).`);
  lines.push(`- Delivery: free to every city in Morocco, ${SITE.deliveryDays} business days.`);
  lines.push('- Payment: 50% upfront, 50% on delivery.');
  lines.push(`- Exchange: ${SITE.returnDays} days after delivery; damaged/misprinted items replaced free (report within 48h with a photo).`);
  lines.push(`- Contact: ${SITE.email} · WhatsApp ${SITE.phoneDisplay} · ${SITE.city}, Morocco.`, '');
  if (categories.length) {
    lines.push('## Collections', '');
    categories.forEach((c) => lines.push(`- [${c.title}${c.title_ar ? ` / ${c.title_ar}` : ''}](${BASE_URL}/collections/${c.slug})`));
    lines.push('');
  }
  lines.push(`## Products (${products.length})`, '');
  products.forEach((p) => {
    const opts = productOptions(p);
    const sizes = opts.map((o) => `${formatSize(o.size, 'en')} ${formatMADText(o.price, 'en')}`).join(', ');
    lines.push(`- [${productTitle(p)}](${BASE_URL}/products/${p.handle})${p.product_type ? ` — ${p.product_type}` : ''}${sizes ? ` — ${sizes}` : ''}`);
  });
  lines.push('', '## FAQ (English)', '');
  faq.forEach((i) => lines.push(`**${i.q}**`, i.a, ''));
  lines.push('## الأسئلة الشائعة (العربية)', '');
  faqAr.forEach((i) => lines.push(`**${i.q}**`, i.a, ''));
  writeFileSync(path.join(outDir, 'llms-full.txt'), lines.join('\n'), 'utf-8');
  console.log('llms-full.txt written.');
}

main();
