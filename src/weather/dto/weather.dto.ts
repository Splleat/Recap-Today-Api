import { ApiProperty } from '@nestjs/swagger';

export class WeatherDto {
    @ApiProperty({ description: '날짜' })
    date: string;
    
    @ApiProperty({ description: '시간' })
    time: string;

    @ApiProperty({ description: '온도' })
    temperature: string;

    @ApiProperty({ description: '하늘 상태' })
    sky: string;

    @ApiProperty({ description: '강수 확률' })
    precipitationProbability: string;

    @ApiProperty({ description: '하늘 상태 코드'})
    _skyCode: string;

    @ApiProperty({ description: '강수형태 코드'})
    _ptyCode: string;
}
