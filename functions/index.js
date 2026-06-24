import crypto from 'node:crypto'
import admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

admin.initializeApp()

const db = admin.firestore()
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3'
const callableOptions = {
  cors: [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^https:\/\/psmine-ad9cc\.web\.app$/,
    /^https:\/\/psmine-ad9cc\.firebaseapp\.com$/,
  ],
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new HttpsError('failed-precondition', `${name} is not configured`)
  }
  return value
}

function getOAuthConfig() {
  return {
    clientId: requiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirectUri: requiredEnv('GOOGLE_OAUTH_REDIRECT_URI'),
    appUrl: process.env.APP_URL || 'http://localhost:5173',
  }
}

function assertAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Login is required')
  }

  return request.auth.uid
}

async function readJsonResponse(res) {
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.error?.message || data?.error_description || res.statusText
    throw new HttpsError('internal', message, data)
  }

  return data
}

async function refreshAccessToken(uid) {
  const { clientId, clientSecret } = getOAuthConfig()
  const tokenRef = db.doc(`users/${uid}/integrations/googleCalendar`)
  const snapshot = await tokenRef.get()
  const refreshToken = snapshot.data()?.refreshToken

  if (!refreshToken) {
    throw new HttpsError('failed-precondition', 'Google Calendar is not connected')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const data = await readJsonResponse(await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }))

  await tokenRef.set({
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    tokenExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (data.expires_in || 3600) * 1000),
  }, { merge: true })

  return data.access_token
}

async function calendarFetch(uid, path, options = {}) {
  const accessToken = await refreshAccessToken(uid)
  const res = await fetch(`${GOOGLE_CALENDAR_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  return readJsonResponse(res)
}

export const getCalendarConnectUrl = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const { clientId, redirectUri } = getOAuthConfig()
  const appUrl = request.data?.appUrl || process.env.APP_URL || 'http://localhost:5173'
  const state = crypto.randomBytes(24).toString('hex')

  await db.doc(`oauthStates/${state}`).set({
    uid,
    appUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: CALENDAR_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  })

  return { url: `${GOOGLE_AUTH_URL}?${params}` }
})

export const calendarOAuthCallback = onRequest(async (req, res) => {
  const code = req.query.code?.toString()
  const state = req.query.state?.toString()

  try {
    const { clientId, clientSecret, redirectUri, appUrl: defaultAppUrl } = getOAuthConfig()

    if (!code || !state) {
      throw new Error('Missing OAuth code or state')
    }

    const stateRef = db.doc(`oauthStates/${state}`)
    const stateSnapshot = await stateRef.get()
    const stateData = stateSnapshot.data()

    if (!stateData?.uid) {
      throw new Error('Invalid OAuth state')
    }

    if (stateData.expiresAt?.toMillis() < Date.now()) {
      throw new Error('Expired OAuth state')
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    })

    const tokenData = await readJsonResponse(await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }))

    if (!tokenData.refresh_token) {
      throw new Error('Google did not return a refresh token. Revoke app access and connect again.')
    }

    await db.doc(`users/${stateData.uid}/integrations/googleCalendar`).set({
      refreshToken: tokenData.refresh_token,
      scope: tokenData.scope || CALENDAR_SCOPE,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tokenExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (tokenData.expires_in || 3600) * 1000),
    }, { merge: true })
    await stateRef.delete()

    res.redirect(`${stateData.appUrl || defaultAppUrl}?calendarConnected=1`)
  } catch (error) {
    logger.error(error)
    const message = encodeURIComponent(error.message || 'Calendar connection failed')
    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    res.redirect(`${appUrl}?calendarError=${message}`)
  }
})

export const getCalendarConnectionStatus = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const snapshot = await db.doc(`users/${uid}/integrations/googleCalendar`).get()
  return { connected: snapshot.exists && !!snapshot.data()?.refreshToken }
})

export const listCalendarCalendars = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const data = await calendarFetch(uid, '/users/me/calendarList')
  return { items: data.items || [] }
})

export const listCalendarEvents = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const { calendarId, timeMin, timeMax } = request.data || {}

  if (!calendarId || !timeMin || !timeMax) {
    throw new HttpsError('invalid-argument', 'calendarId, timeMin, and timeMax are required')
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const data = await calendarFetch(uid, `/calendars/${encodeURIComponent(calendarId)}/events?${params}`)
  return { items: data.items || [] }
})

export const createCalendarEvent = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const { event } = request.data || {}

  if (!event?.summary || !event?.start || !event?.end) {
    throw new HttpsError('invalid-argument', 'event summary, start, and end are required')
  }

  return calendarFetch(uid, '/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
})

export const updateCalendarEvent = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const { calendarId, eventId, event } = request.data || {}

  if (!calendarId || !eventId || !event) {
    throw new HttpsError('invalid-argument', 'calendarId, eventId, and event are required')
  }

  return calendarFetch(uid, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  })
})

export const deleteCalendarEvent = onCall(callableOptions, async (request) => {
  const uid = assertAuth(request)
  const { calendarId, eventId } = request.data || {}

  if (!calendarId || !eventId) {
    throw new HttpsError('invalid-argument', 'calendarId and eventId are required')
  }

  await calendarFetch(uid, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  })

  return { ok: true }
})
