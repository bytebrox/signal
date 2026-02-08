// Shared types and utility functions for the SIGNAL dashboard

export interface User {
  id: number
  wallet_address: string
  created_at: string
  last_login_at: string
  is_premium: boolean
  settings: Record<string, unknown>
}

export interface TrackedWallet {
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

export interface ScanResult {
  success: boolean
  message: string
  tokensScanned?: number
  newFindings?: number
  walletsUpdated?: number
  error?: string
}

export interface TokenHistory {
  id: number
  token_address: string
  token_symbol: string
  pnl_at_discovery: number
  trades_at_discovery: number
  discovered_at: string
  first_buy_at: string | null
  entry_cost_usd: number
  token_deployed_at: string | null
}

export interface ChartDataPoint {
  date: string
  realizedProfitUsd: number
  swaps: number
  volumeUsd: number
}

export interface Holding {
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
  balance: number
  balanceUsd: number
  tokenPriceUsd: number
  firstHeldAt: string | null
}

export interface WalletDetails {
  wallet: TrackedWallet
  tokenHistory: TokenHistory[]
  totalTokens: number
  chartData?: ChartDataPoint[]
  holdings?: Holding[]
}

export interface FavoriteWallet {
  wallet_address: string
  nickname: string | null
  walletData: TrackedWallet | null
}

// --- Utility functions ---

export function formatLastSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function isWalletInactive(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return diffMs > 14 * 24 * 60 * 60 * 1000
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}
