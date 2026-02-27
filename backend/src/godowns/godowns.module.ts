import { Module } from '@nestjs/common';
import { GodownsService } from './godowns.service';
import { GodownsController } from './godowns.controller';

@Module({
  controllers: [GodownsController],
  providers: [GodownsService],
  exports: [GodownsService],
})
export class GodownsModule {}
