// Style cards (16:9) and fallback car-brand category badges for PITSIKY.

const STYLE_IMGS = [
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090311555_94dd627f.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090312576_a0ae6c3d.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090315287_cd8cb254.png',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090315550_414064c2.png',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090317530_2b66f0da.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090321633_7b6b054c.png',
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
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090339699_82114f59.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090341846_279ed566.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090341813_18d660b8.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090345357_1cd5328c.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090342089_7cf1755a.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090347123_fe7e9cc3.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090348753_fd65cfdd.png',
  'https://d64gsuwffb70l.cloudfront.net/6a38876cda43ec53fca90041_1782090348396_33140114.png',
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
