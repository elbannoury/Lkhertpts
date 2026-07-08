import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import LazyImage from '@/components/LazyImage';
import { useI18n } from '@/contexts/I18nContext';
import { formatMAD } from '@/data/catalog';

interface Cat {
  id: string;
  title: string;
  title_ar?: string | null;
  slug: string;
  cover_image?: string | null;
  banner_image?: string | null;
  icon?: string | null;
  archived?: boolean;
}

type Size = 'big' | 'wide' | 'tall' | 'normal';

type Tile =
  | { kind: 'category'; key: string; cat: Cat; size: Size; rotate: number; lift: number }
  | { kind: 'product'; key: string; product: any; size: Size; rotate: number; lift: number };

const SIZE_SPAN: Record<Size, string> = {
  big: 'col-span-2 row-span-2',
  wide: 'col-span-2 row-span-1',
  tall: 'col-span-1 row-span-2',
  normal: 'col-span-1 row-span-1',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSize(weights: Partial<Record<Size, number>>): Size {
  const entries = Object.entries(weights) as [Size, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'normal';
}

// Warm, hand-hung gallery-wall palette pulled from a small deck of "mat board" tints —
// used for the small share of frames that hold no photo (typographic pieces).
const MAT_TONES = ['#F2ECE6', '#EFE6D8', '#E9E2F5', '#FBEAE0', '#E4EEE8'];

const GalleryTile: React.FC<{ tile: Tile }> = ({ tile }) => {
  const span = SIZE_SPAN[tile.size];
  const style: React.CSSProperties = { transform: `rotate(${tile.rotate}deg) translateY(${tile.lift}px)` };
  const frameClasses = `group relative ${span} rounded-2xl bg-white p-2 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.28)] ring-1 ring-black/5 hover:z-10 hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.38)] hover:!rotate-0 hover:!translate-y-0 transition-all duration-500`;

  const pin = (
    <span
      aria-hidden
      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#1D1D1D]/60 shadow-sm z-10"
    />
  );

  if (tile.kind === 'category') {
    const c = tile.cat;
    const img = c.cover_image || c.banner_image || c.icon;
    const tone = MAT_TONES[Math.abs(c.slug.charCodeAt(0) + c.slug.length) % MAT_TONES.length];
    return (
      <Link to={`/collections/${c.slug}`} style={style} className={frameClasses}>
        {pin}
        <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ backgroundColor: tone }}>
          {img ? (
            <>
              <LazyImage
                src={img}
                alt={c.title}
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="block text-[9px] tracking-[0.25em] uppercase text-[#FFD27A]/90 mb-1">Collection</span>
                <span className="block font-serif text-white text-lg md:text-2xl leading-tight">{c.title}</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
              <span className="text-[9px] tracking-[0.25em] uppercase text-[#8D8D8D] mb-2">Collection</span>
              <span className="font-serif text-xl md:text-2xl text-[#1D1D1D]">{c.title}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  const p = tile.product;
  const variants = p.variants || [];
  const minPrice = variants.length ? Math.min(...variants.map((v: any) => v.price)) : p.price;
  const img = p.images?.[0];
  return (
    <Link to={`/products/${p.handle}`} style={style} className={frameClasses}>
      {pin}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#F2ECE6]">
        {img ? (
          <LazyImage
            src={img}
            alt={p.name}
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <span className="font-serif text-lg text-[#1D1D1D] text-center">{p.name}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/75 via-black/10 to-transparent">
          <span className="block text-white text-sm font-medium leading-tight line-clamp-1">{p.name}</span>
          <span className="block text-[#FFD27A] text-xs mt-0.5">{formatMAD(minPrice)}</span>
        </div>
      </div>
    </Link>
  );
};

const MAX_RANDOM_PRODUCTS = 14;

const CollectionsPage: React.FC = () => {
  const { lang } = useI18n();
  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data: catRows } = await supabase
        .from('pts_categories')
        .select('id,title,title_ar,slug,cover_image,banner_image,icon,parent_id,archived')
        .eq('is_visible', true)
        .is('parent_id', null)
        .order('position');
      setCats(((catRows as any[]) || []).filter((c) => c?.archived !== true) as Cat[]);

      const { data: prodRows } = await supabase
        .from('ecom_products')
        .select('id,name,handle,images,price,variants:ecom_product_variants(price)')
        .eq('status', 'active');
      setProducts(prodRows || []);
      setLoading(false);
    };
    run();
  }, []);

  const tiles: Tile[] = useMemo(() => {
    if (!cats.length && !products.length) return [];

    const randomProducts = shuffle(products).slice(0, Math.min(MAX_RANDOM_PRODUCTS, products.length));

    const catTiles: Tile[] = cats.map((c) => ({
      kind: 'category',
      key: `c-${c.id}`,
      cat: c,
      size: pickSize({ big: 3, wide: 2, tall: 1 }),
      rotate: Math.random() * 5 - 2.5,
      lift: Math.random() * 14 - 7,
    }));

    const prodTiles: Tile[] = randomProducts.map((p) => ({
      kind: 'product',
      key: `p-${p.id}`,
      product: p,
      size: pickSize({ normal: 4, tall: 2, wide: 1 }),
      rotate: Math.random() * 6 - 3,
      lift: Math.random() * 14 - 7,
    }));

    return shuffle([...catTiles, ...prodTiles]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, products, seed]);

  return (
    <Shell>
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 pt-16 pb-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#6E44FF] mb-3">PITSIKY Gallery Wall</p>
        <h1 className="font-serif text-4xl md:text-6xl text-[#1D1D1D] dark:text-[#F4F1E9]">
          {lang === 'ar' ? 'كل المجموعات' : 'Every Collection'}
        </h1>
        <p className="text-[#8D8D8D] mt-4 max-w-xl mx-auto">
          {lang === 'ar'
            ? 'كأنك تتجول فمعرض حقيقي — كل مجموعة ولوحة معلّقة بطريقتها الخاصة.'
            : 'Wander it like a real gallery — every collection and print hung its own way, at its own angle.'}
        </p>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="mt-6 inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase border border-[#ddd] hover:border-[#6E44FF] hover:text-[#6E44FF] rounded-full px-5 py-2.5 transition-colors"
        >
          <Shuffle size={14} /> {lang === 'ar' ? 'أعد ترتيب الجدار' : 'Rehang the wall'}
        </button>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 pb-28 pt-10">
        {loading ? (
          <p className="text-center text-[#8D8D8D] py-20">{lang === 'ar' ? 'نجهّز المعرض…' : 'Hanging the pieces…'}</p>
        ) : tiles.length === 0 ? (
          <p className="text-center text-[#8D8D8D] py-20">{lang === 'ar' ? 'المعرض فارغ حالياً.' : 'The wall is empty for now.'}</p>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-5 md:gap-x-7 md:gap-y-7"
            style={{ gridAutoFlow: 'dense', gridAutoRows: '150px' }}
          >
            {tiles.map((tile) => (
              <GalleryTile key={tile.key} tile={tile} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
};

export default CollectionsPage;
