'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { Purchase, Product, Godown } from '@/lib/types';
import PermissionGate from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, PlusCircle } from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createNewProduct, setCreateNewProduct] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    godownId: '',
    quantity: '',
    unitPrice: '',
    companyName: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    unit: 'pcs',
    price: '',
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [purchasesRes, productsRes, godownsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/products'),
        api.get('/godowns'),
      ]);
      setPurchases(purchasesRes.data);
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
      date: new Date().toISOString().split('T')[0],
    });
    setNewProduct({ name: '', sku: '', unit: 'pcs', price: '' });
    setCreateNewProduct(false);
    setError('');
  };

  const calculatedTotal = () => {
    const qty = Number(form.quantity) || 0;
    const price = Number(form.unitPrice) || 0;
    return qty * price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = {
        godownId: form.godownId,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        companyName: form.companyName,
        date: form.date,
      };

      if (createNewProduct) {
        payload.newProduct = {
          name: newProduct.name,
          unit: newProduct.unit,
          ...(newProduct.sku && { sku: newProduct.sku }),
          ...(newProduct.price && { price: Number(newProduct.price) }),
        };
      } else {
        payload.productId = form.productId;
      }

      await api.post('/purchases', payload);
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading purchases...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchases</h1>
          <p className="text-sm text-muted-foreground">Record incoming inventory</p>
        </div>
        <PermissionGate permission="purchases.create">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Purchase</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* Product Selection or Creation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Product *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreateNewProduct(!createNewProduct)}
                      className="text-xs"
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      {createNewProduct ? 'Select Existing' : 'Create New'}
                    </Button>
                  </div>

                  {createNewProduct ? (
                    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="newProductName">Product Name *</Label>
                        <Input
                          id="newProductName"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          required={createNewProduct}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="newProductSku">SKU</Label>
                          <Input
                            id="newProductSku"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit *</Label>
                          <Select value={newProduct.unit} onValueChange={(v) => setNewProduct({ ...newProduct, unit: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pcs">Pieces</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="g">Grams</SelectItem>
                              <SelectItem value="l">Liters</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newProductPrice">Default Price (BDT)</Label>
                        <Input
                          id="newProductPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.price && `(${formatBDT(p.price)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Godown *</Label>
                  <Select value={form.godownId} onValueChange={(v) => setForm({ ...form, godownId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select godown..." />
                    </SelectTrigger>
                    <SelectContent>
                      {godowns.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (BDT) *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {form.quantity && form.unitPrice && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">{formatBDT(calculatedTotal())}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Supplier *</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Purchase</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Godown</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{p.product?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.godown?.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">{formatBDT(p.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatBDT(p.totalAmount)}</TableCell>
                  <TableCell>{p.companyName}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No purchases found
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
