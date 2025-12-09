import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AutoresService } from './autores.service';
import { AutoresController } from './autores.controller';
import { Autor } from './entities/autor.entity';
import { Bitacora, BitacoraSchema } from '../../libros/schemas/bitacora.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Autor]),
    MongooseModule.forFeature([
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
  ],
  controllers: [AutoresController],
  providers: [AutoresService],
})
export class AutoresModule {}