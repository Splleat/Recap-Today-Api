import { Injectable } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChecklistDto) {
    return await this.prisma.checklist.create({
      data: {
        ...dto,
      }
    });
  }

  async findAll(userId: string) {
    return await this.prisma.checklist.findMany({
      where: { userId },
    });
  }

  async update(id: string, data: UpdateChecklistDto) {
    return await this.prisma.checklist.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return await this.prisma.checklist.delete({
      where: { id },
    });
  }
}
