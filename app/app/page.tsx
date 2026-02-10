'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import DashboardTab from '@/app/components/DashboardTab'
import WalletsTab from '@/app/components/WalletsTab'
import SettingsTab from '@/app/components/SettingsTab'
import { User, FavoriteWallet } from '@/lib/types'

export default function App() {
  // Wallet connection
  const { publicKey, connected, connecting, disconnect, select, connect, wallets } = useWallet()
  const { setVisible } = useWalletModal()
  
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  
  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState<Set<string>>(new Set())
  const [favoriteWallets, setFavoriteWallets] = useState<FavoriteWallet[]>([])
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallets' | 'settings'>('dashboard')

  // Connection error handling
  const [connectError, setConnectError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const wasConnectingRef = useRef(false)

  // Detect failed connection attempts (connecting -> not connecting, but not connected)
  useEffect(() => {
    if (connecting) {
      wasConnectingRef.current = true
      setConnectError(null)
    }
    if (!connecting && wasConnectingRef.current && !connected) {
      wasConnectingRef.current = false
      // Connection attempt ended without success — try direct fallback
      attemptDirectConnect()
    }
    if (connected) {
      wasConnectingRef.current = false
      setConnectError(null)
    }
  }, [connecting, connected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Direct Phantom connection fallback for browsers where adapter fails (Firefox)
  const attemptDirectConnect = useCallback(async () => {
    const phantom = (window as any).phantom?.solana || (window as any).solana
    if (!phantom?.isPhantom) {
      setConnectError(
        'Wallet connection failed. Please refresh the page and try again. ' +
        'If the issue persists, try Solflare as an alternative.'
      )
      return
    }

    try {
      console.log('[Wallet] Standard connection failed, attempting direct Phantom connect...')
      // Connect directly via Phantom's injected provider
      const resp = await Promise.race([
        phantom.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ])
      
      if (resp?.publicKey) {
        console.log('[Wallet] Direct Phantom connect succeeded, syncing adapter...')
        // Find and select Phantom in the adapter to sync state
        const phantomWallet = wallets.find(
          w => w.adapter.name.toLowerCase().includes('phantom')
        )
        if (phantomWallet) {
          select(phantomWallet.adapter.name)
          // Small delay to let the adapter register the selection
          await new Promise(r => setTimeout(r, 500))
          try { await connect() } catch { /* adapter may already be connected */ }
        }
      }
    } catch (err: any) {
      if (err?.message === 'timeout') {
        setConnectError(
          'Phantom is not responding. This is a known issue with Phantom in some browsers. ' +
          'Please try: 1) Refresh the page, 2) Disable and re-enable the Phantom extension, ' +
          'or 3) Use Solflare as an alternative.'
        )
      } else if (err?.code === 4001) {
        // User rejected — not an error
        setConnectError(null)
      } else {
        console.warn('[Wallet] Direct connect failed:', err)
        setConnectError(
          'Connection failed. Please refresh the page and try again. ' +
          'If the problem persists in this browser, try using Solflare instead.'
        )
      }
    }
  }, [wallets, select, connect])

  // Manual retry handler
  const handleRetryConnect = async () => {
    setRetrying(true)
    setConnectError(null)
    try {
      // Try through the adapter first
      const phantomWallet = wallets.find(
        w => w.adapter.name.toLowerCase().includes('phantom')
      )
      if (phantomWallet) {
        select(phantomWallet.adapter.name)
        await new Promise(r => setTimeout(r, 300))
        await connect()
      } else {
        // Fallback to direct
        await attemptDirectConnect()
      }
    } catch {
      await attemptDirectConnect()
    } finally {
      setRetrying(false)
    }
  }

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
    
    setFavoritesLoading(prev => new Set(prev).add(walletAddress))
    
    try {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?userWallet=${userWallet}&walletAddress=${walletAddress}`, { method: 'DELETE' })
        if (res.ok) {
          setFavorites(prev => { const next = new Set(prev); next.delete(walletAddress); return next })
          setFavoriteWallets(prev => prev.filter(f => f.wallet_address !== walletAddress))
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userWallet, walletAddress })
        })
        if (res.ok) {
          setFavorites(prev => new Set(prev).add(walletAddress))
          fetchFavorites(userWallet)
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setFavoritesLoading(prev => { const next = new Set(prev); next.delete(walletAddress); return next })
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

  const handleConnectClick = () => {
    if (connected) { disconnect() } else { setVisible(true) }
  }

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
      
      <Nav
        activePage="app"
        rightContent={
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-muted">Solana</span>
            </div>
            <button
              onClick={handleConnectClick}
              disabled={userLoading}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
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
          </>
        }
        secondaryNav={connected ? (
          <div className="border-t border-border">
            <div className="max-w-[1800px] mx-auto px-4 flex">
              {[
                { key: 'dashboard', label: 'Dashboard', badge: null as number | null },
                { key: 'wallets', label: 'Wallets', badge: favorites.size > 0 ? favorites.size : null },
                { key: 'settings', label: 'Settings', badge: null as number | null },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'dashboard' | 'wallets' | 'settings')}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium text-center transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'text-emerald-400 border-emerald-500'
                      : 'text-muted border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.badge && <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">{tab.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        ) : undefined}
      />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
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
              {connecting || retrying ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : 'Connect Wallet'}
            </button>
            <p className="text-xs text-muted mt-4">
              Supports Phantom, Solflare, and other Solana wallets
            </p>

            {/* Connection Error Banner */}
            <AnimatePresence>
              {connectError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 max-w-lg mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-300">{connectError}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={handleRetryConnect}
                          disabled={retrying}
                          className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-xs font-medium transition-colors"
                        >
                          {retrying ? 'Retrying...' : 'Try Again'}
                        </button>
                        <button
                          onClick={() => setConnectError(null)}
                          className="px-4 py-1.5 bg-surface hover:bg-white/10 border border-border rounded-lg text-muted text-xs font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Main App Content - only shown when connected */}
        {connected && (
          <>
            <div className={activeTab === 'dashboard' ? '' : 'hidden'}>
              <DashboardTab
                favorites={favorites}
                favoritesLoading={favoritesLoading}
                toggleFavorite={toggleFavorite}
              />
            </div>
            <div className={activeTab === 'wallets' ? '' : 'hidden'}>
              <WalletsTab
                userWallet={publicKey?.toBase58() || null}
                favoriteWallets={favoriteWallets}
                setFavoriteWallets={setFavoriteWallets}
                toggleFavorite={toggleFavorite}
                fetchFavorites={fetchFavorites}
                setActiveTab={setActiveTab}
              />
            </div>
            <div className={activeTab === 'settings' ? '' : 'hidden'}>
              <SettingsTab
                walletAddress={publicKey?.toBase58() || null}
                user={user}
                favoritesCount={favorites.size}
                disconnect={disconnect}
                setActiveTab={setActiveTab}
              />
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
