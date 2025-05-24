import { IsString, IsNumber, IsISO8601 } from 'class-validator';

export class CreateLocationDto {
    @IsString()
    userId: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsISO8601()
    timestamp: string;
}
