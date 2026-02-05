import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    return null
  }
  
  return createClient(url, key)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ 
        wallets: [], 
        total: 0, 
        error: 'Database not configured' 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'total_pnl'
    const timeRange = searchParams.get('range') || 'all' // 24h, 7d, 30d, all
    const filterType = searchParams.get('filterType') || 'discovered' // discovered, activity
    
    // Calculate date threshold
    let dateThreshold: Date | null = null
    const now = new Date()
    
    switch (timeRange) {
      case '24h':
        dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    
    // Build query
    let query = supabase
      .from('tracked_wallets')
      .select('*', { count: 'exact' })
    
    // Apply date filter
    if (dateThreshold) {
      const dateColumn = filterType === 'activity' ? 'last_trade_at' : 'created_at'
      query = query.gte(dateColumn, dateThreshold.toISOString())
    }
    
    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json({ wallets: [], error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      wallets: data || [],
      total: count || 0,
      limit,
      offset,
      timeRange,
      filterType
    })
  } catch (error) {
    return NextResponse.json(
      { wallets: [], error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}
