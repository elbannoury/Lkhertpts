// Shared by the React CollectionPage AND the bot pre-render function (api/seo.js)
// so a collection lists exactly the same products for humans and for crawlers.
// (Logic moved verbatim from CollectionPage.tsx — plain JS so Node can import it.)

// Normalise a string for loose matching ("Islamic Wall Art" ~ "islamic art")
export const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(wall|art|posters?|prints?|collection|the|painting|canvas)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const tokens = (s) => norm(s).split(' ').filter(Boolean);

// Build the full searchable text for a product (name, tags, type, vendor, metadata).
export const productHaystack = (product) => {
  const parts = [
    product.name || '',
    product.product_type || '',
    product.vendor || '',
    ...(product.tags || []),
  ];
  const meta = product.metadata || {};
  Object.values(meta).forEach((v) => { if (typeof v === 'string') parts.push(v); });
  return parts.join(' ').toLowerCase();
};

// Explicit assignment: the owner ticked this category for the product in the
// admin (stored as an array of category ids in product.metadata.categories).
export const explicitCatIds = (product) => {
  const c = product?.metadata?.categories;
  return Array.isArray(c) ? c.filter((x) => typeof x === 'string') : [];
};
export const explicitMatch = (product, catId) =>
  !!catId && explicitCatIds(product).includes(catId);

// Does a product belong to a given category (explicit assignment OR loose text match)?
export const matchesCat = (product, cat) => {
  // 1. Explicit owner assignment always wins.
  if (cat.id && explicitMatch(product, cat.id)) return true;

  const rawTitle = (cat.title || '').toLowerCase().trim();
  const ct = norm(cat.title);
  const cs = (cat.slug || '').toLowerCase();
  const csWords = cs.replace(/-/g, ' ').trim();
  const hay = productHaystack(product);
  const pTags = (product.tags || []).map((t) => t.toLowerCase());
  const pType = norm(product.product_type || '');

  if (!rawTitle && !cs) return false;

  // 2. Direct title / slug substring in the full product text (best for brands like "Ferrari")
  if (rawTitle && rawTitle.length >= 2 && hay.includes(rawTitle)) return true;
  if (csWords && csWords.length >= 2 && hay.includes(csWords)) return true;
  if (cat.title_ar && hay.includes(String(cat.title_ar).toLowerCase())) return true;

  // 3. product_type loose match
  if (ct && pType && (pType === ct || pType.includes(ct) || ct.includes(pType))) return true;

  // 4. tags equal the slug / normalised title
  if (pTags.includes(cs) || pTags.includes(ct.replace(/\s+/g, '-'))) return true;
  if (pTags.some((t) => norm(t) === ct)) return true;

  // 5. every meaningful category token appears somewhere in the product text
  const catToks = tokens(cat.title).length ? tokens(cat.title) : csWords.split(' ').filter(Boolean);
  if (catToks.length && catToks.every((tk) => tk.length >= 2 && hay.includes(tk))) return true;

  return false;
};
