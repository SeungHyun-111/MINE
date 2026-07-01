import { lazy, Suspense } from 'react'
import { useAuthListener, useAuth } from '@/hooks/useAuth'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))

function AppFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  useAuthListener()
  const { user, loading } = useAuth()

  if (loading) {
    return <AppFallback />
  }

  return (
    <Suspense fallback={<AppFallback />}>
      {user ? <HomePage /> : <LoginPage />}
    </Suspense>
  )
}
