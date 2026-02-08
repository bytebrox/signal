'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import HoldingsList from './HoldingsList'
import {
  TrackedWallet, WalletDetails,
  formatLastSeen, isWalletInactive, timeAgo, shortAddress
} from '@/lib/types'

interface DashboardTabProps {
  favorites: Set<string>
  favoritesLoading: Set<string>
  toggleFavorite: (address: string) => void
}

export default function DashboardTab({ favorites, favoritesLoading, toggleFavorite }: DashboardTabProps) {
  const [wallets, setWallets] = useState<TrackedWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConfigured, setDbConfigured] = useState(true)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [filterType, setFilterType] = useState<'discovered' | 'activity'>('discovered')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalWallets, setTotalWallets] = useState(0)
  const walletsPerPage = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [hideInactive, setHideInactive] = useState(false)
  const [globalStats, setGlobalStats] = useState({
    totalWallets: 0, multiTokenWallets: 0, totalPnlUsd: 0, totalTrades: 0
  })
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [holdingsPage, setHoldingsPage] = useState(0)

  // Fetch wallets from API with pagination
  const fetchWallets = async (range?: string, filter?: string, page?: number, query?: string, tag?: string, inactive?: boolean) => {
    try {
      const pageNum = page || currentPage
      const offset = (pageNum - 1) * walletsPerPage
      
      const params = new URLSearchParams({
        limit: walletsPerPage.toString(),
        offset: offset.toString(),
        range: range || timeRange,
        filterType: filter || filterType
      })
      
      const searchVal = query !== undefined ? query : searchQuery
      const tagVal = tag !== undefined ? tag : activeTag
      const hideInactiveVal = inactive !== undefined ? inactive : hideInactive
      if (searchVal) params.set('search', searchVal)
      if (tagVal) params.set('tag', tagVal)
      if (hideInactiveVal) params.set('hideInactive', 'true')
      
      const res = await fetch(`/api/wallets?${params}`)
      const data = await res.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
        setDbConfigured(false)
        return
      }
      
      setWallets(data.wallets || [])
      setTotalWallets(data.total || 0)
      if (data.globalStats) {
        setGlobalStats(data.globalStats)
      }
      setDbConfigured(true)
    } catch (error) {
      console.error('Fetch error:', error)
      setDbConfigured(false)
    } finally {
      setLoading(false)
    }
  }

  const checkScanStatus = async () => {
    try {
      const res = await fetch('/api/scan')
      const data = await res.json()
      setLastScan(data.lastScan)
    } catch {
      // Ignore
    }
  }

  const fetchWalletDetails = async (address: string) => {
    setLoadingDetails(true)
    setWalletDetails(null)
    try {
      const res = await fetch(`/api/wallets/${address}?chart=true&days=30&holdings=true`)
      const data = await res.json()
      if (!data.error) {
        setWalletDetails(data)
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleWalletClick = (address: string) => {
    setSelectedWallet(address)
    setHoldingsPage(0)
    fetchWalletDetails(address)
  }

  const handleTimeRangeChange = (range: 'all' | '24h' | '7d' | '30d') => {
    setTimeRange(range)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(range, filterType, 1)
  }

  const handleFilterTypeChange = (type: 'discovered' | 'activity') => {
    setFilterType(type)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, type, 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setLoading(true)
    fetchWallets(timeRange, filterType, page, searchQuery, activeTag)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, filterType, 1, query, activeTag)
  }

  const handleTagFilter = (tag: string) => {
    const newTag = activeTag === tag ? '' : tag
    setActiveTag(newTag)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, filterType, 1, searchQuery, newTag)
  }

  const handleHideInactive = () => {
    const next = !hideInactive
    setHideInactive(next)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, filterType, 1, searchQuery, activeTag, next)
  }

  const exportCSV = () => {
    if (wallets.length === 0) return
    const headers = ['Address', 'Total PnL %', 'Avg PnL %', 'Trades', 'Tokens', 'Tags', 'Last Scan']
    const rows = wallets.map(w => [
      w.address,
      w.total_pnl || w.pnl_percent,
      w.pnl_percent,
      w.total_trades,
      w.appearances || w.winning_tokens,
      (w.tags || []).join('; '),
      w.last_trade_at || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signal-wallets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchWallets()
    checkScanStatus()
  }, [])

  return (
    <>
      {/* Database Setup Notice */}
      {!dbConfigured && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-lg">⚠</span>
            <div>
              <h3 className="font-semibold text-yellow-500">Database not configured</h3>
              <p className="text-sm text-muted mt-1">
                Add your Supabase credentials to <code className="px-1.5 py-0.5 bg-white/5 rounded">.env.local</code> and create the <code className="px-1.5 py-0.5 bg-white/5 rounded">tracked_wallets</code> table.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scan Controls */}
      <div 
        className="mb-8 p-6 rounded-xl border border-border overflow-hidden relative backdrop-blur-sm"
        style={{
          background: `radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Wallet Scanner</h2>
            <p className="text-sm text-muted mt-1">
              Scan trending Solana tokens and extract profitable wallet addresses
            </p>
            {lastScan && (
              <p className="text-xs text-muted mt-2">
                Last scan: {timeAgo(lastScan)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tracked Wallets', value: globalStats.totalWallets.toString(), change: 'unique addresses' },
          { label: 'Multi-Token Wallets', value: globalStats.multiTokenWallets.toString(), change: '2+ tokens found' },
          { label: 'Total PnL', value: globalStats.totalPnlUsd ? `$${globalStats.totalPnlUsd >= 1000000 ? `${(globalStats.totalPnlUsd / 1000000).toFixed(1)}M` : globalStats.totalPnlUsd >= 1000 ? `${(globalStats.totalPnlUsd / 1000).toFixed(1)}k` : globalStats.totalPnlUsd.toFixed(0)}` : '-', change: 'realized profit' },
          { label: 'Total Trades', value: globalStats.totalTrades.toLocaleString(), change: 'across all' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-xl border border-border overflow-hidden relative group hover:border-emerald-500/30 transition-colors backdrop-blur-sm"
            style={{
              background: `radial-gradient(ellipse at top, rgba(16,185,129,0.06) 0%, transparent 60%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
              style={{ background: `radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)` }}
            />
            <div className="relative z-10">
              <div className="text-sm text-muted mb-1">{stat.label}</div>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.change}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-2">
          <div 
            className="rounded-xl border border-border overflow-hidden relative backdrop-blur-sm"
            style={{
              background: `radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 40%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
            }}
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-sm sm:text-base">Top Performing Wallets</h2>
                  <button
                    onClick={exportCSV}
                    disabled={wallets.length === 0}
                    className="px-3 py-1 text-[11px] border border-border rounded-lg hover:border-white/30 text-muted hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title="Export as CSV"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {(['all', '24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTimeRangeChange(range)}
                      className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        timeRange === range ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                      }`}
                    >
                      {range === 'all' ? 'All' : range}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search wallet address..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-sm placeholder:text-muted focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Smart Money', 'Whale', 'Insider', '10x Hunter', 'Active'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagFilter(tag)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        activeTag === tag
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'border-border text-muted hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    onClick={handleHideInactive}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                      hideInactive
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'border-border text-muted hover:border-white/20 hover:text-white'
                    }`}
                    title="Hide wallets not found in any scan for 14+ days"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hide Inactive
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted">Sort by:</span>
                <button
                  onClick={() => handleFilterTypeChange('discovered')}
                  className={`px-2 py-1 rounded transition-colors ${
                    filterType === 'discovered' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  Discovery Date
                </button>
                <button
                  onClick={() => handleFilterTypeChange('activity')}
                  className={`px-2 py-1 rounded transition-colors ${
                    filterType === 'activity' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  Last Activity
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5" />
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-white/5 rounded" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="h-4 w-16 bg-white/5 rounded" />
                      <div className="h-4 w-12 bg-white/5 rounded" />
                      <div className="h-4 w-10 bg-white/5 rounded" />
                      <div className="h-7 w-16 bg-white/5 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : wallets.length === 0 ? (
              <div className="p-12 text-center text-muted">
                <p className="mb-2">No wallets tracked yet</p>
                <p className="text-sm">Wallets are scanned automatically every 15 minutes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-0">
                  <thead>
                    <tr className="text-xs text-muted border-b border-border">
                      <th className="text-left px-3 sm:px-6 py-3 font-medium">Wallet</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium">Total PnL</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium hidden sm:table-cell">Avg PnL</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium hidden md:table-cell">Trades</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium hidden md:table-cell">Tokens</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium hidden lg:table-cell">Last Scan</th>
                      <th className="text-right px-3 sm:px-6 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet, i) => (
                      <motion.tr
                        key={wallet.address}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleWalletClick(wallet.address)}
                        className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                          selectedWallet === wallet.address ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[10px] sm:text-xs font-mono flex-shrink-0">
                              {wallet.address.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono text-xs sm:text-sm truncate">{shortAddress(wallet.address)}</div>
                              <div className="flex gap-1 mt-1">
                                {wallet.tags?.slice(0, 2).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-white/5 rounded text-muted">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-emerald-500 font-semibold text-xs sm:text-sm whitespace-nowrap">
                          +{wallet.total_pnl || wallet.pnl_percent}%
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">+{wallet.pnl_percent}%</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-muted hidden md:table-cell">{wallet.total_trades}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden md:table-cell">
                          <span className="px-2 py-1 bg-white/5 rounded text-xs">{wallet.appearances || wallet.winning_tokens}×</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right hidden lg:table-cell">
                          <span className={`text-xs ${isWalletInactive(wallet.last_trade_at) ? 'text-amber-400/70' : 'text-muted'}`}>
                            {formatLastSeen(wallet.last_trade_at)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(wallet.address)
                            }}
                            disabled={favoritesLoading.has(wallet.address)}
                            className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs border rounded-lg transition-colors ${
                              favorites.has(wallet.address)
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                                : 'border-border hover:border-white/30'
                            }`}
                          >
                            {favoritesLoading.has(wallet.address) ? (
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : favorites.has(wallet.address) ? (
                              '★'
                            ) : (
                              'Track'
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {totalWallets > walletsPerPage && (
                  <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm text-muted">
                      {((currentPage - 1) * walletsPerPage) + 1}-{Math.min(currentPage * walletsPerPage, totalWallets)} of {totalWallets}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-border rounded-lg hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, Math.ceil(totalWallets / walletsPerPage)) }, (_, i) => {
                          const totalPages = Math.ceil(totalWallets / walletsPerPage)
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                currentPage === pageNum 
                                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                                  : 'border border-border hover:border-white/20'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalWallets / walletsPerPage)}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-border rounded-lg hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Wallet Details */}
          {selectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border overflow-hidden relative backdrop-blur-sm"
              style={{
                background: `radial-gradient(ellipse at top right, rgba(16,185,129,0.08) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
              }}
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-sm sm:text-base">Wallet Details</h2>
                <button 
                  onClick={() => { setSelectedWallet(null); setWalletDetails(null); }}
                  className="text-muted hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <p className="font-mono text-[10px] sm:text-xs break-all text-muted mb-4">{selectedWallet}</p>
                
                {/* Stats Summary */}
                {walletDetails && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted">Total PnL</div>
                      <div className="text-lg font-semibold text-emerald-500">
                        +{walletDetails.wallet.total_pnl || walletDetails.wallet.pnl_percent}%
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted">Tokens Found</div>
                      <div className="text-lg font-semibold">{walletDetails.totalTokens}</div>
                    </div>
                  </div>
                )}
                
                {/* PnL Chart */}
                {walletDetails?.chartData && walletDetails.chartData.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-3">30-Day PnL</h3>
                    <div className="h-32 bg-white/5 rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={100}>
                        <AreaChart data={walletDetails.chartData}>
                          <defs>
                            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#666' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#666' }}
                            tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                            width={45}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#18181b', 
                              border: '1px solid #27272a',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            labelStyle={{ color: '#a1a1aa' }}
                            formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, 'Profit']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="realizedProfitUsd" 
                            stroke="#10b981" 
                            fill="url(#pnlGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted mt-1">
                      <span>{walletDetails.chartData.reduce((sum, d) => sum + d.swaps, 0)} swaps</span>
                      <span>${walletDetails.chartData.reduce((sum, d) => sum + d.volumeUsd, 0).toLocaleString()} volume</span>
                    </div>
                  </div>
                )}
                
                {/* Token History */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-3">Token History</h3>
                  
                  {loadingDetails ? (
                    <div className="space-y-2 animate-pulse">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                          <div className="h-4 w-20 bg-white/5 rounded" />
                          <div className="h-4 w-14 bg-white/5 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : walletDetails?.tokenHistory.length === 0 ? (
                    <div className="text-xs text-muted py-3 px-3 bg-white/5 rounded-lg">
                      <p>No detailed history available.</p>
                      {walletDetails?.totalTokens > 0 && (
                        <p className="mt-1 text-yellow-500/80">
                          Found in {walletDetails.totalTokens} token(s) but history was not recorded.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {walletDetails?.tokenHistory.map((token) => (
                        <div 
                          key={token.id}
                          className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{token.token_symbol}</span>
                              <span className="text-emerald-500 text-xs">+{token.pnl_at_discovery}%</span>
                            </div>
                            <span className="text-xs text-muted">{token.trades_at_discovery} trades</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {token.entry_cost_usd > 0 && (
                              <span className="text-[10px] text-muted">
                                Invest: <span className="text-white/70">${token.entry_cost_usd >= 1000 ? `${(token.entry_cost_usd / 1000).toFixed(1)}k` : token.entry_cost_usd.toFixed(0)}</span>
                              </span>
                            )}
                            {token.first_buy_at && token.token_deployed_at && (() => {
                              const buyTime = new Date(token.first_buy_at!).getTime()
                              const deployTime = new Date(token.token_deployed_at!).getTime()
                              const diffMs = buyTime - deployTime
                              if (diffMs < 0 || diffMs > 365 * 24 * 60 * 60 * 1000) return null
                              const diffMin = Math.floor(diffMs / 60000)
                              const diffH = Math.floor(diffMin / 60)
                              const diffD = Math.floor(diffH / 24)
                              let label = ''
                              if (diffMin < 1) label = '< 1 min'
                              else if (diffMin < 60) label = `${diffMin} min`
                              else if (diffH < 24) label = `${diffH}h ${diffMin % 60}min`
                              else label = `${diffD}d ${diffH % 24}h`
                              const isEarly = diffMin < 30
                              return (
                                <span className={`text-[10px] ${isEarly ? 'text-emerald-400' : 'text-muted'}`}>
                                  Bought: <span className={isEarly ? 'text-emerald-300 font-medium' : 'text-white/70'}>{label} after launch</span>
                                </span>
                              )
                            })()}
                            {token.first_buy_at && !token.token_deployed_at && (
                              <span className="text-[10px] text-muted">
                                1st buy: <span className="text-white/70">{new Date(token.first_buy_at).toLocaleDateString()}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <a
                              href={`https://dexscreener.com/solana/${token.token_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-muted hover:text-white font-mono"
                            >
                              {token.token_address.slice(0, 8)}...
                            </a>
                            <span className="text-[10px] text-muted">
                              {new Date(token.discovered_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Holdings */}
                {walletDetails?.holdings && walletDetails.holdings.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      Current Holdings
                      <span className="text-[10px] text-muted font-normal px-1.5 py-0.5 bg-white/5 rounded">{walletDetails.holdings.length}</span>
                    </h3>
                    <HoldingsList
                      holdings={walletDetails.holdings}
                      page={holdingsPage}
                      setPage={setHoldingsPage}
                    />
                  </div>
                )}
                
                {/* External Links */}
                <div className="space-y-2">
                  <a 
                    href={`https://solscan.io/account/${selectedWallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2.5 text-sm border border-border rounded-lg hover:border-white/20 transition-colors text-center"
                  >
                    View on Solscan →
                  </a>
                  <a
                    href={`https://birdeye.so/profile/${selectedWallet}?chain=solana`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="block px-4 py-2.5 text-sm border border-border rounded-lg hover:border-white/20 transition-colors text-center"
                  >
                    View on Birdeye →
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div 
            className="rounded-xl border border-border p-6 relative overflow-hidden backdrop-blur-sm"
            style={{
              background: `radial-gradient(ellipse at bottom right, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
            }}
          >
            <h2 className="font-semibold mb-3">How it works</h2>
            <p className="text-sm text-muted leading-relaxed">
              SIGNAL automatically discovers trending Solana tokens and extracts the most profitable 
              traders behind them. Wallets are filtered by realized profit, trade activity, and buy 
              behavior — only the best make it into the database. Use search, tags, and time filters 
              to find the wallets that match your strategy.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
