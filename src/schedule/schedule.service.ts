import { Injectable, Logger } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    this.logger.log(`일정 생성 시작 - 사용자: ${dto.userId}, 텍스트: ${dto.text}`);
    try {
      const result = await this.prisma.schedule.create({
        data: {
          userId: dto.userId,
          text: dto.text,
          subText: dto.subText,
          dayOfWeek: dto.dayOfWeek,
          selectedDate: dto.selectedDate || null,
          isRoutine: dto.isRoutine,
          startTimeHour: dto.startTimeHour,
          startTimeMinute: dto.startTimeMinute,
          endTimeHour: dto.endTimeHour,
          endTimeMinute: dto.endTimeMinute,
          colorValue: dto.colorValue,
          hasAlarm: dto.hasAlarm,
          alarmOffset: dto.alarmOffset,
        },
      });
      this.logger.log(`일정 생성 완료 - ID: ${result.id}, 루틴: ${dto.isRoutine}`);
      return result;
    } catch (error) {
      this.logger.error(`일정 생성 실패 - 사용자: ${dto.userId}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string) {
    this.logger.log(`일정 조회 시작 - 사용자: ${userId}`);
    try {
      const result = await this.prisma.schedule.findMany({
        where: { userId },
      });
      this.logger.log(`일정 조회 완료 - 사용자: ${userId}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`일정 조회 실패 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateScheduleDto) {
    this.logger.log(`일정 업데이트 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.schedule.update({
        where: { id },
        data: dto,
      });
      this.logger.log(`일정 업데이트 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`일정 업데이트 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`일정 삭제 시작 - ID: ${id}`);
    try {
      const result = await this.prisma.schedule.delete({
        where: { id },
      });
      this.logger.log(`일정 삭제 완료 - ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`일정 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
