import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AriService } from './ari.service';
import { CreateAriDto } from './dto/create-ari.dto';
import { UpdateAriDto } from './dto/update-ari.dto';

@Controller('ari')
export class AriController {
  constructor(private readonly ariService: AriService) {}

  @Post()
  create(@Body() createAriDto: CreateAriDto) {
    return this.ariService.create(createAriDto);
  }

  @Get()
  findAll() {
    return this.ariService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ariService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAriDto: UpdateAriDto) {
    return this.ariService.update(+id, updateAriDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ariService.remove(+id);
  }
}
