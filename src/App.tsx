import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Wind, 
  Droplets, 
  Sun, 
  CloudRain, 
  Sparkles, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Thermometer, 
  Shirt, 
  Activity, 
  Compass,
  ArrowRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WeatherData {
  provider: string;
  isDemo: boolean;
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    uv: number;
    is_day: boolean;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    air_quality?: {
      pm2_5: number;
      pm10: number;
      co: number;
      no2: number;
    };
  };
  forecast: Array<{
    date: string;
    max_temp: number;
    min_temp: number;
    avg_temp: number;
    condition: {
      text: string;
      icon: string;
    };
    chance_of_rain: number;
  }>;
  hourly: Array<{
    time: string;
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    is_day: boolean;
  }>;
}

// Quick City Recommendations
const presetCities = [
  { ko: "서울", en: "Seoul" },
  { ko: "부산", en: "Busan" },
  { ko: "제주", en: "Jeju" },
  { ko: "인천", en: "Incheon" },
  { ko: "대구", en: "Daegu" },
  { ko: "대전", en: "Daejeon" },
  { ko: "광주", en: "Gwangju" },
  { ko: "울산", en: "Ulsan" },
];

// Helper to get Korean weekday
const getKoreanWeekday = (dateStr: string) => {
  const date = new Date(dateStr);
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return "오늘";
  if (date.toDateString() === tomorrow.toDateString()) return "내일";
  
  return weekdays[date.getDay()];
};

// Helper for formatting date "7월 18일"
const formatKoreanDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// Custom Markdown-like parser & renderer for Gemini responses to keep UI perfectly clean and beautiful
function AIBriefingRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        
        // Headers (e.g. ### 🌤️ 오늘의 날씨 요약)
        if (trimmed.startsWith("###")) {
          const content = trimmed.replace(/^###\s*/, "");
          return (
            <h4 key={idx} className="font-semibold text-slate-800 text-base flex items-center gap-1.5 border-b border-slate-200 pb-1 mt-4 first:mt-0">
              {content}
            </h4>
          );
        }
        
        if (trimmed.startsWith("##")) {
          const content = trimmed.replace(/^##\s*/, "");
          return (
            <h3 key={idx} className="font-bold text-slate-800 text-lg flex items-center gap-1.5 mt-5">
              {content}
            </h3>
          );
        }
        
        // Bullet points (e.g. * 비 소식이 있어요!)
        if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
          const content = trimmed.replace(/^[\*\-]\s*/, "");
          
          // Render bold parts inside bullet point
          return (
            <div key={idx} className="flex gap-2.5 items-start pl-1">
              <span className="text-indigo-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p className="text-slate-600">
                <FormattedText text={content} />
              </p>
            </div>
          );
        }
        
        // Paragraphs
        return (
          <p key={idx} className="text-slate-600 pl-1">
            <FormattedText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

// Parses bold markdown text (**text**)
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-slate-800 bg-slate-100/80 px-1.5 py-0.5 rounded text-xs mx-0.5 border border-slate-200/60">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

// Dictionary for translating common city names into Korean
const getKoreanCityName = (name: string) => {
  const dictionary: { [key: string]: string } = {
    "seoul": "서울",
    "jeju": "제주",
    "jeju city": "제주",
    "jeju-do": "제주",
    "busan": "부산",
    "incheon": "인천",
    "daegu": "대구",
    "daejeon": "대전",
    "gwangju": "광주",
    "ulsan": "울산",
    "suwon": "수원",
    "seongnam": "성남",
    "goyang": "고양",
    "yongin": "용인",
    "bucheon": "부천",
    "cheongju": "청주",
    "ansan": "안산",
    "jeonju": "전주",
    "cheonan": "천안",
    "changwon": "창원",
    "pohang": "포항",
    "gimhae": "김해",
    "anyang": "안양",
    "iksan": "익산",
    "yeosu": "여수",
    "mokpo": "목포",
    "chuncheon": "춘천",
    "gangneung": "강릉",
    "wonju": "원주",
    "seogwipo": "서귀포",
    "new york": "뉴욕",
    "tokyo": "도쿄",
    "london": "런던",
    "paris": "파리",
    "beijing": "베이징",
    "sydney": "시드니",
    "los angeles": "로스앤젤레스",
    "singapore": "싱가포르",
  };

  const lower = name.toLowerCase().trim();
  if (dictionary[lower]) return dictionary[lower];
  
  // Partial match fallback
  for (const [key, value] of Object.entries(dictionary)) {
    if (lower.includes(key)) return value;
  }
  
  return name;
};

export default function App() {
  const [cityInput, setCityInput] = useState("");
  const [activeCity, setActiveCity] = useState("서울");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Custom smart loading messages for AI Briefing
  const [aiStatusIdx, setAiStatusIdx] = useState(0);
  const aiStatusMessages = [
    "실시간 기상 데이터 분석 중...",
    "체감 온도 및 자외선 지수 측정 중...",
    "오늘 기온에 어울리는 최적의 의상 매칭 중...",
    "안전한 야외 활동을 위한 미세먼지 수치 분석 중...",
    "Gemini AI 가이드를 작성하는 중입니다..."
  ];

  // Rotate loading status text for delightful user experience
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiLoading) {
      interval = setInterval(() => {
        setAiStatusIdx((prev) => (prev + 1) % aiStatusMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  // Handle local clock display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Weather Data
  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
      if (!response.ok) {
        throw new Error("날씨 정보를 가져오는 데 실패했습니다.");
      }
      const data: WeatherData = await response.json();
      setWeather(data);
      setActiveCity(getKoreanCityName(data.location.name));
      
      // Promptly request AI Briefing once weather is fetched
      fetchAIBriefing(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "날씨 데이터를 불러오는 중 문제가 발생했습니다.");
      setLoading(false);
    }
  };

  // Fetch AI Briefing
  const fetchAIBriefing = async (weatherData: WeatherData) => {
    setAiLoading(true);
    setAiStatusIdx(0);
    try {
      const response = await fetch("/api/weather/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weatherData }),
      });
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        setAiSummary("AI 기상 브리핑을 생성하지 못했습니다. 아래 기온 정보에 어울리는 안전한 활동을 계획하세요!");
      }
    } catch (err) {
      console.error("AI briefing call error:", err);
      setAiSummary("AI 네트워크가 잠시 불안정합니다. 추천 옷차림: 계절에 맞는 겉옷과 편안한 캐주얼.");
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  };

  // Initial Fetch on Mount
  useEffect(() => {
    fetchWeather("Seoul");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    fetchWeather(cityInput.trim());
    setCityInput("");
  };

  // Determine App styling & background gradient based on weather conditions
  // Uses exactly a 3:7 ratio gradient of sky-blue and white as requested
  const getThemeStyles = () => {
    const skyWhiteGradient = "from-sky-200 via-white via-[30%] to-white";
    
    if (!weather) return {
      gradient: skyWhiteGradient,
      accent: "text-indigo-600 bg-slate-100",
      border: "border-slate-200",
      pillColor: "bg-indigo-500",
      glow: "shadow-indigo-500/5",
      darkText: "text-slate-800"
    };
    
    const conditionText = weather.current.condition.text;
    
    if (conditionText.includes("맑음") || conditionText.includes("쾌청")) {
      return {
        gradient: skyWhiteGradient,
        accent: "text-amber-700 bg-amber-50",
        border: "border-amber-200/50",
        pillColor: "bg-amber-500",
        glow: "shadow-amber-500/10",
        darkText: "text-slate-800"
      };
    } else if (conditionText.includes("비") || conditionText.includes("소나기") || conditionText.includes("이슬비")) {
      return {
        gradient: skyWhiteGradient,
        accent: "text-blue-700 bg-blue-50",
        border: "border-blue-200/50",
        pillColor: "bg-blue-500",
        glow: "shadow-blue-500/10",
        darkText: "text-slate-800"
      };
    } else if (conditionText.includes("눈") || conditionText.includes("진눈깨비")) {
      return {
        gradient: skyWhiteGradient,
        accent: "text-sky-700 bg-sky-50",
        border: "border-sky-200/50",
        pillColor: "bg-sky-500",
        glow: "shadow-sky-500/10",
        darkText: "text-slate-800"
      };
    } else if (conditionText.includes("구름") || conditionText.includes("흐림")) {
      return {
        gradient: skyWhiteGradient,
        accent: "text-slate-700 bg-slate-100",
        border: "border-slate-300/50",
        pillColor: "bg-slate-500",
        glow: "shadow-slate-500/10",
        darkText: "text-slate-800"
      };
    } else if (conditionText.includes("천둥") || conditionText.includes("번개")) {
      return {
        gradient: skyWhiteGradient,
        accent: "text-purple-700 bg-purple-50",
        border: "border-purple-200/50",
        pillColor: "bg-purple-500",
        glow: "shadow-purple-500/10",
        darkText: "text-slate-800"
      };
    }
    
    return {
      gradient: skyWhiteGradient,
      accent: "text-indigo-600 bg-slate-100",
      border: "border-slate-200",
      pillColor: "bg-indigo-500",
      glow: "shadow-indigo-500/5",
      darkText: "text-slate-800"
    };
  };

  const theme = getThemeStyles();

  // Helper for Air Quality levels
  const getAirQualityStatus = (pm25: number, type: "pm25" | "pm10") => {
    const limit = type === "pm25" ? { good: 15, bad: 35 } : { good: 30, bad: 80 };
    if (pm25 <= limit.good) return { text: "좋음", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" };
    if (pm25 <= limit.bad) return { text: "보통", color: "text-amber-700 bg-amber-50 border-amber-200/80", dot: "bg-amber-500" };
    return { text: "나쁨", color: "text-rose-700 bg-rose-50 border-rose-200", dot: "bg-rose-500" };
  };

  // Helper for UV Index warnings
  const getUvStatus = (uv: number) => {
    if (uv <= 2) return { text: "낮음", color: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "w-1/5 bg-emerald-500" };
    if (uv <= 5) return { text: "보통", color: "text-amber-700 bg-amber-50 border-amber-200/80", bar: "w-2/5 bg-amber-500" };
    if (uv <= 7) return { text: "높음", color: "text-orange-700 bg-orange-50 border-orange-200", bar: "w-3/5 bg-orange-500" };
    if (uv <= 10) return { text: "매우 높음", color: "text-rose-700 bg-rose-50 border-rose-200", bar: "w-4/5 bg-rose-500" };
    return { text: "위험", color: "text-purple-700 bg-purple-50 border-purple-200", bar: "w-full bg-purple-500" };
  };

  return (
    <div className={`min-h-screen font-sans text-slate-800 flex flex-col transition-all duration-700 bg-gradient-to-b ${theme.gradient} pb-12 relative overflow-hidden`}>
      
      {/* Visual background lights for emotional depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/40 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-15%] w-[60%] h-[60%] rounded-full bg-purple-400/5 blur-[150px] pointer-events-none" />

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex-1 flex flex-col pt-6 z-10">
        
        {/* Header Area */}
        <header id="app-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl glass-panel flex items-center justify-center border border-slate-200/50 text-slate-700`}>
              <Sun className="h-6 w-6 text-amber-500 animate-spin-slow cursor-pointer" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                오늘의 날씨
                <span className="text-xs font-normal bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">실시간 기상 브리핑</span>
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                실시간 한국 현지 시간 <span className="font-mono font-semibold text-slate-700">{currentTime}</span>
              </p>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full md:w-80">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="도시명 검색 (예: 서울, Jeju, New York)"
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-slate-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent text-sm transition-all text-slate-800 placeholder-slate-400 shadow-md"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-2 top-2 p-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center justify-center shadow-sm"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </header>

        {/* Preset City Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" /> 자주 찾는 도시:
          </span>
          {presetCities.map((city) => (
            <button
              key={city.en}
              onClick={() => fetchWeather(city.en)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border cursor-pointer hover-freeze ${
                activeCity === city.ko || activeCity === city.en
                  ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-300 font-semibold"
                  : "bg-white/60 hover:bg-white text-slate-700 border-slate-200"
              }`}
            >
              {city.ko}
            </button>
          ))}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <div className="flex-1">
                <p className="font-semibold">오류가 발생했습니다</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
              <button 
                onClick={() => fetchWeather("Seoul")}
                className="px-3 py-1 bg-white hover:bg-rose-100/50 rounded-xl text-xs border border-rose-200 transition-colors"
              >
                서울 날씨로 초기화
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <Sun className="h-6 w-6 text-amber-500 absolute top-5 left-5 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-500 mt-5 animate-pulse">실시간 기상 기지국 연결 중...</p>
          </div>
        ) : (
          weather && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Current Weather & Forecast (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Main Weather Bento Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl p-6 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden text-slate-800"
                >
                  {/* Subtle Background Icon Accent */}
                  <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 pointer-events-none select-none">
                    <img 
                      src={weather.current.condition.icon} 
                      alt="" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Header info */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <MapPin className="h-6 w-6 text-amber-500" />
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          {getKoreanCityName(weather.location.name)}
                        </h2>
                        {weather.location.region && (
                          <span className="text-sm sm:text-base text-slate-500 font-medium ml-1">
                            ({weather.location.region})
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1.5 pl-1">
                        {formatKoreanDate(weather.forecast[0].date)} • {getKoreanWeekday(weather.forecast[0].date)}
                      </p>
                    </div>

                    {/* Provider Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                        weather.isDemo 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${weather.isDemo ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
                        {weather.isDemo ? "스마트 백업모드" : "WeatherAPI 실시간측정"}
                      </span>
                      {weather.isDemo && (
                        <p className="text-[9px] text-slate-400 text-right max-w-[150px]">
                          WeatherAPI 키 설정 시 실시간 대기 측정이 작동합니다.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Temperature & Large Icon */}
                  <div className="flex items-center justify-between my-6 relative z-10">
                    <div className="flex items-baseline">
                      <span className="text-7xl sm:text-8xl font-black tracking-tighter text-slate-800 font-mono">
                        {Math.round(weather.current.temp_c)}
                      </span>
                      <span className="text-4xl sm:text-5xl font-light text-slate-500 ml-1.5">°C</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <img
                        src={weather.current.condition.icon}
                        alt={weather.current.condition.text}
                        className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-sm sm:text-base font-bold text-slate-700 mt-1">
                        {weather.current.condition.text}
                      </span>
                    </div>
                  </div>

                  {/* Core stats grid */}
                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/85 relative z-10">
                    <div className="bg-slate-100/60 p-2.5 rounded-2xl border border-slate-200/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 font-medium">체감 온도</span>
                      <span className="text-sm font-bold text-slate-700 font-mono mt-0.5">
                        {Math.round(weather.current.feelslike_c)}°C
                      </span>
                    </div>
                    <div className="bg-slate-100/60 p-2.5 rounded-2xl border border-slate-200/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 font-medium">습도</span>
                      <span className="text-sm font-bold text-slate-700 font-mono mt-0.5">
                        {weather.current.humidity}%
                      </span>
                    </div>
                    <div className="bg-slate-100/60 p-2.5 rounded-2xl border border-slate-200/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 font-medium">풍속</span>
                      <span className="text-sm font-bold text-slate-700 font-mono mt-0.5">
                        {weather.current.wind_kph} km/h
                      </span>
                    </div>
                  </div>

                </motion.div>

                {/* 2. Horizontal Hourly Timeline (24 hours) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-3xl p-5 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 text-slate-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-500" />
                      시간대별 날씨 예보
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">2시간 간격</span>
                  </div>

                  {/* Horizontal Scroll wrapper */}
                  <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar select-none">
                    {weather.hourly.map((hr, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col items-center min-w-[64px] p-3 rounded-2xl border transition-all ${
                          hr.time.startsWith(new Date().getHours().toString()) || (new Date().getHours() % 2 === 0 && hr.time.startsWith((new Date().getHours() - 1).toString()))
                            ? "bg-slate-800 text-white border-slate-800 shadow-md font-bold"
                            : "bg-white/60 border-slate-200/60 hover:bg-white text-slate-700"
                        }`}
                      >
                        <span className="text-[11px] font-medium opacity-80">{hr.time}</span>
                        <img
                          src={hr.condition.icon}
                          alt={hr.condition.text}
                          className="w-10 h-10 my-1 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold font-mono">{Math.round(hr.temp_c)}°</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* Right Column: AI Assistant & Detailed Bento Stats (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Air Quality Bento Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-3xl p-5 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 text-slate-800"
                >
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
                    <Activity className="h-4 w-4 text-slate-500" />
                    대기 환경 지수 (미세먼지)
                  </h3>

                  {weather.current.air_quality ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* PM2.5 */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">초미세먼지 (PM2.5)</span>
                          {(() => {
                            const status = getAirQualityStatus(weather.current.air_quality.pm2_5, "pm25");
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${status.color}`}>
                                {status.text}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-bold font-mono text-slate-800">
                            {weather.current.air_quality.pm2_5}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">㎍/㎥</span>
                        </div>
                        <div className="w-full bg-slate-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              weather.current.air_quality.pm2_5 <= 15 ? "bg-emerald-500" : weather.current.air_quality.pm2_5 <= 35 ? "bg-amber-500" : "bg-rose-500"
                            }`} 
                            style={{ width: `${Math.min(100, (weather.current.air_quality.pm2_5 / 75) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* PM10 */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">미세먼지 (PM10)</span>
                          {(() => {
                            const status = getAirQualityStatus(weather.current.air_quality.pm10, "pm10");
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${status.color}`}>
                                {status.text}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-xl font-bold font-mono text-slate-800">
                            {weather.current.air_quality.pm10}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">㎍/㎥</span>
                        </div>
                        <div className="w-full bg-slate-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              weather.current.air_quality.pm10 <= 30 ? "bg-emerald-500" : weather.current.air_quality.pm10 <= 80 ? "bg-amber-500" : "bg-rose-500"
                            }`} 
                            style={{ width: `${Math.min(100, (weather.current.air_quality.pm10 / 150) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      대기 정보가 누락되었습니다.
                    </div>
                  )}
                </motion.div>

                {/* 2. Three-Day Forecast Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="rounded-3xl p-5 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 text-slate-800"
                >
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    주간 날씨 전망 (3일)
                  </h3>

                  <div className="space-y-3.5">
                    {weather.forecast.map((day, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/50 hover:bg-white/90 transition-colors border border-slate-200/60"
                      >
                        {/* Day Info */}
                        <div className="w-24">
                          <p className="text-xs font-bold text-slate-800">
                            {getKoreanWeekday(day.date)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatKoreanDate(day.date)}
                          </p>
                        </div>

                        {/* Weather Text and icon */}
                        <div className="flex items-center gap-1.5 flex-1 justify-center sm:justify-start sm:pl-6">
                          <img
                            src={day.condition.icon}
                            alt={day.condition.text}
                            className="w-8 h-8 object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs text-slate-600 hidden sm:inline">
                            {day.condition.text}
                          </span>
                        </div>

                        {/* Rain Probability Progress */}
                        <div className="flex items-center gap-3 w-36 justify-end">
                          <div className="text-right">
                            {day.chance_of_rain > 0 ? (
                              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                ☔ {day.chance_of_rain}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">강수 없음</span>
                            )}
                          </div>
                          
                          {/* Min/Max Temps */}
                          <div className="flex items-center gap-1 text-xs font-mono font-bold w-12 justify-end">
                            <span className="text-rose-500">{Math.round(day.max_temp)}°</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-blue-500">{Math.round(day.min_temp)}°</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* 3. Bento Details grid (UV, Humidity, Wind Details) */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* UV index card */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="p-4 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-32 text-slate-800"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Sun className="h-3.5 w-3.5 text-amber-500" /> 자외선 지수
                      </span>
                      {(() => {
                        const status = getUvStatus(weather.current.uv);
                        return (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status.color}`}>
                            {status.text}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="mt-3">
                      <span className="text-2xl font-bold font-mono text-slate-800">
                        {weather.current.uv}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden mt-1 relative">
                      <div className={`h-full rounded-full ${getUvStatus(weather.current.uv).bar}`} />
                    </div>
                  </motion.div>

                  {/* Humidity detail */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="p-4 glass-panel border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-32 text-slate-800"
                  >
                    <div className="flex items-center text-slate-500">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" /> 습도 측정
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-baseline">
                      <span className="text-2xl font-bold font-mono text-slate-800">
                        {weather.current.humidity}
                      </span>
                      <span className="text-xs text-slate-400 ml-0.5">%</span>
                    </div>

                    <p className="text-[10px] text-slate-600 mb-1">
                      {weather.current.humidity < 40 
                        ? "🥵 건조함 - 보습 필요" 
                        : weather.current.humidity <= 60 
                          ? "😌 쾌적함 - 완벽한 상태" 
                          : "💦 다소 다습 - 에어컨 권장"}
                    </p>
                  </motion.div>

                </div>

              </div>

            </div>
          )
        )}
      </div>

      {/* Humble aesthetic credits footer as requested */}
      <footer className="w-full py-8 text-center text-[11px] text-slate-500 font-medium z-10 select-none mt-auto">
        <p>© 2026 오늘의 날씨 브리핑 • Powered by WeatherAPI & Open-Meteo Fallback Engine</p>
        <p className="text-[10px] text-slate-400 mt-1">Google AI Studio Build로 설계되었습니다.</p>
      </footer>

    </div>
  );
}
