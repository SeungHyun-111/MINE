import { lazy, Suspense, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'

const SummaryPage = lazy(() => import('@/pages/SummaryPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const TodoPage = lazy(() => import('@/pages/TodoPage'))
const WeatherPage = lazy(() => import('@/pages/WeatherPage'))
const MemoPage = lazy(() => import('@/pages/MemoPage'))
const EuphonyPage = lazy(() => import('@/pages/EuphonyPage'))
const RoutinePage = lazy(() => import('@/pages/RoutinePage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const GamePage = lazy(() => import('@/pages/GamePage'))

function PageFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#f0f5ff]">
      <div className="h-8 w-8 rounded-full border-4 border-[#5588bb] border-t-transparent animate-spin" />
    </div>
  )
}

export default function HomePage() {
  const [page, setPage] = useState('summary')
  const [calendarFocus, setCalendarFocus] = useState(null)
  const [newsFocus, setNewsFocus] = useState(null)

  const openCalendarDate = (date) => {
    setCalendarFocus({ date, requestedAt: Date.now() })
    setPage('calendar')
  }

  const openNewsPage = (tab = 'seoul') => {
    setNewsFocus({ tab, requestedAt: Date.now() })
    setPage('news')
  }

  const renderPage = () => {
    switch (page) {
      case 'summary': return <SummaryPage onOpenCalendarDate={openCalendarDate} onOpenPage={setPage} onOpenNewsPage={openNewsPage} />
      case 'calendar': return <CalendarPage focusDate={calendarFocus?.date} focusKey={calendarFocus?.requestedAt} />
      case 'todo': return <TodoPage />
      case 'weather': return <WeatherPage />
      case 'memo': return <MemoPage />
      case 'routine': return <RoutinePage />
      case 'euphony': return <EuphonyPage />
      case 'news': return <NewsPage initialTab={newsFocus?.tab} focusKey={newsFocus?.requestedAt} />
      case 'game': return <GamePage />
      default: return <SummaryPage onOpenCalendarDate={openCalendarDate} onOpenPage={setPage} onOpenNewsPage={openNewsPage} />

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
