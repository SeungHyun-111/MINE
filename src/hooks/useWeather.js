import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { DEFAULT_WEATHER_LOCATION, fetchWeatherBundle } from '@/lib/weatherApi'

const WEATHER_REFRESH_INTERVAL_MS = 8 * 60 * 60 * 1000

function fetchedTime(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  return 0
}

function safeKey(value) {
  return String(value || 'unknown').replace(/[.#$/[\]]/g, '_')
}

export function useWeather() {
  const { user } = useAuth()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [cacheChecked, setCacheChecked] = useState(false)
  const refreshInFlight = useRef(false)
  const autoRefreshStarted = useRef(false)

  const basePath = useMemo(() => (user ? `users/${user.uid}` : null), [user])
  const latestRef = useMemo(() => (basePath ? ref(db, `${basePath}/weather/latest`) : null), [basePath])

  useEffect(() => {
    if (!latestRef) {
      setWeather(null)
      setCacheLoading(false)
      setCacheChecked(true)
      return undefined
    }

    setCacheLoading(true)
    return onValue(
      latestRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setWeather(snapshot.val())
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
    if (!basePath || !latestRef) return null
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
      const data = await fetchWeatherBundle(DEFAULT_WEATHER_LOCATION)
      const fetchedAt = Date.now()
      const archiveId = safeKey([
        data.location.name,
        data.baseTimes.ultra.baseDate,
        data.baseTimes.ultra.baseTime,
        data.baseTimes.vilage.baseDate,
        data.baseTimes.vilage.baseTime,
        data.baseTimes.mid,
      ].join('_'))
      const payload = {
        ...data,
        fetchedAt,
        updatedAt: serverTimestamp(),
      }
      const updates = {
        [`${basePath}/weather/latest`]: payload,
        [`${basePath}/weatherArchive/${archiveId}`]: {
          ...payload,
          source: 'bundle',
          archiveId,
          archivedAt: serverTimestamp(),
        },
      }

      data.hourly.forEach((item) => {
        updates[`${basePath}/weatherShortHourly/${safeKey(`${item.date}_${item.time}`)}`] = {
          ...item,
          location: data.location,
          source: 'short',
          baseTimes: data.baseTimes,
          updatedAt: serverTimestamp(),
        }
      })

      data.daily.forEach((item) => {
        updates[`${basePath}/weatherShortDaily/${safeKey(item.date)}`] = {
          ...item,
          location: data.location,
          source: 'short',
          baseTimes: data.baseTimes,
          updatedAt: serverTimestamp(),
        }
      })

      data.midTerm.forEach((item) => {
        updates[`${basePath}/weatherMidForecasts/${safeKey(item.date)}`] = {
          ...item,
          location: data.location,
          source: 'mid',
          baseTimes: data.baseTimes,
          updatedAt: serverTimestamp(),
        }
      })

      await update(ref(db), updates)
      await set(push(ref(db, `${basePath}/weatherSnapshots`)), payload)
      setWeather(payload)
      setSaveStatus('saved')
      setError(data.apiErrors?.length ? data.apiErrors.map((item) => `${item.source}: ${item.message}`).join(' / ') : null)
      return payload
    } catch (e) {
      console.error(e)
      setSaveStatus('error')
      setError(`날씨 데이터 RTDB 저장/갱신 실패: ${e.message}`)
      return null
    } finally {
      refreshInFlight.current = false
      setLoading(false)
    }
  }, [basePath, latestRef, weather])

  useEffect(() => {
    if (cacheChecked && !weather && !loading && !error && !autoRefreshStarted.current) {
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
