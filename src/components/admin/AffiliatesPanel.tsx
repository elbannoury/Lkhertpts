import React, { useEffect, useState } from 'react';
import { cms } from '@/components/admin/cms';
import { formatMAD } from '@/data/catalog';
import { Plus, Trash2, KeyRound, Copy, Check, ToggleLeft, ToggleRight, Percent, Users, Package } from 'lucide-react';

const AffiliatesPanel: React.FC<{ canManageRates?: boolean }> = ({ canManageRates = true }) => {
  const [view, setView] = useState<'team' | 'rates'>('team');
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', password: '', commission_rate: '10' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPass, setResetPass] = useState('');

  // product rates
  const [products, setProducts] = useState<any[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rateDraft, setRateDraft] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = async () => {
    const r = await cms('aff_list');
    setAffiliates(r?.affiliates || []); setStats(r?.stats || {}); setOrders(r?.orders || []);
  };
  const loadRates = async () => {
    const r = await cms('aff_product_rates');
    setProducts(r?.products || []); setRates(r?.rates || {});
    const draft: Record<string, string> = {};
    (r?.products || []).forEach((p: any) => { draft[p.id] = String(r?.rates?.[p.id] ?? ''); });
    setRateDraft(draft);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (view === 'rates') loadRates(); }, [view]);

  const create = async () => {
    if (!form.name || !form.phone || !form.password) return;
    setCreating(true);
    try { await cms('aff_create', { name: form.name, phone: form.phone, password: form.password, commission_rate: Number(form.commission_rate) || 10 }); }
    finally { setCreating(false); }
    setForm({ name: '', phone: '', password: '', commission_rate: '10' });
    load();
  };
  const updateRate = async (a: any, rate: string) => { await cms('aff_update', { id: a.id, commission_rate: Number(rate) || 0 }); load(); };
  const toggleStatus = async (a: any) => { await cms('aff_update', { id: a.id, status: a.status === 'active' ? 'suspended' : 'active' }); load(); };
  const resetPassword = async (a: any) => { if (!resetPass) return; await cms('aff_update', { id: a.id, password: resetPass }); setResetFor(null); setResetPass(''); };
  const del = async (a: any) => { if (confirm(`Remove affiliate ${a.name}?`)) { await cms('aff_delete', { id: a.id }); load(); } };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard?.writeText(link); setCopied(code); setTimeout(() => setCopied(null), 1500);
  };

  const setProductRate = async (productId: string) => {
    const v = Number(rateDraft[productId]) || 0;
    await cms('aff_product_rate_set', { product_id: productId, commission_rate: v });
    setRates((r) => ({ ...r, [productId]: v }));
    setSavedId(productId); setTimeout(() => setSavedId(null), 1500);
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setView('team')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${view === 'team' ? 'bg-[#6E44FF] text-white' : 'bg-white border border-[#eee]'}`}><Users size={15} /> Affiliators</button>
        {canManageRates && <button onClick={() => setView('rates')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${view === 'rates' ? 'bg-[#6E44FF] text-white' : 'bg-white border border-[#eee]'}`}><Package size={15} /> Per-product commission</button>}
      </div>

      {view === 'team' && (
        <>
          <div className="bg-white border border-[#eee] rounded-xl p-6 mb-6">
            <h3 className="font-serif text-xl mb-1">Add Affiliator</h3>
            <p className="text-sm text-[#8D8D8D] mb-4">They sign in at <span className="font-mono bg-[#F2ECE6] px-1.5 py-0.5 rounded">/aff</span> with their phone number &amp; password to track their commissions.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (login)" className="border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
              <div className="flex items-center border border-[#ddd] rounded-lg px-3"><input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="10" className="w-full py-2.5 text-sm outline-none" /><Percent size={14} className="text-[#aaa]" /></div>
              <button onClick={create} disabled={creating} className="bg-[#6E44FF] text-white rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-1 disabled:opacity-50"><Plus size={15} /> {creating ? 'Adding…' : 'Add'}</button>
            </div>
          </div>

          <div className="space-y-3">
            {affiliates.length === 0 && <p className="text-[#8D8D8D]">No affiliators yet.</p>}
            {affiliates.map((a) => {
              const s = stats[a.code] || { sales: 0, revenue: 0, commission: 0 };
              return (
                <div key={a.id} className="bg-white border border-[#eee] rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg">{a.name} <span className={`text-[11px] uppercase tracking-wide ml-2 ${a.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>{a.status}</span></p>
                      <p className="text-sm text-[#8D8D8D]">{a.phone} · code <span className="font-mono">{a.code}</span></p>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div><p className="text-lg font-bold">{s.sales}</p><p className="text-[10px] uppercase tracking-wide text-[#aaa]">Sales</p></div>
                      <div><p className="text-lg font-bold">{formatMAD(s.revenue)}</p><p className="text-[10px] uppercase tracking-wide text-[#aaa]">Revenue</p></div>
                      <div><p className="text-lg font-bold text-[#E04E00]">{formatMAD(s.commission)}</p><p className="text-[10px] uppercase tracking-wide text-[#aaa]">Commission</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#ddd] rounded-lg px-2">
                        <input type="number" defaultValue={a.commission_rate} onBlur={(e) => updateRate(a, e.target.value)} className="w-12 py-1.5 text-sm outline-none text-center" />
                        <Percent size={13} className="text-[#aaa]" />
                      </div>
                      <button onClick={() => copyLink(a.code)} title="Copy referral link" className="text-[#6E44FF] hover:opacity-70">{copied === a.code ? <Check size={17} /> : <Copy size={17} />}</button>
                      <button onClick={() => setResetFor(resetFor === a.id ? null : a.id)} title="Reset password" className="text-[#888] hover:text-[#6E44FF]"><KeyRound size={17} /></button>
                      <button onClick={() => toggleStatus(a)}>{a.status === 'active' ? <ToggleRight className="text-[#6E44FF]" /> : <ToggleLeft className="text-[#bbb]" />}</button>
                      <button onClick={() => del(a)} className="text-[#ccc] hover:text-red-500"><Trash2 size={17} /></button>
                    </div>
                  </div>
                  {resetFor === a.id && (
                    <div className="mt-4 flex gap-2 items-center">
                      <input value={resetPass} onChange={(e) => setResetPass(e.target.value)} placeholder="New password" className="border border-[#ddd] rounded-lg px-3 py-2 text-sm" />
                      <button onClick={() => resetPassword(a)} className="bg-[#1D1D1D] text-white px-4 py-2 rounded-lg text-sm">Set</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {orders.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl mb-3">Recent referred sales</h3>
              <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
                {orders.slice(0, 25).map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3 border-b border-[#f3f3f3] text-sm last:border-0">
                    <span className="font-mono text-[#6E44FF]">{o.affiliate_code}</span>
                    <span className="flex-1 px-4 truncate text-[#555]">{o.product_name || '—'}{o.customer_name ? ` · ${o.customer_name}` : ''}</span>
                    <span className="text-[#888] mr-4">{formatMAD(o.order_total)}</span>
                    <span className="font-bold text-[#E04E00]">+{formatMAD(o.commission)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'rates' && canManageRates && (
        <div>
          <p className="text-sm text-[#8D8D8D] mb-5">Set a custom affiliate commission % per product. Products without a custom rate fall back to each affiliator's default rate.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-[#eee] rounded-xl p-4 flex items-center gap-3">
                <img src={p.images?.[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover bg-[#f3f3f3]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-[#aaa]">{formatMAD(p.price)}{rates[p.id] != null ? ` · ${rates[p.id]}%` : ''}</p>
                </div>
                <div className="flex items-center border border-[#ddd] rounded-lg px-2">
                  <input type="number" value={rateDraft[p.id] ?? ''} onChange={(e) => setRateDraft((d) => ({ ...d, [p.id]: e.target.value }))} placeholder="—" className="w-12 py-1.5 text-sm outline-none text-center" />
                  <Percent size={12} className="text-[#aaa]" />
                </div>
                <button onClick={() => setProductRate(p.id)} className="text-[#6E44FF]">{savedId === p.id ? <Check size={17} /> : <Plus size={17} className="rotate-45" style={{ display: 'none' }} />}{savedId === p.id ? null : <span className="text-xs font-medium">Save</span>}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatesPanel;
