import { Test, TestingModule } from '@nestjs/testing';
import { AiFeedbackService } from './ai-feedback.service';
import { AiFeedbackLimitService } from './ai-feedback-limit.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

// Mock dependencies
const mockHttpService = { axiosRef: { post: jest.fn() } };
const mockConfigService = { get: jest.fn() };
const mockLimitService = {
  getTodayCount: jest.fn(),
  incrementTodayCount: jest.fn(),
};

describe('AiFeedbackService', () => {
  let service: AiFeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiFeedbackService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AiFeedbackLimitService, useValue: mockLimitService },
      ],
    }).compile();
    service = module.get<AiFeedbackService>(AiFeedbackService);
    jest.clearAllMocks();
  });

  it('dummy', () => {
    expect(true).toBe(true);
  });

  it('should allow feedback if under limit', async () => {
    mockLimitService.getTodayCount.mockResolvedValue(0);
    mockConfigService.get.mockReturnValue(1);
    mockHttpService.axiosRef.post.mockResolvedValue({ data: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] } });
    const result = await service.requestFeedbackWithLimit('user1', 'prompt');
    expect(result).toBe('ok');
    expect(mockLimitService.incrementTodayCount).toHaveBeenCalled();
  });

  it('should block feedback if over limit', async () => {
    mockLimitService.getTodayCount.mockResolvedValue(1);
    mockConfigService.get.mockReturnValue(1);
    await expect(service.requestFeedbackWithLimit('user1', 'prompt')).rejects.toMatchObject({ status: 429 });
  });

  it('should handle Gemini API error gracefully', async () => {
    mockLimitService.getTodayCount.mockResolvedValue(0);
    mockConfigService.get.mockReturnValue(1);
    mockHttpService.axiosRef.post.mockRejectedValue(new Error('fail'));
    const result = await service.requestFeedbackWithLimit('user1', 'prompt');
    expect(result).toBe('');
  });
});
