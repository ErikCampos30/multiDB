import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { EditorialesService } from './editoriales.service';
import { EditorialesController } from './editoriales.controller';
import { Editorial } from './entities/editoriale.entity';
import { Bitacora, BitacoraSchema } from '../../libros/schemas/bitacora.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Editorial]),
    MongooseModule.forFeature([{ name: Bitacora.name, schema: BitacoraSchema }]),
  ],
  controllers: [EditorialesController],
  providers: [EditorialesService],
})
export class EditorialesModule {}
