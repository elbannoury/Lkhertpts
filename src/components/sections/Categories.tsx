import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/contexts/I18nContext';
import { BRANDS } from '@/data/styles';

interface Cat {
  id: string;
  title: string;
  title_ar?: string | null;
  slug: string;
  parent_id: string | null;
  cover_image?: string | null;
  banner_image?: string | null;
  icon?: string | null;
}

interface Promo {
  id?: string;
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
  image?: string;
  bg?: string;
  accent?: string;
}

const Categories: React.FC = () => {
  const { t, lang } = useI18n();
  const [cats, setCats] = useState<Cat[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    supabase
      .from('pts_categories')
      .select('id,title,title_ar,slug,parent_id,cover_image,banner_image,icon')
      .eq('is_visible', true)
      .is('parent_id', null)
      .order('position')
      .then(({ data }) => {
        // Hide archived collections from the storefront (archived column may not exist on old rows)
        const visible = (data as any[] || []).filter((c) => c?.archived !== true);
        setCats(visible as Cat[]);
      });

    supabase
      .from('pts_site_settings')
      .select('promotions')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        const list = Array.isArray(data?.promotions) ? (data!.promotions as Promo[]) : [];
        setPromos(list.filter((p) => p && p.enabled !== false));
      });
  }, []);

  const items =
    cats.length > 0
      ? cats.map((c, i) => ({
          title: lang === 'ar' && c.title_ar ? c.title_ar : c.title,
          handle: c.slug,
          image: c.cover_image || c.banner_image || c.icon || BRANDS[i % BRANDS.length].image,
        }))
      : BRANDS.map((b) => ({ title: b.title, handle: b.handle, image: b.image }));

  return (
    <>
      {/* ─── PROMOTIONS (owner-controlled via Settings → promotions) ─── */}
      {promos.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16">
          <div className="grid gap-6 md:grid-cols-1">
            {promos.map((p, i) => (
              <div
                key={p.id || i}
                className="relative overflow-hidden rounded-3xl min-h-[220px] md:min-h-[280px] flex items-center"
                style={{ backgroundColor: p.bg || '#0F0F0F' }}
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title || 'Promotion'}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 p-8 md:p-12 max-w-xl">
                  <h3 className="font-serif text-3xl md:text-5xl text-white mb-3">{p.title}</h3>
                  {p.subtitle && <p className="text-white/80 mb-6 text-base md:text-lg">{p.subtitle}</p>}
                  {p.cta_label && (
                    <Link
                      to={p.cta_link || '/shop'}
                      className="inline-block px-7 py-3 rounded-full text-sm font-medium tracking-wide text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: p.accent || '#FF6A00' }}
                    >
                      {p.cta_label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CATEGORIES — single background card per category (pitsiky.com style) ─── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A23F] mb-3">{t('cat.eyebrow')}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#141414] dark:text-[#F4F1E9]">{t('cat.title')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
          {items.map((c) => (
            <Link
              key={c.handle + c.title}
              to={`/collections/${c.handle}`}
              className="group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-md ring-1 ring-[#E7DFD0] dark:ring-[#2a2a2a] hover:ring-[#C9A23F] transition-all duration-300"
            >
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                <span className="block font-serif text-lg md:text-2xl text-white drop-shadow-sm group-hover:text-[#FFD27A] transition-colors">
                  {c.title}
                </span>
                <span className="mt-2 inline-block text-[10px] tracking-[0.25em] uppercase text-white/70 group-hover:text-[#FFD27A] transition-colors">
                  {lang === 'en' ? 'Explore' : 'استكشف'}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {/* CTA Section */}
<div className="mt-16 text-center">
  <Link
    to="/collections"
    className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6A00] hover:bg-[#E55A00] text-white rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 group"
  >
    <span>{lang === 'ar' ? 'عرض جميع المجموعات' : 'View All Collections'}</span>
    <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
  </Link>
</div>
      </section>
    </>
  );
}; 

export default Categories;
