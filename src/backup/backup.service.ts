import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { BackupData } from './backup.controller';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  
  constructor(private readonly prisma: PrismaService) {}
  // Helper method to safely convert BigInt values to strings
  private safeBigIntToString(value: any): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value || 0);
  }
  // Helper method to safely serialize objects with BigInt values
  private serializeObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }));
  }

  // 이미지 파일 시그니처 검증 메서드
  private validateImageSignature(signature: Buffer): boolean {
    // JPEG 시그니처: FF D8 FF
    if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
      return true;
    }
    
    // PNG 시그니처: 89 50 4E 47
    if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
      return true;
    }
    
    // GIF 시그니처: 47 49 46 38 (GIF8)
    if (signature[0] === 0x47 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x38) {
      return true;
    }
    
    // WebP 시그니처: 52 49 46 46 (RIFF) - 추가 검사 필요하지만 기본적으로 허용
    if (signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46) {
      return true;
    }
    
    return false;
  }
  async syncAllData(userId: string, data: BackupData) {
    this.logger.log(`백업 동기화 시작 - 사용자 ID: ${userId}`);
      const results = {
      success: true,
      synced: {
        diaries: 0,
        checklists: 0,
        schedules: 0,
        appUsages: 0,
        emotions: 0,
        locations: 0,
        steps: 0,
        aiFeedbacks: 0,
        photos: 0,
      },
      errors: []
    };

    try {
      // 사용자 확인 또는 생성
      this.logger.log(`사용자 확인 중: ${userId}`);
      let user = await this.prisma.user.findUnique({
        where: { userId: userId }
      });

      if (!user) {
        this.logger.log(`새 사용자 생성: ${userId}`);
        user = await this.prisma.user.create({
          data: { userId: userId }
        });
      } else {
        this.logger.log(`기존 사용자 확인됨: ${userId}`);
      }

      // 일기 데이터 동기화
      if (data.diaries && data.diaries.length > 0) {
        this.logger.log(`일기 데이터 동기화 시작: ${data.diaries.length}개`);
        results.synced.diaries = await this.syncDiaries(user.id, data.diaries);
        this.logger.log(`일기 데이터 동기화 완료: ${results.synced.diaries}개`);
      }

      // 체크리스트 데이터 동기화
      if (data.checklists && data.checklists.length > 0) {
        this.logger.log(`체크리스트 데이터 동기화 시작: ${data.checklists.length}개`);
        results.synced.checklists = await this.syncChecklists(user.id, data.checklists);
        this.logger.log(`체크리스트 데이터 동기화 완료: ${results.synced.checklists}개`);
      }

      // 일정 데이터 동기화
      if (data.schedules && data.schedules.length > 0) {
        this.logger.log(`일정 데이터 동기화 시작: ${data.schedules.length}개`);
        results.synced.schedules = await this.syncSchedules(user.id, data.schedules);
        this.logger.log(`일정 데이터 동기화 완료: ${results.synced.schedules}개`);
      }      // 앱 사용량 데이터 동기화
      if (data.appUsages && data.appUsages.length > 0) {
        this.logger.log(`앱 사용량 데이터 동기화 시작: ${data.appUsages.length}개`);
        results.synced.appUsages = await this.syncAppUsages(user.id, data.appUsages);
        this.logger.log(`앱 사용량 데이터 동기화 완료: ${results.synced.appUsages}개`);
      }

      // 감정 기록 데이터 동기화
      if (data.emotions && data.emotions.length > 0) {
        this.logger.log(`감정 기록 데이터 동기화 시작: ${data.emotions.length}개`);
        results.synced.emotions = await this.syncEmotions(user.id, data.emotions);
        this.logger.log(`감정 기록 데이터 동기화 완료: ${results.synced.emotions}개`);
      }

      // 위치 로그 데이터 동기화
      if (data.locations && data.locations.length > 0) {
        this.logger.log(`위치 로그 데이터 동기화 시작: ${data.locations.length}개`);
        results.synced.locations = await this.syncLocationLogs(user.id, data.locations);
        this.logger.log(`위치 로그 데이터 동기화 완료: ${results.synced.locations}개`);
      }

      // 걸음 수 데이터 동기화
      if (data.steps && data.steps.length > 0) {
        this.logger.log(`걸음 수 데이터 동기화 시작: ${data.steps.length}개`);
        results.synced.steps = await this.syncStepRecords(user.id, data.steps);
        this.logger.log(`걸음 수 데이터 동기화 완료: ${results.synced.steps}개`);
      }      // AI 피드백 데이터 동기화
      if (data.aiFeedbacks && data.aiFeedbacks.length > 0) {
        this.logger.log(`AI 피드백 데이터 동기화 시작: ${data.aiFeedbacks.length}개`);
        results.synced.aiFeedbacks = await this.syncAiFeedbacks(user.id, data.aiFeedbacks);
        this.logger.log(`AI 피드백 데이터 동기화 완료: ${results.synced.aiFeedbacks}개`);
      }

      // 사진 데이터는 일기 테이블의 photoPaths 필드로 관리되므로 별도 동기화 불필요
      if (data.photos && data.photos.length > 0) {
        this.logger.log(`사진 데이터는 일기의 photoPaths 필드로 관리됨: ${data.photos.length}개 스킵`);
        results.synced.photos = 0; // 별도 동기화하지 않음
      }

      this.logger.log(`백업 동기화 성공 완료 - 사용자: ${userId}, 총 동기화 항목: ${Object.values(results.synced).reduce((a, b) => a + b, 0)}개`);
      return results;
    } catch (error) {
      this.logger.error(`백업 동기화 실패 - 사용자: ${userId}, 오류: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        synced: results.synced
      };
    }
  }
  async syncPhotoChunk(userId: string, photoFiles: any[]) {
    this.logger.log(`사진 청크 동기화 시작 - 사용자 ID: ${userId}, 사진 수: ${photoFiles.length}`);
    
    // 받은 데이터 구조 로깅
    this.logger.debug(`받은 photoFiles 구조: ${JSON.stringify(photoFiles.map(pf => ({
      fileName: pf.fileName,
      hasData: !!pf.data,
      dataLength: pf.data ? pf.data.length : 0,
      diaryDate: pf.diaryDate,
      diaryUserId: pf.diaryUserId
    })))}`);
    
    try {
      // 사용자 확인
      const user = await this.prisma.user.findUnique({
        where: { userId: userId }
      });

      if (!user) {
        this.logger.warn(`사용자를 찾을 수 없음: ${userId}`);
        return {
          success: false,
          error: 'User not found'
        };
      }

      let syncedCount = 0;
      
      // 각 사진 파일 처리
      for (const photoFile of photoFiles) {        try {          // 사진 파일 데이터를 일기에 연결하여 저장
          // photoFile 구조: { fileName, data, diaryDate, diaryUserId }
          const { fileName, data, diaryDate, diaryUserId } = photoFile;
          
          this.logger.debug(`사진 파일 처리 시작: ${fileName}, 데이터 길이: ${data ? data.length : 0}`);
          
          if (!fileName || !data || !diaryDate) {
            this.logger.warn(`사진 파일 데이터가 불완전함: fileName=${fileName}, hasData=${!!data}, diaryDate=${diaryDate}`);
            continue;
          }

          // Base64 데이터 유효성 검사
          if (typeof data !== 'string') {
            this.logger.warn(`Base64 데이터가 문자열이 아님: ${typeof data}`);
            continue;
          }

          if (data.length < 100) {
            this.logger.warn(`Base64 데이터가 너무 짧음: ${data.length} 문자`);
            continue;
          }

          // 해당 날짜의 일기 찾기
          const diary = await this.prisma.diary.findFirst({
            where: {
              userId: user.id,
              date: diaryDate
            }
          });          if (diary) {
            // Base64 데이터를 파일로 저장
            let base64Data = data;
            let buffer: Buffer;
            
            // data: 접두사 제거 (있는 경우)
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1];
              this.logger.debug(`데이터 URL 접두사 제거됨: ${data.length} → ${base64Data.length} 문자`);
            }
            
            try {
              buffer = Buffer.from(base64Data, 'base64');
              this.logger.debug(`Base64 디코딩 성공: ${base64Data.length} 문자 → ${buffer.length} 바이트`);
                // 이미지 파일 시그니처 검증
              const signature = buffer.subarray(0, 4);
              const isValidImage = this.validateImageSignature(signature);
              
              if (!isValidImage) {
                this.logger.warn(`유효하지 않은 이미지 파일 형식: ${fileName}`);
                continue;
              }
              
              // 디코딩된 데이터가 너무 작으면 유효하지 않음
              if (buffer.length < 1000) {
                this.logger.warn(`디코딩된 이미지 데이터가 너무 작음: ${buffer.length} 바이트`);
                continue;
              }
                // uploads 디렉토리 생성 (없으면)
              const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
                this.logger.debug(`업로드 디렉토리 생성: ${uploadsDir}`);
              }
              
              // 파일 경로 확인
              const filePath = path.join(uploadsDir, fileName);
              const fileExists = fs.existsSync(filePath);
              
              // 파일이 이미 존재하는 경우 크기 비교
              if (fileExists) {
                const existingSize = fs.statSync(filePath).size;
                if (existingSize === buffer.length) {
                  this.logger.debug(`동일한 크기의 파일이 이미 존재함: ${fileName} (${existingSize} 바이트)`);
                } else {
                  this.logger.debug(`다른 크기의 파일 덮어쓰기: ${fileName} (기존: ${existingSize}, 새로운: ${buffer.length} 바이트)`);
                  fs.writeFileSync(filePath, buffer);
                }
              } else {
                // 새 파일 저장
                fs.writeFileSync(filePath, buffer);
                this.logger.debug(`새 파일 저장 완료: ${filePath} (${buffer.length} 바이트)`);
              }
              
            } catch (decodeError) {
              this.logger.error(`Base64 디코딩 실패: ${decodeError.message}, 데이터 샘플: ${base64Data.substring(0, 100)}...`);
              continue;
            }
            
            // 일기가 존재하면 photoPaths 필드에 사진 정보 추가
            const currentPhotoPaths = diary.photoPaths || '[]';
            let photoPathsArray: string[] = [];
            
            try {
              photoPathsArray = JSON.parse(currentPhotoPaths);
            } catch (e) {
              photoPathsArray = [];
            }

            // 이미 존재하는 파일명인지 확인
            if (!photoPathsArray.includes(fileName)) {
              photoPathsArray.push(fileName);
              
              // 일기의 photoPaths 업데이트
              await this.prisma.diary.update({
                where: { id: diary.id },
                data: {
                  photoPaths: JSON.stringify(photoPathsArray)
                }
              });
              
              syncedCount++;
              this.logger.debug(`사진 파일 동기화 완료: ${fileName} (일기: ${diaryDate}, 파일 크기: ${buffer.length} bytes)`);
            } else {
              this.logger.debug(`이미 존재하는 사진 파일: ${fileName} (일기: ${diaryDate})`);
            }
          } else {
            this.logger.warn(`해당 날짜의 일기를 찾을 수 없음: ${diaryDate} (사진: ${fileName})`);
          }
          
        } catch (photoError) {
          this.logger.error(`개별 사진 파일 처리 오류: ${photoError.message}`);
        }
      }

      this.logger.log(`사진 청크 동기화 완료 - 사용자: ${userId}, 처리된 사진: ${syncedCount}/${photoFiles.length}개`);
      
      return {
        success: true,
        message: `사진 청크 동기화 완료: ${syncedCount}개 처리됨`,
        syncedCount: syncedCount,
        totalCount: photoFiles.length
      };
      
    } catch (error) {
      this.logger.error(`사진 청크 동기화 실패 - 사용자: ${userId}, 오류: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clearAllData(userId: string) {
    this.logger.log(`모든 데이터 삭제 시작 - 사용자 ID: ${userId}`);
    
    try {
      // 사용자 찾기
      this.logger.log(`사용자 조회 중: ${userId}`);
      const user = await this.prisma.user.findUnique({
        where: { userId: userId }
      });

      if (!user) {
        this.logger.warn(`사용자를 찾을 수 없음: ${userId}`);
        return {
          success: false,
          error: 'User not found'
        };
      }      this.logger.log(`사용자 확인됨, 데이터 삭제 시작: ${user.id}`);      
      
      // 사용자의 모든 데이터 삭제 (사진 테이블 제외 - 일기의 photoPaths 필드로 관리)
      const deleteResults = await this.prisma.$transaction([
        this.prisma.appUsage.deleteMany({ where: { userId: user.id } }),
        this.prisma.diary.deleteMany({ where: { userId: user.id } }),
        this.prisma.checklist.deleteMany({ where: { userId: user.id } }),
        this.prisma.schedule.deleteMany({ where: { userId: user.id } }),
        this.prisma.emotionRecord.deleteMany({ where: { userId: user.id } }),
        this.prisma.locationLog.deleteMany({ where: { userId: user.id } }),
        this.prisma.stepRecord.deleteMany({ where: { userId: user.id } }),
        this.prisma.aiFeedback.deleteMany({ where: { userId: user.id } }),
      ]);      const totalDeleted = deleteResults.reduce((sum, result) => sum + result.count, 0);

      this.logger.log(`데이터 삭제 완료 - 사용자: ${userId}, 삭제된 항목: ${totalDeleted}개`);
      this.logger.log(`삭제 상세: 앱사용량=${deleteResults[0].count}, 일기=${deleteResults[1].count}, 체크리스트=${deleteResults[2].count}, 일정=${deleteResults[3].count}, 감정=${deleteResults[4].count}, 위치=${deleteResults[5].count}, 걸음=${deleteResults[6].count}, AI피드백=${deleteResults[7].count}, 사진=0(일기 필드로 관리)`);

      return {
        success: true,
        message: `모든 데이터가 성공적으로 삭제되었습니다. (삭제된 항목: ${totalDeleted}개)`,        deletedCounts: {
          appUsages: deleteResults[0].count,
          diaries: deleteResults[1].count,
          checklists: deleteResults[2].count,
          schedules: deleteResults[3].count,
          emotions: deleteResults[4].count,
          locations: deleteResults[5].count,
          steps: deleteResults[6].count,
          aiFeedbacks: deleteResults[7].count,
          photos: 0, // 사진은 일기의 photoPaths 필드로 관리됨
        }
      };
    } catch (error) {
      this.logger.error(`데이터 삭제 실패 - 사용자: ${userId}, 오류: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
  // 개별 데이터 타입별 동기화 메서드들
  private async syncDiaries(userDbId: string, diaries: any[]) {
    this.logger.log(`일기 동기화 처리 시작: ${diaries.length}개`);
    let count = 0;
    for (const diary of diaries) {
      try {
        // 날짜와 사용자로 중복 확인 후 upsert
        const existingDiary = await this.prisma.diary.findFirst({
          where: {
            userId: userDbId,
            date: diary.date
          }
        });

        if (existingDiary) {
          this.logger.debug(`기존 일기 업데이트: ${diary.date}`);
          await this.prisma.diary.update({
            where: { id: existingDiary.id },
            data: {
              title: diary.title,
              content: diary.content,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 일기 생성: ${diary.date}`);
          await this.prisma.diary.create({
            data: {
              userId: userDbId,
              date: diary.date,
              title: diary.title,
              content: diary.content,
              createdAt: diary.createdAt ? new Date(diary.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`일기 동기화 오류 (${diary.date}):`, error.message);
        console.error(`일기 동기화 오류 (${diary.date}):`, error);
      }
    }
    this.logger.log(`일기 동기화 처리 완료: ${count}/${diaries.length}개 성공`);
    return count;
  }
  private async syncChecklists(userDbId: string, checklists: any[]) {
    this.logger.log(`체크리스트 동기화 처리 시작: ${checklists.length}개`);
    let count = 0;
    for (const checklist of checklists) {
      try {
        // 중복 확인: 텍스트와 사용자 ID로 검사
        const existingChecklist = await this.prisma.checklist.findFirst({
          where: {
            userId: userDbId,
            text: checklist.text,
            dueDate: checklist.dueDate || null
          }
        });

        if (existingChecklist) {
          this.logger.debug(`기존 체크리스트 업데이트: ${checklist.text}`);
          await this.prisma.checklist.update({
            where: { id: existingChecklist.id },
            data: {
              subtext: checklist.subtext,
              isChecked: checklist.isChecked || false,
              completedDate: checklist.completedDate ? checklist.completedDate : null,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 체크리스트 생성: ${checklist.text}`);
          await this.prisma.checklist.create({
            data: {
              userId: userDbId,
              text: checklist.text,
              subtext: checklist.subtext,
              isChecked: checklist.isChecked || false,
              dueDate: checklist.dueDate ? checklist.dueDate : null,
              completedDate: checklist.completedDate ? checklist.completedDate : null,
              createdAt: checklist.createdAt ? new Date(checklist.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`체크리스트 동기화 오류:`, error.message);
        console.error(`체크리스트 동기화 오류:`, error);
      }
    }
    this.logger.log(`체크리스트 동기화 처리 완료: ${count}/${checklists.length}개 성공`);
    return count;
  }
  private async syncSchedules(userDbId: string, schedules: any[]) {
    this.logger.log(`일정 동기화 처리 시작: ${schedules.length}개`);
    let count = 0;
    for (const schedule of schedules) {
      try {        this.logger.debug(`일정 처리 중: ${JSON.stringify(schedule)}`);
        
        // Flutter의 알람 오프셋 필드명 매핑 (alarm_offset_in_minutes -> alarmOffset)
        const alarmOffset = schedule.alarmOffset || schedule.alarm_offset_in_minutes || schedule.alarmOffsetInMinutes;
          // selectedDate와 dayOfWeek 정규화
        const normalizedSelectedDate = schedule.selectedDate && schedule.selectedDate !== '' ? schedule.selectedDate : null;
        const normalizedDayOfWeek = schedule.dayOfWeek || null;        
        this.logger.debug(`정규화된 값: selectedDate=${normalizedSelectedDate}, dayOfWeek=${normalizedDayOfWeek}`);
        
        // 스케줄 ID로 중복 확인 후 upsert
        const existingSchedule = await this.prisma.schedule.findFirst({
          where: {
            userId: userDbId,
            text: schedule.text,
            selectedDate: normalizedSelectedDate,
            dayOfWeek: normalizedDayOfWeek
          }
        });

        if (existingSchedule) {
          this.logger.debug(`기존 일정 업데이트: ${schedule.text}`);
          await this.prisma.schedule.update({
            where: { id: existingSchedule.id },
            data: {
              subText: schedule.subText,
              isRoutine: schedule.isRoutine || false,
              startTimeHour: schedule.startTimeHour || 0,
              startTimeMinute: schedule.startTimeMinute || 0,
              endTimeHour: schedule.endTimeHour || 0,
              endTimeMinute: schedule.endTimeMinute || 0,
              colorValue: schedule.colorValue,
              hasAlarm: schedule.hasAlarm,
              alarmOffset: alarmOffset,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 일정 생성: ${schedule.text}`);          const createdSchedule = await this.prisma.schedule.create({
            data: {
              userId: userDbId,
              text: schedule.text,
              subText: schedule.subText,
              dayOfWeek: normalizedDayOfWeek,
              selectedDate: normalizedSelectedDate,
              isRoutine: schedule.isRoutine || false,
              startTimeHour: schedule.startTimeHour || 0,
              startTimeMinute: schedule.startTimeMinute || 0,
              endTimeHour: schedule.endTimeHour || 0,
              endTimeMinute: schedule.endTimeMinute || 0,
              colorValue: schedule.colorValue,
              hasAlarm: schedule.hasAlarm,              alarmOffset: alarmOffset,
              createdAt: schedule.createdAt ? new Date(schedule.createdAt) : new Date(),
            }
          });
          this.logger.debug(`일정 생성 완료: ID=${createdSchedule.id}`);
        }
        count++;
      } catch (error) {
        this.logger.error(`일정 동기화 오류:`, error.message);
        console.error(`일정 동기화 오류:`, error);
      }
    }    this.logger.log(`일정 동기화 처리 완료: ${count}/${schedules.length}개 성공`);
    return count;
  }

  private async syncAppUsages(userDbId: string, appUsages: any[]) {
    this.logger.log(`앱 사용량 동기화 처리 시작: ${appUsages.length}개`);
    let count = 0;
    for (const appUsage of appUsages) {
      try {
        // snake_case와 camelCase 필드 호환성 처리
        const packageName = appUsage.packageName || appUsage.package_name;
        const appName = appUsage.appName || appUsage.app_name;
        const usageTime = appUsage.usageTimeInMillis || appUsage.usage_time || 0;
        const appIconPath = appUsage.appIconPath || appUsage.app_icon_path;
        
        // packageName이 없는 경우 기본값 설정
        if (!packageName) {
          this.logger.warn(`패키지명이 없는 앱 사용량 데이터에 앱 이름을 패키지명으로 사용: ${JSON.stringify(appUsage)}`);
          if (!appName) {
            this.logger.warn(`앱 이름도 없는 앱 사용량 데이터 스킵`);
            continue;
          }
          // 앱 이름을 패키지명 대신 사용
          appUsage.packageName = appName;
        }

        // 앱 사용량은 사용자, 날짜, 패키지명으로 중복 확인
        const existingAppUsage = await this.prisma.appUsage.findFirst({
          where: {
            userId: userDbId,
            date: appUsage.date,
            packageName: packageName
          }
        });

        if (existingAppUsage) {
          this.logger.debug(`기존 앱 사용량 업데이트: ${packageName} (${appUsage.date})`);
          await this.prisma.appUsage.update({
            where: { id: existingAppUsage.id },
            data: {
              appName: appName || packageName,
              usageTimeInMillis: usageTime,
              appIconPath: appIconPath,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 앱 사용량 생성: ${packageName} (${appUsage.date})`);
          await this.prisma.appUsage.create({
            data: {
              userId: userDbId,
              date: appUsage.date,
              packageName: packageName,
              appName: appName || packageName,
              usageTimeInMillis: usageTime,
              appIconPath: appIconPath,
              createdAt: appUsage.createdAt ? new Date(appUsage.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        const pkgName = appUsage.packageName || appUsage.package_name || 'UNKNOWN';
        this.logger.error(`앱 사용량 동기화 오류 (${pkgName}):`, error.message);
        console.error(`앱 사용량 동기화 오류 (${pkgName}):`, error);
      }
    }
    this.logger.log(`앱 사용량 동기화 처리 완료: ${count}/${appUsages.length}개 성공`);
    return count;
  }
  private async syncEmotions(userDbId: string, emotions: any[]) {
    this.logger.log(`감정 기록 동기화 처리 시작: ${emotions.length}개`);
    let count = 0;
    for (const emotion of emotions) {
      try {
        // emotionType이 없는 경우 기본값 설정 (필수 필드)
        if (!emotion.emotionType) {
          this.logger.warn(`emotionType이 없는 감정 기록 데이터에 기본값 'neutral' 설정: ${emotion.date}-${emotion.hour || 0}`);
          emotion.emotionType = 'neutral';
        }
        
        // hour가 없는 경우 기본값 설정
        if (emotion.hour === undefined || emotion.hour === null) {
          this.logger.warn(`hour가 없는 감정 기록 데이터에 기본값 0 설정: ${emotion.date}`);
          emotion.hour = 0;
        }

        // 날짜, 시간, 사용자로 중복 확인
        const existingEmotion = await this.prisma.emotionRecord.findFirst({
          where: {
            userId: userDbId,
            date: emotion.date,
            hour: emotion.hour
          }
        });

        if (existingEmotion) {
          this.logger.debug(`기존 감정 기록 업데이트: ${emotion.date}-${emotion.hour}`);
          await this.prisma.emotionRecord.update({
            where: { id: existingEmotion.id },
            data: {
              emotionType: emotion.emotionType,
              notes: emotion.notes,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 감정 기록 생성: ${emotion.date}-${emotion.hour}`);
          await this.prisma.emotionRecord.create({
            data: {
              userId: userDbId,
              date: emotion.date,
              hour: emotion.hour,
              emotionType: emotion.emotionType,
              notes: emotion.notes,
              createdAt: emotion.createdAt ? new Date(emotion.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`감정 기록 동기화 오류 (${emotion.date}-${emotion.hour}):`, error.message);
        console.error(`감정 기록 동기화 오류 (${emotion.date}-${emotion.hour}):`, error);
      }
    }
    this.logger.log(`감정 기록 동기화 처리 완료: ${count}/${emotions.length}개 성공`);
    return count;
  }

  private async syncLocationLogs(userDbId: string, locations: any[]) {
    this.logger.log(`위치 로그 동기화 처리 시작: ${locations.length}개`);
    let count = 0;
    for (const location of locations) {
      try {
        // 사용자와 타임스탬프로 중복 확인
        const existingLocation = await this.prisma.locationLog.findFirst({
          where: {
            userId: userDbId,
            timestamp: location.timestamp
          }
        });

        if (existingLocation) {
          this.logger.debug(`기존 위치 로그 업데이트: ${location.timestamp}`);
          await this.prisma.locationLog.update({
            where: { id: existingLocation.id },
            data: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              address: location.address,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 위치 로그 생성: ${location.timestamp}`);
          await this.prisma.locationLog.create({
            data: {
              userId: userDbId,
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              address: location.address,
              timestamp: location.timestamp,
              createdAt: location.createdAt ? new Date(location.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`위치 로그 동기화 오류 (${location.timestamp}):`, error.message);
        console.error(`위치 로그 동기화 오류 (${location.timestamp}):`, error);
      }
    }
    this.logger.log(`위치 로그 동기화 처리 완료: ${count}/${locations.length}개 성공`);
    return count;
  }
  private async syncStepRecords(userDbId: string, steps: any[]) {
    this.logger.log(`걸음 수 동기화 처리 시작: ${steps.length}개`);
    let count = 0;
    for (const step of steps) {
      try {
        // stepCount가 없는 경우 기본값 설정 (필수 필드)
        if (step.stepCount === undefined || step.stepCount === null) {
          this.logger.warn(`stepCount가 없는 걸음 수 기록에 기본값 0 설정: ${step.date}`);
          step.stepCount = 0;
        }

        // 날짜와 사용자로 중복 확인
        const existingStep = await this.prisma.stepRecord.findFirst({
          where: {
            userId: userDbId,
            date: step.date
          }
        });

        if (existingStep) {
          this.logger.debug(`기존 걸음 수 기록 업데이트: ${step.date}`);
          await this.prisma.stepRecord.update({
            where: { id: existingStep.id },
            data: {
              stepCount: step.stepCount,
              distance: step.distance || 0,
              calories: step.calories || 0,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 걸음 수 기록 생성: ${step.date}`);
          await this.prisma.stepRecord.create({
            data: {
              userId: userDbId,
              date: step.date,
              stepCount: step.stepCount,
              distance: step.distance || 0,
              calories: step.calories || 0,
              createdAt: step.createdAt ? new Date(step.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`걸음 수 동기화 오류 (${step.date}):`, error.message);
        console.error(`걸음 수 동기화 오류 (${step.date}):`, error);
      }
    }
    this.logger.log(`걸음 수 동기화 처리 완료: ${count}/${steps.length}개 성공`);
    return count;
  }

  private async syncAiFeedbacks(userDbId: string, aiFeedbacks: any[]) {
    this.logger.log(`AI 피드백 동기화 처리 시작: ${aiFeedbacks.length}개`);
    let count = 0;
    for (const aiFeedback of aiFeedbacks) {
      try {
        // 날짜와 사용자로 중복 확인 (ID는 로컬 DB의 ID이므로 신뢰할 수 없음)
        const existingFeedback = await this.prisma.aiFeedback.findFirst({
          where: {
            userId: userDbId,
            date: aiFeedback.date
          }
        });

        if (existingFeedback) {
          this.logger.debug(`기존 AI 피드백 업데이트: ${aiFeedback.date}`);
          await this.prisma.aiFeedback.update({
            where: { id: existingFeedback.id },
            data: {
              feedbackText: aiFeedback.feedbackText,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 AI 피드백 생성: ${aiFeedback.date}`);
          await this.prisma.aiFeedback.create({
            data: {
              userId: userDbId,
              date: aiFeedback.date,
              feedbackText: aiFeedback.feedbackText,
              createdAt: aiFeedback.createdAt ? new Date(aiFeedback.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`AI 피드백 동기화 오류 (${aiFeedback.date}):`, error.message);
        console.error(`AI 피드백 동기화 오류 (${aiFeedback.date}):`, error);
      }
    }    this.logger.log(`AI 피드백 동기화 처리 완료: ${count}/${aiFeedbacks.length}개 성공`);
    return count;
  }

  private async syncPhotos(userDbId: string, photos: any[]) {
    this.logger.log(`사진 동기화 처리 시작: ${photos.length}개`);
    let count = 0;
    for (const photo of photos) {
      try {
        // 일기 ID와 경로로 중복 확인
        const existingPhoto = await this.prisma.photo.findFirst({
          where: {
            diaryId: photo.diaryId.toString(),
            url: photo.path
          }
        });

        if (existingPhoto) {
          this.logger.debug(`기존 사진 업데이트: ${photo.path}`);
          await this.prisma.photo.update({
            where: { id: existingPhoto.id },
            data: {
              url: photo.path,
              updatedAt: new Date(),
            }
          });
        } else {
          this.logger.debug(`새 사진 생성: ${photo.path}`);
          await this.prisma.photo.create({
            data: {
              diaryId: photo.diaryId.toString(),
              url: photo.path,
              userId: userDbId,
              createdAt: photo.createdAt ? new Date(photo.createdAt) : new Date(),
            }
          });
        }
        count++;
      } catch (error) {
        this.logger.error(`사진 동기화 오류 (${photo.path}):`, error.message);
        console.error(`사진 동기화 오류 (${photo.path}):`, error);
      }
    }
    this.logger.log(`사진 동기화 처리 완료: ${count}/${photos.length}개 성공`);
    return count;
  }

  async restoreAllData(userId: string) {
    this.logger.log(`데이터 복원 시작 - 사용자 ID: ${userId}`);
    
    try {
      // 사용자 확인
      const user = await this.prisma.user.findUnique({
        where: { userId: userId }
      });      if (!user) {
        this.logger.warn(`사용자를 찾을 수 없음: ${userId}`);
        return {
          success: false,
          message: '사용자를 찾을 수 없습니다.',
        };
      }
      
      this.logger.log(`사용자 확인됨: ${userId}, 내부 ID: ${user.id}`);
      
      // 데이터베이스에서 직접 일정 조회 확인
      const scheduleCount = await this.prisma.schedule.count({ where: { userId: user.id } });
      this.logger.log(`데이터베이스 일정 개수 확인: ${scheduleCount}개 (userId: ${user.id})`);
      
      // 모든 일정 조회 (디버깅용)
      const allSchedules = await this.prisma.schedule.findMany();
      this.logger.log(`전체 일정 개수: ${allSchedules.length}개`);
      allSchedules.forEach(s => {
        this.logger.debug(`전체 일정: ID=${s.id}, userId=${s.userId}, text=${s.text}`);
      });
        // 서버에서 모든 데이터 조회 (사진 테이블 제외 - 일기의 photoPaths 필드로 관리)
      const [diaries, checklists, schedules, appUsages, emotions, locations, steps, aiFeedbacks] = await Promise.all([
        this.prisma.diary.findMany({ where: { userId: user.id } }),
        this.prisma.checklist.findMany({ where: { userId: user.id } }),
        this.prisma.schedule.findMany({ where: { userId: user.id } }),
        this.prisma.appUsage.findMany({ where: { userId: user.id } }),
        this.prisma.emotionRecord.findMany({ where: { userId: user.id } }),
        this.prisma.locationLog.findMany({ where: { userId: user.id } }),
        this.prisma.stepRecord.findMany({ where: { userId: user.id } }),
        this.prisma.aiFeedback.findMany({ where: { userId: user.id } }),
      ]);
      
      this.logger.log(`데이터 조회 완료 - 일정: ${schedules.length}개, 일기: ${diaries.length}개, 체크리스트: ${checklists.length}개`);
      
      // 일정 데이터 상세 로깅
      schedules.forEach(schedule => {
        this.logger.debug(`조회된 일정: ID=${schedule.id}, text=${schedule.text}, selectedDate=${schedule.selectedDate}, dayOfWeek=${schedule.dayOfWeek}, isRoutine=${schedule.isRoutine}`);
      });const restoredData = {
        diaries: diaries.map(diary => ({
          id: diary.id.toString(),
          userId: userId,
          date: diary.date,
          title: diary.title || '',
          content: diary.content || '',
          photoPaths: diary.photoPaths || '',
          createdAt: diary.createdAt.toISOString(),
          updatedAt: diary.updatedAt.toISOString(),
        })),        checklists: checklists.map(item => ({
          id: item.id.toString(),
          userId: userId,
          text: item.text,
          subtext: item.subtext || '',
          isChecked: item.isChecked,
          dueDate: item.dueDate || null,
          completedDate: item.completedDate || null,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),schedules: schedules.map(item => ({
          id: item.id.toString(),
          userId: userId,
          text: item.text,
          subText: item.subText || '',
          dayOfWeek: item.dayOfWeek || null,
          selectedDate: item.selectedDate || null,
          isRoutine: item.isRoutine,
          startTimeHour: item.startTimeHour,
          startTimeMinute: item.startTimeMinute,
          endTimeHour: item.endTimeHour,
          endTimeMinute: item.endTimeMinute,
          colorValue: item.colorValue || 0,
          hasAlarm: item.hasAlarm || false,
          alarmOffset: item.alarmOffset || 0,
          // Flutter 호환성을 위한 추가 필드 매핑
          alarm_offset_in_minutes: item.alarmOffset || 0,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),        appUsages: appUsages.map(usage => ({
          id: usage.id.toString(),
          userId: userId,
          date: usage.date,
          appName: usage.appName,
          packageName: usage.packageName,
          usageTimeInMillis: this.safeBigIntToString(usage.usageTimeInMillis),
          // Flutter 호환성을 위한 추가 필드 매핑
          app_name: usage.appName,
          package_name: usage.packageName,
          usage_time: this.safeBigIntToString(usage.usageTimeInMillis),
          app_icon_path: usage.appIconPath || '',
          createdAt: usage.createdAt.toISOString(),
          updatedAt: usage.updatedAt.toISOString(),
        })),
        emotions: emotions.map(emotion => ({
          id: emotion.id.toString(),
          userId: userId,
          date: emotion.date,
          hour: emotion.hour,
          emotionType: emotion.emotionType,
          notes: emotion.notes || '',
          createdAt: emotion.createdAt.toISOString(),
          updatedAt: emotion.updatedAt.toISOString(),
        })),
        locations: locations.map(location => ({
          id: location.id.toString(),
          userId: userId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || 0,
          address: location.address || '',
          timestamp: location.timestamp,
          createdAt: location.createdAt.toISOString(),
          updatedAt: location.updatedAt.toISOString(),
        })),        steps: steps.map(step => ({
          id: step.id.toString(),
          userId: userId,
          date: step.date,
          stepCount: this.safeBigIntToString(step.stepCount),
          distance: this.safeBigIntToString(step.distance || 0),
          calories: this.safeBigIntToString(step.calories || 0),
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        })),
        aiFeedbacks: aiFeedbacks.map(feedback => ({
          id: feedback.id.toString(),
          userId: userId,
          date: feedback.date,
          feedbackText: feedback.feedbackText,
          createdAt: feedback.createdAt.toISOString(),
          updatedAt: feedback.updatedAt?.toISOString(),
        })),
        // 사진 데이터는 일기의 photoPaths 필드로 관리되므로 별도 반환하지 않음
        photos: [], // 빈 배열로 유지하여 클라이언트 호환성 보장
      };      const totalCount = Object.values(restoredData).reduce((total, items) => total + items.length, 0);
      
      this.logger.log(`데이터 복원 완료 - 사용자: ${userId}, 총 복원 항목: ${totalCount}개`);
      
      // BigInt 직렬화 문제를 방지하기 위해 안전하게 직렬화
      const safeRestoredData = this.serializeObject(restoredData);
      
      return {
        success: true,
        data: safeRestoredData,
        message: `서버에서 ${totalCount}개의 항목을 성공적으로 가져왔습니다.`,
        statistics: {
          diaries: restoredData.diaries.length,
          checklists: restoredData.checklists.length,
          schedules: restoredData.schedules.length,
          appUsages: restoredData.appUsages.length,
          emotions: restoredData.emotions.length,
          locations: restoredData.locations.length,
          steps: restoredData.steps.length,
          aiFeedbacks: restoredData.aiFeedbacks.length,
          photos: 0, // 사진은 일기의 photoPaths 필드로 관리됨
        }
      };
    } catch (error) {
      this.logger.error(`데이터 복원 실패 - 사용자: ${userId}, 오류: ${error.message}`, error.stack);
      return {
        success: false,
        message: '데이터 복원 중 오류가 발생했습니다.',
        error: error.message
      };
    }  }

  async downloadPhotoFile(userId: string, fileName: string): Promise<{ success: boolean; filePath?: string; fileBuffer?: Buffer; error?: string }> {
    this.logger.log(`사진 파일 다운로드 요청 - 사용자: ${userId}, 파일: ${fileName}`);
    
    try {
      // 사용자 확인
      const user = await this.prisma.user.findUnique({
        where: { userId: userId }
      });

      if (!user) {
        this.logger.warn(`사용자를 찾을 수 없음: ${userId}`);
        return {
          success: false,
          error: 'User not found'
        };
      }

      // 사용자가 이 파일에 접근 권한이 있는지 확인 (일기의 photoPaths에 포함되어 있는지)
      const diary = await this.prisma.diary.findFirst({
        where: {
          userId: user.id,
          photoPaths: {
            contains: fileName
          }
        }
      });

      if (!diary) {
        this.logger.warn(`해당 사용자의 일기에서 사진 파일을 찾을 수 없음: ${fileName}`);
        return {
          success: false,
          error: 'Photo not found in user diaries'
        };
      }

      // 파일 경로 구성
      const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
      const filePath = path.join(uploadsDir, fileName);

      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`물리적 파일이 존재하지 않음: ${filePath}`);
        return {
          success: false,
          error: 'Physical file not found'
        };
      }      // 파일을 버퍼로 읽기
      const fileBuffer = fs.readFileSync(filePath);
      
      this.logger.log(`사진 파일 다운로드 준비 완료: ${filePath}, 크기: ${fileBuffer.length} bytes`);
      return {
        success: true,
        filePath: filePath,
        fileBuffer: fileBuffer
      };

    } catch (error) {
      this.logger.error(`사진 파일 다운로드 실패 - 사용자: ${userId}, 파일: ${fileName}, 오류: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
