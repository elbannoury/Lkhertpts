import React from 'react';
import { Truck, Wallet, RotateCcw, Palette } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

/** Four reassurance cards (delivery · payment · exchange · custom). Also real, crawlable text. */
const TrustStrip: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';
  const items = [
    { icon: Truck, t: en ? 'Free delivery' : 'توصيل مجاني', s: en ? 'To every city in Morocco · 3–5 days' : 'لكل مدن المغرب · 3 إلى 5 أيام' },
    { icon: Wallet, t: en ? '50% now, 50% on delivery' : '50% الآن و50% عند الاستلام', s: en ? 'Flexible and safe payment' : 'دفع مرن وآمن' },
    { icon: RotateCcw, t: en ? '7-day exchange' : 'استبدال خلال 7 أيام', s: en ? 'Print quality guaranteed' : 'مع ضمان جودة الطباعة' },
    { icon: Palette, t: en ? 'Custom designs' : 'تصميم مخصص', s: en ? 'Turn your idea into wall art' : 'نحوّل فكرتك إلى لوحة فنية' },
  ];
  return (
    <section aria-label={en ? 'Why shop with PITSIKY' : 'لماذا بيتسيكي'} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map(({ icon: Icon, t, s }) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl border border-[#eadfce] dark:border-[#262626] bg-white dark:bg-[#121212] p-3.5 md:p-4 transition-all hover:-translate-y-0.5 hover:border-[#FF6A00]/50 hover:shadow-[0_14px_30px_-18px_rgba(255,106,0,0.5)]">
            <span className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FF6A00]/10 text-[#FF6A00] flex items-center justify-center"><Icon size={19} /></span>
            <span className="min-w-0">
              <span className="block text-[13px] md:text-sm font-semibold text-[#1D1D1D] dark:text-[#F4F1E9] leading-snug">{t}</span>
              <span className="block text-[11px] md:text-xs text-[#8D8D8D] leading-snug mt-0.5">{s}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TrustStrip;
