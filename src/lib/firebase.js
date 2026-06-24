import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  initializeAuth,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyCe_YkgKzLvZ8ooxgjZtfPliPRNg_fGXxk",
  authDomain: "psmine-ad9cc.firebaseapp.com",
  projectId: "psmine-ad9cc",
  storageBucket: "psmine-ad9cc.firebasestorage.app",
  messagingSenderId: "993698794007",
  appId: "1:993698794007:web:54e58ba0e7ff54c2f42a52",
  databaseURL: "https://psmine-ad9cc-default-rtdb.asia-southeast1.firebasedatabase.app",
}

const app = initializeApp(firebaseConfig)

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
})
export const db = getDatabase(app)
export const functions = getFunctions(app)

export function createGoogleProvider({ forceConsent = false } = {}) {
  const provider = new GoogleAuthProvider()

  if (forceConsent) {
    provider.setCustomParameters({ prompt: 'select_account' })
  }

  return provider
}
