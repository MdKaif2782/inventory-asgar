import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReportFilterDto,
  PaginatedReportFilterDto,
} from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(filters: ReportFilterDto) {
    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.godownId) where.godownId = filters.godownId;
    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.date.lte = endDate;
      }
    }
    return where;
  }

  // GET /report/summary
  async getSummary(filters: ReportFilterDto) {
    const salesWhere = this.buildWhereClause(filters);
    const purchaseWhere = this.buildWhereClause(filters);

    const [totalProducts, totalGodowns, salesAgg, purchaseAgg, stockAgg] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.godown.count(),
        this.prisma.sale.aggregate({
          where: salesWhere,
          _sum: { quantity: true, totalAmount: true },
          _count: true,
        }),
        this.prisma.purchase.aggregate({
          where: purchaseWhere,
          _sum: { quantity: true, totalAmount: true },
          _count: true,
        }),
        this.prisma.stock.aggregate({ _sum: { quantity: true } }),
      ]);

    const totalSalesValue = Number(salesAgg._sum.totalAmount ?? 0);
    const totalPurchaseValue = Number(purchaseAgg._sum.totalAmount ?? 0);

    return {
      totalProducts,
      totalGodowns,
      totalSales: salesAgg._count,
      totalPurchases: purchaseAgg._count,
      totalSalesValue,
      totalPurchaseValue,
      totalSalesQuantity: salesAgg._sum.quantity ?? 0,
      totalPurchaseQuantity: purchaseAgg._sum.quantity ?? 0,
      totalStockQuantity: stockAgg._sum.quantity ?? 0,
      profitMargin: totalSalesValue - totalPurchaseValue,
    };
  }

  // GET /report/sales-trend
  async getSalesTrend(filters: ReportFilterDto) {
    const where = this.buildWhereClause(filters);

    const sales = await this.prisma.sale.findMany({
      where,
      select: { date: true, totalAmount: true, quantity: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const grouped = new Map<
      string,
      { date: string; totalAmount: number; quantity: number }
    >();
    for (const sale of sales) {
      const dateKey = sale.date.toISOString().split('T')[0];
      const existing = grouped.get(dateKey) || {
        date: dateKey,
        totalAmount: 0,
        quantity: 0,
      };
      existing.totalAmount += Number(sale.totalAmount);
      existing.quantity += sale.quantity;
      grouped.set(dateKey, existing);
    }

    return Array.from(grouped.values());
  }

  // GET /report/purchase-trend
  async getPurchaseTrend(filters: ReportFilterDto) {
    const where = this.buildWhereClause(filters);

    const purchases = await this.prisma.purchase.findMany({
      where,
      select: { date: true, totalAmount: true, quantity: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const grouped = new Map<
      string,
      { date: string; totalAmount: number; quantity: number }
    >();
    for (const purchase of purchases) {
      const dateKey = purchase.date.toISOString().split('T')[0];
      const existing = grouped.get(dateKey) || {
        date: dateKey,
        totalAmount: 0,
        quantity: 0,
      };
      existing.totalAmount += Number(purchase.totalAmount);
      existing.quantity += purchase.quantity;
      grouped.set(dateKey, existing);
    }

    return Array.from(grouped.values());
  }

  // GET /report/top-products
  async getTopProducts(filters: ReportFilterDto, limit = 10) {
    const where = this.buildWhereClause(filters);

    const sales = await this.prisma.sale.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    const productIds = sales.map((s) => s.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return sales.map((s) => ({
      product: productMap.get(s.productId),
      totalQuantitySold: s._sum.quantity ?? 0,
      totalRevenue: Number(s._sum.totalAmount ?? 0),
      transactionCount: s._count,
    }));
  }

  // GET /report/stock-distribution
  async getStockDistribution(filters: ReportFilterDto) {
    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.godownId) where.godownId = filters.godownId;

    const stocks = await this.prisma.stock.findMany({
      where,
      include: {
        product: true,
        godown: true,
      },
    });

    // Group by godown
    const godownGroups = new Map<
      string,
      { godown: any; totalQuantity: number; products: any[] }
    >();
    for (const stock of stocks) {
      const existing = godownGroups.get(stock.godownId) || {
        godown: stock.godown,
        totalQuantity: 0,
        products: [],
      };
      existing.totalQuantity += stock.quantity;
      existing.products.push({
        product: stock.product,
        quantity: stock.quantity,
      });
      godownGroups.set(stock.godownId, existing);
    }

    return Array.from(godownGroups.values());
  }

  // GET /report/profit-loss - Comprehensive Profit/Loss Analysis
  async getProfitLossAnalysis(filters: ReportFilterDto) {
    const salesWhere = this.buildWhereClause(filters);
    const purchaseWhere = this.buildWhereClause(filters);

    // Get all sales and purchases with product info
    const [sales, purchases, previousPeriodSales, previousPeriodPurchases] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: salesWhere,
          include: { product: true },
        }),
        this.prisma.purchase.findMany({
          where: purchaseWhere,
          include: { product: true },
        }),
        // Get previous period data for comparison (if date filter is set)
        filters.startDate && filters.endDate
          ? this.prisma.sale.aggregate({
              where: {
                ...salesWhere,
                date: {
                  gte: new Date(
                    new Date(filters.startDate).getTime() -
                      (new Date(filters.endDate).getTime() -
                        new Date(filters.startDate).getTime()),
                  ),
                  lt: new Date(filters.startDate),
                },
              },
              _sum: { totalAmount: true },
            })
          : Promise.resolve({ _sum: { totalAmount: null } }),
        filters.startDate && filters.endDate
          ? this.prisma.purchase.aggregate({
              where: {
                ...purchaseWhere,
                date: {
                  gte: new Date(
                    new Date(filters.startDate).getTime() -
                      (new Date(filters.endDate).getTime() -
                        new Date(filters.startDate).getTime()),
                  ),
                  lt: new Date(filters.startDate),
                },
              },
              _sum: { totalAmount: true },
            })
          : Promise.resolve({ _sum: { totalAmount: null } }),
      ]);

    // Calculate totals
    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );
    const totalCost = purchases.reduce(
      (sum, p) => sum + Number(p.totalAmount),
      0,
    );
    const grossProfit = totalRevenue - totalCost;
    const grossMarginPercent =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate average cost per product for COGS calculation
    const productCosts = new Map<
      string,
      { totalCost: number; totalQty: number }
    >();
    for (const purchase of purchases) {
      const existing = productCosts.get(purchase.productId) || {
        totalCost: 0,
        totalQty: 0,
      };
      existing.totalCost += Number(purchase.totalAmount);
      existing.totalQty += purchase.quantity;
      productCosts.set(purchase.productId, existing);
    }

    // Calculate Cost of Goods Sold (COGS) based on actual sales
    let cogs = 0;
    for (const sale of sales) {
      const cost = productCosts.get(sale.productId);
      if (cost && cost.totalQty > 0) {
        const avgCostPerUnit = cost.totalCost / cost.totalQty;
        cogs += avgCostPerUnit * sale.quantity;
      }
    }

    const netProfit = totalRevenue - cogs;
    const netMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Period comparison
    const prevRevenue = Number(previousPeriodSales._sum.totalAmount ?? 0);
    const prevCost = Number(previousPeriodPurchases._sum.totalAmount ?? 0);
    const prevProfit = prevRevenue - prevCost;
    const revenueGrowth =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const profitGrowth =
      prevProfit !== 0
        ? ((grossProfit - prevProfit) / Math.abs(prevProfit)) * 100
        : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
      cogs,
      netProfit,
      netMarginPercent: Math.round(netMarginPercent * 100) / 100,
      totalSalesCount: sales.length,
      totalPurchasesCount: purchases.length,
      avgSaleValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      avgPurchaseValue: purchases.length > 0 ? totalCost / purchases.length : 0,
      comparison: {
        prevRevenue,
        prevCost,
        prevProfit,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        profitGrowth: Math.round(profitGrowth * 100) / 100,
      },
    };
  }

  // GET /report/profit-trend - Daily Profit/Loss Trend
  async getProfitTrend(filters: ReportFilterDto) {
    const salesWhere = this.buildWhereClause(filters);
    const purchaseWhere = this.buildWhereClause(filters);

    const [sales, purchases] = await Promise.all([
      this.prisma.sale.findMany({
        where: salesWhere,
        select: {
          date: true,
          totalAmount: true,
          quantity: true,
          productId: true,
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.purchase.findMany({
        where: purchaseWhere,
        select: {
          date: true,
          totalAmount: true,
          quantity: true,
          productId: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Calculate average cost per product
    const productCosts = new Map<
      string,
      { totalCost: number; totalQty: number }
    >();
    for (const purchase of purchases) {
      const existing = productCosts.get(purchase.productId) || {
        totalCost: 0,
        totalQty: 0,
      };
      existing.totalCost += Number(purchase.totalAmount);
      existing.totalQty += purchase.quantity;
      productCosts.set(purchase.productId, existing);
    }

    // Group by date
    const dailyData = new Map<
      string,
      {
        date: string;
        revenue: number;
        cost: number;
        cogs: number;
        profit: number;
        salesQty: number;
        purchaseQty: number;
      }
    >();

    for (const sale of sales) {
      const dateKey = sale.date.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        revenue: 0,
        cost: 0,
        cogs: 0,
        profit: 0,
        salesQty: 0,
        purchaseQty: 0,
      };
      existing.revenue += Number(sale.totalAmount);
      existing.salesQty += sale.quantity;

      // Calculate COGS for this sale
      const cost = productCosts.get(sale.productId);
      if (cost && cost.totalQty > 0) {
        existing.cogs += (cost.totalCost / cost.totalQty) * sale.quantity;
      }

      dailyData.set(dateKey, existing);
    }

    for (const purchase of purchases) {
      const dateKey = purchase.date.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        revenue: 0,
        cost: 0,
        cogs: 0,
        profit: 0,
        salesQty: 0,
        purchaseQty: 0,
      };
      existing.cost += Number(purchase.totalAmount);
      existing.purchaseQty += purchase.quantity;
      dailyData.set(dateKey, existing);
    }

    // Calculate profit for each day
    for (const [key, data] of dailyData) {
      data.profit = data.revenue - data.cogs;
      dailyData.set(key, data);
    }

    // Sort by date
    return Array.from(dailyData.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  // GET /report/product-profitability - Per-product Profit Analysis
  async getProductProfitability(filters: ReportFilterDto, limit = 20) {
    const salesWhere = this.buildWhereClause(filters);
    const purchaseWhere = this.buildWhereClause(filters);

    const [sales, purchases] = await Promise.all([
      this.prisma.sale.findMany({
        where: salesWhere,
        include: { product: true },
      }),
      this.prisma.purchase.findMany({
        where: purchaseWhere,
        include: { product: true },
      }),
    ]);

    // Calculate cost per product
    const productCosts = new Map<
      string,
      { totalCost: number; totalQty: number; avgCost: number }
    >();
    for (const purchase of purchases) {
      const existing = productCosts.get(purchase.productId) || {
        totalCost: 0,
        totalQty: 0,
        avgCost: 0,
      };
      existing.totalCost += Number(purchase.totalAmount);
      existing.totalQty += purchase.quantity;
      existing.avgCost =
        existing.totalQty > 0 ? existing.totalCost / existing.totalQty : 0;
      productCosts.set(purchase.productId, existing);
    }

    // Calculate profit per product
    const productProfits = new Map<
      string,
      {
        product: any;
        totalRevenue: number;
        totalCogs: number;
        profit: number;
        marginPercent: number;
        qtySold: number;
        saleCount: number;
        avgSellingPrice: number;
        avgCostPrice: number;
      }
    >();

    for (const sale of sales) {
      const existing = productProfits.get(sale.productId) || {
        product: sale.product,
        totalRevenue: 0,
        totalCogs: 0,
        profit: 0,
        marginPercent: 0,
        qtySold: 0,
        saleCount: 0,
        avgSellingPrice: 0,
        avgCostPrice: 0,
      };

      const cost = productCosts.get(sale.productId);
      const unitCost = cost ? cost.avgCost : 0;
      const saleRevenue = Number(sale.totalAmount);
      const saleCogs = unitCost * sale.quantity;

      existing.totalRevenue += saleRevenue;
      existing.totalCogs += saleCogs;
      existing.profit = existing.totalRevenue - existing.totalCogs;
      existing.qtySold += sale.quantity;
      existing.saleCount += 1;
      existing.avgSellingPrice =
        existing.qtySold > 0 ? existing.totalRevenue / existing.qtySold : 0;
      existing.avgCostPrice = unitCost;
      existing.marginPercent =
        existing.totalRevenue > 0
          ? (existing.profit / existing.totalRevenue) * 100
          : 0;

      productProfits.set(sale.productId, existing);
    }

    // Sort by profit descending and limit
    const sorted = Array.from(productProfits.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);

    // Round percentages
    return sorted.map((p) => ({
      ...p,
      marginPercent: Math.round(p.marginPercent * 100) / 100,
      avgSellingPrice: Math.round(p.avgSellingPrice * 100) / 100,
      avgCostPrice: Math.round(p.avgCostPrice * 100) / 100,
    }));
  }

  // GET /report/sales-table (paginated)
  async getSalesTable(filters: PaginatedReportFilterDto) {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales.map((s) => ({
        ...s,
        unitPrice: Number(s.unitPrice),
        totalAmount: Number(s.totalAmount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET /report/purchase-table (paginated)
  async getPurchaseTable(filters: PaginatedReportFilterDto) {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data: purchases.map((p) => ({
        ...p,
        unitPrice: Number(p.unitPrice),
        totalAmount: Number(p.totalAmount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Legacy methods for backward compatibility
  async getDashboardSummary() {
    return this.getSummary({});
  }

  async getStockReport() {
    const stocks = await this.prisma.stock.findMany({
      include: {
        product: true,
        godown: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { godown: { name: 'asc' } }],
    });

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
      where.companyName = {
        contains: filters.companyName,
        mode: 'insensitive',
      };
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
      where.companyName = {
        contains: filters.companyName,
        mode: 'insensitive',
      };
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
