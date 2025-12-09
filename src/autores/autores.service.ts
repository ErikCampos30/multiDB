import { Injectable, InternalServerErrorException, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateAutorDto } from './dto/create-autor.dto';
import { UpdateAutorDto } from './dto/update-autor.dto';
import { Autor } from './entities/autor.entity';
import { Bitacora } from '../../libros/schemas/bitacora.schema';

@Injectable()
export class AutoresService {
  private readonly logger = new Logger('AutoresService');

  constructor(
    @InjectRepository(Autor)
    private readonly autorRepository: Repository<Autor>,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<Bitacora>,
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
  ) {}

  async create(createAutorDto: CreateAutorDto) {
    try {
      const autor = this.autorRepository.create(createAutorDto);
      await this.autorRepository.save(autor);
      await this.cacheManager.del('todos_los_autores'); // Limpiar caché

      await this.bitacoraModel.create({
        accion: 'CREAR_AUTOR',
        usuario: 'sistema',
        detalles: { nombre: autor.nombre },
        fecha: new Date(),
      });
      return autor;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const cacheKey = 'todos_los_autores';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const autores = await this.autorRepository.find({ where: { is_active: true } });
    await this.cacheManager.set(cacheKey, autores, 60000); // 60 seg
    return autores;
  }

  async findOne(id: string) {
    const autor = await this.autorRepository.findOne({ where: { id, is_active: true } });
    if (!autor) throw new NotFoundException(`Autor ${id} no encontrado`);
    return autor;
  }

  async update(id: string, updateAutorDto: UpdateAutorDto) {
    const autor = await this.autorRepository.preload({ id, ...updateAutorDto });
    if (!autor) throw new NotFoundException(`Autor ${id} no encontrado`);
    
    await this.autorRepository.save(autor);
    await this.cacheManager.del('todos_los_autores');
    
    await this.bitacoraModel.create({
      accion: 'ACTUALIZAR_AUTOR',
      usuario: 'sistema',
      detalles: { id, cambios: updateAutorDto },
      fecha: new Date(),
    });
    return autor;
  }

  async remove(id: string) {
    const autor = await this.findOne(id);
    autor.is_active = false;
    await this.autorRepository.save(autor);
    await this.cacheManager.del('todos_los_autores');
    
    await this.bitacoraModel.create({
      accion: 'ELIMINAR_AUTOR',
      usuario: 'sistema',
      detalles: { id: autor.id },
      fecha: new Date(),
    });
    return { message: 'Autor eliminado (Lógico)' };
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado');
  }
}
