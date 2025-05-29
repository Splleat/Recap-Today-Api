import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from '../prisma.service'; // PrismaService import 추가

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService, // PrismaService 주입
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
      throw new BadRequestException('User already exists');
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

  async logout(token: string): Promise<{ message: string }> {
    try {
      const decodedToken = this.jwtService.decode(token) as { exp: number; [key: string]: any };
      if (decodedToken && decodedToken.exp) {
        const expiresAt = new Date(decodedToken.exp * 1000);
        if (expiresAt > new Date()) {
          await this.prisma.blacklistedToken.create({
            data: {
              token,
              expiresAt,
            },
          });
          console.log(`Token added to DB blacklist: ${token.substring(0, 10)}... Expires at: ${expiresAt.toISOString()}`);
        } else {
          console.log('Token already expired, not adding to DB blacklist.');
        }
      } else {
        // 만료 시간이 없는 토큰 처리 (예: 즉시 만료로 간주하고 짧은 시간 후 삭제되도록 저장)
        const fallbackExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료
        await this.prisma.blacklistedToken.create({
          data: {
            token,
            expiresAt: fallbackExpiresAt,
          },
        });
        console.warn(
          `Token added to DB blacklist without a valid expiration time or could not be decoded. Set to expire at: ${fallbackExpiresAt.toISOString()}`,
        );
      }
    } catch (error) {
      console.error('Error processing token during logout:', error);
      // 디코딩 실패 시에도 블랙리스트에 추가 (짧은 만료 시간으로)
      const fallbackExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료
      try {
        await this.prisma.blacklistedToken.create({
          data: {
            token,
            expiresAt: fallbackExpiresAt,
          },
        });
        console.warn(
          `Token added to DB blacklist due to decoding error. Set to expire at: ${fallbackExpiresAt.toISOString()}`,
        );
      } catch (dbError) {
        console.error('Error adding token to DB blacklist after decoding error:', dbError);
        // DB 저장 실패 시 최종 에러 처리 (예: 로깅만)
      }
    }
    return { message: 'Logout successful from server, token blacklisted in DB' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.prisma.blacklistedToken.findUnique({
      where: { token },
    });
    if (blacklisted) {
      if (blacklisted.expiresAt < new Date()) {
        // 만료된 토큰은 DB에서 삭제 (선택적: 주기적인 스케줄러로 처리하는 것이 더 효율적일 수 있음)
        await this.prisma.blacklistedToken.delete({ where: { token } });
        return false;
      }
      return true;
    }
    return false;
  }

  // 주기적으로 만료된 토큰을 정리하는 메소드 (예: Cron Job으로 실행)
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    console.log(`Cleaned up ${result.count} expired tokens from DB blacklist.`);
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.user({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
