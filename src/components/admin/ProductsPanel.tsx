import React, { useEffect, useState, useRef } from 'react';
import { cms, uploadMedia, isOwner } from './cms';
import ConfirmDialog from './ConfirmDialog';
import { formatMAD } from '@/data/catalog';
import {
  Plus, Trash2, Pencil, Copy, Archive, ArchiveRestore, X, Image as ImageIcon, Search,
  Upload, Layers, Ruler, Sparkles, Check, FolderOpen, Tag,
} from 'lucide-react';

interface Variant { title: string; option1?: string; option2?: string; price: number; inventory_qty: number; sku?: string }
interface AddOn { label: string; price: number; enabled?: boolean }
interface Prod {
  id?: string; name: string; handle?: string; description?: string; price: number; sku?: string;
  inventory_qty?: number; images?: string[]; status?: string; has_variants?: boolean;
  product_type?: string; tags?: any; variants?: Variant[]; vendor?: string; metadata?: any;
}
interface Cat { id: string; title: string; parent_id?: string | null; icon?: string }
interface Media { id: string; url: string; name?: string }

const empty: Prod = { name: '', price: 0, status: 'active', images: [], variants: [], has_variants: false, metadata: {} };
const MATERIALS = ['Canvas', 'Framed', 'Poster', 'Acrylic', 'Metal', 'Wooden'];
const PRESET_SIZES = ['20x30', '30x40', '40x60', '50x70', '60x90', '80x120', '100x150'];
const DEFAULT_ADDONS: AddOn[] = [
  { label: 'Neon LED', price: 15000, enabled: false },
  { label: 'Signature', price: 5000, enabled: false },
  { label: 'Handwritten Paper', price: 3000, enabled: false },
  { label: 'Premium Frame', price: 8000, enabled: false },
  { label: 'Gift Wrap', price: 2000, enabled: false },
];

const ProductsPanel: React.FC = () => {
  const [products, setProducts] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [draftProduct, setDraftProduct] = useState<Prod | null>(null);
  const [dirty, setDirty] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [confirming, setConfirming] = useState<Prod | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [newAddon, setNewAddon] = useState({ label: '', price: 0 });
  const [customSize, setCustomSize] = useState('');
  const owner = isOwner();

  // تخزين المنتج الأصلي للمقارنة أثناء التعديل
  const originalProductRef = useRef<Prod | null>(null);

  const load = async () => { const r = await cms('cms_products_list'); setProducts(r.products || []); };
  const loadCats = async () => { const r = await cms('cms_categories_list'); setCats(r.categories || []); };
  const loadMedia = async () => { const r = await cms('cms_media_list'); setMedia(r.media || []); };
  useEffect(() => { load(); loadCats(); loadMedia(); }, []);

  const updateDraft = (updater: (prev: Prod) => Prod) => {
    setDraftProduct((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return updater(prev);
    });
  };

  const setMd = (patch: any) => {
    updateDraft((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...patch },
    }));
  };

  const open = (p?: Prod) => {
    // حفظ نسخة من المنتج الأصلي للاستفادة منها في تبديل المتغيرات
    originalProductRef.current = p ? { ...p, variants: [...(p.variants || [])] } : null;

    const base = p
      ? {
          ...p,
          tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
          variants: p.variants || [],
        }
      : { ...empty };

    const md = base.metadata || {};
    // الحل: دمج الحقول المطلوبة فقط دون مسح باقي الميتاداتا
    base.metadata = {
      ...md, // نحافظ على كل الحقول الأصلية (مثل media_source ...)
      categories: Array.isArray(md.categories) ? md.categories : [],
      sizes: Array.isArray(md.sizes) ? md.sizes : [],
      addons: Array.isArray(md.addons) && md.addons.length
        ? md.addons
        : DEFAULT_ADDONS.map((a) => ({ ...a })),
    };

    setDraftProduct(base);
    setDirty(false);
  };

  const closeEditor = () => {
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    setDraftProduct(null);
    setDirty(false);
    originalProductRef.current = null;
  };

  const save = async () => {
    if (!draftProduct?.name) return;
    setBusy(true);
    try {
      const payload = { ...draftProduct };
      payload.tags = (payload.tags || '')
        .toString()
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean);
      await cms('cms_product_save', { product: payload });
      setDirty(false);
      setDraftProduct(null);
      originalProductRef.current = null;
      load();
    } catch (e: any) {
      alert(e?.message || 'Error saving product');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirming?.id) return;
    setDelBusy(true);
    try {
      await cms('cms_product_delete', { id: confirming.id });
      setConfirming(null);
      load();
    } catch (e: any) {
      alert(e?.message || 'Could not delete product');
    } finally {
      setDelBusy(false);
    }
  };
  const dup = async (id?: string) => { await cms('cms_product_duplicate', { id }); load(); };
  const archive = async (p: Prod) => {
    await cms('cms_product_archive', { id: p.id, status: p.status === 'archived' ? 'active' : 'archived' });
    load();
  };

  const addImages = async (files?: FileList | null) => {
    if (!files || !draftProduct) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadMedia(f, 'product'));
      updateDraft((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }));
      loadMedia();
    } finally {
      setUploading(false);
    }
  };
  const removeImage = (index: number) => {
    updateDraft((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };
  const toggleFromMedia = (url: string) => {
    updateDraft((prev) => {
      const imgs = prev.images || [];
      return {
        ...prev,
        images: imgs.includes(url) ? imgs.filter((u) => u !== url) : [...imgs, url],
      };
    });
  };

  const toggleCat = (id: string) => {
    const cur = draftProduct?.metadata?.categories || [];
    setMd({ categories: cur.includes(id) ? cur.filter((c: string) => c !== id) : [...cur, id] });
  };

  const toggleSize = (s: string) => {
    const cur = draftProduct?.metadata?.sizes || [];
    setMd({ sizes: cur.includes(s) ? cur.filter((x: string) => x !== s) : [...cur, s] });
  };
  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s) return;
    const cur = draftProduct?.metadata?.sizes || [];
    if (!cur.includes(s)) setMd({ sizes: [...cur, s] });
    setCustomSize('');
  };

  const toggleAddon = (i: number) => {
    const list = [...(draftProduct?.metadata?.addons || [])];
    list[i] = { ...list[i], enabled: !list[i].enabled };
    setMd({ addons: list });
  };
  const setAddonPrice = (i: number, price: number) => {
    const list = [...(draftProduct?.metadata?.addons || [])];
    list[i] = { ...list[i], price };
    setMd({ addons: list });
  };
  const removeAddon = (i: number) => {
    const list = (draftProduct?.metadata?.addons || []).filter((_: any, x: number) => x !== i);
    setMd({ addons: list });
  };
  const addAddon = () => {
    if (!newAddon.label.trim()) return;
    const list = [
      ...(draftProduct?.metadata?.addons || []),
      { label: newAddon.label.trim(), price: Math.round(newAddon.price * 100), enabled: true },
    ];
    setMd({ addons: list });
    setNewAddon({ label: '', price: 0 });
  };

  // ---- variants (محسّنة) ----
  const toggleVariant = (material: string, size: string) => {
    if (!draftProduct) return;
    const title = `${material} · ${size}`;
    const currentVariants = draftProduct.variants || [];
    const exists = currentVariants.find((v) => v.title === title);

    if (exists) {
      // إزالة المتغير
      updateDraft((prev) => ({
        ...prev,
        variants: prev.variants?.filter((v) => v.title !== title) || [],
        has_variants: (prev.variants?.length || 1) > 1,
      }));
    } else {
      // إضافة المتغير مع سعر افتراضي، مع الاحتفاظ بالبيانات القديمة إن وُجدت في المنتج الأصلي
      const original = originalProductRef.current?.variants?.find((v) => v.title === title);
      const newVariant: Variant = {
        title,
        option1: size,
        option2: material,
        price: original ? original.price : draftProduct.price,
        inventory_qty: original ? original.inventory_qty : 10,
      };
      updateDraft((prev) => ({
        ...prev,
        variants: [...(prev.variants || []), newVariant],
        has_variants: true,
      }));
    }
  };

  const filtered = products.filter(
    (p) =>
      (statusFilter === 'all' || p.status === statusFilter) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || (p.handle || '').includes(q.toLowerCase()))
  );
  const countBy = (s: string) => products.filter((p) => p.status === s).length;
  const tops = cats.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => cats.filter((c) => c.parent_id === id);
  const catName = (id: string) => cats.find((c) => c.id === id)?.title || '';

  return (
    <div>
      {/* toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full border border-[#e6e6e6] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-[#FF6A00] outline-none" />
        </div>
        <button onClick={() => open()} className="bg-[#FF6A00] text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 text-sm font-medium hover:bg-[#e85f00] shadow-sm"><Plus size={16} /> New Product</button>
      </div>

      {/* status filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {([
          ['all', `All (${products.length})`],
          ['active', `Active (${countBy('active')})`],
          ['draft', `Draft (${countBy('draft')})`],
          ['archived', `Archived (${countBy('archived')})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key as any)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === key ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#e6e6e6] text-[#666] hover:border-[#1D1D1D]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && <p className="text-[#8D8D8D] col-span-full py-10 text-center">No products yet.</p>}
        {filtered.map((p) => (
          <div key={p.id} className="group bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-[5/4] bg-[#f6f6f6]">
              {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={22} className="text-[#ddd]" /></div>}
              <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => open(p)} title="Edit" className="bg-white/95 rounded-md p-1.5 shadow hover:text-[#FF6A00]"><Pencil size={14} /></button>
                <button onClick={() => dup(p.id)} title="Duplicate" className="bg-white/95 rounded-md p-1.5 shadow"><Copy size={14} /></button>
                <button onClick={() => archive(p)} title={p.status === 'archived' ? 'Restore from archive' : 'Archive'} className={`bg-white/95 rounded-md p-1.5 shadow ${p.status === 'archived' ? 'hover:text-emerald-600' : 'hover:text-amber-600'}`}>{p.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}</button>
                {owner && <button onClick={() => setConfirming(p)} title="Delete permanently" className="bg-white/95 rounded-md p-1.5 shadow hover:text-red-500"><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="p-3">
              <p className="font-medium truncate text-[#1D1D1D]">{p.name}</p>
              <p className="text-sm text-[#FF6A00] font-semibold">{formatMAD(p.price)}</p>
              <p className="text-[11px] text-[#aaa] truncate mt-0.5">{(p.metadata?.categories || []).map(catName).filter(Boolean).join(', ') || p.product_type || 'Uncategorized'}</p>
              {p.metadata?.created_by?.name && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${p.metadata.created_by.color || '#888'}1a`, color: p.metadata.created_by.color || '#666', border: `1px solid ${p.metadata.created_by.color || '#ccc'}55` }}
                  title={`Added by ${p.metadata.created_by.name}`}>
                  <span>{p.metadata.created_by.emoji || '🦊'}</span>
                  by {p.metadata.created_by.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* editor */}
      {draftProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEditor}>
          <div className="bg-white w-full max-w-3xl max-h-[94vh] overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#eee] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-serif text-xl">{draftProduct.id ? 'Edit' : 'New'} Product</h3>
              <button onClick={closeEditor} className="text-[#999] hover:text-black"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-7">
              {/* basics */}
              <div className="grid grid-cols-2 gap-3">
                <input value={draftProduct.name} onChange={(e) => updateDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Product title" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 col-span-2 focus:border-[#FF6A00] outline-none" />
                <input value={draftProduct.product_type || ''} onChange={(e) => updateDraft((prev) => ({ ...prev, product_type: e.target.value }))} placeholder="Type (e.g. Poster)" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <input value={draftProduct.tags as string || ''} onChange={(e) => updateDraft((prev) => ({ ...prev, tags: e.target.value }))} placeholder="tags, comma separated" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <input type="number" value={draftProduct.price ? draftProduct.price / 100 : ''} onChange={(e) => updateDraft((prev) => ({ ...prev, price: Math.round(Number(e.target.value) * 100) }))} placeholder="Base price (MAD)" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <select value={draftProduct.status} onChange={(e) => updateDraft((prev) => ({ ...prev, status: e.target.value }))} className="border border-[#e6e6e6] rounded-lg px-3 py-2.5">
                  {['active', 'draft', 'archived'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <textarea value={draftProduct.description || ''} onChange={(e) => updateDraft((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 col-span-2 h-20 focus:border-[#FF6A00] outline-none" />
              </div>

              {/* CATEGORIES */}
              <section>
                <div className="flex items-center gap-2 mb-3"><Tag size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Categories <span className="text-[#aaa] font-normal">(select one or more)</span></h4></div>
                {tops.length === 0 ? <p className="text-xs text-[#aaa]">No categories yet — create them in the Categories tab.</p> : (
                  <div className="space-y-3">
                    {tops.map((t) => {
                      const kids = childrenOf(t.id);
                      const sel = draftProduct.metadata.categories;
                      return (
                        <div key={t.id} className="border border-[#f0f0f0] rounded-lg p-3">
                          <button type="button" onClick={() => toggleCat(t.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-1 ${sel.includes(t.id) ? 'bg-[#FF6A00] text-white' : 'bg-[#f5f5f5] text-[#555] hover:bg-[#ececec]'}`}>
                            {sel.includes(t.id) && <Check size={12} />}{t.title}
                          </button>
                          {kids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                              {kids.map((k) => (
                                <button key={k.id} type="button" onClick={() => toggleCat(k.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${sel.includes(k.id) ? 'bg-[#1D1D1D] text-white' : 'bg-[#fafafa] border border-[#eee] text-[#777] hover:border-[#FF6A00]'}`}>
                                  {sel.includes(k.id) && <Check size={10} />}{k.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* IMAGES */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><ImageIcon size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Images</h4></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPicker(true)} className="text-xs inline-flex items-center gap-1 border border-[#e6e6e6] rounded-lg px-3 py-1.5 hover:border-[#FF6A00]"><FolderOpen size={13} /> From media</button>
                    <label className="text-xs inline-flex items-center gap-1 bg-[#1D1D1D] text-white rounded-lg px-3 py-1.5 cursor-pointer hover:bg-black">
                      <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload multiple'}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draftProduct.images?.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} className="w-20 h-20 object-cover rounded-lg border border-[#eee]" />
                      {i === 0 && <span className="absolute bottom-1 left-1 bg-[#FF6A00] text-white text-[9px] px-1.5 rounded">Cover</span>}
                      <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-white border rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100"><X size={12} /></button>
                    </div>
                  ))}
                  {(!draftProduct.images || draftProduct.images.length === 0) && <p className="text-xs text-[#bbb] py-6">No images selected yet.</p>}
                </div>
              </section>

              {/* SIZES */}
              <section>
                <div className="flex items-center gap-2 mb-3"><Ruler size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Available Sizes</h4></div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[...new Set([...PRESET_SIZES, ...(draftProduct.metadata.sizes || [])])].map((s) => {
                    const active = (draftProduct.metadata.sizes || []).includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${active ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#e6e6e6] text-[#666] hover:border-[#FF6A00]'}`}>{s}</button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())} placeholder="Custom size e.g. 120x180" className="border border-[#e6e6e6] rounded-lg px-3 py-2 text-sm flex-1 focus:border-[#FF6A00] outline-none" />
                  <button type="button" onClick={addCustomSize} className="bg-[#1D1D1D] text-white px-4 rounded-lg text-sm">Add</button>
                </div>
              </section>

              {/* ADD-ONS */}
              <section>
                <div className="flex items-center gap-2 mb-3"><Sparkles size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Add-ons & Extras <span className="text-[#aaa] font-normal">(toggle + set extra price)</span></h4></div>
                <div className="space-y-2">
                  {(draftProduct.metadata.addons || []).map((a: AddOn, i: number) => (
                    <div key={i} className={`flex items-center gap-3 border rounded-lg px-3 py-2 ${a.enabled ? 'border-[#FF6A00] bg-[#FFF6F0]' : 'border-[#eee]'}`}>
                      <button type="button" onClick={() => toggleAddon(i)} className={`w-9 h-5 rounded-full relative transition-colors ${a.enabled ? 'bg-[#FF6A00]' : 'bg-[#ddd]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${a.enabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                      <span className="flex-1 text-sm">{a.label}</span>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-[#aaa] text-xs">+</span>
                        <input type="number" value={a.price ? a.price / 100 : ''} onChange={(e) => setAddonPrice(i, Math.round(Number(e.target.value) * 100))} className="w-20 border border-[#e6e6e6] rounded px-2 py-1 text-right text-sm" />
                        <span className="text-[#aaa] text-xs">MAD</span>
                      </div>
                      {owner && <button type="button" onClick={() => removeAddon(i)} className="text-[#ccc] hover:text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input value={newAddon.label} onChange={(e) => setNewAddon({ ...newAddon, label: e.target.value })} placeholder="New add-on name" className="border border-[#e6e6e6] rounded-lg px-3 py-2 text-sm flex-1 focus:border-[#FF6A00] outline-none" />
                  <input type="number" value={newAddon.price || ''} onChange={(e) => setNewAddon({ ...newAddon, price: Number(e.target.value) })} placeholder="MAD" className="border border-[#e6e6e6] rounded-lg px-3 py-2 text-sm w-24 focus:border-[#FF6A00] outline-none" />
                  <button type="button" onClick={addAddon} className="bg-[#FF6A00] text-white px-4 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Add</button>
                </div>
              </section>

              {/* VARIANTS */}
              <section>
                <div className="flex items-center gap-2 mb-3"><Layers size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Variants — Material × Size <span className="text-[#aaa] font-normal">(optional, priced separately)</span></h4></div>
                <div className="space-y-2">
                  {MATERIALS.map((m) => (
                    <div key={m} className="flex flex-wrap items-center gap-2">
                      <span className="w-20 text-xs text-[#555]">{m}</span>
                      {PRESET_SIZES.map((s) => {
                        const title = `${m} · ${s}`;
                        const active = (draftProduct.variants || []).find((v) => v.title === title);
                        return <button key={s} type="button" onClick={() => toggleVariant(m, s)} className={`px-2 py-1 text-[11px] rounded border ${active ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#e6e6e6] text-[#888] hover:border-[#FF6A00]'}`}>{s}</button>;
                      })}
                    </div>
                  ))}
                </div>
                {(draftProduct.variants || []).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {draftProduct.variants!.map((v) => (
                      <div key={v.title} className="flex items-center justify-between text-sm bg-[#fafafa] rounded px-2 py-1">
                        <span>{v.title}</span>
                        <input type="number" value={v.price / 100} onChange={(e) => {
                          const newPrice = Math.round(Number(e.target.value) * 100);
                          updateDraft((prev) => ({
                            ...prev,
                            variants: prev.variants!.map((x) => x.title === v.title ? { ...x, price: newPrice } : x),
                          }));
                        }} className="border border-[#e6e6e6] rounded px-2 py-1 w-28 text-right" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#eee] px-6 py-4 flex justify-end gap-3">
              {dirty && <span className="text-sm text-amber-600 mr-auto">Unsaved Changes</span>}
              <button onClick={closeEditor} className="px-4 py-2 text-sm text-[#8D8D8D]">Cancel</button>
              <button disabled={busy || !dirty} onClick={save} className="bg-[#FF6A00] text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#e85f00]">{busy ? 'Saving…' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA PICKER */}
      {picker && draftProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]" onClick={() => setPicker(false)}>
          <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">Select from uploaded media</h3>
              <button onClick={() => setPicker(false)}><X size={18} /></button>
            </div>
            {media.length === 0 ? <p className="text-sm text-[#aaa] py-10 text-center">No media uploaded yet.</p> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {media.map((m) => {
                  const sel = (draftProduct.images || []).includes(m.url);
                  return (
                    <button key={m.id} onClick={() => toggleFromMedia(m.url)} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${sel ? 'border-[#FF6A00]' : 'border-transparent'}`}>
                      <img src={m.url} className="w-full h-full object-cover" />
                      {sel && <span className="absolute inset-0 bg-[#FF6A00]/25 flex items-center justify-center"><Check size={22} className="text-white drop-shadow" /></span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-5">
              <button onClick={() => setPicker(false)} className="bg-[#FF6A00] text-white px-6 py-2.5 rounded-lg text-sm font-medium">Done ({(draftProduct.images || []).length} selected)</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        title={`Delete “${confirming?.name || ''}”?`}
        message={
          <span>
            This permanently removes <b>only this product</b> and its variants. Other products are
            <b> not</b> affected. To keep it but hide it from the store, use <b>Archive</b> instead. This cannot be undone.
          </span>
        }
        confirmLabel="Delete product"
        busy={delBusy}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
};

export default ProductsPanel;
