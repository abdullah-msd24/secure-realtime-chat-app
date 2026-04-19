'use client'

import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Terminal, Search, Trash2, RefreshCw, Circle, AlertCircle, AlertTriangle, Info, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from 'next/navigation'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

const parseRawLogs = (raw: string): LogEntry[] => {
  return raw
    .split('\n')
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      const match = line.match(
        /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+)\s+-\s+[^-]+-\s+(INFO|WARN|WARNING|ERROR|DEBUG)\s+-\s+(.*)$/i
      )
      if (match) {
        const [, timestamp, levelRaw, message] = match
        const levelMap: Record<string, 'info' | 'warn' | 'error'> = {
          INFO: 'info', DEBUG: 'info', WARN: 'warn', WARNING: 'warn', ERROR: 'error',
        }
        return {
          id: `${index}-${timestamp}`,
          timestamp: timestamp.replace(',', '.'),
          level: levelMap[levelRaw.toUpperCase()] ?? 'info',
          message: message.trim(),
        }
      }
      return {
        id: `${index}-unknown`,
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        message: line.trim(),
      }
    })
}

type LevelFilter = 'all' | 'info' | 'warn' | 'error'

const LogsPanel = () => {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/Login'); return }
    setIsLoading(true)
    try {
      const res = await axios.get('http://localhost:8000/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data
      if (Array.isArray(data)) setLogs(data)
      else if (typeof data?.logs === 'string') setLogs(parseRawLogs(data.logs))
      else if (typeof data === 'string') setLogs(parseRawLogs(data))
      else if (Array.isArray(data?.logs)) setLogs(data.logs)
      else setLogs([])
    } catch (err) {
      console.error('Failed to fetch logs', err)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message?.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
  }

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'error': return {
        row: 'border-l-2 border-red-500 bg-red-500/5 hover:bg-red-500/10',
        badge: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
        icon: <AlertCircle className="size-3" />,
        text: 'text-red-300',
      }
      case 'warn': return {
        row: 'border-l-2 border-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10',
        badge: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
        icon: <AlertTriangle className="size-3" />,
        text: 'text-yellow-300',
      }
      default: return {
        row: 'border-l-2 border-transparent hover:bg-white/5',
        badge: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
        icon: <Info className="size-3" />,
        text: 'text-zinc-300',
      }
    }
  }

  const filterButtons: { key: LevelFilter; label: string; color: string }[] = [
    { key: 'all',   label: 'All',    color: 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' },
    { key: 'info',  label: 'Info',   color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 ring-1 ring-blue-500/30' },
    { key: 'warn',  label: 'Warn',   color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 ring-1 ring-yellow-500/30' },
    { key: 'error', label: 'Error',  color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30' },
  ]

  return (
    <div className="bg-[#0d0d0f] border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col h-[620px]">

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#111113] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Terminal className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">System Logs</h3>
            <p className="text-[10px] text-zinc-500">{counts.all} total entries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-zinc-500" />
            <Input
              placeholder="Search logs..."
              className="h-7 w-44 pl-8 text-xs bg-white/5 border-white/10 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-primary/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
            onClick={() => setLogs([])}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Level Filter Bar ── */}
      <div className="px-4 py-2 border-b border-white/5 bg-[#0f0f11] flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest mr-1">Filter:</span>
        {filterButtons.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setLevelFilter(key)}
            className={`
              px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all
              ${color}
              ${levelFilter === key ? 'opacity-100 scale-105 shadow-sm' : 'opacity-50 hover:opacity-80'}
            `}
          >
            {label}
            <span className="ml-1.5 opacity-70">{counts[key]}</span>
          </button>
        ))}

        {/* Auto-scroll toggle */}
        <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
          <div
            onClick={() => setAutoScroll(p => !p)}
            className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${autoScroll ? 'bg-primary' : 'bg-zinc-700'}`}
          >
            <div className={`size-3 rounded-full bg-white shadow transition-transform ${autoScroll ? 'translate-x-3' : 'translate-x-0'}`} />
          </div>
          <span className="text-[10px] text-zinc-500">Auto-scroll</span>
        </label>
      </div>

      {/* ── Log Lines ── */}
      <ScrollArea ref={scrollRef} className="flex-1 bg-[#09090b]">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
            <RefreshCw className="size-5 animate-spin" />
            <span className="text-xs">Loading logs...</span>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="py-1">
            {filteredLogs.map((log, i) => {
              const styles = getLevelStyles(log.level)
              const isExpanded = expandedId === log.id
              const isLong = log.message.length > 100

              return (
                <div
                  key={log.id}
                  className={`
                    font-mono text-[12px] leading-relaxed px-3 py-1.5 transition-colors cursor-default
                    ${styles.row}
                    ${isExpanded ? 'bg-white/5' : ''}
                  `}
                  onClick={() => isLong && setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Line number */}
                    <span className="text-zinc-700 shrink-0 w-8 text-right text-[10px] pt-0.5 select-none">
                      {i + 1}
                    </span>

                    {/* Timestamp */}
                    <span className="text-zinc-600 shrink-0 text-[11px] pt-0.5 tabular-nums whitespace-nowrap">
                      {log.timestamp.split(' ')[1] ?? log.timestamp}
                    </span>

                    {/* Level badge */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${styles.badge}`}>
                      {styles.icon}
                      {log.level}
                    </span>

                    {/* Message */}
                    <span className={`${styles.text} break-all flex-1 ${!isExpanded && isLong ? 'line-clamp-1' : ''}`}>
                      {log.message}
                    </span>

                    {/* Expand chevron */}
                    {isLong && (
                      <ChevronDown className={`size-3.5 shrink-0 text-zinc-600 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-600 py-16">
            <Terminal className="size-8 opacity-20" />
            <span className="text-sm">No logs matching criteria</span>
            {(search || levelFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setLevelFilter('all') }}
                className="text-xs text-primary/60 hover:text-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </ScrollArea>

      {/* ── Status Bar ── */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0f0f11] flex items-center gap-4 text-[10px] text-zinc-600 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Circle className="size-2 fill-green-500 text-green-500" />
          <span className="text-zinc-400">Live</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-red-400">{counts.error} errors</span>
          <span className="text-yellow-400">{counts.warn} warnings</span>
          <span className="text-blue-400">{counts.info} info</span>
        </div>
        <div className="ml-auto">
          Showing <span className="text-zinc-300 font-medium">{filteredLogs.length}</span> of <span className="text-zinc-300 font-medium">{counts.all}</span>
        </div>
      </div>
    </div>
  )
}

export default LogsPanel