import React, { useRef, useState } from 'react';
import { Pause, Play, RotateCw } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const StudioSection: React.FC = () => {
  const { lang } = useI18n();
  const { settings } = useSiteSettings();
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(0);
  const dragRef = useRef<{ x: number; base: number } | null>(null);

  if (settings.studio_enabled === false) return null;
  const images = (settings.studio_images || []).filter(Boolean).slice(0, 12);
  if (images.length === 0) return null;

  const title = lang === 'ar'
    ? (settings.studio_title_ar || settings.studio_title || 'دائمًا جديد')
    : (settings.studio_title || 'Always Fresh');

  const n = images.length;
  const angle = 360 / n;
  // translateZ radius so faces sit on a circle
  const radius = Math.round((120 / Math.tan(Math.PI / n)) + 60);

  const onDown = (clientX: number) => { dragRef.current = { x: clientX, base: manual }; setPaused(true); };
  const onMove = (clientX: number) => {
    if (!dragRef.current) return;
    const delta = (clientX - dragRef.current.x) * 0.4;
    setManual(dragRef.current.base + delta);
  };
  const onUp = () => { dragRef.current = null; };

  return (
    <section className="relative overflow-hidden bg-[#0B0B0B] py-28 px-6 border-t border-[#FF6A00]/15">
      <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-[#E04E00]/20 blur-[130px]" />
      <div className="relative max-w-[1100px] mx-auto text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">PITSIKY · STUDIO</p>
        <h2 className="font-serif text-4xl md:text-5xl pk-grad-text mb-3">{title}</h2>
        <p className="text-white/60 mb-14 max-w-md mx-auto">
          {lang === 'ar' ? 'لقطات من داخل الأستوديو — اسحب أو دع الدائرة تدور تلقائيًا.' : 'Behind the scenes — drag to spin, or let it rotate automatically.'}
        </p>

        <div
          className="studio-stage py-10 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => onDown(e.clientX)}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={(e) => onDown(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={onUp}
        >
          <div
            className={`studio-ring ${paused ? 'paused' : ''}`}
            style={paused ? { transform: `rotateY(${manual}deg)` } : undefined}
          >
            {images.map((src, i) => (
              <div
                key={i}
                className="studio-face"
                style={{ transform: `rotateY(${i * angle}deg) translateZ(${radius}px)` }}
              >
                <img src={src} alt={`Studio ${i + 1}`} loading="lazy" draggable={false} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-10">
          <button
            onClick={() => { setPaused((p) => !p); }}
            className="inline-flex items-center gap-2 btn-pk-ghost px-6 py-3 text-xs uppercase"
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
            {paused ? (lang === 'ar' ? 'تشغيل تلقائي' : 'Auto rotate') : (lang === 'ar' ? 'إيقاف / يدوي' : 'Pause / manual')}
          </button>
          {paused && (
            <button
              onClick={() => setManual((m) => m + angle)}
              className="inline-flex items-center gap-2 btn-pk px-6 py-3 text-xs uppercase"
            >
              <RotateCw size={15} /> {lang === 'ar' ? 'التالي' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default StudioSection;
