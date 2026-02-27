import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Product with this name already exists');
    }

    // If godownId is provided, create product and stock entry in transaction
    if (dto.godownId) {
      const godown = await this.prisma.godown.findUnique({
        where: { id: dto.godownId },
      });
      if (!godown) {
        throw new NotFoundException('Godown not found');
      }

      return this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: dto.name,
            sku: dto.sku,
            unit: dto.unit,
            price: dto.price,
          },
        });

        // Create initial stock entry if quantity provided
        if (dto.initialQuantity && dto.initialQuantity > 0) {
          await tx.stock.create({
            data: {
              productId: product.id,
              godownId: dto.godownId!,
              quantity: dto.initialQuantity,
            },
          });
        }

        return this.prisma.product.findUnique({
          where: { id: product.id },
          include: { stocks: { include: { godown: true } } },
        });
      });
    }

    // Simple product creation without godown attachment
    return this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        unit: dto.unit,
        price: dto.price,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        stocks: {
          include: { godown: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stocks: {
          include: { godown: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }
}
