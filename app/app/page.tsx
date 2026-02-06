'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface User {
  id: number
  wallet_address: string
  created_at: string
  last_login_at: string
  is_premium: boolean
  settings: Record<string, unknown>
}

interface TrackedWallet {
  id: number
  address: string
  pnl_percent: number
  total_pnl: number
  win_rate: number
  total_trades: number
  winning_tokens: number
  appearances: number
  avg_return: number
  last_trade_at: string
  tags: string[]
}

interface ScanResult {
  success: boolean
  message: string
  tokensScanned?: number
  newFindings?: number
  walletsUpdated?: number
  error?: string
}

interface TokenHistory {
  id: number
  token_address: string
  token_symbol: string
  pnl_at_discovery: number
  trades_at_discovery: number
  discovered_at: string
}

interface ChartDataPoint {
  date: string
  realizedProfitUsd: number
  swaps: number
  volumeUsd: number
}

interface WalletDetails {
  wallet: TrackedWallet
  tokenHistory: TokenHistory[]
  totalTokens: number
  chartData?: ChartDataPoint[]
}

export default function App() {
  // Wallet connection
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  
  // App state
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [wallets, setWallets] = useState<TrackedWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [dbConfigured, setDbConfigured] = useState(true)
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [filterType, setFilterType] = useState<'discovered' | 'activity'>('discovered')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalWallets, setTotalWallets] = useState(0)
  const walletsPerPage = 20
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  
  // Global stats (for all wallets in DB, not just current page)
  const [globalStats, setGlobalStats] = useState({
    totalWallets: 0,
    multiTokenWallets: 0,
    topPnl: 0,
    totalTrades: 0
  })
  
  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState<Set<string>>(new Set())
  const [favoriteWallets, setFavoriteWallets] = useState<Array<{ wallet_address: string; nickname: string | null; walletData: TrackedWallet | null }>>([])
  
  // Selected favorite wallet for details view
  const [selectedFavorite, setSelectedFavorite] = useState<string | null>(null)
  const [favoriteDetails, setFavoriteDetails] = useState<WalletDetails | null>(null)
  const [loadingFavoriteDetails, setLoadingFavoriteDetails] = useState(false)
  
  // Nickname editing
  const [editingNickname, setEditingNickname] = useState<string | null>(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  
  // Drag and drop
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallets' | 'settings'>('dashboard')
  

  // Handle wallet connection - create/get user in DB
  const handleUserLogin = useCallback(async (walletAddress: string) => {
    setUserLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })
      const data = await res.json()
      
      if (data.user) {
        setUser(data.user)
        console.log(data.isNewUser ? 'New user created!' : 'User logged in!')
      }
    } catch (error) {
      console.error('Failed to login user:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  // Fetch user's favorites
  const fetchFavorites = useCallback(async (userWallet: string) => {
    try {
      const res = await fetch(`/api/favorites?userWallet=${userWallet}`)
      const data = await res.json()
      if (data.favorites) {
        setFavorites(new Set(data.favorites.map((f: { wallet_address: string }) => f.wallet_address)))
        setFavoriteWallets(data.favorites)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }, [])

  // Add/Remove favorite
  const toggleFavorite = async (walletAddress: string) => {
    if (!publicKey) return
    
    const userWallet = publicKey.toBase58()
    const isFavorited = favorites.has(walletAddress)
    
    // Optimistic update
    setFavoritesLoading(prev => new Set(prev).add(walletAddress))
    
    try {
      if (isFavorited) {
        // Remove favorite
        const res = await fetch(`/api/favorites?userWallet=${userWallet}&walletAddress=${walletAddress}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setFavorites(prev => {
            const next = new Set(prev)
            next.delete(walletAddress)
            return next
          })
          setFavoriteWallets(prev => prev.filter(f => f.wallet_address !== walletAddress))
        }
      } else {
        // Add favorite
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userWallet, walletAddress })
        })
        if (res.ok) {
          setFavorites(prev => new Set(prev).add(walletAddress))
          // Refresh favorites to get full data
          fetchFavorites(userWallet)
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setFavoritesLoading(prev => {
        const next = new Set(prev)
        next.delete(walletAddress)
        return next
      })
    }
  }

  // Effect: When wallet connects, login/create user
  useEffect(() => {
    if (connected && publicKey) {
      handleUserLogin(publicKey.toBase58())
      fetchFavorites(publicKey.toBase58())
    } else {
      setUser(null)
      setFavorites(new Set())
    }
  }, [connected, publicKey, handleUserLogin, fetchFavorites])

  // Handle connect button click
  const handleConnectClick = () => {
    if (connected) {
      disconnect()
    } else {
      setVisible(true)
    }
  }

  // Fetch wallets from API with pagination
  const fetchWallets = async (range?: string, filter?: string, page?: number, query?: string, tag?: string) => {
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
      if (searchVal) params.set('search', searchVal)
      if (tagVal) params.set('tag', tagVal)
      
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

  // Check last scan time
  const checkScanStatus = async () => {
    try {
      const res = await fetch('/api/scan')
      const data = await res.json()
      setLastScan(data.lastScan)
    } catch {
      // Ignore
    }
  }

  // Fetch wallet details with chart data
  const fetchWalletDetails = async (address: string) => {
    setLoadingDetails(true)
    setWalletDetails(null)
    
    try {
      // Fetch with chart data (30 days)
      const res = await fetch(`/api/wallets/${address}?chart=true&days=30`)
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
  
  // Fetch favorite wallet details with chart data
  const fetchFavoriteDetails = async (address: string) => {
    setLoadingFavoriteDetails(true)
    setFavoriteDetails(null)
    
    try {
      const res = await fetch(`/api/wallets/${address}?chart=true&days=30`)
      const data = await res.json()
      
      if (!data.error) {
        setFavoriteDetails(data)
      }
    } catch (error) {
      console.error('Error fetching favorite wallet details:', error)
    } finally {
      setLoadingFavoriteDetails(false)
    }
  }

  // Handle wallet selection
  const handleWalletClick = (address: string) => {
    setSelectedWallet(address)
    fetchWalletDetails(address)
  }

  // Handle time range change
  const handleTimeRangeChange = (range: 'all' | '24h' | '7d' | '30d') => {
    setTimeRange(range)
    setCurrentPage(1) // Reset to first page
    setLoading(true)
    fetchWallets(range, filterType, 1)
  }

  // Handle filter type change
  const handleFilterTypeChange = (type: 'discovered' | 'activity') => {
    setFilterType(type)
    setCurrentPage(1) // Reset to first page
    setLoading(true)
    fetchWallets(timeRange, type, 1)
  }
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setLoading(true)
    fetchWallets(timeRange, filterType, page, searchQuery, activeTag)
  }
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, filterType, 1, query, activeTag)
  }
  
  // Handle tag filter
  const handleTagFilter = (tag: string) => {
    const newTag = activeTag === tag ? '' : tag
    setActiveTag(newTag)
    setCurrentPage(1)
    setLoading(true)
    fetchWallets(timeRange, filterType, 1, searchQuery, newTag)
  }
  
  // Export wallets as CSV
  const exportCSV = () => {
    if (wallets.length === 0) return
    const headers = ['Address', 'Total PnL %', 'Avg PnL %', 'Trades', 'Tokens', 'Tags', 'Last Trade']
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
  
  // Start editing nickname
  const startEditNickname = (walletAddress: string, currentNickname: string | null, currentNotes?: string | null) => {
    setEditingNickname(walletAddress)
    setNicknameInput(currentNickname || '')
    setNotesInput(currentNotes || '')
  }
  
  // Save nickname
  const saveNickname = async (walletAddress: string) => {
    if (!publicKey) return
    try {
      await fetch('/api/favorites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toBase58(),
          walletAddress,
          nickname: nicknameInput,
          notes: notesInput
        })
      })
      // Update local state
      setFavoriteWallets(prev => prev.map(f => 
        f.wallet_address === walletAddress 
          ? { ...f, nickname: nicknameInput || null }
          : f
      ))
      setEditingNickname(null)
    } catch (error) {
      console.error('Failed to save nickname:', error)
    }
  }

  // Drag and drop reorder
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  
  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }
  
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd()
      return
    }
    
    // Optimistic reorder
    const prev = [...favoriteWallets]
    const updated = [...favoriteWallets]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(dropIndex, 0, moved)
    setFavoriteWallets(updated)
    handleDragEnd()
    
    // Persist to DB
    if (!publicKey) return
    try {
      const order = updated.map((fav, i) => ({
        wallet_address: fav.wallet_address,
        sort_order: i
      }))
      const res = await fetch('/api/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: publicKey.toBase58(), order })
      })
      if (!res.ok) {
        // Rollback on failure
        setFavoriteWallets(prev)
      }
    } catch {
      setFavoriteWallets(prev)
    }
  }
  
  // Trigger manual scan
  const triggerScan = async () => {
    setScanning(true)
    setScanResult(null)
    
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      setScanResult(data)
      
      if (data.success) {
        // Refresh wallet list and reset to first page
        setCurrentPage(1)
        await fetchWallets(timeRange, filterType, 1)
        await checkScanStatus()
      }
    } catch (error) {
      setScanResult({ success: false, message: 'Network error', error: 'Failed to connect' })
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    fetchWallets()
    checkScanStatus()
  }, [])

  // Format time ago
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Shorten address
  const shortAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Background image */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('/hero.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Header */}
      <header className="border-b border-border bg-bg/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo_w.png" alt="SIGNAL" className="h-6 w-auto" />
              <span className="text-xl font-semibold tracking-tight">SIGNAL</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={activeTab === 'dashboard' ? 'text-white' : 'hover:text-white transition-colors'}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('wallets')}
                className={activeTab === 'wallets' ? 'text-white' : 'hover:text-white transition-colors'}
              >
                Wallets {favorites.size > 0 && <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{favorites.size}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={activeTab === 'settings' ? 'text-white' : 'hover:text-white transition-colors'}
              >
                Settings
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-muted">Solana</span>
            </div>
            <button
              onClick={handleConnectClick}
              disabled={userLoading}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                connected 
                  ? 'bg-surface border border-border text-white hover:border-white/20' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {userLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              ) : connected && publicKey ? (
                `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Connect Wallet Notice */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
            <p className="text-muted max-w-md mb-8">
              Connect your Solana wallet to access SIGNAL. Track elite wallets, 
              save favorites, and get personalized alerts.
            </p>
            <button
              onClick={handleConnectClick}
              className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors text-lg"
            >
              Connect Wallet
            </button>
            <p className="text-xs text-muted mt-4">
              Supports Phantom, Solflare, and other Solana wallets
            </p>
          </motion.div>
        )}

        {/* Main App Content - only shown when connected */}
        {connected && (
          <>
        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
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
            { label: 'Top Total PnL', value: globalStats.topPnl ? `+${globalStats.topPnl}%` : '-', change: 'best performer' },
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
              <div className="px-6 py-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold">Top Performing Wallets</h2>
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
                  <div className="flex items-center gap-2">
                    {(['all', '24h', '7d', '30d'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          timeRange === range
                            ? 'bg-white/10 text-white'
                            : 'text-muted hover:text-white'
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
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted">Sort by:</span>
                  <button
                    onClick={() => handleFilterTypeChange('discovered')}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterType === 'discovered'
                        ? 'bg-white/10 text-white'
                        : 'text-muted hover:text-white'
                    }`}
                  >
                    Discovery Date
                  </button>
                  <button
                    onClick={() => handleFilterTypeChange('activity')}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterType === 'activity'
                        ? 'bg-white/10 text-white'
                        : 'text-muted hover:text-white'
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
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-muted border-b border-border">
                        <th className="text-left px-6 py-3 font-medium">Wallet</th>
                        <th className="text-right px-6 py-3 font-medium">Total PnL</th>
                        <th className="text-right px-6 py-3 font-medium">Avg PnL</th>
                        <th className="text-right px-6 py-3 font-medium">Trades</th>
                        <th className="text-right px-6 py-3 font-medium">Tokens</th>
                        <th className="text-right px-6 py-3 font-medium"></th>
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
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-mono">
                                {wallet.address.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-mono text-sm">{shortAddress(wallet.address)}</div>
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
                          <td className="px-6 py-4 text-right text-emerald-500 font-semibold">
                            +{wallet.total_pnl || wallet.pnl_percent}%
                          </td>
                          <td className="px-6 py-4 text-right">+{wallet.pnl_percent}%</td>
                          <td className="px-6 py-4 text-right text-muted">{wallet.total_trades}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-1 bg-white/5 rounded text-xs">{wallet.appearances || wallet.winning_tokens}×</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(wallet.address)
                              }}
                              disabled={favoritesLoading.has(wallet.address)}
                              className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                                favorites.has(wallet.address)
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'border-border hover:border-white/30'
                              }`}
                            >
                              {favoritesLoading.has(wallet.address) ? (
                                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : favorites.has(wallet.address) ? (
                                '★ Saved'
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
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                      <div className="text-sm text-muted">
                        Showing {((currentPage - 1) * walletsPerPage) + 1}-{Math.min(currentPage * walletsPerPage, totalWallets)} of {totalWallets} wallets
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {/* Page numbers */}
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
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold">Wallet Details</h2>
                  <button 
                    onClick={() => { setSelectedWallet(null); setWalletDetails(null); }}
                    className="text-muted hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6">
                  <p className="font-mono text-xs break-all text-muted mb-4">{selectedWallet}</p>
                  
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
                              tickFormatter={(value) => value.slice(5)} // Show MM-DD
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
                              labelFormatter={(label) => `Date: ${label}`}
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
        )}

        {/* ==================== WALLETS TAB (Favorites) ==================== */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">My Wallets</h1>
                <p className="text-muted mt-1">Your tracked and favorited wallets</p>
              </div>
            </div>

            {favoriteWallets.length === 0 ? (
              <div 
                className="rounded-xl border border-border p-12 text-center relative overflow-hidden backdrop-blur-sm"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(16,185,129,0.05) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">★</span>
                </div>
                <h3 className="font-semibold mb-2">No favorites yet</h3>
                <p className="text-sm text-muted mb-4">
                  Go to the Dashboard and click "Track" on wallets you want to follow
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                >
                  Browse Wallets
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Wallet List */}
                <div className="lg:col-span-2">
                  <div 
                    className="rounded-xl border border-border overflow-hidden relative backdrop-blur-sm"
                    style={{
                      background: `radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 40%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
                    }}
                  >
                    <div className="px-6 py-4 border-b border-border">
                      <h2 className="font-semibold">Tracked Wallets ({favoriteWallets.length})</h2>
                    </div>
                    <div className="divide-y divide-border">
                      {favoriteWallets.map((fav, index) => (
                        <div 
                          key={fav.wallet_address}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`transition-all duration-150 ${
                            dragIndex === index ? 'opacity-30 scale-[0.97] bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded-lg' : ''
                          } ${dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-t-emerald-500 bg-white/[0.03]' : ''}`}
                        >
                          <div 
                            onClick={() => {
                              if (editingNickname !== fav.wallet_address) {
                                setSelectedFavorite(fav.wallet_address)
                                fetchFavoriteDetails(fav.wallet_address)
                              }
                            }}
                            className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                              selectedFavorite === fav.wallet_address ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Drag handle */}
                                <div 
                                  className="cursor-grab active:cursor-grabbing text-muted/40 hover:text-muted transition-colors shrink-0"
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                  </svg>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-sm font-mono text-emerald-400">
                                  {fav.wallet_address.slice(0, 2)}
                                </div>
                                <div>
                                  {fav.nickname ? (
                                    <div className="font-medium text-sm">{fav.nickname}</div>
                                  ) : null}
                                  <div className={`font-mono text-sm ${fav.nickname ? 'text-muted text-xs' : ''}`}>
                                    {fav.wallet_address.slice(0, 6)}...{fav.wallet_address.slice(-6)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {fav.walletData && (
                                  <div className="text-right">
                                    <div className="text-emerald-500 font-semibold">+{fav.walletData.total_pnl || fav.walletData.pnl_percent}%</div>
                                    <div className="text-xs text-muted">{fav.walletData.total_trades} trades</div>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditNickname(fav.wallet_address, fav.nickname)
                                  }}
                                  className="px-2 py-1.5 text-xs border border-border rounded-lg hover:border-white/30 transition-colors text-muted hover:text-white"
                                  title="Edit nickname"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFavorite(fav.wallet_address)
                                  }}
                                  className="px-2 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                  title="Remove"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Inline Nickname Editor */}
                          {editingNickname === fav.wallet_address && (
                            <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 bg-white/[0.02]">
                              <div>
                                <label className="text-xs text-muted block mb-1">Nickname</label>
                                <input
                                  type="text"
                                  value={nicknameInput}
                                  onChange={(e) => setNicknameInput(e.target.value)}
                                  placeholder="e.g. Smart Degen, Alpha Wallet..."
                                  className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-sm placeholder:text-muted/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveNickname(fav.wallet_address)
                                    if (e.key === 'Escape') setEditingNickname(null)
                                  }}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveNickname(fav.wallet_address)}
                                  className="px-4 py-1.5 text-xs bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNickname(null)}
                                  className="px-4 py-1.5 text-xs border border-border rounded-lg hover:border-white/30 text-muted hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Wallet Details Sidebar */}
                <div className="lg:col-span-1">
                  {selectedFavorite ? (
                    <div 
                      className="rounded-xl border border-border overflow-hidden sticky top-24 backdrop-blur-sm"
                      style={{
                        background: `radial-gradient(ellipse at top right, rgba(16,185,129,0.08) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
                      }}
                    >
                      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold">Wallet Details</h2>
                        <button
                          onClick={() => {
                            setSelectedFavorite(null)
                            setFavoriteDetails(null)
                          }}
                          className="text-muted hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {loadingFavoriteDetails ? (
                        <div className="p-4 space-y-4 animate-pulse">
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="h-3 w-12 bg-white/5 rounded mb-2" />
                            <div className="h-4 w-full bg-white/5 rounded" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="p-3 bg-white/5 rounded-lg">
                                <div className="h-3 w-12 bg-white/5 rounded mb-2" />
                                <div className="h-5 w-16 bg-white/5 rounded" />
                              </div>
                            ))}
                          </div>
                          <div className="h-40 bg-white/5 rounded-lg" />
                          <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="h-8 bg-white/5 rounded-lg" />
                            ))}
                          </div>
                        </div>
                      ) : favoriteDetails ? (
                        <div className="p-4 space-y-4">
                          {/* Address */}
                          <div className="p-3 bg-white/5 rounded-lg">
                            <div className="text-xs text-muted mb-1">Address</div>
                            <div className="font-mono text-sm break-all">{selectedFavorite}</div>
                          </div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-lg">
                              <div className="text-xs text-muted mb-1">Total PnL</div>
                              <div className="text-emerald-500 font-semibold">
                                +{favoriteDetails.wallet?.total_pnl || favoriteDetails.wallet?.pnl_percent || 0}%
                              </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <div className="text-xs text-muted mb-1">Avg PnL</div>
                              <div className="text-emerald-500 font-semibold">
                                +{favoriteDetails.wallet?.pnl_percent || 0}%
                              </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <div className="text-xs text-muted mb-1">Trades</div>
                              <div className="font-semibold">{favoriteDetails.wallet?.total_trades || 0}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                              <div className="text-xs text-muted mb-1">Tokens</div>
                              <div className="font-semibold">{favoriteDetails.totalTokens || 0}</div>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {favoriteDetails.wallet?.tags && favoriteDetails.wallet.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {favoriteDetails.wallet.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    tag === 'Smart Money' ? 'bg-emerald-500/20 text-emerald-400' :
                                    tag === 'Whale' ? 'bg-blue-500/20 text-blue-400' :
                                    tag === 'Insider' ? 'bg-purple-500/20 text-purple-400' :
                                    tag === 'Consistent' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-white/10 text-white/70'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* 30-Day PnL Chart */}
                          {favoriteDetails.chartData && favoriteDetails.chartData.length > 0 && (
                            <div>
                              <div className="text-xs text-muted mb-2">30-Day PnL</div>
                              <div className="h-40 w-full bg-white/5 rounded-lg p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={favoriteDetails.chartData}>
                                    <defs>
                                      <linearGradient id="favPnlGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fontSize: 10, fill: '#6b7280' }}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return `${date.getMonth()+1}/${date.getDate()}`
                                      }}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 10, fill: '#6b7280' }}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                      width={45}
                                    />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'rgba(9,9,11,0.95)', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                      }}
                                      formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, 'PnL']}
                                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="realizedProfitUsd" 
                                      stroke="#10b981" 
                                      fill="url(#favPnlGradient)"
                                      strokeWidth={2}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                          
                          {/* Token History */}
                          {favoriteDetails.tokenHistory && favoriteDetails.tokenHistory.length > 0 && (
                            <div>
                              <div className="text-xs text-muted mb-2">Token History</div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {favoriteDetails.tokenHistory.map((token: TokenHistory, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{token.token_symbol || 'Unknown'}</span>
                                    </div>
                                    <div className="text-emerald-500">+{token.pnl_at_discovery}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* External Links */}
                          <div className="flex gap-2 pt-2">
                            <a
                              href={`https://solscan.io/account/${selectedFavorite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-2 text-center text-sm border border-border rounded-lg hover:border-white/30 transition-colors"
                            >
                              Solscan
                            </a>
                            <a
                              href={`https://birdeye.so/profile/${selectedFavorite}?chain=solana`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-2 text-center text-sm border border-border rounded-lg hover:border-white/30 transition-colors"
                            >
                              Birdeye
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted text-sm">
                          Failed to load details
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="rounded-xl border border-border p-8 text-center backdrop-blur-sm"
                      style={{
                        background: `radial-gradient(ellipse at center, rgba(16,185,129,0.05) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">👈</span>
                      </div>
                      <p className="text-sm text-muted">
                        Click on a wallet to see details, PnL chart, and token history
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-muted mt-1">Manage your account and preferences</p>
            </div>

            {/* Account Info */}
            <div 
              className="rounded-xl border border-border p-6 relative overflow-hidden backdrop-blur-sm"
              style={{
                background: `radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
              }}
            >
              <h2 className="font-semibold mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-sm text-muted">Wallet Address</div>
                    <div className="font-mono text-sm mt-1">{publicKey?.toBase58()}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(publicKey?.toBase58() || '')}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg hover:border-white/30 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                
                {user && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-sm text-muted">Member Since</div>
                        <div className="text-sm mt-1">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted">Plan</div>
                          <div className="text-sm mt-1">Free</div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                          Beta
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-2">All features are free during beta.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div 
              className="rounded-xl border border-border p-6 relative overflow-hidden backdrop-blur-sm"
              style={{
                background: `radial-gradient(ellipse at top right, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
              }}
            >
              <h2 className="font-semibold mb-4">Your Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <div className="text-2xl font-semibold">{favorites.size}</div>
                  <div className="text-xs text-muted mt-1">Tracked Wallets</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <div className="text-2xl font-semibold">0</div>
                  <div className="text-xs text-muted mt-1">Alerts Received</div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div 
              className="rounded-xl border border-red-500/20 p-6 relative overflow-hidden backdrop-blur-sm"
              style={{
                background: `radial-gradient(ellipse at top left, rgba(239,68,68,0.08) 0%, transparent 50%), linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.9))`
              }}
            >
              <h2 className="font-semibold mb-4 text-red-400">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Disconnect Wallet</div>
                    <div className="text-xs text-muted">Sign out of your account</div>
                  </div>
                  <button
                    onClick={() => {
                      disconnect()
                      setActiveTab('dashboard')
                    }}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
