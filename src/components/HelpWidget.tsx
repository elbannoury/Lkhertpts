import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Check } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { submitHelpWidgetMessage } from '@/lib/helpWidget';

const TEASER_DISMISSED_KEY = 'pts_help_widget_teaser_dismissed_v1';

/**
 * Floating help bubble, fully owner-controlled from Owner Admin → Settings →
 * "Help bubble": custom message, optional CTA button + link, and an optional
 * inline reply form whose submissions show up in the owner's Messages tab.
 */
const HelpWidget: React.FC = () => {
  const { lang } = useI18n();
  const { settings, loaded } = useSiteSettings();
  const [showTeaser, setShowTeaser] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loaded || !settings.help_widget_enabled) return;
    if (sessionStorage.getItem(TEASER_DISMISSED_KEY) === '1') return;
    const t = setTimeout(() => setShowTeaser(true), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.help_widget_enabled]);

  if (!loaded || !settings.help_widget_enabled) return null;

  const text = (lang === 'ar' ? settings.help_widget_message_ar : settings.help_widget_message) || settings.help_widget_message || '';
  const ctaLabel = (lang === 'ar' ? settings.help_widget_button_label_ar : settings.help_widget_button_label) || settings.help_widget_button_label;
  const allowReply = settings.help_widget_allow_reply !== false;

  const dismissTeaser = () => {
    setShowTeaser(false);
    sessionStorage.setItem(TEASER_DISMISSED_KEY, '1');
  };

  const openPanel = () => {
    setShowTeaser(false);
    sessionStorage.setItem(TEASER_DISMISSED_KEY, '1');
    setOpen(true);
  };

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setErr('');
    try {
      await submitHelpWidgetMessage({ name, contact, message: message.trim() });
      setSent(true);
      setMessage('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed z-40 bottom-24 md:bottom-6 right-4 md:right-6 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2rem)] max-w-sm bg-[#FBF8F2] dark:bg-[#141414] text-[#141414] dark:text-[#F4F1E9] rounded-2xl shadow-2xl overflow-hidden border border-black/5">
          <div className="flex items-start justify-between p-4 pb-2">
            <p className="font-serif text-base leading-snug pr-4">{text}</p>
            <button onClick={() => setOpen(false)} className="shrink-0 text-[#999] hover:text-[#141414] dark:hover:text-white">
              <X size={18} />
            </button>
          </div>

          {ctaLabel && settings.help_widget_button_link && (
            <div className="px-4 pb-3">
              <Link
                to={settings.help_widget_button_link}
                onClick={() => setOpen(false)}
                className="block text-center bg-[#1D1D1D] text-white dark:bg-[#F4F1E9] dark:text-[#141414] rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.2em]"
              >
                {ctaLabel}
              </Link>
            </div>
          )}

          {allowReply && (
            <div className="px-4 pb-4 pt-1 border-t border-black/5">
              {sent ? (
                <div className="flex items-center gap-2 text-sm text-[#2E7D32] py-2">
                  <Check size={16} /> {lang === 'ar' ? 'تم إرسال رسالتك، سنتواصل معك قريبًا.' : 'Sent — we\u2019ll get back to you soon.'}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'ar' ? 'الاسم (اختياري)' : 'Name (optional)'}
                      className="border border-[#ddd] dark:border-[#333] bg-transparent rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={lang === 'ar' ? 'رقم / إيميل (اختياري)' : 'Phone / email (optional)'}
                      className="border border-[#ddd] dark:border-[#333] bg-transparent rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message...'}
                    className="w-full border border-[#ddd] dark:border-[#333] bg-transparent rounded-lg px-3 py-2 text-sm resize-none"
                  />
                  {err && <p className="text-xs text-red-500">{err}</p>}
                  <button
                    onClick={send}
                    disabled={!message.trim() || sending}
                    className="w-full flex items-center justify-center gap-2 bg-[#1D1D1D] text-white dark:bg-[#F4F1E9] dark:text-[#141414] rounded-full py-2.5 text-xs uppercase tracking-[0.2em] disabled:opacity-40"
                  >
                    <Send size={13} /> {sending ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : lang === 'ar' ? 'إرسال' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!open && showTeaser && text && (
        <div className="max-w-[240px] bg-[#FBF8F2] dark:bg-[#141414] text-[#141414] dark:text-[#F4F1E9] rounded-2xl rounded-br-sm shadow-xl px-4 py-3 flex items-start gap-2 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300" onClick={openPanel}>
          <p className="text-sm leading-snug flex-1">{text}</p>
          <button
            onClick={(e) => { e.stopPropagation(); dismissTeaser(); }}
            className="shrink-0 text-[#999] hover:text-[#141414] dark:hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!open && (
        <button
          onClick={openPanel}
          aria-label="Help"
          className="w-14 h-14 rounded-full bg-[#1D1D1D] dark:bg-[#F4F1E9] text-white dark:text-[#141414] shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle size={22} />
        </button>
      )}
    </div>
  );
};

export default HelpWidget;
