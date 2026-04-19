'use client'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, FileText, TrendingUp, RefreshCw } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalRooms: number
  logSize: string
  logLines: number
}

const StatsCards = () => {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRooms: 0,
    logSize: '0 KB',
    logLines: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/Login')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all 3 in parallel
      const [usersRes, roomsRes, logsRes] = await Promise.allSettled([
        axios.get('http://localhost:8000/api/admin/users', { headers }),
        axios.get('http://localhost:8000/api/admin/rooms', { headers }),
        axios.get('http://localhost:8000/api/admin/logs',  { headers }),
      ])

      // Users count
      const totalUsers =
        usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)
          ? usersRes.value.data.length
          : 0

      // Rooms count
      const totalRooms =
        roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value.data)
          ? roomsRes.value.data.length
          : 0

      // Log size + line count
      let logSize = '0 KB'
      let logLines = 0
      if (logsRes.status === 'fulfilled') {
        const raw: string =
          typeof logsRes.value.data?.logs === 'string'
            ? logsRes.value.data.logs
            : ''
        const bytes = new Blob([raw]).size
        logSize =
          bytes >= 1_048_576
            ? `${(bytes / 1_048_576).toFixed(1)} MB`
            : `${(bytes / 1_024).toFixed(1)} KB`
        logLines = raw.split('\n').filter(l => l.trim()).length
      }

      setStats({ totalUsers, totalRooms, logSize, logLines })
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.push('/Login')
      } else {
        setError('Failed to load stats.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      sub: 'Registered accounts',
      icon: <Users className="size-5 text-blue-500" />,
      iconBg: 'bg-blue-50',
      accent: 'border-blue-100',
      valueColor: 'text-blue-600',
    },
    {
      title: 'Chat Rooms',
      value: stats.totalRooms.toLocaleString(),
      sub: 'Active rooms',
      icon: <MessageSquare className="size-5 text-indigo-500" />,
      iconBg: 'bg-indigo-50',
      accent: 'border-indigo-100',
      valueColor: 'text-indigo-600',
    },
    {
      title: 'Log Size',
      value: stats.logSize,
      sub: `${stats.logLines.toLocaleString()} log entries`,
      icon: <FileText className="size-5 text-emerald-500" />,
      iconBg: 'bg-emerald-50',
      accent: 'border-emerald-100',
      valueColor: 'text-emerald-600',
    },
  ]

  return (
    <div>
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Overview
          </h2>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-500 flex items-center justify-between">
          {error}
          <button onClick={fetchStats} className="underline hover:text-red-700">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white rounded-2xl border ${card.accent} shadow-sm p-5 flex flex-col gap-3 transition-all hover:shadow-md`}
          >
            {/* Top row: icon + title */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">{card.title}</span>
              <div className={`size-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>

            {/* Value */}
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-7 w-24 bg-gray-100 rounded-lg" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            ) : (
              <>
                <p className={`text-3xl font-bold tracking-tight ${card.valueColor}`}>
                  {card.value}
                </p>
                <p className="text-[11px] text-gray-400">{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsCards