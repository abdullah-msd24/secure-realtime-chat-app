'use client'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Users, Search, ChevronUp, ChevronDown } from 'lucide-react'

interface User {
  id: number
  username: string
  email: string
  created_at: string
}

const UsersTable = () => {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<keyof User>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/Login')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response?.data
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.push('/Login')
      } else {
        setError('Failed to load users. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredUsers = users
    .filter(user =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      String(user.id).includes(search)
    )
    .sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortIcon = ({ field }: { field: keyof User }) => {
    if (sortField !== field) return <ChevronUp className="size-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="size-3 text-blue-500" />
      : <ChevronDown className="size-3 text-blue-500" />
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="size-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Users</h3>
            <p className="text-[11px] text-gray-400">{users.length} total registered</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 h-8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-44"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchUsers}
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
                { field: 'id', label: 'ID' },
                { field: 'username', label: 'Username' },
                { field: 'email', label: 'Email' },
                { field: 'created_at', label: 'Joined' },
              ] as { field: keyof User; label: string }[]).map(({ field, label }) => (
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
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-6 py-3">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-sm text-red-400">{error}</span>
                    <button
                      onClick={fetchUsers}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                  {search ? `No users matching "${search}"` : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                    #{user.id}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="size-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-700">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{user.email}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(user.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isLoading && !error && filteredUsers.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
          <span>
            Showing <span className="text-gray-600 font-medium">{filteredUsers.length}</span> of{' '}
            <span className="text-gray-600 font-medium">{users.length}</span> users
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-blue-400 hover:text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default UsersTable