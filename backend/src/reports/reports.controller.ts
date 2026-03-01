import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  ReportFilterDto,
  PaginatedReportFilterDto,
} from './dto/report-filter.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // New comprehensive endpoints
  @Get('summary')
  @Permissions('reports.view')
  getSummary(@Query() filters: ReportFilterDto) {
    return this.reportsService.getSummary(filters);
  }

  @Get('sales-trend')
  @Permissions('reports.view')
  getSalesTrend(@Query() filters: ReportFilterDto) {
    return this.reportsService.getSalesTrend(filters);
  }

  @Get('purchase-trend')
  @Permissions('reports.view')
  getPurchaseTrend(@Query() filters: ReportFilterDto) {
    return this.reportsService.getPurchaseTrend(filters);
  }

  @Get('top-products')
  @Permissions('reports.view')
  getTopProducts(
    @Query() filters: ReportFilterDto,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProducts(
      filters,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('stock-distribution')
  @Permissions('reports.view')
  getStockDistribution(@Query() filters: ReportFilterDto) {
    return this.reportsService.getStockDistribution(filters);
  }

  @Get('sales-table')
  @Permissions('reports.view')
  getSalesTable(@Query() filters: PaginatedReportFilterDto) {
    return this.reportsService.getSalesTable(filters);
  }

  @Get('purchase-table')
  @Permissions('reports.view')
  getPurchaseTable(@Query() filters: PaginatedReportFilterDto) {
    return this.reportsService.getPurchaseTable(filters);
  }

  @Get('profit-loss')
  @Permissions('reports.view')
  getProfitLossAnalysis(@Query() filters: ReportFilterDto) {
    return this.reportsService.getProfitLossAnalysis(filters);
  }

  @Get('profit-trend')
  @Permissions('reports.view')
  getProfitTrend(@Query() filters: ReportFilterDto) {
    return this.reportsService.getProfitTrend(filters);
  }

  @Get('product-profitability')
  @Permissions('reports.view')
  getProductProfitability(
    @Query() filters: ReportFilterDto,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getProductProfitability(
      filters,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // Legacy endpoints (backward compatibility)
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
