import { Controller, Post, Body, Delete, Param, Logger } from '@nestjs/common';
import { BackupService } from './backup.service';

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
    this.logger.log(`사진 청크 데이터 통계: ${photoCount}개`);
    
    try {
      const result = await this.backupService.syncPhotoChunk(userId, data.photoFiles || []);
      this.logger.log(`사진 청크 동기화 API 응답 - 사용자: ${userId}, 성공: ${result.success}`);
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
}
