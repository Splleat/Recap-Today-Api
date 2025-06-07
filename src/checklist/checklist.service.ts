import { Injectable, Logger } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChecklistService {
  private readonly logger = new Logger(ChecklistService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChecklistDto) {
    this.logger.log(`체크리스트 생성 시작 - 사용자: ${dto.userId}, 텍스트: ${dto.text}`);
    try {
      const result = await this.prisma.checklist.create({
        data: {
          userId: dto.userId,
          text: dto.text,
          subtext: dto.subtext,
          dueDate: dto.dueDate || null,
        }
      });
      this.logger.log(`체크리스트 생성 완료 - ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`체크리스트 생성 실패 - 사용자: ${dto.userId}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string) {
    this.logger.log(`체크리스트 조회 시작 - 사용자: ${userId}`);
    try {
      const result = await this.prisma.checklist.findMany({
        where: { userId },
      });
      this.logger.log(`체크리스트 조회 완료 - 사용자: ${userId}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`체크리스트 조회 실패 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  async update(id: string, data: UpdateChecklistDto) {
    this.logger.log(`체크리스트 업데이트 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.checklist.update({
        where: { id },
        data: {
          text: data.text,
          subtext: data.subtext,
          isChecked: data.isChecked,
          dueDate: data.dueDate || null,
          completedDate: data.completedDate || null,
        },
      });
      this.logger.log(`체크리스트 업데이트 완료 - ID: ${id}, 체크상태: ${data.isChecked}`);
      return result;
    } catch (error) {
      this.logger.error(`체크리스트 업데이트 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`체크리스트 삭제 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.checklist.delete({
        where: { id },
      });
      this.logger.log(`체크리스트 삭제 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`체크리스트 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
