import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { NavTree } from './NavTree'

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar (mobile) */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 md:hidden">
        <span className="text-white font-bold text-lg">🏁 Gladiator Gokart</span>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-gray-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-700 flex flex-col
            transform transition-transform duration-200
            md:relative md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Sidebar header */}
          <div className="hidden md:flex items-center px-4 py-4 border-b border-gray-700">
            <span className="text-white font-bold text-lg">🏁 Gladiator Gokart</span>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <NavTree onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
