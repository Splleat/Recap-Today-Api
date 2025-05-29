import { IsString, Length, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  newPassword?: string;
}
