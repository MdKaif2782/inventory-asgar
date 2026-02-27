import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Permissions('dashboard.view')
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('stock')
  @Permissions('reports.view')
  getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('product/:productId')
  @Permissions('reports.view')
  getProductReport(@Param('productId') productId: string) {
    return this.reportsService.getProductReport(productId);
  }

  @Get('sales')
  @Permissions('reports.view')
  getSalesReport(
    @Query('productId') productId?: string,
    @Query('godownId') godownId?: string,
    @Query('companyName') companyName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport({
      productId,
      godownId,
      companyName,
      startDate,
      endDate,
    });
  }

  @Get('purchases')
  @Permissions('reports.view')
  getPurchaseReport(
    @Query('productId') productId?: string,
    @Query('godownId') godownId?: string,
    @Query('companyName') companyName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPurchaseReport({
      productId,
      godownId,
      companyName,
      startDate,
      endDate,
    });
  }
}
