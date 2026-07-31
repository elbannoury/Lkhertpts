import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Partners: React.FC = () => {
  const { lang } = useI18n();
  const { settings, loaded } = useSiteSettings();

  if (!loaded || !settings.partners_enabled) return null;
  const partners = (settings.partners || []).filter((p) => p.logo);
  if (!partners.length) return null;

  const title = (lang === 'ar' ? settings.partners_title_ar : settings.partners_title) || settings.partners_title ||
    (lang === 'ar' ? 'شركاؤنا وتعاوناتنا' : 'Collaborations & Partners');

  return (
    <section className="py-16 px-6 border-t border-black/5 dark:border-white/5">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8D8D8D] mb-8">{title}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {partners.map((p, i) => {
            const name = (lang === 'ar' ? p.name_ar : p.name) || p.name || '';
            const content = (
              <img
                src={p.logo}
                alt={name}
                title={name}
                className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            );
            return p.link ? (
              <a key={i} href={p.link} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;
