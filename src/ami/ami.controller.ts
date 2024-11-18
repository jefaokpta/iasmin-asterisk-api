import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AmiService } from './ami.service';
import { CreateAmiDto } from './dto/create-ami.dto';
import { UpdateAmiDto } from './dto/update-ami.dto';

@Controller('ami')
export class AmiController {
  constructor(private readonly amiService: AmiService) {}

  @Post()
  create(@Body() createAmiDto: CreateAmiDto) {
    return this.amiService.create(createAmiDto);
  }

  @Get()
  findAll() {
    return this.amiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.amiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAmiDto: UpdateAmiDto) {
    return this.amiService.update(+id, updateAmiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.amiService.remove(+id);
  }
}
