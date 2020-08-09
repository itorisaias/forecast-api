import { StormGlass } from '@src/clients/stormGlass';
import * as HttpUtil from '@src/utils/request';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours';
import stormGlassNormalized3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours';

jest.mock('@src/utils/request');

describe('StormGlass client', () => {
  const MockedRequestClass = HttpUtil.Request as jest.Mocked<
    typeof HttpUtil.Request
  >;
  const mockedRequest = new HttpUtil.Request() as jest.Mocked<HttpUtil.Request>;

  it('should return the normalized forecast from the StormGlass service', async () => {
    const lat = -3.792726;
    const lng = 151.289312;

    mockedRequest.get.mockResolvedValue({
      data: stormGlassWeather3HoursFixture,
    } as HttpUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const points = await stormGlass.fetchPoints(lat, lng);

    expect(points).toEqual(stormGlassNormalized3HoursFixture);
  });

  it('should exclude incomplete data points', async () => {
    const lat = -33.123124;
    const lng = 123.231233;
    const incompleteResponse = {
      hours: [
        {
          windDirection: {
            noaa: 300,
          },
          time: '2020-04-26T01:00:00+00:00',
        },
      ],
    };

    mockedRequest.get.mockResolvedValue({
      data: incompleteResponse,
    } as HttpUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const points = await stormGlass.fetchPoints(lat, lng);

    expect(points).toEqual([]);
  });

  it('should get a generic error from StormGlass service when the request fail before reaching the service', async () => {
    const lat = -33.123124;
    const lng = 123.231233;

    mockedRequest.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedRequest);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Network Error'
    );
  });

  it('should get an StormGlassResponseError when the StormGlass service responds with error', async () => {
    const lat = -33.123124;
    const lng = 123.231233;

    MockedRequestClass.isRequestError.mockReturnValue(true);
    mockedRequest.get.mockRejectedValue({
      response: {
        status: 429,
        data: {
          errors: ['Rate Limit reached'],
        },
      },
    });

    const stormGlass = new StormGlass(mockedRequest);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
    );
  });
});
