import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Permissions('purchases.create')
  create(
    @Body() dto: CreatePurchaseDto,
    @GetUser('sub') userId: string,
  ) {
    return this.purchasesService.create(dto, userId);
  }

  @Get()
  @Permissions('purchases.view')
  findAll(
    @Query('productId') productId?: string,
    @Query('godownId') godownId?: string,
    @Query('companyName') companyName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.purchasesService.findAll({
      productId,
      godownId,
      companyName,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Permissions('purchases.view')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }
}
