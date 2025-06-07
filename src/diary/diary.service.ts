import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDiaryDto) {
    this.logger.log(`일기 생성 시작 - 사용자: ${userId}, 날짜: ${dto.date}`);
    try {
      const result = await this.prisma.diary.create({
        data: {
          userId,
          ...dto,
        },
      });
      this.logger.log(`일기 생성 완료 - ID: ${result.id}, 제목: ${dto.title}`);
      return result;
    } catch (error) {
      this.logger.error(`일기 생성 실패 - 사용자: ${userId}, 날짜: ${dto.date}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string) {
    this.logger.log(`일기 조회 시작 - 사용자: ${userId}`);
    try {
      const result = await this.prisma.diary.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });
      this.logger.log(`일기 조회 완료 - 사용자: ${userId}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`일기 조회 실패 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateDiaryDto) {
    this.logger.log(`일기 업데이트 시작 - ID: ${id}`);
    try {
      const diary = await this.prisma.diary.findUnique({ where: { id } });
      if (!diary) {
        this.logger.warn(`일기를 찾을 수 없음 - ID: ${id}`);
        throw new NotFoundException('Diary not found');
      }

      const result = await this.prisma.diary.update({
        where: { id },
        data: dto,
      });
      this.logger.log(`일기 업데이트 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`일기 업데이트 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`일기 삭제 시작 - ID: ${id}`);
    try {
      const diary = await this.prisma.diary.findUnique({ where: { id } });
      if (!diary) {
        this.logger.warn(`일기를 찾을 수 없음 - ID: ${id}`);
        throw new NotFoundException('Diary not found');
      }

      const result = await this.prisma.diary.delete({ where: { id } });
      this.logger.log(`일기 삭제 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`일기 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}