import { BaseAdapter } from "./BaseAdapter";
import { ImportType } from "../models";

export class WeatherAdapter extends BaseAdapter {
  type = "stadium_weather_feed";
  name = "National Stadium Weather Forecast Adapter";
  description = "Connects to environmental APIs tracking barometric pressure, wind speeds, rain probabilities, and temperatures.";
  supportedType = ImportType.WEATHER;

  async fetchData(params?: Record<string, any>): Promise<any[]> {
    return [
      { venue: "Levi's Stadium", temp_f: 72, wind_mph: 12, rain_percent: 10, roof: "open" },
      { venue: "Arrowhead Stadium", temp_f: 80, wind_mph: 5, rain_percent: 50, roof: "open" }
    ];
  }

  async transform(rawItems: any[]): Promise<any[]> {
    return rawItems.map(item => ({
      stadium: item.venue,
      temperatureCelsius: parseFloat(((item.temp_f - 32) * 5 / 9).toFixed(2)),
      windSpeedMPh: item.wind_mph,
      precipitationProbability: item.rain_percent,
      isRoofCovered: item.roof !== "open",
      forecastType: item.rain_percent > 40 ? "Rainy" : "Clear"
    }));
  }
}
