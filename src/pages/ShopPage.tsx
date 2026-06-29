import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import { useI18n } from '@/contexts/I18nContext';

const ShopPage: React.FC = () => {
  const { lang } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('new');

  useEffect(() => {
    supabase
      .from('ecom_products')
      .select('*, variants:ecom_product_variants(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.product_type).filter(Boolean))) as string[],
    [products]
  );

  // Smart, deep, tokenised search across every meaningful product field.
  const buildHaystack = (p: any) => {
    const parts: (string | undefined)[] = [
      p.name, p.name_ar, p.description, p.description_ar,
      p.product_type, p.vendor, p.sku, p.handle,
      ...(p.tags || []),
      (p.variants || []).map((v: any) => `${v.title || ''} ${v.sku || ''} ${v.option1 || ''} ${v.option2 || ''}`).join(' '),
    ];
    const meta = p.metadata || {};
    Object.values(meta).forEach((v) => { if (typeof v === 'string' || typeof v === 'number') parts.push(String(v)); });
    return parts.filter(Boolean).join(' ').toLowerCase();
  };

  const visible = useMemo(() => {
    // Each whitespace-separated term must appear somewhere (AND search) — typo-tolerant via substring.
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = products.filter((p) => {
      const matchesType = type === 'all' || p.product_type === type;
      if (!matchesType) return false;
      if (!terms.length) return true;
      const hay = buildHaystack(p);
      return terms.every((term) => hay.includes(term));
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'price-desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [products, q, type, sort]);


  return (
    <Shell>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-14 pb-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">PITSIKY · {lang === 'en' ? 'Full Gallery' : 'المعرض الكامل'}</p>
        <h1 className="font-serif text-4xl md:text-6xl text-[#1D1D1D] dark:text-[#F4F1E9]">{lang === 'en' ? 'Shop All' : 'كل المنتجات'}</h1>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between py-6 border-b border-[#eee] dark:border-[#1c1c1c]">
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b9b9b]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === 'en' ? 'Search artwork…' : 'ابحث عن لوحة…'}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#e0d8cf] dark:border-[#222] bg-white dark:bg-[#121212] text-[#141414] dark:text-[#F4F1E9] outline-none focus:border-[#FF6A00] text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setType('all')} className={`px-4 py-2 rounded-full text-xs uppercase tracking-wide border transition-colors ${type === 'all' ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#e0d8cf] dark:border-[#222] text-[#555] dark:text-[#bbb] hover:border-[#FF6A00]'}`}>{lang === 'en' ? 'All' : 'الكل'}</button>
            {types.slice(0, 6).map((tp) => (
              <button key={tp} onClick={() => setType(tp)} className={`px-4 py-2 rounded-full text-xs uppercase tracking-wide border transition-colors ${type === tp ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#e0d8cf] dark:border-[#222] text-[#555] dark:text-[#bbb] hover:border-[#FF6A00]'}`}>{tp}</button>
            ))}
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-full text-xs border border-[#e0d8cf] dark:border-[#222] bg-white dark:bg-[#121212] text-[#141414] dark:text-[#F4F1E9] outline-none focus:border-[#FF6A00]">
              <option value="new">{lang === 'en' ? 'Newest' : 'الأحدث'}</option>
              <option value="price-asc">{lang === 'en' ? 'Price ↑' : 'السعر ↑'}</option>
              <option value="price-desc">{lang === 'en' ? 'Price ↓' : 'السعر ↓'}</option>
              <option value="name">{lang === 'en' ? 'Name A–Z' : 'الاسم'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 pb-24">
        {loading ? (
          <div className="flex justify-center py-24"><div className="pk-spinner" /></div>
        ) : visible.length === 0 ? (
          <p className="text-center text-[#8D8D8D] py-20">{lang === 'en' ? 'No artwork matches your search.' : 'لا توجد نتائج.'}</p>
        ) : (
          <>
            <p className="text-sm text-[#8D8D8D] mb-8">{visible.length} {lang === 'en' ? (visible.length === 1 ? 'piece' : 'pieces') : 'قطعة'}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {visible.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
};

export default ShopPage;
