import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSaleDto, userId: string) {
    // Validate product and godown
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const godown = await this.prisma.godown.findUnique({
      where: { id: dto.godownId },
    });
    if (!godown) throw new NotFoundException('Godown not found');

    // Check stock availability
    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_godownId: {
          productId: dto.productId,
          godownId: dto.godownId,
        },
      },
    });

    if (!stock || stock.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${stock?.quantity ?? 0}, Requested: ${dto.quantity}`,
      );
    }

    // Calculate total amount
    const totalAmount = dto.unitPrice * dto.quantity;

    // Use transaction: create sale + reduce stock
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          productId: dto.productId,
          godownId: dto.godownId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          totalAmount: totalAmount,
          companyName: dto.companyName,
          gpNo: dto.gpNo,
          date: new Date(dto.date),
          createdById: userId,
        },
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.stock.update({
        where: {
          productId_godownId: {
            productId: dto.productId,
            godownId: dto.godownId,
          },
        },
        data: {
          quantity: { decrement: dto.quantity },
        },
      });

      return sale;
    });
  }

  async findAll(filters?: {
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

    return this.prisma.sale.findMany({
      where,
      include: {
        product: true,
        godown: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        godown: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }
}
