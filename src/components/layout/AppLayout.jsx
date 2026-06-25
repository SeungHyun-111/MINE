import { CalendarDays, CloudSun, Grid2X2, ListTodo, LogOut, Music2, Newspaper, Repeat, Settings, StickyNote } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { icon: Grid2X2, label: '종합', key: 'summary' },
  { icon: CalendarDays, label: '캘린더', key: 'calendar' },
  { icon: ListTodo, label: 'Todo', key: 'todo' },
  { icon: CloudSun, label: '날씨', key: 'weather' },
  { icon: StickyNote, label: '메모', key: 'memo' },
  { icon: Repeat, label: '정기일정', key: 'routine' },
  { icon: Music2, label: 'Euphony', key: 'euphony' },
  { icon: Newspaper, label: '새소식', key: 'news' },
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

      <nav
        className="mobile-tab-rail md:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto overscroll-x-contain border-t border-[#bfd2d6] bg-white shadow-[0_-5px_18px_rgba(31,78,95,0.12)]"
      >
        {NAV_ITEMS.map(({ icon: Icon, label, key }) => (
          <button
            key={key}
            onClick={() => onPageChange(key)}
            className={`mobile-tab-item flex basis-[20%] shrink-0 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium leading-tight transition-colors ${
              page === key ? 'bg-[#edf6f7] text-[#1f4e5f]' : 'text-[#789094] active:bg-[#f4f7f7]'
            }`}
          >
            <Icon size={21} />
            <span className="min-h-7 max-w-full break-keep text-center">{label}</span>
          </button>
        ))}
        <button
          onClick={logout}
          className="mobile-tab-item flex basis-[20%] shrink-0 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium leading-tight text-[#789094] transition-colors active:bg-[#f4f7f7]"
        >
          <LogOut size={21} />
          <span className="min-h-7 max-w-full break-keep text-center">로그아웃</span>
        </button>
      </nav>
    </div>
  )
}
