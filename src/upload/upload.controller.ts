import { Controller, Param, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':id')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(@UploadedFile() audio: Express.Multer.File, @Param('id') id: string) {
    if (!audio) {
      throw new BadRequestException('Audio não enviado');
    }
    if (audio.size > 1024 * 1024 * 5) {
      throw new BadRequestException('Audio maior que 5MB');
    }
    if (audio.mimetype !== 'audio/mpeg') {
      throw new BadRequestException('Audio não é um arquivo de áudio');
    }
    return this.uploadService.uploadAudio(audio, id);  
  }

}
