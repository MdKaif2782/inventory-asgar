'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { StockReport, Product } from '@/lib/types';

export default function ReportsPage() {
  const [stockReport, setStockReport] = useState<StockReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productReport, setProductReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stock' | 'product'>('stock');

  useEffect(() => {
    Promise.all([
      api.get('/reports/stock'),
      api.get('/products'),
    ])
      .then(([stockRes, productsRes]) => {
        setStockReport(stockRes.data);
        setProducts(productsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadProductReport = async (productId: string) => {
    if (!productId) return;
    try {
      const { data } = await api.get(`/reports/product/${productId}`);
      setProductReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-gray-500">Loading reports...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('stock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Stock Report
        </button>
        <button
          onClick={() => setTab('product')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Product Report
        </button>
      </div>

      {tab === 'stock' && (
        <div className="space-y-4">
          {stockReport.map((item) => (
            <div key={item.product.id} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.product.name}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  Total: {item.totalQuantity} {item.product.unit}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {item.godowns.map((g) => (
                  <div key={g.godown.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">{g.godown.name}</p>
                    <p className="text-lg font-bold text-gray-900">{g.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {stockReport.length === 0 && (
            <div className="text-gray-500 text-center py-8">No stock data available</div>
          )}
        </div>
      )}

      {tab === 'product' && (
        <div>
          <div className="mb-4">
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                loadProductReport(e.target.value);
              }}
              className="px-3 py-2 border rounded-lg min-w-[250px]"
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {productReport && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {productReport.product?.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700">Total Purchased</p>
                  <p className="text-2xl font-bold text-green-900">{productReport.totalPurchased}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-700">Total Sold</p>
                  <p className="text-2xl font-bold text-orange-900">{productReport.totalSold}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">Current Stock</p>
                  <p className="text-2xl font-bold text-blue-900">{productReport.currentStock}</p>
                </div>
              </div>
              <h4 className="text-md font-semibold text-gray-700 mb-3">Godown Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {productReport.godownBreakdown?.map((g: any) => (
                  <div key={g.godown.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">{g.godown.name}</p>
                    <p className="text-lg font-bold text-gray-900">{g.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
