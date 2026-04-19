'use client'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, MessageSquare, Search, ChevronUp, ChevronDown, Users } from 'lucide-react'

interface Room {
  id: number
  name: string
  created_at: string
}

const RoomsTable = () => {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<keyof Room>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchRooms = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/Login')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response?.data
      setRooms(Array.isArray(data) ? data : [])
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.push('/Login')
      } else {
        setError('Failed to load rooms. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleSort = (field: keyof Room) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredRooms = rooms
    .filter(room =>
      room.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(room.id).includes(search)
    )
    .sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortIcon = ({ field }: { field: keyof Room }) => {
    if (sortField !== field) return <ChevronUp className="size-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="size-3 text-indigo-500" />
      : <ChevronDown className="size-3 text-indigo-500" />
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  // Random soft color for room avatar
  const getRoomColor = (id: number) => {
    const colors = [
      'from-purple-400 to-indigo-500',
      'from-pink-400 to-rose-500',
      'from-green-400 to-teal-500',
      'from-orange-400 to-amber-500',
      'from-blue-400 to-cyan-500',
    ]
    return colors[id % colors.length]
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <MessageSquare className="size-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Chat Rooms</h3>
            <p className="text-[11px] text-gray-400">{rooms.length} total rooms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 h-8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-44"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchRooms}
            disabled={isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              {([
                { field: 'id',         label: 'ID' },
                { field: 'name',       label: 'Room Name' },
                { field: 'created_at', label: 'Created' },
              ] as { field: keyof Room; label: string }[]).map(({ field, label }) => (
                <th
                  key={field}
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon field={field} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <td key={j} className="px-6 py-3">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-red-400">{error}</span>
                    <button
                      onClick={fetchRooms}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-sm">
                  {search ? `No rooms matching "${search}"` : 'No rooms found'}
                </td>
              </tr>
            ) : (
              filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                    #{room.id}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {/* Room Avatar */}
                      <div className={`size-7 rounded-full bg-gradient-to-br ${getRoomColor(room.id)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {room.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-700">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {formatDate(room.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isLoading && !error && filteredRooms.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
          <span>
            Showing <span className="text-gray-600 font-medium">{filteredRooms.length}</span> of{' '}
            <span className="text-gray-600 font-medium">{rooms.length}</span> rooms
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-indigo-400 hover:text-indigo-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default RoomsTable