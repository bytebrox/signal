import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Codex, TokenRankingAttribute, RankingDirection } from '@codex-data/sdk'
import { config } from '@/lib/config'

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Codex SDK
const CODEX_API_KEY = process.env.CODEX_API_KEY
const SOLANA_NETWORK = config.solana.networkId

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

// Fetch trending tokens from Codex using trendingScore24
async function fetchTrendingTokens(limit: number = config.scanner.tokensToScan): Promise<TokenData[]> {
  const codex = getCodex()
  if (!codex) {
    console.error('Codex API key not configured')
    return []
  }

  const { trendingTokens: tokenConfig } = config

  try {
    console.log('Fetching trending tokens from Codex with trendingScore24...')
    
    const allTokens: TokenData[] = []
    const seenAddresses = new Set<string>()
    
    // Primary Strategy: Use trendingScore24 for best trending tokens
    try {
      const trendingResponse = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK],
          liquidity: { gte: tokenConfig.minLiquidity },
          volume24: { gte: tokenConfig.minVolume24h },
          marketCap: { gte: 50000 }, // Min $50k market cap
        },
        rankings: [{ 
          attribute: TokenRankingAttribute.TrendingScore24, 
          direction: RankingDirection.Desc 
        }],
        statsType: 'FILTERED' as any, // Remove MEV, show organic volume
        limit: Math.min(limit, 200),
      })
      
      const trending = trendingResponse?.filterTokens?.results || []
      console.log(`Trending tokens (trendingScore24): ${trending.length} tokens`)
      
      for (const data of trending) {
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
      console.error('Trending strategy error:', e)
    }
    
    // Fallback Strategy: Top gainers if trending didn't return enough
    if (allTokens.length < limit / 2) {
      try {
        const gainersResponse = await codex.queries.filterTokens({
          filters: {
            network: [SOLANA_NETWORK],
            liquidity: { gte: tokenConfig.minLiquidity / 2 },
            volume24: { gte: tokenConfig.minVolume24h / 2 },
            change24: { gte: 0.1 }, // At least 10% up
          },
          rankings: [{ 
            attribute: TokenRankingAttribute.Change24, 
            direction: RankingDirection.Desc 
          }],
          limit: 20,
        })
        
        const gainers = gainersResponse?.filterTokens?.results || []
        console.log(`Fallback (Gainers): ${gainers.length} tokens`)
        
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
        console.error('Fallback strategy error:', e)
      }
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

// Insider wallet data structure
interface InsiderWallet {
  walletAddress: string
  pnlUsd1w: number
  pnlPercent1w: number
  winRate: number
  swapCount1w: number
  volumeUsd1w: number
  uniqueTokens1w: number
  avgSwapAmount: number
  avgProfitPerTrade: number
  scammerScore: number
}

// Fetch insider wallets using filterWallets endpoint
async function fetchInsiderWallets(
  codex: Codex, 
  limit: number = config.scanner.tradersPerToken
): Promise<InsiderWallet[]> {
  const { walletFilters: wf } = config
  
  try {
    console.log('Fetching insider wallets with aggressive filters...')
    console.log(`  Min Profit: ${wf.minProfitPercent1w}% / $${wf.minProfitUsd1w}`)
    console.log(`  Min Win Rate: ${wf.minWinRate}%`)
    console.log(`  Swap Range: ${wf.minSwaps1w}-${wf.maxSwaps1w}`)
    
    // Use filterWallets with correct structure: filters go inside 'filters' object
    const response = await codex.queries.filterWallets({
      input: {
        filters: {
          // Network filter
          networkId: SOLANA_NETWORK,
          // Profitability filters (percentages as decimals, USD as numbers)
          realizedProfitPercentage1w: { gte: wf.minProfitPercent1w / 100 },
          realizedProfitUsd1w: { gte: wf.minProfitUsd1w },
          winRate1w: { gte: wf.minWinRate / 100 },
          // Activity filters
          swaps1w: { gte: wf.minSwaps1w, lte: wf.maxSwaps1w },
          uniqueTokens1w: { gte: wf.minUniqueTokens1w, lte: wf.maxUniqueTokens1w },
          volumeUsd1w: { gte: wf.minVolumeUsd1w },
          // Quality filters
          scammerScore: { lte: wf.maxScammerScore },
        },
        limit,
      }
    })
    
    const wallets = (response?.filterWallets?.results || []) as any[]
    console.log(`Found ${wallets.length} potential insider wallets`)
    
    const insiders: InsiderWallet[] = []
    
    for (const wallet of wallets) {
      if (!wallet || !wallet.address) continue
      
      // Extract values - SDK returns strings for USD amounts
      const pnlUsd = parseFloat(wallet.realizedProfitUsd1w || '0')
      const pnlPercent = (wallet.realizedProfitPercentage1w || 0) * 100
      const volume = parseFloat(wallet.volumeUsd1w || '0')
      const swaps = wallet.swaps1w || 0
      const avgSwap = swaps > 0 ? volume / swaps : 0
      
      // Additional filter: avg profit per trade
      const avgProfit = swaps > 0 ? pnlUsd / swaps : 0
      if (avgProfit < wf.minAvgProfitPerTrade) continue
      
      // Additional filter: avg swap size
      if (avgSwap < wf.minAvgSwapAmount) continue
      
      insiders.push({
        walletAddress: wallet.address,
        pnlUsd1w: pnlUsd,
        pnlPercent1w: pnlPercent,
        winRate: (wallet.winRate1w || 0) * 100,
        swapCount1w: swaps,
        volumeUsd1w: volume,
        uniqueTokens1w: wallet.uniqueTokens1w || 0,
        avgSwapAmount: avgSwap,
        avgProfitPerTrade: avgProfit,
        scammerScore: wallet.scammerScore || 0,
      })
    }
    
    console.log(`After additional filters: ${insiders.length} insider wallets`)
    return insiders
    
  } catch (error: any) {
    // Check if this is a premium feature error
    if (error?.message?.includes('upgrade') || error?.message?.includes('authorized')) {
      console.error('filterWallets requires premium plan. Falling back to token-based approach...')
      return []
    }
    console.error('Error fetching insider wallets:', error)
    return []
  }
}

// Fetch top traders for a specific token using filterTokenWallets
async function fetchTokenTraders(
  codex: Codex, 
  tokenAddress: string, 
  tokenSymbol: string,
  limit: number = config.scanner.tradersPerToken
): Promise<TopTraderData[]> {
  const { tokenWalletFilters: tf } = config
  
  // Calculate cutoff timestamp for last trade filter
  const maxAgeDays = tf.maxDaysSinceLastTrade || 7
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (maxAgeDays * 24 * 60 * 60)
  
  try {
    // Token ID format is "tokenAddress:networkId"
    const tokenId = `${tokenAddress}:${SOLANA_NETWORK}`
    
    // Use filterTokenWallets with correct structure
    const response = await codex.queries.filterTokenWallets({
      input: {
        tokenId,
        networkId: SOLANA_NETWORK,
        filtersV2: {
          buys30d: { gte: tf.minBuys30d },
          sells30d: { gte: tf.minSells30d },
          realizedProfitUsd30d: { gte: tf.minRealizedProfitUsd },
          amountBoughtUsd30d: { gte: tf.minBuyAmountUsd, lte: tf.maxBuyAmountUsd },
          // Filter for recent activity
          lastTransactionAt: { gte: cutoffTimestamp },
        },
        limit,
      }
    })
    
    const wallets = (response?.filterTokenWallets?.results || []) as any[]
    const traders: TopTraderData[] = []
    
    // Debug: log available fields from first wallet to verify lastTransactionAt
    if (wallets.length > 0 && wallets[0]) {
      console.log(`  [DEBUG] Wallet response fields: ${Object.keys(wallets[0]).join(', ')}`)
      console.log(`  [DEBUG] lastTransactionAt value: ${wallets[0].lastTransactionAt}`)
    }
    
    for (const wallet of wallets) {
      if (!wallet || !wallet.address) continue
      
      // Double-check last trade time (in case API filter didn't work)
      const lastTradeAt = wallet.lastTransactionAt || 0
      if (lastTradeAt < cutoffTimestamp) {
        console.log(`  Skipping ${wallet.address.slice(0, 8)}... - last trade too old`)
        continue
      }
      
      const profitUsd = parseFloat(wallet.realizedProfitUsd30d || '0')
      const buyAmount = parseFloat(wallet.amountBoughtUsd30d || '0')
      
      // Skip wallets with no real buy amount (likely received tokens via transfer)
      if (buyAmount < tf.minBuyAmountUsd) {
        console.log(`  Skipping ${wallet.address.slice(0, 8)}... - buy amount too low ($${buyAmount.toFixed(0)})`)
        continue
      }
      
      const profitPercent = (profitUsd / buyAmount) * 100
      
      // Skip wallets with profit % below minimum threshold
      if (profitPercent < (tf.minProfitPercent || 0)) {
        console.log(`  Skipping ${wallet.address.slice(0, 8)}... - profit too low (${profitPercent.toFixed(0)}%)`)
        continue
      }
      
      traders.push({
        walletAddress: wallet.address,
        tokenAddress,
        tokenSymbol,
        realizedProfitUsd: profitUsd,
        realizedProfitPercent: profitPercent,
        volumeUsd: parseFloat(wallet.amountBoughtUsd30d || '0') + parseFloat(wallet.amountSoldUsd30d || '0'),
        buys: wallet.buys30d || 0,
        sells: wallet.sells30d || 0,
        tokenBalance: wallet.tokenBalance || '0',
        lastTradeAt: lastTradeAt
      })
    }
    
    return traders
  } catch (error: any) {
    // Check if this is a premium feature error
    if (error?.message?.includes('upgrade') || error?.message?.includes('authorized')) {
      console.error(`filterTokenWallets requires premium plan for ${tokenSymbol}`)
      return []
    }
    console.error(`Error fetching traders for ${tokenSymbol}:`, error)
    return []
  }
}

// Generate tags based on stats using config thresholds
function generateTags(appearances: number, totalPnlUsd: number, totalPnlPercent: number, totalTrades: number): string[] {
  const { tags: tagConfig } = config
  const tags: string[] = []
  
  // Consistent trader
  if (appearances >= tagConfig.consistent.minAppearances) {
    tags.push('Consistent')
  }
  if (appearances >= 3) {
    tags.push('Multi-Winner')
  }
  
  // Whale
  if (totalPnlUsd > tagConfig.whale.minVolumeUsd) {
    tags.push('Whale')
  } else if (totalPnlUsd > 10000) {
    tags.push('High PnL')
  }
  
  // Smart Money
  if (totalPnlPercent > tagConfig.smartMoney.minProfitPercent && 
      totalTrades >= tagConfig.smartMoney.minTrades) {
    tags.push('Smart Money')
  }
  
  // 10x Hunter (for really high profit percentages)
  if (totalPnlPercent > 1000) {
    tags.push('10x Hunter')
  }
  
  // Active trader
  if (totalTrades > 30) {
    tags.push('Active')
  }
  
  // Insider tag for exceptional performance
  if (totalPnlPercent > config.walletFilters.minProfitPercent1w && 
      totalPnlUsd > config.walletFilters.minProfitUsd1w) {
    tags.push('Insider')
  }
  
  if (tags.length === 0) tags.push('Tracked')
  return tags
}

export async function POST(request: Request) {
  try {
    // API Key authentication (required)
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.SCAN_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured - SCAN_API_KEY not set' },
        { status: 500 }
      )
    }
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const supabase = getSupabase()
    const codex = getCodex()
    
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
    }
    
    if (!codex) {
      return NextResponse.json({ success: false, error: 'Codex API key not configured' }, { status: 500 })
    }
    
    console.log('Starting insider wallet scan...')
    console.log('Token filters:', JSON.stringify(config.trendingTokens, null, 2))
    console.log('Wallet filters:', JSON.stringify(config.tokenWalletFilters, null, 2))
    
    // Step 1: Get trending tokens from Codex using trendingScore24
    const tokens = await fetchTrendingTokens()
    console.log(`Found ${tokens.length} trending tokens from Codex`)
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No trending tokens found',
        walletsUpdated: 0 
      })
    }
    
    // Step 2: Get top traders for each token using filterTokenWallets
    const allTraders: TopTraderData[] = []
    
    for (const token of tokens) {
      console.log(`Fetching traders for ${token.symbol} (${token.address.slice(0, 8)}...)`)
      
      const traders = await fetchTokenTraders(codex, token.address, token.symbol, config.scanner.tradersPerToken)
      allTraders.push(...traders)
      
      console.log(`  Found ${traders.length} profitable traders`)
      
      // Delay to avoid rate limits
      await new Promise(r => setTimeout(r, config.scanner.apiDelayMs))
    }
    
    console.log(`Found ${allTraders.length} profitable traders total from ${tokens.length} tokens`)
    
    if (allTraders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profitable traders found in trending tokens',
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
        tradersFound: allTraders.length,
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
      lastTradeAt: number  // Real last trade timestamp from Codex API
    }>()
    
    for (const trader of newTraders) {
      const existing = walletUpdates.get(trader.walletAddress) || { 
        pnlUsd: 0, pnlPercent: 0, trades: 0, tokens: 0, volumeUsd: 0, lastTradeAt: 0 
      }
      existing.pnlUsd += trader.realizedProfitUsd
      existing.pnlPercent += trader.realizedProfitPercent
      existing.trades += trader.buys + trader.sells
      existing.tokens += 1
      existing.volumeUsd += trader.volumeUsd
      // Keep the most recent trade timestamp across all tokens
      if (trader.lastTradeAt > existing.lastTradeAt) {
        existing.lastTradeAt = trader.lastTradeAt
      }
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
          // Use the most recent real trade timestamp: either the new one from Codex or the existing one
          last_trade_at: newStats.lastTradeAt
            ? new Date(Math.max(newStats.lastTradeAt * 1000, new Date(existing.last_trade_at || 0).getTime())).toISOString()
            : existing.last_trade_at || new Date().toISOString(),
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
          // Use real trade timestamp from Codex API
          last_trade_at: newStats.lastTradeAt
            ? new Date(newStats.lastTradeAt * 1000).toISOString()
            : new Date().toISOString(),
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
      message: 'Scan completed successfully',
      tokensScanned: tokens.length,
      tradersFound: allTraders.length,
      newFindings: newTraders.length,
      walletsUpdated: upsertData.length,
      configUsed: {
        minRealizedProfit: config.tokenWalletFilters.minRealizedProfitUsd,
        minLiquidity: config.trendingTokens.minLiquidity,
        minVolume: config.trendingTokens.minVolume24h,
      },
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
