import React from 'react';
import { INSPIRATION_IMAGES } from '@/data/catalog';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Inspiration: React.FC = () => {
  const { settings } = useSiteSettings();
  const custom = (settings.inspiration_images || []).filter(Boolean);
  const base = custom.length > 0 ? custom : INSPIRATION_IMAGES;
  // Duplicate to keep the masonry full when only a few images are set.
  const images = base.length >= 6 ? base : base.concat(base);

  return (
    <section className="py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A23F] mb-3">A Living Moodboard</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#141414] dark:text-[#F4F1E9]">Inspiration Gallery</h2>
          <p className="text-[#8D8D8D] dark:text-[#9a9a9a] mt-4 max-w-md mx-auto">Real decorated spaces. Save what moves you, build moodboards, share the feeling.</p>
        </div>
        <div className="columns-2 md:columns-3 gap-4 [&>*]:mb-4">
          {images.map((img, i) => (
            <div key={i} className="break-inside-avoid overflow-hidden rounded-sm group relative">
              <img src={img} alt="Inspiration" loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[#C9A23F]/0 group-hover:bg-[#C9A23F]/15 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Inspiration;
