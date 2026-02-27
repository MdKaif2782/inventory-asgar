import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    // Validate: either productId or newProduct must be provided
    if (!dto.productId && !dto.newProduct) {
      throw new BadRequestException('Either productId or newProduct is required');
    }

    const godown = await this.prisma.godown.findUnique({
      where: { id: dto.godownId },
    });
    if (!godown) throw new NotFoundException('Godown not found');

    // Calculate total amount
    const totalAmount = dto.unitPrice * dto.quantity;

    // Use transaction: optionally create product, create purchase, upsert stock
    return this.prisma.$transaction(async (tx) => {
      let productId = dto.productId;

      // Create inline product if newProduct provided
      if (dto.newProduct) {
        const existingProduct = await tx.product.findUnique({
          where: { name: dto.newProduct.name },
        });
        if (existingProduct) {
          throw new BadRequestException(`Product "${dto.newProduct.name}" already exists`);
        }

        const newProduct = await tx.product.create({
          data: {
            name: dto.newProduct.name,
            sku: dto.newProduct.sku,
            unit: dto.newProduct.unit,
            price: dto.newProduct.price,
          },
        });
        productId = newProduct.id;
      } else {
        // Validate existing product
        const product = await tx.product.findUnique({
          where: { id: productId! },
        });
        if (!product) throw new NotFoundException('Product not found');
      }

      const purchase = await tx.purchase.create({
        data: {
          productId: productId!,
          godownId: dto.godownId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          totalAmount: totalAmount,
          companyName: dto.companyName,
          date: new Date(dto.date),
          createdById: userId,
        },
        include: {
          product: true,
          godown: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.stock.upsert({
        where: {
          productId_godownId: {
            productId: productId!,
            godownId: dto.godownId,
          },
        },
        update: {
          quantity: { increment: dto.quantity },
        },
        create: {
          productId: productId!,
          godownId: dto.godownId,
          quantity: dto.quantity,
        },
      });

      return purchase;
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

    return this.prisma.purchase.findMany({
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
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        product: true,
        godown: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }
}
