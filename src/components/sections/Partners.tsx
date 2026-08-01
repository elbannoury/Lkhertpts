import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings, type Partner } from '@/hooks/useSiteSettings';

const Row: React.FC<{ items: Partner[]; direction: 'ltr' | 'rtl'; lang: string }> = ({ items, direction, lang }) => {
  const track = [...items, ...items]; // duplicated once for a seamless loop

  return (
    <div className="relative overflow-hidden py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-28 bg-gradient-to-r from-[#FBF8F2] dark:from-[#0C0C0C] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-28 bg-gradient-to-l from-[#FBF8F2] dark:from-[#0C0C0C] to-transparent z-10" />
      <div className={`flex w-max gap-14 md:gap-20 ${direction === 'ltr' ? 'animate-partners-ltr' : 'animate-partners-rtl'}`}>
        {track.map((p, i) => {
          const name = (lang === 'ar' ? p.name_ar : p.name) || p.name || '';
          const content = (
            <img
              src={p.logo}
              alt={name}
              title={name}
              className="h-7 md:h-9 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          );
          return p.link ? (
            <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center">
              {content}
            </a>
          ) : (
            <div key={i} className="shrink-0 flex items-center">{content}</div>
          );
        })}
      </div>
    </div>
  );
};

const Partners: React.FC = () => {
  const { lang } = useI18n();
  const { settings, loaded } = useSiteSettings();

  if (!loaded || !settings.partners_enabled) return null;
  const partners = (settings.partners || []).filter((p) => p.logo);
  if (partners.length < 2) return null; // needs at least 2 to make two rows feel intentional

  const title = (lang === 'ar' ? settings.partners_title_ar : settings.partners_title) || settings.partners_title ||
    (lang === 'ar' ? 'شركاؤنا وتعاوناتنا' : 'Collaborations & Partners');

  const mid = Math.ceil(partners.length / 2);
  const rowA = partners.slice(0, mid);
  const rowB = partners.length > mid ? partners.slice(mid) : rowA;

  return (
    <section className="py-14 md:py-20 border-t border-black/5 dark:border-white/5">
      <p className="text-center text-[10px] tracking-[0.3em] uppercase text-[#8D8D8D] mb-6 md:mb-8">{title}</p>
      <div className="space-y-1">
        <Row items={rowA} direction="ltr" lang={lang} />
        <Row items={rowB} direction="rtl" lang={lang} />
      </div>
    </section>
  );
};

export default Partners;
