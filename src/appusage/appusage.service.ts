import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateAppUsageDto } from './dto/create-appusage.dto';
import { UpdateAppUsageDto } from './dto/update-appusage.dto';

@Injectable()
export class AppUsageService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAppUsageDto) {
    return this.prisma.appUsage.create({ data });
  }

  findAllByUser(userId: string) {
    return this.prisma.appUsage.findMany({ where: { userId } });
  }

  findByUserAndDate(userId: string, date: string) {
    return this.prisma.appUsage.findMany({ where: { userId, date } });
  }

  update(id: string, data: UpdateAppUsageDto) {
    return this.prisma.appUsage.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.appUsage.delete({ where: { id } });
  }
}
