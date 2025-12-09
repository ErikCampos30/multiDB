import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('socios')
export class Socio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombre: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { unique: true })
  numero_socio: string; // Ej: "SOC-12345678" (Generado por el sistema)

  @Column('text', { nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  direccion: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}