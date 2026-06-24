import { CalendarDays, ListTodo, StickyNote, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { icon: CalendarDays, label: '캘린더', key: 'calendar' },
  { icon: ListTodo, label: '할 일', key: 'todo' },
  { icon: StickyNote, label: '메모', key: 'memo' },
  { icon: Settings, label: '설정', key: 'settings' },
]

export default function AppLayout({ page, onPageChange, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-svh bg-gray-50">
      {/* PC 사이드바 */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-6 px-3">
        <h1 className="text-lg font-bold text-gray-800 px-3 mb-6">내 일정</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => onPageChange(key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                page === key
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* PC 하단 프로필 */}
        <div className="flex items-center gap-2 px-3 pt-4 border-t border-gray-100">
          <img src={user?.photoURL} className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user?.displayName}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 공통 헤더 (항상 우상단 고정) */}
        <header className="flex items-center justify-end px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <img src={user?.photoURL} className="w-8 h-8 rounded-full" />
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-600 md:hidden"
            >
              로그아웃
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
          <button
            key={key}
            onClick={() => onPageChange(key)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              page === key ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
