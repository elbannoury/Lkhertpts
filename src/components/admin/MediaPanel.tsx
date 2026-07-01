import React, { useEffect, useRef, useState } from 'react';
import { cms, uploadMedia, isOwner } from './cms';
import ConfirmDialog from './ConfirmDialog';
import { Upload, Trash2, Search, Copy, Check, Download, Film, CheckSquare, Square, PackagePlus, X, PencilLine } from 'lucide-react';

const isVideo = (m: any) => {
  const u = (m.url || '').toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/.test(u) || (m.category || '').includes('video');
};

const emptyCreateForm = {
  name: '',
  product_type: 'Artwork',
  status: 'draft',
  description: '',
  tags: 'from-media',
  price: '',
};

const MediaPanel: React.FC = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const fileRef = useRef<HTMLInputElement>(null);
  const owner = isOwner();
  const [confirmDel, setConfirmDel] = useState<{ kind: 'one'; item: any } | { kind: 'bulk'; items: any[] } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = async () => {
    const r = await cms('cms_media_list');
    setMedia(r.media || []);
  };
  useEffect(() => { load(); }, []);

  const onFiles = async (files?: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      try { await uploadMedia(f, 'library'); } catch (e: any) { alert(e?.message || 'Upload failed'); }
    }
    setUploading(false);
    load();
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadOne = async (m: any) => {
    try {
      const res = await fetch(m.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = m.name || m.url.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      window.open(m.url, '_blank');
    }
  };

  const download = async (m: any) => {
    setBusy(m.id);
    try { await downloadOne(m); } finally { setBusy(null); }
  };

  const del = (m: any) => {
    if (!m?.id) {
      setNotice('This item can’t be deleted (missing id). Try refreshing the media library.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    setConfirmDel({ kind: 'one', item: m });
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filtered = media.filter((m) => (m.name || '').toLowerCase().includes(q.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const selectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((m) => m.id)));
  };
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
    setCreateOpen(false);
  };
  const selectedItems = () => media.filter((m) => selected.has(m.id));
  const selectedImages = () => selectedItems().filter((m) => !isVideo(m));

  const bulkDownload = async () => {
    setBulkBusy(true);
    for (const m of selectedItems()) {
      await downloadOne(m);
      await new Promise((r) => setTimeout(r, 350));
    }
    setBulkBusy(false);
  };

  const bulkDelete = () => {
    const items = selectedItems();
    if (!items.length) return;
    setConfirmDel({ kind: 'bulk', items });
  };

  const runConfirmedDelete = async () => {
    if (!confirmDel) return;
    setConfirmBusy(true);
    try {
      if (confirmDel.kind === 'one') {
        await cms('cms_media_delete', { id: confirmDel.item.id });
      } else {
        await cms('cms_media_delete_many', { ids: confirmDel.items.map((m) => m.id) });
        exitSelect();
      }
      await load();
      setConfirmDel(null);
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    } finally {
      setConfirmBusy(false);
    }
  };

  const openCreateProduct = () => {
    const imgs = selectedImages();
    if (!imgs.length) {
      setNotice('Select at least one image (not video) to build a product.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    const guessedName = (imgs[0]?.name || 'New artwork').replace(/\.[^.]+$/, '');
    setCreateForm({
      ...emptyCreateForm,
      name: guessedName || 'New artwork',
      product_type: 'Artwork',
      tags: 'from-media',
    });
    setCreateOpen(true);
  };

  const createProduct = async () => {
    const imgs = selectedImages();
    if (!imgs.length) {
      setNotice('Select at least one image (not video) to build a product.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    if (!createForm.name.trim()) {
      setNotice('Add a product name before saving the draft.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const mediaOrigins = imgs.map((m, index) => ({
      media_id: m.id,
      url: m.url,
      name: m.name || `media-${index + 1}`,
      origin: 'media',
      position: index,
      selected_at: new Date().toISOString(),
    }));

    const product = {
      name: createForm.name.trim(),
      product_type: createForm.product_type.trim() || 'Artwork',
      description: createForm.description.trim(),
      status: createForm.status || 'draft',
      tags: createForm.tags,
      price: Math.round(Number(createForm.price || 0) * 100),
      images: mediaOrigins.map((m) => m.url),
      metadata: {
        categories: [],
        sizes: [],
        addons: [],
        created_from_media: true,
        source: 'media-library',
        source_media_ids: mediaOrigins.map((m) => m.media_id),
        source_media: mediaOrigins,
        image_origin_map: mediaOrigins,
      },
      variants: [],
      has_variants: false,
    };

    setCreateBusy(true);
    try {
      await cms('cms_product_save', { product });
      setNotice(`Draft product created with ${mediaOrigins.length} media image(s). Open Products to refine, duplicate, archive, or publish it.`);
      setCreateOpen(false);
      exitSelect();
    } catch (e: any) {
      setNotice(e?.message || 'Could not create product');
    } finally {
      setCreateBusy(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  return (
    <div>
      {notice && <div className="mb-4 text-sm bg-[#F3EFFF] border border-[#d9ccff] text-[#5a3fd6] rounded-lg px-4 py-2.5">{notice}</div>}

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" className="w-full border border-[#ddd] pl-9 pr-3 py-2 text-sm rounded-lg" />
        </div>
        <button onClick={() => (selectMode ? exitSelect() : setSelectMode(true))} className={`px-4 py-2 flex items-center gap-1.5 text-sm rounded-lg border ${selectMode ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#ddd] text-[#444] hover:border-[#6E44FF]'}`}>
          {selectMode ? <><X size={15} /> Done</> : <><CheckSquare size={15} /> Select</>}
        </button>
        <button onClick={() => fileRef.current?.click()} className="bg-[#6E44FF] text-white px-4 py-2 flex items-center gap-1 text-sm rounded-lg disabled:opacity-50" disabled={uploading}>
          <Upload size={15} /> {uploading ? 'Uploading…' : 'Bulk Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>

      {selectMode && (
        <div className="sticky top-2 z-10 mb-5 flex items-center gap-3 flex-wrap bg-white border border-[#e6e0ff] shadow-sm rounded-xl px-4 py-3">
          <button onClick={selectAll} className="text-sm flex items-center gap-1.5 text-[#444] hover:text-[#6E44FF]">
            {allSelected ? <CheckSquare size={16} className="text-[#6E44FF]" /> : <Square size={16} />} {allSelected ? 'Unselect all' : 'Select all'}
          </button>
          <span className="text-sm text-[#888]">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={openCreateProduct} disabled={!selected.size || bulkBusy} className="bg-[#C9A23F] text-black font-medium px-3.5 py-2 flex items-center gap-1.5 text-sm rounded-lg disabled:opacity-40 hover:bg-[#E8C766]">
              <PackagePlus size={15} /> Create product
            </button>
            <button onClick={bulkDownload} disabled={!selected.size || bulkBusy} className="border border-[#ddd] px-3.5 py-2 flex items-center gap-1.5 text-sm rounded-lg disabled:opacity-40 hover:border-[#6E44FF]">
              <Download size={15} /> Download
            </button>
            {(owner || true) && (
              <button onClick={bulkDelete} disabled={!selected.size || bulkBusy} className="border border-red-200 text-red-500 px-3.5 py-2 flex items-center gap-1.5 text-sm rounded-lg disabled:opacity-40 hover:bg-red-50">
                <Trash2 size={15} /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {filtered.length === 0 && <p className="text-[#8D8D8D] col-span-full">No media yet. Upload your first files.</p>}
        {filtered.map((m) => {
          const isSel = selected.has(m.id);
          return (
            <div key={m.id} className={`bg-white border rounded-xl overflow-hidden transition-shadow ${isSel ? 'border-[#6E44FF] ring-2 ring-[#6E44FF]/30' : 'border-[#eee]'} ${busy === m.id ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className={`relative aspect-square bg-[#0c0c0c] ${selectMode ? 'cursor-pointer' : ''}`} onClick={() => selectMode && toggle(m.id)}>
                {isVideo(m)
                  ? <video src={m.url} className="w-full h-full object-cover" muted />
                  : <img src={m.url} className="w-full h-full object-cover" loading="lazy" />}
                {isVideo(m) && <span className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1"><Film size={12} /></span>}
                {selectMode && (
                  <span className={`absolute top-2 right-2 w-6 h-6 rounded-md grid place-items-center ${isSel ? 'bg-[#6E44FF] text-white' : 'bg-white/80 text-[#888]'}`}>
                    {isSel ? <Check size={15} /> : <Square size={14} />}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-2 gap-1">
                <p className="text-[11px] text-[#999] truncate flex-1" title={m.name || ''}>{m.name || 'untitled'}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => copy(m.url)} title="Copy link" className="w-7 h-7 grid place-items-center rounded-md text-[#888] hover:bg-[#f3f0ff] hover:text-[#6E44FF]">
                    {copied === m.url ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <button onClick={() => download(m)} title="Download" className="w-7 h-7 grid place-items-center rounded-md text-[#888] hover:bg-[#f3f0ff] hover:text-[#6E44FF]">
                    <Download size={14} />
                  </button>
                  <button onClick={() => del(m)} title="Delete" className="w-7 h-7 grid place-items-center rounded-md text-[#bbb] hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={() => !createBusy && setCreateOpen(false)}>
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#eee] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-[#1D1D1D]">Create product from selected media</h3>
                <p className="text-sm text-[#8D8D8D] mt-1">{selectedImages().length} image(s) will be saved in the same order shown in Media.</p>
              </div>
              <button onClick={() => !createBusy && setCreateOpen(false)} className="text-[#999] hover:text-black"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Product title</label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="New artwork" className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Type</label>
                  <input value={createForm.product_type} onChange={(e) => setCreateForm({ ...createForm, product_type: e.target.value })} placeholder="Artwork" className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Status</label>
                  <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]">
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Base price (MAD)</label>
                  <input type="number" min="0" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} placeholder="0" className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Tags</label>
                  <input value={createForm.tags} onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })} placeholder="from-media, new" className="w-full border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-1.5">Description</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description for the draft product" className="w-full h-24 border border-[#ddd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#6E44FF]" />
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#8D8D8D] mb-2">Selected image order</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {selectedImages().map((m, index) => (
                    <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#eee] bg-[#fafafa]">
                      <img src={m.url} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{index === 0 ? 'Cover' : index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#eee] flex items-center justify-between gap-3">
              <p className="text-xs text-[#8D8D8D] flex items-center gap-1.5"><PencilLine size={14} /> Product will include media linkage metadata for later edits.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => !createBusy && setCreateOpen(false)} className="px-4 py-2 text-sm text-[#777]">Cancel</button>
                <button disabled={createBusy} onClick={createProduct} className="bg-[#6E44FF] text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#5a35e0]">
                  {createBusy ? 'Saving draft…' : 'Create draft product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title={confirmDel?.kind === 'bulk' ? 'Delete selected media?' : 'Delete this image?'}
        message={
          confirmDel?.kind === 'bulk'
            ? <>You are about to permanently delete <b>{confirmDel.items.length}</b> selected file{confirmDel.items.length > 1 ? 's' : ''}. Only these selected items will be removed — nothing else is affected.</>
            : <>Only “<b>{(confirmDel as any)?.item?.name || 'this file'}</b>” will be permanently removed. No other media will be deleted. This cannot be undone.</>
        }
        confirmLabel={confirmDel?.kind === 'bulk' ? `Delete ${confirmDel.items.length}` : 'Delete image'}
        busy={confirmBusy}
        onConfirm={runConfirmedDelete}
        onCancel={() => !confirmBusy && setConfirmDel(null)}
      />
    </div>
  );
};

export default MediaPanel;
