import { useState } from 'react'
import { WatchList } from '../market/WatchList'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`bg-surface-light border-r border-gray-700 flex flex-col transition-all duration-200 ${
      collapsed ? 'w-10' : 'w-72'
    }`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 text-gray-400 hover:text-white border-b border-gray-700 text-xs shrink-0"
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {!collapsed && <WatchList />}
    </aside>
  )
}
