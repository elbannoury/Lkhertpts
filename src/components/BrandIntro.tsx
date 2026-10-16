import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { BRAND_DESCRIPTION, SITE } from '@/lib/seoShared';

/**
 * "What is PITSIKY?" — a definition-first block (GEO). Generative engines love
 * a clear, quotable statement of who you are, what you sell, where and for how much.
 */
const BrandIntro: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';
  const facts = en
    ? [`From ${SITE.startingPriceMAD} MAD (30×40 cm)`, 'Free delivery across Morocco', '50% upfront · 50% on delivery', 'Custom designs on request']
    : [`ابتداءً من ${SITE.startingPriceMAD} درهم (30×40 سم)`, 'توصيل مجاني لكل مدن المغرب', '50% مقدماً و50% عند الاستلام', 'تصميم مخصص حسب الطلب'];
  return (
    <section className="max-w-[980px] mx-auto px-5 sm:px-6 py-16 md:py-20 text-center" aria-labelledby="brand-intro-title">
      <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">{en ? 'About the gallery' : 'عن المعرض'}</p>
      <h2 id="brand-intro-title" className="font-serif text-3xl md:text-5xl text-[#1D1D1D] dark:text-[#F4F1E9] leading-tight">
        {en ? 'What is PITSIKY?' : 'ما هي بيتسيكي؟'}
      </h2>
      <p className="mt-5 text-base md:text-lg leading-8 text-[#5f5a52] dark:text-[#bdb9ad]">{BRAND_DESCRIPTION[en ? 'en' : 'ar']}</p>
      <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
        {facts.map((f) => (
          <li key={f} className="px-4 py-2 rounded-full text-sm border border-[#FF6A00]/30 bg-[#FF6A00]/5 text-[#1D1D1D] dark:text-[#F4F1E9]">{f}</li>
        ))}
      </ul>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-pk px-8 py-3.5 text-sm">{en ? 'Browse all wall art' : 'تصفّح كل اللوحات'}</Link>
        <Link to="/custom" className="px-8 py-3.5 text-sm rounded-xl border border-[#1D1D1D]/20 dark:border-white/20 text-[#1D1D1D] dark:text-[#F4F1E9] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors">
          {en ? 'Order a custom design' : 'اطلب تصميماً مخصصاً'}
        </Link>
      </div>
    </section>
  );
};

export default BrandIntro;
