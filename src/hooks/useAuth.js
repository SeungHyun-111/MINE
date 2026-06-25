import { useEffect } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, createGoogleProvider } from '@/lib/firebase'
import useAuthStore from '@/store/authStore'

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    let unsubscribe = () => {}

    getRedirectResult(auth)
      .catch(console.error)
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user)
        })
      })

    return () => unsubscribe()
  }, [setUser])
}

export function useAuth() {
  const { user, loading } = useAuthStore()
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  const login = async ({ forceAccountSelect = false } = {}) => {
    setLoading(true)
    const provider = createGoogleProvider({ forceConsent: forceAccountSelect })

    try {
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
      return result
    } catch (error) {
      console.error(error)
      setLoading(false)
      throw error
    }
  }

  const logout = () => {
    signOut(auth)
  }

  return { user, loading, login, logout }
}
