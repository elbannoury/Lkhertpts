import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useI18n } from '@/contexts/I18nContext';

const SITE_URL = 'https://www.pitsiky.com';
const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`;
// العربية هي اللغة الرئيسية للموقع، لذا الوصف الافتراضي عربي أولاً
// Arabic is the site's primary language, so the default description is Arabic
const DEFAULT_DESCRIPTION =
  'بيتسيكي تحوّل الجدران الفارغة إلى فن يلهم حياتك اليومية، بتجربة رقمية أنيقة وفاخرة متخصصة في اللوحات الجدارية والديكور.';

interface SEOProps {
  /** عنوان الصفحة (بدون اسم الموقع، سيُضاف تلقائياً) */
  title: string;
  description?: string;
  /** المسار النسبي فقط، مثال: /products/vegeta */
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  /** JSON-LD structured data object(s) — يُحقن كـ <script type="application/ld+json"> */
  jsonLd?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

/**
 * مكوّن SEO موحّد يُستخدم في كل صفحة لضبط:
 * - <html lang dir> حسب اللغة الحالية (العربية افتراضياً)
 * - <title> و <meta name="description">
 * - <link rel="canonical"> و hreflang لكل من العربية/الإنجليزية
 * - Open Graph / Twitter tags
 * - JSON-LD structured data (اختياري)
 *
 * A single reusable SEO component used on every page to set the document's
 * lang/dir (Arabic by default), the title, description, canonical link,
 * hreflang alternates, Open Graph/Twitter tags, and optional JSON-LD.
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
  noindex = false,
}) => {
  const { lang } = useI18n();
  const fullTitle = title.includes('PITSIKY') ? title : `${title} | PITSIKY`;
  const canonical = `${SITE_URL}${path}`;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet htmlAttributes={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* الموقع ثنائي اللغة على نفس الرابط (تبديل عبر زر اللغة، وليس روابط
          منفصلة لكل لغة)، لذا نصرّح لجوجل أن هذا الرابط يخدم الجمهورين معاً. */}
      <link rel="alternate" hrefLang="ar" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_MA' : 'en_US'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
export { SITE_URL };
