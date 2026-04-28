'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Library, ListOrdered, History, Music2 } from 'lucide-react'

const NAV = [
  { key: 'library', label: 'Thư viện', icon: Library },
  { key: 'queue', label: 'Hàng đợi', icon: ListOrdered },
  { key: 'history', label: 'Lịch sử', icon: History },
] as const

export default function Sidebar() {
  const { activeView, setActiveView } = usePlayerStore()

  return (
    <div className="w-56 bg-zinc-950 flex flex-col border-r border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-5">
        <Music2 className="w-6 h-6 text-green-400" />
        <span className="text-white font-bold text-lg tracking-tight">Nhạc</span>
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
