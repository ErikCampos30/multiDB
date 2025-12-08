import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BitacoraDocument = HydratedDocument<Bitacora>;

@Schema({ collection: 'historial_operaciones' })
export class Bitacora {
  @Prop({ required: true })
  accion: string;

  @Prop({ required: true })
  usuario: string;

  @Prop({ type: Object })
  detalles: any;

  @Prop({ default: Date.now })
  fecha: Date;
}

export const BitacoraSchema = SchemaFactory.createForClass(Bitacora);