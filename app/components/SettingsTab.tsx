'use client'

import { User } from '@/lib/types'

interface SettingsTabProps {
  walletAddress: string | null
  user: User | null
  favoritesCount: number
  disconnect: () => void
  setActiveTab: (tab: 'dashboard' | 'wallets' | 'settings') => void
}

export default function SettingsTab({ walletAddress, user, favoritesCount, disconnect, setActiveTab }: SettingsTabProps) {
  return (
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
              <div className="font-mono text-sm mt-1">{walletAddress}</div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress || '')}
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
                  <div className="text-sm mt-1">{new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
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
            <div className="text-2xl font-semibold">{favoritesCount}</div>
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
  )
}
