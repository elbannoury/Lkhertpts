import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/contexts/I18nContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatMAD } from '@/data/catalog';
import { Search, PackageCheck, CreditCard, Truck, Home, XCircle, Loader2, Clock } from 'lucide-react';

const FLOW = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'paid', label: 'Confirmed', icon: CreditCard },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

const OrderTracking: React.FC = () => {
  const { t } = useI18n();
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true); setError(''); setOrder(null);
    try {
      const { data } = await supabase.functions.invoke('order-track', {
        body: { orderNumber, contact },
      });
      if (data?.ok) setOrder(data.order);
      else setError(data?.error || t('track.notfound'));
    } catch {
      setError(t('track.notfound'));
    }
    setLoading(false);
  };

  const cancelled = order?.status === 'cancelled';
  const currentIdx = order ? FLOW.findIndex((f) => f.key === order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FBF8F2] dark:bg-[#0C0C0C]">
      <Header />

      {/* Hero band */}
      <section className="relative mesh-bg overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#7C3AED]/30 blur-3xl float" />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-[#06B6D4]/25 blur-3xl float" style={{ animationDelay: '1.5s' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="text-[#E9C46A] text-xs tracking-[0.4em] uppercase mb-5 reveal-up">PITSIKY · Order Concierge</p>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight reveal-up d1">
            <span className="aurora-text">{t('track.title')}</span>
          </h1>
          <p className="text-white/70 mt-5 max-w-md mx-auto reveal-up d2">{t('track.sub')}</p>

          <form onSubmit={track} className="glass-dark rounded-2xl p-5 mt-10 max-w-xl mx-auto reveal-up d3 text-left">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={t('track.number')}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-[#06B6D4] tracking-widest uppercase"
              />
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t('track.contact')}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-[#06B6D4]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-aurora w-full mt-4 py-3.5 text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> {t('track.searching')}</> : <><Search size={16} /> {t('track.btn')}</>}
            </button>
            {error && <p className="text-red-300 text-sm mt-3 text-center">{error}</p>}
          </form>
        </div>
        <div className="shimmer-line" />
      </section>

      {/* Result */}
      {order && (
        <section className="max-w-3xl mx-auto px-6 py-16 reveal-up">
          <div className="bg-white dark:bg-[#121212] border border-[#E7DFD0] dark:border-[#222] rounded-2xl p-8 shadow-[0_30px_80px_-40px_rgba(124,58,237,0.4)]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#9b8a5a]">Order</p>
                <p className="font-serif text-2xl text-[#141414] dark:text-white">#{order.order_number}</p>
                {order.customer_name && <p className="text-sm text-[#8D8D8D] mt-1">{order.customer_name}{order.city ? ` · ${order.city}` : ''}</p>}
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide ${cancelled ? 'bg-red-50 text-red-600' : 'bg-gradient-to-r from-[#7C3AED]/15 to-[#06B6D4]/15 text-[#7C3AED]'}`}>
                  {cancelled ? <XCircle size={14} /> : <PackageCheck size={14} />} {order.status}
                </span>
                <p className="text-[#141414] dark:text-white font-medium mt-2">{formatMAD(order.total)}</p>
              </div>
            </div>

            {/* Timeline */}
            {cancelled ? (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl px-5 py-4">
                <XCircle size={20} /> <span>This order was cancelled. Contact us if this is unexpected.</span>
              </div>
            ) : (
              <div className="relative flex justify-between mb-2">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#eee] dark:bg-[#2a2a2a]" />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] transition-all duration-700"
                  style={{ width: `${currentIdx >= 0 ? (currentIdx / (FLOW.length - 1)) * 100 : 0}%` }}
                />
                {FLOW.map((step, i) => {
                  const done = currentIdx >= i;
                  const active = currentIdx === i;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center w-1/4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] border-transparent text-white' : 'bg-white dark:bg-[#121212] border-[#ddd] dark:border-[#333] text-[#bbb]'} ${active ? 'dot-live' : ''}`}>
                        <Icon size={16} />
                      </div>
                      <span className={`mt-2 text-[11px] text-center ${done ? 'text-[#141414] dark:text-white font-medium' : 'text-[#aaa]'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {order.tracking_code && (
              <div className="mt-8 bg-[#FBF8F2] dark:bg-[#1a1a1a] rounded-xl px-5 py-4 flex items-center gap-3">
                <Truck size={18} className="text-[#7C3AED]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9b8a5a]">Tracking code</p>
                  <p className="font-mono text-[#141414] dark:text-white">{order.tracking_code}</p>
                </div>
              </div>
            )}

            {/* Items */}
            {order.items?.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9b8a5a] mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-[#f0ece2] dark:border-[#222] pb-2">
                      <span className="text-[#141414] dark:text-[#ddd]">{it.qty}× {it.name}</span>
                      <span className="text-[#8D8D8D]">{formatMAD(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {order.status_history?.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9b8a5a] mb-3">History</p>
                <div className="space-y-3">
                  {[...order.status_history].reverse().map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#06B6D4] mt-1.5" />
                      <div>
                        <p className="text-sm text-[#141414] dark:text-white capitalize">{h.status}{h.by ? <span className="text-[#aaa] font-normal"> · by {h.by}</span> : null}</p>
                        <p className="text-xs text-[#aaa]">{new Date(h.at).toLocaleString()}</p>
                        {h.note && <p className="text-xs text-[#888] italic mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default OrderTracking;
