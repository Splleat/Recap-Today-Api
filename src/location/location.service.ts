import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { SyncResponseLocationDto } from './dto/sync-response-location.dto';
import { BatchSyncLocationDto } from './dto/batch-sync-location.dto';

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);
    
    constructor(private readonly prisma: PrismaService) {}

    async findUserByUserId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            this.logger.warn(`사용자 ID 찾을 수 없음: ${userId}`);
            throw new NotFoundException(`userId가 ${userId}인 사용자가 존재하지 않습니다.`);
        }

        return user;
    }

    // 동기화용 단순 저장 (중복 체크 포함)
    async syncLocation(dto: CreateLocationDto): Promise<SyncResponseLocationDto> {
        try {
            // 이미 존재하는 위치 로그인지 확인 (중복 방지)
            const existingLog = await this.prisma.locationLog.findFirst({
                where: {
                    userId: dto.userId,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    timestamp: new Date(dto.timestamp),
                },
            });

            if (existingLog) {
                this.logger.debug(`위치 데이터 중복 - 기존 데이터 반환: ${existingLog.id}`);
                return this.formatLocationResponse(existingLog);
            }

            // 새로운 위치 로그 생성
            const newLog = await this.prisma.locationLog.create({
                data: {
                    userId: dto.userId,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    timestamp: new Date(dto.timestamp),
                },
            });

            this.logger.debug(`위치 데이터 동기화 완료: ${newLog.id}`);
            return this.formatLocationResponse(newLog);
        } catch (error) {
            this.logger.error(`위치 데이터 동기화 실패: ${error.message}`);
            throw error;
        }
    }

    // 동기화용 조회 (최소한의 데이터만)
    async getRecentLocationsByUser(userId: string, limit: number = 100): Promise<SyncResponseLocationDto[]> {
        try {
            const locations = await this.prisma.locationLog.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: limit,
            });

            this.logger.debug(`사용자 최신 위치 조회: ${locations.length}개`);
            return locations.map(this.formatLocationResponse);
        } catch (error) {
            this.logger.error(`위치 조회 실패: ${error.message}`);
            throw error;
        }
    }

    // 특정 날짜 이후의 위치 로그 조회 (동기화용)
    async getLocationsSince(userId: string, since: Date): Promise<SyncResponseLocationDto[]> {
        try {
            const locations = await this.prisma.locationLog.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: since,
                    },
                },
                orderBy: { timestamp: 'asc' },
            });

            this.logger.debug(`${since} 이후 위치 조회: ${locations.length}개`);
            return locations.map(this.formatLocationResponse);
        } catch (error) {
            this.logger.error(`날짜별 위치 조회 실패: ${error.message}`);
            throw error;
        }
    }

    // 배치 동기화 (여러 위치 데이터 한번에 처리)
    async batchSyncLocations(dto: BatchSyncLocationDto): Promise<SyncResponseLocationDto[]> {
        try {
            const results: SyncResponseLocationDto[] = [];
            
            for (const locationDto of dto.locations) {
                const result = await this.syncLocation(locationDto);
                results.push(result);
            }

            this.logger.debug(`배치 동기화 완료: ${results.length}개`);
            return results;
        } catch (error) {
            this.logger.error(`배치 동기화 실패: ${error.message}`);
            throw error;
        }
    }

    // 응답 포맷 통일
    private formatLocationResponse(location: any): SyncResponseLocationDto {
        return {
            id: location.id,
            userId: location.userId,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp.toISOString(),
        };
    }
}