import { CalendarDays, CloudSun, Gamepad2, Grid2X2, ListTodo, LogOut, Music2, Newspaper, Repeat, StickyNote } from 'lucide-react'
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
  { icon: Gamepad2, label: '게임', key: 'game' },
  { char: '正', label: '正', key: 'sasek' },
]

function NavIcon({ item, size }) {
  if (item.char) {
    return (
      <span
        style={{ fontSize: size === 18 ? 16 : 20, fontWeight: 'bold', fontFamily: 'serif', lineHeight: 1 }}
      >
        {item.char}
      </span>
    )
  }
  const Icon = item.icon
  return <Icon size={size} />
}

export default function AppLayout({ page, onPageChange, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-svh bg-[#f0f5ff]">
      <aside className="hidden md:flex flex-col w-56 bg-white/90 border-r border-[#bbd0ee] py-6 px-3">
        <h1 className="text-lg font-bold text-[#0044cc] px-3 mb-6">개인 일정</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === item.key
                  ? 'bg-[#cce0ff] text-[#0044cc]'
                  : 'text-[#4477cc] hover:bg-[#f0f5ff]'
              }`}
            >
              <NavIcon item={item} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 px-3 pt-4 border-t border-[#d5e8ff]">
          <img src={user?.photoURL} className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1a3d8a] truncate">{user?.displayName}</p>
          </div>
          <button onClick={logout} className="text-[#5577bb] hover:text-[#0044cc]" aria-label="로그아웃">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </div>
      </main>

      <nav
        className="mobile-tab-rail md:hidden fixed bottom-2 left-2 right-2 z-40 flex overflow-x-auto overscroll-x-contain rounded-2xl bg-[#0033aa] shadow-[0_8px_32px_rgba(0,51,170,0.45),0_2px_8px_rgba(0,0,0,0.18)]"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onPageChange(item.key)}
            className={`mobile-tab-item flex basis-[20%] shrink-0 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium leading-tight transition-colors ${
              page === item.key
                ? 'bg-white/20 text-white'
                : 'text-white/55 active:bg-white/10'
            }`}
          >
            <NavIcon item={item} size={21} />
            <span className="min-h-7 max-w-full break-keep text-center">{item.label}</span>
          </button>
        ))}
        <button
          onClick={logout}
          className="mobile-tab-item flex basis-[20%] shrink-0 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium leading-tight text-white/55 transition-colors active:bg-white/10"
        >
          <LogOut size={21} />
          <span className="min-h-7 max-w-full break-keep text-center">로그아웃</span>
        </button>
      </nav>
    </div>
  )
}
