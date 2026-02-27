import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.stock.findMany({
      include: {
        product: true,
        godown: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { godown: { name: 'asc' } }],
    });
  }

  async getTotalStockByProduct() {
    return this.prisma.stock.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    });
  }

  async getStockByGodown(godownId: string) {
    return this.prisma.stock.findMany({
      where: { godownId },
      include: {
        product: true,
        godown: true,
      },
    });
  }

  async getStockByProduct(productId: string) {
    return this.prisma.stock.findMany({
      where: { productId },
      include: {
        product: true,
        godown: true,
      },
    });
  }
}
