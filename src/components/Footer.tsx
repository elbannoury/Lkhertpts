import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/data/catalog';
import { useI18n } from '@/contexts/I18nContext';
import { crmSubscribe } from '@/lib/constants';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState(true);
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await crmSubscribe({
      email,
      phone: phone || undefined,
      sms_opt_in: sms === true,
      source: 'footer-signup',
      tags: ['newsletter'],
    });
    setDone(true);
    setEmail('');
    setPhone('');
  };


  const link = 'hover:text-[#C9A23F] transition-colors';

  return (
    <footer className="bg-[#0C0C0C] text-[#cfcfcf] mt-32 border-t border-[#1c1c1c]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            {settings.footer_logo ? (
              <img src={settings.footer_logo} alt="PITSIKY" className="h-12 w-auto object-contain" />
            ) : (
              <span className="font-serif text-2xl tracking-[0.25em] text-white">PITS<span className="text-[#C9A23F]">IKY</span></span>
            )}
            <p className="mt-5 text-sm leading-relaxed text-[#9a9a9a] max-w-xs">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase mb-5">{t('footer.collections')}</h4>
            <ul className="space-y-3 text-sm">
              {CATEGORIES.filter((c, i, a) => a.findIndex((x) => x.title === c.title) === i).slice(0, 6).map((c) => (
                <li key={c.title}><Link to={`/collections/${c.handle}`} className={link}>{c.title}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase mb-5">{t('footer.maison')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/collections/limited-editions" className={link}>{t('limited.title')}</Link></li>
              <li><Link to="/collections/luxury-collection" className={link}>Luxury Collection</Link></li>
              <li><Link to="/collections/new-arrivals" className={link}>{t('new.title')}</Link></li>
              <li><span className="text-[#9a9a9a]">Free delivery in Morocco</span></li>
              <li><span className="text-[#9a9a9a]">Certificate of authenticity</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase mb-5">{t('footer.join')}</h4>
            {done ? (
              <p className="text-sm text-[#C9A23F]">{t('footer.welcome')}</p>
            ) : (
              <form onSubmit={subscribe} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('footer.email')}
                  className="w-full bg-transparent border-b border-[#444] py-2 text-sm text-white placeholder-[#777] focus:border-[#C9A23F] outline-none" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('footer.phone')}
                  className="w-full bg-transparent border-b border-[#444] py-2 text-sm text-white placeholder-[#777] focus:border-[#C9A23F] outline-none" />
                <label className="flex items-start gap-2 text-[11px] text-[#888] leading-snug">
                  <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5" />
                  <span>Text me inspiration. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
                </label>
                <button className="text-xs tracking-[0.2em] uppercase text-white border-b border-[#C9A23F] pb-1 hover:text-[#C9A23F] transition-colors">
                  {t('footer.subscribe')}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#222] flex flex-col sm:flex-row justify-between gap-4 text-xs text-[#777]">
          <span>© {new Date().getFullYear()} PITSIKY — Casablanca, Morocco</span>
          <span className="text-[#C9A23F]">Gold · Black · Inspiring</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
