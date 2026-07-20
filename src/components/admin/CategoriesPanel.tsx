import React, { useEffect, useState } from 'react';
import { cms, uploadMedia, isOwner } from './cms';
import DeleteCategoryDialog from './DeleteCategoryDialog';
import {
  Plus, Trash2, Pencil, ChevronRight, Image as ImageIcon, X, Upload, Eye, EyeOff,
  Boxes, Search, Check, Archive, ArchiveRestore, Star, GripVertical, Search as SearchIcon,
} from 'lucide-react';

interface Cat {
  id?: string; title: string; title_ar?: string; slug?: string; description?: string;
  description_ar?: string; icon?: string; cover_image?: string; banner_image?: string;
  parent_id?: string | null; position?: number; is_visible?: boolean; archived?: boolean;
  is_featured?: boolean; seo_title?: string; seo_description?: string;
}

const empty: Cat = { title: '', parent_id: null, is_visible: true, position: 0, archived: false, is_featured: false };

// ── Product picker: assign which products belong to a collection ──
const ProductManager: React.FC<{ cat: Cat; onClose: () => void }> = ({ cat, onClose }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await cms('cms_products_list');
        const list = r.products || [];
        setProducts(list);
        const pre = new Set<string>();
        list.forEach((p: any) => {
          const ids = Array.isArray(p?.metadata?.categories) ? p.metadata.categories : [];
          if (cat.id && ids.includes(cat.id)) pre.add(p.id);
        });
        setSelected(pre);
      } catch (e: any) { setErr(e?.message || 'Could not load products'); }
      finally { setLoading(false); }
    })();
  }, [cat.id]);

  const toggle = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const save = async () => {
    if (!cat.id) return;
    setBusy(true); setErr(null);
    try {
      await cms('cms_category_set_products', { categoryId: cat.id, productIds: Array.from(selected) });
      onClose();
    } catch (e: any) { setErr(e?.message || 'Could not save selection'); }
    finally { setBusy(false); }
  };

  const filtered = products.filter((p) => !q || (p.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#eee]">
          <div>
            <h3 className="font-serif text-xl">Products in “{cat.title}”</h3>
            <p className="text-xs text-[#999] mt-0.5">{selected.size} selected · set which products belong to this collection</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 border-b border-[#f3f3f3]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full border border-[#ddd] rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
        </div>
        {err && <div className="mx-4 mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {loading ? <p className="text-center text-sm text-[#999] py-10">Loading products…</p>
            : filtered.length === 0 ? <p className="text-center text-sm text-[#999] py-10">No products found.</p>
            : filtered.map((p) => {
              const on = selected.has(p.id);
              const img = Array.isArray(p.images) && p.images[0];
              return (
                <button key={p.id} onClick={() => toggle(p.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${on ? 'bg-[#FBF6EA] border border-[#C9A23F]' : 'border border-transparent hover:bg-[#FAF8F5]'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${on ? 'bg-[#C9A23F] text-black' : 'border border-[#ccc]'}`}>{on && <Check size={13} />}</div>
                  {img ? <img src={img} className="w-10 h-10 rounded object-cover bg-[#f3f3f3]" /> : <div className="w-10 h-10 rounded bg-[#F2ECE6]" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-[11px] text-[#aaa]">{p.status} · {(p.price / 100).toFixed(2)}</p>
                  </div>
                </button>
              );
            })}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-[#eee]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#8D8D8D]">Cancel</button>
          <button disabled={busy} onClick={save} className="bg-[#C9A23F] text-black font-medium px-5 py-2 text-sm rounded-lg disabled:opacity-50 hover:bg-[#E8C766]">{busy ? 'Saving…' : 'Save products'}</button>
        </div>
      </div>
    </div>
  );
};

const CategoriesPanel: React.FC = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Cat | null>(null);
  const [managing, setManaging] = useState<Cat | null>(null);
  const [confirming, setConfirming] = useState<Cat | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const owner = isOwner();

  const load = async () => { const r = await cms('cms_categories_list'); setCats(r.categories || []); };
  const loadCounts = async () => {
    try {
      const r = await cms('cms_products_list');
      const map: Record<string, number> = {};
      (r.products || []).forEach((p: any) => {
        const ids = Array.isArray(p?.metadata?.categories) ? p.metadata.categories : [];
        ids.forEach((id: string) => { map[id] = (map[id] || 0) + 1; });
      });
      setCounts(map);
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); loadCounts(); }, []);

  const matchesFilter = (c: Cat) => !filter || (c.title || '').toLowerCase().includes(filter.toLowerCase()) || (c.title_ar || '').includes(filter);
  const visibleSet = showArchived ? cats : cats.filter((c) => c.archived !== true);
  const tops = visibleSet.filter((c) => !c.parent_id).sort((a, b) => (a.position || 0) - (b.position || 0));
  const childrenOf = (id?: string) => visibleSet.filter((c) => c.parent_id === id).sort((a, b) => (a.position || 0) - (b.position || 0));
  const archivedCount = cats.filter((c) => c.archived === true).length;
  const filteredTops = tops.filter((c) => matchesFilter(c) || childrenOf(c.id).some(matchesFilter));

  const save = async () => {
    if (!editing?.title) { setUploadErr('A collection name is required.'); return; }
    setBusy(true); setUploadErr(null);
    try {
      await cms('cms_category_save', { category: editing });
      setEditing(null); load();
    } catch (e: any) {
      setUploadErr(e?.message || 'Could not save category');
    } finally { setBusy(false); }
  };

  // Permanently delete ONLY this collection (with safe options) via premium dialog.
  const confirmDelete = async (opts: { moveToId: string; subBehavior: 'delete' | 'promote' }) => {
    if (!confirming?.id) return;
    setDelBusy(true);
    try {
      await cms('cms_category_delete', { id: confirming.id, moveToId: opts.moveToId || undefined, subBehavior: opts.subBehavior });
      setConfirming(null);
      load(); loadCounts();
    } catch (e: any) {
      alert(e?.message || 'Could not delete collection');
    } finally { setDelBusy(false); }
  };

  // Archive from inside the delete dialog (safe alternative to deletion).
  const archiveFromDialog = async () => {
    if (!confirming?.id) return;
    setDelBusy(true);
    try {
      await cms('cms_category_archive', { id: confirming.id, archived: true });
      setConfirming(null);
      load();
    } catch (e: any) { alert(e?.message || 'Could not archive'); }
    finally { setDelBusy(false); }
  };

  const toggleVisible = async (c: Cat) => {
    try { await cms('cms_category_set_visible', { id: c.id, visible: !(c.is_visible !== false) }); load(); } catch (e: any) { alert(e?.message || 'Could not update visibility'); }
  };
  const toggleFeatured = async (c: Cat) => {
    try { await cms('cms_category_set_featured', { id: c.id, featured: !(c.is_featured === true) }); load(); } catch (e: any) { alert(e?.message || 'Could not update featured'); }
  };
  const toggleArchive = async (c: Cat) => {
    try { await cms('cms_category_archive', { id: c.id, archived: !(c.archived === true) }); load(); } catch (e: any) { alert(e?.message || 'Could not archive'); }
  };

  // ── Drag & drop reorder for top-level collections ──
  const onDrop = async (targetId?: string) => {
    if (!dragId || !targetId || dragId === targetId) { setDragId(null); return; }
    const order = tops.map((t) => t.id!).filter(Boolean);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) { setDragId(null); return; }
    order.splice(to, 0, order.splice(from, 1)[0]);
    // optimistic local reorder
    setCats((prev) => prev.map((c) => c.id && order.includes(c.id) ? { ...c, position: order.indexOf(c.id) } : c));
    setDragId(null);
    try { const r = await cms('cms_category_reorder', { orderedIds: order }); if (r?.categories) setCats(r.categories); } catch { load(); }
  };

  const upload = async (field: 'icon' | 'cover_image' | 'banner_image', f?: File) => {
    if (!f || !editing) return;
    setUploadErr(null);
    setUploading(field);
    try {
      const url = await uploadMedia(f, 'category');
      setEditing((prev) => prev ? { ...prev, [field]: url } : prev);
    } catch (e: any) {
      setUploadErr(e?.message || 'Upload failed. Please try a smaller image.');
    } finally { setUploading(null); }
  };

  const renderActions = (c: Cat, sm = false) => {
    if (!owner) return null;
    const sz = sm ? 14 : 16;
    const hidden = c.is_visible === false;
    const arch = c.archived === true;
    const feat = c.is_featured === true;
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => toggleFeatured(c)} title={feat ? 'Featured — click to unfeature' : 'Mark as featured'} className={feat ? 'text-[#C9A23F]' : 'text-[#ccc] hover:text-[#C9A23F]'}>
          <Star size={sz} fill={feat ? '#C9A23F' : 'none'} />
        </button>
        <button onClick={() => toggleVisible(c)} title={hidden ? 'Hidden — click to show' : 'Visible — click to hide'} className={hidden ? 'text-[#ccc] hover:text-[#1D1D1D]' : 'text-[#6E44FF] hover:text-[#5333d6]'}>
          {hidden ? <EyeOff size={sz} /> : <Eye size={sz} />}
        </button>
        <button onClick={() => setManaging(c)} title="Manage products in this collection" className="text-[#C9A23F] hover:text-[#9c7a1e]"><Boxes size={sz} /></button>
        <button onClick={() => { setEditing({ ...c }); setUploadErr(null); }} title="Edit collection" className="text-[#999] hover:text-[#1D1D1D]"><Pencil size={sz} /></button>
        <button onClick={() => toggleArchive(c)} title={arch ? 'Restore from archive' : 'Archive (hide & shelve)'} className={arch ? 'text-emerald-500 hover:text-emerald-600' : 'text-[#bbb] hover:text-amber-600'}>
          {arch ? <ArchiveRestore size={sz} /> : <Archive size={sz} />}
        </button>
        {owner && <button onClick={() => setConfirming(c)} title="Delete permanently" className="text-[#ccc] hover:text-red-500"><Trash2 size={sz} /></button>}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-[#8D8D8D]">{tops.length} main · {visibleSet.length - tops.length} sub{owner ? ' · drag to reorder · name, logo, cover, banner, SEO, featured, visibility, archive & products' : ''}</p>
        <div className="flex items-center gap-2">
          {!owner && <span className="text-xs px-3 py-2 rounded-lg bg-[#F2ECE6] text-[#999]">View only</span>}
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived((v) => !v)} className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg border ${showArchived ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#e6e6e6] text-[#666] hover:border-[#1D1D1D]'}`}>
              <Archive size={14} /> {showArchived ? 'Hide archived' : `Archived (${archivedCount})`}
            </button>
          )}
          {owner && <button onClick={() => { setEditing({ ...empty }); setUploadErr(null); }} className="bg-[#C9A23F] text-black font-medium px-4 py-2 flex items-center gap-1 text-sm hover:bg-[#E8C766] rounded-lg"><Plus size={15} /> New Collection</button>}
        </div>
      </div>

      {/* search */}
      <div className="relative mb-4 max-w-sm">
        <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter collections…" className="w-full border border-[#e6e6e6] rounded-lg pl-9 pr-3 py-2 text-sm focus:border-[#C9A23F] outline-none" />
      </div>

      <div className="space-y-2">
        {filteredTops.length === 0 && <p className="text-[#8D8D8D] py-10 text-center">No collections to show.</p>}
        {filteredTops.map((c) => {
          const kids = childrenOf(c.id);
          const open = expanded[c.id!];
          const logo = c.icon || c.cover_image;
          const hidden = c.is_visible === false;
          const arch = c.archived === true;
          const dragging = dragId === c.id;
          return (
            <div
              key={c.id}
              draggable={owner && !filter}
              onDragStart={() => setDragId(c.id!)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => onDrop(c.id)}
              onDragEnd={() => setDragId(null)}
              className={`bg-white border rounded-lg overflow-hidden transition-shadow ${dragging ? 'opacity-40 ring-2 ring-[#C9A23F]' : ''} ${arch ? 'border-dashed border-amber-300 bg-amber-50/40' : hidden ? 'border-dashed border-[#ddd] opacity-70' : 'border-[#eee]'}`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {!filter && <GripVertical size={16} className="text-[#ddd] cursor-grab shrink-0" />}
                  <button onClick={() => setExpanded({ ...expanded, [c.id!]: !open })} className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <ChevronRight size={16} className={`text-[#bbb] transition-transform shrink-0 ${open ? 'rotate-90' : ''} ${kids.length ? '' : 'opacity-0'}`} />
                    {logo ? <img src={logo} className="w-11 h-11 object-cover rounded-full border border-[#eee] bg-black shrink-0" /> : <div className="w-11 h-11 rounded-full bg-[#F2ECE6] flex items-center justify-center shrink-0"><ImageIcon size={15} className="text-[#ccc]" /></div>}
                    <div className="min-w-0">
                      <p className="font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate">{c.title}</span>
                        {c.is_featured && <span className="text-[10px] uppercase tracking-wide bg-[#FBF1D6] text-[#9c7a1e] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"><Star size={9} fill="#C9A23F" />Featured</span>}
                        {arch && <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Archived</span>}
                        {!arch && hidden && <span className="text-[10px] uppercase tracking-wide bg-[#f3f3f3] text-[#999] px-1.5 py-0.5 rounded">Hidden</span>}
                      </p>
                      <p className="text-xs text-[#aaa] truncate">/{c.slug} · {kids.length} sub · {counts[c.id!] || 0} products{c.banner_image ? ' · banner' : ''}</p>
                    </div>
                  </button>
                </div>
                {renderActions(c)}
              </div>
              {open && kids.length > 0 && (
                <div className="border-t border-[#f3f3f3] divide-y divide-[#f6f6f6]">
                  {kids.map((k) => (
                    <div key={k.id} className={`pl-14 pr-4 py-3 flex items-center justify-between ${k.archived ? 'bg-amber-50/40' : k.is_visible === false ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {k.icon && <img src={k.icon} className="w-7 h-7 rounded-full object-cover bg-black border border-[#eee] shrink-0" />}
                        <span className="text-sm truncate">{k.title}</span><span className="text-xs text-[#bbb]">/{k.slug}</span>
                        <span className="text-[10px] text-[#bbb]">· {counts[k.id!] || 0} prod</span>
                        {k.is_featured && <Star size={11} fill="#C9A23F" className="text-[#C9A23F] shrink-0" />}
                        {k.archived && <span className="text-[9px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Archived</span>}
                      </div>
                      {renderActions(k, true)}
                    </div>
                  ))}
                </div>
              )}
              {open && owner && (
                <div className="border-t border-[#f3f3f3] px-14 py-2">
                  <button onClick={() => { setEditing({ ...empty, parent_id: c.id, position: kids.length }); setUploadErr(null); }} className="text-[#C9A23F] text-xs flex items-center gap-1 hover:text-[#9c7a1e]"><Plus size={13} /> Add subcollection</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit / create modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setEditing(null); setUploadErr(null); }}>
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-auto p-6 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="font-serif text-xl">{editing.id ? 'Edit' : 'New'} {editing.parent_id ? 'Subcategory' : 'Category'}</h3><button onClick={() => { setEditing(null); setUploadErr(null); }}><X size={18} /></button></div>

            {uploadErr && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadErr}</div>
            )}

            {/* Circular brand logo uploader */}
            <div className="flex items-center gap-5 mb-6 p-4 bg-[#FAF8F5] rounded-xl border border-[#eee]">
              <div className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden border-2 border-[#C9A23F] bg-black flex items-center justify-center shadow-md">
                {editing.icon
                  ? <img src={editing.icon} className="w-full h-full object-cover" />
                  : <ImageIcon size={22} className="text-[#555]" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Category logo / icon</p>
                <p className="text-xs text-[#999] mb-2">Round logo shown on the homepage brand wheel & chips.</p>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-1.5 bg-[#1D1D1D] text-white text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-black">
                    <Upload size={13} /> {uploading === 'icon' ? 'Uploading…' : 'Upload logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => upload('icon', e.target.files?.[0])} />
                  </label>
                  {editing.icon && <button onClick={() => setEditing({ ...editing, icon: '' })} className="text-xs text-[#999] px-2 hover:text-red-500">Remove</button>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Name (EN)" className="border border-[#ddd] px-3 py-2 col-span-2 rounded-lg" />
              <input value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} placeholder="الاسم (AR)" dir="rtl" className="border border-[#ddd] px-3 py-2 col-span-2 rounded-lg" />
              <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="URL slug (auto if empty)" className="border border-[#ddd] px-3 py-2 rounded-lg" />
              <input type="number" value={editing.position ?? 0} onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })} placeholder="Display order" className="border border-[#ddd] px-3 py-2 rounded-lg" />
              <select value={editing.parent_id || ''} onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })} className="border border-[#ddd] px-3 py-2 col-span-2 rounded-lg">
                <option value="">— Top level (main) category —</option>
                {cats.filter((t) => !t.parent_id && t.id !== editing.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description (EN)" className="border border-[#ddd] px-3 py-2 col-span-2 h-20 rounded-lg" />
              <textarea value={editing.description_ar || ''} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} placeholder="الوصف (AR)" dir="rtl" className="border border-[#ddd] px-3 py-2 col-span-2 h-20 rounded-lg" />

              {/* Cover + Banner uploaders with full preview */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                {(['cover_image', 'banner_image'] as const).map((f) => (
                  <div key={f} className="border border-[#eee] rounded-lg overflow-hidden">
                    {editing[f] && <img src={editing[f]} className="h-24 w-full object-cover" />}
                    <div className="p-2 flex items-center justify-between gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#FAF8F5] text-[#555] text-xs px-2 py-2 rounded cursor-pointer hover:bg-[#F2ECE6]">
                        <Upload size={12} /> {uploading === f ? 'Uploading…' : (editing[f] ? 'Replace' : 'Upload')} {f === 'cover_image' ? 'cover' : 'banner'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(f, e.target.files?.[0])} />
                      </label>
                      {editing[f] && <button onClick={() => setEditing({ ...editing, [f]: '' })} className="text-[#bbb] hover:text-red-500"><Trash2 size={14} /></button>}
                    </div>
                    <p className="px-2 pb-2 text-[10px] text-[#aaa]">{f === 'cover_image' ? 'Card thumbnail' : 'Large header on the collection page'}</p>
                  </div>
                ))}
              </div>

              {/* SEO section */}
              <div className="col-span-2 border border-[#eee] rounded-lg p-3 bg-[#FAFAFA]">
                <p className="text-xs font-medium text-[#666] mb-2 flex items-center gap-1.5"><SearchIcon size={12} /> SEO (search engines)</p>
                <input value={editing.seo_title || ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} placeholder="SEO title" className="border border-[#ddd] px-3 py-2 rounded-lg w-full mb-2 text-sm" />
                <textarea value={editing.seo_description || ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} placeholder="SEO meta description" className="border border-[#ddd] px-3 py-2 rounded-lg w-full h-16 text-sm" />
              </div>

              {/* Featured toggle */}
              <label className="col-span-2 flex items-center justify-between bg-[#FAF8F5] border border-[#eee] rounded-lg px-4 py-3 cursor-pointer">
                <span className="text-sm flex items-center gap-2"><Star size={15} className={editing.is_featured ? 'text-[#C9A23F]' : 'text-[#bbb]'} fill={editing.is_featured ? '#C9A23F' : 'none'} /> Featured category (highlighted on storefront)</span>
                <input type="checkbox" checked={editing.is_featured === true} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="w-4 h-4 accent-[#C9A23F]" />
              </label>

              {/* Visibility toggle */}
              <label className="col-span-2 flex items-center justify-between bg-[#FAF8F5] border border-[#eee] rounded-lg px-4 py-3 cursor-pointer">
                <span className="text-sm flex items-center gap-2">{editing.is_visible !== false ? <Eye size={15} className="text-[#6E44FF]" /> : <EyeOff size={15} className="text-[#bbb]" />} Visible on the storefront</span>
                <input type="checkbox" checked={editing.is_visible !== false} onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })} className="w-4 h-4 accent-[#6E44FF]" />
              </label>

              {/* Archive toggle */}
              <label className="col-span-2 flex items-center justify-between bg-[#FAF8F5] border border-[#eee] rounded-lg px-4 py-3 cursor-pointer">
                <span className="text-sm flex items-center gap-2"><Archive size={15} className={editing.archived ? 'text-amber-600' : 'text-[#bbb]'} /> Archived (shelved, hidden from store)</span>
                <input type="checkbox" checked={editing.archived === true} onChange={(e) => setEditing({ ...editing, archived: e.target.checked })} className="w-4 h-4 accent-amber-500" />
              </label>
            </div>

            <div className="flex justify-between items-center mt-5">
              {editing.id ? (
                <button onClick={() => { const c = editing; setEditing(null); setManaging(c); }} className="text-sm text-[#C9A23F] flex items-center gap-1.5 hover:text-[#9c7a1e]"><Boxes size={15} /> Manage products</button>
              ) : <span className="text-xs text-[#bbb]">Save first, then assign products</span>}
              <div className="flex gap-3">
                <button onClick={() => { setEditing(null); setUploadErr(null); }} className="px-4 py-2 text-sm text-[#8D8D8D]">Cancel</button>
                <button disabled={busy} onClick={save} className="bg-[#C9A23F] text-black font-medium px-5 py-2 text-sm rounded-lg disabled:opacity-50 hover:bg-[#E8C766]">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product manager */}
      {managing && managing.id && <ProductManager cat={managing} onClose={() => { setManaging(null); load(); loadCounts(); }} />}

      {/* Premium safe-delete dialog */}
      <DeleteCategoryDialog
        open={!!confirming}
        category={confirming}
        allCategories={cats}
        productCount={confirming?.id ? (counts[confirming.id] || 0) : 0}
        busy={delBusy}
        onArchive={archiveFromDialog}
        onDelete={confirmDelete}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
};

export default CategoriesPanel;
