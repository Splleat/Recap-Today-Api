// AI 피드백 컨트롤러: 엔드포인트 및 요청/응답 구조 설계
import { Body, Controller, Post, Request, HttpException, HttpStatus } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AiFeedbackService } from './ai-feedback.service';

@Controller('ai-feedback')
export class AiFeedbackController {
  constructor(private readonly aiFeedbackService: AiFeedbackService) {}

  // 피드백 요청: 클라이언트에서 프롬프트(혹은 데이터)를 받아 Gemini API에 전달
  @UseGuards(AuthGuard)
  @Post('request')
  async requestFeedback(@Request() req, @Body() body) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const prompt = body.prompt;
    // maxPerDay 인자 없이 서비스 호출 (환경변수 내부 처리)
    const feedbackText = await this.aiFeedbackService.requestFeedbackWithLimit(userId, prompt);
    return { feedbackText };
  }
}
