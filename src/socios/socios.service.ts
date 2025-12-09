import { Injectable, InternalServerErrorException, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { Socio } from './entities/socio.entity';
import { Bitacora } from '../../libros/schemas/bitacora.schema';

@Injectable()
export class SociosService {
  private readonly logger = new Logger('SociosService');

  constructor(
    @InjectRepository(Socio)
    private readonly socioRepository: Repository<Socio>,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<Bitacora>,
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
  ) {}

  // --- CREAR ---
  async create(createSocioDto: CreateSocioDto) {
    try {
      // 1. Generar número de socio único (Ej: SOC-Timestamp)
      // En un sistema real usaríamos un contador atómico o UUID corto
      const numeroSocioGenerado = `SOC-${Date.now().toString().slice(-6)}`;

      const socio = this.socioRepository.create({
        ...createSocioDto,
        numero_socio: numeroSocioGenerado,
      });

      await this.socioRepository.save(socio);
      await this.cacheManager.del('todos_los_socios');

      await this.bitacoraModel.create({
        accion: 'CREAR_SOCIO',
        usuario: 'sistema',
        detalles: { nombre: socio.nombre, email: socio.email, num: socio.numero_socio },
        fecha: new Date(),
      });

      return socio;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // --- LISTAR ---
  async findAll() {
    const cacheKey = 'todos_los_socios';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const socios = await this.socioRepository.find({ where: { is_active: true } });
    await this.cacheManager.set(cacheKey, socios, 60000);
    return socios;
  }

  // --- BUSCAR UNO ---
  async findOne(id: string) {
    const socio = await this.socioRepository.findOne({ where: { id, is_active: true } });
    if (!socio) throw new NotFoundException(`Socio ${id} no encontrado`);
    return socio;
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateSocioDto: UpdateSocioDto) {
    const socio = await this.socioRepository.preload({ id, ...updateSocioDto });
    if (!socio) throw new NotFoundException(`Socio ${id} no encontrado`);
    
    await this.socioRepository.save(socio);
    await this.cacheManager.del('todos_los_socios');
    
    await this.bitacoraModel.create({
      accion: 'ACTUALIZAR_SOCIO',
      usuario: 'sistema',
      detalles: { id, cambios: updateSocioDto },
      fecha: new Date(),
    });
    return socio;
  }

  // --- ELIMINAR ---
  async remove(id: string) {
    const socio = await this.findOne(id);
    
    // TODO: Aquí validaremos si tiene préstamos activos antes de borrar
    // if (tienePrestamos) throw new BadRequestException('No se puede eliminar socio con libros pendientes');

    socio.is_active = false;
    await this.socioRepository.save(socio);
    await this.cacheManager.del('todos_los_socios');
    
    await this.bitacoraModel.create({
      accion: 'ELIMINAR_SOCIO',
      usuario: 'sistema',
      detalles: { id: socio.id, email: socio.email },
      fecha: new Date(),
    });
    return { message: 'Socio eliminado (Lógico)' };
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('El email ya está registrado en el sistema');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado');
  }
}