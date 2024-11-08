import { Injectable } from '@nestjs/common';
import { CreateAriDto } from './dto/create-ari.dto';
import { UpdateAriDto } from './dto/update-ari.dto';

@Injectable()
export class AriService {
  create(createAriDto: CreateAriDto) {
    return 'This action adds a new ari';
  }

  findAll() {
    return `This action returns all ari`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ari`;
  }

  update(id: number, updateAriDto: UpdateAriDto) {
    return `This action updates a #${id} ari`;
  }

  remove(id: number) {
    return `This action removes a #${id} ari`;
  }

}
