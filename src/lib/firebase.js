import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCe_YkgKzLvZ8ooxgjZtfPliPRNg_fGXxk",
  authDomain: "psmine-ad9cc.firebaseapp.com",
  projectId: "psmine-ad9cc",
  storageBucket: "psmine-ad9cc.firebasestorage.app",
  messagingSenderId: "993698794007",
  appId: "1:993698794007:web:54e58ba0e7ff54c2f42a52",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/calendar')
googleProvider.setCustomParameters({ prompt: 'consent' })
