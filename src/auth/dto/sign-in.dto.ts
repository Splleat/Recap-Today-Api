import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SignInDto {
  @IsString()
  @Length(3, 20)
  userId: string;

  @IsString()
  @Length(6, 20)
  password: string;
}
