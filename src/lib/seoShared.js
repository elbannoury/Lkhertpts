// ============================================================================
// PITSIKY — single source of truth for SEO / GEO / AEO
// ----------------------------------------------------------------------------
// Plain ESM JavaScript on purpose: it is imported by BOTH
//   • the React app (src/components/SEO.tsx, pages, FAQSection, …)
//   • the Vercel bot pre-render function (api/seo.js) and the build scripts
// so crawlers, AI engines and humans always get the SAME facts, FAQ answers
// and structured data. Prices coming from the database are in CENTS (24900 = 249 MAD).
// ============================================================================

export const SITE = {
  name: 'PITSIKY',
  nameAr: 'بيتسيكي',
  legalName: 'PITSIKY Art Gallery',
  url: 'https://www.pitsiky.com',
  email: 'hello@pitsiky.com',
  phone: '+212702382376',
  phoneDisplay: '+212 702 382 376',
  whatsapp: 'https://wa.me/212702382376',
  city: 'Casablanca',
  country: 'MA',
  currency: 'MAD',
  startingPriceMAD: 249,
  startingSize: '30x40',
  deliveryDays: '3-5',
  returnDays: 7,
  logo: 'https://srzxzpwispudxldqjjah.supabase.co/storage/v1/object/public/pts-media/logo/1783556121967-ebph2m.png',
  ogImage: 'https://www.pitsiky.com/og.jpg',
  supabaseUrl: 'https://srzxzpwispudxldqjjah.supabase.co',
  // Public anon key — the same one already shipped in the browser bundle (RLS protects the data).
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyenh6cHdpc3B1ZHhsZHFqamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTM4MDcsImV4cCI6MjA5ODkyOTgwN30.AAa9rSrdcxdgNCkU-Ab9BKqcahbL49KCMIgvl8B3a0s',
};

export const BRAND_DESCRIPTION = {
  ar: 'بيتسيكي متجر مغربي للوحات الجدارية الفاخرة والديكور الحائطي: لوحات فنية مطبوعة بجودة عالية بمقاسات متعددة تبدأ من 249 درهم، مع توصيل مجاني لكل مدن المغرب وإمكانية طلب تصميم مخصص.',
  en: 'PITSIKY is a Moroccan online store for premium wall art and wall decor: high-quality art prints in multiple sizes starting from 249 MAD, free delivery to every city in Morocco, and custom poster design on request.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const abs = (url) => (url && /^https?:\/\//.test(url) ? url : url ? `${SITE.url}${url.startsWith('/') ? '' : '/'}${url}` : undefined);

export const formatSize = (s, lang = 'ar') => {
  if (!s) return '';
  const cleaned = String(s).replace(/\s*(cm|سم)\s*$/i, '').replace(/[xX*]/g, '×');
  return `${cleaned} ${lang === 'ar' ? 'سم' : 'cm'}`;
};

export const formatMADText = (cents, lang = 'ar') => {
  const v = Math.round(Number(cents || 0) / 100);
  return lang === 'ar' ? `${v} درهم` : `${v} MAD`;
};

const inStockQty = (q) => q == null || Number(q) > 0;

/** Sorted, purchasable (price > 0) size options of a product row (with `variants`). */
export const productOptions = (product) => {
  const variants = Array.isArray(product?.variants) ? [...product.variants] : [];
  variants.sort((a, b) => (a.position || 0) - (b.position || 0));
  const opts = variants
    .filter((v) => Number(v.price) > 0)
    .map((v) => ({ size: v.option1 || v.title || '', price: Number(v.price), inStock: inStockQty(v.inventory_qty) }));
  if (opts.length) return opts;
  if (Number(product?.price) > 0) {
    const size = product?.metadata?.sizes?.[0] || '';
    return [{ size, price: Number(product.price), inStock: true }];
  }
  return [];
};

export const lowestPrice = (product) => {
  const opts = productOptions(product);
  return opts.length ? Math.min(...opts.map((o) => o.price)) : 0;
};

export const productTitle = (product) => String(product?.name || '').trim();

export const productDescription = (product, lang = 'ar') => {
  const d = lang === 'ar' ? product?.description_ar || product?.description : product?.description || product?.description_ar;
  if (d && String(d).trim()) return String(d).trim();
  const from = lowestPrice(product);
  return lang === 'ar'
    ? `${productTitle(product)} — لوحة جدارية فاخرة من بيتسيكي${from ? `، تبدأ من ${formatMADText(from, 'ar')}` : ''}، توصيل مجاني لكل مدن المغرب.`
    : `${productTitle(product)} — premium wall art by PITSIKY${from ? `, from ${formatMADText(from, 'en')}` : ''}, free delivery across Morocco.`;
};

/** ≤ 160 chars meta description for a product page. */
export const productMetaDescription = (product, lang = 'ar') => {
  const opts = productOptions(product);
  const from = lowestPrice(product);
  const name = productTitle(product);
  const sizes = opts.map((o) => formatSize(o.size, lang)).filter(Boolean).slice(0, 4).join(lang === 'ar' ? '، ' : ', ');
  const real = lang === 'ar' ? product?.description_ar || product?.description : product?.description || product?.description_ar;
  let base = real && String(real).trim()
    ? String(real).replace(/\s+/g, ' ').trim()
    : lang === 'ar' ? `${name} — لوحة جدارية فاخرة من بيتسيكي.` : `${name} — premium wall art by PITSIKY.`;
  if (base.length > 85) base = `${base.slice(0, 82).trimEnd()}…`;
  const tail =
    lang === 'ar'
      ? ` ${from ? `ابتداءً من ${formatMADText(from, 'ar')}.` : ''}${sizes ? ` المقاسات: ${sizes}.` : ''} توصيل مجاني لكل المغرب.`
      : ` ${from ? `From ${formatMADText(from, 'en')}.` : ''}${sizes ? ` Sizes: ${sizes}.` : ''} Free delivery in Morocco.`;
  const full = `${base}${tail}`;
  return full.length > 158 ? `${full.slice(0, 155).trimEnd()}…` : full;
};

// ---------------------------------------------------------------------------
// FAQ — written as direct, self-contained answers (AEO / GEO friendly).
// Only facts the store confirmed: 249 MAD from 30x40, free delivery across
// Morocco, 50% deposit + 50% on delivery, custom orders, 7-day exchange.
// ---------------------------------------------------------------------------
export const FAQ_ITEMS = [
  {
    q: { ar: 'ما هي بيتسيكي؟', en: 'What is PITSIKY?' },
    a: {
      ar: 'بيتسيكي متجر مغربي متخصص في اللوحات الجدارية الفاخرة والديكور الحائطي. نبيع لوحات فنية مطبوعة بجودة عالية بمقاسات متعددة، مع توصيل لكل مدن المغرب، ونقبل طلبات التصميم المخصص.',
      en: 'PITSIKY is a Moroccan online store specialised in premium wall art and wall decor. We sell high-quality art prints in several sizes, deliver to every city in Morocco, and accept custom design requests.',
    },
  },
  {
    q: { ar: 'كم سعر اللوحات الجدارية في بيتسيكي؟', en: 'How much do PITSIKY wall art prints cost?' },
    a: {
      ar: 'تبدأ الأسعار من 249 درهم مغربي للوحة بمقاس 30×40 سم. المقاسات الأكبر (مثل 40×60 و50×70 و60×90 سم) بأسعار أعلى، ويظهر سعر كل مقاس بوضوح في صفحة اللوحة.',
      en: 'Prices start from 249 MAD for a 30×40 cm print. Larger sizes (such as 40×60, 50×70 and 60×90 cm) cost more, and the price of every size is shown on the product page.',
    },
  },
  {
    q: { ar: 'هل التوصيل مجاني ولكل مدن المغرب؟', en: 'Is delivery free and available in all Moroccan cities?' },
    a: {
      ar: 'نعم، التوصيل مجاني ومتاح لجميع مدن المغرب، وتصل الطلبية عادةً خلال 3 إلى 5 أيام عمل بعد تأكيد الطلب.',
      en: 'Yes. Delivery is free to every city in Morocco, and orders usually arrive within 3 to 5 business days after confirmation.',
    },
  },
  {
    q: { ar: 'كيف يتم الدفع؟', en: 'How does payment work?' },
    a: {
      ar: 'ندفع على مرحلتين: 50% مقدماً لتأكيد الطلب، و50% المتبقية عند الاستلام. بعد إرسال الطلب يتصل بك فريقنا هاتفياً لتأكيد التفاصيل.',
      en: 'Payment is split in two: 50% upfront to confirm your order and the remaining 50% on delivery. After you place the order, our team calls you to confirm the details.',
    },
  },
  {
    q: { ar: 'كيف أختار مقاس اللوحة المناسب؟', en: 'How do I choose the right print size?' },
    a: {
      ar: 'مقاس 30×40 سم مناسب للرفوف والممرات والجدران الصغيرة. مقاس 50×70 سم مناسب لغرف النوم وفوق الأريكة. المقاسات 60×90 سم وأكبر مناسبة للجدار الرئيسي في غرفة المعيشة. قاعدة عامة: اجعل عرض اللوحة نحو ثلثي إلى ثلاثة أرباع عرض قطعة الأثاث التي تحتها.',
      en: 'A 30×40 cm print suits shelves, hallways and small walls. 50×70 cm works well in bedrooms and above a sofa. 60×90 cm and larger suit the main wall of a living room. Rule of thumb: make the artwork about two-thirds to three-quarters of the width of the furniture beneath it.',
    },
  },
  {
    q: { ar: 'هل يمكنني طلب لوحة بتصميم خاص بي؟', en: 'Can I order a custom design?' },
    a: {
      ar: `نعم. أرسل فكرتك عبر صفحة التصميم المخصص في الموقع (pitsiky.com/custom) أو عبر واتساب على الرقم ${SITE.phoneDisplay}، وسنرد عليك بالتفاصيل والسعر قبل التنفيذ.`,
      en: `Yes. Send your idea through the custom design page (pitsiky.com/custom) or on WhatsApp at ${SITE.phoneDisplay}, and we will reply with the details and price before production.`,
    },
  },
  {
    q: { ar: 'ما هي سياسة الاستبدال والإرجاع؟', en: 'What is the exchange and return policy?' },
    a: {
      ar: 'يمكن طلب الاستبدال خلال 7 أيام من الاستلام بشرط أن تكون اللوحة غير مستخدمة وفي تغليفها الأصلي. وإذا وصلت اللوحة تالفة أو بعيب في الطباعة نستبدلها مجاناً، بشرط التواصل معنا بصورة للمشكلة خلال 48 ساعة من الاستلام.',
      en: 'You can request an exchange within 7 days of delivery if the print is unused and in its original packaging. If it arrives damaged or with a print defect we replace it free of charge — just contact us with a photo within 48 hours of delivery.',
    },
  },
  {
    q: { ar: 'كيف أتتبع طلبي؟', en: 'How can I track my order?' },
    a: {
      ar: 'بعد تأكيد الطلب تحصل على رقم طلب بصيغة PIT-يومشهرسنة-رقم. أدخله في صفحة تتبع الطلب (pitsiky.com/track) لمعرفة حالة طلبك.',
      en: 'After you order you receive an order number like PIT-DDMMYY-001. Enter it on the order tracking page (pitsiky.com/track) to see your order status.',
    },
  },
];

/** Resolve FAQ items to plain {q, a} strings for one language. */
export const resolveFaq = (items, lang = 'ar') => items.map((i) => ({ q: i.q[lang] || i.q.ar, a: i.a[lang] || i.a.ar }));

/** Product-specific Q&A (generated from the real sizes/prices). */
export const productFaq = (product, lang = 'ar') => {
  const opts = productOptions(product);
  if (!opts.length) return [];
  const name = productTitle(product);
  const from = lowestPrice(product);
  const list = opts
    .map((o) => `${formatSize(o.size, lang)}: ${formatMADText(o.price, lang)}`)
    .join(lang === 'ar' ? ' — ' : ' · ');
  if (lang === 'ar') {
    return [
      { q: `كم سعر لوحة ${name}؟`, a: `يبدأ سعر لوحة ${name} من ${formatMADText(from, 'ar')}. الأسعار حسب المقاس: ${list}. التوصيل مجاني لكل مدن المغرب.` },
      { q: `ما المقاسات المتوفرة للوحة ${name}؟`, a: `المقاسات المتوفرة: ${opts.map((o) => formatSize(o.size, 'ar')).join('، ')}.` },
    ];
  }
  return [
    { q: `How much does the ${name} print cost?`, a: `The ${name} print starts from ${formatMADText(from, 'en')}. Prices by size: ${list}. Delivery is free across Morocco.` },
    { q: `Which sizes are available for ${name}?`, a: `Available sizes: ${opts.map((o) => formatSize(o.size, 'en')).join(', ')}.` },
  ];
};

// ---------------------------------------------------------------------------
// JSON-LD builders (schema.org)
// ---------------------------------------------------------------------------
const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': ORG_ID,
  name: SITE.legalName,
  alternateName: [SITE.nameAr, SITE.name, 'Pitsiky'],
  url: SITE.url,
  logo: { '@type': 'ImageObject', url: SITE.logo },
  image: SITE.ogImage,
  description: BRAND_DESCRIPTION.ar,
  slogan: 'لوحات جدارية فاخرة تحوّل جدارك إلى فن',
  email: SITE.email,
  telephone: SITE.phone,
  priceRange: `${SITE.startingPriceMAD} MAD+`,
  currenciesAccepted: SITE.currency,
  address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: SITE.country },
  areaServed: { '@type': 'Country', name: 'Morocco' },
  knowsAbout: ['لوحات جدارية', 'ديكور حائطي', 'wall art', 'art prints', 'custom posters', 'home decor'],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: SITE.phone,
      email: SITE.email,
      areaServed: SITE.country,
      availableLanguage: ['ar', 'en'],
    },
  ],
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE.url,
  name: SITE.legalName,
  alternateName: SITE.nameAr,
  inLanguage: ['ar', 'en'],
  publisher: { '@id': ORG_ID },
});

/** items: [{ name, path }] — first item is usually Home. */
export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE.url}${it.path === '/' ? '' : it.path}`,
  })),
});

export const faqSchema = (qa) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: qa.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
});

const shippingDetails = () => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: SITE.currency },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: SITE.country },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' },
  },
});

const returnPolicy = () => ({
  '@type': 'MerchantReturnPolicy',
  applicableCountry: SITE.country,
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: SITE.returnDays,
  merchantReturnLink: `${SITE.url}/refund-policy`,
});

/** product = DB row with `variants`; rating = optional { value, count } from REAL reviews. */
export const productSchema = (product, { rating } = {}) => {
  const url = `${SITE.url}/products/${product.handle}`;
  const opts = productOptions(product);
  const validUntil = `${new Date().getFullYear() + 1}-12-31`;
  const images = (Array.isArray(product.images) ? product.images : []).map(abs).filter(Boolean);

  const offerFor = (o) => ({
    '@type': 'Offer',
    ...(o.size ? { name: formatSize(o.size, 'en') } : {}),
    url,
    price: (o.price / 100).toFixed(2),
    priceCurrency: SITE.currency,
    priceValidUntil: validUntil,
    itemCondition: 'https://schema.org/NewCondition',
    availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    shippingDetails: shippingDetails(),
    hasMerchantReturnPolicy: returnPolicy(),
    seller: { '@id': ORG_ID },
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: productTitle(product),
    description: productDescription(product, 'ar'),
    sku: product.sku || product.handle,
    url,
    brand: { '@type': 'Brand', name: SITE.name },
    category: product.product_type || 'Wall Art',
    ...(images.length ? { image: images } : {}),
  };

  if (opts.length === 1) {
    schema.offers = offerFor(opts[0]);
  } else if (opts.length > 1) {
    const prices = opts.map((o) => o.price);
    schema.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: SITE.currency,
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: opts.length,
      offers: opts.map(offerFor),
    };
  }

  if (rating && rating.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(rating.value).toFixed(1),
      reviewCount: rating.count,
    };
  }
  return schema;
};

/** products: DB rows. Produces CollectionPage + ItemList (max 60 items). */
export const collectionSchema = ({ name, description, path, products }) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE.url}${path}#collection`,
  url: `${SITE.url}${path}`,
  name,
  ...(description ? { description } : {}),
  isPartOf: { '@id': WEBSITE_ID },
  inLanguage: 'ar',
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 60).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/products/${p.handle}`,
      name: productTitle(p),
      ...(Array.isArray(p.images) && p.images[0] ? { image: abs(p.images[0]) } : {}),
    })),
  },
});
