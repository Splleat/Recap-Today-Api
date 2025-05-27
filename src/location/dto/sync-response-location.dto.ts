import { ApiProperty } from '@nestjs/swagger';

export class SyncResponseLocationDto {
    @ApiProperty({ 
        description: '위치 로그 ID',
        example: 'clj1k2l3m4n5o6p7q8r9s0t1'
    })
    id: string;

    @ApiProperty({ 
        description: '사용자 ID',
        example: 'user123'
    })
    userId: string;

    @ApiProperty({ 
        description: '위도',
        example: 37.5665
    })
    latitude: number;

    @ApiProperty({ 
        description: '경도',
        example: 126.9780
    })
    longitude: number;

    @ApiProperty({ 
        description: '기록 시간 (ISO 8601 형식)',
        example: '2024-01-15T09:30:00.000Z'
    })
    timestamp: string;
}
