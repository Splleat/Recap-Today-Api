// AI 피드백 모듈: 컨트롤러 및 서비스 등록
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiFeedbackController } from './ai-feedback.controller';
import { AiFeedbackService } from './ai-feedback.service';
import { AuthModule } from '../auth/auth.module';
import { AiFeedbackLimitService } from './ai-feedback-limit.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [HttpModule, ConfigModule, AuthModule],
  controllers: [AiFeedbackController],
  providers: [AiFeedbackService, AiFeedbackLimitService, PrismaService],
})
export class AiFeedbackModule {}
