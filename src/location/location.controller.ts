import { Controller, Post, Get, Query, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';

@ApiTags('위치 API')
@Controller('location')
export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    @Post()
    @ApiOperation({ summary: '위치 정보 생성' })
    async createLocation(@Body() body: CreateLocationDto) {
        const user = await this.locationService.findUserByUserId(body.userId);
        return this.locationService.createLocation({
            ...body,
            userId: user.id
        });
    }

    @Get(':userId')
    @ApiOperation({ summary: '위치 정보 조회' })
    @ApiQuery({ name: 'date', required: false })
    async getLocation(
        @Param('userId') userId: string,
        @Query('date') date?: string,
    ) {
        const user = await this.locationService.findUserByUserId(userId);
        if (date) {
            return this.locationService.getLogsByUserAndDate(user.id, date);
        }
        return this.locationService.getLogsByUser(user.id);
    }
}
