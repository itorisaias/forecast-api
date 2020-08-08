import { AxiosStatic } from 'axios';
import { InternalError } from '@src/utils/errors/internal-error';
import config, { IConfig } from 'config';

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

export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when trying to communicate to StormGlass';
    super(`${internalMessage}: ${message}`);
  }
}

export class StormGlassResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error returned by the StormGlass service';
    super(`${internalMessage}: ${message}`);
  }
}

const stormGlassResourceConfig: IConfig = config.get(
  'App.resources.StormGlass'
);

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
    try {
      const url = `${stormGlassResourceConfig.get('apiUrl')}/weather/point`;
      const response = await this.request.get<StormGlassForecastResponse>(url, {
        headers: {
          Authorization: stormGlassResourceConfig.get('apiToken'),
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
    } catch (err) {
      if (err.response && err.response.status) {
        throw new StormGlassResponseError(
          `Error: ${JSON.stringify(err.response.data)} Code: ${
            err.response.status
          }`
        );
      }

      throw new ClientRequestError(err.message);
    }
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
