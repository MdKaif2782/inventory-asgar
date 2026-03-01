'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { Product, Godown, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart3, Package, Warehouse, ShoppingCart, TrendingUp, TrendingDown,
  Boxes, Filter, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, Activity, ArrowUpDown, Calculator
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ReportFilters {
  startDate: string;
  endDate: string;
  productId: string;
  godownId: string;
  createdById: string;
}

interface Summary {
  totalProducts: number;
  totalGodowns: number;
  totalSales: number;
  totalPurchases: number;
  totalSalesValue: number;
  totalPurchaseValue: number;
  totalSalesQuantity: number;
  totalPurchaseQuantity: number;
  totalStockQuantity: number;
  profitMargin: number;
}

interface TrendData {
  date: string;
  totalAmount: number;
  quantity: number;
}

interface TopProduct {
  product: Product;
  totalQuantitySold: number;
  totalRevenue: number;
  transactionCount: number;
}

interface StockDistribution {
  godown: Godown;
  totalQuantity: number;
  products: Array<{ product: Product; quantity: number }>;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SaleRecord {
  id: string;
  date: string;
  product: Product;
  godown: Godown;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  companyName: string;
  gpNo: string;
  createdBy: { id: string; name: string };
}

interface PurchaseRecord {
  id: string;
  date: string;
  product: Product;
  godown: Godown;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  companyName: string;
  gpNo: string;
  createdBy: { id: string; name: string };
}

interface ProfitLossAnalysis {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  cogs: number;
  netProfit: number;
  netMarginPercent: number;
  totalSalesCount: number;
  totalPurchasesCount: number;
  avgSaleValue: number;
  avgPurchaseValue: number;
  comparison: {
    prevRevenue: number;
    prevCost: number;
    prevProfit: number;
    revenueGrowth: number;
    profitGrowth: number;
  };
}

interface ProfitTrendData {
  date: string;
  revenue: number;
  cost: number;
  cogs: number;
  profit: number;
  salesQty: number;
  purchaseQty: number;
}

interface ProductProfitability {
  product: Product;
  totalRevenue: number;
  totalCogs: number;
  profit: number;
  marginPercent: number;
  qtySold: number;
  saleCount: number;
  avgSellingPrice: number;
  avgCostPrice: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    productId: '',
    godownId: '',
    createdById: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [salesTrend, setSalesTrend] = useState<TrendData[]>([]);
  const [purchaseTrend, setPurchaseTrend] = useState<TrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [stockDistribution, setStockDistribution] = useState<StockDistribution[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossAnalysis | null>(null);
  const [profitTrend, setProfitTrend] = useState<ProfitTrendData[]>([]);
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([]);
  const [salesTable, setSalesTable] = useState<PaginatedResponse<SaleRecord> | null>(null);
  const [purchaseTable, setPurchaseTable] = useState<PaginatedResponse<PurchaseRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [salesSort, setSalesSort] = useState({ sortBy: 'date', sortOrder: 'desc' });
  const [purchaseSort, setPurchaseSort] = useState({ sortBy: 'date', sortOrder: 'desc' });

  const buildQueryString = useCallback((extraParams: Record<string, unknown> = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.godownId) params.append('godownId', filters.godownId);
    if (filters.createdById) params.append('createdById', filters.createdById);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    return params.toString();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const [productsRes, godownsRes, usersRes] = await Promise.all([
        api.get('/products'),
        api.get('/godowns'),
        api.get('/users'),
      ]);
      setProducts(productsRes.data);
      setGodowns(godownsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryString();
      const [
        summaryRes,
        salesTrendRes,
        purchaseTrendRes,
        topProductsRes,
        stockDistRes,
        profitLossRes,
        profitTrendRes,
        productProfitRes,
      ] = await Promise.all([
        api.get(`/reports/summary?${qs}`),
        api.get(`/reports/sales-trend?${qs}`),
        api.get(`/reports/purchase-trend?${qs}`),
        api.get(`/reports/top-products?${qs}&limit=10`),
        api.get(`/reports/stock-distribution?${qs}`),
        api.get(`/reports/profit-loss?${qs}`),
        api.get(`/reports/profit-trend?${qs}`),
        api.get(`/reports/product-profitability?${qs}&limit=10`),
      ]);
      setSummary(summaryRes.data);
      setSalesTrend(salesTrendRes.data);
      setPurchaseTrend(purchaseTrendRes.data);
      setTopProducts(topProductsRes.data);
      setStockDistribution(stockDistRes.data);
      setProfitLoss(profitLossRes.data);
      setProfitTrend(profitTrendRes.data);
      setProductProfitability(productProfitRes.data);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  const fetchSalesTable = useCallback(async () => {
    try {
      const qs = buildQueryString({
        page: salesPage,
        limit: 10,
        sortBy: salesSort.sortBy,
        sortOrder: salesSort.sortOrder,
      });
      const res = await api.get(`/reports/sales-table?${qs}`);
      setSalesTable(res.data);
    } catch (err) {
      console.error('Failed to load sales table:', err);
    }
  }, [buildQueryString, salesPage, salesSort]);

  const fetchPurchaseTable = useCallback(async () => {
    try {
      const qs = buildQueryString({
        page: purchasePage,
        limit: 10,
        sortBy: purchaseSort.sortBy,
        sortOrder: purchaseSort.sortOrder,
      });
      const res = await api.get(`/reports/purchase-table?${qs}`);
      setPurchaseTable(res.data);
    } catch (err) {
      console.error('Failed to load purchase table:', err);
    }
  }, [buildQueryString, purchasePage, purchaseSort]);

  useEffect(() => {
    fetchFilterOptions();
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSalesTable();
  }, [fetchSalesTable]);

  useEffect(() => {
    fetchPurchaseTable();
  }, [fetchPurchaseTable]);

  const handleApplyFilters = () => {
    setSalesPage(1);
    setPurchasePage(1);
    fetchReportData();
    fetchSalesTable();
    fetchPurchaseTable();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      productId: '',
      godownId: '',
      createdById: '',
    });
    setSalesPage(1);
    setPurchasePage(1);
  };

  const toggleSalesSort = (column: string) => {
    setSalesSort(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const togglePurchaseSort = (column: string) => {
    setPurchaseSort(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Merge sales and purchase trends for combined chart
  const combinedTrend = () => {
    const map = new Map<string, { date: string; sales: number; purchases: number }>();
    salesTrend.forEach(s => {
      map.set(s.date, { date: s.date, sales: s.totalAmount, purchases: 0 });
    });
    purchaseTrend.forEach(p => {
      const existing = map.get(p.date) || { date: p.date, sales: 0, purchases: 0 };
      existing.purchases = p.totalAmount;
      map.set(p.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  if (loading && !summary) {
    return <div className="text-muted-foreground">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Comprehensive business insights</p>
        </div>
        <Button onClick={handleApplyFilters} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={filters.productId} onValueChange={(v) => setFilters({ ...filters, productId: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Godown</Label>
              <Select value={filters.godownId} onValueChange={(v) => setFilters({ ...filters, godownId: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Godowns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Godowns</SelectItem>
                  {godowns.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Created By</Label>
              <Select value={filters.createdById} onValueChange={(v) => setFilters({ ...filters, createdById: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">Apply</Button>
              <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-lg font-bold text-green-600">{formatBDT(summary.totalSalesValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Purchases</p>
                  <p className="text-lg font-bold text-blue-600">{formatBDT(summary.totalPurchaseValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${summary.profitMargin >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <Activity className={`h-5 w-5 ${summary.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profit Margin</p>
                  <p className={`text-lg font-bold ${summary.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatBDT(summary.profitMargin)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sales Count</p>
                  <p className="text-lg font-bold">{summary.totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Boxes className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Stock</p>
                  <p className="text-lg font-bold">{summary.totalStockQuantity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profit/Loss KPIs */}
      {profitLoss && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Profit & Loss Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-600 font-medium">Gross Profit</p>
                <p className={`text-xl font-bold ${profitLoss.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatBDT(profitLoss.grossProfit)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">Revenue - Purchases</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Gross Margin %</p>
                <p className="text-xl font-bold text-blue-700">
                  {profitLoss.grossMarginPercent.toFixed(1)}%
                </p>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(Math.max(profitLoss.grossMarginPercent, 0), 100)}%` }} 
                  />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">COGS</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatBDT(profitLoss.cogs)}
                </p>
                <p className="text-xs text-purple-600 mt-1">Cost of Goods Sold</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                <p className="text-xs text-teal-600 font-medium">Net Profit</p>
                <p className={`text-xl font-bold ${profitLoss.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                  {formatBDT(profitLoss.netProfit)}
                </p>
                <p className="text-xs text-teal-600 mt-1">Revenue - COGS</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                <p className="text-xs text-amber-600 font-medium">Net Margin %</p>
                <p className="text-xl font-bold text-amber-700">
                  {profitLoss.netMarginPercent.toFixed(1)}%
                </p>
                <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-amber-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(Math.max(profitLoss.netMarginPercent, 0), 100)}%` }} 
                  />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg">
                <p className="text-xs text-rose-600 font-medium">Revenue Growth</p>
                <div className="flex items-center gap-1">
                  {profitLoss.comparison.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <p className={`text-xl font-bold ${profitLoss.comparison.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitLoss.comparison.revenueGrowth >= 0 ? '+' : ''}{profitLoss.comparison.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-rose-600 mt-1">vs Previous Period</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Sale Value</p>
                <p className="text-lg font-semibold">{formatBDT(profitLoss.avgSaleValue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Purchase Value</p>
                <p className="text-lg font-semibold">{formatBDT(profitLoss.avgPurchaseValue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Sales Count</p>
                <p className="text-lg font-semibold">{profitLoss.totalSalesCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Purchase Count</p>
                <p className="text-lg font-semibold">{profitLoss.totalPurchasesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Purchase Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales vs Purchase Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatBDT(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#10b981" name="Sales" strokeWidth={2} />
                  <Line type="monotone" dataKey="purchases" stroke="#3b82f6" name="Purchases" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="product.name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatBDT(Number(v))} />
                  <Bar dataKey="totalRevenue" fill="#8b5cf6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Trend Chart */}
      {profitTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Daily Profit Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitTrend}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatBDT(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#revenueGradient)" name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#profitGradient)" name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Distribution by Godown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Warehouse className="h-5 w-5" />
            Stock Distribution by Godown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockDistribution.map(s => ({ name: s.godown.name, value: s.totalQuantity }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stockDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {stockDistribution.map((item, idx) => (
                <div key={item.godown.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-medium">{item.godown.name}</span>
                  </div>
                  <Badge variant="secondary">{item.totalQuantity.toLocaleString()} units</Badge>
                </div>
              ))}
              {stockDistribution.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No stock data</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Table</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Table</TabsTrigger>
          <TabsTrigger value="stock">Stock Table</TabsTrigger>
        </TabsList>

        {/* Sales Table */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Sales Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => toggleSalesSort('date')}>
                      <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead>GP No.</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Godown</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => toggleSalesSort('quantity')}>
                      <div className="flex items-center justify-end gap-1">Qty <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => toggleSalesSort('totalAmount')}>
                      <div className="flex items-center justify-end gap-1">Total <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesTable?.data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{s.gpNo}</Badge></TableCell>
                      <TableCell className="font-medium">{s.product?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{s.godown?.name}</Badge></TableCell>
                      <TableCell className="text-right">{s.quantity}</TableCell>
                      <TableCell className="text-right">{formatBDT(s.unitPrice)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatBDT(s.totalAmount)}</TableCell>
                      <TableCell>{s.companyName}</TableCell>
                      <TableCell className="text-muted-foreground">{s.createdBy?.name}</TableCell>
                    </TableRow>
                  ))}
                  {(!salesTable || salesTable.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No sales found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {salesTable && salesTable.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {salesTable.pagination.page} of {salesTable.pagination.totalPages} ({salesTable.pagination.total} records)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={salesPage === 1} onClick={() => setSalesPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={salesPage >= salesTable.pagination.totalPages} onClick={() => setSalesPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Table */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Purchase Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => togglePurchaseSort('date')}>
                      <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead>GP No.</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Godown</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => togglePurchaseSort('quantity')}>
                      <div className="flex items-center justify-end gap-1">Qty <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => togglePurchaseSort('totalAmount')}>
                      <div className="flex items-center justify-end gap-1">Total <ArrowUpDown className="h-3 w-3" /></div>
                    </TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseTable?.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{p.gpNo}</Badge></TableCell>
                      <TableCell className="font-medium">{p.product?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.godown?.name}</Badge></TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">{formatBDT(p.unitPrice)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatBDT(p.totalAmount)}</TableCell>
                      <TableCell>{p.companyName}</TableCell>
                      <TableCell className="text-muted-foreground">{p.createdBy?.name}</TableCell>
                    </TableRow>
                  ))}
                  {(!purchaseTable || purchaseTable.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No purchases found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {purchaseTable && purchaseTable.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {purchaseTable.pagination.page} of {purchaseTable.pagination.totalPages} ({purchaseTable.pagination.total} records)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={purchasePage === 1} onClick={() => setPurchasePage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={purchasePage >= purchaseTable.pagination.totalPages} onClick={() => setPurchasePage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Table */}
        <TabsContent value="stock">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Stock Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Godown</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead>Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockDistribution.map((item) => (
                    <TableRow key={item.godown.id}>
                      <TableCell className="font-medium">{item.godown.name}</TableCell>
                      <TableCell className="text-right font-bold">{item.totalQuantity.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.products.slice(0, 5).map((p) => (
                            <Badge key={p.product.id} variant="outline" className="text-xs">
                              {p.product.name}: {p.quantity}
                            </Badge>
                          ))}
                          {item.products.length > 5 && (
                            <Badge variant="secondary" className="text-xs">+{item.products.length - 5} more</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stockDistribution.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No stock data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
