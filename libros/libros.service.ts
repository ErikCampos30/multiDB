import { Injectable, InternalServerErrorException, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { Libro } from './entities/libro.entity';
import { Bitacora } from './schemas/bitacora.schema';

@Injectable()
export class LibrosService {
  private readonly logger = new Logger('LibrosService');

  constructor(
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
    @InjectModel(Bitacora.name)
    private readonly bitacoraModel: Model<Bitacora>,
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
  ) {}

  async create(createLibroDto: CreateLibroDto) {
    try {
      const libro = this.libroRepository.create(createLibroDto);
      await this.libroRepository.save(libro);

      await this.bitacoraModel.create({
        accion: 'CREAR_LIBRO',
        usuario: 'sistema',
        detalles: { titulo: libro.titulo, isbn: libro.isbn },
        fecha: new Date(),
      });

      await this.cacheManager.del('todos_los_libros'); 

      return libro;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    const cacheKey = 'todos_los_libros';

    const cachedData = await this.cacheManager.get<Libro[]>(cacheKey);
    
    if (cachedData) {
      this.logger.log('Cache hit for todos_los_libros');
      return cachedData;
    }

    const libros = await this.libroRepository.find({
      where: { is_active: true } 
    });

    await this.cacheManager.set(cacheKey, libros, 60000); 
    
    this.logger.log('Cache miss for todos_los_libros');
    return libros;
  }

  async findOne(id: string) {
    const libro = await this.libroRepository.findOne({ 
      where: { id, is_active: true } 
    });
    
    if (!libro) throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    return libro;
  }

  async update(id: string, updateLibroDto: UpdateLibroDto) {
    const libroExistente = await this.findOne(id);

    const libroActualizado = await this.libroRepository.preload({
      id: id,
      ...updateLibroDto,
    });

    if (!libroActualizado) throw new NotFoundException(`Libro con ID ${id} no encontrado`);

    await this.libroRepository.save(libroActualizado);

    await this.cacheManager.del('todos_los_libros');

    await this.bitacoraModel.create({
      accion: 'ACTUALIZAR_LIBRO',
      usuario: 'sistema',
      detalles: { 
        id: id, 
        cambios: updateLibroDto, 
        valor_anterior: { precio: libroExistente.precio, stock: libroExistente.stock } 
      },
      fecha: new Date(),
    });

    return libroActualizado;
  }

  async remove(id: string) {
    const libro = await this.findOne(id);
    
    libro.is_active = false;
    await this.libroRepository.save(libro);

    await this.cacheManager.del('todos_los_libros');

    await this.bitacoraModel.create({
      accion: 'ELIMINAR_LIBRO',
      usuario: 'sistema',
      detalles: { id: libro.id, titulo: libro.titulo },
      fecha: new Date(),
    });

    return { message: 'Libro eliminado correctamente' };
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new InternalServerErrorException('Ese libro ya existe (ISBN duplicado)');
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado, revisar logs del servidor');
  }
}