import { useEffect } from 'react'
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import useAuthStore from '@/store/authStore'

const TOKEN_KEY = 'gcal_access_token'

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    let unsubscribe = () => {}

    // getRedirectResult 완료 후에 onAuthStateChanged 시작
    // (먼저 실행되면 user=null로 로그인 화면이 잠깐 보이는 문제 방지)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result)
          if (credential?.accessToken) {
            sessionStorage.setItem(TOKEN_KEY, credential.accessToken)
            setAccessToken(credential.accessToken)
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user)
          if (user) {
            const saved = sessionStorage.getItem(TOKEN_KEY)
            if (saved) setAccessToken(saved)
          } else {
            sessionStorage.removeItem(TOKEN_KEY)
            setAccessToken(null)
          }
        })
      })

    return () => unsubscribe()
  }, [setUser, setAccessToken])
}

export function useAuth() {
  const { user, loading, accessToken } = useAuthStore()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  const login = () => signInWithRedirect(auth, googleProvider)
  const reconnectCalendar = login

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    signOut(auth)
  }

  return { user, loading, accessToken, login, logout, reconnectCalendar }
}
