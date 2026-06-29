import React, { useEffect, useState } from 'react';
import { cms } from './cms';
import { formatMAD } from '@/data/catalog';

const CustomersPanel: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { cms('cms_customers_list').then((r) => setRows(r.customers || [])); }, []);

  return (
    <div className="bg-white border border-[#eee] overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wide text-[#aaa] border-b border-[#eee]">
          <th className="p-4">Customer</th><th className="p-4">Phone</th><th className="p-4">City</th><th className="p-4">Orders</th><th className="p-4 text-right">Total Spent</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-[#bbb] text-center">No customers yet.</td></tr>}
          {rows.map((c, i) => (
            <tr key={i} className="border-b border-[#f5f5f5]">
              <td className="p-4 font-medium">{c.name || '—'}</td>
              <td className="p-4 text-[#777]">{c.phone || '—'}</td>
              <td className="p-4 text-[#777]">{c.city || '—'}</td>
              <td className="p-4">{c.orders}</td>
              <td className="p-4 text-right text-[#6E44FF] font-medium">{formatMAD(c.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersPanel;
