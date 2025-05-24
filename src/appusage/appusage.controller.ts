import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { AppUsageService } from './appusage.service';
import { CreateAppUsageDto } from './dto/create-appusage.dto';
import { UpdateAppUsageDto } from './dto/update-appusage.dto';

@Controller('app-usage')
export class AppUsageController {
  constructor(private readonly service: AppUsageService) {}

  @Post()
  create(@Body() data: CreateAppUsageDto) {
    return this.service.create(data);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Get('user/:userId/date/:date')
  findByUserAndDate(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.service.findByUserAndDate(userId, date);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateAppUsageDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
