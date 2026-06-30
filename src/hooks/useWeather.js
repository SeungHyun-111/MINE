import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onValue, ref, serverTimestamp, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { DEFAULT_WEATHER_LOCATION, fetchWeatherBundle } from '@/lib/weatherApi'

const WEATHER_REFRESH_INTERVAL_MS = 8 * 60 * 60 * 1000
const WEATHER_FAILURE_COOLDOWN_MS = 10 * 60 * 1000
const GLOBAL_WEATHER_PATH = 'weather/global/latest'

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
  return {
    ...data,
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

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [cacheChecked, setCacheChecked] = useState(false)
  const refreshInFlight = useRef(false)
  const autoRefreshStarted = useRef(false)

  const latestRef = useMemo(() => ref(db, GLOBAL_WEATHER_PATH), [])

  useEffect(() => {
    autoRefreshStarted.current = false
    setCacheChecked(false)
  }, [])

  useEffect(() => {
    setCacheLoading(true)
    return onValue(
      latestRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setWeather(normalizeWeather(snapshot.val()))
          setError(null)
        }
        setCacheLoading(false)
        setCacheChecked(true)
      },
      (e) => {
        console.error(e)
        setError(`RTDB 날씨 데이터 읽기 실패: ${e.message}`)
        setCacheLoading(false)
        setCacheChecked(true)
      }
    )
  }, [latestRef])

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
          const payload = {
            ...data,
            fetchedAt,
            updatedAt: serverTimestamp(),
          }

          // Shared weather cache: weather/global/latest
          await set(latestRef, payload)
          return payload
        })().finally(() => {
          sharedRefreshPromise = null
        })
      }

      const payload = await sharedRefreshPromise
      const apiErrors = payload.apiErrors || []

      setWeather(normalizeWeather({ ...payload, updatedAt: payload.fetchedAt }))
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
  }, [latestRef, weather])

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
