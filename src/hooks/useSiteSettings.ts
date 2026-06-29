import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface SiteVideo {
  id: string;
  title?: string;
  title_ar?: string;
  url: string;
  poster?: string;
}

export interface FeaturedDesign {
  image: string;
  link?: string;
}

export interface StyleCard {
  image: string;
  label?: string;
  label_ar?: string;
  handle?: string;
}

export interface SiteSettings {
  header_logo?: string | null;
  footer_logo?: string | null;
  favicon?: string | null;
  hero_image?: string | null;
  videos?: SiteVideo[];
  news_enabled?: boolean;
  news_text?: string | null;
  news_text_ar?: string | null;
  news_image?: string | null;
  hero_eyebrow?: string | null;
  hero_title1?: string | null;
  hero_title2?: string | null;
  hero_sub?: string | null;
  featured_enabled?: boolean;
  featured_title?: string | null;
  featured_title_ar?: string | null;
  featured_designs?: FeaturedDesign[];
  studio_enabled?: boolean;
  studio_title?: string | null;
  studio_title_ar?: string | null;
  studio_images?: string[];
  most_loved?: string[];
  style_cards?: StyleCard[];
  inspiration_images?: string[];
  fresh_images?: string[];
}

const COLS =
  'header_logo,footer_logo,favicon,hero_image,videos,news_enabled,news_text,news_text_ar,news_image,' +
  'hero_eyebrow,hero_title1,hero_title2,hero_sub,' +
  'featured_enabled,featured_title,featured_title_ar,featured_designs,' +
  'studio_enabled,studio_title,studio_title_ar,studio_images,' +
  'most_loved,style_cards,inspiration_images,fresh_images';


// Dynamically swap the browser-tab favicon to the brand logo
function setFavicon(url: string) {
  if (typeof document === 'undefined' || !url) return;
  try {
    document.querySelectorAll("link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']").forEach((el) => el.parentNode?.removeChild(el));
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = url;
    document.head.appendChild(apple);
  } catch { /* ignore */ }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({ videos: [], news_enabled: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('pts_site_settings')
      .select(COLS)
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const d: any = data || {};
        // Browser-tab icon: prefer a dedicated favicon, fall back to the header logo.
        if (d.favicon || d.header_logo) setFavicon(d.favicon || d.header_logo);
        setSettings({
          header_logo: d.header_logo || null,
          footer_logo: d.footer_logo || null,
          favicon: d.favicon || null,
          hero_image: d.hero_image || null,
          videos: Array.isArray(d.videos) ? (d.videos as SiteVideo[]) : [],
          news_enabled: d.news_enabled !== false,
          news_text: d.news_text ?? 'Handcrafted luxury wall art · Free design consultation',
          news_text_ar: d.news_text_ar ?? 'لوحات فنية فاخرة مصنوعة يدويًا · استشارة تصميم مجانية',
          news_image: d.news_image || null,
          hero_eyebrow: d.hero_eyebrow || null,
          hero_title1: d.hero_title1 || null,
          hero_title2: d.hero_title2 || null,
          hero_sub: d.hero_sub || null,
          featured_enabled: d.featured_enabled !== false,
          featured_title: d.featured_title || null,
          featured_title_ar: d.featured_title_ar || null,
          featured_designs: Array.isArray(d.featured_designs) ? (d.featured_designs as FeaturedDesign[]) : [],
          studio_enabled: d.studio_enabled !== false,
          studio_title: d.studio_title || null,
          studio_title_ar: d.studio_title_ar || null,
          studio_images: Array.isArray(d.studio_images) ? (d.studio_images as string[]) : [],
          most_loved: Array.isArray(d.most_loved) ? (d.most_loved as string[]) : [],
          style_cards: Array.isArray(d.style_cards) ? (d.style_cards as StyleCard[]) : [],
          inspiration_images: Array.isArray(d.inspiration_images) ? (d.inspiration_images as string[]) : [],
          fresh_images: Array.isArray(d.fresh_images) ? (d.fresh_images as string[]) : [],
        });

        setLoaded(true);
      });

    return () => { active = false; };
  }, []);

  return { settings, loaded };
}
