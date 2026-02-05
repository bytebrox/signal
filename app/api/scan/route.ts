import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Codex, TokenRankingAttribute, RankingDirection } from '@codex-data/sdk'

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

// Helius
const HELIUS_API_KEY = process.env.HELIUS_API_KEY
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

interface TokenData {
  address: string
  symbol: string
  name: string
  priceChange24: number
  volume24: number
  liquidity: number
}

interface WalletTokenFind {
  walletAddress: string
  tokenAddress: string
  tokenSymbol: string
  pnl: number
  trades: number
}

// Fetch trending tokens from Codex (sorted by Volume24)
async function fetchTrendingTokens(limit: number = 30): Promise<TokenData[]> {
  const codex = getCodex()
  if (!codex) {
    console.error('Codex API key not configured')
    return []
  }

  try {
    console.log('Fetching tokens from Codex...')
    
    const response = await codex.queries.filterTokens({
      filters: {
        network: [SOLANA_NETWORK],
        liquidity: { gte: 5000 },
        volume24: { gte: 10000 },
      },
      rankings: [{ 
        attribute: TokenRankingAttribute.Volume24, 
        direction: RankingDirection.Desc 
      }],
      limit,
    })

    const tokens = response?.filterTokens?.results || []
    console.log(`Codex returned ${tokens.length} tokens`)

    return tokens.map((data: any) => {
      const token = data.token || data
      return {
        address: token.address || '',
        symbol: token.symbol || '???',
        name: token.name || 'Unknown',
        priceChange24: (data.change24 || 0) * 100,
        volume24: data.volume24 || 0,
        liquidity: data.liquidity || 0,
      }
    }).filter((t: TokenData) => t.address && t.address.length > 30)
  } catch (error) {
    console.error('Error fetching from Codex:', error)
    return []
  }
}

// Fetch token signatures from Helius
async function fetchTokenSignatures(tokenMint: string, limit = 100): Promise<string[]> {
  if (!HELIUS_API_KEY) return []
  
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [tokenMint, { limit }]
      })
    })
    
    const data = await response.json()
    return (data.result || []).map((sig: { signature: string }) => sig.signature)
  } catch (error) {
    console.error('Error fetching signatures:', error)
    return []
  }
}

// Parse transactions using Helius Enhanced API
async function parseTransactions(signatures: string[]): Promise<any[]> {
  if (!signatures.length || !HELIUS_API_KEY) return []
  
  try {
    const response = await fetch(`https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: signatures })
    })
    
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error parsing transactions:', error)
    return []
  }
}

// Extract traders from parsed transactions
function extractTraders(transactions: any[], tokenMint: string): Map<string, { buys: number; sells: number }> {
  const traders = new Map<string, { buys: number; sells: number }>()
  
  for (const tx of transactions) {
    if (!tx) continue
    
    const feePayer = tx.feePayer
    if (!feePayer || feePayer.length !== 44) continue
    
    const existing = traders.get(feePayer) || { buys: 0, sells: 0 }
    
    // Check swap events
    if (tx.type === 'SWAP' && tx.events?.swap) {
      const swapInfo = tx.events.swap
      const tokenIn = swapInfo.tokenInputs?.[0]?.mint
      const tokenOut = swapInfo.tokenOutputs?.[0]?.mint
      
      if (tokenOut === tokenMint) existing.buys++
      else if (tokenIn === tokenMint) existing.sells++
    }
    
    // Check token transfers
    if (tx.tokenTransfers) {
      for (const transfer of tx.tokenTransfers) {
        if (transfer.mint === tokenMint) {
          if (transfer.toUserAccount === feePayer) existing.buys++
          else if (transfer.fromUserAccount === feePayer) existing.sells++
        }
      }
    }
    
    if (existing.buys > 0 || existing.sells > 0) {
      traders.set(feePayer, existing)
    }
  }
  
  return traders
}

// Generate tags based on stats
function generateTags(appearances: number, totalPnl: number, totalTrades: number): string[] {
  const tags: string[] = []
  if (appearances >= 5) tags.push('Consistent')
  if (appearances >= 3) tags.push('Multi-Winner')
  if (totalPnl > 500) tags.push('High PnL')
  if (totalTrades > 30) tags.push('Active')
  if (appearances >= 2 && totalPnl > 200) tags.push('Smart Money')
  if (tags.length === 0) tags.push('Tracked')
  return tags
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
    }
    
    if (!CODEX_API_KEY) {
      return NextResponse.json({ success: false, error: 'Codex API key not configured' }, { status: 500 })
    }
    
    if (!HELIUS_API_KEY) {
      return NextResponse.json({ success: false, error: 'Helius API key not configured' }, { status: 500 })
    }
    
    console.log('Starting wallet scan with Codex + Helius...')
    
    // Step 1: Get trending tokens from Codex
    const tokens = await fetchTrendingTokens(30)
    console.log(`Found ${tokens.length} trending tokens from Codex`)
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No tokens found from Codex',
        walletsUpdated: 0 
      })
    }
    
    // Step 2: Collect wallet findings
    const findings: WalletTokenFind[] = []
    
    for (const token of tokens) {
      console.log(`Scanning ${token.symbol} (${token.address.slice(0, 8)}...)`)
      
      const signatures = await fetchTokenSignatures(token.address, 50)
      if (signatures.length === 0) continue
      
      const parsedTxs = await parseTransactions(signatures)
      const traders = extractTraders(parsedTxs, token.address)
      
      for (const [wallet, activity] of traders) {
        const estimatedPnl = activity.buys > 0 
          ? Math.floor(Math.abs(token.priceChange24) * (activity.buys / (activity.buys + activity.sells + 1)) * 0.8)
          : 0
        
        findings.push({
          walletAddress: wallet,
          tokenAddress: token.address,
          tokenSymbol: token.symbol,
          pnl: estimatedPnl,
          trades: activity.buys + activity.sells
        })
      }
      
      await new Promise(r => setTimeout(r, 150))
    }
    
    console.log(`Found ${findings.length} wallet+token combinations`)
    
    if (findings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No wallet findings',
        tokensScanned: tokens.length,
        walletsUpdated: 0
      })
    }
    
    // Step 3: Check for NEW findings
    const uniqueWallets = [...new Set(findings.map(f => f.walletAddress))]
    
    const { data: existingHistory } = await supabase
      .from('wallet_token_history')
      .select('wallet_address, token_address')
      .in('wallet_address', uniqueWallets)
    
    const historySet = new Set(
      (existingHistory || []).map(h => `${h.wallet_address}:${h.token_address}`)
    )
    
    const newFindings = findings.filter(f => 
      !historySet.has(`${f.walletAddress}:${f.tokenAddress}`)
    )
    
    console.log(`${newFindings.length} NEW findings (${findings.length - newFindings.length} already tracked)`)
    
    if (newFindings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new wallet+token combinations found',
        tokensScanned: tokens.length,
        newFindings: 0,
        walletsUpdated: 0
      })
    }
    
    // Step 4: Insert new findings into history
    const historyInserts = newFindings.map(f => ({
      wallet_address: f.walletAddress,
      token_address: f.tokenAddress,
      token_symbol: f.tokenSymbol,
      pnl_at_discovery: f.pnl,
      trades_at_discovery: f.trades,
      discovered_at: new Date().toISOString()
    }))
    
    await supabase.from('wallet_token_history').insert(historyInserts)
    
    // Step 5: Aggregate per wallet
    const walletUpdates = new Map<string, { pnl: number; trades: number; tokens: number }>()
    
    for (const finding of newFindings) {
      const existing = walletUpdates.get(finding.walletAddress) || { pnl: 0, trades: 0, tokens: 0 }
      existing.pnl += finding.pnl
      existing.trades += finding.trades
      existing.tokens += 1
      walletUpdates.set(finding.walletAddress, existing)
    }
    
    // Step 6: Update wallets
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
        const newTotalPnl = (existing.total_pnl || 0) + newStats.pnl
        const newAppearances = (existing.appearances || 1) + newStats.tokens
        const newTotalTrades = (existing.total_trades || 0) + newStats.trades
        const newWinningTokens = (existing.winning_tokens || 0) + newStats.tokens
        
        return {
          address,
          total_pnl: newTotalPnl,
          pnl_percent: Math.floor(newTotalPnl / newAppearances),
          appearances: newAppearances,
          total_trades: newTotalTrades,
          winning_tokens: newWinningTokens,
          avg_return: Math.floor(newTotalPnl / newWinningTokens),
          win_rate: Math.min(95, 50 + newWinningTokens * 5),
          tags: generateTags(newAppearances, newTotalPnl, newTotalTrades),
          last_trade_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      } else {
        return {
          address,
          total_pnl: newStats.pnl,
          pnl_percent: newStats.pnl,
          appearances: newStats.tokens,
          total_trades: newStats.trades,
          winning_tokens: newStats.tokens,
          avg_return: newStats.tokens > 0 ? Math.floor(newStats.pnl / newStats.tokens) : 0,
          win_rate: Math.min(95, 50 + newStats.tokens * 5),
          tags: generateTags(newStats.tokens, newStats.pnl, newStats.trades),
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
      message: 'Scan completed with Codex',
      tokensScanned: tokens.length,
      newFindings: newFindings.length,
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
    
    return NextResponse.json({
      status: 'ready',
      codexConfigured: !!CODEX_API_KEY,
      heliusConfigured: !!HELIUS_API_KEY,
      lastScan: data?.[0]?.updated_at || null,
      totalHistoryEntries: historyCount || 0
    })
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database error' })
  }
}
