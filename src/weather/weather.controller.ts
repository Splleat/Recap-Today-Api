import { Controller, Get, Query, HttpException, HttpStatus, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WeatherResponseWrapperDto } from './dto/weather-response.dto';
import { SimpleWeatherDto } from './dto/simple-weather.dto';

// 테스트 케이스 정의
const testCases = [
  {
    description: '서울 현재 날씨',
    date: new Date().toISOString().substring(0, 10).replace(/-/g, ''), // 오늘 날짜
    time: '1400',
    nx: 60, 
    ny: 127
  },
  {
    description: '부산 현재 날씨',
    date: new Date().toISOString().substring(0, 10).replace(/-/g, ''), // 오늘 날짜
    time: '1400',
    nx: 98, 
    ny: 76
  }
];

@ApiTags('날씨 API')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * 날씨 API 테스트
   */
  @ApiOperation({ summary: '날씨 API 테스트' })
  @Get('test')
  async testWeatherApi(): Promise<any> {
    // 결과 모으기
    const results: Array<{
      testCase: string;
      status: string;
      data?: any;
      error?: string;
      details?: any;
    }> = [];
    
    for (const test of testCases) {
      try {
        const result = await this.weatherService.getWeatherData(
          test.date, 
          test.time, 
          test.nx, 
          test.ny
        );
        results.push({
          testCase: test.description,
          status: 'success',
          data: result
        });
      } catch (error) {
        results.push({
          testCase: test.description,
          status: 'error',
          error: error.message,
          details: error.response || {}
        });
      }
    }
    
    return {
      message: '날씨 API 테스트 결과',
      testDate: new Date().toISOString(),
      results
    };
  }

  /**
   * 기상청 단기예보 조회
   */
  @ApiOperation({ summary: '기상청 단기예보 조회' })
  @ApiQuery({ name: 'date', description: '조회 날짜 (YYYYMMDD)', example: '20250507' })
  @ApiQuery({ name: 'time', description: '조회 시간 (HHMM)', example: '1400' })
  @ApiQuery({ name: 'nx', description: '격자 X 좌표', example: '60' })
  @ApiQuery({ name: 'ny', description: '격자 Y 좌표', example: '127' })
  @ApiResponse({ 
    status: 200, 
    description: '날씨 정보 조회 성공',
    type: WeatherResponseWrapperDto
  })
  @Get()
  async getForecast(
    @Query('date') date: string, // 예: 20250507
    @Query('time') time: string, // 예: 1400
    @Query('nx') nx: string,     // 예: 60
    @Query('ny') ny: string,     // 예: 127
  ): Promise<WeatherResponseWrapperDto> {
    if (!date || !time || !nx || !ny) {
      throw new HttpException('date, time, nx, ny 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }
    
    const { nxNum, nyNum } = this.validateCoordinates(nx, ny);
    
    return this.weatherService.getWeatherData(date, time, nxNum, nyNum);
  }

  /**
   * 현재 시간 기준 날씨 정보 조회
   */
  @ApiOperation({ summary: '현재 시간 기준 날씨 정보 조회' })
  @ApiQuery({ name: 'nx', description: '격자 X 좌표', example: '60' })
  @ApiQuery({ name: 'ny', description: '격자 Y 좌표', example: '127' })
  @ApiResponse({ 
    status: 200, 
    description: '현재 날씨 정보 조회 성공',
    type: WeatherResponseWrapperDto
  })
  @Get('current')
  async getCurrentWeather(
    @Query('nx') nx: string,
    @Query('ny') ny: string,
  ): Promise<WeatherResponseWrapperDto> {
    if (!nx || !ny) {
      throw new HttpException('nx, ny 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }

    const { nxNum, nyNum } = this.validateCoordinates(nx, ny);
    
    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    return this.weatherService.getWeatherData(date, baseTime, nxNum, nyNum);
  }

  /**
   * 위도/경도 기반 날씨 정보 조회
   */
  @ApiOperation({ summary: '위도/경도 기반 날씨 정보 조회' })
  @ApiQuery({ name: 'lat', description: '위도', example: '37.5665' })
  @ApiQuery({ name: 'lon', description: '경도', example: '126.9780' })
  @ApiResponse({ 
    status: 200, 
    description: '위도/경도 기반 날씨 정보 조회 성공',
    type: WeatherResponseWrapperDto
  })
  @Get('geo')
  async getWeatherByGeo(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<WeatherResponseWrapperDto> {
    if (!lat || !lon) {
      throw new HttpException('lat, lon 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }

    const { latNum, lonNum } = this.validateGeoCoordinates(lat, lon);
    
    // 위도/경도를 기상청 격자 좌표(nx, ny)로 변환
    const { nx, ny } = this.convertGeoToGrid(latNum, lonNum);

    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    return this.weatherService.getWeatherData(date, baseTime, nx, ny);
  }

  /**
   * 특정 지역 코드로 날씨 정보 조회
   */
  @ApiOperation({ summary: '특정 지역 코드로 날씨 정보 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '지역 코드 기반 날씨 정보 조회 성공',
    type: WeatherResponseWrapperDto
  })
  @Get('region/:code')
  async getWeatherByRegionCode(@Param('code') code: string): Promise<WeatherResponseWrapperDto> {
    // 지역 코드에 해당하는 nx, ny 좌표를 미리 정의된 매핑에서 가져옴
    const regionCoordinates = this.getRegionCoordinates(code);
    if (!regionCoordinates) {
      throw new HttpException('유효하지 않은 지역 코드입니다.', HttpStatus.BAD_REQUEST);
    }

    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    return this.weatherService.getWeatherData(date, baseTime, regionCoordinates.nx, regionCoordinates.ny);
  }

  /**
   * 간소화된 날씨 정보 조회
   */
  @ApiOperation({ summary: '간소화된 날씨 정보 조회 (온도, 강수량, 날씨 상태만)' })
  @ApiQuery({ name: 'date', description: '조회 날짜 (YYYYMMDD)', example: '20250507' })
  @ApiQuery({ name: 'time', description: '조회 시간 (HHMM)', example: '1400' })
  @ApiQuery({ name: 'nx', description: '격자 X 좌표', example: '60' })
  @ApiQuery({ name: 'ny', description: '격자 Y 좌표', example: '127' })
  @ApiResponse({ 
    status: 200, 
    description: '간소화된 날씨 정보 조회 성공',
    type: SimpleWeatherDto
  })
  @Get('simple')
  async getSimpleWeather(
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('nx') nx: string,
    @Query('ny') ny: string,
  ): Promise<SimpleWeatherDto> {
    if (!date || !time || !nx || !ny) {
      throw new HttpException('date, time, nx, ny 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }
    
    const { nxNum, nyNum } = this.validateCoordinates(nx, ny);

    // 기존 API 호출하여 데이터 가져오기
    const response = await this.weatherService.getWeatherData(date, time, nxNum, nyNum);
    
    // 간소화된 날씨 정보로 변환
    return this.convertToSimpleWeather(response);
  }

  /**
   * 위도/경도 기반 간소화된 날씨 정보 조회
   */
  @ApiOperation({ summary: '위도/경도 기반 간소화된 날씨 정보 조회' })
  @ApiQuery({ name: 'lat', description: '위도', example: '37.5665' })
  @ApiQuery({ name: 'lon', description: '경도', example: '126.9780' })
  @ApiResponse({ 
    status: 200, 
    description: '간소화된 날씨 정보 조회 성공',
    type: SimpleWeatherDto
  })
  @Get('simple/geo')
  async getSimpleWeatherByGeo(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<SimpleWeatherDto> {
    if (!lat || !lon) {
      throw new HttpException('lat, lon 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }

    const { latNum, lonNum } = this.validateGeoCoordinates(lat, lon);
    
    // 위도/경도를 기상청 격자 좌표(nx, ny)로 변환
    const { nx, ny } = this.convertGeoToGrid(latNum, lonNum);

    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    const response = await this.weatherService.getWeatherData(date, baseTime, nx, ny);
    
    // 간소화된 날씨 정보로 변환
    return this.convertToSimpleWeather(response);
  }

  /**
   * 현재 시간 기준 간소화된 날씨 정보 조회
   */
  @ApiOperation({ summary: '현재 시간 기준 간소화된 날씨 정보 조회' })
  @ApiQuery({ name: 'nx', description: '격자 X 좌표', example: '60' })
  @ApiQuery({ name: 'ny', description: '격자 Y 좌표', example: '127' })
  @ApiResponse({ 
    status: 200, 
    description: '간소화된 현재 날씨 정보 조회 성공',
    type: SimpleWeatherDto
  })
  @Get('simple/current')
  async getSimpleCurrentWeather(
    @Query('nx') nx: string,
    @Query('ny') ny: string,
  ): Promise<SimpleWeatherDto> {
    if (!nx || !ny) {
      throw new HttpException('nx, ny 쿼리 파라미터가 모두 필요합니다.', HttpStatus.BAD_REQUEST);
    }

    const { nxNum, nyNum } = this.validateCoordinates(nx, ny);
    
    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    const response = await this.weatherService.getWeatherData(date, baseTime, nxNum, nyNum);
    
    // 간소화된 날씨 정보로 변환
    return this.convertToSimpleWeather(response);
  }

  /**
   * 지역 코드 기반 간소화된 날씨 정보 조회
   */
  @ApiOperation({ summary: '지역 코드 기반 간소화된 날씨 정보 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '간소화된 지역 날씨 정보 조회 성공',
    type: SimpleWeatherDto
  })
  @Get('simple/region/:code')
  async getSimpleWeatherByRegionCode(@Param('code') code: string): Promise<SimpleWeatherDto> {
    // 지역 코드에 해당하는 nx, ny 좌표를 미리 정의된 매핑에서 가져옴
    const regionCoordinates = this.getRegionCoordinates(code);
    if (!regionCoordinates) {
      throw new HttpException('유효하지 않은 지역 코드입니다.', HttpStatus.BAD_REQUEST);
    }

    // 현재 날짜와 가장 가까운 발표 시각 얻기
    const { date, baseTime } = this.getNearestForecastDateTime();
    
    const response = await this.weatherService.getWeatherData(
      date, 
      baseTime, 
      regionCoordinates.nx, 
      regionCoordinates.ny
    );
    
    // 간소화된 날씨 정보로 변환
    return this.convertToSimpleWeather(response);
  }

  /**
   * 날씨 응답 데이터를 간소화된 형식으로 변환
   */
  private convertToSimpleWeather(response: WeatherResponseWrapperDto): SimpleWeatherDto {
    // 데이터가 없는 경우
    if (!response.items || response.items.length === 0) {
      throw new HttpException('날씨 정보를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
    
    const weatherData = response.items[0];
    
    // 간소화된 날씨 정보 반환
    return {
      temperature: weatherData.temperature,
      precipitation: weatherData.precipitation,
      weatherState: weatherData.ptyState === '없음' ? weatherData.skyState : weatherData.ptyState,
      date: weatherData.fcstDate,
      time: weatherData.fcstTime
    };
  }

  /**
   * 격자 좌표값 유효성 검사
   */
  private validateCoordinates(nx: string, ny: string): { nxNum: number, nyNum: number } {
    const nxNum = parseInt(nx, 10);
    const nyNum = parseInt(ny, 10);

    if (isNaN(nxNum) || isNaN(nyNum)) {
      throw new HttpException('nx, ny는 숫자여야 합니다.', HttpStatus.BAD_REQUEST);
    }

    return { nxNum, nyNum };
  }

  /**
   * 위도/경도 유효성 검사
   */
  private validateGeoCoordinates(lat: string, lon: string): { latNum: number, lonNum: number } {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      throw new HttpException('lat, lon은 숫자여야 합니다.', HttpStatus.BAD_REQUEST);
    }

    return { latNum, lonNum };
  }

  /**
   * 현재 시간 기준 가장 가까운 발표 시각 및 날짜 반환
   */
  private getNearestForecastDateTime(): { date: string, baseTime: string } {
    const now = new Date();
    const hour = now.getHours();
    
    // 당일 날짜
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayDate = `${year}${month}${day}`;
    
    // 전날 날짜
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayDate = `${yesterdayYear}${yesterdayMonth}${yesterdayDay}`;
    
    // 기상청 API 발표 시각 결정
    if (hour < 2) {
      return { date: yesterdayDate, baseTime: '2300' };
    } else if (hour < 5) {
      return { date: todayDate, baseTime: '0200' };
    } else if (hour < 8) {
      return { date: todayDate, baseTime: '0500' };
    } else if (hour < 11) {
      return { date: todayDate, baseTime: '0800' };
    } else if (hour < 14) {
      return { date: todayDate, baseTime: '1100' };
    } else if (hour < 17) {
      return { date: todayDate, baseTime: '1400' };
    } else if (hour < 20) {
      return { date: todayDate, baseTime: '1700' };
    } else if (hour < 23) {
      return { date: todayDate, baseTime: '2000' };
    } else {
      return { date: todayDate, baseTime: '2300' };
    }
  }

  /**
   * 위도/경도를 기상청 격자 좌표로 변환하는 함수
   */
  private convertGeoToGrid(lat: number, lon: number): { nx: number, ny: number } {
    // LCC DFS 좌표변환 상수
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0; // 투영 위도1(degree)
    const SLAT2 = 60.0; // 투영 위도2(degree)
    const OLON = 126.0; // 기준점 경도(degree)
    const OLAT = 38.0; // 기준점 위도(degree)
    const XO = 43; // 기준점 X좌표(GRID)
    const YO = 136; // 기준점 Y좌표(GRID)

    const DEGRAD = Math.PI / 180.0;
    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx, ny };
  }

  /**
   * 지역 코드에 해당하는 격자 좌표를 반환하는 함수
   */
  private getRegionCoordinates(code: string): { nx: number, ny: number } | null {
    // 주요 도시 격자 좌표
    const regionMap = {
      'seoul': { nx: 60, ny: 127 },      // 서울
      'incheon': { nx: 55, ny: 124 },    // 인천
      'busan': { nx: 98, ny: 76 },       // 부산
      'daegu': { nx: 89, ny: 90 },       // 대구
      'gwangju': { nx: 58, ny: 74 },     // 광주
      'daejeon': { nx: 67, ny: 100 },    // 대전
      'ulsan': { nx: 102, ny: 84 },      // 울산
      'sejong': { nx: 66, ny: 103 },     // 세종
      'jeju': { nx: 52, ny: 38 },        // 제주
      // 필요에 따라 더 많은 지역 추가 가능
    };

    return regionMap[code] || null;
  }
}