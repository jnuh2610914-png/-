function getWeatherCondition(code: number, isDay: boolean = true) {
  const isDayStr = isDay ? "day" : "night";
  const defaultIcon = `//cdn.weatherapi.com/weather/64x64/${isDayStr}/113.png`;
  
  switch (code) {
    case 0:
      return { text: "맑음", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/113.png`, code: 1000 };
    case 1:
      return { text: "대체로 맑음", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/116.png`, code: 1003 };
    case 2:
      return { text: "구름 조금", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/119.png`, code: 1006 };
    case 3:
      return { text: "흐림", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/122.png`, code: 1009 };
    case 45:
    case 48:
      return { text: "안개", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/248.png`, code: 1135 };
    case 51:
    case 53:
    case 55:
      return { text: "이슬비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/266.png`, code: 1153 };
    case 56:
    case 57:
      return { text: "얼어붙는 이슬비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/281.png`, code: 1168 };
    case 61:
      return { text: "약한 비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/296.png`, code: 1183 };
    case 63:
      return { text: "보통 비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/302.png`, code: 1189 };
    case 65:
      return { text: "강한 비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/308.png`, code: 1195 };
    case 66:
    case 67:
      return { text: "진눈깨비", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/311.png`, code: 1204 };
    case 71:
      return { text: "약한 눈", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/326.png`, code: 1213 };
    case 73:
      return { text: "보통 눈", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/332.png`, code: 1219 };
    case 75:
      return { text: "강한 눈", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/338.png`, code: 1225 };
    case 77:
      return { text: "싸락눈", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/323.png`, code: 1210 };
    case 80:
    case 81:
    case 82:
      return { text: "소나기", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/353.png`, code: 1240 };
    case 85:
    case 86:
      return { text: "소낙눈", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/368.png`, code: 1255 };
    case 95:
    case 96:
    case 99:
      return { text: "천둥번개", icon: `//cdn.weatherapi.com/weather/64x64/${isDayStr}/389.png`, code: 1276 };
    default:
      return { text: "정보 없음", icon: defaultIcon, code: 1000 };
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const cityQuery = (req.query.city as string) || "Seoul";
  const apiKey = process.env.WEATHER_API_KEY;

  // Option A: Use WeatherAPI.com if API key is provided
  if (apiKey && apiKey !== "MY_WEATHER_API_KEY") {
    try {
      const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(cityQuery)}&days=3&aqi=yes&alerts=yes&lang=ko`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        const result = {
          provider: "WeatherAPI.com",
          isDemo: false,
          location: {
            name: data.location.name,
            region: data.location.region,
            country: data.location.country,
            lat: data.location.lat,
            lon: data.location.lon,
            localtime: data.location.localtime
          },
          current: {
            temp_c: data.current.temp_c,
            feelslike_c: data.current.feelslike_c,
            humidity: data.current.humidity,
            wind_kph: data.current.wind_kph,
            uv: data.current.uv,
            is_day: data.current.is_day === 1,
            condition: {
              text: data.current.condition.text,
              icon: data.current.condition.icon,
              code: data.current.condition.code
            },
            air_quality: data.current.air_quality ? {
              pm2_5: Math.round(data.current.air_quality.pm2_5 * 10) / 10,
              pm10: Math.round(data.current.air_quality.pm10 * 10) / 10,
              co: Math.round(data.current.air_quality.co),
              no2: Math.round(data.current.air_quality.no2 * 10) / 10
            } : undefined
          },
          forecast: data.forecast.forecastday.map((day: any) => ({
            date: day.date,
            max_temp: day.day.maxtemp_c,
            min_temp: day.day.mintemp_c,
            avg_temp: day.day.avgtemp_c,
            condition: {
              text: day.day.condition.text,
              icon: day.day.condition.icon
            },
            chance_of_rain: day.day.daily_chance_of_rain || day.day.daily_chance_of_snow || 0
          })),
          hourly: data.forecast.forecastday[0].hour.filter((_: any, i: number) => i % 2 === 0).map((hour: any) => ({
            time: hour.time.split(" ")[1],
            temp_c: hour.temp_c,
            condition: {
              text: hour.condition.text,
              icon: hour.condition.icon
            },
            is_day: hour.is_day === 1
          }))
        };
        
        return res.status(200).json(result);
      }
    } catch (err) {
      console.error("WeatherAPI failed, falling back to Open-Meteo:", err);
    }
  }

  // Option B: Fallback to Open-Meteo & Open-Meteo Geocoding
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=ko`;
    const geoRes = await fetch(geoUrl);
    let lat = 37.5665;
    let lon = 126.9780;
    let name = "서울";
    let country = "대한민국";
    let region = "서울특별시";

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const place = geoData.results[0];
        lat = place.latitude;
        lon = place.longitude;
        name = place.name;
        country = place.country || "";
        region = place.admin1 || "";
      } else {
        const koreanCities: { [key: string]: { lat: number; lon: number; name: string; region: string } } = {
          "서울": { lat: 37.5665, lon: 126.9780, name: "서울", region: "서울특별시" },
          "seoul": { lat: 37.5665, lon: 126.9780, name: "서울", region: "서울특별시" },
          "부산": { lat: 35.1796, lon: 129.0756, name: "부산", region: "부산광역시" },
          "busan": { lat: 35.1796, lon: 129.0756, name: "부산", region: "부산광역시" },
          "인천": { lat: 37.4563, lon: 126.7052, name: "인천", region: "인천광역시" },
          "incheon": { lat: 37.4563, lon: 126.7052, name: "인천", region: "인천광역시" },
          "대구": { lat: 35.8714, lon: 128.6014, name: "대구", region: "대구광역시" },
          "daegu": { lat: 35.8714, lon: 128.6014, name: "대구", region: "대구광역시" },
          "대전": { lat: 36.3504, lon: 127.3845, name: "대전", region: "대전광역시" },
          "daejeon": { lat: 36.3504, lon: 127.3845, name: "대전", region: "대전광역시" },
          "광주": { lat: 35.1595, lon: 126.8526, name: "광주", region: "광주광역시" },
          "gwangju": { lat: 35.1595, lon: 126.8526, name: "광주", region: "광주광역시" },
          "울산": { lat: 35.5384, lon: 129.3114, name: "울산", region: "울산광역시" },
          "ulsan": { lat: 35.5384, lon: 129.3114, name: "울산", region: "울산광역시" },
          "제주": { lat: 33.4996, lon: 126.5312, name: "제주", region: "제주도" },
          "jeju": { lat: 33.4996, lon: 126.5312, name: "제주", region: "제주도" }
        };
        const lowerQuery = cityQuery.toLowerCase().trim();
        if (koreanCities[lowerQuery]) {
          lat = koreanCities[lowerQuery].lat;
          lon = koreanCities[lowerQuery].lon;
          name = koreanCities[lowerQuery].name;
          region = koreanCities[lowerQuery].region;
        }
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    
    if (weatherRes.ok) {
      const wData = await weatherRes.json();
      const currentCondition = getWeatherCondition(wData.current.weather_code, wData.current.is_day === 1);
      
      const hourlyData = [];
      const currentHourIdx = new Date().getHours();
      for (let i = 0; i < 24; i += 2) {
        const idx = (currentHourIdx + i) % 24;
        const temp = wData.hourly.temperature_2m[idx] || wData.current.temperature_2m;
        const code = wData.hourly.weather_code[idx] || 0;
        const isDay = wData.hourly.is_day[idx] === 1;
        const cond = getWeatherCondition(code, isDay);
        
        hourlyData.push({
          time: `${String(idx).padStart(2, "0")}:00`,
          temp_c: Math.round(temp * 10) / 10,
          condition: {
            text: cond.text,
            icon: cond.icon
          },
          is_day: isDay
        });
      }

      const forecastData = [];
      for (let d = 0; d < Math.min(3, wData.daily.time.length); d++) {
        const code = wData.daily.weather_code[d];
        const cond = getWeatherCondition(code, true);
        forecastData.push({
          date: wData.daily.time[d],
          max_temp: Math.round(wData.daily.temperature_2m_max[d] * 10) / 10,
          min_temp: Math.round(wData.daily.temperature_2m_min[d] * 10) / 10,
          avg_temp: Math.round(((wData.daily.temperature_2m_max[d] + wData.daily.temperature_2m_min[d]) / 2) * 10) / 10,
          condition: {
            text: cond.text,
            icon: cond.icon
          },
          chance_of_rain: wData.daily.precipitation_probability_max[d] || 0
        });
      }

      let pm2_5 = 12;
      let pm10 = 24;
      if (wData.current.precipitation > 0) {
        pm2_5 = 4;
        pm10 = 8;
      } else if (currentCondition.text.includes("맑음")) {
        pm2_5 = 18;
        pm10 = 35;
      } else {
        pm2_5 = 14;
        pm10 = 28;
      }

      const result = {
        provider: "Open-Meteo",
        isDemo: true,
        location: {
          name,
          region,
          country,
          lat,
          lon,
          localtime: new Date().toLocaleString("ko-KR", { timeZone: wData.timezone })
        },
        current: {
          temp_c: Math.round(wData.current.temperature_2m * 10) / 10,
          feelslike_c: Math.round(wData.current.apparent_temperature * 10) / 10,
          humidity: wData.current.relative_humidity_2m,
          wind_kph: Math.round(wData.current.wind_speed_10m * 1.60934 * 10) / 10,
          uv: wData.daily.uv_index_max[0] || 0,
          is_day: wData.current.is_day === 1,
          condition: {
            text: currentCondition.text,
            icon: currentCondition.icon,
            code: currentCondition.code
          },
          air_quality: {
            pm2_5,
            pm10,
            co: 250,
            no2: 8.5
          }
        },
        forecast: forecastData,
        hourly: hourlyData
      };

      return res.status(200).json(result);
    }
  } catch (err) {
    console.error("Open-Meteo fallback also failed:", err);
  }

  // Option C: Simulated Mock Fallback
  const mockDateStr = new Date().toISOString().split('T')[0];
  return res.status(200).json({
    provider: "Simulated",
    isDemo: true,
    location: {
      name: "서울",
      region: "서울특별시",
      country: "대한민국",
      lat: 37.5665,
      lon: 126.9780,
      localtime: new Date().toLocaleString("ko-KR")
    },
    current: {
      temp_c: 24.5,
      feelslike_c: 25.0,
      humidity: 60,
      wind_kph: 8.5,
      uv: 5.0,
      is_day: true,
      condition: {
        text: "맑음",
        icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
        code: 1000
      },
      air_quality: {
        pm2_5: 15,
        pm10: 29,
        co: 240,
        no2: 7.2
      }
    },
    forecast: [
      { date: mockDateStr, max_temp: 28.0, min_temp: 19.0, avg_temp: 24.0, condition: { text: "맑음", icon: "//cdn.weatherapi.com/weather/64x64/day/113.png" }, chance_of_rain: 10 },
      { date: "내일", max_temp: 29.0, min_temp: 20.0, avg_temp: 24.5, condition: { text: "구름 조금", icon: "//cdn.weatherapi.com/weather/64x64/day/116.png" }, chance_of_rain: 20 },
      { date: "모레", max_temp: 27.5, min_temp: 21.0, avg_temp: 23.8, condition: { text: "흐림", icon: "//cdn.weatherapi.com/weather/64x64/day/122.png" }, chance_of_rain: 60 }
    ],
    hourly: [
      { time: "08:00", temp_c: 21.0, condition: { text: "맑음", icon: "//cdn.weatherapi.com/weather/64x64/day/113.png" }, is_day: true },
      { time: "12:00", temp_c: 26.5, condition: { text: "맑음", icon: "//cdn.weatherapi.com/weather/64x64/day/113.png" }, is_day: true },
      { time: "16:00", temp_c: 27.0, condition: { text: "구름 조금", icon: "//cdn.weatherapi.com/weather/64x64/day/116.png" }, is_day: true },
      { time: "20:00", temp_c: 23.0, condition: { text: "구름 조금", icon: "//cdn.weatherapi.com/weather/64x64/night/116.png" }, is_day: false }
    ]
  });
}
