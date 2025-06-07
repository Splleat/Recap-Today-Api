import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateAppUsageDto } from './dto/create-appusage.dto';
import { UpdateAppUsageDto } from './dto/update-appusage.dto';

@Injectable()
export class AppUsageService {
  private readonly logger = new Logger(AppUsageService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAppUsageDto) {
    this.logger.log(`앱 사용량 생성 시작 - 사용자: ${data.userId}, 패키지: ${data.packageName}`);
    try {
      const result = await this.prisma.appUsage.create({ data });
      this.logger.log(`앱 사용량 생성 완료 - ID: ${result.id}, 앱명: ${data.appName}`);
      return result;
    } catch (error) {
      this.logger.error(`앱 사용량 생성 실패 - 사용자: ${data.userId}, 패키지: ${data.packageName}`, error.stack);
      throw error;
    }
  }

  async findAllByUser(userId: string) {
    this.logger.log(`사용자별 앱 사용량 조회 시작 - 사용자: ${userId}`);
    try {
      const result = await this.prisma.appUsage.findMany({ where: { userId } });
      this.logger.log(`사용자별 앱 사용량 조회 완료 - 사용자: ${userId}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`사용자별 앱 사용량 조회 실패 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  async findByUserAndDate(userId: string, date: string) {
    this.logger.log(`날짜별 앱 사용량 조회 시작 - 사용자: ${userId}, 날짜: ${date}`);
    try {
      const result = await this.prisma.appUsage.findMany({ where: { userId, date } });
      this.logger.log(`날짜별 앱 사용량 조회 완료 - 사용자: ${userId}, 날짜: ${date}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`날짜별 앱 사용량 조회 실패 - 사용자: ${userId}, 날짜: ${date}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: UpdateAppUsageDto) {
    this.logger.log(`앱 사용량 업데이트 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.appUsage.update({
        where: { id },
        data,
      });
      this.logger.log(`앱 사용량 업데이트 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`앱 사용량 업데이트 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`앱 사용량 삭제 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.appUsage.delete({ where: { id } });
      this.logger.log(`앱 사용량 삭제 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`앱 사용량 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
