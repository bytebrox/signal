-- SIGNAL Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Tracked Wallets Table
CREATE TABLE IF NOT EXISTS tracked_wallets (
  id BIGSERIAL PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  pnl_percent NUMERIC DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_tokens INTEGER DEFAULT 0,
  appearances INTEGER DEFAULT 1,
  avg_return NUMERIC DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Token History - tracks which wallet was found at which token
CREATE TABLE IF NOT EXISTS wallet_token_history (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  pnl_at_discovery NUMERIC DEFAULT 0,
  trades_at_discovery INTEGER DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, token_address)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_pnl ON tracked_wallets(pnl_percent DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_win_rate ON tracked_wallets(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_updated ON tracked_wallets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_appearances ON tracked_wallets(appearances DESC);
CREATE INDEX IF NOT EXISTS idx_history_wallet ON wallet_token_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_history_token ON wallet_token_history(token_address);

-- Enable Row Level Security (optional, for public read access)
ALTER TABLE tracked_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read" ON tracked_wallets
  FOR SELECT USING (true);

-- Policy: Allow service role to insert/update
CREATE POLICY "Allow service role write" ON tracked_wallets
  FOR ALL USING (auth.role() = 'service_role');

-- RLS for wallet_token_history
ALTER TABLE wallet_token_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read history" ON wallet_token_history
  FOR SELECT USING (true);

CREATE POLICY "Allow service role write history" ON wallet_token_history
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Wallet Trades Table (for detailed tracking)
CREATE TABLE IF NOT EXISTS wallet_trades (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES tracked_wallets(address) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  action TEXT CHECK (action IN ('BUY', 'SELL')),
  amount_usd NUMERIC,
  price_at_trade NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_wallet ON wallet_trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON wallet_trades(timestamp DESC);

-- Enable RLS
ALTER TABLE wallet_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read trades" ON wallet_trades
  FOR SELECT USING (true);

CREATE POLICY "Allow service role write trades" ON wallet_trades
  FOR ALL USING (auth.role() = 'service_role');
