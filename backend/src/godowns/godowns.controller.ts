import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GodownsService } from './godowns.service';
import { CreateGodownDto } from './dto/create-godown.dto';
import { UpdateGodownDto } from './dto/update-godown.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('godowns')
export class GodownsController {
  constructor(private readonly godownsService: GodownsService) {}

  @Post()
  @Permissions('godowns.create')
  create(@Body() dto: CreateGodownDto) {
    return this.godownsService.create(dto);
  }

  @Get()
  @Permissions('godowns.view')
  findAll() {
    return this.godownsService.findAll();
  }

  @Get(':id')
  @Permissions('godowns.view')
  findOne(@Param('id') id: string) {
    return this.godownsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('godowns.update')
  update(@Param('id') id: string, @Body() dto: UpdateGodownDto) {
    return this.godownsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('godowns.delete')
  remove(@Param('id') id: string) {
    return this.godownsService.remove(id);
  }
}
