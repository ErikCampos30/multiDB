import { PartialType } from '@nestjs/mapped-types';
import { CreateEditorialDto } from './create-editoriale.dto';

export class UpdateEditorialDto extends PartialType(CreateEditorialDto) {}
