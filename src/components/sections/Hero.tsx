import React from 'react';
import { Link } from 'react-router-dom';
import { HERO_IMAGE } from '@/data/catalog';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Hero: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const heroSrc = settings.hero_image || HERO_IMAGE;
  return (
    <section className="relative h-[90vh] min-h-[580px] w-full overflow-hidden bg-[#0B0B0B]">
      <img src={heroSrc} alt="PITSIKY luxury wall art" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      {/* warm ember wash */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#FF6A00]/30 blur-[120px]" />
      <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-[#E04E00]/25 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#FF9438]/20 blur-[120px]" />

      <div className="relative h-full max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col justify-center">
        <p className="text-[#FF6A00] text-xs tracking-[0.35em] uppercase mb-5 flex items-center gap-2">

          <span className="deer-bob">🦌</span> {t('hero.eyebrow')}
        </p>
        <h1 className="font-serif text-white text-5xl md:text-7xl leading-[1.05] max-w-3xl reveal-up">
          {t('hero.title1')}<br />
          <span className="pk-grad-text">{t('hero.title2')}</span>
        </h1>
        <p className="text-white/85 text-lg mt-6 max-w-md font-light reveal-up d1">{t('hero.sub')}</p>
        <div className="flex flex-wrap gap-4 mt-10 reveal-up d2">
          <Link to="/collections" className="btn-pk px-9 py-4 text-xs uppercase">
            {t('hero.cta1')}
          </Link>
          <Link to="/custom" className="btn-pk-purple px-9 py-4 text-xs uppercase">
            باغي تصميم مخصص؟
          </Link>
          <Link to="/visualize" className="btn-pk-ghost px-8 py-4 text-xs uppercase">
            {t('hero.cta2')}
          </Link>
        </div>
        {/* trust chips */}
        <div className="flex flex-wrap gap-3 mt-10 reveal-up d3">
          {['جودة عالية', 'توصيل 3-10 أيام', 'تخصيص كامل', 'دفع آمن'].map((c) => (
            <span key={c} className="text-xs text-white/80 bg-white/5 border border-[#FF6A00]/30 rounded-full px-4 py-2 backdrop-blur">

              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
