import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAutorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  nacionalidad: string;
}