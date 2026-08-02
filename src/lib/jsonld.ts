import { SITE_URL } from '@/components/SEO';

// يبني JSON-LD من نوع Organization — يُستخدم في الصفحة الرئيسية فقط
// Builds Organization JSON-LD — used on the homepage only
export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PITSIKY Art Gallery',
  url: SITE_URL,
  logo: 'https://srzxzpwispudxldqjjah.supabase.co/storage/v1/object/public/pts-media/logo/1783556121967-ebph2m.png',
  sameAs: [],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
  },
});

interface ProductJsonLdInput {
  name: string;
  description?: string;
  image?: string[];
  handle: string;
  price: number; // in cents
  currency?: string;
  sku?: string;
  inStock?: boolean;
  ratingValue?: number;
  reviewCount?: number;
}

// يبني JSON-LD من نوع Product — يُستخدم في كل صفحة منتج
// Builds Product JSON-LD — used on every product page
export const buildProductJsonLd = ({
  name,
  description,
  image,
  handle,
  price,
  currency = 'MAD',
  sku,
  inStock = true,
  ratingValue,
  reviewCount,
}: ProductJsonLdInput) => {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || name,
    image: image && image.length ? image : undefined,
    sku: sku || handle,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${handle}`,
      priceCurrency: currency,
      price: (price / 100).toFixed(2),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
    };
  }

  return schema;
};
