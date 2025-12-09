import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EditorialesService } from './editoriales.service';
import { CreateEditorialDto } from './dto/create-editoriale.dto';
import { UpdateEditorialDto } from './dto/update-editoriale.dto';

@Controller('editoriales')
export class EditorialesController {
  constructor(private readonly editorialesService: EditorialesService) {}

  @Post()
  create(@Body() createEditorialDto: CreateEditorialDto) {
    return this.editorialesService.create(createEditorialDto);
  }

  @Get()
  findAll() {
    return this.editorialesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.editorialesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEditorialDto: UpdateEditorialDto) {
    return this.editorialesService.update(id, updateEditorialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.editorialesService.remove(id);
  }
}
