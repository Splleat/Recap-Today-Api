import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AiFeedbackLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayCount(userId: string, today: string): Promise<number> {
    const record = await this.prisma.userFeedbackLimit.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    return record?.count ?? 0;
  }

  async incrementTodayCount(userId: string, today: string): Promise<number> {
    const record = await this.prisma.userFeedbackLimit.upsert({
      where: { userId_date: { userId, date: today } },
      update: { count: { increment: 1 } },
      create: { userId, date: today, count: 1 },
    });
    return record.count;
  }
}
