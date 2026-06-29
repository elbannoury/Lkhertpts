import React from 'react';
import Shell from '@/components/Shell';
import { Sparkles, Upload, ImageIcon, Wand2, Clock } from 'lucide-react';

// AI Wall Preview — temporarily disabled. We present the page as a polished
// "coming soon" teaser: the underlying tool mock-ups are rendered blurred behind
// a frosted-glass overlay so visitors can see what's on the way.
const Visualize: React.FC = () => {
  return (
    <Shell>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-16">
        <p className="text-xs tracking-[0.3em] uppercase text-[#6E44FF] mb-3 text-center">AI Wall Preview</p>
        <h1 className="font-serif text-4xl md:text-5xl text-center mb-4">شوف اللوحة على حيطك</h1>
        <p className="text-[#8D8D8D] text-center max-w-lg mx-auto mb-12">
          أداة الذكاء الاصطناعي اللي كتركّب اللوحة على حيطك غادي تكون متاحة قريباً. تسنانا!
        </p>

        {/* Frosted preview: real-looking sections blurred behind a SOON overlay */}
        <div className="relative rounded-2xl overflow-hidden border border-[#eee] bg-white">
          {/* Blurred mock content */}
          <div className="p-6 md:p-10 blur-md select-none pointer-events-none" aria-hidden="true">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-[#9b8a5a] mb-3">1 · صورة الحائط</p>
                <div className="border-2 border-dashed border-[#ddd] rounded-xl aspect-[4/3] flex items-center justify-center bg-[#F7F4EF]">
                  <span className="text-center">
                    <Upload className="mx-auto mb-3 text-[#6E44FF]" />
                    <span className="text-sm text-[#6b6b6b] block">ارفع صورة حائطك</span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-[#9b8a5a] mb-3">2 · اختر منتجاً</p>
                <div className="border border-[#eee] rounded-xl p-3 aspect-[4/3] bg-white">
                  <div className="grid grid-cols-3 gap-2.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-[#F2ECE6] to-[#e7ddcf] flex items-center justify-center">
                        <ImageIcon size={18} className="text-[#cbb89a]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6A00] to-[#E04E00] text-white px-9 py-4 rounded-xl text-sm tracking-[0.15em] uppercase">
                <Wand2 size={17} /> أنشئ المعاينة بالذكاء الاصطناعي
              </span>
            </div>
            <div className="bg-[#F2ECE6] rounded-xl aspect-[16/7]" />
          </div>

          {/* SOON overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 backdrop-blur-sm">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1D1D1D] text-white text-[11px] tracking-[0.3em] uppercase mb-5">
              <Clock size={13} /> Coming Soon
            </span>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#E04E00] flex items-center justify-center mb-5 shadow-lg">
              <Sparkles className="text-white" size={28} />
            </div>
            <h2 className="font-serif text-5xl md:text-6xl text-[#1D1D1D] tracking-tight">SOON</h2>
            <p className="text-[#6b6b6b] text-sm mt-3 max-w-sm text-center px-6">
              قريباً غادي تقدر ترفع صورة حيطك وتشوف أي لوحة من المتجر مركّبة عليها بالذكاء الاصطناعي.
            </p>
          </div>
        </div>

        {/* What you'll be able to do */}
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Upload, t: 'ارفع حيطك', d: 'صورة واحدة كافية لتبدأ.' },
            { icon: ImageIcon, t: 'اختر لوحة', d: 'من منتجات المتجر المتاحة.' },
            { icon: Wand2, t: 'شوف النتيجة', d: 'معاينة واقعية على حيطك.' },
          ].map((s) => (
            <div key={s.t} className="bg-white border border-[#eee] rounded-xl p-5 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-[#F2ECE6] flex items-center justify-center mb-3">
                <s.icon size={18} className="text-[#6E44FF]" />
              </div>
              <p className="font-medium mb-1">{s.t}</p>
              <p className="text-sm text-[#8D8D8D]">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="/shop" className="inline-flex items-center gap-2 bg-[#1D1D1D] text-white px-7 py-3.5 rounded-lg text-sm tracking-[0.15em] uppercase hover:bg-[#6E44FF] transition-colors">
            تصفّح المتجر
          </a>
        </div>
      </div>
    </Shell>
  );
};

export default Visualize;
