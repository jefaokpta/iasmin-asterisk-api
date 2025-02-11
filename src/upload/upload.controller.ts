import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':id')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(@UploadedFile() audio: Express.Multer.File, @Param('id') id: string) {
    this.uploadService.uploadAudio(audio, id);  
  }

}
