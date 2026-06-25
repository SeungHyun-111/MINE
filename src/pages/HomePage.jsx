import { lazy, Suspense, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'

const SummaryPage = lazy(() => import('@/pages/SummaryPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const TodoPage = lazy(() => import('@/pages/TodoPage'))
const WeatherPage = lazy(() => import('@/pages/WeatherPage'))
const MemoPage = lazy(() => import('@/pages/MemoPage'))
const EuphonyPage = lazy(() => import('@/pages/EuphonyPage'))
const RoutinePage = lazy(() => import('@/pages/RoutinePage'))

function PageFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#f4f7f7]">
      <div className="h-8 w-8 rounded-full border-4 border-[#79a8a9] border-t-transparent animate-spin" />
    </div>
  )
}

export default function HomePage() {
  const [page, setPage] = useState('summary')

  const renderPage = () => {
    switch (page) {
      case 'summary': return <SummaryPage />
      case 'calendar': return <CalendarPage />
      case 'todo': return <TodoPage />
      case 'weather': return <WeatherPage />
      case 'memo': return <MemoPage />
      case 'routine': return <RoutinePage />
      case 'euphony': return <EuphonyPage />
      case 'settings': return <div className="p-4 text-[#789094]">설정 준비 중...</div>
      default: return <SummaryPage />
    }
  }

  return (
    <AppLayout page={page} onPageChange={setPage}>
      <Suspense fallback={<PageFallback />}>
        {renderPage()}
      </Suspense>
    </AppLayout>
  )
}
