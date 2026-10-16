import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Truck, Wallet, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import SEO from '@/components/SEO';
import Breadcrumbs from '@/components/Breadcrumbs';
import FAQSection from '@/components/FAQSection';
import PaymentMethods from '@/components/PaymentMethods';
import ProductDetails from '@/components/ProductDetails';
import ProductReviews from '@/components/ProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatMAD } from '@/data/catalog';
import { buildProductJsonLd } from '@/lib/jsonld';
import { FAQ_ITEMS, resolveFaq, productFaq, productDescription, productMetaDescription, formatSize, lowestPrice } from '@/lib/seoShared';

// صورة احتياطية تُعرض إذا لم يتوفر للمنتج أي صورة في قاعدة البيانات
// Fallback image shown when a product has no images in the database
const FALLBACK_IMAGE =
  'https://srzxzpwispudxldqjjah.supabase.co/storage/v1/object/public/pts-media/logo/1783556121967-ebph2m.png';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const ProductPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { addToCart } = useCart();
  const { lang } = useI18n();
  const en = lang === 'en';

  const [product, setProduct] = useState<any>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [related, setRelated] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [ratingStats, setRatingStats] = useState<{ value: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadState('loading');
      setProduct(null);
      setSelectedVariant(null); setSize(''); setMaterial(''); setActiveImage(0); setRatingStats(null);

      // إصلاح الخلل الحرج: كل استدعاء لـ Supabase محاط الآن بـ try/catch،
      // مع التحقق من الحقول الإجبارية (handle موجود، إلخ) بدلاً من ترك
      // الصفحة معلّقة على "Loading…" إلى الأبد عند أي خطأ أو منتج ناقص.
      //
      // Critical bug fix: every Supabase call is now wrapped in try/catch,
      // with a check for required fields, instead of leaving the page stuck
      // on "Loading…" forever whenever a fetch fails or a product record
      // is missing data.
      if (!handle) {
        if (!cancelled) setLoadState('not-found');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ecom_products')
          .select('*, variants:ecom_product_variants(*)')
          .eq('handle', handle)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('ProductPage: failed to load product', error);
          setLoadState('error');
          return;
        }

        if (!data) {
          setLoadState('not-found');
          return;
        }

        let variants = data.variants || [];
        if (data.has_variants && !variants.length) {
          const { data: v, error: vErr } = await supabase
            .from('ecom_product_variants')
            .select('*')
            .eq('product_id', data.id)
            .order('position');
          if (vErr) console.error('ProductPage: failed to load variants', vErr);
          variants = v || [];
          data.variants = variants;
        }
        variants.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

        if (cancelled) return;
        setProduct(data);
        setLoadState('ready');

        if (variants.length) {
          const first = variants[0];
          setSelectedVariant(first); setSize(first.option1 || ''); setMaterial(first.option2 || '');
        }

        try {
          const { data: rel, error: relErr } = await supabase
            .from('ecom_products')
            .select('*, variants:ecom_product_variants(*)')
            .eq('product_type', data.product_type)
            .eq('status', 'active')
            .neq('id', data.id)
            .limit(4);
          if (relErr) throw relErr;
          if (!cancelled) setRelated(rel || []);
        } catch (relErr) {
          // المنتجات المشابهة اختيارية — تجاهل أي خطأ بدون كسر الصفحة
          // Related products are optional — fail silently without breaking the page
          console.error('ProductPage: failed to load related products', relErr);
          if (!cancelled) setRelated([]);
        }

        window.scrollTo(0, 0);
      } catch (err) {
        console.error('ProductPage: unexpected error', err);
        if (!cancelled) setLoadState('error');
      }
    };

    run();
    return () => { cancelled = true; };
  }, [handle]);

  if (loadState === 'loading') {
    return (
      <Shell>
        <div className="py-40 text-center text-[#8D8D8D]">{en ? 'Loading…' : 'جارٍ التحميل…'}</div>
      </Shell>
    );
  }

  if (loadState === 'not-found' || loadState === 'error') {
    return (
      <Shell>
        <SEO
          title={en ? 'Product Not Found' : 'المنتج غير موجود'}
          noindex
          path={`/products/${handle || ''}`}
        />
        <div className="py-32 max-w-md mx-auto text-center px-6">
          <AlertCircle size={40} className="mx-auto text-[#FF6A00] mb-5" />
          <h1 className="font-serif text-2xl text-[#1D1D1D] dark:text-[#F4F1E9] mb-3">
            {loadState === 'not-found'
              ? (en ? 'This piece could not be found' : 'تعذر العثور على هذه القطعة')
              : (en ? 'Something went wrong' : 'حدث خطأ ما')}
          </h1>
          <p className="text-sm text-[#8D8D8D] mb-8">
            {loadState === 'not-found'
              ? (en
                ? 'The artwork you\u2019re looking for may have been removed or the link is incorrect.'
                : 'ربما تمت إزالة هذا العمل الفني أو أن الرابط غير صحيح.')
              : (en
                ? 'We couldn\u2019t load this product right now. Please try again in a moment.'
                : 'تعذر تحميل هذا المنتج حالياً. يرجى المحاولة مرة أخرى بعد قليل.')}
          </p>
          <Link to="/shop" className="inline-block px-8 py-3 bg-[#1D1D1D] text-white text-xs tracking-[0.2em] uppercase rounded-lg hover:bg-[#FF6A00] transition-colors">
            {en ? 'Back to Shop' : 'العودة للمتجر'}
          </Link>
        </div>
      </Shell>
    );
  }

  const variants = product.variants || [];
  const variantSizes = [...new Set(variants.map((v: any) => v.option1).filter(Boolean))] as string[];
  const metaSizes = (product.metadata?.sizes || []) as string[];
  const sizes = variantSizes.length ? variantSizes : metaSizes;
  const materials = [...new Set(variants.map((v: any) => v.option2).filter(Boolean))] as string[];
  const allAddons = ((product.metadata?.addons || []) as any[]).filter((a) => a.enabled);
  const images: string[] = (product.images && product.images.length) ? product.images : [FALLBACK_IMAGE];
  const lifestyleImages: string[] = product.metadata?.lifestyle_images || [];
  const l = en ? 'en' : 'ar';

  const pick = (s: string, m: string) => {
    const v = variants.find((x: any) => x.option1 === s && x.option2 === m);
    if (v) setSelectedVariant(v);
  };
  const onSize = (s: string) => { setSize(s); pick(s, material); };
  const onMat = (m: string) => { setMaterial(m); pick(size, m); };
  const toggleAddon = (label: string) => setAddons((p) => ({ ...p, [label]: !p[label] }));

  // Price shown on each size chip (absolute price — clearer than a "+XX" delta).
  const priceForSize = (s: string) => {
    const match = variants.find((v: any) => v.option1 === s);
    return match ? match.price : 0;
  };

  const addonTotal = allAddons.filter((a) => addons[a.label]).reduce((s, a) => s + (a.price || 0), 0);
  const basePrice = selectedVariant?.price || product.price;
  const price = basePrice + addonTotal;
  const hasVariants = product.has_variants && variants.length > 0;
  // Only require a selection for option dimensions that actually exist.
  const needsSize = sizes.length > 0 && !size;
  const needsMaterial = materials.length > 0 && !material;
  const missingSelection = hasVariants && (needsSize || needsMaterial);
  const inStock = selectedVariant ? (selectedVariant.inventory_qty == null || selectedVariant.inventory_qty > 0) : true;
  const priceUnavailable = !price || price <= 0;

  const add = () => {
    if (missingSelection || !inStock || priceUnavailable) return;
    const chosen = allAddons.filter((a) => addons[a.label]).map((a) => a.label);
    const extra = !hasVariants && variantSizes.length === 0 && size ? size : '';
    const titleParts = [selectedVariant?.title || extra, ...chosen].filter(Boolean);
    addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      name: product.name,
      variant_title: titleParts.join(' · ') || undefined,
      sku: selectedVariant?.sku || product.sku || product.handle,
      price,
      image: images[0],
      handle: product.handle,
    }, qty);
  };

  const buttonLabel = priceUnavailable
    ? (en ? 'Currently Unavailable' : 'غير متوفر حالياً')
    : !inStock
      ? (en ? 'Sold Out' : 'نفدت الكمية')
      : missingSelection
        ? (en ? 'Select Options' : 'اختر الخيارات')
        : (en ? 'Add to Cart' : 'أضف للسلة');

  const fromPrice = lowestPrice(product);
  const description = productDescription(product, l);
  const seoTitle = fromPrice
    ? (en ? `${product.name} | Wall Art from ${Math.round(fromPrice / 100)} MAD` : `${product.name} | لوحة جدارية من ${Math.round(fromPrice / 100)} درهم`)
    : product.name;
  const faqItems = [
    ...productFaq(product, l),
    ...resolveFaq([FAQ_ITEMS[2], FAQ_ITEMS[3], FAQ_ITEMS[4], FAQ_ITEMS[5], FAQ_ITEMS[6]], l),
  ];

  return (
    <Shell>
      <SEO
        title={seoTitle}
        description={productMetaDescription(product, l)}
        path={`/products/${product.handle}`}
        image={images[0]}
        type="product"
        jsonLd={buildProductJsonLd(product, { rating: ratingStats || undefined })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-5">
        <Breadcrumbs
          items={[
            { label: en ? 'Home' : 'الرئيسية', path: '/' },
            { label: en ? 'Shop' : 'المتجر', path: '/shop' },
            { label: product.name, path: `/products/${product.handle}` },
          ]}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-20 pb-28 md:pb-12">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="bg-[#F2ECE6] dark:bg-[#161616] rounded-2xl overflow-hidden shadow-[0_30px_60px_-34px_rgba(11,11,11,0.45)]">
            <img
              src={images[activeImage] || images[0]}
              alt={`${product.name} — ${en ? 'wall art print by PITSIKY' : 'لوحة جدارية من بيتسيكي'}`}
              fetchPriority="high"
              decoding="async"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
              className="w-full h-auto block"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 md:mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-3">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`${product.name} ${i + 1}`}
                  className={`bg-[#F2ECE6] dark:bg-[#161616] rounded-xl overflow-hidden aspect-square flex items-center justify-center border-2 transition-colors ${activeImage === i ? 'border-[#FF6A00]' : 'border-transparent hover:border-[#FF6A00]/40'}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {lifestyleImages.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">
                {en ? 'See It On Your Wall' : 'شاهدها على جدارك'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {lifestyleImages.map((img, i) => (
                  <div key={i} className="bg-[#F2ECE6] rounded-xl overflow-hidden aspect-[4/3]">
                    <img
                      src={img}
                      alt={`${product.name} ${en ? 'in a room setting' : 'في بيئة منزلية'} ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {product.product_type && <p className="text-xs tracking-[0.2em] uppercase text-[#FF6A00] mb-2">{product.product_type}</p>}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1D1D1D] dark:text-[#F4F1E9] leading-tight">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3 flex-wrap">
            <p className="text-3xl font-semibold text-[#1D1D1D] dark:text-[#F4F1E9]">
              {priceUnavailable ? (en ? 'Price on request' : 'السعر عند الطلب') : formatMAD(price)}
            </p>
            {!priceUnavailable && (
              <span className="text-xs text-[#1faa52] bg-[#1faa52]/10 rounded-full px-3 py-1">
                {en ? 'Free delivery' : 'توصيل مجاني'}
              </span>
            )}
          </div>

          <p className="text-[#6b6b6b] dark:text-[#bdb9ad] leading-8 mt-5">{description}</p>

          {sizes.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Size' : 'المقاس'}</p>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((s) => {
                  const sPrice = priceForSize(s);
                  const selected = size === s;
                  return (
                    <button key={s} onClick={() => onSize(s)} aria-pressed={selected}
                      className={`min-w-[108px] px-4 py-3 rounded-xl border-2 text-center transition-all ${selected ? 'border-[#FF6A00] bg-[#FF6A00]/10 shadow-[0_10px_24px_-14px_rgba(255,106,0,0.7)]' : 'border-[#e5ded3] dark:border-[#2a2a2a] hover:border-[#FF6A00]/60'}`}>
                      <span className="block text-sm font-semibold text-[#1D1D1D] dark:text-[#F4F1E9]">{formatSize(s, l)}</span>
                      {sPrice > 0 && <span className="block text-xs text-[#8D8D8D] mt-0.5">{formatMAD(sPrice)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Finish' : 'التشطيب'}</p>
              <div className="flex flex-wrap gap-2.5">
                {materials.map((m) => (
                  <button key={m} onClick={() => onMat(m)} aria-pressed={material === m}
                    className={`px-4 py-3 text-sm rounded-xl border-2 transition-colors ${material === m ? 'border-[#FF6A00] bg-[#FF6A00]/10' : 'border-[#e5ded3] dark:border-[#2a2a2a] hover:border-[#FF6A00]/60'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allAddons.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Add-ons & Extras' : 'إضافات'}</p>
              <div className="flex flex-wrap gap-2.5">
                {allAddons.map((a) => {
                  const on = addons[a.label];
                  return (
                    <button key={a.label} onClick={() => toggleAddon(a.label)} aria-pressed={!!on}
                      className={`px-4 py-3 text-sm border-2 rounded-xl transition-colors flex items-center gap-2 ${on ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#e5ded3] dark:border-[#2a2a2a] hover:border-[#FF6A00]'}`}>
                      {a.label}
                      {a.price > 0 && <span className={`text-xs ${on ? 'text-white/85' : 'text-[#FF6A00]'}`}>+{formatMAD(a.price)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Quantity' : 'الكمية'}</p>
            <div className="inline-flex items-center border-2 border-[#e5ded3] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-" className="px-4 py-2.5 text-lg">−</button>
              <span className="px-5 font-medium tabular-nums">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="+" className="px-4 py-2.5 text-lg">+</button>
            </div>
          </div>

          <PaymentMethods />

          <button onClick={add} disabled={missingSelection || !inStock || priceUnavailable}
            className="hidden md:block w-full mt-6 btn-pk py-4 text-sm disabled:opacity-40 disabled:pointer-events-none">
            {buttonLabel}
          </button>

          <ul className="mt-8 grid gap-3 text-sm text-[#5f5a52] dark:text-[#bdb9ad]">
            <li className="flex items-center gap-3"><Truck size={18} className="text-[#FF6A00] shrink-0" /> {en ? 'Free delivery across Morocco · 3–5 business days' : 'توصيل مجاني لكل مدن المغرب · 3 إلى 5 أيام عمل'}</li>
            <li className="flex items-center gap-3"><Wallet size={18} className="text-[#FF6A00] shrink-0" /> {en ? 'Pay 50% now, 50% on delivery' : 'ادفع 50% الآن و50% عند الاستلام'}</li>
            <li className="flex items-center gap-3"><RotateCcw size={18} className="text-[#FF6A00] shrink-0" /> {en ? '7-day exchange · print quality guaranteed' : 'استبدال خلال 7 أيام · جودة الطباعة مضمونة'}</li>
            <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-[#FF6A00] shrink-0" /> {en ? 'Order confirmed by phone before production' : 'نؤكد طلبك هاتفياً قبل التنفيذ'}</li>
          </ul>

          <ProductDetails
            dimensions={product.metadata?.dimensions}
            materials={product.metadata?.materials}
          />
        </div>
      </div>

      {/* Mobile-only sticky add-to-cart bar — keeps price + action reachable
          without the visitor having to scroll back up past the description. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0C0C0C]/95 backdrop-blur border-t border-[#eee] dark:border-[#222] px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <span className="font-serif text-lg text-[#1D1D1D] dark:text-[#F4F1E9] shrink-0">
          {priceUnavailable ? (en ? 'N/A' : 'غ.م') : formatMAD(price)}
        </span>
        <button onClick={add} disabled={missingSelection || !inStock || priceUnavailable}
          className="flex-1 btn-pk py-3.5 text-sm disabled:opacity-40 disabled:pointer-events-none">
          {buttonLabel}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <ProductReviews productId={product.id} onStats={(v, c) => setRatingStats(c > 0 ? { value: v, count: c } : null)} />
      </div>

      <FAQSection
        eyebrow={en ? 'Good to know' : 'قبل أن تطلب'}
        title={en ? 'Questions about this print' : 'أسئلة حول هذه اللوحة'}
        items={faqItems}
      />

      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-24 mt-6">
          <h2 className="font-serif text-2xl md:text-3xl mb-6 md:mb-10">{en ? 'You May Also Love' : 'قد يعجبك أيضاً'}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-12">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </Shell>
  );
};

export default ProductPage;
