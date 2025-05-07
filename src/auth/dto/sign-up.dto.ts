import { IsString, Length } from 'class-validator';

export class SignUpDto {
  @IsString()
  @Length(3, 20)
  userId: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsString()
  @Length(3, 50)
  name: string;
}
