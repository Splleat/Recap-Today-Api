import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BackupData } from './backup.controller';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  
  constructor(private readonly prisma: PrismaService) {}
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
  }  async clearAllData(userId: string) {
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
      try {
        // Flutter의 알람 오프셋 필드명 매핑 (alarm_offset_in_minutes -> alarmOffset)
        const alarmOffset = schedule.alarmOffset || schedule.alarm_offset_in_minutes || schedule.alarmOffsetInMinutes;
        
        // 스케줄 ID로 중복 확인 후 upsert
        const existingSchedule = await this.prisma.schedule.findFirst({
          where: {
            userId: userDbId,
            text: schedule.text,
            selectedDate: schedule.selectedDate || null,
            dayOfWeek: schedule.dayOfWeek || null
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
          this.logger.debug(`새 일정 생성: ${schedule.text}`);
          await this.prisma.schedule.create({
            data: {
              userId: userDbId,
              text: schedule.text,
              subText: schedule.subText,
              dayOfWeek: schedule.dayOfWeek,
              selectedDate: schedule.selectedDate ? schedule.selectedDate : null,
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
      });

      if (!user) {
        this.logger.warn(`사용자를 찾을 수 없음: ${userId}`);
        return {
          success: false,
          message: '사용자를 찾을 수 없습니다.',
        };
      }      this.logger.log(`사용자 확인됨: ${userId}`);      
      
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
      ]);const restoredData = {
        diaries: diaries.map(diary => ({
          id: diary.id.toString(),
          userId: userId,
          date: diary.date,
          title: diary.title || '',
          content: diary.content || '',
          photoPaths: diary.photoPaths || '',
          createdAt: diary.createdAt.toISOString(),
          updatedAt: diary.updatedAt.toISOString(),
        })),
        checklists: checklists.map(item => ({
          id: item.id.toString(),
          userId: userId,
          text: item.text,
          subtext: item.subtext || '',
          isChecked: item.isChecked,
          dueDate: item.dueDate || '',
          completedDate: item.completedDate || '',
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),        schedules: schedules.map(item => ({
          id: item.id.toString(),
          userId: userId,
          text: item.text,
          subText: item.subText || '',
          dayOfWeek: item.dayOfWeek || 0,
          selectedDate: item.selectedDate || '',
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
          usageTimeInMillis: usage.usageTimeInMillis.toString(),
          // Flutter 호환성을 위한 추가 필드 매핑
          app_name: usage.appName,
          package_name: usage.packageName,
          usage_time: usage.usageTimeInMillis.toString(),
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
        })),
        steps: steps.map(step => ({
          id: step.id.toString(),
          userId: userId,
          date: step.date,
          stepCount: step.stepCount,
          distance: step.distance || 0,
          calories: step.calories || 0,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),        })),        
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
      };

      const totalCount = Object.values(restoredData).reduce((total, items) => total + items.length, 0);
      
      this.logger.log(`데이터 복원 완료 - 사용자: ${userId}, 총 복원 항목: ${totalCount}개`);
      
      return {
        success: true,
        data: restoredData,
        message: `서버에서 ${totalCount}개의 항목을 성공적으로 가져왔습니다.`,        statistics: {
          diaries: restoredData.diaries.length,
          checklists: restoredData.checklists.length,
          schedules: restoredData.schedules.length,
          appUsages: restoredData.appUsages.length,
          emotions: restoredData.emotions.length,
          locations: restoredData.locations.length,          steps: restoredData.steps.length,
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
    }
  }
}
