import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import CalendarPage from '@/pages/CalendarPage'

export default function HomePage() {
  const [page, setPage] = useState('calendar')

  const renderPage = () => {
    switch (page) {
      case 'calendar': return <CalendarPage />
      case 'todo': return <div className="p-4 text-gray-400">할 일 준비 중...</div>
      case 'memo': return <div className="p-4 text-gray-400">메모 준비 중...</div>
      case 'settings': return <div className="p-4 text-gray-400">설정 준비 중...</div>
      default: return null
    }
  }

  return (
    <AppLayout page={page} onPageChange={setPage}>
      {renderPage()}
    </AppLayout>
  )
}
