# Google Calendar OAuth setup

This app uses Firebase Auth for app login and Firebase Functions for Google Calendar access.
The frontend no longer stores Google Calendar access tokens.

## Google Cloud Console

Create or update an OAuth client:

- Application type: Web application
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - your Firebase Hosting URL
- Authorized redirect URIs:
  - `https://us-central1-psmine-ad9cc.cloudfunctions.net/calendarOAuthCallback`

Enable Google Calendar API on the same Google Cloud project.

## Firebase Functions environment

Copy `functions/.env.example` to `functions/.env` for local emulators and deployment.
Configure these values before running or deploying functions:

```txt
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
APP_URL
```

## Flow

1. User logs in with Firebase Auth.
2. User clicks Google Calendar connect.
3. Function creates a Google OAuth URL with `access_type=offline`.
4. Google redirects to `calendarOAuthCallback`.
5. Function stores the refresh token at `users/{uid}/integrations/googleCalendar`.
6. Frontend calls callable functions for calendar list, events, create, update, and delete.
