import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationService {
    constructor(private readonly prisma: PrismaService) {}

    async findUserByUserId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new NotFoundException(`userId가 ${userId}인 사용자가 존재하지 않습니다.`);
        }

        return user;
    }

    async createLocation(dto: CreateLocationDto) {
        return this.prisma.locationLog.create({
            data: {
                userId: dto.userId,
                latitude: dto.latitude,
                longitude: dto.longitude,
                timestamp: new Date(dto.timestamp),
            },
        });
    }

    async getLogsByUser(userId: string) {
        return this.prisma.locationLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'asc' },
        });
    }

    async getLogsByUserAndDate(userId: string, date: string) {
        const start = new Date(`${date}T00:00:00`);
        const end = new Date(`${date}T23:59:59`);

        return this.prisma.locationLog.findMany({
            where: {
                userId,
                timestamp: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { timestamp: 'asc' },
        })
    }
}