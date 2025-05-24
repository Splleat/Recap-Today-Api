import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';
import { LocationModule } from './location/location.module';
import { ChecklistModule } from './checklist/checklist.module';
import { AppUsageModule } from './appusage/appusage.module';
import { PhotoModule } from './photo/photo.module';
import { DiaryModule } from './diary/diary.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    AuthModule,
    UsersModule,
    WeatherModule,
    LocationModule,
    ChecklistModule,
    ScheduleModule,
    AppUsageModule,
    PhotoModule,
    DiaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

