// Style cards (16:9) and fallback car-brand category badges for PITSIKY.

const STYLE_IMGS = [
  '',
  '',
  '',
  '',
  '',
  '',
];

export const STYLES: { en: string; ar: string; handle: string; image: string }[] = [
  { en: 'Modern', ar: 'عصري', handle: 'modern', image: STYLE_IMGS[0] },
  { en: 'Minimalist', ar: 'بسيط', handle: 'minimalist-art', image: STYLE_IMGS[1] },
  { en: 'Luxury', ar: 'فاخر', handle: 'luxury-collection', image: STYLE_IMGS[2] },
  { en: '3D Art', ar: 'فن ثلاثي الأبعاد', handle: '3d-art', image: STYLE_IMGS[3] },
  { en: 'Abstract', ar: 'تجريدي', handle: 'abstract-art', image: STYLE_IMGS[4] },
  { en: 'Black & White', ar: 'أبيض وأسود', handle: 'black-and-white', image: STYLE_IMGS[5] },
];

const BRAND_IMGS = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
];

// Fallback brand badges shown when the Owner hasn't created categories yet.
export const BRANDS: { title: string; handle: string; image: string }[] = [
  { title: 'BMW', handle: 'bmw', image: BRAND_IMGS[0] },
  { title: 'Mercedes', handle: 'mercedes', image: BRAND_IMGS[1] },
  { title: 'Porsche', handle: 'porsche', image: BRAND_IMGS[2] },
  { title: 'Volkswagen', handle: 'volkswagen', image: BRAND_IMGS[3] },
  { title: 'Ferrari', handle: 'ferrari', image: BRAND_IMGS[4] },
  { title: 'Lamborghini', handle: 'lamborghini', image: BRAND_IMGS[5] },
  { title: 'Audi', handle: 'audi', image: BRAND_IMGS[6] },
  { title: 'Mercedes AMG', handle: 'mercedes-amg', image: BRAND_IMGS[7] },
];
