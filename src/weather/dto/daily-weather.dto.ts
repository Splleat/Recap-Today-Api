import { ApiProperty } from '@nestjs/swagger';
import { SimpleWeatherDto } from './simple-weather.dto';

/**
 * 24시간 날씨 정보 DTO
 * 하루(24시간)의 시간별 날씨 정보를 담고 있습니다.
 */
export class DailyWeatherDto {
    @ApiProperty({ description: '날짜', example: '20250521' })
    date: string;

    @ApiProperty({ 
        description: '24시간 시간별 날씨 정보',
        type: [SimpleWeatherDto],
        example: [
            {
                temperature: '26',
                precipitation: '0',
                weatherState: '맑음',
                date: '20250521',
                time: '1400'
            },
            {
                temperature: '25',
                precipitation: '0',
                weatherState: '맑음',
                date: '20250521',
                time: '1500'
            },
            // ... 24시간 데이터
        ]
    })
    hourlyWeather: SimpleWeatherDto[];
}