import { IsNotEmpty, IsString, IsInt, Min, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

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

  @IsString()
  @IsNotEmpty()
  gpNo: string;

  @IsDateString()
  date: string;
}
