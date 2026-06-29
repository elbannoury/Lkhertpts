import React from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useI18n } from '@/contexts/I18nContext';
import { Sparkles } from 'lucide-react';

/**
 * Animated marquee-style news bar placed under the hero. The owner can edit the
 * text (EN/AR) or attach an image from the Settings tab. Content scrolls like a
 * news ticker and the segment is repeated so the loop is seamless.
 */
const NewsTicker: React.FC = () => {
  const { settings, loaded } = useSiteSettings();
  const { lang } = useI18n();

  if (!loaded) return null;
  if (settings.news_enabled === false) return null;

  const text = (lang === 'ar' ? settings.news_text_ar : settings.news_text) ||
    settings.news_text || 'Handcrafted luxury wall art · Free design consultation';

  if (!text && !settings.news_image) return null;

  const Segment = () => (
    <span className="flex items-center gap-3 px-8 shrink-0">
      {settings.news_image ? (
        <img src={settings.news_image} alt="" className="h-6 w-auto object-contain rounded-sm" />
      ) : (
        <Sparkles size={15} className="text-[#FF6A00]" />
      )}
      <span className="text-[13px] tracking-[0.14em] uppercase text-[#F4F1E9] font-medium whitespace-nowrap">
        {text}
      </span>
      <span className="text-[#FF6A00]">◆</span>
    </span>
  );

  // repeat enough segments to fill very wide screens
  const segments = Array.from({ length: 8 });

  return (
    <div className="relative bg-[#0B0B0B] border-y border-[#FF6A00]/25 overflow-hidden py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0B0B0B] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0B0B0B] to-transparent z-10" />
      <div className="flex w-max animate-news-scroll" dir="ltr">
        {segments.map((_, i) => <Segment key={i} />)}
        {segments.map((_, i) => <Segment key={`b${i}`} />)}
      </div>
    </div>
  );
};

export default NewsTicker;
