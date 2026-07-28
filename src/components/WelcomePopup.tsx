import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Copy, Check } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const STORAGE_KEY = 'pts_welcome_popup_seen_v1';

/**
 * Owner-controlled "welcome" popup shown to first-time visitors.
 * Fully configured from Owner Admin → Settings → Welcome Popup:
 *   - enabled / disabled
 *   - title, subtitle, image, discount code, CTA button + link
 *   - delay before it appears
 *   - "once per visitor" vs "every visit"
 * Nothing renders at all while settings haven't loaded or when the owner
 * has it turned off, so there is zero cost for sites that don't use it.
 */
const WelcomePopup: React.FC = () => {
  const { lang } = useI18n();
  const { settings, loaded } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loaded || !settings.popup_enabled) return;
    const alreadySeen = settings.popup_frequency !== 'every_visit' && localStorage.getItem(STORAGE_KEY) === '1';
    if (alreadySeen) return;

    const delay = Math.max(0, Number(settings.popup_delay_seconds ?? 2)) * 1000;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.popup_enabled]);

  const close = () => {
    setOpen(false);
    if (settings.popup_frequency !== 'every_visit') localStorage.setItem(STORAGE_KEY, '1');
  };

  const copyCode = async () => {
    if (!settings.popup_discount_code) return;
    try {
      await navigator.clipboard.writeText(settings.popup_discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable — ignore */
    }
  };

  if (!open) return null;

  const title = (lang === 'ar' ? settings.popup_title_ar : settings.popup_title) || settings.popup_title || '';
  const subtitle =
    (lang === 'ar' ? settings.popup_subtitle_ar : settings.popup_subtitle) || settings.popup_subtitle || '';
  const ctaLabel =
    (lang === 'ar' ? settings.popup_cta_label_ar : settings.popup_cta_label) ||
    settings.popup_cta_label ||
    (lang === 'ar' ? 'تسوّق الآن' : 'Shop now');
  const ctaLink = settings.popup_cta_link || '/shop';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-[#FBF8F2] dark:bg-[#141414] text-[#141414] dark:text-[#F4F1E9] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {settings.popup_image && (
          <div className="w-full h-44 sm:h-56 overflow-hidden">
            <img src={settings.popup_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8 text-center">
          {title && <h2 className="font-serif text-2xl sm:text-3xl mb-2 leading-tight">{title}</h2>}
          {subtitle && <p className="text-sm text-[#6b6b6b] dark:text-[#c9c9c9] mb-5">{subtitle}</p>}

          {settings.popup_discount_code && (
            <button
              onClick={copyCode}
              className="mb-5 inline-flex items-center gap-2 border border-dashed border-[#6E44FF] text-[#6E44FF] rounded-full px-4 py-2 text-sm tracking-wide"
            >
              {settings.popup_discount_code}
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}

          <Link
            to={ctaLink}
            onClick={close}
            className="inline-block w-full sm:w-auto bg-[#141414] text-white dark:bg-[#F4F1E9] dark:text-[#141414] rounded-full px-8 py-3 text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
