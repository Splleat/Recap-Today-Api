import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.userId, signInDto.password);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(
      signUpDto.userId,
      signUpDto.password,
      signUpDto.name,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body('token') token: string) {
    return this.authService.logout(token);
  }

  @UseGuards(AuthGuard)
  @Get('validate')
  validateToken() {
    return { message: 'Token is valid' };
  }
}
