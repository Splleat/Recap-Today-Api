import { ApiProperty } from '@nestjs/swagger';

/**
 * 간소화된 날씨 정보 DTO
 * 일정 관리 앱을 위한 최소한의 날씨 정보만 포함합니다.
 */
export class SimpleWeatherDto {
    @ApiProperty({ description: '기온 (℃)', example: '26' })
    temperature: string;

    @ApiProperty({ description: '1시간 강수량 (mm)', example: '0' })
    precipitation: string;

    @ApiProperty({ 
    description: '날씨 상태', 
    example: '맑음', 
    enum: ['맑음', '구름많음', '흐림', '비', '비/눈', '눈', '소나기'] 
    })
    weatherState: string;

    @ApiProperty({ description: '예보 일자', example: '20250507' })
    date: string;

    @ApiProperty({ description: '예보 시각', example: '1400' })
    time: string;
} 