import React from 'react';
import { Link } from 'react-router-dom';
import { STYLES } from '@/data/styles';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// "Shop by Style" — 16:9 luxury style cards. Owner-editable images take priority.
const Rooms: React.FC = () => {
  const { t, lang } = useI18n();
  const { settings } = useSiteSettings();

  const custom = (settings.style_cards || []).filter((c) => c?.image);
  const items = custom.length > 0
    ? custom.map((c, i) => ({
        en: c.label || STYLES[i % STYLES.length].en,
        ar: c.label_ar || c.label || STYLES[i % STYLES.length].ar,
        handle: (c.handle || '').trim() || STYLES[i % STYLES.length].handle,
        image: c.image,
      }))
    : STYLES;

  return (
    <section className="bg-[#F3EDE1] dark:bg-[#111] py-24 transition-colors">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A23F] mb-3">{t('styles.eyebrow')}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#141414] dark:text-[#F4F1E9]">{t('styles.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <Link
              key={s.handle + i}
              to={`/collections/${s.handle}`}
              className="group relative overflow-hidden aspect-video rounded-md border border-[#E2D8C5] dark:border-[#262626]"
            >
              <img src={s.image} alt={s.en} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-[#C9A23F]/0 group-hover:ring-[#C9A23F]/70 transition-all duration-300" />
              <div className="absolute bottom-5 left-6">
                <span className="block text-[10px] tracking-[0.3em] uppercase text-[#E8C766] mb-1">PITSIKY</span>
                <span className="font-serif text-2xl text-white">{lang === 'ar' ? s.ar : s.en}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Rooms;
