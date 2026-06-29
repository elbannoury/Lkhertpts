import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import LazyImage from '@/components/LazyImage';

const SLASH = ['fd-slash-r', 'fd-slash-l', 'fd-slash-r', 'fd-slash-l'];
const FLOAT = ['fd-float-1', 'fd-float-2', 'fd-float-3', 'fd-float-4'];

const FeaturedDesigns: React.FC = () => {
  const { lang } = useI18n();
  const { settings } = useSiteSettings();
  if (settings.featured_enabled === false) return null;
  const items = (settings.featured_designs || []).filter((d) => d?.image).slice(0, 4);
  if (items.length === 0) return null;

  const title = lang === 'ar'
    ? (settings.featured_title_ar || settings.featured_title || 'تصاميم مميزة')
    : (settings.featured_title || 'Featured Designs');

  return (
    <section className="relative overflow-hidden bg-[#0B0B0B] py-24 px-6 lg:px-10 border-t border-[#FF6A00]/15">
      <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-[#FF6A00]/20 blur-[120px]" />
      <div className="relative max-w-[1300px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">PITSIKY · GALLERY</p>
          <h2 className="font-serif text-4xl md:text-5xl pk-grad-text">{title}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((d, i) => {
            const inner = (
              <div className={`fd-card ${SLASH[i]} ${FLOAT[i]} aspect-[5/7] bg-black`}>
                <LazyImage
                  src={d.image}
                  alt={title + ' ' + (i + 1)}
                  wrapperClassName="fd-inner w-full h-full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-4 left-4 text-[#FF9438] text-xs tracking-[0.2em] uppercase">0{i + 1}</span>
              </div>
            );
            return d.link ? (
              <Link key={i} to={d.link}>{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDesigns;
