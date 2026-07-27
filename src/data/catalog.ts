// Shared catalog metadata for PITSIKY — single source of truth.

export const CATEGORIES: { title: string; handle: string }[] = [
  { title: 'Canvas Art', handle: 'canvas-art' },
  { title: 'Framed Prints', handle: 'framed-prints' },
  { title: 'Islamic Wall Art', handle: 'islamic-wall-art' },
  { title: 'Moroccan Art', handle: 'moroccan-art' },
  { title: 'Abstract Art', handle: 'abstract-art' },
  { title: 'Minimalist Art', handle: 'minimalist-art' },
  { title: 'Nature', handle: 'nature' },
  { title: 'Luxury Collection', handle: 'luxury-collection' },
  { title: 'Limited Editions', handle: 'limited-editions' },
];


export const ROOMS: { name: string; image: string }[] = [
  { name: 'Living Room', image: '' },
  { name: 'Bedroom', image: '' },
  { name: 'Office', image: '' },
  { name: 'Dining Room', image: '' },
  { name: 'Entryway', image: '' },
  { name: 'Kids Room', image: '' },
  { name: 'Kitchen', image: '' },
  { name: 'Gaming Room', image: '' },
];

export const HERO_IMAGE =
  '';

export const INSPIRATION_IMAGES = [
  '',
  '',
  '',
  '',
  '',
];

export const formatMAD = (cents: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(
    cents / 100,
  );
