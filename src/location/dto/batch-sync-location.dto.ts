import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateLocationDto } from './create-location.dto';

export class BatchSyncLocationDto {
    @ApiProperty({ 
        description: '동기화할 위치 데이터 배열',
        type: [CreateLocationDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateLocationDto)
    locations: CreateLocationDto[];
}
