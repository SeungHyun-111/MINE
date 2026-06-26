import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronRight, RefreshCw, Star } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'

const CITY_WEATHER = [
  { city: '백령', temp: '23.2', tone: 'partly', x: 13, y: 29 },
  { city: '서울', temp: '27.8', tone: 'cloud', x: 38, y: 23 },
  { city: '춘천', temp: '27.8', tone: 'rain', x: 49, y: 18 },
  { city: '강릉', temp: '22.7', tone: 'sun', x: 70, y: 24 },
  { city: '수원', temp: '26.9', tone: 'partly', x: 38, y: 31 },
  { city: '청주', temp: '25.0', tone: 'rain', x: 49, y: 40 },
  { city: '대전', temp: '23.6', tone: 'cloud', x: 46, y: 49 },
  { city: '전주', temp: '25.4', tone: 'cloud', x: 39, y: 60 },
  { city: '광주', temp: '24.8', tone: 'cloud', x: 34, y: 71 },
  { city: '목포', temp: '23.7', tone: 'cloud', x: 25, y: 79 },
  { city: '대구', temp: '23.0', tone: 'cloud', x: 63, y: 63 },
  { city: '울산', temp: '19.7', tone: 'cloud', x: 75, y: 69 },
  { city: '부산', temp: '21.8', tone: 'cloud', x: 70, y: 76 },
  { city: '여수', temp: '22.6', tone: 'cloud', x: 51, y: 77 },
  { city: '제주', temp: '21.4', tone: 'rain', x: 31, y: 92 },
  { city: '울릉/독도', temp: '20.7', tone: 'partly', x: 88, y: 35 },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function weatherTone(text = '') {
  if (text.includes('비') || text.includes('소나기')) return 'rain'
  if (text.includes('눈')) return 'snow'
  if (text.includes('흐림')) return 'cloud'
  if (text.includes('구름')) return 'partly'
  return 'sun'
}

function WeatherIcon({ tone = 'sun', size = 'md' }) {
  const scale = {
    xs: 'h-5 w-7',
    sm: 'h-7 w-9',
    md: 'h-12 w-16',
    lg: 'h-20 w-28',
  }[size]

  if (tone === 'sun') {
    return (
      <div className={`${scale} relative shrink-0`}>
        <div className="absolute left-1/2 top-1/2 h-2/3 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffc400]" />
      </div>
    )
  }

  if (tone === 'rain') {
    return (
      <div className={`${scale} relative shrink-0`}>
        <div className="absolute left-[18%] top-[22%] h-[42%] w-[58%] rounded-full bg-[#aabbdd]" />
        <div className="absolute left-[36%] top-[10%] h-[48%] w-[45%] rounded-full bg-[#d5e8ff]" />
        <div className="absolute left-[48%] top-[68%] h-[22%] w-[7%] rotate-12 rounded-full bg-[#4c8ee8]" />
        <div className="absolute left-[66%] top-[64%] h-[22%] w-[7%] rotate-12 rounded-full bg-[#4c8ee8]" />
      </div>
    )
  }

  if (tone === 'snow') {
    return (
      <div className={`${scale} relative shrink-0`}>
        <div className="absolute left-[18%] top-[24%] h-[42%] w-[58%] rounded-full bg-[#aabbdd]" />
        <div className="absolute left-[36%] top-[12%] h-[48%] w-[45%] rounded-full bg-[#d5e8ff]" />
        <div className="absolute left-[48%] top-[70%] text-[#4c8ee8]">*</div>
        <div className="absolute left-[66%] top-[66%] text-[#4c8ee8]">*</div>
      </div>
    )
  }

  if (tone === 'partly') {
    return (
      <div className={`${scale} relative shrink-0`}>
        <div className="absolute left-[10%] top-[18%] h-[42%] aspect-square rounded-full bg-[#ffc400]" />
        <div className="absolute left-[26%] top-[38%] h-[36%] w-[54%] rounded-full bg-[#aabbdd]" />
        <div className="absolute left-[44%] top-[26%] h-[44%] w-[42%] rounded-full bg-[#d5e8ff]" />
      </div>
    )
  }

  return (
    <div className={`${scale} relative shrink-0`}>
      <div className="absolute left-[12%] top-[36%] h-[38%] w-[60%] rounded-full bg-[#aabbdd]" />
      <div className="absolute left-[34%] top-[22%] h-[48%] w-[48%] rounded-full bg-[#d5e8ff]" />
    </div>
  )
}

function todayLabel() {
  return format(new Date(), 'MM.dd', { locale: ko })
}

function formatFetchedAt(value) {
  if (!value) return '-'
  return format(new Date(value), 'M월 d일 HH:mm', { locale: ko })
}

function formatShortDate(date) {
  if (!date) return '-'
  return `${date.slice(4, 6)}.${date.slice(6, 8)}`
}

function weekdayFromDate(date) {
  if (!date) return '-'
  const normalized = date.includes('-') ? date : `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
  const value = new Date(`${normalized}T00:00:00`)
  return WEEKDAYS[value.getDay()] || '-'
}

function mergeWeek(shortDaily = [], midTerm = []) {
  const shortDates = new Set(shortDaily.map((item) => item.date))
  const midAsDaily = midTerm
    .filter((item) => !shortDates.has(item.date.replaceAll('-', '')))
    .map((item) => ({
      date: item.date.replaceAll('-', ''),
      label: item.date.slice(5).replace('-', '.'),
      minTemp: item.minTemp,
      maxTemp: item.maxTemp,
      pop: item.rnAm || item.rnPm || '-',
      sky: item.am || item.pm || '-',
      am: item.am,
      pm: item.pm,
      rnAm: item.rnAm,
      rnPm: item.rnPm,
      source: 'mid',
    }))

  return [...shortDaily.map((item) => ({ ...item, source: 'short' })), ...midAsDaily].slice(0, 10)
}

function getPeriodForecast(day, selectedPeriod) {
  if (!day) return null
  if (selectedPeriod === '오전') {
    return {
      sky: day.am || day.sky || '-',
      pop: day.rnAm || day.pop || '-',
    }
  }
  if (selectedPeriod === '오후') {
    return {
      sky: day.pm || day.sky || '-',
      pop: day.rnPm || day.pop || '-',
    }
  }
  return {
    sky: day.sky || day.am || day.pm || '-',
    pop: day.pop || day.rnAm || day.rnPm || '-',
  }
}

function getCityPeriodForecast(city, selectedDate, selectedPeriod) {
  const day = city.daily?.find((item) => item.date === selectedDate)
  const forecast = getPeriodForecast(day, selectedPeriod)
  if (selectedPeriod === '현재') {
    return {
      sky: city.current?.sky || forecast?.sky || '-',
      pop: forecast?.pop || '-',
      temp: city.current?.temp,
    }
  }

  return {
    sky: forecast?.sky || city.current?.sky || '-',
    pop: forecast?.pop || '-',
    temp: null,
    minTemp: day?.minTemp,
    maxTemp: day?.maxTemp,
  }
}

function parseSunTime(value) {
  if (!/^\d{4}$/.test(value || '')) return null
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(2, 4))
}

function sunArcPosition(sunrise, sunset) {
  const start = parseSunTime(sunrise)
  const end = parseSunTime(sunset)
  if (start == null || end == null || end <= start) {
    return { x: 120, y: 52 }
  }

  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  const progress = Math.min(Math.max((current - start) / (end - start), 0), 1)
  const angle = Math.PI * (1 - progress)

  return {
    x: 120 + Math.cos(angle) * 108,
    y: 98 - Math.sin(angle) * 86,
  }
}

function MetricBox({ label, value, sub, accent = false }) {
  return (
    <div className={`min-h-[60px] min-w-0 rounded-md border px-3 py-2.5 ${accent ? 'border-[#ff9b7b] bg-[#fff8f4]' : 'border-[#c0d5ee] bg-white/90'}`}>
      <p className={`truncate text-[11px] font-bold leading-tight ${accent ? 'text-[#ff5f36]' : 'text-[#1a2e4a]'}`}>{label}</p>
      <p className="mt-1 truncate text-[15px] font-black leading-none text-black">{value}</p>
      {sub && <p className="mt-1 truncate text-[10px] font-bold text-[#2d78e7]">{sub}</p>}
    </div>
  )
}

function HourlyForecast({ hourly, selectedHour, onSelectHour }) {
  const items = hourly.slice(0, 14)

  return (
    <section className="border-t border-[#c8ddff] pt-5">
      <div className="weather-scroll overflow-x-auto overflow-y-hidden pb-2">
        <div className="grid w-full min-w-[674px] grid-cols-[58px_repeat(14,minmax(44px,1fr))] text-center text-[11px]">
          <div className="flex items-start justify-center pt-1">
            <span className="rounded-full bg-[#3b3b3b] px-2 py-0.5 text-[10px] font-bold text-white">오늘</span>
          </div>
          {items.map((item, index) => (
            <button
              type="button"
              key={`time_${item.date}_${item.time}_${index}`}
              onClick={() => onSelectHour(`${item.date}_${item.time}`)}
              className={`border-l border-[#eef3ff] outline-none transition-colors ${selectedHour === `${item.date}_${item.time}` ? 'bg-[#f1f8ff]' : 'hover:bg-[#f5f9ff]'}`}
            >
              <p className="h-5 font-bold text-[#223355]">{item.time}</p>
              <div className="flex h-8 items-center justify-center">
                <WeatherIcon tone={weatherTone(item.sky)} size="xs" />
              </div>
              <p className="h-6 font-black text-black">{item.temp}°</p>
            </button>
          ))}

          <div className="mt-2 text-left text-[9px] leading-tight text-[#445588]">강수량<br/>㎜</div>
          {items.map((item, index) => (
            <p key={`rain_${item.date}_${item.time}_${index}`} className="mt-2 border-l border-[#eef3ff] text-[#c6cbd0]">0</p>
          ))}

          <div className="mt-2 text-left text-[10px] text-[#445588]">습도%</div>
          {items.map((item, index) => (
            <p key={`humidity_${item.date}_${item.time}_${index}`} className="mt-2 border-l border-[#eef3ff] font-medium text-[#2d78e7]">{item.humidity}</p>
          ))}

          <div className="mt-2 text-left text-[10px] text-[#445588]">바람㎧</div>
          {items.map((item, index) => (
            <div key={`wind_${item.date}_${item.time}_${index}`} className="mt-2 flex flex-col items-center border-l border-[#eef3ff] leading-tight">
              <p className="font-medium text-[#2d78e7]">{item.wind}</p>
              <p className="text-[10px] leading-none text-[#0055ff]">◂</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-[#c8ddff] pt-2 text-[11px] text-[#7b858d]">
        <span>날씨아이콘</span>
        <span>ⓘ</span>
        <span>시간별 예보 기준</span>
        <span>ⓘ</span>
      </div>
    </section>
  )
}

function WeeklyForecast({ daily, selectedDate, onSelectDate }) {
  const featured = daily.slice(0, 2)
  const rest = daily.slice(2, 8)

  return (
    <section className="border-t border-[#c8ddff] pt-6">
      <h2 className="mb-4 text-xl font-black text-black">주간예보 <span className="text-xs font-bold text-[#7799bb]">ⓘ</span></h2>
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        {featured.map((item, index) => (
          <button
            type="button"
            key={`featured_${item.date}`}
            onClick={() => onSelectDate(item.date)}
            className={`grid min-h-[54px] grid-cols-[52px_1fr_auto] items-center gap-2 rounded-md border px-4 text-left shadow-sm ${selectedDate === item.date ? 'border-[#99ccff] bg-[#f4faff]' : 'border-[#bbd0ee] bg-white/90 hover:bg-[#f5f9ff]'}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-black text-black">{index === 0 ? '오늘' : '내일'}</p>
              <p className="text-xs font-bold text-[#445588]">{formatShortDate(item.date)}</p>
            </div>
            <div className="flex min-w-0 items-center justify-center gap-1 text-xs font-bold">
              <span>오전</span>
              <WeatherIcon tone={weatherTone(item.sky)} size="xs" />
              <span className="text-[#2d78e7]">{item.pop}%</span>
              <span>오후</span>
              <WeatherIcon tone={weatherTone(item.sky)} size="xs" />
            </div>
            <p className="whitespace-nowrap text-sm font-black">
              <span className="text-[#1764d8]">{item.minTemp}°</span> / <span className="text-[#d92727]">{item.maxTemp}°</span>
            </p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-y-5 md:grid-cols-6">
        {rest.map((item) => (
          <button
            type="button"
            key={`rest_${item.date}`}
            onClick={() => onSelectDate(item.date)}
            className={`border-l border-[#eef3ff] px-2 text-center first:border-l-0 ${selectedDate === item.date ? 'rounded-md bg-[#f4faff]' : 'hover:bg-[#fafafa]'}`}
          >
            <p className={`text-sm font-black ${weekdayFromDate(item.date) === '일' ? 'text-red-500' : 'text-[#334477]'}`}>{weekdayFromDate(item.date)}</p>
            <p className="text-xs text-[#6688bb]">{formatShortDate(item.date)}</p>
            <div className="mt-3 flex justify-center">
              <WeatherIcon tone={weatherTone(item.sky)} size="sm" />
            </div>
            <p className="mt-2 text-sm font-black">
              <span className="text-[#1764d8]">{item.minTemp}°</span> / <span className="text-[#d92727]">{item.maxTemp}°</span>
            </p>
            <p className="mt-1 text-xs font-bold text-[#2d78e7]">{item.pop}%</p>
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-[#7b858d]">
        기상청은 자정에서 정오 전이 오전, 정오에서 자정 전이 오후이고, 해외 제공사는 일출부터 일몰 전이 낮, 일몰부터 일출 전이 밤입니다.
      </p>
    </section>
  )
}

function NationwideWeather({ daily, nationwide, selectedDate, selectedPeriod, onSelectDate, onSelectPeriod }) {
  const tabs = daily.slice(0, 7)
  const today = daily[0]?.date
  const isToday = !selectedDate || selectedDate === today
  const selectedDay = daily.find(d => d.date === selectedDate)
  const cities = nationwide?.cities?.length ? nationwide.cities : CITY_WEATHER
  const periods = isToday ? ['현재', '오전', '오후'] : ['오전', '오후']
  const activePeriod = periods.includes(selectedPeriod) ? selectedPeriod : periods[0]

  return (
    <section className="bg-white/90 px-6 py-6 xl:px-8">
      <h2 className="text-xl font-black text-black">전국날씨</h2>
      <div className="mt-5 flex justify-between text-center text-xs">
        {tabs.map((item, index) => (
          <button
            type="button"
            key={`tab_${item.date}`}
            onClick={() => {
              onSelectDate(item.date)
              if (item.date !== today && selectedPeriod === '현재') onSelectPeriod('오전')
            }}
            className={selectedDate === item.date ? 'font-black text-[#1578ff]' : 'font-bold text-[#334466] hover:text-[#1578ff]'}
          >
            <p>{weekdayFromDate(item.date)}</p>
            <p className={selectedDate === item.date ? 'border-b-2 border-[#1578ff] pb-2' : 'pb-2'}>{index === 0 ? '오늘' : formatShortDate(item.date)}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-md bg-[#7fc1ea] p-3">
        <div className="mb-2 inline-flex overflow-hidden rounded bg-white/90 text-xs font-black">
          {periods.map((label) => (
            <button
              type="button"
              key={label}
              onClick={() => onSelectPeriod(label)}
              className={`px-3 py-2 ${activePeriod === label ? 'bg-[#4aa9ef] text-white' : 'text-[#334477] hover:bg-[#eef7ff]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[287px] overflow-visible rounded-md">
          <img
            src="/korea-map.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain opacity-95 drop-shadow-sm"
          />
          {cities.map((item) => {
            const cityForecast = getCityPeriodForecast(item, selectedDay?.date || today, activePeriod)
            const tone = item.tone || weatherTone(cityForecast.sky)
            const tempLabel = cityForecast.temp != null
              ? `${cityForecast.temp}°`
              : cityForecast.minTemp && cityForecast.maxTemp
                ? `${cityForecast.minTemp}/${cityForecast.maxTemp}°`
                : ''

            return (
              <div
                key={item.city}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                <div className="flex scale-90 justify-center drop-shadow-sm">
                  <WeatherIcon tone={tone} size="sm" />
                </div>
                <p className="whitespace-nowrap rounded bg-white/75 px-1 text-[9px] font-black leading-tight text-[#002080] shadow-sm">
                  {item.city}{tempLabel ? ` ${tempLabel}` : ''}
                </p>
              </div>
            )
          })}
          {!nationwide?.cities?.length && (
            <div className="absolute inset-x-6 bottom-4 rounded-md border border-white/70 bg-white/90 px-3 py-2 text-center text-[11px] font-bold text-[#2244aa] shadow-sm">
              전국 데이터 갱신 전입니다. 새로고침하면 주요 지점별 예보를 불러옵니다.
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-[#54728b]">기상청 발표, 웨더아이 제공</p>
    </section>
  )
}

function SunTimeline({ sunriseSunset }) {
  const sunrise = sunriseSunset.sunrise || '-'
  const sunset = sunriseSunset.sunset || '-'
  const sun = sunArcPosition(sunrise, sunset)
  const remainingPath = `M${sun.x.toFixed(1)} ${sun.y.toFixed(1)} A108 86 0 0 1 228 98`

  return (
    <section className="border-t border-[#e5e5e5] bg-white/90 px-6 py-7 xl:px-6">
      <h2 className="mb-4 text-xl font-black text-black">일출일몰</h2>
      <div className="relative mx-auto h-[180px] max-w-[300px]">
        <svg className="absolute inset-x-0 top-0 mx-auto h-[110px] w-[240px]" viewBox="0 0 240 110" aria-hidden="true">
          <path d="M12 98 A108 86 0 0 1 228 98" fill="none" stroke="#f6b000" strokeWidth="5" strokeLinecap="round" />
          <path d={remainingPath} fill="none" stroke="#aabbdd" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
          <circle cx={sun.x} cy={sun.y} r="10" fill="#ffc21a" stroke="#ffd36a" strokeWidth="4" />
        </svg>
        <p className="absolute left-0 right-0 top-[64px] text-center text-sm font-black text-[#1a2e4a]">
          오늘<span className="ml-1 text-xs font-bold text-[#5577bb]">{todayLabel()}</span>
        </p>
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-3">
          <div className="text-center">
            <p className="text-xs font-black text-[#1a2e4a]">일출 ↑</p>
            <p className="text-2xl font-black leading-none text-[#001166]">{sunrise}</p>
            <p className="text-[10px] font-bold text-[#6688bb]">AM</p>
          </div>
          <div className="mb-4 h-8 w-px bg-[#d8dde2]" />
          <div className="text-center">
            <p className="text-xs font-black text-[#1a2e4a]">↓ 일몰</p>
            <p className="text-2xl font-black leading-none text-[#001166]">{sunset}</p>
            <p className="text-[10px] font-bold text-[#6688bb]">PM</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['내일', '모레'].map((label, index) => (
          <div key={label} className="rounded-md bg-[#f5f6f7] px-3 py-2 text-center">
            <p className="mb-1 text-xs font-black text-[#334477]">
              {label} <span className="font-bold text-[#7799bb]">{format(new Date(Date.now() + (index + 1) * 86400000), 'MM.dd', { locale: ko })}</span>
            </p>
            <p className="truncate text-xs font-bold text-[#001166]">
              ↑{sunrise} ↓{sunset}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#54728b]">기상청 발표, 웨더아이 제공 최종 업데이트</p>
    </section>
  )
}

export default function WeatherPage() {
  const { weather, loading, cacheLoading, error, saveStatus, forceRefresh, nextRefreshAt } = useWeather()
  const hourly = weather?.hourly || []
  const daily = mergeWeek(weather?.daily || [], weather?.midTerm || [])
  const nationwide = weather?.nationwide
  const current = weather?.current
  const tomorrow = daily[1]
  const sunriseSunset = weather?.sunriseSunset || {}
  const locationName = weather?.location?.name || '마포구 상암동'
  const [sourceOpen, setSourceOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState('기상청')
  const [selectedDate, setSelectedDate] = useState(daily[0]?.date || '')
  const [selectedPeriod, setSelectedPeriod] = useState('현재')
  const [selectedHour, setSelectedHour] = useState('')
  const activeDate = selectedDate || daily[0]?.date || ''

  return (
    // Intentionally deferring broader WeatherPage region/CSS cleanup for a later layout pass.
    <div data-weather-page className="min-h-full overflow-x-hidden bg-white/90 text-[#202124]">
      <div className="mx-auto flex min-h-full w-full max-w-[1600px] border-x border-[#e0e0e0] bg-white/90">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
          <div className="mb-5 flex items-center justify-between">
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSourceOpen((value) => !value)}
                className="rounded-full bg-[#0044cc] px-4 py-2 text-sm font-black text-white"
              >
                {selectedSource}⌄
              </button>
              {sourceOpen && (
                <div className="absolute left-0 top-11 z-20 w-36 overflow-hidden rounded-md border border-[#cfd7df] bg-white/90 text-sm font-bold shadow-lg">
                  {['기상청', '웨더아이'].map((label) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => {
                        setSelectedSource(label)
                        setSourceOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-[#f1f7fb]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setRegionOpen((value) => !value)}
                className="rounded-full border border-[#d8dde2] px-4 py-2 text-sm font-bold text-[#334488] hover:bg-[#f7fafc]"
              >
                ☆ 지역설정
              </button>
              {regionOpen && (
                <div className="absolute left-[150px] top-11 z-20 w-56 rounded-md border border-[#cfd7df] bg-white/90 p-3 text-xs font-bold text-[#334466] shadow-lg">
                  <p className="text-sm font-black text-[#202124]">{locationName}</p>
                  <p className="mt-1">현재 고정 지역입니다. 검색/즐겨찾기 연결은 다음 단계에서 붙입니다.</p>
                  <button
                    type="button"
                    onClick={() => setRegionOpen(false)}
                    className="mt-3 rounded bg-[#eff6fb] px-3 py-1.5 text-[#235f87]"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
            <div className="text-right">
              <button
                onClick={forceRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-[#eff6fb] px-3 py-2 text-xs font-black text-[#235f87] hover:bg-[#cce4ff] disabled:opacity-60"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                갱신
              </button>
              <p className="mt-1 text-[11px] font-bold text-[#6688bb]">
                RTDB {saveStatus === 'saving' ? '저장 중' : saveStatus === 'saved' ? '저장 완료' : saveStatus === 'error' ? '저장 실패' : '대기'}
              </p>
              <p className="text-[11px] font-bold text-[#6688bb]">
                마지막 갱신 {formatFetchedAt(weather?.fetchedAt)}
              </p>
            </div>
          </div>

          {cacheLoading && (
            <div className="mb-4 rounded-md border border-[#bbddff] bg-[#f5f9ff] px-4 py-3 text-sm font-bold text-[#4477cc]">
              Firebase에 저장된 날씨를 불러오는 중
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-[#f0b8b8] bg-[#fff2f2] px-4 py-3 text-sm font-bold text-[#8a3d3d]">
              {error}
            </div>
          )}

          <section className="pb-8">
            <div className="mb-5 flex items-center gap-2">
              <Star size={18} className="fill-[#c9ced3] text-[#c9ced3]" />
              <h1 className="text-2xl font-black text-[#1a2e4a]">{locationName}</h1>
              <span className="text-lg text-[#5577aa]">⊕</span>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_1px_1fr]">
              <div className="text-center">
                <span className="inline-block rounded-full border border-[#c0d5ee] px-3 py-1 text-sm font-black">현재 {todayLabel()}</span>
                <div className="mt-4 flex items-center justify-center gap-1">
                  <WeatherIcon tone={weatherTone(current?.sky)} size="lg" />
                  <p className="text-[58px] font-black leading-none tracking-tight text-black">{current?.temp || '-'}°</p>
                </div>
                <p className="mt-3 text-base font-black">{current?.sky || '-'}</p>
                <p className="text-sm font-bold text-[#334466]">
                  어제보다 0.6°↑ <span className="ml-2">최저{daily[0]?.minTemp || '-'}° · 최고{daily[0]?.maxTemp || '-'}°</span>
                </p>
              </div>

              <div className="hidden bg-[#bbccee] md:block" />

              <div className="text-center">
                <span className="inline-block rounded-full border border-[#c0d5ee] px-3 py-1 text-sm font-black">내일 {tomorrow?.label || '-'}</span>
                <div className="mt-6 flex items-end justify-center gap-2">
                  <div className="text-center text-xs font-bold text-[#5b6570]">
                    <p>최저</p>
                    <p className="text-4xl font-black text-black">{tomorrow?.minTemp || '-'}°</p>
                  </div>
                  <span className="text-4xl font-black">/</span>
                  <div className="text-center text-xs font-bold text-[#5b6570]">
                    <p>최고</p>
                    <p className="text-4xl font-black text-black">{tomorrow?.maxTemp || '-'}°</p>
                  </div>
                </div>
                <div className="mx-auto mt-4 max-w-[240px] border-t border-[#d5e8ff] pt-3 text-left text-sm font-bold">
                  <p>오전 <span className="text-[#334466]">{tomorrow?.sky || '-'}</span> <span className="text-[#145ed6]">{tomorrow?.pop || '-'}%</span></p>
                  <p>오후 <span className="text-[#334466]">{tomorrow?.sky || '-'}</span> <span className="text-[#145ed6]">{tomorrow?.pop || '-'}%</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <MetricBox label="체감" value={`${current?.temp || '-'}°`} />
              <MetricBox label="풍속" value={`${current?.wind || '-'}m/s`} />
              <MetricBox label="습도" value={`${current?.humidity || '-'}%`} />
              <MetricBox label="자외선지수" value="보통" sub="7 높음" />
              <MetricBox label="미세" value="좋음" sub="초미세 좋음" />
              <MetricBox label="일출" value={sunriseSunset.sunrise || '-'} sub={`일몰 ${sunriseSunset.sunset || '-'}`} />
            </div>
          </section>

          <HourlyForecast hourly={hourly} selectedHour={selectedHour} onSelectHour={setSelectedHour} />
          <WeeklyForecast daily={daily} selectedDate={activeDate} onSelectDate={setSelectedDate} />

          {nextRefreshAt && (
            <p className="mt-4 text-right text-[11px] font-bold text-[#7799bb]">
              다음 자동 갱신 {format(nextRefreshAt, 'M월 d일 HH:mm', { locale: ko })}
            </p>
          )}
        </main>

        <aside className="hidden w-[320px] shrink-0 border-l border-[#c8ddff] xl:block">
          <NationwideWeather
            daily={daily}
            nationwide={nationwide}
            selectedDate={activeDate}
            selectedPeriod={selectedPeriod}
            onSelectDate={setSelectedDate}
            onSelectPeriod={setSelectedPeriod}
          />
          <SunTimeline sunriseSunset={sunriseSunset} />
        </aside>
      </div>

      <div className="xl:hidden">
        <NationwideWeather
          daily={daily}
          nationwide={nationwide}
          selectedDate={activeDate}
          selectedPeriod={selectedPeriod}
          onSelectDate={setSelectedDate}
          onSelectPeriod={setSelectedPeriod}
        />
      </div>

      <button
        type="button"
        onClick={() => document.querySelector('[data-weather-page]')?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-8 right-8 hidden h-12 w-12 items-center justify-center rounded-full bg-[#0055ff] text-white shadow-lg lg:flex"
        aria-label="top"
      >
        <ChevronRight size={24} className="-rotate-90" />
      </button>
    </div>
  )
}
