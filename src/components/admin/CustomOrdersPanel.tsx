import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Download, ImageOff } from 'lucide-react';
import { isOwner, cms } from './cms';

const STATUSES = ['new', 'contacted', 'quoted', 'in_progress', 'completed', 'declined'];
const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  quoted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_progress: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-600 border-red-200',
};

// لوحة "الطلبات المخصصة" — تعرض كل طلبات التصميم المخصص القادمة من صفحة
// /custom (المخزّنة في pts_poster_requests)، مع تفاصيلها الكاملة وحالة
// المتابعة وصورة مرجعية إن وُجدت.
//
// "Custom Orders" panel — shows every custom design request submitted from
// the /custom page (stored in pts_poster_requests), with full details, a
// follow-up status workflow, and the reference image if one was attached.
const CustomOrdersPanel: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [saving, setSaving] = useState<string | null>(null);
  const owner = isOwner();

  const load = async () => {
    const r = await cms('cms_poster_requests_list', { limit: 200 });
    setRequests(r?.requests || []);
  };
  useEffect(() => { load(); }, []);

  const setReqStatus = async (id: string, s: string) => {
    setSaving(id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: s } : r)));
    try { await cms('cms_poster_request_status', { id, status: s }); } catch { /* ignore */ }
    await load();
    setSaving(null);
  };

  const del = async (id: string) => {
    if (confirm('Delete this custom order request?')) { await cms('cms_poster_request_delete', { id }); load(); }
  };

  const filtered = useMemo(() => requests.filter((r) => {
    const hay = `${r.name || ''} ${r.email} ${r.phone || ''} ${r.poster_type || ''} ${r.idea || ''}`.toLowerCase();
    return (status === 'all' || r.status === status) && hay.includes(q.toLowerCase());
  }), [requests, q, status]);

  const exportCSV = () => {
    const rows = [['Date', 'Name', 'Email', 'Phone', 'Type', 'Size', 'Budget', 'Idea', 'Status']];
    filtered.forEach((r) => {
      rows.push([
        (r.created_at || '').slice(0, 10),
        r.name || '',
        r.email || '',
        r.phone || '',
        r.poster_type || '',
        r.size || '',
        r.budget || '',
        r.idea || '',
        r.status,
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `pitsiky-custom-orders-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, phone, idea…" className="w-full border border-[#ddd] pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#ddd] px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button onClick={exportCSV} className="border border-[#ddd] px-4 py-2 flex items-center gap-1 text-sm"><Download size={15} /> CSV</button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-[#8D8D8D]">No custom order requests found.</p>}
        {filtered.map((r) => (
          <div key={r.id} className="bg-white border border-[#eee] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4 flex-1 min-w-64">
                {r.reference_url ? (
                  <img src={r.reference_url} alt="Reference" className="w-20 h-20 object-cover rounded-lg border border-[#eee] shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-dashed border-[#ddd] flex items-center justify-center text-[#ccc] shrink-0">
                    <ImageOff size={22} />
                  </div>
                )}
                <div>
                  <p className="font-medium">{r.name || 'Anonymous'} <span className="text-[#8D8D8D] font-normal">· {r.email}</span></p>
                  <p className="text-sm text-[#8D8D8D]">{r.phone && `${r.phone} · `}{r.poster_type} · {r.size}{r.budget && ` · Budget: ${r.budget}`}</p>
                  <p className="text-sm text-[#444] mt-2 max-w-xl whitespace-pre-wrap">{r.idea}</p>
                  <p className="text-[10px] text-[#ccc] mt-2">{new Date(r.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[r.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </span>
                <select value={r.status} onChange={(e) => setReqStatus(r.id, e.target.value)} disabled={saving === r.id} className="border border-[#ddd] px-3 py-2 text-sm rounded-lg disabled:opacity-50">
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                {saving === r.id && <span className="text-[11px] text-[#6E44FF]">Saving…</span>}
                {r.phone && (
                  <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#1FBF6B] underline whitespace-nowrap">
                    WhatsApp
                  </a>
                )}
                {owner && <button onClick={() => del(r.id)} className="text-[#ccc] hover:text-red-500"><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomOrdersPanel;
