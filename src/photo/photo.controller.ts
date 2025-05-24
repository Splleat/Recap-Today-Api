import { Controller, Post, Body, Get, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';

@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  create(@Body() dto: CreatePhotoDto): Promise<PhotoResponseDto> {
    return this.photoService.create(dto);
  }

  @Get()
  findAll(): Promise<PhotoResponseDto[]> {
    return this.photoService.findAll();
  }

  @Get('diary/:diaryId')
  findByDiaryId(@Param('diaryId') diaryId: string): Promise<PhotoResponseDto[]> {
    return this.photoService.findByDiaryId(diaryId);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.photoService.remove(id);
  }
}
