import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import SummaryPage from '@/pages/SummaryPage'
import CalendarPage from '@/pages/CalendarPage'
import TodoPage from '@/pages/TodoPage'
import WeatherPage from '@/pages/WeatherPage'

export default function HomePage() {
  const [page, setPage] = useState('summary')

  const renderPage = () => {
    switch (page) {
      case 'summary': return <SummaryPage />
      case 'calendar': return <CalendarPage />
      case 'todo': return <TodoPage />
      case 'weather': return <WeatherPage />
      case 'memo': return <div className="p-4 text-[#789094]">메모 준비 중...</div>
      case 'settings': return <div className="p-4 text-[#789094]">설정 준비 중...</div>
      default: return <SummaryPage />
    }
  }

  return (
    <AppLayout page={page} onPageChange={setPage}>
      {renderPage()}
    </AppLayout>
  )
}
