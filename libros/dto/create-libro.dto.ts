import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min, MinLength } from 'class-validator';

export class CreateLibroDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  isbn: string;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @IsNumber()
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  precio: number;
}