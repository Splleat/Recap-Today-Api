import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: any,
  ): Promise<any> {
    this.logger.log(`사용자 조회 시작 - 조건: ${JSON.stringify(userWhereUniqueInput)}`);
    try {
      const result = await this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });
      this.logger.log(`사용자 조회 완료 - 결과: ${result ? '찾음' : '없음'}`);
      return result;
    } catch (error) {
      this.logger.error(`사용자 조회 실패 - 조건: ${JSON.stringify(userWhereUniqueInput)}`, error.stack);
      throw error;
    }
  }

  async create(data: any): Promise<any> {
    this.logger.log(`사용자 생성 시작 - 사용자ID: ${data.userId}`);
    try {
      const result = await this.prisma.user.create({ data });
      this.logger.log(`사용자 생성 완료 - ID: ${result.id}, 사용자ID: ${result.userId}`);
      return result;
    } catch (error) {
      this.logger.error(`사용자 생성 실패 - 사용자ID: ${data.userId}`, error.stack);
      throw error;
    }
  }

  async update(params: {
    where: any;
    data: any;
  }): Promise<any> {
    this.logger.log(`사용자 업데이트 시작 - 조건: ${JSON.stringify(params.where)}`);
    try {
      const { where, data } = params;
      const result = await this.prisma.user.update({
        where,
        data,
      });
      this.logger.log(`사용자 업데이트 완료 - ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`사용자 업데이트 실패 - 조건: ${JSON.stringify(params.where)}`, error.stack);
      throw error;
    }
  }
}
