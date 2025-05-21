import { ApiProperty } from '@nestjs/swagger';

/**
 * 기상청 API 응답의 날씨 항목 DTO
 */
export class WeatherItemDto {
  @ApiProperty({ description: '자료 구분 코드', example: 'TMP' })
  category: string;

  @ApiProperty({ description: '예보 일자', example: '20250507' })
  fcstDate: string;

  @ApiProperty({ description: '예보 시각', example: '1400' })
  fcstTime: string;

  @ApiProperty({ description: '예보 값', example: '22.3' })
  fcstValue: string;

  @ApiProperty({ description: '발표 일자', example: '20250507' })
  baseDate: string;

  @ApiProperty({ description: '발표 시각', example: '1100' })
  baseTime: string;

  @ApiProperty({ description: 'X 좌표', example: '60' })
  nx: number;

  @ApiProperty({ description: 'Y 좌표', example: '127' })
  ny: number;
}

/**
 * 가공된 날씨 응답 DTO
 */
export class WeatherResponseDto {
  @ApiProperty({ description: '발표 일자', example: '20250507' })
  baseDate: string;

  @ApiProperty({ description: '발표 시각', example: '1100' })
  baseTime: string;

  @ApiProperty({ description: '예보 일자', example: '20250507' })
  fcstDate: string;

  @ApiProperty({ description: '예보 시각', example: '1400' })
  fcstTime: string;

  @ApiProperty({ description: '기온 (℃)', example: '22.3' })
  temperature: string;

  @ApiProperty({ description: '하늘 상태 코드', example: '1', enum: ['1', '3', '4'] })
  skyCode: string;

  @ApiProperty({ description: '하늘 상태', example: '맑음', enum: ['맑음', '구름많음', '흐림'] })
  skyState: string;

  @ApiProperty({ description: '강수 형태 코드', example: '0', enum: ['0', '1', '2', '3', '4'] })
  ptyCode: string;

  @ApiProperty({ description: '강수 형태', example: '없음', enum: ['없음', '비', '비/눈', '눈', '소나기'] })
  ptyState: string;

  @ApiProperty({ description: '강수 확률 (%)', example: '30' })
  probabilityOfPrecipitation: string;

  @ApiProperty({ description: '습도 (%)', example: '70' })
  humidity: string;

  @ApiProperty({ description: '풍속 (m/s)', example: '2.4' })
  windSpeed: string;

  @ApiProperty({ description: '1시간 강수량 (mm)', example: '0' })
  precipitation: string;

  @ApiProperty({ description: 'X 좌표', example: '60' })
  nx: number;

  @ApiProperty({ description: 'Y 좌표', example: '127' })
  ny: number;
}

/**
 * 요청 응답 래퍼 DTO
 */
export class WeatherResponseWrapperDto {
  @ApiProperty({ description: '응답 코드', example: '00' })
  resultCode: string;

  @ApiProperty({ description: '응답 메시지', example: 'NORMAL_SERVICE' })
  resultMsg: string;

  @ApiProperty({ type: [WeatherResponseDto] })
  items: WeatherResponseDto[];
} 