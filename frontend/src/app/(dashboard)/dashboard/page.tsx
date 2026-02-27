'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { DashboardSummary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  CircleDollarSign,
  Receipt,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(({ data }) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="text-destructive">Failed to load dashboard</div>;
  }

  const statCards = [
    { label: 'Total Products', value: summary.totalProducts, icon: Package, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Godowns', value: summary.totalGodowns, icon: Warehouse, color: 'text-green-600 bg-green-100' },
    { label: 'Stock Quantity', value: summary.totalStockQuantity, icon: ClipboardList, color: 'text-cyan-600 bg-cyan-100' },
    { label: 'Total Purchases', value: summary.totalPurchases, icon: ShoppingCart, color: 'text-purple-600 bg-purple-100' },
    { label: 'Total Sales', value: summary.totalSales, icon: TrendingUp, color: 'text-orange-600 bg-orange-100' },
  ];

  const financialCards = [
    { label: 'Purchase Value', value: formatBDT(summary.totalPurchaseValue), icon: Receipt, color: 'text-rose-600 bg-rose-100' },
    { label: 'Sales Revenue', value: formatBDT(summary.totalSaleValue), icon: CircleDollarSign, color: 'text-emerald-600 bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financialCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
