import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Truck, ShieldCheck, Star, AlertCircle } from 'lucide-react';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import SEO from '@/components/SEO';
import PaymentMethods from '@/components/PaymentMethods';
import ProductDetails from '@/components/ProductDetails';
import ProductReviews from '@/components/ProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatMAD } from '@/data/catalog';
import { buildProductJsonLd } from '@/lib/jsonld';

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadState('loading');
      setProduct(null);
      setSelectedVariant(null); setSize(''); setMaterial(''); setActiveImage(0);

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

  const pick = (s: string, m: string) => {
    const v = variants.find((x: any) => x.option1 === s && x.option2 === m);
    if (v) setSelectedVariant(v);
  };
  const onSize = (s: string) => { setSize(s); pick(s, material); };
  const onMat = (m: string) => { setMaterial(m); pick(size, m); };
  const toggleAddon = (label: string) => setAddons((p) => ({ ...p, [label]: !p[label] }));

  // سعر كل حجم يُحسب من فرق سعر متغيّر (variant) المرتبط به مقارنة بأول
  // متغيّر (الحجم الأساسي)، لعرض "+XX MAD" بجانب كل زر حجم كما هو مطلوب.
  // Price delta per size, computed from each size's cheapest linked variant
  // vs. the base (first) variant — shown as "+XX MAD" next to each size button.
  const baseSizePrice = variants[0]?.price ?? product.price;
  const priceForSize = (s: string) => {
    const match = variants.find((v: any) => v.option1 === s);
    return match ? match.price : baseSizePrice;
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

  const addToCartLabel = en ? 'Add to Cart' : 'أضف للسلة';
  const buttonLabel = priceUnavailable
    ? (en ? 'Currently Unavailable' : 'غير متوفر حالياً')
    : !inStock
      ? (en ? 'Sold Out' : 'نفدت الكمية')
      : missingSelection
        ? (en ? 'Select Options' : 'اختر الخيارات')
        : addToCartLabel;

  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    image: images,
    handle: product.handle,
    price,
    inStock,
  });

  return (
    <Shell>
      <SEO
        title={product.name}
        description={product.description || `${product.name} — PITSIKY Wall Art`}
        path={`/products/${product.handle}`}
        image={images[0]}
        type="product"
        jsonLd={productJsonLd}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-12 grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-20 pb-28 md:pb-12">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="bg-[#F2ECE6] rounded-sm overflow-hidden">
            <img
              src={images[activeImage] || images[0]}
              alt={`${product.name} | PITSIKY Wall Art`}
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
                  className={`bg-[#F2ECE6] rounded-sm overflow-hidden aspect-square flex items-center justify-center border transition-colors ${activeImage === i ? 'border-[#1D1D1D]' : 'border-transparent hover:border-[#ccc]'}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1} | PITSIKY Wall Art`}
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
                  <div key={i} className="bg-[#F2ECE6] rounded-sm overflow-hidden aspect-[4/3]">
                    <img
                      src={img}
                      alt={`${product.name} ${en ? 'in a room setting' : 'في بيئة منزلية'} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#a59f97] mb-2">{product.product_type}</p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1D1D1D] leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-3 text-[#FF6A00]">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            <span className="text-xs text-[#8D8D8D] ml-1">{en ? 'Loved by collectors' : 'يحبها هواة الفن'}</span>
          </div>
          <p className="text-2xl text-[#1D1D1D] mt-5">
            {priceUnavailable ? (en ? 'Price on request' : 'السعر عند الطلب') : formatMAD(price)}
          </p>
          <p className="text-[#6b6b6b] leading-relaxed mt-6">{product.description}</p>

          {sizes.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Size' : 'الحجم'}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const sPrice = priceForSize(s);
                  const delta = sPrice - baseSizePrice;
                  return (
                    <button key={s} onClick={() => onSize(s)}
                      className={`px-4 py-2.5 text-sm border transition-colors flex flex-col items-center leading-tight ${size === s ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#ddd] hover:border-[#6E44FF]'}`}>
                      <span>{s}</span>
                      {delta > 0 && (
                        <span className={`text-[10px] ${size === s ? 'text-white/70' : 'text-[#8D8D8D]'}`}>+{formatMAD(delta)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Finish' : 'التشطيب'}</p>
              <div className="flex flex-wrap gap-2">
                {materials.map((m) => (
                  <button key={m} onClick={() => onMat(m)}
                    className={`px-4 py-2.5 text-sm border transition-colors ${material === m ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#ddd] hover:border-[#6E44FF]'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allAddons.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">{en ? 'Add-ons & Extras' : 'إضافات'}</p>
              <div className="flex flex-wrap gap-2">
                {allAddons.map((a) => {
                  const on = addons[a.label];
                  return (
                    <button key={a.label} onClick={() => toggleAddon(a.label)}
                      className={`px-4 py-2.5 text-sm border rounded-lg transition-colors flex items-center gap-2 ${on ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#ddd] hover:border-[#FF6A00]'}`}>
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
            <div className="inline-flex items-center border border-[#ddd]">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2.5 md:py-2 text-lg md:text-base">−</button>
              <span className="px-5">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-2.5 md:py-2 text-lg md:text-base">+</button>
            </div>
          </div>

          <PaymentMethods />

          <button onClick={add} disabled={missingSelection || !inStock || priceUnavailable}
            className="hidden md:block w-full mt-6 bg-[#1D1D1D] text-white py-4 text-xs tracking-[0.25em] uppercase rounded-lg hover:bg-[#FF6A00] transition-colors disabled:opacity-40">
            {buttonLabel}
          </button>

          <div className="mt-8 space-y-3 text-sm text-[#6b6b6b]">
            <div className="flex items-center gap-3"><Truck size={17} className="text-[#FF6A00]" /> {en ? 'Free delivery in Morocco · 3–5 days' : 'توصيل مجاني في المغرب · 3-5 أيام'}</div>
            <div className="flex items-center gap-3"><ShieldCheck size={17} className="text-[#FF6A00]" /> {en ? 'Secure checkout · Certificate included' : 'دفع آمن · شهادة أصالة مرفقة'}</div>
          </div>

          <ProductDetails
            dimensions={product.metadata?.dimensions}
            materials={product.metadata?.materials}
          />
        </div>
      </div>

      {/* Mobile-only sticky add-to-cart bar — keeps price + action reachable
          without the visitor having to scroll back up past the description. */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#eee] px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <span className="font-serif text-lg text-[#1D1D1D] shrink-0">
          {priceUnavailable ? (en ? 'N/A' : 'غ.م') : formatMAD(price)}
        </span>
        <button onClick={add} disabled={missingSelection || !inStock || priceUnavailable}
          className="flex-1 bg-[#1D1D1D] text-white py-3.5 text-xs tracking-[0.2em] uppercase rounded-lg active:bg-[#FF6A00] transition-colors disabled:opacity-40">
          {buttonLabel}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <ProductReviews productId={product.id} />
      </div>

      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-24 mt-10">
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
