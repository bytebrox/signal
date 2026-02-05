import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Codex, TokenRankingAttribute, RankingDirection, TradingPeriod } from '@codex-data/sdk'

// Lazy initialization
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Codex SDK
const CODEX_API_KEY = process.env.CODEX_API_KEY
const SOLANA_NETWORK = 1399811149

function getCodex(): Codex | null {
  if (!CODEX_API_KEY) return null
  return new Codex(CODEX_API_KEY)
}

interface TokenData {
  address: string
  symbol: string
  name: string
  priceChange24: number
  volume24: number
  liquidity: number
}

interface TopTraderData {
  walletAddress: string
  tokenAddress: string
  tokenSymbol: string
  realizedProfitUsd: number
  realizedProfitPercent: number
  volumeUsd: number
  buys: number
  sells: number
  tokenBalance: string
  lastTradeAt: number
}

// Fetch trending tokens from Codex - multiple strategies for variety
async function fetchTrendingTokens(limit: number = 30): Promise<TokenData[]> {
  const codex = getCodex()
  if (!codex) {
    console.error('Codex API key not configured')
    return []
  }

  try {
    console.log('Fetching tokens from Codex with multiple strategies...')
    
    const allTokens: TokenData[] = []
    const seenAddresses = new Set<string>()
    
    // Strategy 1: Top gainers (high price change) - find pumping tokens
    try {
      const gainersResponse = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK],
          liquidity: { gte: 1000, lte: 500000 }, // Smaller tokens, not mega caps
          volume24: { gte: 5000 },
          change24: { gte: 0.1 }, // At least 10% up
        },
        rankings: [{ 
          attribute: TokenRankingAttribute.Change24, 
          direction: RankingDirection.Desc 
        }],
        limit: 15,
      })
      
      const gainers = gainersResponse?.filterTokens?.results || []
      console.log(`Strategy 1 (Gainers): ${gainers.length} tokens`)
      
      for (const data of gainers) {
        if (!data) continue
        const token = (data as any).token || data
        const address = token?.address || ''
        if (address && address.length > 30 && !seenAddresses.has(address)) {
          seenAddresses.add(address)
          allTokens.push({
            address,
            symbol: token?.symbol || '???',
            name: token?.name || 'Unknown',
            priceChange24: ((data as any).change24 || 0) * 100,
            volume24: (data as any).volume24 || 0,
            liquidity: (data as any).liquidity || 0,
          })
        }
      }
    } catch (e) {
      console.error('Strategy 1 error:', e)
    }
    
    // Strategy 2: High volume with recent activity - active trading
    try {
      const volumeResponse = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK],
          liquidity: { gte: 2000, lte: 1000000 },
          volume24: { gte: 20000 },
          txnCount24: { gte: 100 }, // At least 100 transactions
        },
        rankings: [{ 
          attribute: TokenRankingAttribute.Volume24, 
          direction: RankingDirection.Desc 
        }],
        limit: 15,
      })
      
      const volumeTokens = volumeResponse?.filterTokens?.results || []
      console.log(`Strategy 2 (Volume): ${volumeTokens.length} tokens`)
      
      for (const data of volumeTokens) {
        if (!data) continue
        const token = (data as any).token || data
        const address = token?.address || ''
        if (address && address.length > 30 && !seenAddresses.has(address)) {
          seenAddresses.add(address)
          allTokens.push({
            address,
            symbol: token?.symbol || '???',
            name: token?.name || 'Unknown',
            priceChange24: ((data as any).change24 || 0) * 100,
            volume24: (data as any).volume24 || 0,
            liquidity: (data as any).liquidity || 0,
          })
        }
      }
    } catch (e) {
      console.error('Strategy 2 error:', e)
    }
    
    // Strategy 3: New tokens with traction (low liquidity but activity)
    try {
      const newResponse = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK],
          liquidity: { gte: 500, lte: 50000 }, // Very small, new tokens
          volume24: { gte: 1000 },
          txnCount24: { gte: 50 },
        },
        rankings: [{ 
          attribute: TokenRankingAttribute.TxnCount24, 
          direction: RankingDirection.Desc 
        }],
        limit: 15,
      })
      
      const newTokens = newResponse?.filterTokens?.results || []
      console.log(`Strategy 3 (New): ${newTokens.length} tokens`)
      
      for (const data of newTokens) {
        if (!data) continue
        const token = (data as any).token || data
        const address = token?.address || ''
        if (address && address.length > 30 && !seenAddresses.has(address)) {
          seenAddresses.add(address)
          allTokens.push({
            address,
            symbol: token?.symbol || '???',
            name: token?.name || 'Unknown',
            priceChange24: ((data as any).change24 || 0) * 100,
            volume24: (data as any).volume24 || 0,
            liquidity: (data as any).liquidity || 0,
          })
        }
      }
    } catch (e) {
      console.error('Strategy 3 error:', e)
    }
    
    console.log(`Total unique tokens: ${allTokens.length}`)
    
    // Shuffle to add variety between scans
    const shuffled = allTokens.sort(() => Math.random() - 0.5)
    
    return shuffled.slice(0, limit)
  } catch (error) {
    console.error('Error fetching from Codex:', error)
    return []
  }
}

// Fetch top traders for a token using Codex tokenTopTraders
async function fetchTopTraders(
  codex: Codex, 
  tokenAddress: string, 
  tokenSymbol: string,
  limit: number = 20
): Promise<TopTraderData[]> {
  try {
    const response = await codex.queries.tokenTopTraders({
      input: {
        tokenAddress,
        networkId: SOLANA_NETWORK,
        tradingPeriod: TradingPeriod.Week, // Last 7 days
        limit,
      }
    })
    
    const items = response?.tokenTopTraders?.items || []
    const traders: TopTraderData[] = []
    
    for (const trader of items) {
      if (!trader || !trader.walletAddress) continue
      
      // Only include profitable traders
      const profitUsd = parseFloat(trader.realizedProfitUsd || '0')
      const profitPercent = trader.realizedProfitPercentage || 0
      
      if (profitUsd > 0 && profitPercent > 5) { // At least 5% profit
        traders.push({
          walletAddress: trader.walletAddress,
          tokenAddress: trader.tokenAddress,
          tokenSymbol,
          realizedProfitUsd: profitUsd,
          realizedProfitPercent: profitPercent,
          volumeUsd: parseFloat(trader.volumeUsd || '0'),
          buys: trader.buys || 0,
          sells: trader.sells || 0,
          tokenBalance: trader.tokenBalance || '0',
          lastTradeAt: trader.lastTransactionAt || Date.now() / 1000
        })
      }
    }
    
    return traders
  } catch (error) {
    console.error(`Error fetching top traders for ${tokenSymbol}:`, error)
    return []
  }
}

// Generate tags based on stats
function generateTags(appearances: number, totalPnlUsd: number, totalPnlPercent: number, totalTrades: number): string[] {
  const tags: string[] = []
  if (appearances >= 5) tags.push('Consistent')
  if (appearances >= 3) tags.push('Multi-Winner')
  if (totalPnlUsd > 10000) tags.push('Whale')
  else if (totalPnlUsd > 1000) tags.push('High PnL')
  if (totalPnlPercent > 500) tags.push('10x Hunter')
  if (totalTrades > 30) tags.push('Active')
  if (appearances >= 2 && totalPnlUsd > 500) tags.push('Smart Money')
  if (tags.length === 0) tags.push('Tracked')
  return tags
}

export async function POST() {
  try {
    const supabase = getSupabase()
    const codex = getCodex()
    
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
    }
    
    if (!codex) {
      return NextResponse.json({ success: false, error: 'Codex API key not configured' }, { status: 500 })
    }
    
    console.log('Starting wallet scan with Codex tokenTopTraders...')
    
    // Step 1: Get trending tokens from Codex
    const tokens = await fetchTrendingTokens(20)
    console.log(`Found ${tokens.length} trending tokens from Codex`)
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No tokens found from Codex',
        walletsUpdated: 0 
      })
    }
    
    // Step 2: Get top traders for each token using Codex tokenTopTraders
    const allTraders: TopTraderData[] = []
    
    for (const token of tokens) {
      console.log(`Fetching top traders for ${token.symbol} (${token.address.slice(0, 8)}...)`)
      
      const traders = await fetchTopTraders(codex, token.address, token.symbol, 15)
      allTraders.push(...traders)
      
      console.log(`  Found ${traders.length} profitable traders`)
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200))
    }
    
    console.log(`Found ${allTraders.length} profitable traders total`)
    
    if (allTraders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profitable traders found',
        tokensScanned: tokens.length,
        walletsUpdated: 0
      })
    }
    
    // Step 3: Check for NEW findings (wallet+token combinations we haven't seen)
    const uniqueWallets = [...new Set(allTraders.map(t => t.walletAddress))]
    
    const { data: existingHistory } = await supabase
      .from('wallet_token_history')
      .select('wallet_address, token_address')
      .in('wallet_address', uniqueWallets)
    
    const historySet = new Set(
      (existingHistory || []).map(h => `${h.wallet_address}:${h.token_address}`)
    )
    
    const newTraders = allTraders.filter(t => 
      !historySet.has(`${t.walletAddress}:${t.tokenAddress}`)
    )
    
    console.log(`${newTraders.length} NEW findings (${allTraders.length - newTraders.length} already tracked)`)
    
    if (newTraders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new wallet+token combinations found',
        tokensScanned: tokens.length,
        newFindings: 0,
        walletsUpdated: 0
      })
    }
    
    // Step 4: Insert new findings into history with REAL PnL data from Codex
    const historyInserts = newTraders.map(t => ({
      wallet_address: t.walletAddress,
      token_address: t.tokenAddress,
      token_symbol: t.tokenSymbol,
      pnl_at_discovery: Math.round(t.realizedProfitPercent), // Real % from Codex
      pnl_usd_at_discovery: Math.round(t.realizedProfitUsd * 100) / 100, // Real USD profit
      trades_at_discovery: t.buys + t.sells,
      volume_usd: Math.round(t.volumeUsd * 100) / 100,
      discovered_at: new Date().toISOString()
    }))
    
    const { error: historyError } = await supabase
      .from('wallet_token_history')
      .insert(historyInserts)
    
    if (historyError) {
      console.error('History insert error:', historyError)
      // Continue anyway - wallet stats still get updated
    }
    
    // Step 5: Aggregate per wallet with REAL data
    const walletUpdates = new Map<string, { 
      pnlUsd: number
      pnlPercent: number
      trades: number
      tokens: number
      volumeUsd: number
    }>()
    
    for (const trader of newTraders) {
      const existing = walletUpdates.get(trader.walletAddress) || { 
        pnlUsd: 0, pnlPercent: 0, trades: 0, tokens: 0, volumeUsd: 0 
      }
      existing.pnlUsd += trader.realizedProfitUsd
      existing.pnlPercent += trader.realizedProfitPercent
      existing.trades += trader.buys + trader.sells
      existing.tokens += 1
      existing.volumeUsd += trader.volumeUsd
      walletUpdates.set(trader.walletAddress, existing)
    }
    
    // Step 6: Update wallets in database
    const walletsToUpdate = [...walletUpdates.keys()]
    
    const { data: existingWallets } = await supabase
      .from('tracked_wallets')
      .select('*')
      .in('address', walletsToUpdate)
    
    const existingMap = new Map((existingWallets || []).map(w => [w.address, w]))
    
    const upsertData = walletsToUpdate.map(address => {
      const newStats = walletUpdates.get(address)!
      const existing = existingMap.get(address)
      
      if (existing) {
        // Update existing wallet with accumulated real PnL
        const newTotalPnlUsd = (existing.total_pnl_usd || 0) + newStats.pnlUsd
        const newTotalPnlPercent = (existing.total_pnl || 0) + newStats.pnlPercent
        const newAppearances = (existing.appearances || 0) + newStats.tokens
        const newTotalTrades = (existing.total_trades || 0) + newStats.trades
        const newWinningTokens = (existing.winning_tokens || 0) + newStats.tokens
        
        return {
          address,
          total_pnl: Math.round(newTotalPnlPercent), // Total % across all tokens
          total_pnl_usd: Math.round(newTotalPnlUsd * 100) / 100, // Total USD profit
          pnl_percent: Math.round(newTotalPnlPercent / newAppearances), // Avg % per token
          appearances: newAppearances,
          total_trades: newTotalTrades,
          winning_tokens: newWinningTokens,
          avg_return: Math.round(newTotalPnlPercent / newWinningTokens),
          win_rate: Math.min(95, 50 + newWinningTokens * 5),
          tags: generateTags(newAppearances, newTotalPnlUsd, newTotalPnlPercent, newTotalTrades),
          last_trade_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      } else {
        // New wallet
        return {
          address,
          total_pnl: Math.round(newStats.pnlPercent),
          total_pnl_usd: Math.round(newStats.pnlUsd * 100) / 100,
          pnl_percent: newStats.tokens > 0 ? Math.round(newStats.pnlPercent / newStats.tokens) : 0,
          appearances: newStats.tokens,
          total_trades: newStats.trades,
          winning_tokens: newStats.tokens,
          avg_return: newStats.tokens > 0 ? Math.round(newStats.pnlPercent / newStats.tokens) : 0,
          win_rate: Math.min(95, 50 + newStats.tokens * 5),
          tags: generateTags(newStats.tokens, newStats.pnlUsd, newStats.pnlPercent, newStats.trades),
          last_trade_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    })
    
    const { error: upsertError } = await supabase
      .from('tracked_wallets')
      .upsert(upsertData, { onConflict: 'address' })
    
    if (upsertError) {
      console.error('Wallet upsert error:', upsertError)
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scan completed with Codex tokenTopTraders (real PnL data)',
      tokensScanned: tokens.length,
      newFindings: newTraders.length,
      walletsUpdated: upsertData.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ status: 'not_configured', message: 'Database not configured' })
    }
    
    const { data } = await supabase
      .from('tracked_wallets')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
    
    const { count: historyCount } = await supabase
      .from('wallet_token_history')
      .select('*', { count: 'exact', head: true })
    
    const { count: walletCount } = await supabase
      .from('tracked_wallets')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      status: 'ready',
      codexConfigured: !!CODEX_API_KEY,
      lastScan: data?.[0]?.updated_at || null,
      totalWallets: walletCount || 0,
      totalHistoryEntries: historyCount || 0
    })
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database error' })
  }
}
