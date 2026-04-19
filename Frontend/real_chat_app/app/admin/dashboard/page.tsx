'use client'
import React, { useState } from "react"
import StatsCards from "@/app/components/StatsCards"
import UsersTable from "@/app/components/UsersTable"
import RoomsTable from "@/app/components/RoomsTable"
import LogsPanel from "@/app/components/LogsPanel"
import {
  LayoutDashboard, Users, MessageSquare, Terminal,
  Bell, Settings, Menu, X, ChevronRight, Shield
} from "lucide-react"

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'rooms' | 'logs'>('overview')

  const navItems = [
    { key: 'overview', label: 'Overview',   icon: <LayoutDashboard className="size-4" /> },
    { key: 'users',    label: 'Users',      icon: <Users className="size-4" /> },
    { key: 'rooms',    label: 'Chat Rooms', icon: <MessageSquare className="size-4" /> },
    { key: 'logs',     label: 'Logs',       icon: <Terminal className="size-4" /> },
  ] as const

  return (
    <div className="flex h-screen bg-[#f4f6fb] overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-[#0f1117] flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">AdminPanel</p>
              <p className="text-zinc-500 text-[10px]">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-zinc-500 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-3 mb-3">
            Navigation
          </p>
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setActiveSection(key); setSidebarOpen(false) }}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm
                transition-all duration-150 group
                ${activeSection === key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className={activeSection === key ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}>
                  {icon}
                </span>
                {label}
              </div>
              {activeSection === key && <ChevronRight className="size-3.5 opacity-70" />}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Admin</p>
              <p className="text-zinc-500 text-[10px] truncate">Administrator</p>
            </div>
            <button className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <Settings className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Dashboard</span>
              <ChevronRight className="size-3.5 text-gray-300" />
              <span className="text-gray-800 font-semibold capitalize">{activeSection}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative size-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors border border-gray-100">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Settings */}
            <button className="size-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors border border-gray-100">
              <Settings className="size-4" />
            </button>

            {/* Avatar */}
            <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">

          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 capitalize">
              {activeSection === 'overview' ? 'Dashboard Overview' : activeSection === 'users' ? 'User Management' : activeSection === 'rooms' ? 'Chat Rooms' : 'System Logs'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {activeSection === 'overview' && 'Monitor key metrics across your platform'}
              {activeSection === 'users'    && 'View and manage all registered users'}
              {activeSection === 'rooms'    && 'Browse and monitor all active chat rooms'}
              {activeSection === 'logs'     && 'Inspect real-time system activity logs'}
            </p>
          </div>

          {/* ── Overview ── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <StatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="size-4 text-blue-400" /> Recent Users
                    </span>
                    <button
                      onClick={() => setActiveSection('users')}
                      className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <UsersTable />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MessageSquare className="size-4 text-indigo-400" /> Chat Rooms
                    </span>
                    <button
                      onClick={() => setActiveSection('rooms')}
                      className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <RoomsTable />
                </div>
              </div>
              <LogsPanel />
            </div>
          )}

          {/* ── Users ── */}
          {activeSection === 'users' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <UsersTable />
            </div>
          )}

          {/* ── Rooms ── */}
          {activeSection === 'rooms' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <RoomsTable />
            </div>
          )}

          {/* ── Logs ── */}
          {activeSection === 'logs' && <LogsPanel />}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard