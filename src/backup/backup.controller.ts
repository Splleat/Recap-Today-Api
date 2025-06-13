import { Controller, Post, Body, Delete, Param, Logger, Get, Res } from '@nestjs/common';
import { BackupService } from './backup.service';
import { Response } from 'express';

export interface BackupData {
  diaries?: any[];
  checklists?: any[];
  schedules?: any[];
  appUsages?: any[];
  emotions?: any[];
  locations?: any[];
  steps?: any[];
  aiFeedbacks?: any[];
  photos?: any[];
  photoFiles?: any[]; // 사진 파일 데이터
  isPhotoChunk?: boolean; // 사진 청크 여부
}

@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);
  
  constructor(private readonly backupService: BackupService) {}

  @Post('sync/:userId')  async syncAllData(@Param('userId') userId: string, @Body() data: BackupData) {
    this.logger.log(`백업 동기화 API 요청 - 사용자: ${userId}`);    const dataStats = {
      diaries: data.diaries?.length || 0,
      checklists: data.checklists?.length || 0,
      schedules: data.schedules?.length || 0,
      appUsages: data.appUsages?.length || 0,
      emotions: data.emotions?.length || 0,
      locations: data.locations?.length || 0,
      steps: data.steps?.length || 0,
      aiFeedbacks: data.aiFeedbacks?.length || 0,
      photos: (data.photos?.length || 0) + ' (일기 필드로 관리됨)',
    };
    this.logger.log(`요청 데이터 통계: ${JSON.stringify(dataStats)}`);
    
    try {
      const result = await this.backupService.syncAllData(userId, data);
      this.logger.log(`백업 동기화 API 응답 - 사용자: ${userId}, 성공: ${result.success}`);
      return result;
    } catch (error) {
      this.logger.error(`백업 동기화 API 오류 - 사용자: ${userId}`, error.stack);
      throw error;
    }  }
  @Post('sync-photos/:userId')
  async syncPhotos(@Param('userId') userId: string, @Body() data: BackupData) {
    this.logger.log(`사진 청크 동기화 API 요청 - 사용자: ${userId}`);
    
    const photoCount = data.photoFiles?.length || 0;
    const totalDataSize = data.photoFiles?.reduce((sum, photo) => sum + (photo.data?.length || 0), 0) || 0;
    this.logger.log(`사진 청크 데이터 통계: ${photoCount}개, 총 데이터 크기: ${Math.round(totalDataSize / 1024)}KB`);
    
    try {
      const result = await this.backupService.syncPhotoChunk(userId, data.photoFiles || []);
      this.logger.log(`사진 청크 동기화 API 응답 - 사용자: ${userId}, 성공: ${result.success}, 처리됨: ${result.syncedCount || 0}/${photoCount}개`);
      return result;
    } catch (error) {
      this.logger.error(`사진 청크 동기화 API 오류 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  @Post('restore/:userId')
  async restoreAllData(@Param('userId') userId: string) {
    this.logger.log(`데이터 복원 API 요청 - 사용자: ${userId}`);
    
    try {
      const result = await this.backupService.restoreAllData(userId);
      this.logger.log(`데이터 복원 API 응답 - 사용자: ${userId}, 성공: ${result.success}`);
      return result;
    } catch (error) {
      this.logger.error(`데이터 복원 API 오류 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  @Delete('clear/:userId')
  async clearAllData(@Param('userId') userId: string) {
    this.logger.log(`데이터 삭제 API 요청 - 사용자: ${userId}`);
      try {
      const result = await this.backupService.clearAllData(userId);
      this.logger.log(`데이터 삭제 API 응답 - 사용자: ${userId}, 성공: ${result.success}`);
      return result;
    } catch (error) {
      this.logger.error(`데이터 삭제 API 오류 - 사용자: ${userId}`, error.stack);
      throw error;
    }
  }

  @Get('download-photo/:userId/:fileName')
  async downloadPhoto(
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    this.logger.log(`사진 다운로드 요청 - 사용자: ${userId}, 파일: ${fileName}`);
    
    try {
      const result = await this.backupService.downloadPhotoFile(userId, fileName);
        if (result.success && result.fileBuffer) {
        // 파일 확장자에 따른 Content-Type 설정
        const extension = fileName.toLowerCase().split('.').pop();
        let contentType = 'image/jpeg'; // 기본값
        
        switch (extension) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'jpg':
          case 'jpeg':
          default:
            contentType = 'image/jpeg';
            break;
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', result.fileBuffer.length.toString());
        return res.send(result.fileBuffer);
      } else {
        this.logger.warn(`사진 다운로드 실패 - 사용자: ${userId}, 파일: ${fileName}, 오류: ${result.error}`);
        return res.status(404).json({ error: result.error || 'Photo not found' });
      }
    } catch (error) {
      this.logger.error(`사진 다운로드 오류 - 사용자: ${userId}, 파일: ${fileName}`, error.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
