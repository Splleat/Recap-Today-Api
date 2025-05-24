import { ApiProperty } from '@nestjs/swagger';
import { WeatherDto } from './weather.dto';

export class FullWeatherDto {
    @ApiProperty({ description: '날짜' })
    date: string;

    @ApiProperty({ description: '날씨 정보' })
    weather: WeatherDto[];
}