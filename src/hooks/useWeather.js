import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onValue, ref, serverTimestamp, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { DEFAULT_WEATHER_LOCATION, fetchWeatherBundle } from '@/lib/weatherApi'

const WEATHER_REFRESH_INTERVAL_MS = 8 * 60 * 60 * 1000
const WEATHER_FAILURE_COOLDOWN_MS = 10 * 60 * 1000
const GLOBAL_WEATHER_PATH = 'weather/global'
const GLOBAL_WEATHER_LEGACY_PATH = `${GLOBAL_WEATHER_PATH}/latest`
const WEATHER_SUMMARY_KEYS = ['current', 'daily', 'sunriseSunset', 'location', 'meta']
const WEATHER_FULL_KEYS = ['current', 'hourly', 'daily', 'midTerm', 'nationwide', 'sunriseSunset', 'location', 'baseTimes', 'meta']

let sharedRefreshPromise = null
let lastRefreshFailedAt = 0

function fetchedTime(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  return 0
}

function isWeatherStale(weather) {
  const latestTime = fetchedTime(weather?.fetchedAt)
  return !latestTime || Date.now() - latestTime >= WEATHER_REFRESH_INTERVAL_MS
}

function isInFailureCooldown() {
  return lastRefreshFailedAt && Date.now() - lastRefreshFailedAt < WEATHER_FAILURE_COOLDOWN_MS
}

// Firebase RTDB stores arrays as numeric-keyed objects; normalize back to arrays
function toArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return Object.values(value)
}

function normalizeWeather(data) {
  if (!data) return data
  const meta = data.meta || {}
  const fetchedAt = data.fetchedAt ?? meta.fetchedAt
  const updatedAt = data.updatedAt ?? meta.updatedAt

  return {
    ...data,
    fetchedAt,
    updatedAt,
    hourly: toArray(data.hourly),
    daily: toArray(data.daily),
    midTerm: toArray(data.midTerm),
    nationwide: data.nationwide ? {
      ...data.nationwide,
      cities: toArray(data.nationwide.cities).map((city) => ({
        ...city,
        daily: toArray(city.daily),
      })),
    } : data.nationwide,
  }
}

function splitWeatherPayload(data, fetchedAt) {
  return {
    current: data.current || null,
    hourly: data.hourly || [],
    daily: data.daily || [],
    midTerm: data.midTerm || [],
    nationwide: data.nationwide || null,
    sunriseSunset: data.sunriseSunset || null,
    location: data.location || DEFAULT_WEATHER_LOCATION,
    baseTimes: data.baseTimes || null,
    meta: {
      fetchedAt,
      apiErrors: data.apiErrors || [],
      updatedAt: serverTimestamp(),
    },
  }
}

function composeWeather(parts) {
  if (!parts) return null
  const meta = parts.meta || {}

  return normalizeWeather({
    current: parts.current,
    hourly: parts.hourly,
    daily: parts.daily,
    midTerm: parts.midTerm,
    nationwide: parts.nationwide,
    sunriseSunset: parts.sunriseSunset,
    location: parts.location,
    baseTimes: parts.baseTimes,
    apiErrors: meta.apiErrors || parts.apiErrors || [],
    fetchedAt: meta.fetchedAt ?? parts.fetchedAt,
    updatedAt: meta.updatedAt ?? parts.updatedAt,
  })
}

export function useWeather({ scope = 'full' } = {}) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [cacheChecked, setCacheChecked] = useState(false)
  const refreshInFlight = useRef(false)
  const autoRefreshStarted = useRef(false)

  const weatherKeys = useMemo(() => (
    scope === 'summary' ? WEATHER_SUMMARY_KEYS : WEATHER_FULL_KEYS
  ), [scope])

  useEffect(() => {
    autoRefreshStarted.current = false
    setCacheChecked(false)
  }, [])

  useEffect(() => {
    setCacheLoading(true)
    const parts = {}
    const loaded = new Set()
    let hasSplitData = false
    let legacyLoaded = false
    let legacyWeather = null

    const commit = () => {
      if (hasSplitData) {
        setWeather(composeWeather(parts))
        setError(null)
        setCacheLoading(false)
        setCacheChecked(true)
        return
      }

      if (legacyLoaded) {
        if (legacyWeather) {
          setWeather(normalizeWeather(legacyWeather))
          setError(null)
        }
        setCacheLoading(false)
        setCacheChecked(true)
      }
    }

    const unsubs = weatherKeys.map((key) => onValue(
      ref(db, `${GLOBAL_WEATHER_PATH}/${key}`),
      (snapshot) => {
        if (snapshot.exists()) {
          hasSplitData = true
          parts[key] = snapshot.val()
        } else {
          delete parts[key]
        }
        loaded.add(key)
        if (loaded.size === weatherKeys.length) commit()
      },
      (e) => {
        console.error(e)
        setError(`RTDB 날씨 데이터 읽기 실패: ${e.message}`)
        setCacheLoading(false)
        setCacheChecked(true)
      }
    ))

    const legacyUnsub = onValue(
      ref(db, GLOBAL_WEATHER_LEGACY_PATH),
      (snapshot) => {
        legacyLoaded = true
        legacyWeather = snapshot.exists() ? snapshot.val() : null
        if (loaded.size === weatherKeys.length) commit()
      },
      (e) => {
        console.error(e)
      }
    )

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe())
      legacyUnsub()
    }
  }, [weatherKeys])

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (refreshInFlight.current) return null

    const latestTime = fetchedTime(weather?.fetchedAt)
    if (!force && latestTime && Date.now() - latestTime < WEATHER_REFRESH_INTERVAL_MS) {
      setError(null)
      return weather
    }

    refreshInFlight.current = true
    setLoading(true)
    setError(null)
    setSaveStatus('saving')

    try {
      if (!sharedRefreshPromise) {
        sharedRefreshPromise = (async () => {
          const data = await fetchWeatherBundle(DEFAULT_WEATHER_LOCATION)
          const fetchedAt = Date.now()
          const payload = splitWeatherPayload(data, fetchedAt)

          await update(ref(db), {
            [`${GLOBAL_WEATHER_PATH}/current`]: payload.current,
            [`${GLOBAL_WEATHER_PATH}/hourly`]: payload.hourly,
            [`${GLOBAL_WEATHER_PATH}/daily`]: payload.daily,
            [`${GLOBAL_WEATHER_PATH}/midTerm`]: payload.midTerm,
            [`${GLOBAL_WEATHER_PATH}/nationwide`]: payload.nationwide,
            [`${GLOBAL_WEATHER_PATH}/sunriseSunset`]: payload.sunriseSunset,
            [`${GLOBAL_WEATHER_PATH}/location`]: payload.location,
            [`${GLOBAL_WEATHER_PATH}/baseTimes`]: payload.baseTimes,
            [`${GLOBAL_WEATHER_PATH}/meta`]: payload.meta,
          })
          return payload
        })().finally(() => {
          sharedRefreshPromise = null
        })
      }

      const payload = await sharedRefreshPromise
      const apiErrors = payload.meta?.apiErrors || []

      setWeather(composeWeather({ ...payload, meta: { ...payload.meta, updatedAt: payload.meta.fetchedAt } }))
      setSaveStatus('saved')
      setError(apiErrors.length ? apiErrors.map((e) => `${e.source}: ${e.message}`).join(' / ') : null)
      return payload
    } catch (e) {
      console.error(e)
      lastRefreshFailedAt = Date.now()
      setSaveStatus('error')
      setError(`날씨 갱신 실패: ${e.message}`)
      return null
    } finally {
      refreshInFlight.current = false
      setLoading(false)
    }
  }, [weather])

  useEffect(() => {
    if (cacheChecked && !loading && !error && !autoRefreshStarted.current && !isInFailureCooldown() && isWeatherStale(weather)) {
      autoRefreshStarted.current = true
      refresh()
    }
  }, [cacheChecked, weather, loading, error, refresh])

  return {
    weather,
    loading,
    cacheLoading,
    error,
    saveStatus,
    refresh,
    forceRefresh: () => refresh({ force: true }),
    nextRefreshAt: weather?.fetchedAt ? new Date(fetchedTime(weather.fetchedAt) + WEATHER_REFRESH_INTERVAL_MS) : null,
  }
}
