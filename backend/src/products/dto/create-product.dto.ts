import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  price?: number;

  // Optional: attach to godown on creation
  @IsString()
  @IsOptional()
  godownId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  initialQuantity?: number;
}
