'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

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

interface WalletDetails {
  wallet: TrackedWallet
  tokenHistory: TokenHistory[]
  totalTokens: number
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
  
  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState<Set<string>>(new Set())
  const [favoriteWallets, setFavoriteWallets] = useState<Array<{ wallet_address: string; nickname: string | null; walletData: TrackedWallet | null }>>([])
  
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

  // Fetch wallets from API
  const fetchWallets = async (range?: string, filter?: string) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        range: range || timeRange,
        filterType: filter || filterType
      })
      const res = await fetch(`/api/wallets?${params}`)
      const data = await res.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
        setDbConfigured(false)
        return
      }
      
      setWallets(data.wallets || [])
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

  // Fetch wallet details
  const fetchWalletDetails = async (address: string) => {
    setLoadingDetails(true)
    setWalletDetails(null)
    
    try {
      const res = await fetch(`/api/wallets/${address}`)
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

  // Handle wallet selection
  const handleWalletClick = (address: string) => {
    setSelectedWallet(address)
    fetchWalletDetails(address)
  }

  // Handle time range change
  const handleTimeRangeChange = (range: 'all' | '24h' | '7d' | '30d') => {
    setTimeRange(range)
    setLoading(true)
    fetchWallets(range, filterType)
  }

  // Handle filter type change
  const handleFilterTypeChange = (type: 'discovered' | 'activity') => {
    setFilterType(type)
    setLoading(true)
    fetchWallets(timeRange, type)
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
        // Refresh wallet list
        await fetchWallets()
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
            <button
              onClick={triggerScan}
              disabled={scanning}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                scanning 
                  ? 'bg-white/10 text-muted cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {scanning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <span>◈</span>
                  Run Scan
                </>
              )}
            </button>
          </div>
          
          {/* Scan Result */}
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg ${
                scanResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p className={`text-sm font-medium ${scanResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                {scanResult.success ? '✓' : '✕'} {scanResult.message}
              </p>
              {scanResult.tokensScanned !== undefined && (
                <p className="text-xs text-muted mt-1">
                  Tokens: {scanResult.tokensScanned} | New findings: {scanResult.newFindings || 0} | Wallets updated: {scanResult.walletsUpdated}
                </p>
              )}
              {scanResult.error && (
                <p className="text-xs text-red-400 mt-1">{scanResult.error}</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tracked Wallets', value: wallets.length.toString(), change: 'unique addresses' },
            { label: 'Multi-Token Wallets', value: wallets.filter(w => (w.appearances || w.winning_tokens) >= 2).length.toString(), change: '2+ tokens found' },
            { label: 'Top Total PnL', value: wallets.length ? `+${Math.max(...wallets.map(w => w.total_pnl || w.pnl_percent))}%` : '-', change: 'best performer' },
            { label: 'Total Trades', value: wallets.reduce((a, w) => a + w.total_trades, 0).toLocaleString(), change: 'across all' },
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
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Top Performing Wallets</h2>
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
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted">Filter by:</span>
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
                <div className="p-12 text-center text-muted">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                  Loading wallets...
                </div>
              ) : wallets.length === 0 ? (
                <div className="p-12 text-center text-muted">
                  <p className="mb-2">No wallets tracked yet</p>
                  <p className="text-sm">Click "Run Scan" to discover profitable wallets</p>
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
                  
                  {/* Token History */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-3">Token History</h3>
                    
                    {loadingDetails ? (
                      <div className="py-4 text-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
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
                SIGNAL scans trending Solana tokens by volume, analyzes on-chain transactions, 
                and tracks wallets that consistently appear in profitable trades across multiple tokens.
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
                  {favoriteWallets.map((fav) => (
                    <div key={fav.wallet_address} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-sm font-mono text-emerald-400">
                            {fav.wallet_address.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-mono text-sm">
                              {fav.wallet_address.slice(0, 6)}...{fav.wallet_address.slice(-6)}
                            </div>
                            {fav.nickname && (
                              <div className="text-xs text-muted">{fav.nickname}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {fav.walletData && (
                            <div className="text-right">
                              <div className="text-emerald-500 font-semibold">+{fav.walletData.total_pnl || fav.walletData.pnl_percent}%</div>
                              <div className="text-xs text-muted">{fav.walletData.total_trades} trades</div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://solscan.io/account/${fav.wallet_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:border-white/30 transition-colors"
                            >
                              Solscan
                            </a>
                            <button
                              onClick={() => toggleFavorite(fav.wallet_address)}
                              className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                        <div className="text-sm mt-1">{new Date(user.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-sm text-muted">Plan</div>
                        <div className="text-sm mt-1">{user.is_premium ? 'Premium' : 'Free'}</div>
                      </div>
                      {!user.is_premium && (
                        <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                          Upgrade
                        </button>
                      )}
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
