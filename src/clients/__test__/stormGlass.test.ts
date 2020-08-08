import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios';
import stormGlassWeather3HoursFixture from '@test/fixtures/stormglass_weather_3_hours';
import stormGlassNormalized3HoursFixture from '@test/fixtures/stormglass_normalized_response_3_hours';

jest.mock('axios');

describe('StormGlass client', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('should return the normalized forecast from the StormGlass service', async () => {
    const lat = -3.792726;
    const lng = 151.289312;

    mockedAxios.get.mockResolvedValue({ data: stormGlassWeather3HoursFixture });

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual(stormGlassNormalized3HoursFixture);
  });
});
