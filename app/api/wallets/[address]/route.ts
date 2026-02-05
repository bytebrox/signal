import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { address } = params
    
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
    
    return NextResponse.json({
      wallet,
      tokenHistory: history || [],
      totalTokens: history?.length || 0
    })
    
  } catch (error) {
    console.error('Wallet detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
