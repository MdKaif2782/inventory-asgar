import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Permissions('sales.create')
  create(@Body() dto: CreateSaleDto, @GetUser('sub') userId: string) {
    return this.salesService.create(dto, userId);
  }

  @Get()
  @Permissions('sales.view')
  findAll(
    @Query('productId') productId?: string,
    @Query('godownId') godownId?: string,
    @Query('companyName') companyName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll({
      productId,
      godownId,
      companyName,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Permissions('sales.view')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}
