import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Moon, Sun, Globe, PackageSearch } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/components/theme-provider';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Header: React.FC = () => {
  const { count, setOpen } = useCart();
  const { theme, setTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const { settings } = useSiteSettings();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDark = theme === 'dark';
  const navItems = [
    { title: lang === 'en' ? 'Home' : 'الرئيسية', to: '/' },
    { title: lang === 'en' ? 'Shop' : 'المتجر', to: '/shop' },
    { title: lang === 'en' ? 'Inspiration' : 'إلهام', to: '/inspiration' },
    { title: lang === 'en' ? 'Contact' : 'اتصل بنا', to: '/contact' },
    { title: lang === 'en' ? 'About' : 'من نحن', to: '/about' },
  ];

  const IconBtn = 'text-[#141414] dark:text-[#F4F1E9] hover:text-[#FF6A00] transition-colors';

  const Logo = ({ small }: { small?: boolean }) =>
    settings.header_logo ? (
      <img src={settings.header_logo} alt="PITSIKY" className={`${small ? 'h-7' : 'h-10'} w-auto object-contain`} />
    ) : (
      <span className={`font-serif ${small ? 'text-xl' : 'text-[26px]'} tracking-[0.32em] text-[#0B0B0B] dark:text-[#F4F1E9]`}>
        PITS<span className="text-[#FF6A00]">IKY</span>
      </span>
    );

  const LangPill = () => (
    <button
      onClick={toggleLang}
      className="group relative inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/5 hover:bg-[#FF6A00] hover:border-[#FF6A00] transition-all"
      aria-label="Switch language"
    >
      <Globe size={15} className="text-[#FF6A00] group-hover:text-white transition-colors" />
      <span className="text-[11px] font-bold tracking-[0.08em] text-[#141414] dark:text-[#F4F1E9] group-hover:text-white transition-colors">
        {lang === 'en' ? 'AR | عربي' : 'EN | English'}
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40">
      <div
        className={`transition-all duration-300 border-b ${
          scrolled
            ? 'bg-white/90 dark:bg-[#0B0B0B]/90 backdrop-blur-xl border-[#eee] dark:border-[#1c1c1c] shadow-[0_8px_30px_-18px_rgba(0,0,0,0.4)]'
            : 'bg-[#FAF7F2] dark:bg-[#0B0B0B] border-[#ece6db] dark:border-[#161616]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className={`flex items-center justify-between transition-all ${scrolled ? 'h-16' : 'h-20'}`}>
            <button className={`lg:hidden ${IconBtn}`} onClick={() => setMenu(true)} aria-label="Menu">
              <Menu size={22} />
            </button>

            <Link to="/" className="flex-1 lg:flex-none text-center lg:text-left flex items-center justify-center lg:justify-start">
              <Logo small={scrolled} />
            </Link>

            <nav className="hidden lg:flex items-center gap-9 mx-auto">
              {navItems.map((c) => (
                <Link
                  key={c.title}
                  to={c.to}
                  className="relative text-[12.5px] tracking-[0.08em] uppercase text-[#4a4a4a] dark:text-[#bdb9ad] hover:text-[#FF6A00] dark:hover:text-[#FF9438] transition-colors after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#FF6A00] after:transition-all after:duration-300"
                >
                  {c.title}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3.5">
              <LangPill />
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={IconBtn} aria-label="Toggle dark mode">
                {isDark ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <Link to="/custom" className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.1em] uppercase text-white bg-gradient-to-r from-[#FF6A00] to-[#E04E00] hover:shadow-[0_10px_28px_-10px_rgba(255,106,0,0.7)] hover:-translate-y-0.5 transition-all" aria-label="Custom design">
                {lang === 'en' ? 'Custom' : 'تصميم مخصص'}
              </Link>
              <Link to="/track" className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold tracking-wide ${IconBtn}`} aria-label="Track order">
                <PackageSearch size={18} />
                <span className="hidden md:inline">{t('track.nav')}</span>
              </Link>
              <button onClick={() => setOpen(true)} className={`relative ${IconBtn}`} aria-label="Cart">
                <ShoppingBag size={20} />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6A00] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#FAF7F2] dark:bg-[#0B0B0B] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              {settings.header_logo ? (
                <img src={settings.header_logo} alt="PITSIKY" className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-serif text-xl tracking-[0.28em] text-[#0B0B0B] dark:text-[#F4F1E9]">
                  PITS<span className="text-[#FF6A00]">IKY</span>
                </span>
              )}
              <button onClick={() => setMenu(false)} className="text-[#141414] dark:text-[#F4F1E9]"><X size={22} /></button>
            </div>
            <nav className="flex flex-col gap-5">
              {navItems.map((c) => (
                <Link key={c.title} to={c.to} onClick={() => setMenu(false)} className="text-[15px] text-[#141414] dark:text-[#F4F1E9] hover:text-[#FF6A00]">
                  {c.title}
                </Link>
              ))}
              <Link to="/custom" onClick={() => setMenu(false)} className="flex items-center gap-2 text-[15px] font-bold text-[#FF6A00]">
                {lang === 'en' ? 'Custom design' : 'تصميم مخصص'}
              </Link>
              <Link to="/track" onClick={() => setMenu(false)} className="flex items-center gap-2 text-[15px] font-medium text-[#E04E00] dark:text-[#FF9438]">
                <PackageSearch size={17} /> {t('track.nav')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
