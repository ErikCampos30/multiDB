import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { Socio } from './entities/socio.entity';
import { Bitacora, BitacoraSchema } from '../../libros/schemas/bitacora.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Socio]),
    MongooseModule.forFeature([
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
  ],
  controllers: [SociosController],
  providers: [SociosService],
})
export class SociosModule {}