import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';

interface Cat {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  banner_image: string | null;
  cover_image: string | null;
  icon?: string | null;
  parent_id: string | null;
}


// Normalise a string for loose matching ("Islamic Wall Art" ~ "islamic art")
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(wall|art|posters?|prints?|collection|the|painting|canvas)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (s: string) => norm(s).split(' ').filter(Boolean);

// Build the full searchable text for a product (name, tags, type, vendor, metadata).
const productHaystack = (product: any) => {
  const parts: string[] = [
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
const explicitCatIds = (product: any): string[] => {
  const c = product?.metadata?.categories;
  return Array.isArray(c) ? c.filter((x: any) => typeof x === 'string') : [];
};
const explicitMatch = (product: any, catId: string) =>
  !!catId && explicitCatIds(product).includes(catId);

// Does a product belong to a given category (explicit assignment OR loose text match)?
const matchesCat = (product: any, cat: { id?: string; title: string; slug: string; title_ar?: string | null }) => {
  // 1. Explicit owner assignment always wins.
  if (cat.id && explicitMatch(product, cat.id)) return true;

  const rawTitle = (cat.title || '').toLowerCase().trim();
  const ct = norm(cat.title);
  const cs = (cat.slug || '').toLowerCase();
  const csWords = cs.replace(/-/g, ' ').trim();
  const hay = productHaystack(product);
  const pTags: string[] = (product.tags || []).map((t: string) => t.toLowerCase());
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



const CollectionPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const [category, setCategory] = useState<Cat | null>(null);
  const [parent, setParent] = useState<Cat | null>(null);
  const [subcats, setSubcats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const run = async () => {
      if (!handle) return;
      setLoading(true);
      setActiveSub(null);

      // "all" (and "inspiration") shows the entire active gallery
      if (handle === 'all' || handle === 'inspiration') {
        setIsLegacy(true);
        setSubcats([]); setParent(null);
        setCategory({ id: 'all', title: 'All Artwork', title_ar: 'كل اللوحات', slug: handle, description: null, description_ar: null, banner_image: null, cover_image: null, parent_id: null });
        const { data: prods } = await supabase.from('ecom_products').select('*, variants:ecom_product_variants(*)').eq('status', 'active').order('created_at', { ascending: false });
        setProducts(prods || []);
        setLoading(false);
        return;
      }

      // 1. Try the dynamic PITSIKY category system first.
      // Use limit(1) (not maybeSingle) so a rare duplicate slug can never crash the page.
      const { data: catRows } = await supabase
        .from('pts_categories')
        .select('*')
        .eq('slug', handle)
        .order('position')
        .limit(1);
      const cat = catRows && catRows.length ? catRows[0] : null;

      if (cat) {
        setIsLegacy(false);
        setCategory(cat);


        // parent (for breadcrumb) if this is a subcategory
        let parentCat: Cat | null = null;
        if (cat.parent_id) {
          const { data: p } = await supabase.from('pts_categories').select('*').eq('id', cat.parent_id).maybeSingle();
          parentCat = p || null;
        }
        setParent(parentCat);

        // children (subcategory chips)
        const { data: kids } = await supabase
          .from('pts_categories')
          .select('*')
          .eq('parent_id', cat.id)
          .eq('is_visible', true)
          .order('position');
        setSubcats(kids || []);

        // fetch all active products and filter client-side
        const { data: prods } = await supabase
          .from('ecom_products')
          .select('*, variants:ecom_product_variants(*)')
          .eq('status', 'active');
        setProducts(prods || []);
        setLoading(false);
        return;
      }

      // 2. Fallback: legacy ecom_collections handling
      const { data: col } = await supabase.from('ecom_collections').select('*').eq('handle', handle).maybeSingle();
      if (col) {
        setIsLegacy(true);
        setSubcats([]);
        setParent(null);
        setCategory({ id: col.id, title: col.title, title_ar: null, slug: col.handle, description: col.description, description_ar: null, banner_image: col.image_url, cover_image: col.image_url, parent_id: null });

        const { data: links } = await supabase.from('ecom_product_collections').select('product_id, position').eq('collection_id', col.id).order('position');
        const ids = (links || []).map((l) => l.product_id);
        if (ids.length) {
          const { data: prods } = await supabase.from('ecom_products').select('*, variants:ecom_product_variants(*)').in('id', ids).eq('status', 'active');
          setProducts(ids.map((id) => prods?.find((p) => p.id === id)).filter(Boolean));
        }
      }
      setLoading(false);
    };
    run();
  }, [handle]);

  const visible = useMemo(() => {
    if (!category) return products;
    // Legacy ecom_collections products are already filtered server-side
    if (isLegacy) return products;
    // If a subcategory chip is active, filter by it
    if (activeSub) {
      const sub = subcats.find((s) => s.id === activeSub);
      if (sub) return products.filter((p) => matchesCat(p, sub));
    }
    // Filter by this category, plus any of its subcategories
    const byCat = products.filter((p) => matchesCat(p, category));
    const bySubs = products.filter((p) => subcats.some((s) => matchesCat(p, s)));
    const merged = [...new Map([...byCat, ...bySubs].map((p) => [p.id, p])).values()];
    return merged;
  }, [products, category, subcats, activeSub, isLegacy]);


  return (
    <Shell>
      {/* Banner — falls back to cover image / brand logo when no dedicated banner */}
      {(category?.banner_image || category?.cover_image) ? (
        <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden">
          <img src={(category.banner_image || category.cover_image)!} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center pb-12 px-6">
            {category.icon && <img src={category.icon} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/70 bg-black mb-4 shadow-lg" />}
            <p className="text-xs tracking-[0.3em] uppercase text-[#cdbcff] mb-3">PITSIKY Collection</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white">{category.title}</h1>
            {category.title_ar && <p className="font-serif text-2xl text-white/80 mt-1" dir="rtl">{category.title_ar}</p>}
          </div>
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 pb-6 text-center">
          {category?.icon && <img src={category.icon} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[#C9A23F] bg-black mx-auto mb-5 shadow-md" />}
          <p className="text-xs tracking-[0.3em] uppercase text-[#6E44FF] mb-3">PITSIKY Collection</p>
          <h1 className="font-serif text-4xl md:text-6xl text-[#1D1D1D]">{category?.title || 'Collection'}</h1>
          {category?.title_ar && <p className="font-serif text-2xl text-[#8D8D8D] mt-2" dir="rtl">{category.title_ar}</p>}
        </div>
      )}


      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#8D8D8D] pt-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-[#6E44FF]">Home</Link>
          <span>/</span>
          {parent && (
            <>
              <Link to={`/collections/${parent.slug}`} className="hover:text-[#6E44FF]">{parent.title}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#1D1D1D]">{category?.title}</span>
        </nav>

        {/* Description */}
        {(category?.description || category?.description_ar) && (
          <div className="pt-6 pb-2 max-w-2xl">
            {category?.description && <p className="text-[#6b6b6b] leading-relaxed">{category.description}</p>}
            {category?.description_ar && <p className="text-[#8D8D8D] leading-relaxed mt-2" dir="rtl">{category.description_ar}</p>}
          </div>
        )}

        {/* Subcategory chips */}
        {subcats.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-6 pb-2">
            <button
              onClick={() => setActiveSub(null)}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${!activeSub ? 'bg-[#6E44FF] text-white border border-[#6E44FF]' : 'border border-[#E0D8CF] text-[#555] hover:border-[#6E44FF] hover:text-[#6E44FF]'}`}
            >
              All
            </button>
            {subcats.map((s) => {
              const chipImg = s.icon || s.cover_image;
              const active = activeSub === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSub(s.id)}
                  className={`pl-1.5 pr-5 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2 ${active ? 'bg-[#6E44FF] text-white border border-[#6E44FF]' : 'border border-[#E0D8CF] text-[#555] hover:border-[#6E44FF] hover:text-[#6E44FF]'}`}
                >
                  {chipImg
                    ? <img src={chipImg} alt="" className="w-7 h-7 rounded-full object-cover bg-black border border-white/40" />
                    : <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${active ? 'bg-white/20' : 'bg-[#F2ECE6] text-[#999]'}`}>{(s.title || '?').slice(0, 1)}</span>}
                  {s.title}
                </button>
              );
            })}

          </div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 pb-24">
        {loading ? (
          <p className="text-center text-[#8D8D8D] py-20">Curating…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8D8D8D] mb-4">New pieces for this collection are arriving soon.</p>
            <Link to="/" className="text-[#6E44FF] text-sm tracking-[0.15em] uppercase">Explore the gallery</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#8D8D8D] mb-8">{visible.length} {visible.length === 1 ? 'piece' : 'pieces'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {visible.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
};

export default CollectionPage;
