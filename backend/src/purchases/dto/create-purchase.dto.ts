import { IsNotEmpty, IsString, IsInt, Min, IsDateString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Nested DTO for inline product creation
export class InlineProductDto {
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
}

export class CreatePurchaseDto {
  // Either productId OR newProduct is required (validated in service)
  @IsString()
  @IsOptional()
  productId?: string;

  // Optional: create product inline during purchase
  @ValidateNested()
  @Type(() => InlineProductDto)
  @IsOptional()
  newProduct?: InlineProductDto;

  @IsString()
  @IsNotEmpty()
  godownId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsDateString()
  date: string;
}
