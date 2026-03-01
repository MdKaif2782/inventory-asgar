'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { Sale, Product, Godown } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, TrendingUp, Package, Warehouse, Calculator, 
  User, FileText, Calendar, ArrowRight, Check, X, Banknote 
} from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    productId: '',
    godownId: '',
    quantity: '',
    unitPrice: '',
    companyName: '',
    gpNo: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes, godownsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products'),
        api.get('/godowns'),
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

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      productId: '',
      godownId: '',
      quantity: '',
      unitPrice: '',
      companyName: '',
      gpNo: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError('');
    setStep(1);
  };

  const calculatedTotal = () => {
    const qty = Number(form.quantity) || 0;
    const price = Number(form.unitPrice) || 0;
    return qty * price;
  };

  const canProceedStep1 = form.productId && form.godownId;
  const canProceedStep2 = form.quantity && form.unitPrice;
  const canSubmit = form.companyName && form.gpNo && form.date;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/sales', {
        productId: form.productId,
        godownId: form.godownId,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        companyName: form.companyName,
        gpNo: form.gpNo,
        date: form.date,
      });
      setSheetOpen(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === form.productId);
  const selectedGodown = godowns.find(g => g.id === form.godownId);

  if (loading) {
    return <div className="text-muted-foreground">Loading sales...</div>;
  }

  const totalSalesValue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-green-600" />
            Sales
          </h1>
          <p className="text-sm text-muted-foreground">Record and track outgoing inventory</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            <p className="text-xs text-emerald-600 font-medium">Total Sales</p>
            <p className="text-lg font-bold text-emerald-700">{sales.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-xs text-green-600 font-medium">Revenue</p>
            <p className="text-lg font-bold text-green-700">{formatBDT(totalSalesValue)}</p>
          </div>
          
          <PermissionGate permission="sales.create">
            <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
              <SheetTrigger asChild>
                <Button size="lg" className="shadow-lg bg-green-600 hover:bg-green-700">
                  <Plus className="h-5 w-5 mr-2" />
                  New Sale
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Banknote className="h-6 w-6 text-green-600" />
                    Record New Sale
                  </SheetTitle>
                </SheetHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between py-6">
                  {[
                    { num: 1, label: 'Product', icon: Package },
                    { num: 2, label: 'Pricing', icon: Calculator },
                    { num: 3, label: 'Customer', icon: User },
                  ].map((s, idx) => (
                    <div key={s.num} className="flex items-center">
                      <div className={`flex items-center gap-2 ${step >= s.num ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          step > s.num ? 'bg-green-600 border-green-600 text-white' :
                          step === s.num ? 'border-green-600 bg-green-50' : 'border-muted'
                        }`}>
                          {step > s.num ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                      </div>
                      {idx < 2 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                    <X className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* Step 1: Product & Godown Selection */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Package className="h-5 w-5 text-green-600" />
                        Select Product to Sell
                      </h3>

                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto mb-4">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setForm({ ...form, productId: p.id })}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              form.productId === p.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-transparent bg-white hover:border-green-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-sm text-muted-foreground">{p.unit} {p.sku && `• ${p.sku}`}</p>
                              </div>
                              {p.price && <Badge variant="secondary">{formatBDT(p.price)}</Badge>}
                            </div>
                          </div>
                        ))}
                        {products.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">No products available</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          From Godown *
                        </Label>
                        <Select value={form.godownId} onValueChange={(v) => setForm({ ...form, godownId: v })}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select godown..." />
                          </SelectTrigger>
                          <SelectContent>
                            {godowns.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                <div className="flex items-center gap-2">
                                  <Warehouse className="h-4 w-4" />
                                  {g.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(2)} 
                        disabled={!canProceedStep1}
                        className="px-8"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Quantity & Pricing */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Calculator className="h-5 w-5 text-amber-600" />
                        Quantity & Pricing
                      </h3>

                      {/* Selected Product Preview */}
                      <div className="bg-white rounded-lg p-3 mb-4 border flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{selectedProduct?.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedProduct?.unit}</p>
                        </div>
                        <Badge variant="outline">{selectedGodown?.name}</Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              placeholder="0"
                              className="bg-white text-lg font-semibold"
                              value={form.quantity}
                              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="unitPrice">Selling Price (BDT) *</Label>
                            <Input
                              id="unitPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="bg-white text-lg font-semibold"
                              value={form.unitPrice}
                              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Total Calculation */}
                    {form.quantity && form.unitPrice && (
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-300">
                        <div className="text-center">
                          <p className="text-sm text-green-700 font-medium mb-1">Total Sale Amount</p>
                          <p className="text-4xl font-bold text-green-800">{formatBDT(calculatedTotal())}</p>
                          <p className="text-sm text-green-600 mt-2">
                            {form.quantity} × {formatBDT(Number(form.unitPrice))}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep(3)} 
                        disabled={!canProceedStep2}
                        className="px-8"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Customer Details */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-blue-600" />
                        Customer Information
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Name *
                          </Label>
                          <Input
                            id="companyName"
                            placeholder="Enter customer/company name"
                            className="bg-white"
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gpNo" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            GP No. *
                          </Label>
                          <Input
                            id="gpNo"
                            placeholder="Enter gate pass number"
                            className="bg-white"
                            value={form.gpNo}
                            onChange={(e) => setForm({ ...form, gpNo: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Sale Date *
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            className="bg-white"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-slate-50 rounded-xl p-6 border">
                      <h4 className="font-semibold mb-4">Sale Summary</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Product</span>
                          <span className="font-medium">{selectedProduct?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From Godown</span>
                          <span className="font-medium">{selectedGodown?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium">{form.quantity} {selectedProduct?.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unit Price</span>
                          <span className="font-medium">{formatBDT(Number(form.unitPrice))}</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between">
                          <span className="font-semibold">Total Revenue</span>
                          <span className="font-bold text-lg text-green-600">{formatBDT(calculatedTotal())}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={!canSubmit || submitting}
                        className="px-8 bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? 'Recording...' : 'Complete Sale'}
                        <Check className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </PermissionGate>
        </div>
      </div>

      {/* Sales History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sales History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>GP No.</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Godown</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{new Date(s.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{s.gpNo}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{s.product?.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.godown?.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{s.quantity}</TableCell>
                  <TableCell className="text-right">{formatBDT(s.unitPrice)}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{formatBDT(s.totalAmount)}</TableCell>
                  <TableCell>{s.companyName}</TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No sales recorded yet</p>
                    <p className="text-sm">Click &quot;New Sale&quot; to record your first sale</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
