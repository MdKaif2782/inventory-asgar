import { IsOptional, IsString } from 'class-validator';

export class UpdateGodownDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
