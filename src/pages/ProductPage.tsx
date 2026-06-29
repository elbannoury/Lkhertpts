import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Truck, ShieldCheck, Star } from 'lucide-react';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { formatMAD } from '@/data/catalog';

const ProductPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setSelectedVariant(null); setSize(''); setMaterial('');
      const { data } = await supabase
        .from('ecom_products').select('*, variants:ecom_product_variants(*)').eq('handle', handle).single();
      if (!data) return;
      let variants = data.variants || [];
      if (data.has_variants && !variants.length) {
        const { data: v } = await supabase.from('ecom_product_variants').select('*').eq('product_id', data.id).order('position');
        variants = v || []; data.variants = variants;
      }
      variants.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
      setProduct(data);
      if (variants.length) {
        const first = variants[0];
        setSelectedVariant(first); setSize(first.option1 || ''); setMaterial(first.option2 || '');
      }
      const { data: rel } = await supabase
        .from('ecom_products').select('*, variants:ecom_product_variants(*)')
        .eq('product_type', data.product_type).eq('status', 'active').neq('id', data.id).limit(4);
      setRelated(rel || []);
      window.scrollTo(0, 0);
    };
    run();
  }, [handle]);

  if (!product) return <Shell><div className="py-40 text-center text-[#8D8D8D]">Loading…</div></Shell>;

  const variants = product.variants || [];
  const variantSizes = [...new Set(variants.map((v: any) => v.option1).filter(Boolean))] as string[];
  const metaSizes = (product.metadata?.sizes || []) as string[];
  const sizes = variantSizes.length ? variantSizes : metaSizes;
  const materials = [...new Set(variants.map((v: any) => v.option2).filter(Boolean))] as string[];
  const allAddons = ((product.metadata?.addons || []) as any[]).filter((a) => a.enabled);

  const pick = (s: string, m: string) => {
    const v = variants.find((x: any) => x.option1 === s && x.option2 === m);
    if (v) setSelectedVariant(v);
  };
  const onSize = (s: string) => { setSize(s); pick(s, material); };
  const onMat = (m: string) => { setMaterial(m); pick(size, m); };
  const toggleAddon = (label: string) => setAddons((p) => ({ ...p, [label]: !p[label] }));

  const addonTotal = allAddons.filter((a) => addons[a.label]).reduce((s, a) => s + (a.price || 0), 0);
  const basePrice = selectedVariant?.price || product.price;
  const price = basePrice + addonTotal;
  const hasVariants = product.has_variants && variants.length > 0;
  // Only require a selection for option dimensions that actually exist.
  const needsSize = sizes.length > 0 && !size;
  const needsMaterial = materials.length > 0 && !material;
  const missingSelection = hasVariants && (needsSize || needsMaterial);
  const inStock = selectedVariant ? (selectedVariant.inventory_qty == null || selectedVariant.inventory_qty > 0) : true;

  const add = () => {
    if (missingSelection || !inStock) return;
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
      image: product.images?.[0],
      handle: product.handle,
    }, qty);
  };


  return (
    <Shell>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 grid md:grid-cols-2 gap-12 lg:gap-20">
        <div className="bg-[#F2ECE6] rounded-sm overflow-hidden aspect-[4/5] sticky top-24 self-start">
          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#a59f97] mb-2">{product.product_type}</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-[#1D1D1D] leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-3 text-[#FF6A00]">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            <span className="text-xs text-[#8D8D8D] ml-1">Loved by collectors</span>
          </div>
          <p className="text-2xl text-[#1D1D1D] mt-5">{formatMAD(price)}</p>
          <p className="text-[#6b6b6b] leading-relaxed mt-6">{product.description}</p>

          {sizes.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button key={s} onClick={() => onSize(s)}
                    className={`px-4 py-2.5 text-sm border transition-colors ${size === s ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#ddd] hover:border-[#6E44FF]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">Finish</p>
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
              <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">Add-ons & Extras</p>
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
            <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">Quantity</p>
            <div className="inline-flex items-center border border-[#ddd]">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2">−</button>
              <span className="px-5">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-2">+</button>
            </div>
          </div>

          <button onClick={add} disabled={missingSelection || !inStock}
            className="w-full mt-8 bg-[#1D1D1D] text-white py-4 text-xs tracking-[0.25em] uppercase rounded-lg hover:bg-[#FF6A00] transition-colors disabled:opacity-40">
            {!inStock ? 'Sold Out' : missingSelection ? 'Select Options' : 'Add to Selection'}
          </button>


          <div className="mt-8 space-y-3 text-sm text-[#6b6b6b]">
            <div className="flex items-center gap-3"><Truck size={17} className="text-[#FF6A00]" /> Free delivery in Morocco · 3–5 days</div>
            <div className="flex items-center gap-3"><ShieldCheck size={17} className="text-[#FF6A00]" /> Pay on delivery · Certificate included</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-24">
          <h2 className="font-serif text-3xl mb-10">You May Also Love</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </Shell>
  );
};

export default ProductPage;
