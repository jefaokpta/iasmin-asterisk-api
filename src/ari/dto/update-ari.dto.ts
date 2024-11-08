import { PartialType } from '@nestjs/mapped-types';
import { CreateAriDto } from './create-ari.dto';

export class UpdateAriDto extends PartialType(CreateAriDto) {}
