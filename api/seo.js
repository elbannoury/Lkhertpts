// ============================================================================
// api/seo.js — bot pre-render (Vercel Serverless Function, Node runtime)
// ----------------------------------------------------------------------------
// PITSIKY is a client-side React app: the raw HTML it ships is an empty <div>.
// Search crawlers, AI crawlers (GPTBot, ClaudeBot, PerplexityBot …) and link-
// preview bots (WhatsApp, Facebook, Telegram …) mostly DO NOT run JavaScript,
// so without this they see nothing — no product, no price, no FAQ.
//
// vercel.json rewrites requests from those bots to this function. It reads
// the live catalog from Supabase and returns the REAL built index.html with:
//   • page-specific <title>, description, canonical, Open Graph, JSON-LD
//   • the page's real content (h1, text, prices, links, FAQ) inside #root
// React replaces #root as soon as it mounts, so humans / JS-capable crawlers
// get the normal app. Content is identical to what humans see (this is
// "dynamic rendering", which Google explicitly allows — it is NOT cloaking).
// On ANY error we fall back to the untouched index.html, never to a 5xx.
// ============================================================================
import {
  SITE, BRAND_DESCRIPTION, FAQ_ITEMS, resolveFaq, productFaq, productOptions, lowestPrice,
  productTitle, productDescription, productMetaDescription, formatSize, formatMADText,
  organizationSchema, websiteSchema, breadcrumbSchema, faqSchema, productSchema, collectionSchema, abs,
} from '../src/lib/seoShared.js';
import { matchesCat } from '../src/lib/collectionMatch.js';

const SB_URL = process.env.SUPABASE_URL || SITE.supabaseUrl;
const SB_KEY = process.env.SUPABASE_ANON_KEY || SITE.supabaseAnonKey;

// ------------------------------------------------------------------ helpers
const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ldTag = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

async function sb(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const PRODUCT_SELECT =
  'id,name,name_ar,handle,images,price,sku,product_type,tags,vendor,metadata,description,description_ar,has_variants,created_at,' +
  'variants:ecom_product_variants(option1,title,price,position,inventory_qty)';

const allProducts = () => sb(`ecom_products?select=${PRODUCT_SELECT}&status=eq.active&order=created_at.desc&limit=500`);

let templateCache = { html: null, at: 0, base: '' };
async function getTemplate(base) {
  if (templateCache.html && templateCache.base === base && Date.now() - templateCache.at < 5 * 60 * 1000) return templateCache.html;
  const res = await fetch(`${base}/index.html`, { headers: { 'user-agent': 'pitsiky-prerender' } });
  if (!res.ok) throw new Error(`template ${res.status}`);
  const html = await res.text();
  if (!html.includes('id="root"')) throw new Error('template has no #root');
  templateCache = { html, at: Date.now(), base };
  return html;
}

function baseFromReq(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  return /(^|\.)pitsiky\.com$/.test(host) || /\.vercel\.app$/.test(host) ? `https://${host}` : SITE.url;
}

// ---------------------------------------------------------------- html parts
const productLi = (p) => {
  const img = Array.isArray(p.images) && p.images[0] ? abs(p.images[0]) : '';
  const from = lowestPrice(p);
  return `<li><a href="/products/${esc(p.handle)}">${img ? `<img src="${esc(img)}" alt="${esc(productTitle(p))} — لوحة جدارية من بيتسيكي" loading="lazy" width="300" height="375">` : ''}<h3>${esc(productTitle(p))}</h3>${from ? `<p>ابتداءً من ${esc(formatMADText(from, 'ar'))}</p>` : ''}</a></li>`;
};

const productList = (list) => `<ul>${list.map(productLi).join('')}</ul>`;

const faqHtml = (qa, title = 'الأسئلة الشائعة') =>
  `<section><h2>${esc(title)}</h2>${qa.map((i) => `<details open><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</section>`;

const NAV = [
  ['/', 'الرئيسية'], ['/shop', 'المتجر — كل اللوحات'], ['/collections', 'المجموعات'], ['/custom', 'تصميم مخصص'],
  ['/about', 'من نحن'], ['/contact', 'اتصل بنا'], ['/track', 'تتبع الطلب'],
  ['/refund-policy', 'سياسة الإرجاع والاستبدال'], ['/privacy-policy', 'سياسة الخصوصية'], ['/terms-of-service', 'شروط الاستخدام'],
];
const navHtml = () => `<nav aria-label="روابط الموقع"><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></nav>`;

const crumbHtml = (items) =>
  `<nav aria-label="breadcrumb"><ol>${items.map((c, i) => `<li>${i < items.length - 1 ? `<a href="${esc(c.path)}">${esc(c.name)}</a>` : esc(c.name)}</li>`).join('')}</ol></nav>`;

const factsHtml = () =>
  `<ul><li>ابتداءً من ${SITE.startingPriceMAD} درهم للمقاس 30×40 سم</li><li>توصيل مجاني لكل مدن المغرب خلال ${SITE.deliveryDays} أيام عمل</li><li>الدفع: 50% مقدماً و50% عند الاستلام</li><li>استبدال خلال ${SITE.returnDays} أيام وضمان جودة الطباعة</li><li>تصميم مخصص حسب الطلب: ${SITE.url}/custom</li></ul>`;

const shell = (inner) => `<header><a href="/">${SITE.nameAr} | ${SITE.name}</a></header><main>${inner}</main><footer>${navHtml()}<p>${esc(SITE.legalName)} — ${esc(SITE.city)}، المغرب · <a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="tel:${SITE.phone}">${SITE.phoneDisplay}</a></p></footer>`;

// ------------------------------------------------------------ page builders
const generalFaq = resolveFaq(FAQ_ITEMS, 'ar');

async function pageHome() {
  const [products, cats] = await Promise.all([
    allProducts(),
    sb('pts_categories?select=title,title_ar,slug,description&is_visible=eq.true&archived=eq.false&order=position.asc'),
  ]);
  const catLinks = cats.length
    ? `<section><h2>مجموعات اللوحات الجدارية</h2><ul>${cats.map((c) => `<li><a href="/collections/${esc(c.slug)}">${esc(c.title_ar || c.title)}${c.title_ar && c.title ? ` — ${esc(c.title)}` : ''}</a></li>`).join('')}</ul></section>`
    : '';
  return {
    title: 'بيتسيكي | معرض فني للوحات الجدارية الفاخرة في المغرب',
    description: BRAND_DESCRIPTION.ar,
    path: '/',
    ld: [organizationSchema(), websiteSchema(), faqSchema(generalFaq)],
    body: shell(
      `<h1>بيتسيكي — لوحات جدارية فاخرة وديكور حائطي في المغرب</h1>` +
        `<p>${esc(BRAND_DESCRIPTION.ar)}</p><p lang="en">${esc(BRAND_DESCRIPTION.en)}</p>` +
        factsHtml() + catLinks +
        `<section><h2>أحدث اللوحات الجدارية</h2>${productList(products.slice(0, 30))}<p><a href="/shop">تصفّح كل اللوحات (${products.length})</a></p></section>` +
        faqHtml(generalFaq),
    ),
  };
}

async function pageShop() {
  const products = await allProducts();
  const crumbs = [{ name: 'الرئيسية', path: '/' }, { name: 'المتجر', path: '/shop' }];
  return {
    title: 'تسوّق كل اللوحات الجدارية | بيتسيكي',
    description: `تصفّح ${products.length} لوحة جدارية فاخرة من بيتسيكي، ابتداءً من ${SITE.startingPriceMAD} درهم، مع توصيل مجاني لكل مدن المغرب.`,
    path: '/shop',
    ld: [breadcrumbSchema(crumbs), collectionSchema({ name: 'كل اللوحات الجدارية', path: '/shop', products })],
    body: shell(`${crumbHtml(crumbs)}<h1>تسوّق كل اللوحات الجدارية</h1><p>${esc(BRAND_DESCRIPTION.ar)}</p>${factsHtml()}${productList(products)}`),
  };
}

async function pageCollections() {
  const cats = await sb('pts_categories?select=title,title_ar,slug,description,description_ar&is_visible=eq.true&archived=eq.false&order=position.asc');
  const crumbs = [{ name: 'الرئيسية', path: '/' }, { name: 'المجموعات', path: '/collections' }];
  return {
    title: 'كل مجموعات اللوحات الجدارية | بيتسيكي',
    description: 'استكشف كل مجموعات بيتسيكي من اللوحات الجدارية الفاخرة: سيارات، أنمي، فن إسلامي، ديكور عصري والمزيد.',
    path: '/collections',
    ld: [breadcrumbSchema(crumbs)],
    body: shell(`${crumbHtml(crumbs)}<h1>كل المجموعات</h1><ul>${cats.map((c) => `<li><a href="/collections/${esc(c.slug)}"><h2>${esc(c.title_ar || c.title)}</h2>${c.title_ar && c.title ? `<p lang="en">${esc(c.title)}</p>` : ''}</a>${c.description_ar || c.description ? `<p>${esc(c.description_ar || c.description)}</p>` : ''}</li>`).join('')}</ul>`),
  };
}

async function pageCollection(handle) {
  const products = await allProducts();
  let cat = null; let list = null; let parent = null;

  if (handle === 'all' || handle === 'inspiration') {
    cat = { title: 'All Artwork', title_ar: 'كل اللوحات', slug: handle };
    list = products;
  } else {
    const rows = await sb(`pts_categories?select=*&slug=eq.${encodeURIComponent(handle)}&order=position.asc&limit=1`);
    cat = rows[0] || null;
    if (cat) {
      const kids = await sb(`pts_categories?select=*&parent_id=eq.${cat.id}&is_visible=eq.true&order=position.asc`);
      if (cat.parent_id) { const p = await sb(`pts_categories?select=title,title_ar,slug&id=eq.${cat.parent_id}&limit=1`); parent = p[0] || null; }
      const byCat = products.filter((p) => matchesCat(p, cat));
      const bySubs = products.filter((p) => kids.some((k) => matchesCat(p, k)));
      list = [...new Map([...byCat, ...bySubs].map((p) => [p.id, p])).values()];
    } else {
      const cols = await sb(`ecom_collections?select=*&handle=eq.${encodeURIComponent(handle)}&limit=1`);
      const col = cols[0];
      if (col) {
        cat = { title: col.title, title_ar: null, slug: col.handle, description: col.description };
        const links = await sb(`ecom_product_collections?select=product_id,position&collection_id=eq.${col.id}&order=position.asc`);
        const ids = links.map((l) => l.product_id);
        list = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
      }
    }
  }
  if (!cat) return null;

  const name = cat.title_ar || cat.title;
  const path = `/collections/${handle}`;
  const crumbs = [{ name: 'الرئيسية', path: '/' }, { name: 'المجموعات', path: '/collections' }, ...(parent ? [{ name: parent.title_ar || parent.title, path: `/collections/${parent.slug}` }] : []), { name, path }];
  const desc = cat.description_ar || cat.description || `لوحات جدارية فاخرة من مجموعة ${name} لدى بيتسيكي — ابتداءً من ${SITE.startingPriceMAD} درهم مع توصيل مجاني لكل مدن المغرب.`;
  return {
    title: `${name} | لوحات جدارية فاخرة`,
    description: String(desc).slice(0, 158),
    path,
    image: cat.banner_image || cat.cover_image || undefined,
    ld: [breadcrumbSchema(crumbs), collectionSchema({ name, description: String(desc), path, products: list })],
    body: shell(`${crumbHtml(crumbs)}<h1>${esc(name)}</h1>${cat.title_ar && cat.title ? `<p lang="en">${esc(cat.title)}</p>` : ''}<p>${esc(desc)}</p><p>${list.length} لوحة</p>${list.length ? productList(list) : '<p>لوحات جديدة لهذه المجموعة قادمة قريباً.</p>'}`),
  };
}

async function pageProduct(handle) {
  const rows = await sb(`ecom_products?select=${PRODUCT_SELECT}&handle=eq.${encodeURIComponent(handle)}&status=eq.active&limit=1`);
  const p = rows[0];
  if (!p) return null;
  const opts = productOptions(p);
  const name = productTitle(p);
  const path = `/products/${p.handle}`;
  const crumbs = [{ name: 'الرئيسية', path: '/' }, { name: 'المتجر', path: '/shop' }, { name, path }];
  const faq = [...productFaq(p, 'ar'), ...resolveFaq([FAQ_ITEMS[2], FAQ_ITEMS[3], FAQ_ITEMS[4], FAQ_ITEMS[5], FAQ_ITEMS[6]], 'ar')];
  const related = p.product_type
    ? (await sb(`ecom_products?select=${PRODUCT_SELECT}&status=eq.active&product_type=eq.${encodeURIComponent(p.product_type)}&id=neq.${p.id}&limit=8`))
    : [];
  const imgs = (Array.isArray(p.images) ? p.images : []).slice(0, 6).map(abs);
  const enDesc = p.description && p.description !== p.description_ar ? p.description : '';
  const from = lowestPrice(p);
  const table = opts.length
    ? `<table><caption>المقاسات والأسعار</caption><thead><tr><th>المقاس</th><th>السعر</th></tr></thead><tbody>${opts.map((o) => `<tr><td>${esc(formatSize(o.size, 'ar'))}</td><td>${esc(formatMADText(o.price, 'ar'))}</td></tr>`).join('')}</tbody></table>`
    : '';
  return {
    title: from ? `${name} | لوحة جدارية من ${Math.round(from / 100)} درهم` : name,
    description: productMetaDescription(p, 'ar'),
    path,
    image: imgs[0],
    ogType: 'product',
    ld: [productSchema(p), breadcrumbSchema(crumbs), faqSchema(faq)],
    body: shell(
      `${crumbHtml(crumbs)}<article><h1>${esc(name)}</h1>${p.product_type ? `<p>${esc(p.product_type)}</p>` : ''}` +
        imgs.map((u, i) => `<img src="${esc(u)}" alt="${esc(name)}${i ? ` ${i + 1}` : ''} — لوحة جدارية من بيتسيكي" ${i ? 'loading="lazy"' : ''}>`).join('') +
        (from ? `<p>السعر ابتداءً من ${esc(formatMADText(from, 'ar'))} — توصيل مجاني لكل مدن المغرب</p>` : '') +
        `<p>${esc(productDescription(p, 'ar'))}</p>${enDesc ? `<p lang="en">${esc(enDesc)}</p>` : ''}${table}` +
        `<ul><li>الدفع: 50% مقدماً و50% عند الاستلام</li><li>توصيل مجاني خلال ${SITE.deliveryDays} أيام عمل</li><li>استبدال خلال ${SITE.returnDays} أيام</li></ul>` +
        `<p><a href="/custom">تريد تصميماً مخصصاً؟</a> · <a href="${SITE.whatsapp}">واتساب ${SITE.phoneDisplay}</a></p></article>` +
        faqHtml(faq, `أسئلة حول لوحة ${name}`) +
        (related.length ? `<section><h2>لوحات مشابهة</h2>${productList(related)}</section>` : ''),
    ),
  };
}

const staticPage = (path, title, description, h1, paragraphs, extraLd = []) => async () => {
  const crumbs = [{ name: 'الرئيسية', path: '/' }, { name: h1, path }];
  return {
    title, description, path,
    ld: [breadcrumbSchema(crumbs), ...extraLd],
    body: shell(`${crumbHtml(crumbs)}<h1>${esc(h1)}</h1>${paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')}${factsHtml()}`),
  };
};

const STATIC = {
  about: staticPage('/about', 'من نحن | بيتسيكي', 'تعرّف على بيتسيكي: معرض مغربي للوحات الجدارية الفاخرة، بمقاسات متعددة وتوصيل مجاني لكل مدن المغرب.', 'من نحن', [BRAND_DESCRIPTION.ar, BRAND_DESCRIPTION.en]),
  contact: staticPage('/contact', 'اتصل بنا | بيتسيكي', `تواصل مع بيتسيكي عبر واتساب ${SITE.phoneDisplay} أو البريد ${SITE.email}. ${SITE.city}، المغرب.`, 'اتصل بنا', [`واتساب: ${SITE.phoneDisplay}`, `البريد الإلكتروني: ${SITE.email}`, `المدينة: ${SITE.city}، المغرب`], [organizationSchema()]),
  custom: staticPage('/custom', 'تصميم لوحة مخصصة | بيتسيكي', 'اطلب لوحة جدارية بتصميم خاص بك من بيتسيكي: أرسل فكرتك وسنحوّلها إلى لوحة فنية فاخرة بتوصيل لكل مدن المغرب.', 'تصميم لوحة مخصصة', ['أرسل فكرتك أو صورتك المرجعية عبر نموذج الطلب، وسنتواصل معك لتأكيد التصميم والمقاس والسعر قبل التنفيذ.', `يمكنك أيضاً مراسلتنا مباشرة على واتساب ${SITE.phoneDisplay}.`]),
};

// ------------------------------------------------------------------ render
function render(template, page, statusCode) {
  const canonical = `${SITE.url}${page.path === '/' ? '' : page.path}`;
  const image = page.image || SITE.ogImage;
  const noindex = statusCode === 404;
  const fullTitle = page.title.includes('PITSIKY') || page.title.includes('بيتسيكي') ? page.title : `${page.title} | بيتسيكي`;
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">',
    `<meta property="og:title" content="${esc(fullTitle)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:type" content="${page.ogType || 'website'}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:site_name" content="PITSIKY">`,
    `<meta property="og:locale" content="ar_MA">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(fullTitle)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    ...(page.ld || []).map(ldTag),
  ].join('\n    ');

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/gi, '');
  html = html.replace('</head>', () => `    ${head}\n  </head>`);
  html = html.replace(/<div id="root">\s*<\/div>/, () => `<div id="root">${page.body}</div>`);
  return html;
}

const minimalShell = (body) =>
  `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بيتسيكي | PITSIKY</title></head><body><div id="root">${body}</div></body></html>`;

export default async function handler(req, res) {
  const base = baseFromReq(req);
  const type = String(req.query?.type || 'home');
  const handle = String(req.query?.handle || '').trim();

  let template = null;
  try {
    template = await getTemplate(base);
  } catch (e) {
    console.error('seo: template fetch failed', e?.message);
  }

  try {
    let page = null;
    if (type === 'home') page = await pageHome();
    else if (type === 'shop') page = await pageShop();
    else if (type === 'collections') page = await pageCollections();
    else if (type === 'collection' && handle) page = await pageCollection(handle);
    else if (type === 'product' && handle) page = await pageProduct(handle);
    else if (STATIC[type]) page = await STATIC[type]();

    const notFound = !page && (type === 'product' || type === 'collection');
    if (notFound) {
      page = { title: 'الصفحة غير موجودة', description: 'هذه الصفحة غير موجودة. تصفّح لوحات بيتسيكي الجدارية.', path: `/${type === 'product' ? 'products' : 'collections'}/${handle}`, ld: [], body: shell('<h1>الصفحة غير موجودة</h1><p><a href="/shop">تصفّح كل اللوحات الجدارية</a></p>') };
    }
    if (!page) throw new Error(`no page for type=${type}`);

    const html = template ? render(template, page, notFound ? 404 : 200) : minimalShell(page.body);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Vary', 'User-Agent');
    res.status(notFound ? 404 : 200).send(html);
  } catch (e) {
    // Never fail a crawler: serve the plain SPA shell instead.
    console.error('seo: render failed, serving fallback', e?.message);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).send(template || minimalShell(shell('<h1>بيتسيكي — لوحات جدارية فاخرة</h1>')));
  }
}
