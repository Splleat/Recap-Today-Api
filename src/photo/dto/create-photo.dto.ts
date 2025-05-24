import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePhotoDto {
    @IsString()
    diaryId: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}
