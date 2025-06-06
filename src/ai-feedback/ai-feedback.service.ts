// AI 피드백 서비스: Gemini API 연동 및 피드백 생성 로직
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AiFeedbackLimitService } from './ai-feedback-limit.service';

@Injectable()
export class AiFeedbackService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aiFeedbackLimitService: AiFeedbackLimitService,
  ) {}

  async requestFeedbackWithLimit(userId: string, prompt: string, maxPerDay?: number): Promise<string> {
    const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    // DB에서 오늘 카운트 조회
    let count = await this.aiFeedbackLimitService.getTodayCount(userId, today);
    // maxPerDay가 undefined/null이면 환경변수에서 읽어옴 (기본값 1)
    let limit = maxPerDay;
    if (limit === undefined || limit === null) {
      const max = this.configService.get<number>('AI_FEEDBACK_MAX_PER_DAY');
      limit = max && max > 0 ? max : 1;
    }
    if (count >= limit) {
      throw {
        status: 429,
        message: `오늘은 AI 피드백을 최대 ${limit}회 요청하셨습니다.`
      };
    }
    // 실제 Gemini 호출
    const feedbackText = await this.requestFeedback(prompt);
    // 카운트 증가
    await this.aiFeedbackLimitService.incrementTodayCount(userId, today);
    return feedbackText;
  }

  async requestFeedback(prompt: string): Promise<string> {
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const response = await this.httpService.axiosRef.post(
        `${geminiUrl}?key=${geminiApiKey}`,
        {
          contents: [
            { parts: [{ text: prompt }] }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      // Gemini 응답 로그 추가
      console.log('Gemini API response:', JSON.stringify(response.data, null, 2));
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      // TODO: 에러 로깅/처리
      console.error('Gemini API error:', e);
      return '';
    }
  }
}
