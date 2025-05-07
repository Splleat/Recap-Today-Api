import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(userId: string, password: string) {
    const user = await this.usersService.user({ userId });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.password !== password) {
      throw new Error('Invalid password');
    }
    const payload = { sub: user.id, username: user.userId };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async signUp(userId: string, password: string, name: string) {
    const existingUser = await this.usersService.user({ userId });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const user = await this.usersService.create({
      userId,
      password,
      name,
    });
    const payload = { sub: user.id, username: user.userId };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
