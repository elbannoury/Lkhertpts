import React, { useEffect, useState } from 'react';
import { cms, uploadMedia } from './cms';
import { Image as ImageIcon, Upload, Film, Plus, Trash2, X, Check, Megaphone, Heart, LayoutGrid, Sparkles, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import type { SiteVideo, StyleCard } from '@/hooks/useSiteSettings';

const rid = () => Math.random().toString(36).slice(2, 9);

interface Promo {
  id: string;
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
  image?: string;
  bg?: string;
  accent?: string;
}

const DEFAULT_NEWS = 'Handcrafted luxury wall art · Free design consultation';
const DEFAULT_NEWS_AR = 'لوحات فنية فاخرة مصنوعة يدويًا · استشارة تصميم مجانية';

const SettingsPanel: React.FC = () => {
  // We keep the FULL settings object so saving never wipes fields we don't edit.
  const [s, setS] = useState<any>({ videos: [], news_enabled: true, most_loved: [], style_cards: [], inspiration_images: [], fresh_images: [], promotions: [] });

  const [products, setProducts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    const r = await cms('cms_settings_get');
    const v = r?.settings || {};
    setS({
      ...v,
      videos: Array.isArray(v.videos) ? v.videos : [],
      news_enabled: v.news_enabled !== false,
      news_text: v.news_text ?? '',
      news_text_ar: v.news_text_ar ?? '',
      most_loved: Array.isArray(v.most_loved) ? v.most_loved : [],
      style_cards: Array.isArray(v.style_cards) ? v.style_cards : [],
      inspiration_images: Array.isArray(v.inspiration_images) ? v.inspiration_images : [],
      fresh_images: Array.isArray(v.fresh_images) ? v.fresh_images : [],
      // Promotion cards — normalise so every entry has a stable id.
      promotions: Array.isArray(v.promotions)
        ? v.promotions.map((p: any) => ({ ...p, id: p.id || rid() }))
        : [],
    });

  };
  useEffect(() => {
    load();
    cms('cms_products_list').then((r: any) => setProducts(r?.products || [])).catch(() => {});
  }, []);

  const patch = (p: Record<string, any>) => setS((prev: any) => ({ ...prev, ...p }));

  const uploadLogo = async (field: 'header_logo' | 'footer_logo' | 'favicon', f?: File) => {
    if (!f) return; setUploading(field);
    try { const url = await uploadMedia(f, 'logo'); patch({ [field]: url }); } finally { setUploading(null); }
  };
  const uploadHero = async (f?: File) => {
    if (!f) return; setUploading('hero');
    try { const url = await uploadMedia(f, 'hero'); patch({ hero_image: url }); } finally { setUploading(null); }
  };
  const uploadVideoFile = async (id: string, f?: File) => {
    if (!f) return; setUploading('v-' + id);
    try { const url = await uploadMedia(f, 'video'); setVideo(id, { url }); } finally { setUploading(null); }
  };
  const uploadPoster = async (id: string, f?: File) => {
    if (!f) return; setUploading('p-' + id);
    try { const url = await uploadMedia(f, 'video-poster'); setVideo(id, { poster: url }); } finally { setUploading(null); }
  };

  const setVideo = (id: string, p: Partial<SiteVideo>) =>
    setS((prev: any) => ({ ...prev, videos: prev.videos.map((v: SiteVideo) => (v.id === id ? { ...v, ...p } : v)) }));
  const addVideo = () => setS((prev: any) => ({ ...prev, videos: [...prev.videos, { id: rid(), title: '', url: '' }] }));
  const removeVideo = (id: string) => setS((prev: any) => ({ ...prev, videos: prev.videos.filter((v: SiteVideo) => v.id !== id) }));

  // ── Generic image gallery (inspiration / always fresh) ──────────────
  const uploadToGallery = async (key: 'inspiration_images' | 'fresh_images', f?: File) => {
    if (!f) return; setUploading(key + '-add');
    try { const url = await uploadMedia(f, key); setS((prev: any) => ({ ...prev, [key]: [...(prev[key] || []), url] })); }
    finally { setUploading(null); }
  };
  const removeFromGallery = (key: 'inspiration_images' | 'fresh_images', i: number) =>
    setS((prev: any) => ({ ...prev, [key]: (prev[key] || []).filter((_: string, idx: number) => idx !== i) }));

  // ── Shop by Style cards ─────────────────────────────────────────────
  const addStyleCard = () => setS((prev: any) => ({ ...prev, style_cards: [...(prev.style_cards || []), { image: '', label: '', label_ar: '', handle: '' }] }));
  const setStyleCard = (i: number, p: Partial<StyleCard>) =>
    setS((prev: any) => ({ ...prev, style_cards: prev.style_cards.map((c: StyleCard, idx: number) => (idx === i ? { ...c, ...p } : c)) }));
  const removeStyleCard = (i: number) =>
    setS((prev: any) => ({ ...prev, style_cards: prev.style_cards.filter((_: StyleCard, idx: number) => idx !== i) }));
  const uploadStyleCard = async (i: number, f?: File) => {
    if (!f) return; setUploading('sc-' + i);
    try { const url = await uploadMedia(f, 'style'); setStyleCard(i, { image: url }); } finally { setUploading(null); }
  };

  // ── Most loved products ─────────────────────────────────────────────
  const toggleLoved = (handleOrId: string) =>
    setS((prev: any) => {
      const cur: string[] = prev.most_loved || [];
      return { ...prev, most_loved: cur.includes(handleOrId) ? cur.filter((x) => x !== handleOrId) : [...cur, handleOrId] };
    });

  // ── Promotion cards ─────────────────────────────────────────────────
  const promos: Promo[] = s.promotions || [];
  const setPromos = (list: Promo[]) => setS((prev: any) => ({ ...prev, promotions: list }));
  const addPromo = () => setPromos([...promos, { id: rid(), enabled: true, title: 'New promotion', subtitle: '', cta_label: 'Shop now', cta_link: '/shop', image: '', bg: '#0F0F0F', accent: '#FF6A00' }]);
  const setPromo = (i: number, p: Partial<Promo>) => setPromos(promos.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  const removePromo = (i: number) => setPromos(promos.filter((_, idx) => idx !== i));
  const movePromo = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= promos.length) return;
    const copy = [...promos];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setPromos(copy);
  };
  const uploadPromo = async (i: number, f?: File) => {
    if (!f) return; setUploading('promo-' + i);
    try { const url = await uploadMedia(f, 'promotion'); setPromo(i, { image: url }); } finally { setUploading(null); }
  };

  const save = async () => {
    setBusy(true);
    const payload = {
      ...s,
      videos: (s.videos || []).filter((v: SiteVideo) => v.url),
      news_text: (s.news_text || '').trim() || null,
      news_text_ar: (s.news_text_ar || '').trim() || null,
      style_cards: (s.style_cards || []).filter((c: StyleCard) => c.image),
      inspiration_images: (s.inspiration_images || []).filter(Boolean),
      fresh_images: (s.fresh_images || []).filter(Boolean),
      most_loved: s.most_loved || [],
      // Keep only promos that have a title or image; everything is owner-editable.
      promotions: (s.promotions || []).filter((p: Promo) => (p.title || '').trim() || p.image),
    };
    await cms('cms_settings_save', { settings: payload });
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };


  const loved: string[] = s.most_loved || [];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* News / announcement bar */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-xl flex items-center gap-2"><Megaphone size={18} className="text-[#C9A23F]" /> Announcement bar</h3>
          <label className="flex items-center gap-2 text-sm text-[#666] cursor-pointer">
            <input type="checkbox" checked={s.news_enabled !== false} onChange={(e) => patch({ news_enabled: e.target.checked })} />
            Show on site
          </label>
        </div>
        <p className="text-sm text-[#8D8D8D] mb-5">The thin scrolling bar at the very top of every page. Edit the message your visitors see.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-1">Message (English)</label>
            <input value={s.news_text || ''} onChange={(e) => patch({ news_text: e.target.value })} placeholder={DEFAULT_NEWS} className="w-full border border-[#ddd] px-3 py-2.5 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-1">Message (العربية)</label>
            <input value={s.news_text_ar || ''} onChange={(e) => patch({ news_text_ar: e.target.value })} dir="rtl" placeholder={DEFAULT_NEWS_AR} className="w-full border border-[#ddd] px-3 py-2.5 rounded-lg text-sm" />
          </div>
          <p className="text-xs text-[#bbb]">Leave blank to use the default message.</p>
        </div>
      </div>

      {/* Promotions editor — add/edit/reorder/remove promo cards shown on the homepage */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-xl flex items-center gap-2"><Tag size={18} className="text-[#FF6A00]" /> Promotions</h3>
          <button onClick={addPromo} className="bg-[#FF6A00] text-white font-medium px-3 py-2 flex items-center gap-1 text-xs rounded-lg hover:bg-[#e85f00]"><Plus size={14} /> Add promotion</button>
        </div>
        <p className="text-sm text-[#8D8D8D] mb-5">Big banner cards on the homepage. Drag order with the arrows. {promos.length} card{promos.length === 1 ? '' : 's'}.</p>
        <div className="space-y-4">
          {promos.length === 0 && <p className="text-sm text-[#bbb]">No promotions yet — add one to feature it on the homepage.</p>}
          {promos.map((p, i) => (
            <div key={p.id} className={`border rounded-xl p-4 ${p.enabled === false ? 'border-[#eee] opacity-70' : 'border-[#FFE0CC]'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-44 shrink-0 aspect-video rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: p.bg || '#0F0F0F' }}>
                  {p.image ? <img src={p.image} className="w-full h-full object-cover opacity-70" /> : <ImageIcon size={20} className="text-white/50" />}
                  <span className="absolute inset-0 flex items-center justify-center px-2 text-center font-serif text-white text-sm drop-shadow">{p.title}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input value={p.title || ''} onChange={(e) => setPromo(i, { title: e.target.value })} placeholder="Title" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm col-span-2" />
                  <input value={p.subtitle || ''} onChange={(e) => setPromo(i, { subtitle: e.target.value })} placeholder="Subtitle" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm col-span-2" />
                  <input value={p.cta_label || ''} onChange={(e) => setPromo(i, { cta_label: e.target.value })} placeholder="Button label" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm" />
                  <input value={p.cta_link || ''} onChange={(e) => setPromo(i, { cta_link: e.target.value })} placeholder="Button link (/shop)" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm" />
                  <label className="flex items-center gap-2 text-xs text-[#666]">BG <input type="color" value={p.bg || '#0F0F0F'} onChange={(e) => setPromo(i, { bg: e.target.value })} className="w-8 h-7 rounded border border-[#ddd]" /></label>
                  <label className="flex items-center gap-2 text-xs text-[#666]">Accent <input type="color" value={p.accent || '#FF6A00'} onChange={(e) => setPromo(i, { accent: e.target.value })} className="w-8 h-7 rounded border border-[#ddd]" /></label>
                  <div className="flex items-center gap-2 col-span-2 flex-wrap">
                    <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black">
                      <Upload size={12} /> {uploading === 'promo-' + i ? 'Uploading…' : 'Background image'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPromo(i, e.target.files?.[0])} />
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#666] cursor-pointer">
                      <input type="checkbox" checked={p.enabled !== false} onChange={(e) => setPromo(i, { enabled: e.target.checked })} /> Show
                    </label>
                    <button onClick={() => movePromo(i, -1)} disabled={i === 0} className="text-[#999] disabled:opacity-30 hover:text-[#FF6A00]"><ArrowUp size={16} /></button>
                    <button onClick={() => movePromo(i, 1)} disabled={i === promos.length - 1} className="text-[#999] disabled:opacity-30 hover:text-[#FF6A00]"><ArrowDown size={16} /></button>
                    <button onClick={() => removePromo(i)} className="text-[#ccc] hover:text-red-500 ml-auto"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most loved products */}

      {/* Most loved products */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <h3 className="font-serif text-xl mb-1 flex items-center gap-2"><Heart size={18} className="text-[#FF6A00]" /> Most loved products</h3>
        <p className="text-sm text-[#8D8D8D] mb-5">Pick the pieces to feature first in the homepage “Some Paintings” rail. {loved.length} selected.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-auto pr-1">
          {products.length === 0 && <p className="text-sm text-[#bbb] col-span-full">No products yet.</p>}
          {products.map((p) => {
            const key = p.handle || p.id;
            const on = loved.includes(p.handle) || loved.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggleLoved(key)} className={`text-left border rounded-xl overflow-hidden transition-all ${on ? 'border-[#FF6A00] ring-2 ring-[#FF6A00]/25' : 'border-[#eee] hover:border-[#FF6A00]/50'}`}>
                <div className="relative aspect-square bg-[#f5f1ea]">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="absolute inset-0 m-auto text-[#ccc]" />}
                  {on && <span className="absolute top-1.5 right-1.5 bg-[#FF6A00] text-white rounded-full p-1"><Heart size={11} fill="currentColor" /></span>}
                </div>
                <p className="text-[11px] px-2 py-1.5 truncate">{p.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shop by Style images */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-xl flex items-center gap-2"><LayoutGrid size={18} className="text-[#C9A23F]" /> Shop by Style</h3>
          <button onClick={addStyleCard} className="bg-[#C9A23F] text-black font-medium px-3 py-2 flex items-center gap-1 text-xs rounded-lg hover:bg-[#E8C766]"><Plus size={14} /> Add card</button>
        </div>
        <p className="text-sm text-[#8D8D8D] mb-5">Unlimited style cards on the homepage. Leave empty to use the defaults. “Link slug” opens that collection on click.</p>
        <div className="space-y-3">
          {(s.style_cards || []).length === 0 && <p className="text-sm text-[#bbb]">Using default style cards.</p>}
          {(s.style_cards || []).map((c: StyleCard, i: number) => (
            <div key={i} className="border border-[#eee] rounded-xl p-3 flex gap-3">
              <div className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-[#555]" />}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input value={c.label || ''} onChange={(e) => setStyleCard(i, { label: e.target.value })} placeholder="Label (EN)" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm" />
                <input value={c.label_ar || ''} onChange={(e) => setStyleCard(i, { label_ar: e.target.value })} dir="rtl" placeholder="الاسم (AR)" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm" />
                <input value={c.handle || ''} onChange={(e) => setStyleCard(i, { handle: e.target.value })} placeholder="Link slug (e.g. modern)" className="border border-[#ddd] px-2.5 py-1.5 rounded-lg text-sm col-span-2" />
                <div className="flex items-center gap-2 col-span-2">
                  <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black">
                    <Upload size={12} /> {uploading === 'sc-' + i ? 'Uploading…' : 'Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadStyleCard(i, e.target.files?.[0])} />
                  </label>
                  <button onClick={() => removeStyleCard(i)} className="text-[#ccc] hover:text-red-500 ml-auto"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspiration gallery */}
      <GalleryEditor
        title="Inspiration Gallery" icon={<Sparkles size={18} className="text-[#C9A23F]" />}
        hint="Unlimited moodboard images shown in the Inspiration Gallery section."
        images={s.inspiration_images || []} uploadingKey={uploading === 'inspiration_images-add'}
        onUpload={(f) => uploadToGallery('inspiration_images', f)} onRemove={(i) => removeFromGallery('inspiration_images', i)}
      />

      {/* Always Fresh gallery */}
      <GalleryEditor
        title="Always Fresh" icon={<Sparkles size={18} className="text-[#FF6A00]" />}
        hint="Unlimited images for the “Always Fresh” band. Add at least one to show the section."
        images={s.fresh_images || []} uploadingKey={uploading === 'fresh_images-add'}
        onUpload={(f) => uploadToGallery('fresh_images', f)} onRemove={(i) => removeFromGallery('fresh_images', i)}
      />

      {/* Logos */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <h3 className="font-serif text-xl mb-1">Brand logos &amp; browser-tab icon</h3>
        <p className="text-sm text-[#8D8D8D] mb-6">Upload your PITSIKY logo for the site header, footer, and the small icon shown in the browser tab. Leave empty to use the text logo / header logo.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {([['header_logo', 'Header logo', 'bg-white'], ['footer_logo', 'Footer logo', 'bg-[#0C0C0C]'], ['favicon', 'Browser tab icon', 'bg-[#f5f1ea]']] as const).map(([field, label, bg]) => (
            <div key={field}>
              <p className="text-sm font-medium mb-2">{label}</p>
              <div className={`h-24 rounded-xl border border-[#eee] flex items-center justify-center mb-3 overflow-hidden ${bg}`}>
                {s[field] ? <img src={s[field]} className="max-h-16 max-w-[80%] object-contain" /> : <ImageIcon size={22} className="text-[#bbb]" />}
              </div>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-black">
                  <Upload size={13} /> {uploading === field ? 'Uploading…' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(field, e.target.files?.[0])} />
                </label>
                {s[field] && <button onClick={() => patch({ [field]: null })} className="text-xs text-[#999] px-2 hover:text-red-500">Remove</button>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#bbb] mt-3">Tip: the browser-tab icon falls back to your header logo when left empty.</p>
      </div>

      {/* Hero image */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <h3 className="font-serif text-xl mb-1">Homepage hero image</h3>
        <p className="text-sm text-[#8D8D8D] mb-6">The big background photo at the top of the homepage (1920×1080 looks best). Leave empty to use the default.</p>
        <div className="h-56 rounded-xl border border-[#eee] flex items-center justify-center mb-3 overflow-hidden bg-[#0C0C0C]">
          {s.hero_image ? <img src={s.hero_image} className="w-full h-full object-cover" /> : <ImageIcon size={26} className="text-[#555]" />}
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-4 py-2.5 rounded-lg cursor-pointer hover:bg-black">
            <Upload size={13} /> {uploading === 'hero' ? 'Uploading…' : 'Upload hero image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadHero(e.target.files?.[0])} />
          </label>
          {s.hero_image && <button onClick={() => patch({ hero_image: null })} className="text-xs text-[#999] px-2 hover:text-red-500 flex items-center gap-1"><X size={13} /> Remove (use default)</button>}
        </div>
      </div>

      {/* Videos */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-xl flex items-center gap-2"><Film size={18} className="text-[#C9A23F]" /> Showcase videos</h3>
          <button onClick={addVideo} className="bg-[#C9A23F] text-black font-medium px-3 py-2 flex items-center gap-1 text-xs rounded-lg hover:bg-[#E8C766]"><Plus size={14} /> Add video</button>
        </div>
        <p className="text-sm text-[#8D8D8D] mb-6">These play in a cinematic section on the homepage. Upload an MP4 (or paste a link) and an optional cover image.</p>
        {(s.videos || []).length === 0 && <p className="text-sm text-[#bbb]">No videos yet — add one to feature it on the homepage.</p>}
        <div className="space-y-4">
          {(s.videos || []).map((v: SiteVideo) => (
            <div key={v.id} className="border border-[#eee] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-44 shrink-0 aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {v.poster ? <img src={v.poster} className="w-full h-full object-cover" />
                  : v.url ? <video src={v.url} className="w-full h-full object-cover" muted />
                  : <Film size={22} className="text-[#555]" />}
              </div>
              <div className="flex-1 space-y-2">
                <input value={v.title || ''} onChange={(e) => setVideo(v.id, { title: e.target.value })} placeholder="Title (EN)" className="w-full border border-[#ddd] px-3 py-2 rounded-lg text-sm" />
                <input value={v.title_ar || ''} onChange={(e) => setVideo(v.id, { title_ar: e.target.value })} placeholder="العنوان (AR)" dir="rtl" className="w-full border border-[#ddd] px-3 py-2 rounded-lg text-sm" />
                <input value={v.url || ''} onChange={(e) => setVideo(v.id, { url: e.target.value })} placeholder="Video URL (mp4) or paste link" className="w-full border border-[#ddd] px-3 py-2 rounded-lg text-sm" />
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black">
                    <Upload size={12} /> {uploading === 'v-' + v.id ? 'Uploading…' : 'Upload video'}
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => uploadVideoFile(v.id, e.target.files?.[0])} />
                  </label>
                  <label className="inline-flex items-center gap-1.5 border border-[#ddd] text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#FAF8F5]">
                    <ImageIcon size={12} /> {uploading === 'p-' + v.id ? 'Uploading…' : 'Cover image'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPoster(v.id, e.target.files?.[0])} />
                  </label>
                  <button onClick={() => removeVideo(v.id)} className="text-[#ccc] hover:text-red-500 ml-auto"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-3 bg-[#FAF8F5]/80 backdrop-blur py-2 rounded-lg">
        <button disabled={busy} onClick={save} className="bg-[#C9A23F] text-black font-medium px-6 py-3 text-sm rounded-lg disabled:opacity-50 hover:bg-[#E8C766] flex items-center gap-2">
          {saved ? <><Check size={15} /> Saved</> : busy ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Changes are live on the storefront.</span>}
      </div>
    </div>
  );
};

// Reusable unlimited-image gallery editor.
const GalleryEditor: React.FC<{
  title: string; icon: React.ReactNode; hint: string; images: string[];
  uploadingKey: boolean; onUpload: (f?: File) => void; onRemove: (i: number) => void;
}> = ({ title, icon, hint, images, uploadingKey, onUpload, onRemove }) => (
  <div className="bg-white border border-[#eee] rounded-xl p-6">
    <h3 className="font-serif text-xl mb-1 flex items-center gap-2">{icon} {title}</h3>
    <p className="text-sm text-[#8D8D8D] mb-5">{hint} {images.length} image{images.length === 1 ? '' : 's'}.</p>
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {images.map((img, i) => (
        <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-[#f5f1ea] border border-[#eee]">
          <img src={img} className="w-full h-full object-cover" />
          <button onClick={() => onRemove(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={12} /></button>
        </div>
      ))}
      <label className="aspect-square rounded-lg border-2 border-dashed border-[#ccc] flex flex-col items-center justify-center text-[11px] text-[#999] cursor-pointer hover:border-[#C9A23F] hover:text-[#C9A23F]">
        <Upload size={18} className="mb-1" />
        {uploadingKey ? 'Uploading…' : 'Add image'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
      </label>
    </div>
  </div>
);

export default SettingsPanel;
