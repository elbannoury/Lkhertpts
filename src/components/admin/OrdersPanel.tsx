import React, { useEffect, useMemo, useState } from 'react';
import { formatMAD } from '@/data/catalog';
import { isOwner, cms } from './cms';
import { Search, Download, Trash2 } from 'lucide-react';

const STATUSES = ['pending', 'paid', 'in_progress', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  in_progress: 'Still working on it',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};


const OrdersPanel: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [track, setTrack] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const owner = isOwner();

  const load = async () => {
    const r = await cms('cms_orders_list', { limit: 200 });
    setOrders(r?.orders || []);
  };
  useEffect(() => { load(); }, []);

  // Real-time status change: optimistic UI + persisted via owner-auth, then refresh.
  const setOrderStatus = async (id: string, s: string) => {
    setSaving(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: s } : o)));
    try { await cms('cms_order_status', { id, status: s, tracking_code: track[id] }); } catch { /* ignore */ }
    await load();
    setSaving(null);
  };

  const saveTracking = async (o: any) => { await cms('cms_order_status', { id: o.id, status: o.status, tracking_code: track[o.id] ?? o.tracking_code }); load(); };
  const del = async (id: string) => { if (confirm('Delete this order?')) { await cms('cms_order_delete', { id }); load(); } };

  const filtered = useMemo(() => orders.filter((o) => {
    const a = o.shipping_address || {};
    const hay = `${o.id} ${a.name} ${a.phone} ${a.city}`.toLowerCase();
    return (status === 'all' || o.status === status) && hay.includes(q.toLowerCase());
  }), [orders, q, status]);

  const exportCSV = () => {
    const rows = [['Order ID', 'Name', 'Phone', 'City', 'Status', 'Total', 'Date']];
    filtered.forEach((o) => {
      const a = o.shipping_address || {};
      rows.push([o.id, a.name || '', a.phone || '', a.city || '', o.status, (o.total / 100).toFixed(2), (o.created_at || '').slice(0, 10)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `pitsiky-orders-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, city…" className="w-full border border-[#ddd] pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[#ddd] px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <button onClick={exportCSV} className="border border-[#ddd] px-4 py-2 flex items-center gap-1 text-sm"><Download size={15} /> CSV</button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-[#8D8D8D]">No orders found.</p>}
        {filtered.map((o) => {
          const a = o.shipping_address || {};
          return (
            <div key={o.id} className="bg-white border border-[#eee] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">#{o.id.slice(0, 8).toUpperCase()} · {a.name}</p>
                  <p className="text-sm text-[#8D8D8D]">{a.phone} · {a.city} · {formatMAD(o.total)}</p>
                  {o.items?.length > 0 && <p className="text-xs text-[#aaa] mt-1">{o.items.map((it: any) => `${it.quantity}× ${it.product_name}`).join(', ')}</p>}
                  {o.notes && <p className="text-xs text-[#aaa] mt-1 italic">"{o.notes}"</p>}
                  <p className="text-[10px] text-[#ccc] mt-1">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                  <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} disabled={saving === o.id} className="border border-[#ddd] px-3 py-2 text-sm rounded-lg disabled:opacity-50">
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  {saving === o.id && <span className="text-[11px] text-[#6E44FF]">Saving…</span>}
                  {owner && <button onClick={() => del(o.id)} className="text-[#ccc] hover:text-red-500"><Trash2 size={16} /></button>}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersPanel;
