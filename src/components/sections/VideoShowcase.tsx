import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useSiteSettings, type SiteVideo } from '@/hooks/useSiteSettings';
import { useI18n } from '@/contexts/I18nContext';

const VideoTile: React.FC<{ video: SiteVideo; featured?: boolean }> = ({ video, featured }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reveal, setReveal] = useState(false);

  // Scroll-triggered autoplay: play when at least 55% visible, pause otherwise
  useEffect(() => {
    const el = wrapRef.current;
    const vid = ref.current;
    if (!el || !vid) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setReveal(true);
          if (e.intersectionRatio >= 0.55) {
            vid.play().then(() => setPlaying(true)).catch(() => {});
          } else {
            vid.pause();
            setPlaying(false);
          }
        });
      },
      { threshold: [0, 0.55, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const vid = ref.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); } else { vid.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    const vid = ref.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  const title = (useI18n().lang === 'ar' && video.title_ar) ? video.title_ar : (video.title || video.title_ar);

  return (
    <div
      ref={wrapRef}
      className={`group relative overflow-hidden rounded-2xl bg-black border border-[#FF6A00]/15 shadow-[0_30px_60px_-30px_rgba(255,106,0,0.4)] sr ${reveal ? 'in' : ''} ${
        featured ? 'aspect-video' : 'aspect-[9/13]'
      }`}
    >
      <video
        ref={ref}
        src={video.url}
        poster={video.poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        onClick={toggle}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#FF6A00] via-[#FF9438] to-[#E04E00]" />

      {/* controls */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button onClick={toggleMute} className="h-9 w-9 rounded-full bg-black/55 backdrop-blur text-white flex items-center justify-center hover:bg-[#FF6A00] transition-colors">
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button onClick={toggle} className="h-9 w-9 rounded-full bg-black/55 backdrop-blur text-white flex items-center justify-center hover:bg-[#FF6A00] transition-colors">
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>

      {title && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <p className="font-serif text-white text-lg md:text-xl drop-shadow line-clamp-2" dir="auto">{title}</p>
        </div>
      )}
    </div>
  );
};

const VideoShowcase: React.FC = () => {
  const { settings, loaded } = useSiteSettings();
  const { lang } = useI18n();
  const videos = (settings.videos || []).filter((v) => v.url);

  if (!loaded || videos.length === 0) return null;

  const [featured, ...rest] = videos;

  return (
    <section className="relative overflow-hidden bg-[#0B0B0B] py-24 px-6">
      {/* ember glows */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#FF6A00]/20 blur-[130px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#E04E00]/15 blur-[130px]" />

      <div className="relative max-w-[1400px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.34em] uppercase text-[#FF6A00] mb-4">
            {lang === 'en' ? 'In Motion' : 'فيديوهات'}
          </p>
          <h2 className="font-serif text-4xl md:text-6xl pk-grad-text">
            {lang === 'en' ? 'Watch PITSIKY Come Alive' : 'شاهد إبداعات بيتسيكي'}
          </h2>
          <p className="text-white/70 mt-5 max-w-xl mx-auto">
            {lang === 'en'
              ? 'A cinematic look at our handcrafted pieces — they autoplay as you scroll.'
              : 'لقطات سينمائية للوحاتنا الفاخرة — تشتغل تلقائياً مع التمرير.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoTile video={featured} featured />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
            {rest.slice(0, 2).map((v) => (
              <VideoTile key={v.id} video={v} />
            ))}
            {rest.length === 0 && (
              <div className="hidden lg:flex flex-col justify-center rounded-2xl border border-[#FF6A00]/20 p-8 text-center">
                <span className="deer-bob text-4xl mb-3">🦌</span>
                <p className="text-white/70 text-sm">{lang === 'en' ? 'More videos coming soon.' : 'فيديوهات أخرى قريباً.'}</p>
              </div>
            )}
          </div>
        </div>

        {rest.length > 2 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            {rest.slice(2, 6).map((v) => (
              <VideoTile key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoShowcase;
