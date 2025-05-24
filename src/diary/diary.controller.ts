import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Controller('diaries')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  create(@Body('userId') userId: string, @Body() dto: CreateDiaryDto) {
    return this.diaryService.create(userId, dto);
  }

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.diaryService.findAll(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiaryDto) {
    return this.diaryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diaryService.remove(id);
  }
}