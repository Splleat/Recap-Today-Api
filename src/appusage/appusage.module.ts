import { Module } from '@nestjs/common';
import { AppUsageService } from './appusage.service';
import { AppUsageController } from './appusage.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AppUsageController],
  providers: [AppUsageService, PrismaService],
})
export class AppUsageModule {}
