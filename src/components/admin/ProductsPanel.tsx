import React, { useEffect, useState } from 'react';
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
  const [editing, setEditing] = useState<Prod | null>(null);
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

  const load = async () => { const r = await cms('cms_products_list'); setProducts(r.products || []); };
  const loadCats = async () => { const r = await cms('cms_categories_list'); setCats(r.categories || []); };
  const loadMedia = async () => { const r = await cms('cms_media_list'); setMedia(r.media || []); };
  useEffect(() => { load(); loadCats(); loadMedia(); }, []);

  const open = (p?: Prod) => {
    const base = p ? { ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''), variants: p.variants || [] } : { ...empty };
    const md = base.metadata || {};
    // normalize metadata fields
    base.metadata = {
      categories: Array.isArray(md.categories) ? md.categories : [],
      sizes: Array.isArray(md.sizes) ? md.sizes : [],
      addons: Array.isArray(md.addons) && md.addons.length ? md.addons : DEFAULT_ADDONS.map((a) => ({ ...a })),
    };
    setEditing(base);
  };

  const setMd = (patch: any) => editing && setEditing({ ...editing, metadata: { ...editing.metadata, ...patch } });

  const save = async () => {
    if (!editing?.name) return;
    setBusy(true);
    await cms('cms_product_save', { product: editing });
    setBusy(false); setEditing(null); load();
  };
  const confirmDelete = async () => {
    if (!confirming?.id) return;
    setDelBusy(true);
    try { await cms('cms_product_delete', { id: confirming.id }); setConfirming(null); load(); }
    catch (e: any) { alert(e?.message || 'Could not delete product'); }
    finally { setDelBusy(false); }
  };
  const dup = async (id?: string) => { await cms('cms_product_duplicate', { id }); load(); };
  const archive = async (p: Prod) => { await cms('cms_product_archive', { id: p.id, status: p.status === 'archived' ? 'active' : 'archived' }); load(); };

  // ---- multi image upload ----
  const addImages = async (files?: FileList | null) => {
    if (!files || !editing) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadMedia(f, 'product'));
      setEditing((prev) => prev ? { ...prev, images: [...(prev.images || []), ...urls] } : prev);
      loadMedia();
    } finally { setUploading(false); }
  };
  const removeImage = (i: number) => editing && setEditing({ ...editing, images: editing.images!.filter((_, x) => x !== i) });
  const toggleFromMedia = (url: string) => {
    if (!editing) return;
    const imgs = editing.images || [];
    setEditing({ ...editing, images: imgs.includes(url) ? imgs.filter((u) => u !== url) : [...imgs, url] });
  };

  // ---- categories multiselect ----
  const toggleCat = (id: string) => {
    const cur = editing?.metadata?.categories || [];
    setMd({ categories: cur.includes(id) ? cur.filter((c: string) => c !== id) : [...cur, id] });
  };

  // ---- sizes multiselect ----
  const toggleSize = (s: string) => {
    const cur = editing?.metadata?.sizes || [];
    setMd({ sizes: cur.includes(s) ? cur.filter((x: string) => x !== s) : [...cur, s] });
  };
  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s) return;
    const cur = editing?.metadata?.sizes || [];
    if (!cur.includes(s)) setMd({ sizes: [...cur, s] });
    setCustomSize('');
  };

  // ---- add-ons ----
  const toggleAddon = (i: number) => {
    const list = [...(editing?.metadata?.addons || [])];
    list[i] = { ...list[i], enabled: !list[i].enabled };
    setMd({ addons: list });
  };
  const setAddonPrice = (i: number, price: number) => {
    const list = [...(editing?.metadata?.addons || [])];
    list[i] = { ...list[i], price };
    setMd({ addons: list });
  };
  const removeAddon = (i: number) => {
    const list = (editing?.metadata?.addons || []).filter((_: any, x: number) => x !== i);
    setMd({ addons: list });
  };
  const addAddon = () => {
    if (!newAddon.label.trim()) return;
    const list = [...(editing?.metadata?.addons || []), { label: newAddon.label.trim(), price: Math.round(newAddon.price * 100), enabled: true }];
    setMd({ addons: list });
    setNewAddon({ label: '', price: 0 });
  };

  // ---- variants ----
  const toggleVariant = (material: string, size: string) => {
    if (!editing) return;
    const title = `${material} · ${size}`;
    const exists = editing.variants!.find((v) => v.title === title);
    const variants = exists ? editing.variants!.filter((v) => v.title !== title)
      : [...editing.variants!, { title, option1: size, option2: material, price: editing.price, inventory_qty: 10 }];
    setEditing({ ...editing, variants, has_variants: variants.length > 0 });
  };

  const filtered = products.filter((p) =>
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

      {/* editor modal - FIX: Removed onClick handler from backdrop to prevent closing when clicking outside */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl max-h-[94vh] overflow-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#eee] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-serif text-xl">{editing.id ? 'Edit' : 'New'} Product</h3>
              <button onClick={() => setEditing(null)} className="text-[#999] hover:text-black"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-7">
              {/* basics */}
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

              {/* Save button */}
              <div className="flex gap-2 justify-end pt-4 border-t border-[#eee]">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-[#e6e6e6] text-sm font-medium hover:bg-[#f5f5f5]">Cancel</button>
                <button onClick={save} disabled={busy} className="px-4 py-2 rounded-lg bg-[#FF6A00] text-white text-sm font-medium hover:bg-[#e85f00] disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirming && <ConfirmDialog title="Delete Product" message={`Are you sure you want to permanently delete "${confirming.name}"?`} onConfirm={confirmDelete} onCancel={() => setConfirming(null)} busy={delBusy} />}
    </div>
  );
};

export default ProductsPanel;
