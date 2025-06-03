// AI 피드백 컨트롤러: 엔드포인트 및 요청/응답 구조 설계
import { Controller, Post, Body } from '@nestjs/common';

@Controller('ai-feedback')
export class AiFeedbackController {
  // Gemini API 연동 모듈/서비스를 실제로 구현해야 함

  // 오늘의 피드백 조회는 클라이언트에서 처리하므로 필요 없음

  // 피드백 요청: 클라이언트에서 프롬프트(혹은 데이터)를 받아 Gemini API에 전달
  @Post('request')
  async requestFeedback(@Body() body) {
    // const prompt = body.prompt;
    // TODO: Gemini API 호출 로직 (body의 프롬프트/데이터 사용)
    // 예시:
    // const geminiResponse = await geminiService.generateFeedback(prompt);
    // return { feedbackText: geminiResponse };
    return { feedbackText: 'Gemini 응답 예시(임시)' };
  }
}
