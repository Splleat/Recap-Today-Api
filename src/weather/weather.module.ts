import { Module } from '@nestjs/common'; // NestJS 모듈을 정의하기 위한 Module 데코레이터
import { HttpModule } from '@nestjs/axios';   // 외부 HTTP 요청을 보내기 위한 HttpModule
import { ConfigModule } from '@nestjs/config'; // 환경 변수 및 설정을 관리하기 위한 ConfigModule
import { WeatherService } from './weather.service'; // 날씨 관련 비즈니스 로직을 담당하는 서비스
import { WeatherController } from './weather.controller'; // 날씨 API 엔드포인트를 정의하는 컨트롤러

// 2. @Module() 데코레이터: 클래스를 NestJS 모듈로 정의
@Module({
  // 3. imports 배열: 이 모듈에서 사용할 다른 모듈들을 가져옴
  imports: [
    HttpModule.register({
      timeout: 10000, // 10초 타임아웃 설정
      maxRedirects: 5, // 최대 리다이렉트 횟수
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }),
    // AppModule에서 이미 ConfigModule.forRoot가 global로 설정되어 있으므로 
    // 여기서는 명시적 의존성 파악을 위해 포함
    ConfigModule,
  ],

  // 4. providers 배열: 이 모듈의 내부에서 사용될 서비스(Provider)들을 등록
  // NestJS의 DI(Dependency Injection) 시스템이 관리하며, 컨트롤러 등에서 주입받아 사용 가능
  providers: [WeatherService],

  // 5. controllers 배열: 이 모듈에서 사용할 컨트롤러들을 등록
  // HTTP 요청을 라우팅하고 처리하는 역할
  controllers: [WeatherController],

  // 6. exports 배열: 이 모듈에서 제공하는 Provider(주로 서비스) 중 외부 다른 모듈에서도 사용하도록 공개할 것들을 지정
  // 예를 들어, 다른 모듈(AuthModule, UsersModule 등)에서 WeatherService를 사용하고 싶다면 여기에 WeatherService를 포함해야 함
  exports: [WeatherService],
})
// 7. WeatherModule 클래스 선언 및 내보내기
export class WeatherModule {}