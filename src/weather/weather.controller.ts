import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { FullWeatherDto } from './dto/full-weather.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('날씨 API')
@Controller('weather')
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) {}

    @Get('full')
    @ApiOperation({ summary: '24시간 예보가 완전한 날짜만 반환하는 날씨 데이터' })
    @ApiQuery({ name: 'nx', description: '격자 X 좌표', example: '60' })
    @ApiQuery({ name: 'ny', description: '격자 Y 좌표', example: '127' })
    @ApiResponse({ status: 200, description: '성공', type: [FullWeatherDto] })
    async getFullWeather(
        @Query('nx') nx: string,
        @Query('ny') ny: string,
    ): Promise<FullWeatherDto[]> {
        if (!nx || !ny) {
            throw new HttpException('nx, ny는 필수 파라미터입니다.', HttpStatus.BAD_REQUEST);
        }

        return this.weatherService.getFullWeather(nx, ny);
    }

    @Get('full/geo')
    @ApiOperation({ summary: '위도/경도 기반으로 24시간 예보가 완전한 날짜만 반환' })
    @ApiQuery({ name: 'lat', description: '위도', example: '37.5665' })
    @ApiQuery({ name: 'lon', description: '경도', example: '126.9780' })
    @ApiResponse({ status: 200, description: '성공', type: [FullWeatherDto] })
    async getFullWeatherByGeo(
        @Query('lat') lat: string,
        @Query('lon') lon: string,
    ): Promise<FullWeatherDto[]> {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (isNaN(latNum) || isNaN(lonNum)) {
            throw new HttpException('lat, lon은 숫자여야 합니다.', HttpStatus.BAD_REQUEST);
        }

        const { nx, ny } = this.weatherService['convertGeoToGrid'](latNum, lonNum);
        return this.weatherService.getFullWeather(nx.toString(), ny.toString());
    }

}
