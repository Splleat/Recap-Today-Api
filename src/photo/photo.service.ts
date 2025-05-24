import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';

@Injectable()
export class PhotoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePhotoDto): Promise<PhotoResponseDto> {
    const photo = await this.prisma.photo.create({ data: dto });
    return photo;
  }

  async findAll(): Promise<PhotoResponseDto[]> {
    return this.prisma.photo.findMany();
  }

  async findByDiaryId(diaryId: string): Promise<PhotoResponseDto[]> {
    return this.prisma.photo.findMany({
      where: { diaryId },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.photo.delete({ where: { id } });
  }
}
