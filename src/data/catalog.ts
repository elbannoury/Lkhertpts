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
  { name: 'Living Room', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081088053_ba913050.jpg' },
  { name: 'Bedroom', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081216281_85534237.jpg' },
  { name: 'Office', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081219783_148b4e9c.png' },
  { name: 'Dining Room', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081216714_872a1f96.jpg' },
  { name: 'Entryway', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081221437_4d42ddf3.png' },
  { name: 'Kids Room', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081187193_9ee25eff.png' },
  { name: 'Kitchen', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081158688_b08e5974.png' },
  { name: 'Gaming Room', image: 'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081110708_431c018e.png' },
];

export const HERO_IMAGE =
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081088053_ba913050.jpg';

export const INSPIRATION_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081216281_85534237.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081219783_148b4e9c.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081216714_872a1f96.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081221437_4d42ddf3.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3865af3eeee9d3bbe8a286_1782081088053_ba913050.jpg',
];

export const formatMAD = (cents: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(
    cents / 100,
  );
