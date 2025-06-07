// AI 피드백 서비스: Gemini API 연동 및 피드백 생성 로직
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AiFeedbackLimitService } from './ai-feedback-limit.service';

@Injectable()
export class AiFeedbackService {
  private readonly logger = new Logger(AiFeedbackService.name);
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aiFeedbackLimitService: AiFeedbackLimitService,
  ) {}
  async requestFeedbackWithLimit(userId: string, prompt: string, maxPerDay?: number): Promise<string> {
    this.logger.log(`AI 피드백 요청 시작 - 사용자: ${userId}, 프롬프트 길이: ${prompt.length}`);
    
    const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    // DB에서 오늘 카운트 조회
    let count = await this.aiFeedbackLimitService.getTodayCount(userId, today);
    // maxPerDay가 undefined/null이면 환경변수에서 읽어옴 (기본값 1)
    let limit = maxPerDay;
    if (limit === undefined || limit === null) {
      const max = this.configService.get<number>('AI_FEEDBACK_MAX_PER_DAY');
      limit = max && max > 0 ? max : 1;
    }
    
    this.logger.log(`AI 피드백 제한 확인 - 사용자: ${userId}, 오늘 사용: ${count}/${limit}`);
    
    if (count >= limit) {
      this.logger.warn(`AI 피드백 일일 제한 초과 - 사용자: ${userId}, 제한: ${limit}`);
      throw {
        status: 429,
        message: `오늘은 AI 피드백을 최대 ${limit}회 요청하셨습니다.`
      };
    }
    
    try {
      // 실제 Gemini 호출
      const feedbackText = await this.requestFeedback(prompt);
      // 카운트 증가
      await this.aiFeedbackLimitService.incrementTodayCount(userId, today);
      this.logger.log(`AI 피드백 요청 완료 - 사용자: ${userId}, 응답 길이: ${feedbackText.length}`);
      return feedbackText;
    } catch (error) {
      this.logger.error(`AI 피드백 요청 실패 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  async requestFeedback(prompt: string): Promise<string> {
    this.logger.log(`Gemini API 호출 시작 - 프롬프트 길이: ${prompt.length}`);
    
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
      this.logger.log(`Gemini API 응답 수신 - 모델: ${model}, 응답 크기: ${JSON.stringify(response.data).length}`);
      this.logger.debug('Gemini API response:', JSON.stringify(response.data, null, 2));
      
      const feedbackText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      this.logger.log(`Gemini API 호출 완료 - 생성된 텍스트 길이: ${feedbackText.length}`);
      
      return feedbackText;
    } catch (e) {
      this.logger.error('Gemini API 호출 실패:', e);
      console.error('Gemini API error:', e);
      return '';
    }
  }
}
