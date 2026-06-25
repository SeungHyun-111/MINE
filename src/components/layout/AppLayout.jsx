import { CalendarDays, CloudSun, Grid2X2, ListTodo, LogOut, Music2, Settings, StickyNote } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { icon: Grid2X2, label: '종합', key: 'summary' },
  { icon: CalendarDays, label: '캘린더', key: 'calendar' },
  { icon: ListTodo, label: 'Todo', key: 'todo' },
  { icon: CloudSun, label: '날씨', key: 'weather' },
  { icon: StickyNote, label: '메모', key: 'memo' },
  { icon: Music2, label: 'Euphony', key: 'euphony' },
  { icon: Settings, label: '설정', key: 'settings' },
]

export default function AppLayout({ page, onPageChange, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-svh bg-[#f4f7f7]">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#d6e1e3] py-6 px-3">
        <h1 className="text-lg font-bold text-[#1f4e5f] px-3 mb-6">개인 일정</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => onPageChange(key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === key
                  ? 'bg-[#dcebed] text-[#1f4e5f]'
                  : 'text-[#55777b] hover:bg-[#f4f7f7]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 px-3 pt-4 border-t border-[#e0eaec]">
          <img src={user?.photoURL} className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#304852] truncate">{user?.displayName}</p>
          </div>
          <button onClick={logout} className="text-[#789094] hover:text-[#1f4e5f]" aria-label="로그아웃">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#d6e1e3] flex">
        {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
          <button
            key={key}
            onClick={() => onPageChange(key)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              page === key ? 'text-[#1f4e5f]' : 'text-[#789094]'
            }`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium text-[#789094] transition-colors hover:text-[#1f4e5f]"
        >
          <LogOut size={22} />
          로그아웃
        </button>
      </nav>
    </div>
  )
}
