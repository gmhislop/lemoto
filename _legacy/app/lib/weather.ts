export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  description: string;
  icon: string;
  timestamp: number;
}

export interface WeatherForecast {
  current: WeatherData;
  forecast: WeatherData[];
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const response = await fetch(
      `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch current weather');
    }
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      precipitation: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: data.dt
    };
  }

  async getForecast(lat: number, lon: number): Promise<WeatherForecast> {
    const [currentWeather, forecastResponse] = await Promise.all([
      this.getCurrentWeather(lat, lon),
      fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&cnt=8`
      )
    ]);

    if (!forecastResponse.ok) {
      throw new Error('Failed to fetch weather forecast');
    }

    const forecastData = await forecastResponse.json();
    
    const forecast = forecastData.list.map((item: any) => ({
      temperature: item.main.temp,
      humidity: item.main.humidity,
      precipitation: item.rain?.['3h'] || 0,
      windSpeed: item.wind.speed,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      timestamp: item.dt
    }));

    return {
      current: currentWeather,
      forecast
    };
  }
}

export const weatherService = new WeatherService(process.env.OPENWEATHER_API_KEY!);