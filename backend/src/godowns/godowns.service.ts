import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGodownDto } from './dto/create-godown.dto';
import { UpdateGodownDto } from './dto/update-godown.dto';

@Injectable()
export class GodownsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGodownDto) {
    const existing = await this.prisma.godown.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Godown with this name already exists');
    }

    return this.prisma.godown.create({ data: dto });
  }

  async findAll() {
    return this.prisma.godown.findMany({
      include: {
        stocks: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const godown = await this.prisma.godown.findUnique({
      where: { id },
      include: {
        stocks: {
          include: { product: true },
        },
      },
    });

    if (!godown) {
      throw new NotFoundException('Godown not found');
    }

    return godown;
  }

  async update(id: string, dto: UpdateGodownDto) {
    const godown = await this.prisma.godown.findUnique({ where: { id } });
    if (!godown) {
      throw new NotFoundException('Godown not found');
    }

    return this.prisma.godown.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const godown = await this.prisma.godown.findUnique({ where: { id } });
    if (!godown) {
      throw new NotFoundException('Godown not found');
    }

    await this.prisma.godown.delete({ where: { id } });
    return { message: 'Godown deleted successfully' };
  }
}
