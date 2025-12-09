import { Injectable, InternalServerErrorException, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateEditorialDto } from './dto/create-editoriale.dto';
import { UpdateEditorialDto } from './dto/update-editoriale.dto';
import { Editorial } from './entities/editoriale.entity';
import { Bitacora } from '../../libros/schemas/bitacora.schema';

@Injectable()
export class EditorialesService {
  private readonly logger = new Logger('EditorialesService');
  private readonly cacheKey = 'todas_las_editoriales';

  constructor(
    @InjectRepository(Editorial)
    private readonly editorialRepository: Repository<Editorial>,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<Bitacora>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(createEditorialDto: CreateEditorialDto) {
    try {
      const editorial = this.editorialRepository.create(createEditorialDto);
      await this.editorialRepository.save(editorial);
      await this.cacheManager.del(this.cacheKey);

      await this.bitacoraModel.create({
        accion: 'CREAR_EDITORIAL',
        usuario: 'sistema',
        detalles: { id: editorial.id, nombre: editorial.nombre },
        fecha: new Date(),
      });

      return editorial;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const cached = await this.cacheManager.get<Editorial[]>(this.cacheKey);
    if (cached) {
      this.logger.log('Cache hit for todas_las_editoriales');
      return cached;
    }

    const editoriales = await this.editorialRepository.find({
      where: { is_active: true },
    });

    await this.cacheManager.set(this.cacheKey, editoriales, 60000);
    this.logger.log('Cache miss for todas_las_editoriales');
    return editoriales;
  }

  async findOne(id: string) {
    const editorial = await this.editorialRepository.findOne({
      where: { id, is_active: true },
    });

    if (!editorial) {
      throw new NotFoundException(`Editorial ${id} no encontrada`);
    }

    return editorial;
  }

  async update(id: string, updateEditorialDto: UpdateEditorialDto) {
    const editorialExistente = await this.findOne(id);
    const editorialActualizada = await this.editorialRepository.preload({
      id,
      ...updateEditorialDto,
    });

    if (!editorialActualizada) {
      throw new NotFoundException(`Editorial ${id} no encontrada`);
    }

    await this.editorialRepository.save(editorialActualizada);
    await this.cacheManager.del(this.cacheKey);

    await this.bitacoraModel.create({
      accion: 'ACTUALIZAR_EDITORIAL',
      usuario: 'sistema',
      detalles: {
        id,
        cambios: updateEditorialDto,
        valor_anterior: {
          pais: editorialExistente.pais,
          sitio_web: editorialExistente.sitio_web,
        },
      },
      fecha: new Date(),
    });

    return editorialActualizada;
  }

  async remove(id: string) {
    const editorial = await this.findOne(id);
    editorial.is_active = false;
    await this.editorialRepository.save(editorial);
    await this.cacheManager.del(this.cacheKey);

    await this.bitacoraModel.create({
      accion: 'ELIMINAR_EDITORIAL',
      usuario: 'sistema',
      detalles: { id: editorial.id, nombre: editorial.nombre },
      fecha: new Date(),
    });

    return { message: 'Editorial eliminada correctamente' };
  }

  private handleDBExceptions(error: any) {
    if (error?.code === '23505') {
      throw new InternalServerErrorException('La editorial ya existe');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado');
  }
}
