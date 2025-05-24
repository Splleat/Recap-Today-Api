import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDiaryDto) {
    return await this.prisma.diary.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(userId: string) {
    return await this.prisma.diary.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, dto: UpdateDiaryDto) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('Diary not found');

    return this.prisma.diary.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('Diary not found');

    return this.prisma.diary.delete({ where: { id } });
  }
}