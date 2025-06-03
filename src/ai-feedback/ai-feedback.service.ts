// AI 피드백 서비스: Gemini API 연동 및 피드백 생성 로직
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

// 1일 1회 제한을 위한 메모리 저장소 (프로덕션에서는 Redis/DB 권장)
const userRequestMap: Map<string, string> = new Map(); // userId -> yyyy-MM-dd

@Injectable()
export class AiFeedbackService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async requestFeedbackWithLimit(userId: string, prompt: string, maxPerDay?: number): Promise<string> {
    const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    // 요청 카운트 저장 구조로 변경 (userId -> { date, count })
    let date = '', count = 0;
    if (userRequestMap.has(userId)) {
      const userData = userRequestMap.get(userId);
      if (userData) {
        const parts = userData.split(':');
        date = parts[0];
        count = parseInt(parts[1], 10);
      }
    }
    // maxPerDay가 undefined/null이면 환경변수에서 읽어옴 (기본값 1)
    let limit = maxPerDay;
    if (limit === undefined || limit === null) {
      const max = this.configService.get<number>('AI_FEEDBACK_MAX_PER_DAY');
      limit = max && max > 0 ? max : 1;
    }
    if (date === today && count >= limit) {
      throw {
        status: 429,
        message: `오늘은 AI 피드백을 최대 ${limit}회 요청하셨습니다.`
      };
    }
    // 실제 Gemini 호출
    const feedbackText = await this.requestFeedback(prompt);
    if (date === today) {
      userRequestMap.set(userId, `${today}:${count + 1}`);
    } else {
      userRequestMap.set(userId, `${today}:1`);
    }
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
      // Gemini 응답에서 텍스트 추출
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      // TODO: 에러 로깅/처리
      return '';
    }
  }
}
