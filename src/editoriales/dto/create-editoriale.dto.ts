import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateEditorialDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsUrl()
  @IsOptional()
  sitio_web?: string;

  @IsString()
  @IsOptional()
  pais?: string;
}