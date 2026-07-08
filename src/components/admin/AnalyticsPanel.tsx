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
  
  /**
   * Enhanced label formatting for better readability
   * - Day: Shows MM-DD format (e.g., "12-25")
   * - Week: Shows week number with year (e.g., "W52 2024")
   * - Month: Shows month name and year (e.g., "Dec 2024")
   * - Year: Shows full year (e.g., "2024")
   */
  const fmtLabel = (l: string) => {
    if (range === 'day') {
      // Format: MM-DD → "Dec 25"
      const parts = l.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[month - 1]} ${day}`;
      }
      return l.slice(5);
    }
    
    if (range === 'week') {
      // Format: YYYY-Www → "W52 2024"
      const match = l.match(/(\d{4})-W(\d{2})/);
      if (match) {
        return `W${parseInt(match[2])} ${match[1]}`;
      }
      return l;
    }
    
    if (range === 'month') {
      // Format: YYYY-MM → "Dec 2024"
      const parts = l.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[1]);
        const year = parts[0];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[month - 1]} ${year}`;
      }
      return l;
    }
    
    // Year format: just show the year
    return l;
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
        
        <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
          {series.length === 0 && <p className="text-sm text-[#bbb]">No data yet.</p>}
          {series.map((d) => (
            <div key={d.label} className="group flex-1 flex flex-col items-center justify-end h-full min-w-0 flex-shrink-0" style={{ minWidth: '40px' }}>
              <div className="relative w-full flex justify-center">
                <span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition text-[10px] bg-[#1D1D1D] text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                  {d.orders} · {formatMAD(d.revenue)}
                </span>
              </div>
              <div className="w-full rounded-t bg-gradient-to-t from-[#6E44FF] to-[#9B7BFF] transition-all" style={{ height: `${(d.orders / maxVal) * 100}%`, minHeight: d.orders > 0 ? 4 : 1 }} />
              <span className="text-[9px] text-[#aaa] mt-1.5 truncate w-full text-center leading-tight">{fmtLabel(d.label)}</span>
            </div>
          ))}
        </div>
        
        {/* Legend explaining the time ranges */}
        <div className="mt-4 text-xs text-[#999] border-t border-[#f0f0f0] pt-3">
          {range === 'day' && <p>📅 Showing daily data for the selected period</p>}
          {range === 'week' && <p>📊 Showing weekly data (W01 = Week 1, W52 = Week 52)</p>}
          {range === 'month' && <p>📈 Showing monthly data across the year</p>}
          {range === 'year' && <p>📆 Showing yearly data</p>}
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
