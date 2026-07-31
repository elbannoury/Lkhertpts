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

export interface Partner {
  name: string;
  name_ar?: string;
  logo: string;
  link?: string;
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
  popup_enabled?: boolean;
  popup_title?: string | null;
  popup_title_ar?: string | null;
  popup_subtitle?: string | null;
  popup_subtitle_ar?: string | null;
  popup_image?: string | null;
  popup_cta_label?: string | null;
  popup_cta_label_ar?: string | null;
  popup_cta_link?: string | null;
  popup_discount_code?: string | null;
  popup_delay_seconds?: number;
  popup_frequency?: 'once' | 'every_visit';
  help_widget_enabled?: boolean;
  help_widget_message?: string | null;
  help_widget_message_ar?: string | null;
  help_widget_button_label?: string | null;
  help_widget_button_label_ar?: string | null;
  help_widget_button_link?: string | null;
  help_widget_allow_reply?: boolean;
  partners_enabled?: boolean;
  partners_title?: string | null;
  partners_title_ar?: string | null;
  partners?: Partner[];
}

const COLS =
  'header_logo,footer_logo,favicon,hero_image,videos,news_enabled,news_text,news_text_ar,news_image,' +
  'hero_eyebrow,hero_title1,hero_title2,hero_sub,' +
  'featured_enabled,featured_title,featured_title_ar,featured_designs,' +
  'studio_enabled,studio_title,studio_title_ar,studio_images,' +
  'most_loved,style_cards,inspiration_images,fresh_images,' +
  'popup_enabled,popup_title,popup_title_ar,popup_subtitle,popup_subtitle_ar,popup_image,' +
  'popup_cta_label,popup_cta_label_ar,popup_cta_link,popup_discount_code,popup_delay_seconds,popup_frequency,' +
  'help_widget_enabled,help_widget_message,help_widget_message_ar,help_widget_button_label,help_widget_button_label_ar,help_widget_button_link,help_widget_allow_reply,' +
  'partners_enabled,partners_title,partners_title_ar,partners';



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
          popup_enabled: d.popup_enabled === true,
          popup_title: d.popup_title || null,
          popup_title_ar: d.popup_title_ar || null,
          popup_subtitle: d.popup_subtitle || null,
          popup_subtitle_ar: d.popup_subtitle_ar || null,
          popup_image: d.popup_image || null,
          popup_cta_label: d.popup_cta_label || null,
          popup_cta_label_ar: d.popup_cta_label_ar || null,
          popup_cta_link: d.popup_cta_link || null,
          popup_discount_code: d.popup_discount_code || null,
          popup_delay_seconds: d.popup_delay_seconds ?? 2,
          popup_frequency: d.popup_frequency === 'every_visit' ? 'every_visit' : 'once',
          help_widget_enabled: d.help_widget_enabled === true,
          help_widget_message: d.help_widget_message || null,
          help_widget_message_ar: d.help_widget_message_ar || null,
          help_widget_button_label: d.help_widget_button_label || null,
          help_widget_button_label_ar: d.help_widget_button_label_ar || null,
          help_widget_button_link: d.help_widget_button_link || null,
          help_widget_allow_reply: d.help_widget_allow_reply !== false,
          partners_enabled: d.partners_enabled === true,
          partners_title: d.partners_title || null,
          partners_title_ar: d.partners_title_ar || null,
          partners: Array.isArray(d.partners) ? (d.partners as Partner[]) : [],
        });

        setLoaded(true);
      });

    return () => { active = false; };
  }, []);

  return { settings, loaded };
}
