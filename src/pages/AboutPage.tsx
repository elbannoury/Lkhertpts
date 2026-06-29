import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Palette, Truck, ShieldCheck } from 'lucide-react';
import Shell from '@/components/Shell';
import { useI18n } from '@/contexts/I18nContext';

const AboutPage: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  const values = [
    { icon: Palette, t: en ? 'Handcrafted Design' : 'تصميم يدوي', d: en ? 'Every poster is composed by our artists, then refined for museum-grade printing.' : 'كل لوحة يصممها فنانونا بعناية لطباعة فاخرة.' },
    { icon: Sparkles, t: en ? 'Premium Materials' : 'مواد فاخرة', d: en ? 'Archival inks and heavyweight matte papers that keep their colour for decades.' : 'أحبار أرشيفية وورق فاخر يحافظ على الألوان لسنوات.' },
    { icon: Truck, t: en ? 'Free Shipping' : 'شحن مجاني', d: en ? 'Carefully packaged and delivered to your door at no extra cost.' : 'تغليف آمن وتوصيل مجاني إلى باب منزلك.' },
    { icon: ShieldCheck, t: en ? 'Satisfaction First' : 'رضاك أولاً', d: en ? 'A free design consultation and friendly support on every order.' : 'استشارة تصميم مجانية ودعم ودود لكل طلب.' },
  ];

  return (
    <Shell>
      <section className="relative mesh-bg py-28 px-6 text-center">
        <div className="absolute inset-0 bg-[#0B0B0B]/45" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-4">{en ? 'Our Story' : 'قصتنا'}</p>
          <h1 className="font-serif text-4xl md:text-6xl pk-grad-text mb-6">PITSIKY</h1>
          <p className="text-white/85 text-lg leading-relaxed">
            {en
              ? 'PITSIKY is a Moroccan atelier crafting luxury wall art for homes that tell a story. We blend bold contemporary design with timeless craftsmanship — turning blank walls into statements.'
              : 'بيتسيكي هو أتيليه مغربي يصنع لوحات فنية فاخرة للجدران. نمزج التصميم العصري الجريء بالحرفية الراقية لنحوّل جدرانك إلى تحفة.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-9">
            <Link to="/shop" className="btn-pk px-9 py-3.5 text-sm uppercase">{en ? 'Shop the Gallery' : 'تسوّق الآن'}</Link>
            <Link to="/custom" className="btn-pk-ghost px-9 py-3.5 text-sm uppercase">{en ? 'Custom Design' : 'تصميم مخصص'}</Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.t} className="bg-white dark:bg-[#121212] border border-[#eee] dark:border-[#1f1f1f] rounded-2xl p-7 text-center lux-card">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FF6A00]/10 flex items-center justify-center mb-4">
                <v.icon size={22} className="text-[#FF6A00]" />
              </div>
              <h3 className="font-serif text-lg mb-2 text-[#1D1D1D] dark:text-[#F4F1E9]">{v.t}</h3>
              <p className="text-sm text-[#7a7a7a] dark:text-[#9b9b9b] leading-relaxed">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0B0B0B] py-20 text-center border-t border-[#FF6A00]/20">
        <h2 className="font-serif text-3xl md:text-4xl pk-grad-text mb-4">{en ? 'Ready to transform your space?' : 'جاهز لتغيير مساحتك؟'}</h2>
        <Link to="/contact" className="inline-block btn-pk px-10 py-4 text-xs uppercase mt-4">{en ? 'Get in touch' : 'تواصل معنا'}</Link>
      </section>
    </Shell>
  );
};

export default AboutPage;
