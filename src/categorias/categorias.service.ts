import { Injectable, InternalServerErrorException, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { Categoria } from './entities/categoria.entity';
import { Bitacora } from '../../libros/schemas/bitacora.schema';

@Injectable()
export class CategoriasService {
  private readonly logger = new Logger('CategoriasService');
  private readonly cacheKey = 'todas_las_categorias';

  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<Bitacora>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    try {
      const categoria = this.categoriaRepository.create(createCategoriaDto);
      await this.categoriaRepository.save(categoria);
      await this.cacheManager.del(this.cacheKey);

      await this.bitacoraModel.create({
        accion: 'CREAR_CATEGORIA',
        usuario: 'sistema',
        detalles: { id: categoria.id, nombre: categoria.nombre },
        fecha: new Date(),
      });

      return categoria;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const cached = await this.cacheManager.get<Categoria[]>(this.cacheKey);
    if (cached) {
      this.logger.log('Cache hit for todas_las_categorias');
      return cached;
    }

    const categorias = await this.categoriaRepository.find({
      where: { is_active: true },
    });

    await this.cacheManager.set(this.cacheKey, categorias, 60000);
    this.logger.log('Cache miss for todas_las_categorias');
    return categorias;
  }

  async findOne(id: string) {
    const categoria = await this.categoriaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    return categoria;
  }

  async update(id: string, updateCategoriaDto: UpdateCategoriaDto) {
    const categoriaExistente = await this.findOne(id);
    const categoriaActualizada = await this.categoriaRepository.preload({
      id,
      ...updateCategoriaDto,
    });

    if (!categoriaActualizada) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    await this.categoriaRepository.save(categoriaActualizada);
    await this.cacheManager.del(this.cacheKey);

    await this.bitacoraModel.create({
      accion: 'ACTUALIZAR_CATEGORIA',
      usuario: 'sistema',
      detalles: {
        id,
        cambios: updateCategoriaDto,
        valor_anterior: { descripcion: categoriaExistente.descripcion },
      },
      fecha: new Date(),
    });

    return categoriaActualizada;
  }

  async remove(id: string) {
    const categoria = await this.findOne(id);
    categoria.is_active = false;
    await this.categoriaRepository.save(categoria);
    await this.cacheManager.del(this.cacheKey);

    await this.bitacoraModel.create({
      accion: 'ELIMINAR_CATEGORIA',
      usuario: 'sistema',
      detalles: { id: categoria.id, nombre: categoria.nombre },
      fecha: new Date(),
    });

    return { message: 'Categoria eliminada correctamente' };
  }

  private handleDBExceptions(error: any) {
    if (error?.code === '23505') {
      throw new InternalServerErrorException('La categoría ya existe');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado');
  }
}
