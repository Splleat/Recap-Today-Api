import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePhotoDto): Promise<PhotoResponseDto> {
    this.logger.log(`사진 생성 시작 - 일기 ID: ${dto.diaryId}, 사용자 ID: ${dto.userId}`);
    try {
      const photo = await this.prisma.photo.create({ data: dto });
      this.logger.log(`사진 생성 완료 - ID: ${photo.id}, URL: ${photo.url}`);
      return photo;
    } catch (error) {
      this.logger.error(`사진 생성 실패 - 일기 ID: ${dto.diaryId}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<PhotoResponseDto[]> {
    this.logger.log('모든 사진 조회 시작');
    try {
      const result = await this.prisma.photo.findMany();
      this.logger.log(`모든 사진 조회 완료 - 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error('모든 사진 조회 실패', error.stack);
      throw error;
    }
  }

  async findByDiaryId(diaryId: string): Promise<PhotoResponseDto[]> {
    this.logger.log(`일기별 사진 조회 시작 - 일기 ID: ${diaryId}`);
    try {
      const result = await this.prisma.photo.findMany({
        where: { diaryId },
      });
      this.logger.log(`일기별 사진 조회 완료 - 일기 ID: ${diaryId}, 개수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`일기별 사진 조회 실패 - 일기 ID: ${diaryId}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`사진 삭제 시작 - ID: ${id}`);
    try {
      await this.prisma.photo.delete({ where: { id } });
      this.logger.log(`사진 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`사진 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }
}
