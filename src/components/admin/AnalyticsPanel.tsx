import React, { useEffect, useState } from 'react';
import { cms } from './cms';
import { formatMAD } from '@/data/catalog';
import { TrendingUp, Package, FolderTree, Users, ShoppingBag, MapPin, BarChart3 } from 'lucide-react';

type Range = 'day' | 'week' | 'month' | 'year';
const RANGE_LABEL: Record<Range, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

const AnalyticsPanel: React.FC = () => {
  const [a, setA] = useState<any>(null);
  const [range, setRange] = useState<Range>('day');
  useEffect(() => { cms('cms_analytics').then((r) => setA(r.analytics)); }, []);
  if (!a) return <p className="text-[#8D8D8D]">Loading insights…</p>;

  const cards = [
    { label: 'Revenue (est.)', value: formatMAD(a.revenue), icon: TrendingUp },
    { label: 'Orders', value: a.orders, icon: ShoppingBag },
    { label: 'Customers', value: a.customers, icon: Users },
    { label: 'Artworks', value: a.products, icon: Package },
    { label: 'Categories', value: a.categories, icon: FolderTree },
  ];

  const series: { label: string; orders: number; revenue: number }[] = a.chart?.[range] || [];
  const maxVal = Math.max(1, ...series.map((d) => d.orders));
  const fmtLabel = (l: string) => {
    if (range === 'day') return l.slice(5);          // MM-DD
    if (range === 'month') return l.slice(2);        // YY-MM
    if (range === 'week') return l.split('-W')[1] ? 'W' + l.split('-W')[1] : l;
    return l;                                         // year
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-[#eee] p-5 rounded-xl">
            <c.icon size={18} className="text-[#6E44FF] mb-3" />
            <p className="font-serif text-2xl">{c.value}</p>
            <p className="text-xs uppercase tracking-wide text-[#aaa] mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Orders chart with day / week / month / year toggle */}
      <div className="bg-white border border-[#eee] p-6 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-serif text-lg flex items-center gap-2"><BarChart3 size={17} className="text-[#6E44FF]" /> Orders · {RANGE_LABEL[range]}</h3>
          <div className="flex gap-1 bg-[#F4F1EA] rounded-lg p-1">
            {(['day', 'week', 'month', 'year'] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded-md transition ${range === r ? 'bg-[#6E44FF] text-white' : 'text-[#777] hover:text-[#1D1D1D]'}`}>
                {r === 'day' ? 'Day' : r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-48">
          {series.map((d) => {
            const hasOrders = d.orders > 0;
            return (
              <div key={d.label} className="group flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <div className="relative w-full flex justify-center">
                  <span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition text-[10px] bg-[#1D1D1D] text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {d.orders} · {formatMAD(d.revenue)}
                  </span>
                </div>
                <div
                  className={`w-full rounded-t transition-all ${hasOrders ? 'bg-gradient-to-t from-[#6E44FF] to-[#9B7BFF]' : 'bg-[#EBE7DF] border-t border-dashed border-[#D8D2C6]'}`}
                  style={{ height: hasOrders ? `${(d.orders / maxVal) * 100}%` : '3%', minHeight: hasOrders ? 4 : 3 }}
                />
                <span className={`text-[9px] mt-1.5 truncate w-full text-center ${hasOrders ? 'text-[#777]' : 'text-[#bbb]'}`}>{fmtLabel(d.label)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-[#eee] p-6 rounded-xl">
        <h3 className="font-serif text-lg mb-4 flex items-center gap-2"><MapPin size={16} /> Top Cities</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
          {a.topCities.length === 0 && <p className="text-sm text-[#bbb]">No data yet.</p>}
          {a.topCities.map((c: any) => (
            <div key={c.city} className="flex items-center justify-between text-sm border-b border-[#f4f4f4] py-1">
              <span>{c.city}</span><span className="text-[#6E44FF] font-medium">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
