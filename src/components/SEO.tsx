import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.pitsiky.com';
const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`;
const DEFAULT_DESCRIPTION =
  'PITSIKY transforms empty walls into stunning art with an elegant and luxurious digital experience, focused on wall art and decoration.';

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
 * - <title> و <meta name="description">
 * - <link rel="canonical">
 * - Open Graph / Twitter tags
 * - JSON-LD structured data (اختياري)
 *
 * A single reusable SEO component used on every page to set the title,
 * description, canonical link, Open Graph/Twitter tags, and optional
 * JSON-LD structured data.
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
  const fullTitle = title.includes('PITSIKY') ? title : `${title} | PITSIKY Art Gallery`;
  const canonical = `${SITE_URL}${path}`;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

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
