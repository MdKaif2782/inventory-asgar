'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatBDT } from '@/lib/utils';
import type { Stock } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, Warehouse } from 'lucide-react';

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stock')
      .then(({ data }) => setStocks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalStockValue = stocks.reduce((sum, stock) => {
    const price = stock.product?.price || 0;
    return sum + (stock.quantity * price);
  }, 0);

  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  if (loading) {
    return <div className="text-muted-foreground">Loading stock...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Overview</h1>
        <p className="text-sm text-muted-foreground">Current inventory levels across all godowns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Records</p>
                <p className="text-2xl font-bold">{stocks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatBDT(totalStockValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Stock Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Godown</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => {
                const price = stock.product?.price || 0;
                const value = stock.quantity * price;
                return (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {stock.product?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stock.godown?.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {price ? formatBDT(price) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{stock.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {price ? formatBDT(value) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {stocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No stock records found
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
