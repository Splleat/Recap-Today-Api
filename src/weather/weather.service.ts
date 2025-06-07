import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WeatherDto } from './dto/weather.dto';
import { FullWeatherDto } from './dto/full-weather.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}
  
  async getFullWeather(nx: string, ny: string): Promise<FullWeatherDto[]> {
    this.logger.log(`날씨 데이터 요청 시작 - 좌표: (${nx}, ${ny})`);
    
    try {
      const { baseDate, baseTime } = this.getLatestBaseTime();
      this.logger.log(`기준 시간 설정 - 날짜: ${baseDate}, 시간: ${baseTime}`);

      const baseUrl = this.config.get<string>('KMA_API_BASE_URL');
      const apiKey = this.config.get<string>('KMA_API_KEY');

      if (!baseUrl) {
        this.logger.error('API URL이 설정되지 않음');
        throw new InternalServerErrorException('API URL이 설정되지 않았습니다.');
      }

      const params = {
        authKey: apiKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx,
        ny,
      };

      this.logger.log(`기상청 API 호출 시작 - URL: ${baseUrl}`);
      const response = await firstValueFrom(this.http.get(baseUrl, { params }));

      if (!response || !response.data?.response?.body?.items?.item) {
        this.logger.error('기상청 API 응답 데이터 없음');
        throw new InternalServerErrorException('날씨 정보를 가져오는 데 실패했습니다.');
      }

      const items = response.data.response.body.items.item;
      this.logger.log(`기상청 API 호출 성공 - 데이터 개수: ${items.length}`);

      const simplified = this.simplifyWeather(items);

      // 날짜별로 그룹화
      const grouped = new Map<string, WeatherDto[]>();

      for (const item of simplified) {
        if (!grouped.has(item.date)) {
          grouped.set(item.date, []);
        }
        grouped.get(item.date)?.push(item);
      }

      // 24시간 데이터가 완전한 날짜만 반환
      const result: FullWeatherDto[] = [];

      for (const [date, weatherList] of grouped) {
        // if (weatherList.length === 24) {
        //   result.push({ date, weather: weatherList });
        // }
        result.push({ date, weather: weatherList });
      }
      
      this.logger.log(`날씨 데이터 처리 완료 - 반환할 날짜 수: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(`날씨 데이터 요청 실패 - 좌표: (${nx}, ${ny})`, error.stack);
      throw error;
    }
  }

  private simplifyWeather(items: any[]): WeatherDto[] {
    const weatherMap = new Map<string, WeatherDto & { _skyCode?: string; _ptyCode?: string }>();

    for (const item of items) {
      const { category, fcstDate, fcstTime, fcstValue } = item;
      const key = `${fcstDate}-${fcstTime}`;

      if (!weatherMap.has(key)) {
        weatherMap.set(key, {
          date: fcstDate,
          time: this.formatTime(fcstTime),
          temperature: '',
          sky: '',
          precipitationProbability: '',
          _skyCode: '',
          _ptyCode: '',
        });
      }

      const entry = weatherMap.get(key)!;

      if (category === 'TMP') {
        entry.temperature = `${fcstValue}℃`;
      } else if (category === 'POP') {
        entry.precipitationProbability = `${fcstValue}%`;
      } else if (category === 'SKY') {
        entry._skyCode = fcstValue;
      } else if (category === 'PTY') {
        entry._ptyCode = fcstValue;
      }
    }

    for (const entry of weatherMap.values()) {
      entry.sky = this.getSkyState(entry._skyCode, entry._ptyCode);
      delete (entry as { _skyCode?: string })._skyCode;
      delete (entry as { _ptyCode?: string })._ptyCode;
    }

    return Array.from(weatherMap.values()).sort((a, b) => {
      const aKey = `${a.date}${a.time.padStart(2, '0')}`;
      const bKey = `${b.date}${b.time.padStart(2, '0')}`;
      return aKey.localeCompare(bKey);
    });
  }

  private formatTime(fcstTime: string): string {
    return fcstTime.length === 4 ? `${fcstTime.slice(0, 2)}시` : fcstTime;
  }

  private getSkyState(skyCode: string, ptyCode: string): string {
    switch (ptyCode) {
      case '1': return '비';
      case '2': return '비/눈';
      case '3': return '눈';
      case '4': return '소나기';
    }

    switch (skyCode) {
      case '1': return '맑음';
      case '3': return '구름많음';
      case '4': return '흐림';
      default:  return '알 수 없음';
    }
  }

  private getLatestBaseTime(): { baseDate: string, baseTime: string } {
    const now = new Date();
    const hour = now.getHours();
    let baseTime = '0200';

    const baseDate = new Date(now);
    if (hour < 2) {
      baseTime = '2300';
      baseDate.setDate(baseDate.getDate() - 1);
    } else if (hour < 5) {
      baseTime = '0200';
    } else if (hour < 8) {
      baseTime = '0500';
    } else if (hour < 11) {
      baseTime = '0800';
    } else if (hour < 14) {
      baseTime = '1100';
    } else if (hour < 17) {
      baseTime = '1400';
    } else if (hour < 20) {
      baseTime = '1700';
    } else if (hour < 23) {
      baseTime = '2000';
    } else {
      baseTime = '2300';
    }

    const baseDateStr = `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}`;
    return { baseDate: baseDateStr, baseTime };
  }

  // 위도, 경도를 격자 좌표로 변환하는 함수
  private convertGeoToGrid(lat: number, lon: number): { nx: number; ny: number } {
    this.logger.log(`좌표 변환 시작 - 위도: ${lat}, 경도: ${lon}`);
    
    try {
      const RE = 6371.00877;
      const GRID = 5.0;
      const SLAT1 = 30.0;
      const SLAT2 = 60.0;
      const OLON = 126.0;
      const OLAT = 38.0;
      const XO = 43;
      const YO = 136;

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

      let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
      ra = re * sf / Math.pow(ra, sn);
      let theta = lon * DEGRAD - olon;
      if (theta > Math.PI) theta -= 2.0 * Math.PI;
      if (theta < -Math.PI) theta += 2.0 * Math.PI;
      theta *= sn;

      const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
      const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

      this.logger.log(`좌표 변환 완료 - 격자좌표: (${nx}, ${ny})`);
      return { nx, ny };
    } catch (error) {
      this.logger.error(`좌표 변환 실패 - 위도: ${lat}, 경도: ${lon}`, error.stack);
      throw error;
    }
  }
}
