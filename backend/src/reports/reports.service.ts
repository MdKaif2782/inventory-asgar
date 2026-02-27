import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const [
      totalProducts,
      totalGodowns,
      totalPurchases,
      totalSales,
      stockSummary,
      purchaseValue,
      saleValue,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.godown.count(),
      this.prisma.purchase.count(),
      this.prisma.sale.count(),
      this.prisma.stock.aggregate({ _sum: { quantity: true } }),
      this.prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    ]);

    return {
      totalProducts,
      totalGodowns,
      totalPurchases,
      totalSales,
      totalStockQuantity: stockSummary._sum.quantity ?? 0,
      totalPurchaseValue: Number(purchaseValue._sum.totalAmount ?? 0),
      totalSaleValue: Number(saleValue._sum.totalAmount ?? 0),
    };
  }

  async getStockReport() {
    const stocks = await this.prisma.stock.findMany({
      include: {
        product: true,
        godown: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { godown: { name: 'asc' } }],
    });

    // Group by product
    const grouped: Record<string, any> = {};
    for (const stock of stocks) {
      if (!grouped[stock.productId]) {
        grouped[stock.productId] = {
          product: stock.product,
          totalQuantity: 0,
          godowns: [],
        };
      }
      grouped[stock.productId].totalQuantity += stock.quantity;
      grouped[stock.productId].godowns.push({
        godown: stock.godown,
        quantity: stock.quantity,
      });
    }

    return Object.values(grouped);
  }

  async getProductReport(productId: string) {
    const [product, purchaseAgg, saleAgg, stocks] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: productId } }),
      this.prisma.purchase.aggregate({
        where: { productId },
        _sum: { quantity: true, totalAmount: true },
      }),
      this.prisma.sale.aggregate({
        where: { productId },
        _sum: { quantity: true, totalAmount: true },
      }),
      this.prisma.stock.findMany({
        where: { productId },
        include: { godown: true },
      }),
    ]);

    return {
      product,
      totalPurchased: purchaseAgg._sum.quantity ?? 0,
      totalPurchaseValue: Number(purchaseAgg._sum.totalAmount ?? 0),
      totalSold: saleAgg._sum.quantity ?? 0,
      totalSaleValue: Number(saleAgg._sum.totalAmount ?? 0),
      currentStock: stocks.reduce((sum, s) => sum + s.quantity, 0),
      godownBreakdown: stocks.map((s) => ({
        godown: s.godown,
        quantity: s.quantity,
      })),
    };
  }

  async getSalesReport(filters?: {
    productId?: string;
    godownId?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.godownId) where.godownId = filters.godownId;
    if (filters?.companyName) {
      where.companyName = { contains: filters.companyName, mode: 'insensitive' };
    }
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters?.startDate) where.date.gte = new Date(filters.startDate);
      if (filters?.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [sales, summary] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.sale.aggregate({
        where,
        _sum: { quantity: true, totalAmount: true },
        _count: true,
      }),
    ]);

    return {
      sales,
      totalQuantity: summary._sum.quantity ?? 0,
      totalAmount: Number(summary._sum.totalAmount ?? 0),
      totalRecords: summary._count,
    };
  }

  async getPurchaseReport(filters?: {
    productId?: string;
    godownId?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.godownId) where.godownId = filters.godownId;
    if (filters?.companyName) {
      where.companyName = { contains: filters.companyName, mode: 'insensitive' };
    }
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters?.startDate) where.date.gte = new Date(filters.startDate);
      if (filters?.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [purchases, summary] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.purchase.aggregate({
        where,
        _sum: { quantity: true, totalAmount: true },
        _count: true,
      }),
    ]);

    return {
      purchases,
      totalQuantity: summary._sum.quantity ?? 0,
      totalAmount: Number(summary._sum.totalAmount ?? 0),
      totalRecords: summary._count,
    };
  }
}
