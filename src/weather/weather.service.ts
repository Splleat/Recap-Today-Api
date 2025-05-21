// src/weather/weather.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs'; // Observable을 Promise로 변환하기 위해 사용
import { WeatherItemDto, WeatherResponseDto, WeatherResponseWrapperDto } from './dto/weather-response.dto';
import { DailyWeatherDto } from './dto/daily-weather.dto';
import { SimpleWeatherDto } from './dto/simple-weather.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 기상청 API를 통해 날씨 데이터를 조회합니다.
   * @param baseDate 발표 일자 (YYYYMMDD)
   * @param baseTime 발표 시각 (HHMM)
   * @param nx 예보지점 X 좌표
   * @param ny 예보지점 Y 좌표
   * @returns 가공된 날씨 정보
   */
  async getWeatherData(
    baseDate: string,
    baseTime: string,
    nx: number,
    ny: number,
  ): Promise<WeatherResponseWrapperDto> {
    const apiKey = this.configService.get<string>('KMA_API_KEY');
    const baseUrl = this.configService.get<string>('KMA_API_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new HttpException(
        'API Key 또는 Base URL이 설정되지 않았습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const encodedApiKey = encodeURIComponent(apiKey);

    const params = {
      authKey: encodedApiKey,
      numOfRows: '10',
      pageNo: '1',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: nx.toString(),
      ny: ny.toString(),
    };

    // 디버깅 정보 추가
    this.logger.debug('⭐⭐⭐ API 요청 정보 ⭐⭐⭐');
    this.logger.debug(`기상청 API URL: ${baseUrl}`);
    this.logger.debug(`API 키 (마스킹): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
    this.logger.debug(`요청 파라미터: ${JSON.stringify(params)}`);

    try {
      this.logger.debug(`날씨 데이터 요청: ${baseDate} ${baseTime} 좌표(${nx}, ${ny})`);
      
      // 실제 요청 URL을 로그로 출력
      const fullUrl = `${baseUrl}?pageNo=1&numOfRows=10&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&authKey=${encodedApiKey}`;
      
      this.logger.debug(`전체 요청 URL: ${fullUrl.replace(encodedApiKey, 'API_KEY_MASKED')}`);
      
      const response = await firstValueFrom(
        this.httpService.get(baseUrl, { params }),
      );

      // 응답 디버깅 정보 추가
      this.logger.debug('⭐⭐⭐ API 응답 정보 ⭐⭐⭐');
      this.logger.debug(`응답 코드: ${response.status}`);
      
      // 전체 응답 데이터 출력 (개발 중에만 사용)
      this.logger.debug(`전체 응답 데이터: ${JSON.stringify(response.data)}`);

      if (response.data.response && response.data.response.header.resultCode === '00') {
        const rawItems = response.data.response.body.items.item as WeatherItemDto[];
        
        // 데이터 가공
        return this.processWeatherData(
          rawItems, 
          baseDate, 
          baseTime, 
          nx, 
          ny, 
          response.data.response.header
        );
      } else {
        const errorMessage = response.data.response?.header?.resultMsg || '기상청 API 요청 실패';
        const errorCode = response.data.response?.header?.resultCode || 'UNKNOWN';
        this.logger.error(`KMA API 오류: 코드=${errorCode}, 메시지=${errorMessage}, 전체 응답=${JSON.stringify(response.data)}`);
        throw new HttpException(`기상청 API 오류: ${errorMessage} (코드: ${errorCode})`, HttpStatus.FAILED_DEPENDENCY);
      }
    } catch (error) {
      // 에러 로깅 개선
      this.logger.error(`⚠️⚠️⚠️ API 오류 정보 ⚠️⚠️⚠️`);
      
      if (error.response) {
        this.logger.error(`API 응답 에러: ${JSON.stringify(error.response.data || {})}`);
        this.logger.error(`응답 상태 코드: ${error.response.status}`);
      }
      
      this.logger.error(`오류 메시지: ${error.message}`);
      this.logger.error(`오류 유형: ${error.name}`);
      this.logger.error(`전체 오류 정보: ${JSON.stringify(error, null, 2)}`);
      
      if (error.isAxiosError) {
        this.logger.error(`API URL: ${error.config?.url}`);
        this.logger.error(`요청 방식: ${error.config?.method}`);
        this.logger.error(`요청 파라미터: ${JSON.stringify(error.config?.params)}`);
        
        throw new HttpException(
          `기상청 API 요청 중 오류 발생: ${error.response?.status || ''} ${error.response?.data?.response?.header?.resultMsg || error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `날씨 정보를 가져오는 중 내부 서버 오류가 발생했습니다: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 특정 날짜의 24시간 날씨 정보를 조회합니다.
   * @param date 조회할 날짜 (YYYYMMDD)
   * @param nx 예보지점 X 좌표
   * @param ny 예보지점 Y 좌표
   * @returns 24시간 날씨 정보
   */
  async get24HourWeather(
    date: string,
    nx: number,
    ny: number,
  ): Promise<DailyWeatherDto> {
    // 현재 시각을 기준으로 가장 최근의 발표 시각을 계산
    const now = new Date();
    let baseTime = this.calculateBaseTime(now);
    let baseDate = date;

    // 24시간 날씨 데이터를 저장할 배열
    const hourlyWeather: SimpleWeatherDto[] = [];

    try {
      // 기상청 API는 한 번에 최대 10개의 데이터를 반환하므로
      // 24시간 데이터를 얻기 위해 3번의 API 호출이 필요할 수 있습니다.
      for (let i = 0; i < 3; i++) {
        const response = await this.getWeatherData(baseDate, baseTime, nx, ny);
        
        // 응답에서 시간별 날씨 정보를 추출하여 배열에 추가
        const weatherItems = this.extractHourlyWeather(response);
        hourlyWeather.push(...weatherItems);

        // 다음 시간대의 데이터를 위해 baseTime 업데이트
        const nextTime = this.calculateNextBaseTime(baseDate, baseTime);
        baseDate = nextTime.date;
        baseTime = nextTime.time;
      }

      // 24시간 데이터만 선택
      const dailyWeather: DailyWeatherDto = {
        date,
        hourlyWeather: hourlyWeather.slice(0, 24)
      };

      return dailyWeather;
    } catch (error) {
      this.logger.error(`24시간 날씨 조회 실패: ${error.message}`);
      throw new HttpException(
        '24시간 날씨 정보 조회에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 현재 시각에 맞는 기상청 API 발표 시각을 계산합니다.
   */
  private calculateBaseTime(date: Date): string {
    const hour = date.getHours();
    // 기상청 API는 매 3시간마다 발표
    const baseHour = Math.floor(hour / 3) * 3;
    return baseHour.toString().padStart(2, '0') + '00';
  }

  /**
   * 다음 발표 시각을 계산합니다.
   */
  private calculateNextBaseTime(currentDate: string, currentTime: string): { date: string; time: string } {
    const date = new Date(
      Number(currentDate.substring(0, 4)),
      Number(currentDate.substring(4, 6)) - 1,
      Number(currentDate.substring(6, 8)),
      Number(currentTime.substring(0, 2))
    );

    // 3시간 추가
    date.setHours(date.getHours() + 3);

    return {
      date: date.toISOString().substring(0, 10).replace(/-/g, ''),
      time: date.getHours().toString().padStart(2, '0') + '00'
    };
  }

  /**
   * WeatherResponseWrapperDto에서 시간별 날씨 정보를 추출합니다.
   */
  private extractHourlyWeather(response: WeatherResponseWrapperDto): SimpleWeatherDto[] {
    const hourlyWeather: SimpleWeatherDto[] = [];
    const items = response.response.body.items.item;
    
    // 온도, 강수량, 날씨상태를 저장할 임시 객체
    const tempData: { [key: string]: any } = {};
    
    // 각 아이템을 시간별로 그룹화
    items.forEach(item => {
      const time = item.fcstTime;
      if (!tempData[time]) {
        tempData[time] = {};
      }
      
      switch (item.category) {
        case 'TMP': // 1시간 기온
          tempData[time].temperature = item.fcstValue;
          break;
        case 'RN1': // 1시간 강수량
          tempData[time].precipitation = item.fcstValue;
          break;
        case 'SKY': // 하늘상태
          tempData[time].weatherState = this.convertSkyCodeToState(item.fcstValue);
          break;
      }
    });

    // 시간별 데이터를 SimpleWeatherDto 배열로 변환
    Object.entries(tempData).forEach(([time, data]: [string, any]) => {
      if (data.temperature && data.precipitation !== undefined && data.weatherState) {
        hourlyWeather.push({
          temperature: data.temperature,
          precipitation: data.precipitation,
          weatherState: data.weatherState,
          date: items[0].fcstDate,
          time: time
        });
      }
    });

    return hourlyWeather;
  }

  /**
   * 하늘상태 코드를 문자열로 변환합니다.
   */
  private convertSkyCodeToState(code: string): string {
    switch (code) {
      case '1':
        return '맑음';
      case '3':
        return '구름많음';
      case '4':
        return '흐림';
      default:
        return '알 수 없음';
    }
  }

  /**
   * 기상청 API 응답 데이터를 가공합니다.
   * @param items 기상청 API 응답 항목 배열
   * @param baseDate 발표 일자
   * @param baseTime 발표 시각
   * @param nx X 좌표
   * @param ny Y 좌표
   * @param header 응답 헤더
   * @returns 가공된 날씨 응답
   */
  private processWeatherData(
    items: WeatherItemDto[],
    baseDate: string,
    baseTime: string,
    nx: number,
    ny: number,
    header: any,
  ): WeatherResponseWrapperDto {
    // 첫 번째 예보 시간에 대한 데이터만 추출
    const fcstDateTime = this.getFirstForecastDateTime(items);
    
    if (!fcstDateTime) {
      this.logger.warn('예보 데이터를 찾을 수 없습니다.');
      return {
        resultCode: header.resultCode,
        resultMsg: header.resultMsg,
        items: [],
      };
    }

    const { fcstDate, fcstTime } = fcstDateTime;
    
    // 해당 시간의 모든 카테고리 데이터 필터링
    const filteredItems = items.filter(
      item => item.fcstDate === fcstDate && item.fcstTime === fcstTime
    );

    // 가공된 응답 생성
    const weatherData: WeatherResponseDto = {
      baseDate,
      baseTime,
      fcstDate,
      fcstTime,
      temperature: this.findCategoryValue(filteredItems, 'TMP'),
      skyCode: this.findCategoryValue(filteredItems, 'SKY'),
      skyState: this.getSkyState(this.findCategoryValue(filteredItems, 'SKY')),
      ptyCode: this.findCategoryValue(filteredItems, 'PTY'),
      ptyState: this.getPrecipitationState(this.findCategoryValue(filteredItems, 'PTY')),
      probabilityOfPrecipitation: this.findCategoryValue(filteredItems, 'POP'),
      humidity: this.findCategoryValue(filteredItems, 'REH'),
      windSpeed: this.findCategoryValue(filteredItems, 'WSD'),
      precipitation: this.findCategoryValue(filteredItems, 'PCP'),
      nx,
      ny,
    };

    return {
      resultCode: header.resultCode,
      resultMsg: header.resultMsg,
      items: [weatherData],
    };
  }

  /**
   * 첫 번째 예보 시간을 찾습니다.
   * @param items 기상청 API 응답 항목 배열
   * @returns 예보 일자와 시각 객체
   */
  private getFirstForecastDateTime(items: WeatherItemDto[]): { fcstDate: string; fcstTime: string } | null {
    if (items.length === 0) return null;
    
    // 가장 가까운 예보 시간 찾기
    const now = new Date();
    const currentDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 현재 시간 이후의 첫 예보 시간 찾기
    const sortedItems = [...items].sort((a, b) => {
      const dateA = a.fcstDate + a.fcstTime;
      const dateB = b.fcstDate + b.fcstTime;
      return dateA.localeCompare(dateB);
    });

    // 첫 번째 예보 시간 반환
    return {
      fcstDate: sortedItems[0].fcstDate,
      fcstTime: sortedItems[0].fcstTime,
    };
  }

  /**
   * 특정 카테고리의 값을 찾습니다.
   * @param items 기상청 API 응답 항목 배열
   * @param category 찾을 카테고리 코드
   * @returns 카테고리 값
   */
  private findCategoryValue(items: WeatherItemDto[], category: string): string {
    const item = items.find(item => item.category === category);
    return item ? item.fcstValue : '';
  }

  /**
   * 하늘 상태 코드를 텍스트로 변환합니다.
   * @param skyCode 하늘 상태 코드
   * @returns 하늘 상태 텍스트
   */
  private getSkyState(skyCode: string): string {
    switch (skyCode) {
      case '1':
        return '맑음';
      case '3':
        return '구름많음';
      case '4':
        return '흐림';
      default:
        return '알 수 없음';
    }
  }

  /**
   * 강수 형태 코드를 텍스트로 변환합니다.
   * @param ptyCode 강수 형태 코드
   * @returns 강수 형태 텍스트
   */
  private getPrecipitationState(ptyCode: string): string {
    switch (ptyCode) {
      case '0':
        return '없음';
      case '1':
        return '비';
      case '2':
        return '비/눈';
      case '3':
        return '눈';
      case '4':
        return '소나기';
      default:
        return '알 수 없음';
    }
  }
}