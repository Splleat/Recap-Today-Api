import { Controller, Post, Get, Query, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { SyncResponseLocationDto } from './dto/sync-response-location.dto';
import { BatchSyncLocationDto } from './dto/batch-sync-location.dto';

@ApiTags('위치 동기화 API')
@Controller('location')
export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    @Post('sync')
    @ApiOperation({ 
        summary: '위치 정보 동기화',
        description: '클라이언트에서 서버로 위치 데이터를 동기화합니다. 중복 데이터는 자동으로 제외됩니다.'
    })
    @ApiResponse({ status: 201, description: '동기화 성공', type: SyncResponseLocationDto })
    async syncLocation(@Body() body: CreateLocationDto): Promise<SyncResponseLocationDto> {
        const user = await this.locationService.findUserByUserId(body.userId);
        return this.locationService.syncLocation({
            ...body,
            userId: user.id
        });
    }

    @Post('sync/batch')
    @ApiOperation({ 
        summary: '위치 정보 배치 동기화',
        description: '여러 위치 데이터를 한번에 동기화합니다. 성능 최적화를 위해 사용됩니다.'
    })
    @ApiResponse({ status: 201, description: '배치 동기화 성공', type: [SyncResponseLocationDto] })
    async batchSyncLocations(@Body() body: BatchSyncLocationDto): Promise<SyncResponseLocationDto[]> {
        return this.locationService.batchSyncLocations(body);
    }

    @Get('sync/:userId')
    @ApiOperation({ 
        summary: '최신 위치 정보 조회',
        description: '서버에서 클라이언트로 최신 위치 데이터를 동기화합니다.'
    })
    @ApiQuery({ name: 'since', required: false, description: '이 시간 이후의 데이터만 조회 (ISO 8601 형식)' })
    @ApiQuery({ name: 'limit', required: false, description: '최대 조회 개수 (기본값: 100)' })
    @ApiResponse({ status: 200, description: '조회 성공', type: [SyncResponseLocationDto] })
    async getLocationForSync(
        @Param('userId') userId: string,
        @Query('since') since?: string,
        @Query('limit') limit?: string,
    ): Promise<SyncResponseLocationDto[]> {
        const user = await this.locationService.findUserByUserId(userId);
        const limitNum = limit ? parseInt(limit, 10) : 100;

        if (since) {
            const sinceDate = new Date(since);
            return this.locationService.getLocationsSince(user.id, sinceDate);
        }
        
        return this.locationService.getRecentLocationsByUser(user.id, limitNum);
    }
}
