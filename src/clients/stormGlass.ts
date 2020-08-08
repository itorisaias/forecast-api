import { AxiosStatic } from 'axios';

export interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassPoint {
  readonly time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

export interface ForecastPoints {
  time: string;
  waveHeight: number;
  waveDirection: number;
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  windDirection: number;
  windSpeed: number;
}

export class StormGlass {
  readonly stormGlassParams = [
    'swellDirection',
    'swellHeight',
    'swellPeriod',
    'waveDirection',
    'waveHeight',
    'windDirection',
    'windSpeed',
  ];
  readonly stormGlassSource = 'noaa';

  constructor(protected request: AxiosStatic) {}

  public async fetchPoints(
    lat: number,
    lng: number
  ): Promise<ForecastPoints[]> {
    const url = 'https://api.stormglass.io/v2/weather/point';
    const response = await this.request.get<StormGlassForecastResponse>(url, {
      headers: {
        Authorization: 'fake-token',
      },
      params: {
        params: this.stormGlassParams.join(','),
        source: this.stormGlassSource,
        end: Date.now(),
        lat,
        lng,
      },
    });

    return this.normalizeResponse(response.data);
  }

  private normalizeResponse(
    points: StormGlassForecastResponse
  ): ForecastPoints[] {
    return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
      time: point.time,
      waveHeight: point.waveHeight[this.stormGlassSource],
      waveDirection: point.waveDirection[this.stormGlassSource],
      swellDirection: point.swellDirection[this.stormGlassSource],
      swellHeight: point.swellHeight[this.stormGlassSource],
      swellPeriod: point.swellPeriod[this.stormGlassSource],
      windDirection: point.windDirection[this.stormGlassSource],
      windSpeed: point.windSpeed[this.stormGlassSource],
    }));
  }

  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      point.time &&
      point.waveHeight?.[this.stormGlassSource] &&
      point.waveDirection?.[this.stormGlassSource] &&
      point.swellDirection?.[this.stormGlassSource] &&
      point.swellHeight?.[this.stormGlassSource] &&
      point.swellPeriod?.[this.stormGlassSource] &&
      point.windDirection?.[this.stormGlassSource] &&
      point.windSpeed?.[this.stormGlassSource]
    );
  }
}
