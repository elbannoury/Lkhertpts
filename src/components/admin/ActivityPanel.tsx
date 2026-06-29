import React, { useEffect, useState } from 'react';
import { cms } from './cms';
import { Activity, RefreshCw, Package, FolderTree, ShoppingBag, ShieldCheck, Image as ImageIcon, Settings, Trophy, Briefcase, LogIn } from 'lucide-react';

interface Log {
  id: string;
  event: string;
  detail: any;
  actor_name?: string | null;
  actor_color?: string | null;
  actor_emoji?: string | null;
  actor_role?: string | null;
  created_at: string;
}

// Map raw audit events → friendly verbs + icon + accent.
const META: Record<string, { label: (d: any) => string; icon: any; tint: string }> = {
  product_created: { label: (d) => `added product “${d?.name || d?.handle || 'item'}”`, icon: Package, tint: '#16a34a' },
  product_updated: { label: (d) => `edited product “${d?.name || d?.handle || 'item'}”`, icon: Package, tint: '#2563eb' },
  product_deleted: { label: () => `deleted a product`, icon: Package, tint: '#dc2626' },
  product_archived: { label: (d) => `${d?.status === 'archived' ? 'archived' : 'restored'} a product`, icon: Package, tint: '#d97706' },
  product_duplicated: { label: (d) => `duplicated “${d?.name || 'a product'}”`, icon: Package, tint: '#7c3aed' },
  category_created: { label: (d) => `created category “${d?.title || d?.slug || ''}”`, icon: FolderTree, tint: '#16a34a' },
  category_updated: { label: (d) => `updated category “${d?.title || d?.slug || ''}”`, icon: FolderTree, tint: '#2563eb' },
  category_deleted: { label: () => `deleted a category`, icon: FolderTree, tint: '#dc2626' },
  order_status: { label: (d) => `set order ${d?.order_number ? '#' + d.order_number : ''} to ${d?.status || ''}`, icon: ShoppingBag, tint: '#ea580c' },
  admin_created: { label: (d) => `created admin “${d?.username || ''}”`, icon: ShieldCheck, tint: '#16a34a' },
  admin_status: { label: (d) => `changed an admin to ${d?.status || ''}`, icon: ShieldCheck, tint: '#d97706' },
  admin_password_changed: { label: () => `reset an admin password`, icon: ShieldCheck, tint: '#2563eb' },
  admin_deleted: { label: () => `removed an admin`, icon: ShieldCheck, tint: '#dc2626' },
  settings_updated: { label: () => `updated site settings`, icon: Settings, tint: '#7c3aed' },
  challenge_saved: { label: (d) => `set up the challenge “${d?.title || ''}”`, icon: Trophy, tint: '#C9A23F' },
  affiliate_created: { label: (d) => `added affiliator “${d?.code || ''}”`, icon: Briefcase, tint: '#0891b2' },
  product_commission_set: { label: () => `set a product commission`, icon: Briefcase, tint: '#0891b2' },
  chat_deleted: { label: () => `removed a chat message`, icon: Activity, tint: '#dc2626' },
  login_success: { label: (d) => `signed in (${d?.role || 'admin'})`, icon: LogIn, tint: '#64748b' },
};

const FILTERS = [
  { id: 'all', label: 'All activity' },
  { id: 'products', label: 'Products', match: (e: string) => e.startsWith('product') },
  { id: 'categories', label: 'Categories', match: (e: string) => e.startsWith('category') },
  { id: 'orders', label: 'Orders', match: (e: string) => e === 'order_status' },
  { id: 'team', label: 'Team & admins', match: (e: string) => e.startsWith('admin') || e === 'challenge_saved' || e === 'chat_deleted' || e === 'login_success' },
];

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
};

const dayKey = (iso: string) => {
  const d = new Date(iso); const t = new Date();
  const same = d.toDateString() === t.toDateString();
  const yest = new Date(t.getTime() - 86400000).toDateString() === d.toDateString();
  if (same) return 'Today';
  if (yest) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const ActivityPanel: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await cms('cms_activity_log', { limit: 200 });
      setLogs(r?.logs || []);
    } catch (e: any) { setErr(e?.message || 'Could not load activity'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    const f = FILTERS.find((x) => x.id === filter);
    if (!f || f.id === 'all') return META[l.event]; // only show known/meaningful events
    return META[l.event] && (f as any).match?.(l.event);
  });

  // Group consecutive logs by day for a clean timeline.
  const groups: { day: string; items: Log[] }[] = [];
  filtered.forEach((l) => {
    const k = dayKey(l.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === k) last.items.push(l);
    else groups.push({ day: k, items: [l] });
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wide border transition ${filter === f.id ? 'bg-[#1D1D1D] text-white border-[#1D1D1D]' : 'border-[#ddd] text-[#777] hover:border-[#6E44FF]'}`}>
            {f.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-sm text-[#666] hover:text-[#6E44FF]">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {err && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5">{err}</div>}

      {loading && logs.length === 0 && <p className="text-[#8D8D8D]">Loading team activity…</p>}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-[#eee] rounded-xl p-10 text-center">
          <Activity size={28} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-[#8D8D8D]">No activity recorded yet. As your team adds products, edits categories and updates orders, every action shows up here with who did it and when.</p>
        </div>
      )}

      <div className="space-y-7">
        {groups.map((g) => (
          <div key={g.day}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#9b8a5a] mb-3">{g.day}</p>
            <div className="relative pl-5 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-[#ece6da]">
              {g.items.map((l) => {
                const m = META[l.event];
                const Icon = m?.icon || Activity;
                const color = l.actor_color || '#888';
                return (
                  <div key={l.id} className="relative mb-4 last:mb-0">
                    <span className="absolute -left-[18px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ background: m?.tint || '#bbb' }} />
                    <div className="bg-white border border-[#eee] rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-base" style={{ background: `${color}1a`, border: `1.5px solid ${color}` }}>
                        {l.actor_emoji || '🦊'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#333] leading-snug">
                          <span className="font-semibold" style={{ color }}>{l.actor_name || 'Someone'}</span>
                          {l.actor_role && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-white px-1.5 py-0.5 rounded" style={{ background: l.actor_role === 'owner' ? '#FF6A00' : '#6E44FF' }}>{l.actor_role}</span>}
                          <span className="text-[#555]"> {m ? m.label(l.detail) : l.event.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-[11px] text-[#aaa] mt-1 flex items-center gap-1.5">
                          <Icon size={12} style={{ color: m?.tint }} />
                          {timeAgo(l.created_at)} · {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityPanel;
