import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @Permissions('stock.view')
  findAll() {
    return this.stockService.findAll();
  }

  @Get('summary')
  @Permissions('stock.view')
  getTotalStockByProduct() {
    return this.stockService.getTotalStockByProduct();
  }

  @Get('godown/:godownId')
  @Permissions('stock.view')
  getStockByGodown(@Param('godownId') godownId: string) {
    return this.stockService.getStockByGodown(godownId);
  }

  @Get('product/:productId')
  @Permissions('stock.view')
  getStockByProduct(@Param('productId') productId: string) {
    return this.stockService.getStockByProduct(productId);
  }
}
