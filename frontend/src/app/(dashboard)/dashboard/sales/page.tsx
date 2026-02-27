'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Sale, Product, Godown } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '', godownId: '', quantity: '', companyName: '', gpNo: '', date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [salesRes, productsRes, godownsRes] = await Promise.all([
        api.get('/sales'), api.get('/products'), api.get('/godowns'),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setGodowns(godownsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/sales', { ...form, quantity: Number(form.quantity) });
      setShowForm(false);
      setForm({ productId: '', godownId: '', quantity: '', companyName: '', gpNo: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  if (loading) return <div className="text-gray-500">Loading sales...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <PermissionGate permission="sales.create">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + New Sale
          </button>
        </PermissionGate>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Record Sale</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select required value={form.godownId} onChange={(e) => setForm({ ...form, godownId: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Select Godown</option>
              {godowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input type="number" placeholder="Quantity" required min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Company Name" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="GP No." required value={form.gpNo} onChange={(e) => setForm({ ...form, gpNo: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Godown</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GP No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.product?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.godown?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{s.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.companyName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.gpNo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.createdBy?.name}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No sales found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
