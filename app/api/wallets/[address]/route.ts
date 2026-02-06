import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Codex } from '@codex-data/sdk'

const SOLANA_NETWORK = 1399811149

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function getCodex(): Codex | null {
  const key = process.env.CODEX_API_KEY
  if (!key) return null
  return new Codex(key)
}

interface ChartDataPoint {
  date: string
  realizedProfitUsd: number
  swaps: number
  volumeUsd: number
}

// Fetch PnL chart data from Codex
async function fetchWalletChart(
  codex: Codex, 
  walletAddress: string, 
  days: number = 30
): Promise<ChartDataPoint[]> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const start = now - (days * 24 * 60 * 60)
    
    const response = await codex.queries.walletChart({
      input: {
        resolution: '1D',
        walletAddress,
        networkId: SOLANA_NETWORK,
        range: {
          start,
          end: now
        }
      }
    })
    
    const data = response?.walletChart?.data || []
    
    // Transform data to our format with dates
    return data.map((point: any, index: number) => {
      const pointDate = new Date((start + (index * 24 * 60 * 60)) * 1000)
      return {
        date: pointDate.toISOString().split('T')[0],
        realizedProfitUsd: parseFloat(point.realizedProfitUsd || '0'),
        swaps: point.swaps || 0,
        volumeUsd: parseFloat(point.volumeUsd || '0')
      }
    })
  } catch (error) {
    console.error('Error fetching wallet chart:', error)
    return []
  }
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const supabase = getSupabase()
    const codex = getCodex()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { address } = params
    const { searchParams } = new URL(request.url)
    const includeChart = searchParams.get('chart') === 'true'
    const chartDays = parseInt(searchParams.get('days') || '30')
    
    if (!address || address.length < 32) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }
    
    // Fetch wallet data
    const { data: wallet, error: walletError } = await supabase
      .from('tracked_wallets')
      .select('*')
      .eq('address', address)
      .single()
    
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    
    // Fetch token history for this wallet
    const { data: history, error: historyError } = await supabase
      .from('wallet_token_history')
      .select('*')
      .eq('wallet_address', address)
      .order('discovered_at', { ascending: false })
    
    if (historyError) {
      console.error('History fetch error:', historyError)
    }
    
    // Optionally fetch chart data from Codex
    let chartData: ChartDataPoint[] = []
    if (includeChart && codex) {
      chartData = await fetchWalletChart(codex, address, chartDays)
    }
    
    return NextResponse.json({
      wallet,
      tokenHistory: history || [],
      totalTokens: (history && history.length > 0) ? history.length : (wallet.appearances || 0),
      chartData: includeChart ? chartData : undefined
    })
    
  } catch (error) {
    console.error('Wallet detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
