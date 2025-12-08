import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { LibrosService } from './libros.service';
import { LibrosController } from './libros.controller';
import { Libro } from './entities/libro.entity';
import { Bitacora, BitacoraSchema } from './schemas/bitacora.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Libro]),
    MongooseModule.forFeature([
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
  ],
  controllers: [LibrosController],
  providers: [LibrosService],
})
export class LibrosModule {}