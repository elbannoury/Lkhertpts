import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'ar';

type Dict = Record<string, { en: string; ar: string }>;

const DICT: Dict = {
  'nav.search': { en: 'Search', ar: 'بحث' },
  'nav.cart': { en: 'Cart', ar: 'السلة' },
  'hero.eyebrow': { en: 'PITSIKY · Wall Art Maison', ar: 'بيتسيكي · دار الفن الجداري' },
  'hero.title1': { en: 'Your Walls Tell', ar: 'جدرانك تروي' },
  'hero.title2': { en: 'Your Story.', ar: 'قصتك.' },
  'hero.sub': {
    en: 'Transform empty spaces into art that inspires everyday living.',
    ar: 'حوّل المساحات الفارغة إلى فن يلهم حياتك اليومية.',
  },
  'hero.cta1': { en: 'Explore Collections', ar: 'اكتشف المجموعات' },
  'hero.cta2': { en: 'Visualize On Your Wall', ar: 'جرّبها على جدارك' },
  'cat.eyebrow': { en: 'Curated by Brand', ar: 'مختارة حسب العلامة' },
  'cat.title': { en: 'Shop by Category', ar: 'تسوّق حسب الفئة' },
  'styles.eyebrow': { en: 'Find Your Aesthetic', ar: 'اعثر على ذوقك' },
  'styles.title': { en: 'Shop by Style', ar: 'تسوّق حسب الأسلوب' },
  'best.eyebrow': { en: 'Most Loved', ar: 'الأكثر تفضيلاً' },
  'best.title': { en: 'Best Sellers', ar: 'الأكثر مبيعاً' },
  'new.eyebrow': { en: 'Fresh Discoveries', ar: 'إصدارات جديدة' },
  'new.title': { en: 'New Arrivals', ar: 'وصل حديثاً' },
  'limited.eyebrow': { en: 'Collectors Experience', ar: 'تجربة المقتنين' },
  'limited.title': { en: 'Limited Editions', ar: 'إصدارات محدودة' },
  'limited.sub': {
    en: 'Exclusive numbered works, each accompanied by a certificate of authenticity.',
    ar: 'أعمال مرقّمة حصرية، كل قطعة مصحوبة بشهادة أصالة.',
  },
  'limited.cta': { en: 'Discover the Collection', ar: 'اكتشف المجموعة' },
  'footer.tagline': {
    en: 'Where inspiration meets emotion. Transforming empty walls into beautiful stories across Morocco.',
    ar: 'حيث يلتقي الإلهام بالعاطفة. نحوّل الجدران الفارغة إلى قصص جميلة في كل أنحاء المغرب.',
  },
  'footer.collections': { en: 'Collections', ar: 'المجموعات' },
  'footer.maison': { en: 'Maison', ar: 'الدار' },
  'footer.join': { en: 'Join the Gallery', ar: 'انضم إلى المعرض' },
  'footer.email': { en: 'Email address', ar: 'البريد الإلكتروني' },
  'footer.phone': { en: 'Phone number (optional)', ar: 'رقم الهاتف (اختياري)' },
  'footer.subscribe': { en: 'Subscribe', ar: 'اشترك' },
  'footer.welcome': { en: 'Welcome to PITSIKY. Inspiration awaits in your inbox.', ar: 'مرحباً بك في بيتسيكي. الإلهام بانتظارك في بريدك.' },
  'track.nav': { en: 'Track Order', ar: 'تتبّع الطلب' },
  'track.title': { en: 'Track Your Order', ar: 'تتبّع طلبك' },
  'track.sub': { en: 'Enter your order number to follow its journey in real time.', ar: 'أدخل رقم طلبك لمتابعة رحلته لحظة بلحظة.' },
  'track.number': { en: 'Order number (e.g. A1B2C3D4)', ar: 'رقم الطلب (مثال A1B2C3D4)' },
  'track.contact': { en: 'Phone or email on the order', ar: 'الهاتف أو البريد المسجّل بالطلب' },
  'track.btn': { en: 'Track', ar: 'تتبّع' },
  'track.searching': { en: 'Searching…', ar: 'جارٍ البحث…' },
  'track.notfound': { en: 'No order found. Check your number and try again.', ar: 'لم يتم العثور على الطلب. تحقق من الرقم وحاول مجدداً.' },
};


interface I18nCtx {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: 'en', dir: 'ltr', toggleLang: () => {}, setLang: () => {}, t: (k) => k,
});

export const useI18n = () => useContext(Ctx);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('pts_lang');
      if (s === 'ar' || s === 'en') return s;
    }
    return 'en';
  });

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('pts_lang', lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState((p) => (p === 'en' ? 'ar' : 'en'));
  const t = (key: string) => DICT[key]?.[lang] ?? key;

  return (
    <Ctx.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', toggleLang, setLang, t }}>
      {children}
    </Ctx.Provider>
  );
};
