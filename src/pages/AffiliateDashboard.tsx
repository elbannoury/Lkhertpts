import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMAD } from '@/data/catalog';
import { Lock, LogOut, Copy, Check, TrendingUp, ShoppingBag, Wallet, Link2 } from 'lucide-react';

const AffiliateDashboard: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);


  const fetchDash = async (auth: any) => {
    const { data: r } = await supabase.functions.invoke('owner-auth', { body: { action: 'aff_me', auth } });
    if (r?.ok) { setData(r); return true; }
    return false;
  };

  useEffect(() => {
    const saved = localStorage.getItem('pts_aff_auth');
    if (saved) {
      const auth = JSON.parse(saved);
      fetchDash(auth).then((ok) => { if (ok) { setCreds(auth); setAuthed(true); } else localStorage.removeItem('pts_aff_auth'); });
    }
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('');
    try {
      const { data: r } = await supabase.functions.invoke('owner-auth', { body: { action: 'aff_login', ...creds } });
      if (!r?.ok) { setErr(r?.error || 'Invalid credentials'); setLoading(false); return; }
      setData(r); setAuthed(true);
      localStorage.setItem('pts_aff_auth', JSON.stringify(creds));
    } catch { setErr('Login failed'); }
    setLoading(false);
  };

  const logout = () => { localStorage.removeItem('pts_aff_auth'); setAuthed(false); setData(null); setCreds({ username: '', password: '' }); };

  const refLink = data?.affiliate ? `${window.location.origin}/?ref=${encodeURIComponent(data.affiliate.code)}` : '';
  const copy = () => { navigator.clipboard?.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-6">
        <form onSubmit={login} className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FF6A00] flex items-center justify-center mb-6"><Lock className="text-white" size={20} /></div>
          <h1 className="font-serif text-2xl text-white mb-2">Affiliator Dashboard</h1>
          <p className="text-[#777] text-sm mb-8">Sign in with your phone number &amp; password.</p>
          <input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} placeholder="Phone number" className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 mb-3 outline-none focus:border-[#FF6A00] rounded-lg" />
          <input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="Password" className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 mb-4 outline-none focus:border-[#FF6A00] rounded-lg" />
          {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
          <button disabled={loading} className="w-full bg-gradient-to-r from-[#FF6A00] to-[#E04E00] text-white py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50 rounded-lg">{loading ? 'Verifying…' : 'Enter'}</button>
        </form>
      </div>
    );
  }

  const t = data?.totals || { sales: 0, revenue: 0, commission: 0 };
  const byProduct = data?.byProduct || [];
  const orders = data?.orders || [];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <header className="bg-[#1D1D1D] text-white px-6 lg:px-10 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl">PITSIKY <span className="text-[#FF6A00]">Affiliates</span></h1>
          <p className="text-xs text-[#999]">Welcome, {data?.affiliate?.name} · default {data?.affiliate?.commission_rate}%</p>
        </div>
        <button onClick={logout} className="text-xs uppercase tracking-wide text-[#aaa] hover:text-white flex items-center gap-1"><LogOut size={14} /> Sign out</button>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 lg:px-10 py-10">
        {/* Referral link */}
        <div className="bg-white border border-[#eee] rounded-xl p-5 mb-8">
          <p className="text-xs uppercase tracking-wide text-[#9b8a5a] mb-2">Your referral link</p>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-0 truncate bg-[#F2ECE6] px-3 py-2.5 rounded-lg text-sm">{refLink}</code>
            <button onClick={copy} className="bg-[#6E44FF] text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5">{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>
          </div>
          <p className="text-xs text-[#8D8D8D] mt-2">Share this link — or any product link with <span className="font-mono">?ref={data?.affiliate?.code}</span> — and earn when buyers order.</p>
        </div>

        {/* Per-product affiliate links — each link carries THIS affiliate's own code */}
        {Array.isArray(data?.products) && data.products.length > 0 && (
          <div className="bg-white border border-[#eee] rounded-xl p-5 mb-8">
            <p className="text-xs uppercase tracking-wide text-[#9b8a5a] mb-3 flex items-center gap-1.5"><Link2 size={14} /> Copy a product link</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.products.map((p: any) => {
                const link = `${window.location.origin}/products/${p.handle}?ref=${encodeURIComponent(data.affiliate.code)}`;
                const done = copiedId === p.id;
                return (
                  <div key={p.id} className="flex items-center gap-3 border border-[#f0f0f0] rounded-lg p-2">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <code className="text-[11px] text-[#999] truncate block">{link}</code>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(link); setCopiedId(p.id); setTimeout(() => setCopiedId(null), 1500); }}
                      className="bg-[#6E44FF] text-white px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0"
                    >
                      {done ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#8D8D8D] mt-3">Each link is unique to your code — share it and earn your commission on every order.</p>
          </div>
        )}


        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#eee] rounded-xl p-5"><ShoppingBag className="text-[#6E44FF] mb-2" size={20} /><p className="text-2xl font-bold">{t.sales}</p><p className="text-xs uppercase tracking-wide text-[#aaa]">Sales</p></div>
          <div className="bg-white border border-[#eee] rounded-xl p-5"><TrendingUp className="text-[#6E44FF] mb-2" size={20} /><p className="text-2xl font-bold">{formatMAD(t.revenue)}</p><p className="text-xs uppercase tracking-wide text-[#aaa]">Revenue driven</p></div>
          <div className="bg-gradient-to-br from-[#FF6A00] to-[#E04E00] text-white rounded-xl p-5"><Wallet className="mb-2" size={20} /><p className="text-2xl font-bold">{formatMAD(t.commission)}</p><p className="text-xs uppercase tracking-wide opacity-90">Your earnings</p></div>
        </div>

        {/* Per product */}
        <h2 className="font-serif text-2xl mb-3">Earnings by product</h2>
        {byProduct.length === 0 ? (
          <p className="text-[#8D8D8D] mb-8">No sales yet — start sharing your link.</p>
        ) : (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden mb-8">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-[#F7F4EF] text-[10px] uppercase tracking-wide text-[#999]">
              <span>Product</span><span>Sales</span><span>Revenue</span><span>Earnings</span>
            </div>
            {byProduct.map((p: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#f3f3f3] text-sm last:border-0 items-center">
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-center w-12">{p.sales}</span>
                <span className="text-right w-24 text-[#888]">{formatMAD(p.revenue)}</span>
                <span className="text-right w-24 font-bold text-[#E04E00]">{formatMAD(p.commission)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent orders */}
        {orders.length > 0 && (
          <>
            <h2 className="font-serif text-2xl mb-3">Recent referred orders</h2>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {orders.slice(0, 30).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 border-b border-[#f3f3f3] text-sm last:border-0">
                  <span className="flex-1 truncate text-[#555]">{o.product_name || 'Order'}{o.customer_name ? ` · ${o.customer_name}` : ''}</span>
                  <span className="text-[#aaa] mr-4 hidden sm:inline">{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="text-[#888] mr-4">{formatMAD(o.order_total)}</span>
                  <span className="font-bold text-[#E04E00]">+{formatMAD(o.commission)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AffiliateDashboard;
