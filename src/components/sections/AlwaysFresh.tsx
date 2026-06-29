import React from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useI18n } from '@/contexts/I18nContext';

// "Always Fresh" — an owner-editable gallery band of unlimited images.
// Renders nothing until the owner adds at least one image in the dashboard.
const AlwaysFresh: React.FC = () => {
  const { lang } = useI18n();
  const { settings } = useSiteSettings();
  const images = (settings.fresh_images || []).filter(Boolean);
  if (images.length === 0) return null;

  return (
    <section className="bg-[#0B0B0B] py-24 px-6 lg:px-10 border-t border-[#FF6A00]/15">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">PITSIKY · {lang === 'ar' ? 'وصل حديثًا' : 'ALWAYS FRESH'}</p>
          <h2 className="font-serif text-4xl md:text-5xl pk-grad-text">{lang === 'ar' ? 'دائمًا جديد' : 'Always Fresh'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg aspect-[4/5] bg-black border border-[#FF6A00]/10">
              <img src={img} alt={`Fresh ${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlwaysFresh;
