import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cms, uploadMedia, isOwner } from './cms';
import ConfirmDialog from './ConfirmDialog';
import { formatMAD } from '@/data/catalog';
import {
  Plus, Trash2, Pencil, Copy, Archive, ArchiveRestore, X, Image as ImageIcon, Search,
  Upload, Layers, Ruler, Sparkles, Check, FolderOpen, Tag, ArrowLeft, ArrowRight, Star, RotateCcw, Save,
} from 'lucide-react';

interface Variant {
  title: string;
  option1?: string;
  option2?: string;
  price: number;
  inventory_qty: number;
  sku?: string;
  position?: number;
}
interface AddOn { label: string; price: number; enabled?: boolean }
interface Prod {
  id?: string;
  name: string;
  handle?: string;
  description?: string;
  price: number;
  sku?: string;
  inventory_qty?: number;
  images?: string[];
  status?: string;
  has_variants?: boolean;
  product_type?: string;
  tags?: any;
  variants?: Variant[];
  vendor?: string;
  metadata?: any;
}
interface Cat { id: string; title: string; parent_id?: string | null; icon?: string }
interface Media { id: string; url: string; name?: string }

const empty: Prod = {
  name: '',
  price: 0,
  status: 'active',
  images: [],
  variants: [],
  has_variants: false,
  metadata: {},
};
const MATERIALS = ['Canvas', 'Framed', 'Poster', 'Acrylic', 'Metal', 'Wooden'];
const PRESET_SIZES = ['20x30', '30x40', '40x60', '50x70', '60x90', '80x120', '100x150'];
const DEFAULT_ADDONS: AddOn[] = [
  { label: 'Neon LED', price: 15000, enabled: false },
  { label: 'Signature', price: 5000, enabled: false },
  { label: 'Handwritten Paper', price: 3000, enabled: false },
  { label: 'Premium Frame', price: 8000, enabled: false },
  { label: 'Gift Wrap', price: 2000, enabled: false },
];
const DRAFT_PREFIX = 'pts_product_draft:';

const uniqueStrings = (items: any[] = []) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const value = String(item || '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
};

const parseTags = (tags: any) => {
  if (Array.isArray(tags)) return uniqueStrings(tags);
  return uniqueStrings(String(tags || '').split(','));
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value ?? null));

const normalizeAddons = (addons: any[] = []) => {
  const source = Array.isArray(addons) && addons.length ? addons : DEFAULT_ADDONS;
  return source.map((addon: any) => ({
    label: String(addon?.label || '').trim(),
    price: Number.isFinite(Number(addon?.price)) ? Math.max(0, Math.round(Number(addon.price))) : 0,
    enabled: Boolean(addon?.enabled),
  })).filter((addon) => addon.label);
};

const normalizeOrigins = (product: Prod) => {
  const md = product.metadata || {};
  const sourceMedia = Array.isArray(md.source_media) ? md.source_media : [];
  const imageOriginMap = Array.isArray(md.image_origin_map) ? md.image_origin_map : sourceMedia;
  return imageOriginMap.map((entry: any, index: number) => ({
    media_id: entry?.media_id || entry?.id || null,
    url: String(entry?.url || ''),
    name: entry?.name || '',
    origin: entry?.origin || 'media',
    position: Number.isFinite(Number(entry?.position)) ? Number(entry.position) : index,
  })).filter((entry: any) => entry.url);
};

const normalizeVariants = (variants: any[] = [], basePrice = 0) => variants.map((variant: any, index: number) => ({
  title: String(variant?.title || `${variant?.option2 || ''}${variant?.option1 ? ' · ' + variant.option1 : ''}` || `Variant ${index + 1}`).trim(),
  option1: variant?.option1 ? String(variant.option1).trim() : '',
  option2: variant?.option2 ? String(variant.option2).trim() : '',
  price: Number.isFinite(Number(variant?.price)) ? Math.max(0, Math.round(Number(variant.price))) : Math.max(0, Math.round(basePrice || 0)),
  inventory_qty: Number.isFinite(Number(variant?.inventory_qty)) ? Math.max(0, Math.round(Number(variant.inventory_qty))) : 0,
  sku: variant?.sku ? String(variant.sku).trim() : '',
  position: Number.isFinite(Number(variant?.position)) ? Number(variant.position) : index,
})).filter((variant) => variant.title);

const normalizeProductForEditor = (product?: Prod | null): Prod => {
  const base = clone(product || empty) || clone(empty);
  const md = base.metadata || {};
  const variants = normalizeVariants(base.variants || [], base.price || 0);
  const images = uniqueStrings(base.images || []);
  const origins = normalizeOrigins({ ...base, metadata: md });

  return {
    ...base,
    name: String(base.name || ''),
    handle: base.handle || '',
    description: base.description || '',
    product_type: base.product_type || '',
    status: base.status || 'active',
    price: Number.isFinite(Number(base.price)) ? Math.max(0, Math.round(Number(base.price))) : 0,
    images,
    tags: parseTags(base.tags).join(', '),
    variants,
    has_variants: variants.length > 0,
    metadata: {
      ...md,
      categories: uniqueStrings(md.categories || []),
      sizes: uniqueStrings(md.sizes || []),
      addons: normalizeAddons(md.addons),
      source_media: origins,
      image_origin_map: origins,
      created_from_media: Boolean(md.created_from_media || origins.length),
    },
  };
};

const normalizeProductForSave = (product: Prod) => {
  const editor = normalizeProductForEditor(product);
  const variants = normalizeVariants(editor.variants || [], editor.price).map((variant, index) => ({ ...variant, position: index }));
  const origins = normalizeOrigins(editor).map((origin: any, index: number) => ({ ...origin, position: index }));
  const metadata = {
    ...(editor.metadata || {}),
    categories: uniqueStrings(editor.metadata?.categories || []),
    sizes: uniqueStrings(editor.metadata?.sizes || []),
    addons: normalizeAddons(editor.metadata?.addons),
    created_from_media: Boolean(editor.metadata?.created_from_media || origins.length),
    source_media_ids: uniqueStrings(origins.map((origin: any) => origin.media_id).filter(Boolean)),
    source_media: origins,
    image_origin_map: origins,
    last_admin_edit_at: new Date().toISOString(),
  };

  return {
    ...editor,
    handle: String(editor.handle || '').trim() || undefined,
    description: String(editor.description || '').trim(),
    product_type: String(editor.product_type || '').trim(),
    price: Math.max(0, Math.round(Number(editor.price || 0))),
    tags: parseTags(editor.tags),
    images: uniqueStrings(editor.images || []),
    variants,
    has_variants: variants.length > 0,
    metadata,
  };
};

const getDraftKey = (id?: string) => `${DRAFT_PREFIX}${id || 'new'}`;
const safeReadDraft = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const ProductsPanel: React.FC = () => {
  const [products, setProducts] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [editing, setEditing] = useState<Prod | null>(null);
  const [editBase, setEditBase] = useState<Prod | null>(null);
  const [editingDraftKey, setEditingDraftKey] = useState('');
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
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
  const initialSnapshot = useRef('');

  const load = async () => {
    const r = await cms('cms_products_list');
    setProducts(r.products || []);
  };
  const loadCats = async () => {
    const r = await cms('cms_categories_list');
    setCats(r.categories || []);
  };
  const loadMedia = async () => {
    const r = await cms('cms_media_list');
    setMedia(r.media || []);
  };
  useEffect(() => { load(); loadCats(); loadMedia(); }, []);

  const open = (p?: Prod) => {
    const base = normalizeProductForEditor(p ? p : empty);
    const draftKey = getDraftKey(base.id);
    const storedDraft = safeReadDraft(draftKey);
    const start = storedDraft?.data ? normalizeProductForEditor(storedDraft.data) : base;
    setEditBase(base);
    setEditing(start);
    setEditingDraftKey(draftKey);
    setDraftRecovered(Boolean(storedDraft?.data));
    setAutoSavedAt(storedDraft?.savedAt || null);
    initialSnapshot.current = JSON.stringify(normalizeProductForSave(base));
  };

  const closeEditor = () => {
    setEditing(null);
    setEditBase(null);
    setEditingDraftKey('');
    setDraftRecovered(false);
    setAutoSavedAt(null);
    setNewAddon({ label: '', price: 0 });
    setCustomSize('');
  };

  useEffect(() => {
    if (!editing || !editingDraftKey) return;
    const payload = { savedAt: Date.now(), data: editing };
    localStorage.setItem(editingDraftKey, JSON.stringify(payload));
    setAutoSavedAt(payload.savedAt);
  }, [editing, editingDraftKey]);

  const save = async () => {
    if (!editing?.name.trim()) return;
    setBusy(true);
    try {
      const payload = normalizeProductForSave(editing);
      await cms('cms_product_save', { product: payload });
      if (editingDraftKey) localStorage.removeItem(editingDraftKey);
      closeEditor();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirming?.id) return;
    setDelBusy(true);
    try {
      await cms('cms_product_delete', { id: confirming.id });
      localStorage.removeItem(getDraftKey(confirming.id));
      setConfirming(null);
      load();
    } catch (e: any) {
      alert(e?.message || 'Could not delete product');
    } finally {
      setDelBusy(false);
    }
  };

  const dup = async (id?: string) => {
    await cms('cms_product_duplicate', { id });
    load();
  };

  const archive = async (p: Prod) => {
    await cms('cms_product_archive', { id: p.id, status: p.status === 'archived' ? 'active' : 'archived' });
    load();
  };

  const addImages = async (files?: FileList | null) => {
    if (!files || !editing) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadMedia(f, 'product'));
      setEditing((prev) => prev ? { ...prev, images: uniqueStrings([...(prev.images || []), ...urls]) } : prev);
      loadMedia();
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) => editing && setEditing({ ...editing, images: (editing.images || []).filter((_, x) => x !== i) });
  const moveImage = (from: number, to: number) => {
    if (!editing) return;
    const imgs = [...(editing.images || [])];
    if (to < 0 || to >= imgs.length) return;
    const [item] = imgs.splice(from, 1);
    imgs.splice(to, 0, item);
    setEditing({ ...editing, images: imgs });
  };
  const makeCover = (index: number) => moveImage(index, 0);
  const toggleFromMedia = (m: Media) => {
    if (!editing) return;
    const imgs = editing.images || [];
    const nextImages = imgs.includes(m.url) ? imgs.filter((u) => u !== m.url) : [...imgs, m.url];
    const currentOrigins = normalizeOrigins(editing);
    const nextOrigins = imgs.includes(m.url)
      ? currentOrigins.filter((entry: any) => entry.url !== m.url)
      : [...currentOrigins, { media_id: m.id, url: m.url, name: m.name || '', origin: 'media', position: currentOrigins.length }];
    setEditing({
      ...editing,
      images: nextImages,
      metadata: {
        ...(editing.metadata || {}),
        created_from_media: Boolean((editing.metadata?.created_from_media) || nextOrigins.length),
        source_media: nextOrigins,
        image_origin_map: nextOrigins,
      },
    });
  };

  const toggleCat = (id: string) => {
    const cur = editing?.metadata?.categories || [];
    setEditing((prev) => prev ? {
      ...prev,
      metadata: { ...(prev.metadata || {}), categories: cur.includes(id) ? cur.filter((c: string) => c !== id) : [...cur, id] },
    } : prev);
  };

  const toggleSize = (s: string) => {
    const cur = editing?.metadata?.sizes || [];
    setEditing((prev) => prev ? {
      ...prev,
      metadata: { ...(prev.metadata || {}), sizes: cur.includes(s) ? cur.filter((x: string) => x !== s) : [...cur, s] },
    } : prev);
  };
  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s || !editing) return;
    const cur = editing.metadata?.sizes || [];
    if (!cur.includes(s)) {
      setEditing({ ...editing, metadata: { ...(editing.metadata || {}), sizes: [...cur, s] } });
    }
    setCustomSize('');
  };

  const toggleAddon = (i: number) => {
    if (!editing) return;
    const list = [...(editing.metadata?.addons || [])];
    list[i] = { ...list[i], enabled: !list[i].enabled };
    setEditing({ ...editing, metadata: { ...(editing.metadata || {}), addons: list } });
  };
  const setAddonPrice = (i: number, price: number) => {
    if (!editing) return;
    const list = [...(editing.metadata?.addons || [])];
    list[i] = { ...list[i], price };
    setEditing({ ...editing, metadata: { ...(editing.metadata || {}), addons: list } });
  };
  const removeAddon = (i: number) => {
    if (!editing) return;
    const list = (editing.metadata?.addons || []).filter((_: any, x: number) => x !== i);
    setEditing({ ...editing, metadata: { ...(editing.metadata || {}), addons: list } });
  };
  const addAddon = () => {
    if (!editing || !newAddon.label.trim()) return;
    const list = [...(editing.metadata?.addons || []), { label: newAddon.label.trim(), price: Math.round(newAddon.price * 100), enabled: true }];
    setEditing({ ...editing, metadata: { ...(editing.metadata || {}), addons: list } });
    setNewAddon({ label: '', price: 0 });
  };

  const toggleVariant = (material: string, size: string) => {
    if (!editing) return;
    const title = `${material} · ${size}`;
    const exists = (editing.variants || []).find((v) => v.title === title);
    const variants = exists
      ? (editing.variants || []).filter((v) => v.title !== title)
      : [...(editing.variants || []), { title, option1: size, option2: material, price: editing.price, inventory_qty: 10 }];
    setEditing({ ...editing, variants, has_variants: variants.length > 0 });
  };

  const discardDraft = () => {
    if (!editingDraftKey || !editBase) return;
    localStorage.removeItem(editingDraftKey);
    setEditing(normalizeProductForEditor(editBase));
    setDraftRecovered(false);
    setAutoSavedAt(null);
  };

  const filtered = useMemo(() => products.filter((p) =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || (p.handle || '').includes(q.toLowerCase()))
  ), [products, q, statusFilter]);

  const countBy = (s: string) => products.filter((p) => p.status === s).length;
  const tops = cats.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => cats.filter((c) => c.parent_id === id);
  const catName = (id: string) => cats.find((c) => c.id === id)?.title || '';
  const hasUnsavedChanges = editing ? JSON.stringify(normalizeProductForSave(editing)) !== initialSnapshot.current : false;
  const originCount = editing ? normalizeOrigins(editing).length : 0;
  const draftLabel = autoSavedAt ? new Date(autoSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full border border-[#e6e6e6] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-[#FF6A00] outline-none" />
        </div>
        <button onClick={() => open()} className="bg-[#FF6A00] text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 text-sm font-medium hover:bg-[#e85f00] shadow-sm"><Plus size={16} /> New Product</button>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {([
          ['all', `All (${products.length})`],
          ['active', `Active (${countBy('active')})`],
          ['draft', `Draft (${countBy('draft')})`],
          ['archived', `Archived (${countBy('archived')})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key as any)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === key ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#e6e6e6] text-[#666] hover:border-[#1D1D1D]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && <p className="text-[#8D8D8D] col-span-full py-10 text-center">No products yet.</p>}
        {filtered.map((p) => {
          const mediaLinked = Boolean(p.metadata?.created_from_media || (p.metadata?.source_media || p.metadata?.image_origin_map || []).length);
          return (
            <div key={p.id} className="group bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-[5/4] bg-[#f6f6f6]">
                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={22} className="text-[#ddd]" /></div>}
                <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                  {mediaLinked && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#F3EFFF] text-[#6E44FF]">Media</span>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => open(p)} title="Edit" className="bg-white/95 rounded-md p-1.5 shadow hover:text-[#FF6A00]"><Pencil size={14} /></button>
                  <button onClick={() => dup(p.id)} title="Duplicate" className="bg-white/95 rounded-md p-1.5 shadow hover:text-[#6E44FF]"><Copy size={14} /></button>
                  <button onClick={() => archive(p)} title={p.status === 'archived' ? 'Restore from archive' : 'Archive'} className={`bg-white/95 rounded-md p-1.5 shadow ${p.status === 'archived' ? 'hover:text-emerald-600' : 'hover:text-amber-600'}`}>{p.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}</button>
                  {owner && <button onClick={() => setConfirming(p)} title="Delete permanently" className="bg-white/95 rounded-md p-1.5 shadow hover:text-red-500"><Trash2 size={14} /></button>}
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium truncate text-[#1D1D1D]">{p.name}</p>
                <p className="text-sm text-[#FF6A00] font-semibold">{formatMAD(p.price)}</p>
                <p className="text-[11px] text-[#aaa] truncate mt-0.5">{(p.metadata?.categories || []).map(catName).filter(Boolean).join(', ') || p.product_type || 'Uncategorized'}</p>
                {mediaLinked && <p className="text-[11px] text-[#6E44FF] mt-1">Linked to {(p.metadata?.source_media || p.metadata?.image_origin_map || []).length || p.images?.length || 0} media file(s)</p>}
                {p.metadata?.created_by?.name && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${p.metadata.created_by.color || '#888'}1a`, color: p.metadata.created_by.color || '#666', border: `1px solid ${p.metadata.created_by.color || '#ccc'}55` }} title={`Added by ${p.metadata.created_by.name}`}>
                    <span>{p.metadata.created_by.emoji || '🦊'}</span>
                    by {p.metadata.created_by.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 border-t border-[#f3f3f3] md:hidden">
                <button onClick={() => open(p)} className="py-2 text-xs text-[#444] hover:bg-[#fafafa]">Edit</button>
                <button onClick={() => dup(p.id)} className="py-2 text-xs text-[#444] hover:bg-[#fafafa]">Copy</button>
                <button onClick={() => archive(p)} className="py-2 text-xs text-[#444] hover:bg-[#fafafa]">{p.status === 'archived' ? 'Restore' : 'Archive'}</button>
                {owner ? <button onClick={() => setConfirming(p)} className="py-2 text-xs text-red-500 hover:bg-red-50">Delete</button> : <div className="py-2 text-xs text-[#bbb]">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEditor}>
          <div className="bg-white w-full max-w-4xl max-h-[94vh] overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#eee] px-6 py-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl">{editing.id ? 'Edit' : 'New'} Product</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    {draftRecovered && <span className="text-[11px] px-2 py-1 rounded-full bg-[#F3EFFF] text-[#6E44FF]">Recovered local draft</span>}
                    {originCount > 0 && <span className="text-[11px] px-2 py-1 rounded-full bg-[#FFF6F0] text-[#FF6A00]">{originCount} media-linked image(s)</span>}
                    {draftLabel && <span className="text-[11px] text-[#8D8D8D] inline-flex items-center gap-1"><Save size={12} /> Auto-saved {draftLabel}</span>}
                  </div>
                </div>
                <button onClick={closeEditor} className="text-[#999] hover:text-black"><X size={20} /></button>
              </div>
              {(draftRecovered || hasUnsavedChanges) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${hasUnsavedChanges ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {hasUnsavedChanges ? 'Unsaved changes are being preserved locally' : 'No pending changes'}
                  </span>
                  <button type="button" onClick={discardDraft} className="inline-flex items-center gap-1 border border-[#e6e6e6] rounded-lg px-3 py-1.5 hover:border-[#1D1D1D]">
                    <RotateCcw size={12} /> Discard local draft
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-7">
              <div className="grid grid-cols-2 gap-3">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Product title" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 col-span-2 focus:border-[#FF6A00] outline-none" />
                <input value={editing.product_type || ''} onChange={(e) => setEditing({ ...editing, product_type: e.target.value })} placeholder="Type (e.g. Poster)" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <input value={editing.tags as string || ''} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="tags, comma separated" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <input type="number" value={editing.price ? editing.price / 100 : ''} onChange={(e) => setEditing({ ...editing, price: Math.round(Number(e.target.value) * 100) })} placeholder="Base price (MAD)" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 focus:border-[#FF6A00] outline-none" />
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="border border-[#e6e6e6] rounded-lg px-3 py-2.5">
                  {['active', 'draft', 'archived'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" className="border border-[#e6e6e6] rounded-lg px-3 py-2.5 col-span-2 h-20 focus:border-[#FF6A00] outline-none" />
              </div>

              <section>
                <div className="flex items-center gap-2 mb-3"><Tag size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Categories <span className="text-[#aaa] font-normal">(select one or more)</span></h4></div>
                {tops.length === 0 ? <p className="text-xs text-[#aaa]">No categories yet — create them in the Categories tab.</p> : (
                  <div className="space-y-3">
                    {tops.map((t) => {
                      const kids = childrenOf(t.id);
                      const sel = editing.metadata.categories;
                      return (
                        <div key={t.id} className="border border-[#f0f0f0] rounded-lg p-3">
                          <button type="button" onClick={() => toggleCat(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-1 ${sel.includes(t.id) ? 'bg-[#FF6A00] text-white' : 'bg-[#f5f5f5] text-[#555] hover:bg-[#ececec]'}`}>
                            {sel.includes(t.id) && <Check size={12} />}{t.title}
                          </button>
                          {kids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                              {kids.map((k) => (
                                <button key={k.id} type="button" onClick={() => toggleCat(k.id)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${sel.includes(k.id) ? 'bg-[#1D1D1D] text-white' : 'bg-[#fafafa] border border-[#eee] text-[#777] hover:border-[#FF6A00]'}`}>
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

              <section>
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-2"><ImageIcon size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Images</h4></div>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setPicker(true)} className="text-xs inline-flex items-center gap-1 border border-[#e6e6e6] rounded-lg px-3 py-1.5 hover:border-[#FF6A00]"><FolderOpen size={13} /> From media</button>
                    <label className="text-xs inline-flex items-center gap-1 bg-[#1D1D1D] text-white rounded-lg px-3 py-1.5 cursor-pointer hover:bg-black">
                      <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload multiple'}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(editing.images || []).map((img, i) => {
                    const origin = normalizeOrigins(editing).find((entry: any) => entry.url === img);
                    return (
                      <div key={`${img}-${i}`} className="relative group rounded-xl border border-[#eee] overflow-hidden bg-white">
                        <img src={img} className="w-full aspect-square object-cover" />
                        <div className="p-2 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            {i === 0 ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF6A00] text-white">Cover</span> : <span className="text-[10px] text-[#bbb]">Image {i + 1}</span>}
                            {origin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EFFF] text-[#6E44FF]">media</span>}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <button type="button" onClick={() => makeCover(i)} title="Make cover" className="h-8 rounded-md border border-[#eee] grid place-items-center hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-40" disabled={i === 0}><Star size={13} /></button>
                            <button type="button" onClick={() => moveImage(i, i - 1)} title="Move left" className="h-8 rounded-md border border-[#eee] grid place-items-center hover:border-[#1D1D1D] disabled:opacity-40" disabled={i === 0}><ArrowLeft size={13} /></button>
                            <button type="button" onClick={() => moveImage(i, i + 1)} title="Move right" className="h-8 rounded-md border border-[#eee] grid place-items-center hover:border-[#1D1D1D] disabled:opacity-40" disabled={i === (editing.images || []).length - 1}><ArrowRight size={13} /></button>
                            <button type="button" onClick={() => removeImage(i)} title="Remove image" className="h-8 rounded-md border border-red-100 text-red-500 grid place-items-center hover:bg-red-50"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!editing.images || editing.images.length === 0) && <p className="text-xs text-[#bbb] py-6 col-span-full">No images selected yet.</p>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3"><Ruler size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Available Sizes</h4></div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[...new Set([...PRESET_SIZES, ...(editing.metadata.sizes || [])])].map((s) => {
                    const active = (editing.metadata.sizes || []).includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${active ? 'bg-[#FF6A00] text-white border-[#FF6A00]' : 'border-[#e6e6e6] text-[#666] hover:border-[#FF6A00]'}`}>{s}</button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())} placeholder="Custom size e.g. 120x180" className="border border-[#e6e6e6] rounded-lg px-3 py-2 text-sm flex-1 focus:border-[#FF6A00] outline-none" />
                  <button type="button" onClick={addCustomSize} className="bg-[#1D1D1D] text-white px-4 rounded-lg text-sm">Add</button>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3"><Sparkles size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Add-ons & Extras <span className="text-[#aaa] font-normal">(toggle + set extra price)</span></h4></div>
                <div className="space-y-2">
                  {(editing.metadata.addons || []).map((a: AddOn, i: number) => (
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

              <section>
                <div className="flex items-center gap-2 mb-3"><Layers size={15} className="text-[#FF6A00]" /><h4 className="font-medium text-sm">Variants — Material × Size <span className="text-[#aaa] font-normal">(optional, priced separately)</span></h4></div>
                <div className="space-y-2">
                  {MATERIALS.map((m) => (
                    <div key={m} className="flex flex-wrap items-center gap-2">
                      <span className="w-20 text-xs text-[#555]">{m}</span>
                      {PRESET_SIZES.map((s) => {
                        const title = `${m} · ${s}`;
                        const active = (editing.variants || []).find((v) => v.title === title);
                        return <button key={s} type="button" onClick={() => toggleVariant(m, s)} className={`px-2 py-1 text-[11px] rounded border ${active ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#e6e6e6] text-[#888] hover:border-[#FF6A00]'}`}>{s}</button>;
                      })}
                    </div>
                  ))}
                </div>
                {(editing.variants || []).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {(editing.variants || []).map((v) => (
                      <div key={v.title} className="flex items-center justify-between text-sm bg-[#fafafa] rounded px-2 py-1 gap-3">
                        <span className="min-w-0 truncate">{v.title}</span>
                        <div className="flex items-center gap-2">
                          <input type="number" value={v.inventory_qty} onChange={(e) => setEditing({ ...editing, variants: (editing.variants || []).map((x) => x.title === v.title ? { ...x, inventory_qty: Math.max(0, Math.round(Number(e.target.value))) } : x) })} className="border border-[#e6e6e6] rounded px-2 py-1 w-20 text-right" title="Inventory" />
                          <input type="number" value={v.price / 100} onChange={(e) => setEditing({ ...editing, variants: (editing.variants || []).map((x) => x.title === v.title ? { ...x, price: Math.round(Number(e.target.value) * 100) } : x) })} className="border border-[#e6e6e6] rounded px-2 py-1 w-28 text-right" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#eee] px-6 py-4 flex justify-between gap-3 items-center">
              <div className="text-xs text-[#8D8D8D]">
                {hasUnsavedChanges ? 'Changes are waiting to be saved to the product database.' : 'All current changes match the latest saved snapshot.'}
              </div>
              <div className="flex gap-3">
                <button onClick={closeEditor} className="px-4 py-2 text-sm text-[#8D8D8D]">Close</button>
                <button disabled={busy || !editing.name.trim()} onClick={save} className="bg-[#FF6A00] text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#e85f00]">{busy ? 'Saving…' : 'Save Product'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {picker && editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]" onClick={() => setPicker(false)}>
          <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg">Select from uploaded media</h3>
                <p className="text-sm text-[#8D8D8D] mt-1">Selecting from media also stores linkage metadata, so future edits stay traceable.</p>
              </div>
              <button onClick={() => setPicker(false)}><X size={18} /></button>
            </div>
            {media.length === 0 ? <p className="text-sm text-[#aaa] py-10 text-center">No media uploaded yet.</p> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {media.map((m) => {
                  const sel = (editing.images || []).includes(m.url);
                  return (
                    <button key={m.id} onClick={() => toggleFromMedia(m)} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${sel ? 'border-[#FF6A00]' : 'border-transparent'}`}>
                      <img src={m.url} className="w-full h-full object-cover" />
                      {sel && <span className="absolute inset-0 bg-[#FF6A00]/25 flex items-center justify-center"><Check size={22} className="text-white drop-shadow" /></span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between items-center mt-5 gap-3 flex-wrap">
              <p className="text-xs text-[#8D8D8D]">The first selected image becomes the cover. Reorder images later inside the product editor.</p>
              <button onClick={() => setPicker(false)} className="bg-[#FF6A00] text-white px-6 py-2.5 rounded-lg text-sm font-medium">Done ({(editing.images || []).length} selected)</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        title={`Delete “${confirming?.name || ''}”?`}
        message={<span>This permanently removes <b>only this product</b> and its variants. Other products are <b>not</b> affected. To keep it but hide it from the store, use <b>Archive</b> instead. This cannot be undone.</span>}
        confirmLabel="Delete product"
        busy={delBusy}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
};

export default ProductsPanel;
