import { Module } from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { PrestamosController } from './prestamos.controller';

@Module({
  controllers: [PrestamosController],
  providers: [PrestamosService],
})
export class PrestamosModule {}
