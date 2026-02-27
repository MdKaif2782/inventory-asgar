'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Stock } from '@/lib/types';

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock')
      .then(({ data }) => setStocks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading stock...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Stock Overview</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Godown</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{stock.product?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{stock.godown?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{stock.quantity}</td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No stock records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
