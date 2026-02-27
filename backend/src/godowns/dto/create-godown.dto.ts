import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGodownDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;
}
