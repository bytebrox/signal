import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface TrackedWallet {
  id?: number
  address: string
  pnl_percent: number
  win_rate: number
  total_trades: number
  winning_tokens: number
  avg_return: number
  last_trade_at: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

export interface WalletTrade {
  id?: number
  wallet_address: string
  token_address: string
  token_symbol: string
  action: 'BUY' | 'SELL'
  amount_usd: number
  timestamp: string
  created_at?: string
}
