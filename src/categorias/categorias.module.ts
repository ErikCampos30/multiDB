import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';
import { Categoria } from './entities/categoria.entity';
import { Bitacora, BitacoraSchema } from '../../libros/schemas/bitacora.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categoria]),
    MongooseModule.forFeature([{ name: Bitacora.name, schema: BitacoraSchema }]),
  ],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}
