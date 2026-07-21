import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Hero from '@/components/sections/Hero';
import Categories from '@/components/sections/Categories';
import Rooms from '@/components/sections/Rooms';
import ProductRow from '@/components/sections/ProductRow';
import Inspiration from '@/components/sections/Inspiration';
import VideoShowcase from '@/components/sections/VideoShowcase';
import FeaturedDesigns from '@/components/sections/FeaturedDesigns';
import SomePaintings from '@/components/sections/SomePaintings';
import StudioSection from '@/components/sections/StudioSection';
import AlwaysFresh from '@/components/sections/AlwaysFresh';
import NewsTicker from '@/components/NewsTicker';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const AppLayout: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('ecom_products')
      .select('*, variants:ecom_product_variants(*)')
      .eq('status', 'active')
      .then(({ data }) => setProducts(data || []));
  }, []);

  const tagged = (tag: string) => products.filter((p) => p.tags?.includes(tag));

  // "Most loved" — owner-curated products shown first in the Some Paintings rail.
  const lovedProducts = useMemo(() => {
    const loved = settings.most_loved || [];
    if (!loved.length) return products;
    const inLoved = (p: any) => loved.includes(p.id) || loved.includes(p.handle);
    const picked = loved
      .map((key) => products.find((p) => p.id === key || p.handle === key))
      .filter(Boolean);
    const rest = products.filter((p) => !inLoved(p));
    return [...picked, ...rest];
  }, [products, settings.most_loved]);


  return (
    <div>
      <Hero />
      <NewsTicker />

      <FeaturedDesigns />
      <SomePaintings products={lovedProducts} />
      <Categories />

      <ProductRow eyebrow={t('best.eyebrow')} title={t('best.title')} products={tagged('bestseller')} link="/collections/best-sellers" />
      <StudioSection />
      <VideoShowcase />
      <Rooms />
      <AlwaysFresh />
      <ProductRow eyebrow={t('new.eyebrow')} title={t('new.title')} products={tagged('new')} link="/collections/new-arrivals" />
      <Inspiration />


      {/* ===== CUSTOM DESIGN BAND ===== */}
      <section className="relative overflow-hidden mesh-bg py-24 px-6 text-center">
        <div className="absolute inset-0 bg-[#0B0B0B]/45" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="deer-bob text-5xl inline-block">🦌</span>
          <h2 className="font-serif text-4xl md:text-6xl mt-4 pk-grad-text">باغي تصميم مخصص؟</h2>
          <p className="text-white/85 mt-5 text-lg">
            عبّر على الفكرة لي فراسك وحنا نحوّلوها لوحة فنية فاخرة. كليكي هنا 👇
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-9">
            <Link to="/custom" className="btn-pk px-10 py-4 text-sm uppercase">أرسل فكرتك الآن</Link>
            <a href="https://wa.me/+212702382376" target="_blank" rel="noopener noreferrer" className="btn-wa px-9 py-4 text-sm">
              واتساب +212 702 382 376
            </a>
          </div>
        </div>
      </section>

      {/* ===== LIMITED EDITIONS ===== */}
      <section className="bg-[#0B0B0B] py-28 text-center border-t border-[#FF6A00]/20">
        <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-4">{t('limited.eyebrow')}</p>
        <h2 className="font-serif text-4xl md:text-5xl pk-grad-text mb-5">{t('limited.title')}</h2>
        <p className="text-[#9a9a9a] max-w-md mx-auto mb-8">{t('limited.sub')}</p>
        <Link to="/collections/limited-editions" className="inline-block btn-pk px-10 py-4 text-xs uppercase">
          {t('limited.cta')}
        </Link>
      </section>
    </div>
  );
};

export default AppLayout;
